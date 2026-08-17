"""
Configuration Module for TigerTrace Computer Vision & Re-ID Subsystem.
Implements Pydantic v2 Settings with environment variable overrides and sensible offline defaults.
"""

from pathlib import Path
from typing import Tuple
import torch
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class PipelineConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

    # -------------------------------------------------------------------------
    # Base Directories
    # -------------------------------------------------------------------------
    BASE_DIR: Path = Field(default_factory=lambda: Path(__file__).resolve().parent)
    DATA_DIR: Path = Field(default_factory=lambda: Path(__file__).resolve().parent / "data")
    ATRW_DIR: Path = Field(default_factory=lambda: Path(__file__).resolve().parent / "data" / "atrw")
    INPUT_STREAM_DIR: Path = Field(default_factory=lambda: Path(__file__).resolve().parent / "data" / "input_stream")
    QUARANTINE_DIR: Path = Field(default_factory=lambda: Path(__file__).resolve().parent / "data" / "quarantine")
    CROPS_DIR: Path = Field(default_factory=lambda: Path(__file__).resolve().parent / "data" / "crops")
    EVIDENCE_RECORDINGS_DIR: Path = Field(default_factory=lambda: Path(__file__).resolve().parent / "data" / "evidence_recordings")
    MODELS_DIR: Path = Field(default_factory=lambda: Path(__file__).resolve().parent / "models")

    # -------------------------------------------------------------------------
    # Database Connection (PostgreSQL 16 + PostGIS + pgvector)
    # -------------------------------------------------------------------------
    POSTGRES_USER: str = Field(default="tigertrace")
    POSTGRES_PASSWORD: str = Field(default="tigertrace_secret")
    POSTGRES_HOST: str = Field(default="localhost")
    POSTGRES_PORT: int = Field(default=5432)
    POSTGRES_DB: str = Field(default="tigertrace")
    DB_SCHEMA: str = Field(default="tigertrace")
    DATABASE_POOL_SIZE: int = Field(default=10)
    DATABASE_MAX_OVERFLOW: int = Field(default=20)
    DB_ECHO: bool = Field(default=False)

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # -------------------------------------------------------------------------
    # Hardware & PyTorch Runtime Optimization (RTX 3050 Target)
    # -------------------------------------------------------------------------
    DEVICE: str = Field(
        default_factory=lambda: "cuda" if torch.cuda.is_available() else "cpu"
    )
    USE_FP16: bool = Field(default=True)
    MAX_VRAM_GB: float = Field(default=3.0)
    BATCH_SIZE: int = Field(default=4)
    NUM_WORKERS: int = Field(default=2)

    # -------------------------------------------------------------------------
    # Image Preprocessing & Low-Light Enhancement (CLAHE)
    # -------------------------------------------------------------------------
    CLAHE_CLIP_LIMIT: float = Field(default=2.5)
    CLAHE_TILE_GRID_SIZE: Tuple[int, int] = Field(default=(8, 8))
    APPLY_BILATERAL_FILTER: bool = Field(default=True)
    BILATERAL_D: int = Field(default=5)
    BILATERAL_SIGMA_COLOR: float = Field(default=50.0)
    BILATERAL_SIGMA_SPACE: float = Field(default=50.0)
    VIDEO_SUBSAMPLE_FPS: float = Field(default=1.0)  # Subsample 1 frame per second for trap video

    # -------------------------------------------------------------------------
    # MegaDetector / YOLOv8 Animal Detection Parameters
    # -------------------------------------------------------------------------
    MDV6_MODEL_NAME: str = Field(default="YOLOv8n-MegaDetector")
    MDV6_WEIGHTS_URL: str = Field(
        default="https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.pt"
    )
    MDV6_WEIGHTS_PATH: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parent / "models" / "yolov8n.pt"
    )
    BLANK_THRESHOLD: float = Field(default=0.20)         # Below 0.20 animal conf -> Quarantine as BLANK
    TIGER_CONF_THRESHOLD: float = Field(default=0.30)    # Animal/Tiger detection threshold
    IOU_THRESHOLD: float = Field(default=0.45)           # NMS IoU threshold
    CROP_PADDING_RATIO: float = Field(default=0.08)      # 8% flank context padding

    # -------------------------------------------------------------------------
    # MegaDescriptor Re-Identification (Re-ID) Parameters
    # -------------------------------------------------------------------------
    REID_MODEL_NAME: str = Field(default="MegaDescriptor-T-224")
    REID_EMBEDDING_DIM: int = Field(default=512)
    REID_INPUT_SIZE: Tuple[int, int] = Field(default=(224, 224))
    REID_WEIGHTS_PATH: Path = Field(
        default_factory=lambda: (
            Path(__file__).resolve().parent / "models" / "maga descriptor_t_224.pt"
            if (Path(__file__).resolve().parent / "models" / "maga descriptor_t_224.pt").exists()
            else (
                Path(__file__).resolve().parent / "models" / "maga_descriptor_t_224.pt"
                if (Path(__file__).resolve().parent / "models" / "maga_descriptor_t_224.pt").exists()
                else Path(__file__).resolve().parent / "models" / "megadescriptor_t_224.pt"
            )
        )
    )

    # 3-Tier Re-ID Threshold Calibration
    AUTO_MATCH_THRESHOLD: float = Field(default=0.78)     # Cosine sim >= 0.78 -> Automatic match to known tiger
    REVIEW_THRESHOLD: float = Field(default=0.58)         # 0.58 <= sim < 0.78 -> Human review task queued
    NEW_INDIVIDUAL_THRESHOLD: float = Field(default=0.58) # sim < 0.58 -> Auto-enrolled as new candidate

    # -------------------------------------------------------------------------
    # Movement Deviation & Spatial Analytics Parameters
    # -------------------------------------------------------------------------
    CORE_RANGE_MAX_KM2: float = Field(default=20.0)
    VILLAGE_BUFFER_PROXIMITY_METERS: float = Field(default=3000.0)
    PROLONGED_ABSENCE_DAYS: int = Field(default=30)
    SURVEY_EFFORT_MIN_DAYS: int = Field(default=7)

    def ensure_directories(self) -> None:
        """Create required runtime and storage folders if they do not exist."""
        for path in [
            self.DATA_DIR,
            self.ATRW_DIR,
            self.INPUT_STREAM_DIR,
            self.QUARANTINE_DIR,
            self.CROPS_DIR,
            self.EVIDENCE_RECORDINGS_DIR,
            self.MODELS_DIR,
        ]:
            path.mkdir(parents=True, exist_ok=True)


# Singleton Config Instance
settings = PipelineConfig()
settings.ensure_directories()
