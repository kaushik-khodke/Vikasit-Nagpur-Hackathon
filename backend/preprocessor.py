"""
Preprocessing and Enhancement Pipeline for Wildlife Camera-Trap Imagery.
Implements LAB-space CLAHE low-light enhancement, bilateral denoising,
EXIF timestamp extraction, and video frame subsampling.
"""

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Generator, Optional, Tuple, Union

import cv2
import numpy as np
from PIL import Image, ExifTags

from config import settings

logger = logging.getLogger("TigerTrace.Preprocessor")


class ImagePreprocessor:
    """Preprocesses camera trap imagery for downstream detection and Re-ID."""

    def __init__(
        self,
        clahe_clip_limit: float = settings.CLAHE_CLIP_LIMIT,
        clahe_tile_grid_size: Tuple[int, int] = settings.CLAHE_TILE_GRID_SIZE,
        apply_bilateral: bool = settings.APPLY_BILATERAL_FILTER,
    ):
        self.clahe_clip_limit = clahe_clip_limit
        self.clahe_tile_grid_size = clahe_tile_grid_size
        self.apply_bilateral = apply_bilateral
        self.clahe = cv2.createCLAHE(
            clipLimit=self.clahe_clip_limit,
            tileGridSize=self.clahe_tile_grid_size,
        )

    def enhance_clahe(self, image_bgr: np.ndarray) -> np.ndarray:
        """
        Apply Contrast Limited Adaptive Histogram Equalization (CLAHE).
        Preserves color fidelity by transforming into LAB space and equalizing
        luminance channel (L) only.
        """
        if image_bgr is None or image_bgr.size == 0:
            raise ValueError("Empty or invalid image array provided to CLAHE enhancer.")

        # If single channel grayscale
        if len(image_bgr.shape) == 2 or image_bgr.shape[2] == 1:
            enhanced = self.clahe.apply(image_bgr)
            if self.apply_bilateral:
                enhanced = cv2.bilateralFilter(
                    enhanced,
                    d=settings.BILATERAL_D,
                    sigmaColor=settings.BILATERAL_SIGMA_COLOR,
                    sigmaSpace=settings.BILATERAL_SIGMA_SPACE,
                )
            return enhanced

        # Convert BGR to LAB color space
        lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)

        # Equalize only the Luminance (L) channel
        cl_channel = self.clahe.apply(l_channel)

        # Optional bilateral filtering on luminance to suppress night-vision sensor grain
        if self.apply_bilateral:
            cl_channel = cv2.bilateralFilter(
                cl_channel,
                d=settings.BILATERAL_D,
                sigmaColor=settings.BILATERAL_SIGMA_COLOR,
                sigmaSpace=settings.BILATERAL_SIGMA_SPACE,
            )

        # Merge enhanced L channel back with original A and B color channels
        merged_lab = cv2.merge((cl_channel, a_channel, b_channel))
        enhanced_bgr = cv2.cvtColor(merged_lab, cv2.COLOR_LAB2BGR)
        return enhanced_bgr

    def assess_lighting_condition(self, image_bgr: np.ndarray) -> Dict[str, Any]:
        """
        Evaluate brightness, contrast, and noise levels.
        Returns diagnostic metrics for camera station condition reporting.
        """
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY) if len(image_bgr.shape) == 3 else image_bgr
        mean_brightness = float(np.mean(gray))
        rms_contrast = float(np.std(gray))
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())  # Sharpness/blur score

        is_low_light = mean_brightness < 45.0
        is_backlit = rms_contrast > 75.0 and mean_brightness < 70.0
        is_blurry = laplacian_var < 30.0

        return {
            "mean_brightness": round(mean_brightness, 2),
            "rms_contrast": round(rms_contrast, 2),
            "sharpness_score": round(laplacian_var, 2),
            "is_low_light": is_low_light,
            "is_backlit": is_backlit,
            "is_blurry": is_blurry,
            "recommended_enhancement": is_low_light or is_backlit,
        }

    def extract_metadata(self, file_path: Union[str, Path]) -> Dict[str, Any]:
        """
        Extract normalized EXIF timestamp, camera make/model, and GPS from file.
        Falls back to filesystem modification time when EXIF is unavailable.
        """
        path = Path(file_path)
        metadata: Dict[str, Any] = {
            "filename": path.name,
            "file_size_bytes": path.stat().st_size if path.exists() else 0,
            "timestamp": None,
            "timestamp_source": "FILESYSTEM",
            "camera_model": None,
            "gps_latitude": None,
            "gps_longitude": None,
        }

        try:
            with Image.open(path) as img:
                exif_data = img.getexif()
                if exif_data:
                    for tag_id, val in exif_data.items():
                        tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                        if tag_name in ["DateTimeOriginal", "DateTime", "DateTimeDigitized"]:
                            try:
                                # Standard EXIF format: YYYY:MM:DD HH:MM:SS
                                dt = datetime.strptime(str(val).strip(), "%Y:%m:%d %H:%M:%S")
                                metadata["timestamp"] = dt.replace(tzinfo=timezone.utc)
                                metadata["timestamp_source"] = "EXIF"
                                break
                            except Exception:
                                pass
                        elif tag_name == "Model":
                            metadata["camera_model"] = str(val).strip()

        except Exception as err:
            logger.debug(f"Could not read EXIF data for {path.name}: {err}")

        # Fallback to filesystem timestamp
        if metadata["timestamp"] is None and path.exists():
            mtime = path.stat().st_mtime
            metadata["timestamp"] = datetime.fromtimestamp(mtime, tz=timezone.utc)
            metadata["timestamp_source"] = "FILESYSTEM"

        return metadata

    def subsample_video(
        self,
        video_path: Union[str, Path],
        target_fps: float = settings.VIDEO_SUBSAMPLE_FPS,
    ) -> Generator[Tuple[int, datetime, np.ndarray], None, None]:
        """
        Subsample video sequence at a controlled frame rate (default 1 fps)
        to prevent redundant processing of static camera trap footage.
        Yields (frame_index, estimated_timestamp, frame_bgr).
        """
        vpath = Path(video_path)
        cap = cv2.VideoCapture(str(vpath))
        if not cap.isOpened():
            logger.error(f"Failed to open video file: {video_path}")
            return

        native_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        frame_interval = max(1, int(round(native_fps / target_fps)))
        base_time = vpath.stat().st_mtime
        frame_idx = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_interval == 0:
                elapsed_sec = frame_idx / native_fps
                timestamp = datetime.fromtimestamp(base_time + elapsed_sec, tz=timezone.utc)
                yield frame_idx, timestamp, frame

            frame_idx += 1

        cap.release()
