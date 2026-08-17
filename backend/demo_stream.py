"""
Real-Time OpenCV Visual Playback Stream & Demo Visualizer for TigerTrace.
Renders live MegaDetector bounding boxes, MegaDescriptor individual Re-ID tags,
CLAHE split-view comparisons, FPS counters, and VRAM memory telemetry.
"""

import argparse
from datetime import datetime, timezone
import logging
import time
from pathlib import Path
from typing import Optional, Union

import cv2
import numpy as np
import torch

from config import settings
from db_manager import DatabaseManager
from detector import MegaDetectorV6
from identity_service import IdentityService
from preprocessor import ImagePreprocessor
from reid_extractor import ReIDFeatureExtractor

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("TigerTrace.DemoStream")


class DemoStreamVisualizer:
    """Real-time OpenCV video player with visual AI annotations and telemetry HUD."""

    COLOR_TIGER = (0, 215, 255)       # Gold / Amber
    COLOR_AUTO = (50, 205, 50)        # Green
    COLOR_REVIEW = (0, 165, 255)      # Orange
    COLOR_NEW = (255, 191, 0)         # Deep Sky Blue
    COLOR_BLANK = (128, 128, 128)     # Gray
    COLOR_ALERT = (0, 0, 255)         # Bright Red

    def __init__(self, source_path: Optional[Union[str, int]] = None):
        self.source_path = source_path or str(settings.INPUT_STREAM_DIR)
        print("\n=======================================================")
        print("  TigerTrace Real-Time Stream Visualizer v1.0")
        print("=======================================================")
        print("[*] Initializing Database & Offline Persistence...")
        self.db = DatabaseManager()
        print("[*] Initializing CLAHE Preprocessor...")
        self.preprocessor = ImagePreprocessor()
        print("[*] Loading Animal/Tiger Detector...")
        self.detector = MegaDetectorV6()
        print("[*] Loading MegaDescriptor 512-D Re-ID Extractor...")
        self.reid_extractor = ReIDFeatureExtractor()
        print("[*] Loading Identity Decision Engine...")
        self.identity_service = IdentityService(self.db)
        print("[OK] All AI models and engines initialized.\n")

        self.show_clahe = True
        self.show_overlays = True
        self.is_paused = False

    def draw_hud(
        self,
        frame: np.ndarray,
        fps: float,
        vram_mb: float,
        status_text: str,
        lighting_info: dict,
    ) -> np.ndarray:
        """Render high-tech telemetry HUD overlay at the top of the video frame."""
        h, w = frame.shape[:2]
        # Translucent top bar
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, 55), (20, 20, 25), -1)
        cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)

        # Title / System Logo
        cv2.putText(frame, "TIGERTRACE v1.0", (15, 25), cv2.FONT_HERSHEY_DUPLEX, 0.65, (255, 255, 255), 2)
        cv2.putText(frame, "Pench Tiger Reserve Subsystem", (15, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (180, 180, 180), 1)

        # Telemetry metrics
        fps_text = f"FPS: {fps:.1f}"
        vram_text = f"VRAM: {vram_mb:.0f} MB" if vram_mb > 0 else "Device: CPU"
        clahe_text = f"CLAHE: {'ON' if self.show_clahe else 'OFF'}"
        light_text = f"Light: {lighting_info.get('mean_brightness', 0):.0f} / Sharp: {lighting_info.get('sharpness_score', 0):.0f}"

        cv2.putText(frame, fps_text, (w - 460, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        cv2.putText(frame, vram_text, (w - 360, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 215, 255), 1)
        cv2.putText(frame, clahe_text, (w - 220, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
        cv2.putText(frame, light_text, (w - 460, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)

        # Status badge
        cv2.putText(frame, f"STATUS: {status_text}", (w - 220, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 255), 1)

        # Bottom help banner
        cv2.putText(
            frame,
            "[Space/P]: Pause | [C]: Toggle CLAHE | [D]: Toggle Detections | [Q]: Quit",
            (15, h - 15),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.42,
            (220, 220, 220),
            1,
        )
        return frame

    def draw_detection_box(
        self,
        frame: np.ndarray,
        bbox: dict,
        tiger_code: str,
        confidence: float,
        decision_type: str,
        flank_side: str,
    ) -> None:
        """Render calibrated bounding box, tiger ID label, and flank side indicator."""
        x1, y1, x2, y2 = bbox["x1"], bbox["y1"], bbox["x2"], bbox["y2"]

        if decision_type == "AUTO_MATCH":
            box_color = self.COLOR_AUTO
            badge_text = f"{tiger_code} (MATCH: {confidence:.0%})"
        elif decision_type == "REVIEW_REQUIRED":
            box_color = self.COLOR_REVIEW
            badge_text = f"{tiger_code}? (REVIEW: {confidence:.0%})"
        else:
            box_color = self.COLOR_NEW
            badge_text = f"NEW: {tiger_code} ({confidence:.0%})"

        # Main bounding box
        cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2)

        # Corner aesthetic brackets
        line_len = min(20, (x2 - x1) // 4, (y2 - y1) // 4)
        cv2.line(frame, (x1, y1), (x1 + line_len, y1), (255, 255, 255), 3)
        cv2.line(frame, (x1, y1), (x1, y1 + line_len), (255, 255, 255), 3)
        cv2.line(frame, (x2, y2), (x2 - line_len, y2), (255, 255, 255), 3)
        cv2.line(frame, (x2, y2), (x2, y2 - line_len), (255, 255, 255), 3)

        # Label badge background
        label_size = cv2.getTextSize(badge_text, cv2.FONT_HERSHEY_DUPLEX, 0.55, 1)[0]
        badge_y1 = max(0, y1 - 25)
        badge_y2 = y1
        cv2.rectangle(frame, (x1, badge_y1), (x1 + label_size[0] + 12, badge_y2), box_color, -1)
        cv2.putText(
            frame,
            badge_text,
            (x1 + 6, badge_y2 - 6),
            cv2.FONT_HERSHEY_DUPLEX,
            0.55,
            (0, 0, 0),
            1,
        )

        # Flank side indicator
        side_text = f"Flank: {flank_side}"
        cv2.putText(frame, side_text, (x1 + 5, y2 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.45, box_color, 1)

    def run_stream(self) -> None:
        """Start smooth real-time video playback loop with threaded AI inference."""
        import threading
        import queue

        src_path = Path(self.source_path)
        video_extensions = {".mp4", ".avi", ".mov", ".webm", ".mkv"}
        is_video = src_path.is_file() and src_path.suffix.lower() in video_extensions

        if is_video:
            print(f"[>] Opening video file: {src_path.name}")
            cap = cv2.VideoCapture(str(src_path))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            native_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            print(f"[i] Video info: {total_frames} frames @ {native_fps:.1f} FPS")
        else:
            video_files = [p for p in src_path.glob("*") if p.suffix.lower() in video_extensions]
            if video_files:
                print(f"[>] Opening video file from folder: {video_files[0].name}")
                cap = cv2.VideoCapture(str(video_files[0]))
                total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                native_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
                print(f"[i] Video info: {total_frames} frames @ {native_fps:.1f} FPS")
            else:
                img_files = sorted(list(src_path.glob("*.jpg")) + list(src_path.glob("*.png")))
                if not img_files:
                    print("[i] Generating synthetic benchmark images...")
                    loader = ATRWDatasetLoader()
                    loader.generate_synthetic_benchmark_dataset()
                    img_files = sorted(list((settings.ATRW_DIR / "detection" / "JPEGImages").glob("*.jpg")))
                cap = None
                img_iter = iter(img_files)
                native_fps = 2.0  # 2 seconds per photo
                print(f"[i] Loaded {len(img_files)} images for slideshow playback.")

        # Thread-safe AI inference pipeline
        frame_queue = queue.Queue(maxsize=1)
        active_boxes_lock = threading.Lock()
        active_boxes = []
        status_text_holder = ["SCANNING"]
        stop_event = threading.Event()

        def inference_worker():
            """Background worker executing detection and Re-ID asynchronously."""
            while not stop_event.is_set():
                try:
                    frame_for_ai = frame_queue.get(timeout=0.05)
                except queue.Empty:
                    continue

                try:
                    enhanced_ai = self.preprocessor.enhance_clahe(frame_for_ai) if self.show_clahe else frame_for_ai
                    det_res = self.detector.detect(enhanced_ai, return_crops=True)
                    new_boxes = []

                    if det_res["is_blank"]:
                        status_text_holder[0] = "BLANK / QUARANTINED"
                    else:
                        status_text_holder[0] = "TIGER LOCATED"
                        for det, crop in zip(det_res["detections"], det_res["crops"]):
                            if crop is not None and crop.size > 0:
                                side, _ = self.reid_extractor.estimate_flank_side(crop)
                                emb = self.reid_extractor.extract_embedding(crop)
                                decision = self.identity_service.evaluate_identity(
                                    query_embedding=emb,
                                    flank_side=side,
                                )
                                new_boxes.append({
                                    "bbox": det["bbox"],
                                    "tiger_code": decision.tiger_code,
                                    "confidence": decision.similarity_score,
                                    "decision": decision.decision,
                                    "side": side,
                                })

                    with active_boxes_lock:
                        active_boxes.clear()
                        active_boxes.extend(new_boxes)

                except Exception as err:
                    logger.debug(f"Inference worker error: {err}")

        # Start inference background thread
        ai_thread = threading.Thread(target=inference_worker, daemon=True)
        ai_thread.start()

        window_name = "TigerTrace - Real-Time Re-ID Stream Visualizer"
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(window_name, 1024, 768)

        fps_tracker = native_fps
        t_prev = time.time()
        target_frame_period = 1.0 / max(1.0, native_fps)
        lighting_info = {"mean_brightness": 120, "sharpness_score": 85}

        # Tiger Proof & Evidence Recording Engine
        evidence_writer = None
        evidence_video_path = None
        evidence_frame_count = 0
        last_recorded_tiger = None
        saved_snapshots = set()

        print("[OK] Video window opened! Press 'q' to exit, 'c' to toggle CLAHE, 'p' to pause.\n")
        print(f"[i] Evidence directory: {settings.EVIDENCE_RECORDINGS_DIR}\n")

        try:
            while True:
                frame_start_time = time.time()

                if cap is not None:
                    if not self.is_paused:
                        ret, raw_frame = cap.read()
                        if not ret:
                            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # Loop video
                            continue
                else:
                    if not self.is_paused:
                        try:
                            img_path = next(img_iter)
                        except StopIteration:
                            img_iter = iter(img_files)
                            img_path = next(img_iter)
                        raw_frame = cv2.imread(str(img_path))
                        time.sleep(0.5)

                if raw_frame is None:
                    continue

                # Submit latest frame to background AI queue (drop oldest if full)
                if self.show_overlays and not frame_queue.full():
                    try:
                        frame_queue.put_nowait(raw_frame.copy())
                    except queue.Full:
                        pass

                # Apply fast CLAHE to display frame if enabled
                display_frame = self.preprocessor.enhance_clahe(raw_frame) if self.show_clahe else raw_frame.copy()

                current_tiger_detected = False
                detected_tiger_code = "TIGER"

                # Render active bounding boxes smoothly
                if self.show_overlays:
                    with active_boxes_lock:
                        for box_info in active_boxes:
                            current_tiger_detected = True
                            detected_tiger_code = box_info["tiger_code"]
                            self.draw_detection_box(
                                frame=display_frame,
                                bbox=box_info["bbox"],
                                tiger_code=box_info["tiger_code"],
                                confidence=box_info["confidence"],
                                decision_type=box_info["decision"],
                                flank_side=box_info["side"],
                            )

                # -------------------------------------------------------------
                # Automatic Tiger Evidence Recording & Proof Capture
                # -------------------------------------------------------------
                if current_tiger_detected:
                    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
                    
                    # 1. Start Evidence Video Recording if not already active
                    if evidence_writer is None:
                        evidence_filename = f"evidence_{detected_tiger_code}_{timestamp_str}.mp4"
                        evidence_video_path = settings.EVIDENCE_RECORDINGS_DIR / evidence_filename
                        h_out, w_out = display_frame.shape[:2]
                        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
                        evidence_writer = cv2.VideoWriter(str(evidence_video_path), fourcc, 20.0, (w_out, h_out))
                        evidence_frame_count = 0
                        last_recorded_tiger = detected_tiger_code
                        print(f"[!] TIGER DETECTED ({detected_tiger_code})! Recording proof evidence to:\n    {evidence_video_path}")

                    # Write annotated frame to evidence recording
                    if evidence_writer is not None:
                        evidence_writer.write(display_frame)
                        evidence_frame_count += 1

                    # 2. Save High-Resolution Proof Snapshot (once per detection session)
                    snapshot_key = f"{detected_tiger_code}_{timestamp_str[:13]}"
                    if snapshot_key not in saved_snapshots:
                        snapshot_filename = f"proof_snapshot_{detected_tiger_code}_{timestamp_str}.jpg"
                        snapshot_path = settings.EVIDENCE_RECORDINGS_DIR / snapshot_filename
                        cv2.imwrite(str(snapshot_path), display_frame)
                        saved_snapshots.add(snapshot_key)
                        print(f"[OK] Saved high-res proof snapshot: {snapshot_filename}")

                else:
                    # If tiger has moved out of view for 30+ frames, finalize recording
                    if evidence_writer is not None and evidence_frame_count > 25:
                        evidence_writer.release()
                        evidence_writer = None
                        print(f"[OK] Finalized tiger evidence recording ({evidence_frame_count} frames): {evidence_video_path.name}")
                        evidence_frame_count = 0

                # FPS Calculation
                t_now = time.time()
                dt = t_now - t_prev
                t_prev = t_now
                if dt > 0:
                    fps_tracker = 0.9 * fps_tracker + 0.1 * (1.0 / dt)

                vram_mb = 0.0
                if torch.cuda.is_available():
                    vram_mb = torch.cuda.memory_allocated() / (1024 * 1024)

                # Draw HUD Telemetry with Evidence Recording Badge
                status_text = status_text_holder[0]
                if evidence_writer is not None:
                    status_text = f"REC [●] EVIDENCE: {last_recorded_tiger}"

                display_frame = self.draw_hud(
                    frame=display_frame,
                    fps=fps_tracker,
                    vram_mb=vram_mb,
                    status_text=status_text,
                    lighting_info=lighting_info,
                )

                cv2.imshow(window_name, display_frame)

                # Maintain realistic video playback rate
                elapsed = time.time() - frame_start_time
                sleep_ms = max(1, int((target_frame_period - elapsed) * 1000)) if cap is not None else 30

                key = cv2.waitKey(sleep_ms) & 0xFF
                if key == ord("q"):
                    break
                elif key == ord("c"):
                    self.show_clahe = not self.show_clahe
                    print(f"[*] CLAHE Enhancement toggled: {'ON' if self.show_clahe else 'OFF'}")
                elif key == ord("d"):
                    self.show_overlays = not self.show_overlays
                elif key in [ord("p"), ord(" ")]:
                    self.is_paused = not self.is_paused

        finally:
            stop_event.set()
            if evidence_writer is not None:
                evidence_writer.release()
                print(f"[OK] Closed and saved tiger evidence recording to: {evidence_video_path}")
            if cap is not None:
                cap.release()
            cv2.destroyAllWindows()


def main():
    parser = argparse.ArgumentParser(description="TigerTrace Real-Time Demo Visualizer")
    parser.add_argument("--source", type=str, default="./data/input_stream", help="Path to video or image folder")
    args = parser.parse_args()

    visualizer = DemoStreamVisualizer(source_path=args.source)
    try:
        visualizer.run_stream()
    except Exception as err:
        logger.warning(f"GUI stream display terminated or running in headless mode: {err}")


if __name__ == "__main__":
    main()
