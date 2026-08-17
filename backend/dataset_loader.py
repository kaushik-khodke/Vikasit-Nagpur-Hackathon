"""
ATRW (Amur Tiger Re-identification in the Wild) Dataset Parser & Benchmark Loader.
Parses PASCAL VOC bounding boxes for detection and identity splits for metric Re-ID benchmarking.
Includes synthetic sample generation for reproducible offline test validation.
"""

import json
import logging
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import cv2
import numpy as np
from PIL import Image

from config import settings

logger = logging.getLogger("TigerTrace.DatasetLoader")


class ATRWDatasetLoader:
    """Parser and batch loader for ATRW detection and Re-ID splits."""

    def __init__(self, dataset_dir: Optional[Union[str, Path]] = None):
        self.dataset_dir = Path(dataset_dir or settings.ATRW_DIR)
        self.detection_dir = self.dataset_dir / "detection"
        self.reid_dir = self.dataset_dir / "reid"

    def parse_voc_xml(self, xml_path: Path) -> List[Dict[str, Any]]:
        """Parse PASCAL VOC XML annotation file for tiger bounding boxes."""
        boxes = []
        if not xml_path.exists():
            return boxes

        try:
            tree = ET.parse(xml_path)
            root = tree.getroot()

            size = root.find("size")
            img_w = int(size.find("width").text) if size is not None and size.find("width") is not None else 1920
            img_h = int(size.find("height").text) if size is not None and size.find("height") is not None else 1080

            for obj in root.findall("object"):
                name = obj.find("name").text
                bndbox = obj.find("bndbox")
                xmin = float(bndbox.find("xmin").text)
                ymin = float(bndbox.find("ymin").text)
                xmax = float(bndbox.find("xmax").text)
                ymax = float(bndbox.find("ymax").text)

                boxes.append({
                    "class_name": name,
                    "bbox": [xmin, ymin, xmax, ymax],
                    "image_width": img_w,
                    "image_height": img_h,
                })
        except Exception as err:
            logger.error(f"Error parsing VOC XML {xml_path}: {err}")

        return boxes

    def load_detection_split(self, split: str = "val") -> List[Dict[str, Any]]:
        """Load list of image paths and corresponding ground-truth bounding boxes."""
        split_file = self.detection_dir / "ImageSets" / "Main" / f"{split}.txt"
        images_dir = self.detection_dir / "JPEGImages"
        anno_dir = self.detection_dir / "Annotations"

        samples = []
        if split_file.exists():
            with open(split_file, "r") as f:
                img_ids = [line.strip() for line in f if line.strip()]

            for img_id in img_ids:
                img_path = images_dir / f"{img_id}.jpg"
                xml_path = anno_dir / f"{img_id}.xml"
                gt_boxes = self.parse_voc_xml(xml_path)

                if img_path.exists():
                    samples.append({
                        "image_id": img_id,
                        "image_path": str(img_path),
                        "ground_truth_boxes": gt_boxes,
                    })
        return samples

    def load_reid_split(self, split: str = "test") -> Dict[str, Any]:
        """
        Load ATRW individual Re-ID query and gallery sets.
        Returns:
            {
                "identities": list[str],
                "query": list[dict],
                "gallery": list[dict],
            }
        """
        reid_split_file = self.reid_dir / f"reid_list_{split}.txt"
        images_dir = self.reid_dir / f"images_{split}"

        query_items = []
        gallery_items = []
        identities = set()

        if reid_split_file.exists():
            with open(reid_split_file, "r") as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) >= 2:
                        img_name = parts[0]
                        tiger_id = parts[1]
                        side = parts[2] if len(parts) > 2 else "UNKNOWN"
                        is_query = parts[3] == "1" if len(parts) > 3 else False

                        img_path = images_dir / img_name
                        item = {
                            "image_name": img_name,
                            "image_path": str(img_path),
                            "tiger_id": tiger_id,
                            "flank_side": side,
                        }
                        identities.add(tiger_id)
                        if is_query:
                            query_items.append(item)
                        else:
                            gallery_items.append(item)

        return {
            "identities": sorted(list(identities)),
            "query": query_items,
            "gallery": gallery_items,
        }

    def generate_synthetic_benchmark_dataset(self, num_tigers: int = 5, images_per_tiger: int = 4) -> None:
        """
        Generate synthetic ATRW dataset structure with realistic tiger stripe patterns
        to enable immediate offline validation of the detection and Re-ID benchmark suite.
        """
        det_img_dir = self.detection_dir / "JPEGImages"
        det_anno_dir = self.detection_dir / "Annotations"
        det_split_dir = self.detection_dir / "ImageSets" / "Main"

        reid_img_train_dir = self.reid_dir / "images_train"
        reid_img_test_dir = self.reid_dir / "images_test"

        for p in [det_img_dir, det_anno_dir, det_split_dir, reid_img_train_dir, reid_img_test_dir]:
            p.mkdir(parents=True, exist_ok=True)

        val_ids = []
        reid_test_lines = []

        for t_idx in range(1, num_tigers + 1):
            tiger_code = f"TGR-{t_idx:03d}"
            # Unique deterministic seed for reproducible synthetic stripe frequencies
            np.random.seed(100 + t_idx)

            for img_idx in range(1, images_per_tiger + 1):
                img_name = f"{tiger_code}_{img_idx:02d}"
                val_ids.append(img_name)

                # Create synthetic 800x600 forest background image
                bg = np.full((600, 800, 3), (35, 60, 40), dtype=np.uint8)
                # Add background forest noise
                noise = np.random.randint(0, 30, (600, 800, 3), dtype=np.uint8)
                bg = cv2.add(bg, noise)

                # Tiger bounding box in middle
                x1, y1, x2, y2 = 150, 120, 650, 480
                tiger_crop = np.full((y2 - y1, x2 - x1, 3), (25, 110, 220), dtype=np.uint8)  # Tawny orange

                # Draw signature vertical tiger stripes unique to this tiger ID
                stripe_freq = 15 + (t_idx * 7)
                for sx in range(20, tiger_crop.shape[1] - 20, stripe_freq):
                    thickness = np.random.randint(4, 12)
                    pts = np.array([
                        [sx, 10],
                        [sx + np.random.randint(-15, 15), tiger_crop.shape[0] // 2],
                        [sx + np.random.randint(-10, 10), tiger_crop.shape[0] - 10]
                    ], np.int32)
                    cv2.polylines(tiger_crop, [pts], isClosed=False, color=(15, 15, 15), thickness=thickness)

                # Blend tiger crop onto background
                bg[y1:y2, x1:x2] = tiger_crop

                # Save detection image and VOC XML
                det_img_path = det_img_dir / f"{img_name}.jpg"
                cv2.imwrite(str(det_img_path), bg)

                xml_content = f"""<annotation>
    <filename>{img_name}.jpg</filename>
    <size>
        <width>800</width>
        <height>600</height>
        <depth>3</depth>
    </size>
    <object>
        <name>tiger</name>
        <bndbox>
            <xmin>{x1}</xmin>
            <ymin>{y1}</ymin>
            <xmax>{x2}</xmax>
            <ymax>{y2}</ymax>
        </bndbox>
    </object>
</annotation>"""
                with open(det_anno_dir / f"{img_name}.xml", "w") as f:
                    f.write(xml_content)

                # Save Re-ID crop
                reid_img_path = reid_img_test_dir / f"{img_name}.jpg"
                cv2.imwrite(str(reid_img_path), tiger_crop)

                # First image is query, remaining are gallery
                is_query = "1" if img_idx == 1 else "0"
                side = "LEFT" if img_idx % 2 == 1 else "RIGHT"
                reid_test_lines.append(f"{img_name}.jpg {tiger_code} {side} {is_query}\n")

        # Write split files
        with open(det_split_dir / "val.txt", "w") as f:
            f.write("\n".join(val_ids) + "\n")

        with open(self.reid_dir / "reid_list_test.txt", "w") as f:
            f.writelines(reid_test_lines)

        logger.info(f"Synthetic ATRW benchmark dataset generated at {self.dataset_dir}")
