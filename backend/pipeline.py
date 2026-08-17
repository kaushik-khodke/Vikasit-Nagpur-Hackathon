"""
TigerTrace End-to-End Ingestion, Triage, and Re-ID Pipeline Worker.
Orchestrates raw camera-trap ingestion, CLAHE enhancement, MegaDetector v6 blank triage,
MegaDescriptor 512-D Re-ID embedding extraction, and PostgreSQL/PostGIS/pgvector synchronization.
"""

import argparse
import logging
import os
import shutil
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import cv2
import numpy as np
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
from rich.table import Table

from config import settings
from dataset_loader import ATRWDatasetLoader
from db_manager import DatabaseManager
from detector import MegaDetectorV6
from identity_service import IdentityService
from preprocessor import ImagePreprocessor
from reid_extractor import ReIDFeatureExtractor

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("TigerTrace.Pipeline")
console = Console()


class TigerTracePipeline:
    """Master workflow orchestrator for camera-trap ingestion and Re-ID processing."""

    def __init__(self, db_manager: Optional[DatabaseManager] = None):
        self.db = db_manager or DatabaseManager()
        self.preprocessor = ImagePreprocessor()
        self.detector = MegaDetectorV6()
        self.reid_extractor = ReIDFeatureExtractor()
        self.identity_service = IdentityService(self.db)

    def process_image(
        self,
        image_path: Path,
        camera_station_id: uuid.UUID,
        import_run_id: uuid.UUID,
    ) -> Dict[str, Any]:
        """
        Process a single image file through the end-to-end pipeline.
        Returns processing metrics and decision outcomes.
        """
        # Step 1: Content Hash & Deduplication
        sha256_hash = self.db.calculate_file_sha256(image_path)
        existing_image = self.db.find_image_by_sha256(sha256_hash)
        if existing_image:
            logger.info(f"Skipping duplicate image {image_path.name} (SHA-256: {sha256_hash[:8]}...)")
            return {"status": "DUPLICATE", "is_blank": False, "is_tiger": False, "alerts": 0}

        # Step 2: Metadata Extraction
        meta = self.preprocessor.extract_metadata(image_path)
        captured_at = meta["timestamp"] or datetime.now(timezone.utc)
        file_size = meta["file_size_bytes"]

        # Step 3: Load and CLAHE Enhance Image
        img_bgr = cv2.imread(str(image_path))
        if img_bgr is None:
            logger.warning(f"Corrupt or unreadable image file: {image_path}")
            return {"status": "CORRUPT", "is_blank": False, "is_tiger": False, "alerts": 0}

        # Evaluate light conditions and apply CLAHE if beneficial
        light_report = self.preprocessor.assess_lighting_condition(img_bgr)
        processed_bgr = self.preprocessor.enhance_clahe(img_bgr) if light_report["recommended_enhancement"] else img_bgr

        # Step 4: MegaDetector v6 Blank Triage & Localization
        det_result = self.detector.detect(processed_bgr, return_crops=True)
        is_blank = det_result["is_blank"]

        # Case A: False Trigger / Blank Image -> Safe Quarantine
        if is_blank:
            quarantine_dest = settings.QUARANTINE_DIR / f"quarantine_{image_path.name}"
            shutil.copy2(image_path, quarantine_dest)

            self.db.persist_image(
                camera_station_id=camera_station_id,
                import_run_id=import_run_id,
                file_path=str(image_path),
                original_filename=image_path.name,
                sha256_hash=sha256_hash,
                size_bytes=file_size,
                captured_at=captured_at,
                status="QUARANTINED",
                classification="BLANK",
                classification_confidence=1.0 - det_result["max_confidence"],
                quarantine_path=str(quarantine_dest),
                is_quarantined=True,
                raw_metadata={"lighting": light_report},
            )
            return {
                "status": "QUARANTINED_BLANK",
                "is_blank": True,
                "is_tiger": False,
                "saved_bytes": file_size,
                "alerts": 0,
            }

        # Case B: Tiger / Wildlife Subject Detected
        image_record = self.db.persist_image(
            camera_station_id=camera_station_id,
            import_run_id=import_run_id,
            file_path=str(image_path),
            original_filename=image_path.name,
            sha256_hash=sha256_hash,
            size_bytes=file_size,
            captured_at=captured_at,
            status="PROCESSED",
            classification="TIGER",
            classification_confidence=det_result["max_confidence"],
            is_quarantined=False,
            raw_metadata={"lighting": light_report},
        )

        total_alerts = 0
        new_tiger_count = 0

        # Step 5: Process Detections and Extract Flank Re-ID Embeddings
        for i, (det, crop) in enumerate(zip(det_result["detections"], det_result["crops"])):
            # Persist detection bounding box
            det_record = self.db.persist_detection(
                image_id=image_record.id,
                class_name=det["class_name"],
                confidence=det["confidence"],
                bbox=det["bbox"],
            )

            if crop is not None and crop.size > 0:
                # Save flank crop to disk
                crop_filename = f"crop_{image_record.id}_{i}.jpg"
                crop_path = settings.CROPS_DIR / crop_filename
                cv2.imwrite(str(crop_path), crop)

                # Determine flank orientation side
                side, side_conf = self.reid_extractor.estimate_flank_side(crop)

                # Save flank crop DB record
                flank_record = self.db.persist_flank_crop(
                    detection_id=det_record.id,
                    crop_path=str(crop_path),
                    side=side,
                    quality_score=det["confidence"],
                    extraction_confidence=side_conf,
                )

                # Step 6: 512-D MegaDescriptor Metric Re-ID Embedding
                embedding_512 = self.reid_extractor.extract_embedding(crop)

                # Step 7: Identity Decision Engine (AUTO_MATCH / REVIEW / NEW)
                decision = self.identity_service.evaluate_identity(
                    query_embedding=embedding_512,
                    flank_crop_id=flank_record.id,
                    flank_side=side,
                    crop_quality=det["confidence"],
                    representative_image_id=image_record.id,
                )

                if decision.is_new_tiger:
                    new_tiger_count += 1

                # Step 8: Persist Confirmed Observation
                obs = self.db.persist_observation(
                    tiger_id=decision.tiger_id,
                    image_id=image_record.id,
                    camera_station_id=camera_station_id,
                    flank_crop_id=flank_record.id,
                    observed_at=captured_at,
                    identity_confidence=decision.similarity_score,
                    identity_method="REID",
                    verification_status=decision.verification_status,
                    source_run_id=import_run_id,
                )

                # Step 9: Save Annotated Proof Evidence Image for Evaluators
                evidence_img = processed_bgr.copy()
                bx1, by1 = det["bbox"]["x1"], det["bbox"]["y1"]
                bx2, by2 = det["bbox"]["x2"], det["bbox"]["y2"]
                cv2.rectangle(evidence_img, (bx1, by1), (bx2, by2), (0, 205, 50), 2)
                cv2.putText(
                    evidence_img,
                    f"{decision.tiger_code} ({decision.similarity_score:.0%})",
                    (bx1, max(15, by1 - 10)),
                    cv2.FONT_HERSHEY_DUPLEX,
                    0.6,
                    (0, 205, 50),
                    2,
                )
                evidence_path = settings.EVIDENCE_RECORDINGS_DIR / f"evidence_{decision.tiger_code}_{image_path.stem}.jpg"
                cv2.imwrite(str(evidence_path), evidence_img)

                # Step 10: Movement Deviation & Reserve Zone Intelligence
                alerts = self.db.evaluate_movement_alerts(
                    tiger_id=decision.tiger_id,
                    observation_id=obs.id,
                    camera_station_id=camera_station_id,
                    observed_at=captured_at,
                )
                total_alerts += len(alerts)

        return {
            "status": "PROCESSED_TIGER",
            "is_blank": False,
            "is_tiger": True,
            "saved_bytes": 0,
            "new_tigers": new_tiger_count,
            "alerts": total_alerts,
        }

    def process_source(
        self,
        source_path: Union[str, Path],
        camera_code: str = "CAM-01",
        mode: str = "FIELD",
    ) -> Dict[str, Any]:
        """Execute full batch ingestion across a folder of images or video sequences."""
        spath = Path(source_path)
        start_time = time.time()

        # Step 0: Ensure Camera Station Exists
        station = self.db.get_or_create_camera_station(code=camera_code)

        # Register Ingestion Run in PostgreSQL
        run_id = self.db.create_import_run(
            mode=mode,
            source_path=str(spath),
            config_snapshot={
                "camera_code": camera_code,
                "auto_match_threshold": settings.AUTO_MATCH_THRESHOLD,
                "blank_threshold": settings.BLANK_THRESHOLD,
            },
        )

        console.print(Panel(
            f"[bold green]Starting TigerTrace Processing Run[/bold green]\n"
            f"Run ID: [cyan]{run_id}[/cyan] | Camera: [yellow]{camera_code}[/yellow] | Mode: [magenta]{mode}[/magenta]\n"
            f"Source: [white]{spath}[/white]",
            title="TigerTrace Ingestion Pipeline",
            border_style="green",
        ))

        # Collect image files and video files
        valid_img_exts = {".jpg", ".jpeg", ".png", ".bmp"}
        valid_vid_exts = {".mp4", ".avi", ".mov", ".webm", ".mkv"}
        image_files = []

        if spath.is_file():
            if spath.suffix.lower() in valid_img_exts:
                image_files = [spath]
            elif spath.suffix.lower() in valid_vid_exts:
                console.print(f"[cyan]Subsampling video frames from [bold]{spath.name}[/bold]...[/cyan]")
                vid_frames_dir = settings.DATA_DIR / "temp_video_frames" / spath.stem
                vid_frames_dir.mkdir(parents=True, exist_ok=True)
                for f_idx, f_time, f_bgr in self.preprocessor.subsample_video(spath, target_fps=settings.VIDEO_SUBSAMPLE_FPS):
                    frame_path = vid_frames_dir / f"frame_{f_idx:05d}.jpg"
                    cv2.imwrite(str(frame_path), f_bgr)
                    image_files.append(frame_path)
        elif spath.is_dir():
            image_files = [p for p in spath.rglob("*") if p.suffix.lower() in valid_img_exts]
            # Check for any video files in folder
            video_files = [p for p in spath.glob("*") if p.suffix.lower() in valid_vid_exts]
            for vfile in video_files:
                console.print(f"[cyan]Subsampling video frames from [bold]{vfile.name}[/bold]...[/cyan]")
                vid_frames_dir = settings.DATA_DIR / "temp_video_frames" / vfile.stem
                vid_frames_dir.mkdir(parents=True, exist_ok=True)
                for f_idx, f_time, f_bgr in self.preprocessor.subsample_video(vfile, target_fps=settings.VIDEO_SUBSAMPLE_FPS):
                    frame_path = vid_frames_dir / f"frame_{f_idx:05d}.jpg"
                    cv2.imwrite(str(frame_path), f_bgr)
                    image_files.append(frame_path)

        stats = {
            "total_files": len(image_files),
            "valid_files": 0,
            "corrupt_files": 0,
            "blank_files": 0,
            "useful_files": 0,
            "tiger_detections": 0,
            "new_tigers": 0,
            "alerts_created": 0,
            "storage_saved_bytes": 0,
        }

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeElapsedColumn(),
            console=console,
        ) as progress:
            task = progress.add_task("[cyan]Processing frames...", total=max(1, len(image_files)))

            for img_file in image_files:
                try:
                    res = self.process_image(img_file, station.id, run_id)
                    if res["status"] == "CORRUPT":
                        stats["corrupt_files"] += 1
                    else:
                        stats["valid_files"] += 1

                    if res.get("is_blank", False):
                        stats["blank_files"] += 1
                        stats["storage_saved_bytes"] += res.get("saved_bytes", 0)
                    elif res.get("is_tiger", False):
                        stats["useful_files"] += 1
                        stats["tiger_detections"] += 1
                        stats["new_tigers"] += res.get("new_tigers", 0)
                        stats["alerts_created"] += res.get("alerts", 0)

                except Exception as err:
                    logger.error(f"Error processing {img_file.name}: {err}", exc_info=True)
                    stats["corrupt_files"] += 1

                progress.update(task, advance=1)

        elapsed_sec = round(time.time() - start_time, 2)

        # Finalize DB Import Run Record
        self.db.finish_import_run(
            run_id=run_id,
            total_files=stats["total_files"],
            valid_files=stats["valid_files"],
            corrupt_files=stats["corrupt_files"],
            blank_files=stats["blank_files"],
            useful_files=stats["useful_files"],
            tiger_detections=stats["tiger_detections"],
            new_tigers=stats["new_tigers"],
            alerts_created=stats["alerts_created"],
            storage_saved_bytes=stats["storage_saved_bytes"],
            processing_seconds=elapsed_sec,
            status="SUCCEEDED",
        )

        # Display Rich Summary Dashboard
        table = Table(title=f"Run Summary: {camera_code}", border_style="cyan")
        table.add_column("Metric", style="bold white")
        table.add_column("Value", style="bold yellow")

        table.add_row("Total Ingested Images", str(stats["total_files"]))
        table.add_row("Valid Frames Processed", str(stats["valid_files"]))
        table.add_row("Quarantined Blank Frames", str(stats["blank_files"]))
        table.add_row("Tiger Observations Recorded", str(stats["tiger_detections"]))
        table.add_row("New Individuals Catalogued", str(stats["new_tigers"]))
        table.add_row("Movement Deviation Alerts", str(stats["alerts_created"]))
        table.add_row("Storage Space Saved", f"{stats['storage_saved_bytes'] / (1024*1024):.2f} MB")
        table.add_row("Total Processing Time", f"{elapsed_sec} seconds")

        console.print(table)
        return stats


def main():
    parser = argparse.ArgumentParser(description="TigerTrace Automated CV & Re-ID Processing Pipeline")
    parser.add_argument("--source", type=str, default="./data/input_stream", help="Directory or file path to process")
    parser.add_argument("--camera", type=str, default="CAM-01", help="Camera Station Code (e.g. CAM-01, CAM-03)")
    parser.add_argument("--mode", type=str, default="FIELD", choices=["FIELD", "SIMULATION", "BENCHMARK"])
    parser.add_argument("--generate-samples", action="store_true", help="Generate synthetic test images before run")
    args = parser.parse_args()

    if args.generate_samples:
        loader = ATRWDatasetLoader()
        loader.generate_synthetic_benchmark_dataset()
        # Also copy sample images to input_stream
        for sample in (settings.ATRW_DIR / "detection" / "JPEGImages").glob("*.jpg"):
            shutil.copy(sample, settings.INPUT_STREAM_DIR / sample.name)

    pipeline = TigerTracePipeline()
    pipeline.process_source(source_path=args.source, camera_code=args.camera, mode=args.mode)


if __name__ == "__main__":
    main()
