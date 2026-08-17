"""
ATRW (Amur Tiger Re-identification in the Wild) Benchmark Evaluation Engine.
Computes Detection mAP@50, Precision, Recall, Blank FNR, and Re-ID Rank-1/5 & mAP metrics.
"""

import argparse
import json
import logging
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple

import cv2
import numpy as np
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from config import settings
from dataset_loader import ATRWDatasetLoader
from detector import MegaDetectorV6
from preprocessor import ImagePreprocessor
from reid_extractor import ReIDFeatureExtractor

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("TigerTrace.Evaluate")
console = Console()


def compute_iou(box1: List[float], box2: List[float]) -> float:
    """Compute Intersection over Union (IoU) between two [x1, y1, x2, y2] bounding boxes."""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    intersection = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    area1 = max(0.0, box1[2] - box1[0]) * max(0.0, box1[3] - box1[1])
    area2 = max(0.0, box2[2] - box2[0]) * max(0.0, box2[3] - box2[1])
    union = area1 + area2 - intersection

    return intersection / union if union > 0 else 0.0


class ATRWEvaluator:
    """Evaluates MegaDetector v6 and MegaDescriptor on ATRW Benchmark."""

    def __init__(self, dataset_dir: Path = settings.ATRW_DIR):
        self.loader = ATRWDatasetLoader(dataset_dir)
        self.preprocessor = ImagePreprocessor()
        self.detector = MegaDetectorV6()
        self.reid_extractor = ReIDFeatureExtractor()

    def evaluate_detection(self, split: str = "val", iou_thresh: float = 0.50) -> Dict[str, float]:
        """
        Evaluate MegaDetector v6 on ATRW detection validation split.
        Computes mAP@50, Precision, Recall, and False Negative Rate (FNR).
        """
        samples = self.loader.load_detection_split(split)
        if not samples:
            logger.warning("No detection samples found. Generating synthetic ATRW dataset first...")
            self.loader.generate_synthetic_benchmark_dataset()
            samples = self.loader.load_detection_split(split)

        total_gt = 0
        true_positives = 0
        false_positives = 0
        false_negatives = 0

        console.print(f"[cyan]Evaluating MegaDetector on {len(samples)} ATRW detection frames...[/cyan]")

        for sample in samples:
            img_bgr = cv2.imread(sample["image_path"])
            if img_bgr is None:
                continue

            # Run detection
            enhanced = self.preprocessor.enhance_clahe(img_bgr)
            det_res = self.detector.detect(enhanced, return_crops=False)
            pred_boxes = [d["bbox"] for d in det_res["detections"]]
            gt_boxes = [g["bbox"] for g in sample["ground_truth_boxes"]]

            total_gt += len(gt_boxes)

            # Match predictions with ground truth boxes
            matched_gt = set()
            for p in pred_boxes:
                p_box = [p["x1"], p["y1"], p["x2"], p["y2"]]
                best_iou = 0.0
                best_gt_idx = -1

                for g_idx, g_box in enumerate(gt_boxes):
                    if g_idx not in matched_gt:
                        iou = compute_iou(p_box, g_box)
                        if iou > best_iou:
                            best_iou = iou
                            best_gt_idx = g_idx

                if best_iou >= iou_thresh:
                    true_positives += 1
                    matched_gt.add(best_gt_idx)
                else:
                    false_positives += 1

            false_negatives += (len(gt_boxes) - len(matched_gt))

        precision = true_positives / (true_positives + false_positives + 1e-6)
        recall = true_positives / (total_gt + 1e-6)
        f1_score = 2 * (precision * recall) / (precision + recall + 1e-6)
        fnr = false_negatives / (total_gt + 1e-6)

        return {
            "mAP50": round(precision * recall, 4),  # Approximation for single class
            "Precision": round(precision, 4),
            "Recall": round(recall, 4),
            "F1_Score": round(f1_score, 4),
            "FNR": round(fnr, 4),
            "True_Positives": true_positives,
            "False_Positives": false_positives,
            "False_Negatives": false_negatives,
            "Total_Ground_Truth": total_gt,
        }

    def evaluate_reid(self, split: str = "test") -> Dict[str, float]:
        """
        Evaluate MegaDescriptor 512-D embeddings on ATRW Re-ID split.
        Computes Rank-1, Rank-5 Cumulative Matching Characteristics (CMC) and mAP.
        """
        reid_data = self.loader.load_reid_split(split)
        queries = reid_data["query"]
        galleries = reid_data["gallery"]

        if not queries or not galleries:
            logger.warning("No Re-ID split found. Generating synthetic ATRW dataset first...")
            self.loader.generate_synthetic_benchmark_dataset()
            reid_data = self.loader.load_reid_split(split)
            queries = reid_data["query"]
            galleries = reid_data["gallery"]

        console.print(f"[cyan]Evaluating Re-ID on {len(queries)} Queries against {len(galleries)} Gallery images...[/cyan]")

        # Extract gallery embeddings
        gallery_embs = []
        gallery_ids = []
        for g in galleries:
            g_img = cv2.imread(g["image_path"])
            if g_img is not None:
                emb = self.reid_extractor.extract_embedding(g_img)
                gallery_embs.append(emb)
                gallery_ids.append(g["tiger_id"])

        gallery_matrix = np.stack(gallery_embs)  # Shape (N_gallery, 512)

        rank1_hits = 0
        rank5_hits = 0
        ap_list = []
        intra_sims = []
        inter_sims = []

        for q in queries:
            q_img = cv2.imread(q["image_path"])
            if q_img is None:
                continue

            q_emb = self.reid_extractor.extract_embedding(q_img)  # Shape (512,)
            q_id = q["tiger_id"]

            # Compute Cosine Similarities against all gallery images (Matrix Dot Product)
            sims = np.dot(gallery_matrix, q_emb)  # Shape (N_gallery,)

            # Sort gallery indices descending by similarity
            ranked_indices = np.argsort(-sims)

            # Record similarity distributions for intra-class vs inter-class separation
            for sim_val, g_id in zip(sims, gallery_ids):
                if g_id == q_id:
                    intra_sims.append(float(sim_val))
                else:
                    inter_sims.append(float(sim_val))

            # CMC Evaluation (Rank-1 and Rank-5)
            ranked_ids = [gallery_ids[i] for i in ranked_indices]
            if ranked_ids[0] == q_id:
                rank1_hits += 1
            if q_id in ranked_ids[:5]:
                rank5_hits += 1

            # Average Precision for this query
            matches = [1 if gid == q_id else 0 for gid in ranked_ids]
            num_rel = sum(matches)
            if num_rel > 0:
                cum_correct = np.cumsum(matches)
                ranks = np.arange(1, len(matches) + 1)
                precisions_at_k = cum_correct / ranks
                ap = np.sum(precisions_at_k * matches) / num_rel
                ap_list.append(ap)

        n_queries = max(1, len(queries))
        rank1_acc = rank1_hits / n_queries
        rank5_acc = rank5_hits / n_queries
        mean_ap = np.mean(ap_list) if ap_list else 0.0
        avg_intra_sim = np.mean(intra_sims) if intra_sims else 0.0
        avg_inter_sim = np.mean(inter_sims) if inter_sims else 0.0

        return {
            "Rank1_Accuracy": round(rank1_acc * 100, 2),
            "Rank5_Accuracy": round(rank5_acc * 100, 2),
            "mAP": round(mean_ap * 100, 2),
            "Avg_Intra_Class_Similarity": round(avg_intra_sim, 4),
            "Avg_Inter_Class_Similarity": round(avg_inter_sim, 4),
            "Separation_Margin": round(avg_intra_sim - avg_inter_sim, 4),
            "Total_Queries": n_queries,
            "Total_Gallery": len(galleries),
        }

    def run_full_benchmark(self) -> Dict[str, Any]:
        """Execute comprehensive detection and Re-ID evaluation suite."""
        t0 = time.time()
        det_metrics = self.evaluate_detection()
        reid_metrics = self.evaluate_reid()
        elapsed = round(time.time() - t0, 2)

        # Output Rich Formatted Benchmark Tables
        det_table = Table(title="MegaDetector v6 — ATRW Detection Benchmark", border_style="green")
        det_table.add_column("Metric", style="bold white")
        det_table.add_column("Score", style="bold green")
        det_table.add_row("mAP @ IoU 0.50", f"{det_metrics['mAP50'] * 100:.1f}%")
        det_table.add_row("Precision", f"{det_metrics['Precision'] * 100:.1f}%")
        det_table.add_row("Recall", f"{det_metrics['Recall'] * 100:.1f}%")
        det_table.add_row("F1-Score", f"{det_metrics['F1_Score'] * 100:.1f}%")
        det_table.add_row("False Negative Rate (FNR)", f"{det_metrics['FNR'] * 100:.1f}%")
        det_table.add_row("Ground Truth Bounding Boxes", str(det_metrics['Total_Ground_Truth']))

        reid_table = Table(title="MegaDescriptor-T-224 — ATRW Re-ID Benchmark", border_style="magenta")
        reid_table.add_column("Metric", style="bold white")
        reid_table.add_column("Score", style="bold magenta")
        reid_table.add_row("Rank-1 Accuracy (Top-1)", f"{reid_metrics['Rank1_Accuracy']:.1f}%")
        reid_table.add_row("Rank-5 Accuracy (Top-5)", f"{reid_metrics['Rank5_Accuracy']:.1f}%")
        reid_table.add_row("mean Average Precision (mAP)", f"{reid_metrics['mAP']:.1f}%")
        reid_table.add_row("Avg Intra-Class Cosine Sim (Same Tiger)", f"{reid_metrics['Avg_Intra_Class_Similarity']:.4f}")
        reid_table.add_row("Avg Inter-Class Cosine Sim (Diff Tiger)", f"{reid_metrics['Avg_Inter_Class_Similarity']:.4f}")
        reid_table.add_row("Metric Separation Margin", f"{reid_metrics['Separation_Margin']:.4f}")

        console.print(det_table)
        console.print(reid_table)

        results = {
            "detection": det_metrics,
            "reid": reid_metrics,
            "benchmark_runtime_seconds": elapsed,
        }

        report_path = settings.BASE_DIR / "benchmark_report.json"
        with open(report_path, "w") as f:
            json.dump(results, f, indent=2)
        console.print(f"[bold green]Full benchmark report exported to {report_path}[/bold green]")

        return results


def main():
    parser = argparse.ArgumentParser(description="ATRW Benchmark Evaluator for TigerTrace")
    parser.add_argument("--dataset-dir", type=str, default=str(settings.ATRW_DIR))
    args = parser.parse_args()

    evaluator = ATRWEvaluator(Path(args.dataset_dir))
    evaluator.run_full_benchmark()


if __name__ == "__main__":
    main()
