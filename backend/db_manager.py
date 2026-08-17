"""
Database Session Manager & Persistence Services for TigerTrace.
Handles pooled transactions, SHA-256 deduplication, pgvector cosine search,
movement deviation checks, and audit trails.
"""

import hashlib
import json
import logging
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional, Tuple

import numpy as np
from sqlalchemy import create_engine, func, select, text
from sqlalchemy.orm import Session, sessionmaker

from config import settings
from db_models import (
    Alert,
    AlertEvidence,
    AuditEvent,
    Base,
    CameraStation,
    Detection,
    FlankCrop,
    ImageMetadata,
    ImageRecord,
    ImportRun,
    MovementBaseline,
    Observation,
    ReviewTask,
    Tiger,
    TigerEmbedding,
    Zone,
)

logger = logging.getLogger("TigerTrace.DBManager")


class DatabaseManager:
    """Manages PostgreSQL connection pools and transactional persistence."""

    def __init__(self, database_url: Optional[str] = None):
        self.database_url = database_url or settings.DATABASE_URL
        self.is_connected = False
        self.engine = None
        self.SessionLocal = None

        # Offline in-memory state fallback if PostgreSQL server is offline
        self._offline_tigers: Dict[uuid.UUID, Tiger] = {}
        self._offline_embeddings: List[Tuple[uuid.UUID, List[float], uuid.UUID, bool]] = []
        self._offline_observations: List[Observation] = []
        self._offline_images: Dict[str, ImageRecord] = {}
        self._offline_stations: Dict[str, CameraStation] = {}
        self._offline_alerts: List[Alert] = []

        self._initialize_connection()

    def _initialize_connection(self) -> None:
        """Attempt to connect to PostgreSQL with PostGIS and pgvector with instant timeout."""
        import socket
        try:
            # Ultra-fast 0.2s socket probe to check if PostgreSQL port is open
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.2)
            result = sock.connect_ex((settings.POSTGRES_HOST, settings.POSTGRES_PORT))
            sock.close()

            if result != 0:
                logger.info(
                    f"PostgreSQL port {settings.POSTGRES_PORT} not open. "
                    "Running DatabaseManager in instant offline in-memory persistence mode."
                )
                self.is_connected = False
                self._seed_offline_catalogue()
                return

            self.engine = create_engine(
                self.database_url,
                pool_size=settings.DATABASE_POOL_SIZE,
                max_overflow=settings.DATABASE_MAX_OVERFLOW,
                echo=settings.DB_ECHO,
                connect_args={
                    "connect_timeout": 1,
                    "options": f"-c search_path={settings.DB_SCHEMA},public"
                } if "psycopg" in self.database_url else {"connect_timeout": 1}
            )
            # Test connection with a quick ping
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine,
                expire_on_commit=False,
            )
            self.is_connected = True
            logger.info("Connected to PostgreSQL 16 (PostGIS + pgvector).")
        except Exception as err:
            logger.info(
                f"PostgreSQL connection offline ({err}). "
                "Running DatabaseManager in offline in-memory persistence mode."
            )
            self.is_connected = False
            self._seed_offline_catalogue()

    def _seed_offline_catalogue(self) -> None:
        """Pre-populate the offline catalogue with known Pench tigers and reference embeddings."""
        seeds = [
            ("11111111-1111-1111-1111-111111111111", "TGR-001", "Bagheera (Dominant Male)", "MALE"),
            ("22222222-2222-2222-2222-222222222222", "TGR-002", "Collarwali Lineage (Female)", "FEMALE"),
            ("33333333-3333-3333-3333-333333333333", "TGR-003", "Langdi (Sub-adult)", "FEMALE"),
            ("44444444-4444-4444-4444-444444444444", "TGR-004", "Raiyyakassa Male", "MALE"),
        ]

        for uid_str, code, name, sex in seeds:
            uid = uuid.UUID(uid_str)
            if uid not in self._offline_tigers:
                tiger = Tiger(
                    id=uid,
                    public_code=code,
                    name=name,
                    sex=sex,
                    status="VERIFIED",
                    first_seen_at=datetime.now(timezone.utc),
                    last_seen_at=datetime.now(timezone.utc),
                    identity_confidence=0.95,
                    metadata_json={"territory": "Pench Core Reserve", "source": "SEED_CATALOGUE"},
                )
                self._offline_tigers[uid] = tiger

        # Check if ATRW test gallery images exist to compute real reference embeddings
        reid_test_dir = settings.ATRW_DIR / "reid" / "images_test"
        if reid_test_dir.exists():
            import cv2
            from reid_extractor import ReIDFeatureExtractor
            extractor = None

            for tiger_uid, tiger_obj in list(self._offline_tigers.items()):
                # Find matching sample images for this tiger
                matching_imgs = list(reid_test_dir.glob(f"{tiger_obj.public_code}_*.jpg"))
                if matching_imgs and not any(emb[0] == tiger_uid for emb in self._offline_embeddings):
                    if extractor is None:
                        extractor = ReIDFeatureExtractor()
                    for img_path in matching_imgs[:2]:
                        img = cv2.imread(str(img_path))
                        if img is not None:
                            emb_vec = extractor.extract_embedding(img).tolist()
                            self._offline_embeddings.append((tiger_uid, emb_vec, uuid.uuid4(), True))
                            logger.info(f"Loaded reference embedding for {tiger_obj.public_code} from {img_path.name}")

    @contextmanager
    def get_session(self) -> Generator[Optional[Session], None, None]:
        """Provide a transactional database session or offline context."""
        if self.is_connected and self.SessionLocal is not None:
            session = self.SessionLocal()
            try:
                yield session
                session.commit()
            except Exception as err:
                session.rollback()
                logger.error(f"Database transaction rolled back: {err}")
                raise
            finally:
                session.close()
        else:
            # Standalone offline mock session
            yield None

    def calculate_file_sha256(self, file_path: Path) -> str:
        """Compute SHA-256 hex digest for content-level deduplication."""
        hasher = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest()

    # -------------------------------------------------------------------------
    # Ingestion & Run Management
    # -------------------------------------------------------------------------
    def create_import_run(
        self,
        mode: str = "FIELD",
        source_path: str = "./data/input_stream",
        config_snapshot: Optional[Dict[str, Any]] = None,
    ) -> uuid.UUID:
        """Register the start of a new camera ingestion run."""
        run_id = uuid.uuid4()
        with self.get_session() as session:
            if session:
                run = ImportRun(
                    id=run_id,
                    mode=mode,
                    source_path=str(source_path),
                    status="RUNNING",
                    started_at=datetime.now(timezone.utc),
                    configuration_snapshot=config_snapshot or {},
                )
                session.add(run)
                session.flush()
        return run_id

    def finish_import_run(
        self,
        run_id: uuid.UUID,
        total_files: int,
        valid_files: int,
        corrupt_files: int,
        blank_files: int,
        useful_files: int,
        tiger_detections: int,
        new_tigers: int,
        alerts_created: int,
        storage_saved_bytes: int,
        processing_seconds: float,
        error_summary: Optional[List[Dict[str, Any]]] = None,
        status: str = "SUCCEEDED",
    ) -> None:
        """Update and close an import run with summary metrics."""
        with self.get_session() as session:
            if session:
                run = session.get(ImportRun, run_id)
                if run:
                    run.status = status
                    run.completed_at = datetime.now(timezone.utc)
                    run.total_files = total_files
                    run.valid_files = valid_files
                    run.corrupt_files = corrupt_files
                    run.blank_files = blank_files
                    run.useful_files = useful_files
                    run.tiger_detections = tiger_detections
                    run.new_tigers = new_tigers
                    run.alerts_created = alerts_created
                    run.storage_saved_bytes = storage_saved_bytes
                    run.processing_seconds = processing_seconds
                    run.error_summary = error_summary or []

    # -------------------------------------------------------------------------
    # Camera Stations & Zones
    # -------------------------------------------------------------------------
    def get_or_create_camera_station(
        self,
        code: str,
        name: Optional[str] = None,
        zone_type: str = "CORE",
        longitude: float = 79.2500,
        latitude: float = 21.6500,
        simulation: bool = False,
    ) -> CameraStation:
        """Retrieve existing station or register a new one with PostGIS location."""
        with self.get_session() as session:
            if session:
                stmt = select(CameraStation).where(CameraStation.code == code)
                station = session.execute(stmt).scalar_one_or_none()
                if not station:
                    station = CameraStation(
                        code=code,
                        name=name or f"Camera Station {code}",
                        zone_type=zone_type,
                        location=func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326),
                        simulation=simulation,
                    )
                    session.add(station)
                    session.flush()
                return station
            else:
                if code not in self._offline_stations:
                    self._offline_stations[code] = CameraStation(
                        id=uuid.uuid4(),
                        code=code,
                        name=name or f"Camera Station {code}",
                        zone_type=zone_type,
                        simulation=simulation,
                    )
                return self._offline_stations[code]

    # -------------------------------------------------------------------------
    # Image Deduplication and Persistence
    # -------------------------------------------------------------------------
    def find_image_by_sha256(self, sha256_hash: str) -> Optional[ImageRecord]:
        """Check if an image has already been ingested."""
        with self.get_session() as session:
            if session:
                stmt = select(ImageRecord).where(ImageRecord.sha256 == sha256_hash)
                return session.execute(stmt).scalar_one_or_none()
            return self._offline_images.get(sha256_hash)

    def persist_image(
        self,
        camera_station_id: uuid.UUID,
        import_run_id: uuid.UUID,
        file_path: str,
        original_filename: str,
        sha256_hash: str,
        size_bytes: int,
        captured_at: Optional[datetime] = None,
        mime_type: str = "image/jpeg",
        status: str = "INGESTED",
        classification: Optional[str] = None,
        classification_confidence: Optional[float] = None,
        quarantine_path: Optional[str] = None,
        is_quarantined: bool = False,
        raw_metadata: Optional[Dict[str, Any]] = None,
    ) -> ImageRecord:
        """Save canonical image record and normalized metadata."""
        img_record = ImageRecord(
            id=uuid.uuid4(),
            camera_station_id=camera_station_id,
            import_run_id=import_run_id,
            file_path=str(file_path),
            original_filename=original_filename,
            sha256=sha256_hash,
            mime_type=mime_type,
            size_bytes=size_bytes,
            captured_at=captured_at,
            status=status,
            classification=classification,
            classification_confidence=classification_confidence,
            quarantine_path=str(quarantine_path) if quarantine_path else None,
            is_quarantined=is_quarantined,
        )

        with self.get_session() as session:
            if session:
                session.add(img_record)
                session.flush()

                meta = ImageMetadata(
                    image_id=img_record.id,
                    source_timestamp=captured_at.isoformat() if captured_at else None,
                    parsed_timestamp=captured_at,
                    timestamp_source="EXIF" if captured_at else "FILESYSTEM",
                    raw_metadata=raw_metadata or {},
                )
                session.add(meta)
                session.flush()
            else:
                self._offline_images[sha256_hash] = img_record

        return img_record

    def update_image_quarantine(
        self, image_id: uuid.UUID, quarantine_path: str, classification: str = "BLANK", confidence: float = 0.0
    ) -> None:
        """Mark an image as quarantined false-trigger."""
        with self.get_session() as session:
            if session:
                img = session.get(ImageRecord, image_id)
                if img:
                    img.status = "QUARANTINED"
                    img.classification = classification
                    img.classification_confidence = confidence
                    img.quarantine_path = str(quarantine_path)
                    img.is_quarantined = True

    # -------------------------------------------------------------------------
    # Detections & Flank Crops
    # -------------------------------------------------------------------------
    def persist_detection(
        self,
        image_id: uuid.UUID,
        class_name: str,
        confidence: float,
        bbox: Dict[str, float],
        model_name: str = "MDV6-yolov10-e",
        model_version: str = "v6.0",
    ) -> Detection:
        """Save MegaDetector object detection output."""
        det = Detection(
            id=uuid.uuid4(),
            image_id=image_id,
            class_name=class_name,
            confidence=confidence,
            bbox=bbox,
            model_name=model_name,
            model_version=model_version,
        )
        with self.get_session() as session:
            if session:
                session.add(det)
                session.flush()
        return det

    def persist_flank_crop(
        self,
        detection_id: uuid.UUID,
        crop_path: str,
        side: Optional[str] = "UNKNOWN",
        quality_score: float = 1.0,
        extraction_confidence: float = 1.0,
        model_name: str = "TigerFlankDetector",
        model_version: str = "v1.0",
    ) -> FlankCrop:
        """Save flank crop record for downstream Re-ID."""
        flank = FlankCrop(
            id=uuid.uuid4(),
            detection_id=detection_id,
            crop_path=str(crop_path),
            side=side,
            quality_score=quality_score,
            extraction_confidence=extraction_confidence,
            model_name=model_name,
            model_version=model_version,
        )
        with self.get_session() as session:
            if session:
                session.add(flank)
                session.flush()
        return flank

    # -------------------------------------------------------------------------
    # Re-ID & pgvector Candidate Matching
    # -------------------------------------------------------------------------
    def query_top_k_reid_candidates(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        only_references: bool = False,
    ) -> List[Tuple[Tiger, float, uuid.UUID]]:
        """
        Execute cosine similarity search using pgvector (<=> operator).
        Returns list of (Tiger, Cosine_Similarity, embedding_id).
        """
        norm_emb = np.array(query_embedding, dtype=np.float32)
        norm_val = np.linalg.norm(norm_emb)
        if norm_val > 0:
            norm_emb = (norm_emb / norm_val).tolist()
        else:
            norm_emb = query_embedding

        with self.get_session() as session:
            if session:
                emb_str = "[" + ",".join(str(x) for x in norm_emb) + "]"
                ref_filter = "AND te.is_reference = TRUE" if only_references else ""

                query = text(f"""
                    SELECT
                        t.id AS tiger_id,
                        t.public_code,
                        t.name,
                        t.sex,
                        t.status,
                        t.identity_confidence,
                        te.id AS embedding_id,
                        1 - (te.embedding <=> '{emb_str}'::vector) AS similarity
                    FROM tigertrace.tiger_embeddings te
                    JOIN tigertrace.tigers t ON t.id = te.tiger_id
                    WHERE t.status IN ('ACTIVE', 'VERIFIED', 'CANDIDATE')
                    {ref_filter}
                    ORDER BY te.embedding <=> '{emb_str}'::vector ASC
                    LIMIT :limit;
                """)

                results = session.execute(query, {"limit": top_k}).fetchall()
                candidates = []
                for row in results:
                    tiger = Tiger(
                        id=row.tiger_id,
                        public_code=row.public_code,
                        name=row.name,
                        sex=row.sex,
                        status=row.status,
                        identity_confidence=row.identity_confidence,
                    )
                    similarity = float(row.similarity)
                    embedding_id = row.embedding_id
                    candidates.append((tiger, similarity, embedding_id))
                return candidates
            else:
                # Offline in-memory exact cosine similarity calculation
                q_vec = np.array(norm_emb, dtype=np.float32)
                sim_list = []
                for t_id, emb, emb_id, is_ref in self._offline_embeddings:
                    if only_references and not is_ref:
                        continue
                    db_vec = np.array(emb, dtype=np.float32)
                    sim = float(np.dot(q_vec, db_vec))
                    tiger = self._offline_tigers.get(t_id)
                    if tiger:
                        sim_list.append((tiger, sim, emb_id))

                sim_list.sort(key=lambda x: x[1], reverse=True)
                return sim_list[:top_k]

    def get_next_tiger_code(self) -> str:
        """Generate next sequential public tiger code e.g. TGR-005."""
        with self.get_session() as session:
            if session:
                stmt = select(func.count(Tiger.id))
                count = session.execute(stmt).scalar_one() or 0
                return f"TGR-{(count + 1):03d}"
            else:
                count = len(self._offline_tigers)
                return f"TGR-{(count + 1):03d}"

    def enroll_new_tiger(
        self,
        public_code: Optional[str] = None,
        name: Optional[str] = None,
        sex: str = "UNKNOWN",
        initial_confidence: float = 0.85,
        representative_image_id: Optional[uuid.UUID] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Tiger:
        """Auto-enroll a new candidate tiger in the catalogue."""
        code = public_code or self.get_next_tiger_code()
        tiger = Tiger(
            id=uuid.uuid4(),
            public_code=code,
            name=name or f"Candidate {code}",
            sex=sex,
            status="CANDIDATE",
            first_seen_at=datetime.now(timezone.utc),
            last_seen_at=datetime.now(timezone.utc),
            identity_confidence=initial_confidence,
            representative_image_id=representative_image_id,
            metadata_json=metadata or {},
        )
        with self.get_session() as session:
            if session:
                session.add(tiger)
                session.flush()
            else:
                self._offline_tigers[tiger.id] = tiger
        return tiger

    def persist_tiger_embedding(
        self,
        tiger_id: uuid.UUID,
        embedding: List[float],
        flank_crop_id: Optional[uuid.UUID] = None,
        model_name: str = "MegaDescriptor-T-224",
        model_version: str = "v1.0",
        quality_score: float = 1.0,
        is_reference: bool = True,
    ) -> TigerEmbedding:
        """Save a 512-D vector embedding into tiger_embeddings."""
        norm_emb = np.array(embedding, dtype=np.float32)
        norm_val = np.linalg.norm(norm_emb)
        if norm_val > 0:
            norm_emb = (norm_emb / norm_val).tolist()
        else:
            norm_emb = embedding

        emb_record = TigerEmbedding(
            id=uuid.uuid4(),
            tiger_id=tiger_id,
            flank_crop_id=flank_crop_id,
            embedding=norm_emb,
            model_name=model_name,
            model_version=model_version,
            quality_score=quality_score,
            is_reference=is_reference,
        )

        with self.get_session() as session:
            if session:
                session.add(emb_record)
                session.flush()
            else:
                self._offline_embeddings.append((tiger_id, norm_emb, emb_record.id, is_reference))

        return emb_record

    # -------------------------------------------------------------------------
    # Observations & Movement Deviations
    # -------------------------------------------------------------------------
    def persist_observation(
        self,
        tiger_id: uuid.UUID,
        image_id: uuid.UUID,
        camera_station_id: uuid.UUID,
        observed_at: datetime,
        flank_crop_id: Optional[uuid.UUID] = None,
        identity_confidence: float = 0.95,
        identity_method: str = "REID",
        verification_status: str = "AUTO",
        source_run_id: Optional[uuid.UUID] = None,
    ) -> Observation:
        """Persist confirmed tiger observation with station location."""
        obs = Observation(
            id=uuid.uuid4(),
            tiger_id=tiger_id,
            image_id=image_id,
            camera_station_id=camera_station_id,
            flank_crop_id=flank_crop_id,
            observed_at=observed_at,
            identity_confidence=identity_confidence,
            identity_method=identity_method,
            verification_status=verification_status,
            source_run_id=source_run_id or uuid.uuid4(),
        )

        with self.get_session() as session:
            if session:
                station = session.get(CameraStation, camera_station_id)
                obs.location = station.location if station else func.ST_SetSRID(func.ST_MakePoint(79.25, 21.65), 4326)
                session.add(obs)
                session.flush()

                tiger = session.get(Tiger, tiger_id)
                if tiger:
                    if not tiger.first_seen_at or observed_at < tiger.first_seen_at:
                        tiger.first_seen_at = observed_at
                    if not tiger.last_seen_at or observed_at > tiger.last_seen_at:
                        tiger.last_seen_at = observed_at
            else:
                self._offline_observations.append(obs)
                tiger = self._offline_tigers.get(tiger_id)
                if tiger:
                    tiger.last_seen_at = observed_at

        return obs

    def evaluate_movement_alerts(
        self,
        tiger_id: uuid.UUID,
        observation_id: uuid.UUID,
        camera_station_id: uuid.UUID,
        observed_at: datetime,
    ) -> List[Alert]:
        """
        Check observation against tiger's historical baseline and reserve zones.
        Generates explainable alerts with evidence records.
        """
        created_alerts = []
        with self.get_session() as session:
            if session:
                station = session.get(CameraStation, camera_station_id)
                tiger = session.get(Tiger, tiger_id)
                if not station or not tiger:
                    return []

                stmt = select(MovementBaseline).where(
                    MovementBaseline.tiger_id == tiger_id
                ).order_by(MovementBaseline.valid_from.desc())
                baseline = session.execute(stmt).scalars().first()
            else:
                station = list(self._offline_stations.values())[0] if self._offline_stations else None
                tiger = self._offline_tigers.get(tiger_id)
                baseline = None

            if not station or not tiger:
                return []

            # Rule 1: Village Adjacent / Buffer Boundary Entry
            if station.zone_type in ["VILLAGE_ADJACENT", "BUFFER"]:
                alert = Alert(
                    id=uuid.uuid4(),
                    tiger_id=tiger_id,
                    observation_id=observation_id,
                    baseline_id=baseline.id if baseline else None,
                    alert_type="VILLAGE_PROXIMITY" if station.zone_type == "VILLAGE_ADJACENT" else "BUFFER_ENTRY",
                    severity="CRITICAL" if station.zone_type == "VILLAGE_ADJACENT" else "HIGH",
                    confidence=0.92,
                    title=f"Tiger {tiger.public_code} Detected in {station.zone_type.replace('_', ' ').title()}",
                    summary=(
                        f"Individual {tiger.public_code} ({tiger.name or 'Unknown'}) was observed at station "
                        f"{station.code} ({station.name}) located in {station.zone_type} zone on {observed_at.strftime('%Y-%m-%d %H:%M:%S')}."
                    ),
                    rule_version="DEV_RULE_ZONE_V1",
                    triggered_at=datetime.now(timezone.utc),
                )
                if session:
                    session.add(alert)
                    session.flush()

                    evidence = AlertEvidence(
                        alert_id=alert.id,
                        evidence_type="ZONE_MATCH",
                        observation_id=observation_id,
                        evidence_json={
                            "station_code": station.code,
                            "zone_type": station.zone_type,
                            "observed_at": observed_at.isoformat(),
                            "alert_threshold_meters": settings.VILLAGE_BUFFER_PROXIMITY_METERS,
                        },
                    )
                    session.add(evidence)
                else:
                    self._offline_alerts.append(alert)

                created_alerts.append(alert)

            return created_alerts

    # -------------------------------------------------------------------------
    # Review Queue & Audit Logging
    # -------------------------------------------------------------------------
    def create_review_task(
        self,
        task_type: str,
        entity_id: uuid.UUID,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> ReviewTask:
        """Queue an uncertain decision for human biologist verification."""
        task = ReviewTask(
            id=uuid.uuid4(),
            task_type=task_type,
            entity_id=entity_id,
            status="OPEN",
            metadata_json=metadata or {},
        )
        with self.get_session() as session:
            if session:
                session.add(task)
                session.flush()
        return task

    def log_audit_event(
        self,
        actor_type: str,
        action: str,
        entity_type: str,
        entity_id: Optional[uuid.UUID] = None,
        before_state: Optional[Dict[str, Any]] = None,
        after_state: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditEvent:
        """Record an immutable decision trace for auditability."""
        event = AuditEvent(
            id=uuid.uuid4(),
            actor_type=actor_type,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            before_state=before_state,
            after_state=after_state,
            metadata_json=metadata or {},
        )
        with self.get_session() as session:
            if session:
                session.add(event)
                session.flush()
        return event
