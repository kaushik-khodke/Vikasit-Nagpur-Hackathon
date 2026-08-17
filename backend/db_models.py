"""
SQLAlchemy 2.0 ORM Models for TigerTrace Wildlife Monitoring System.
Implements PostgreSQL 16 + PostGIS + pgvector (512-D) schema matching the TigerTrace specification.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import UserDefinedType

try:
    from geoalchemy2 import Geography, Geometry
except ImportError:
    class Geography(UserDefinedType):
        def __init__(self, *args, **kwargs):
            pass
        def get_col_spec(self, **kw):
            return "GEOGRAPHY"

    class Geometry(UserDefinedType):
        def __init__(self, *args, **kwargs):
            pass
        def get_col_spec(self, **kw):
            return "GEOMETRY"

try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    class Vector(UserDefinedType):
        def __init__(self, *args, **kwargs):
            pass
        def get_col_spec(self, **kw):
            return "VECTOR(512)"

SCHEMA_NAME = "tigertrace"


class Base(DeclarativeBase):
    pass


class CameraStation(Base):
    __tablename__ = "camera_stations"
    __table_args__ = {"schema": SCHEMA_NAME}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    zone_type: Mapped[str] = mapped_column(String(32), nullable=False)
    location = mapped_column(Geography(geometry_type="POINT", srid=4326), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    simulation: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)
    installed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    images: Mapped[List["ImageRecord"]] = relationship("ImageRecord", back_populates="camera_station")
    observations: Mapped[List["Observation"]] = relationship("Observation", back_populates="camera_station")


class Zone(Base):
    __tablename__ = "zones"
    __table_args__ = {"schema": SCHEMA_NAME}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    zone_type: Mapped[str] = mapped_column(String(32), nullable=False)
    geometry = mapped_column(Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=False)
    priority: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class ImportRun(Base):
    __tablename__ = "import_runs"
    __table_args__ = {"schema": SCHEMA_NAME}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mode: Mapped[str] = mapped_column(String(24), nullable=False)
    source_path: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="QUEUED", nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    total_files: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    valid_files: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    corrupt_files: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    blank_files: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    useful_files: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    tiger_detections: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    new_tigers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    alerts_created: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    storage_saved_bytes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    processing_seconds: Mapped[Optional[float]] = mapped_column(Numeric(12, 3))

    error_summary: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    configuration_snapshot: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    images: Mapped[List["ImageRecord"]] = relationship("ImageRecord", back_populates="import_run")


class ImageRecord(Base):
    __tablename__ = "images"
    __table_args__ = {"schema": SCHEMA_NAME}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    camera_station_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.camera_stations.id"), nullable=False
    )
    import_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.import_runs.id"), nullable=False
    )
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    original_filename: Mapped[str] = mapped_column(Text, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100))
    size_bytes: Mapped[Optional[int]] = mapped_column(Integer)
    captured_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    status: Mapped[str] = mapped_column(String(32), default="INGESTED", nullable=False)
    classification: Mapped[Optional[str]] = mapped_column(String(32))
    classification_confidence: Mapped[Optional[float]] = mapped_column(Float)
    quarantine_path: Mapped[Optional[str]] = mapped_column(Text)
    is_quarantined: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    camera_station: Mapped["CameraStation"] = relationship("CameraStation", back_populates="images")
    import_run: Mapped["ImportRun"] = relationship("ImportRun", back_populates="images")
    image_metadata: Mapped[Optional["ImageMetadata"]] = relationship("ImageMetadata", back_populates="image", uselist=False)
    detections: Mapped[List["Detection"]] = relationship("Detection", back_populates="image", cascade="all, delete-orphan")


class ImageMetadata(Base):
    __tablename__ = "image_metadata"
    __table_args__ = {"schema": SCHEMA_NAME}

    image_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.images.id", ondelete="CASCADE"), primary_key=True
    )
    source_timestamp: Mapped[Optional[str]] = mapped_column(Text)
    parsed_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    timestamp_source: Mapped[Optional[str]] = mapped_column(String(32))
    camera_clock_offset_seconds: Mapped[Optional[int]] = mapped_column(Integer)
    gps_source: Mapped[Optional[str]] = mapped_column(String(32))
    location = mapped_column(Geography(geometry_type="POINT", srid=4326), nullable=True)
    metadata_quality: Mapped[str] = mapped_column(String(24), default="OK", nullable=False)
    raw_metadata: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    warnings: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    image: Mapped["ImageRecord"] = relationship("ImageRecord", back_populates="image_metadata")


class Detection(Base):
    __tablename__ = "detections"
    __table_args__ = {"schema": SCHEMA_NAME}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    image_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.images.id", ondelete="CASCADE"), nullable=False
    )
    class_name: Mapped[str] = mapped_column(String(32), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    bbox: Mapped[dict] = mapped_column(JSONB, nullable=False)
    model_name: Mapped[str] = mapped_column(String(120), nullable=False)
    model_version: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    image: Mapped["ImageRecord"] = relationship("ImageRecord", back_populates="detections")
    flank_crops: Mapped[List["FlankCrop"]] = relationship("FlankCrop", back_populates="detection", cascade="all, delete-orphan")


class FlankCrop(Base):
    __tablename__ = "flank_crops"
    __table_args__ = {"schema": SCHEMA_NAME}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    detection_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.detections.id", ondelete="CASCADE"), nullable=False
    )
    crop_path: Mapped[str] = mapped_column(Text, nullable=False)
    side: Mapped[Optional[str]] = mapped_column(String(16))
    quality_score: Mapped[Optional[float]] = mapped_column(Float)
    extraction_confidence: Mapped[Optional[float]] = mapped_column(Float)
    model_name: Mapped[Optional[str]] = mapped_column(String(120))
    model_version: Mapped[Optional[str]] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    detection: Mapped["Detection"] = relationship("Detection", back_populates="flank_crops")
    embeddings: Mapped[List["TigerEmbedding"]] = relationship("TigerEmbedding", back_populates="flank_crop")


class Tiger(Base):
    __tablename__ = "tigers"
    __table_args__ = {"schema": SCHEMA_NAME}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    public_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(120))
    sex: Mapped[Optional[str]] = mapped_column(String(16))
    status: Mapped[str] = mapped_column(String(24), default="CANDIDATE", nullable=False)
    first_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    identity_confidence: Mapped[Optional[float]] = mapped_column(Float)
    verified_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True))
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    representative_image_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True))
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    embeddings: Mapped[List["TigerEmbedding"]] = relationship("TigerEmbedding", back_populates="tiger", cascade="all, delete-orphan")
    observations: Mapped[List["Observation"]] = relationship("Observation", back_populates="tiger")
    baselines: Mapped[List["MovementBaseline"]] = relationship("MovementBaseline", back_populates="tiger")
    alerts: Mapped[List["Alert"]] = relationship("Alert", back_populates="tiger")


class TigerEmbedding(Base):
    __tablename__ = "tiger_embeddings"
    __table_args__ = {"schema": SCHEMA_NAME}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tiger_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.tigers.id", ondelete="CASCADE"), nullable=False
    )
    flank_crop_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.flank_crops.id", ondelete="SET NULL")
    )
    embedding = mapped_column(Vector(512), nullable=False)
    model_name: Mapped[str] = mapped_column(String(120), nullable=False)
    model_version: Mapped[str] = mapped_column(String(64), nullable=False)
    quality_score: Mapped[Optional[float]] = mapped_column(Float)
    is_reference: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    tiger: Mapped["Tiger"] = relationship("Tiger", back_populates="embeddings")
    flank_crop: Mapped[Optional["FlankCrop"]] = relationship("FlankCrop", back_populates="embeddings")


class Observation(Base):
    __tablename__ = "observations"
    __table_args__ = (
        UniqueConstraint("tiger_id", "image_id", name="uq_observation_tiger_image"),
        {"schema": SCHEMA_NAME},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tiger_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.tigers.id"), nullable=False
    )
    image_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.images.id"), nullable=False
    )
    camera_station_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.camera_stations.id"), nullable=False
    )
    flank_crop_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.flank_crops.id")
    )
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    location = mapped_column(Geography(geometry_type="POINT", srid=4326), nullable=False)
    identity_confidence: Mapped[float] = mapped_column(Float, nullable=False)
    identity_method: Mapped[str] = mapped_column(String(32), nullable=False)
    verification_status: Mapped[str] = mapped_column(String(24), default="AUTO", nullable=False)
    source_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.import_runs.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    tiger: Mapped["Tiger"] = relationship("Tiger", back_populates="observations")
    camera_station: Mapped["CameraStation"] = relationship("CameraStation", back_populates="observations")


class SpatialSnapshot(Base):
    __tablename__ = "spatial_snapshots"
    __table_args__ = {"schema": SCHEMA_NAME}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tiger_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.tigers.id"), nullable=False
    )
    import_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.import_runs.id"), nullable=False
    )
    analysis_window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    analysis_window_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    activity_centroid = mapped_column(Geography(geometry_type="POINT", srid=4326), nullable=True)
    occupied_area_km2: Mapped[Optional[float]] = mapped_column(Numeric(14, 4))
    range_geometry = mapped_column(Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=True)
    estimator: Mapped[str] = mapped_column(String(64), nullable=False)
    observation_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    parameters: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class MovementBaseline(Base):
    __tablename__ = "movement_baselines"
    __table_args__ = {"schema": SCHEMA_NAME}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tiger_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.tigers.id"), nullable=False
    )
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    valid_to: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    observation_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    centroid = mapped_column(Geography(geometry_type="POINT", srid=4326), nullable=True)
    range_geometry = mapped_column(Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=True)
    range_area_km2: Mapped[Optional[float]] = mapped_column(Numeric(14, 4))
    known_camera_ids: Mapped[list] = mapped_column(ARRAY(UUID(as_uuid=True)), default=list, nullable=False)
    known_zone_types: Mapped[list] = mapped_column(ARRAY(String(32)), default=list, nullable=False)
    baseline_policy: Mapped[str] = mapped_column(String(64), nullable=False)
    parameters: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    tiger: Mapped["Tiger"] = relationship("Tiger", back_populates="baselines")


class Alert(Base):
    __tablename__ = "alerts"
    __table_args__ = (
        UniqueConstraint("observation_id", "alert_type", "rule_version", name="uq_alert_obs_type_rule"),
        {"schema": SCHEMA_NAME},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tiger_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.tigers.id"), nullable=False
    )
    observation_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.observations.id")
    )
    baseline_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.movement_baselines.id")
    )
    alert_type: Mapped[str] = mapped_column(String(40), nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="OPEN", nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    rule_version: Mapped[str] = mapped_column(String(64), nullable=False)
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    resolution_reason: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    tiger: Mapped["Tiger"] = relationship("Tiger", back_populates="alerts")
    evidence: Mapped[List["AlertEvidence"]] = relationship("AlertEvidence", back_populates="alert", cascade="all, delete-orphan")


class AlertEvidence(Base):
    __tablename__ = "alert_evidence"
    __table_args__ = {"schema": SCHEMA_NAME}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.alerts.id", ondelete="CASCADE"), nullable=False
    )
    evidence_type: Mapped[str] = mapped_column(String(40), nullable=False)
    observation_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.observations.id")
    )
    image_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey(f"{SCHEMA_NAME}.images.id")
    )
    evidence_json: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    alert: Mapped["Alert"] = relationship("Alert", back_populates="evidence")


class ReviewTask(Base):
    __tablename__ = "review_tasks"
    __table_args__ = {"schema": SCHEMA_NAME}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_type: Mapped[str] = mapped_column(String(32), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="OPEN", nullable=False)
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True))
    decision: Mapped[Optional[str]] = mapped_column(String(64))
    decision_reason: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)


class AuditEvent(Base):
    __tablename__ = "audit_events"
    __table_args__ = {"schema": SCHEMA_NAME}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_type: Mapped[str] = mapped_column(String(24), nullable=False)
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True))
    action: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True))
    before_state: Mapped[Optional[dict]] = mapped_column(JSONB)
    after_state: Mapped[Optional[dict]] = mapped_column(JSONB)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
