"""
MegaDescriptor Metric Re-Identification (Re-ID) Embedding Extractor.
Extracts 512-dimensional L2-normalized metric embeddings using Swin/ConvNeXt backbones
in FP16 precision, with strict CUDA memory eviction.
"""

import gc
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import cv2
import numpy as np
import torch
import torch.nn as nn
import torchvision.transforms as T

from config import settings

logger = logging.getLogger("TigerTrace.ReIDExtractor")


class MegaDescriptorReID(nn.Module):
    """Deep metric embedding network producing 512-D normalized identity vectors."""

    def __init__(
        self,
        backbone_name: str = "convnext_tiny",
        embedding_dim: int = 512,
        pretrained: bool = True,
    ):
        super().__init__()
        self.embedding_dim = embedding_dim
        self.backbone_name = backbone_name
        self.backbone = None
        self.head = None

        self._build_model(pretrained=pretrained)

    def _build_model(self, pretrained: bool = True) -> None:
        """Construct feature extraction backbone and 512-D projection head."""
        try:
            import timm
            # Create feature extractor without classification head
            self.backbone = timm.create_model(
                self.backbone_name,
                pretrained=pretrained,
                num_classes=0,  # Pooling only, returns feature representation
            )
            in_features = self.backbone.num_features
        except Exception as err:
            logger.warning(f"timm model loading failed ({err}). Using torchvision ResNet50 fallback.")
            import torchvision.models as models
            resnet = models.resnet50(weights=models.ResNet50_Weights.DEFAULT if pretrained else None)
            in_features = resnet.fc.in_features
            resnet.fc = nn.Identity()
            self.backbone = resnet

        # Bottleneck projection head to calibrated 512-D metric embedding
        self.head = nn.Sequential(
            nn.BatchNorm1d(in_features),
            nn.Dropout(p=0.2),
            nn.Linear(in_features, self.embedding_dim, bias=False),
            nn.BatchNorm1d(self.embedding_dim),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Extract L2-normalized 512-D metric embeddings."""
        features = self.backbone(x)
        embeddings = self.head(features)
        # L2-normalization for exact cosine similarity in pgvector
        normalized_embeddings = nn.functional.normalize(embeddings, p=2, dim=1)
        return normalized_embeddings


class ReIDFeatureExtractor:
    """High-level wrapper for flank crop embedding generation and side determination."""

    def __init__(
        self,
        weights_path: Optional[Union[str, Path]] = None,
        device: Optional[str] = None,
        embedding_dim: int = settings.REID_EMBEDDING_DIM,
    ):
        self.device = device or settings.DEVICE
        self.weights_path = Path(weights_path or settings.REID_WEIGHTS_PATH)
        self.embedding_dim = embedding_dim
        self.model: Optional[MegaDescriptorReID] = None

        self.transform = T.Compose([
            T.ToPILImage(),
            T.Resize(settings.REID_INPUT_SIZE, interpolation=T.InterpolationMode.BICUBIC),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

        self._initialize_extractor()

    def _initialize_extractor(self) -> None:
        """Initialize the model and load custom checkpoint if present."""
        try:
            has_local_weights = self.weights_path.exists()
            self.model = MegaDescriptorReID(
                backbone_name="convnext_tiny",
                embedding_dim=self.embedding_dim,
                pretrained=not has_local_weights,
            )

            if has_local_weights:
                logger.info(f"Loading MegaDescriptor weights from {self.weights_path}")
                checkpoint = torch.load(self.weights_path, map_location="cpu")
                state_dict = checkpoint.get("state_dict", checkpoint)
                self.model.load_state_dict(state_dict, strict=False)

            self.model.eval()
            if self.device == "cuda" and torch.cuda.is_available():
                self.model.to("cuda")

        except Exception as err:
            logger.error(f"Failed to initialize Re-ID network: {err}")
            raise

    def clear_vram(self) -> None:
        """Purge GPU cache after embedding extraction."""
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    def extract_embedding(self, crop_bgr: np.ndarray) -> np.ndarray:
        """
        Extract 512-dimensional normalized vector for a single flank crop.
        Returns numpy array of shape (512,).
        """
        if crop_bgr is None or crop_bgr.size == 0:
            return np.zeros(self.embedding_dim, dtype=np.float32)

        # Convert BGR to RGB
        crop_rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
        tensor = self.transform(crop_rgb).unsqueeze(0).to(self.device)

        device_type = "cuda" if (self.device == "cuda" and torch.cuda.is_available()) else "cpu"
        use_amp = (device_type == "cuda" and settings.USE_FP16)

        with torch.inference_mode():
            try:
                with torch.autocast(device_type=device_type, enabled=use_amp):
                    embedding = self.model(tensor)
            except Exception:
                embedding = self.model(tensor)
            norm_vec = embedding.squeeze(0).cpu().float().numpy()

        self.clear_vram()
        return norm_vec

    def extract_batch_embeddings(self, crops_bgr: List[np.ndarray]) -> List[np.ndarray]:
        """Process multiple flank crops in a batch for high throughput."""
        if not crops_bgr:
            return []

        tensors = []
        valid_indices = []
        for i, crop in enumerate(crops_bgr):
            if crop is not None and crop.size > 0:
                crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
                tensors.append(self.transform(crop_rgb))
                valid_indices.append(i)

        if not tensors:
            return [np.zeros(self.embedding_dim, dtype=np.float32) for _ in crops_bgr]

        batch_tensor = torch.stack(tensors).to(self.device)
        device_type = "cuda" if (self.device == "cuda" and torch.cuda.is_available()) else "cpu"
        use_amp = (device_type == "cuda" and settings.USE_FP16)

        with torch.inference_mode():
            try:
                with torch.autocast(device_type=device_type, enabled=use_amp):
                    embeddings = self.model(batch_tensor).cpu().float().numpy()
            except Exception:
                embeddings = self.model(batch_tensor).cpu().float().numpy()

        self.clear_vram()

        results = [np.zeros(self.embedding_dim, dtype=np.float32) for _ in range(len(crops_bgr))]
        for idx, emb in zip(valid_indices, embeddings):
            results[idx] = emb

        return results

    def estimate_flank_side(self, crop_bgr: np.ndarray) -> Tuple[str, float]:
        """
        Estimate flank side (LEFT or RIGHT) based on gradient asymmetry
        and stripe orientation angle.
        Returns (side, side_confidence).
        """
        if crop_bgr is None or crop_bgr.size == 0:
            return "UNKNOWN", 0.0

        gray = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2GRAY)
        gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)

        mag, ang = cv2.cartToPolar(gx, gy, angleInDegrees=True)
        # Analyze dominant stripe slope
        left_oriented = np.sum((ang > 30) & (ang < 75))
        right_oriented = np.sum((ang > 105) & (ang < 150))

        total = left_oriented + right_oriented + 1e-6
        ratio = (left_oriented - right_oriented) / total

        if abs(ratio) > 0.15:
            side = "LEFT" if ratio > 0 else "RIGHT"
            confidence = min(0.92, 0.5 + abs(ratio) * 0.5)
        else:
            side = "UNKNOWN"
            confidence = 0.50

        return side, round(confidence, 2)
