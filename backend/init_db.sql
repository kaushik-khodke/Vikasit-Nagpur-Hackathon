-- =============================================================================
-- TigerTrace PostgreSQL + PostGIS + pgvector Initialization Script
-- Target: Pench Tiger Reserve Wildlife Monitoring & Movement Intelligence
-- =============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Setup Schema Namespace
CREATE SCHEMA IF NOT EXISTS tigertrace;
SET search_path TO tigertrace, public;

-- =============================================================================
-- 3. Core Tables
-- =============================================================================

-- Camera Stations
CREATE TABLE IF NOT EXISTS tigertrace.camera_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    zone_type VARCHAR(32) NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    simulation BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    installed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (zone_type IN ('CORE', 'BUFFER', 'VILLAGE_ADJACENT', 'CORRIDOR', 'UNKNOWN'))
);

-- Reserve Zones
CREATE TABLE IF NOT EXISTS tigertrace.zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(160) NOT NULL,
    zone_type VARCHAR(32) NOT NULL,
    geometry GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    priority SMALLINT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (zone_type IN ('CORE', 'BUFFER', 'VILLAGE_ADJACENT', 'CORRIDOR', 'HUMAN_SETTLEMENT'))
);

-- Ingestion & Processing Runs
CREATE TABLE IF NOT EXISTS tigertrace.import_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode VARCHAR(24) NOT NULL,
    source_path TEXT NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'QUEUED',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    total_files INTEGER NOT NULL DEFAULT 0,
    valid_files INTEGER NOT NULL DEFAULT 0,
    corrupt_files INTEGER NOT NULL DEFAULT 0,
    blank_files INTEGER NOT NULL DEFAULT 0,
    useful_files INTEGER NOT NULL DEFAULT 0,
    tiger_detections INTEGER NOT NULL DEFAULT 0,
    new_tigers INTEGER NOT NULL DEFAULT 0,
    alerts_created INTEGER NOT NULL DEFAULT 0,
    storage_saved_bytes BIGINT NOT NULL DEFAULT 0,
    processing_seconds NUMERIC(12,3),
    error_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
    configuration_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (mode IN ('SIMULATION', 'FIELD', 'BENCHMARK')),
    CHECK (status IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'CANCELLED'))
);

-- Ingested Images
CREATE TABLE IF NOT EXISTS tigertrace.images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_station_id UUID NOT NULL REFERENCES tigertrace.camera_stations(id),
    import_run_id UUID NOT NULL REFERENCES tigertrace.import_runs(id),
    file_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    sha256 CHAR(64) NOT NULL UNIQUE,
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    captured_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'INGESTED',
    classification VARCHAR(32),
    classification_confidence REAL,
    quarantine_path TEXT,
    is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (status IN ('INGESTED', 'PROCESSING', 'PROCESSED', 'QUARANTINED', 'RESTORED', 'CORRUPT', 'ERROR')),
    CHECK (classification IS NULL OR classification IN ('BLANK', 'WILDLIFE', 'TIGER', 'HUMAN', 'VEHICLE', 'OTHER'))
);

-- Image Metadata
CREATE TABLE IF NOT EXISTS tigertrace.image_metadata (
    image_id UUID PRIMARY KEY REFERENCES tigertrace.images(id) ON DELETE CASCADE,
    source_timestamp TEXT,
    parsed_timestamp TIMESTAMPTZ,
    timestamp_source VARCHAR(32),
    camera_clock_offset_seconds INTEGER,
    gps_source VARCHAR(32),
    location GEOGRAPHY(POINT, 4326),
    metadata_quality VARCHAR(24) NOT NULL DEFAULT 'OK',
    raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Object Detections (MegaDetector v6)
CREATE TABLE IF NOT EXISTS tigertrace.detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID NOT NULL REFERENCES tigertrace.images(id) ON DELETE CASCADE,
    class_name VARCHAR(32) NOT NULL,
    confidence REAL NOT NULL,
    bbox JSONB NOT NULL,
    model_name VARCHAR(120) NOT NULL,
    model_version VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (confidence >= 0 AND confidence <= 1)
);

-- Flank Crops for Re-ID
CREATE TABLE IF NOT EXISTS tigertrace.flank_crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detection_id UUID NOT NULL REFERENCES tigertrace.detections(id) ON DELETE CASCADE,
    crop_path TEXT NOT NULL,
    side VARCHAR(16),
    quality_score REAL,
    extraction_confidence REAL,
    model_name VARCHAR(120),
    model_version VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (side IS NULL OR side IN ('LEFT', 'RIGHT', 'UNKNOWN'))
);

-- Tigers Catalogue
CREATE TABLE IF NOT EXISTS tigertrace.tigers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(120),
    sex VARCHAR(16),
    status VARCHAR(24) NOT NULL DEFAULT 'CANDIDATE',
    first_seen_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,
    identity_confidence REAL,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    representative_image_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (status IN ('CANDIDATE', 'VERIFIED', 'ACTIVE', 'INACTIVE', 'MERGED', 'REJECTED')),
    CHECK (identity_confidence IS NULL OR identity_confidence BETWEEN 0 AND 1)
);

-- Tiger Metric Vector Embeddings (MegaDescriptor 512D)
CREATE TABLE IF NOT EXISTS tigertrace.tiger_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tiger_id UUID NOT NULL REFERENCES tigertrace.tigers(id) ON DELETE CASCADE,
    flank_crop_id UUID REFERENCES tigertrace.flank_crops(id) ON DELETE SET NULL,
    embedding VECTOR(512) NOT NULL,
    model_name VARCHAR(120) NOT NULL,
    model_version VARCHAR(64) NOT NULL,
    quality_score REAL,
    is_reference BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Confirmed Tiger Observations
CREATE TABLE IF NOT EXISTS tigertrace.observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tiger_id UUID NOT NULL REFERENCES tigertrace.tigers(id),
    image_id UUID NOT NULL REFERENCES tigertrace.images(id),
    camera_station_id UUID NOT NULL REFERENCES tigertrace.camera_stations(id),
    flank_crop_id UUID REFERENCES tigertrace.flank_crops(id),
    observed_at TIMESTAMPTZ NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    identity_confidence REAL NOT NULL,
    identity_method VARCHAR(32) NOT NULL,
    verification_status VARCHAR(24) NOT NULL DEFAULT 'AUTO',
    source_run_id UUID NOT NULL REFERENCES tigertrace.import_runs(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (identity_method IN ('REID', 'HUMAN', 'SIMULATION', 'GROUND_TRUTH')),
    CHECK (verification_status IN ('AUTO', 'REVIEW_REQUIRED', 'VERIFIED', 'REJECTED')),
    CHECK (identity_confidence BETWEEN 0 AND 1),
    CONSTRAINT uq_observation_tiger_image UNIQUE (tiger_id, image_id)
);

-- Spatial Snapshots (Reproducible Spatial Range Analysis)
CREATE TABLE IF NOT EXISTS tigertrace.spatial_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tiger_id UUID NOT NULL REFERENCES tigertrace.tigers(id),
    import_run_id UUID NOT NULL REFERENCES tigertrace.import_runs(id),
    analysis_window_start TIMESTAMPTZ NOT NULL,
    analysis_window_end TIMESTAMPTZ NOT NULL,
    activity_centroid GEOGRAPHY(POINT, 4326),
    occupied_area_km2 NUMERIC(14,4),
    range_geometry GEOMETRY(MULTIPOLYGON, 4326),
    estimator VARCHAR(64) NOT NULL,
    observation_count INTEGER NOT NULL DEFAULT 0,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Historical Movement Baselines
CREATE TABLE IF NOT EXISTS tigertrace.movement_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tiger_id UUID NOT NULL REFERENCES tigertrace.tigers(id),
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ,
    observation_count INTEGER NOT NULL DEFAULT 0,
    centroid GEOGRAPHY(POINT, 4326),
    range_geometry GEOMETRY(MULTIPOLYGON, 4326),
    range_area_km2 NUMERIC(14,4),
    known_camera_ids UUID[] NOT NULL DEFAULT '{}',
    known_zone_types VARCHAR(32)[] NOT NULL DEFAULT '{}',
    baseline_policy VARCHAR(64) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Movement Deviation Alerts
CREATE TABLE IF NOT EXISTS tigertrace.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tiger_id UUID NOT NULL REFERENCES tigertrace.tigers(id),
    observation_id UUID REFERENCES tigertrace.observations(id),
    baseline_id UUID REFERENCES tigertrace.movement_baselines(id),
    alert_type VARCHAR(40) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'OPEN',
    confidence REAL NOT NULL,
    title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,
    rule_version VARCHAR(64) NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolution_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (alert_type IN ('NEW_STATION', 'RANGE_SHIFT', 'BUFFER_ENTRY', 'VILLAGE_PROXIMITY', 'PROLONGED_ABSENCE', 'SURVEY_ARTIFACT')),
    CHECK (severity IN ('INFO', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'CONFIRMED', 'DISMISSED', 'RESOLVED')),
    CHECK (confidence BETWEEN 0 AND 1),
    CONSTRAINT uq_alert_obs_type_rule UNIQUE (observation_id, alert_type, rule_version)
);

-- Alert Evidence Chain
CREATE TABLE IF NOT EXISTS tigertrace.alert_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES tigertrace.alerts(id) ON DELETE CASCADE,
    evidence_type VARCHAR(40) NOT NULL,
    observation_id UUID REFERENCES tigertrace.observations(id),
    image_id UUID REFERENCES tigertrace.images(id),
    evidence_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Human Review Queue
CREATE TABLE IF NOT EXISTS tigertrace.review_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type VARCHAR(32) NOT NULL,
    entity_id UUID NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'OPEN',
    assigned_to UUID,
    decision VARCHAR(64),
    decision_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    CHECK (task_type IN ('TIGER_MATCH', 'BLANK_IMAGE', 'NEW_TIGER', 'MOVEMENT_ALERT')),
    CHECK (status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

-- Audit Events
CREATE TABLE IF NOT EXISTS tigertrace.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type VARCHAR(24) NOT NULL,
    actor_id UUID,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id UUID,
    before_state JSONB,
    after_state JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 4. Spatial, Vector, and Query Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_camera_location ON tigertrace.camera_stations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_zones_geometry ON tigertrace.zones USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_images_camera_time ON tigertrace.images(camera_station_id, captured_at);
CREATE INDEX IF NOT EXISTS idx_images_run_status ON tigertrace.images(import_run_id, status);
CREATE INDEX IF NOT EXISTS idx_images_sha256 ON tigertrace.images(sha256);
CREATE INDEX IF NOT EXISTS idx_detections_image ON tigertrace.detections(image_id);
CREATE INDEX IF NOT EXISTS idx_observations_tiger_time ON tigertrace.observations(tiger_id, observed_at);
CREATE INDEX IF NOT EXISTS idx_observations_camera_time ON tigertrace.observations(camera_station_id, observed_at);
CREATE INDEX IF NOT EXISTS idx_observation_location ON tigertrace.observations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_spatial_range ON tigertrace.spatial_snapshots USING GIST(range_geometry);
CREATE INDEX IF NOT EXISTS idx_alerts_status_time ON tigertrace.alerts(status, triggered_at DESC);

-- HNSW Cosine Index for 512-D pgvector Search
CREATE INDEX IF NOT EXISTS idx_tiger_embedding ON tigertrace.tiger_embeddings USING hnsw (embedding vector_cosine_ops);

-- =============================================================================
-- 5. Read Views for Dashboard & Reporting
-- =============================================================================

CREATE OR REPLACE VIEW tigertrace.v_dashboard_summary AS
SELECT
    (SELECT COUNT(*) FROM tigertrace.tigers WHERE status IN ('ACTIVE', 'VERIFIED', 'CANDIDATE')) AS total_tigers,
    (SELECT COUNT(*) FROM tigertrace.camera_stations WHERE active = TRUE) AS active_cameras,
    (SELECT COUNT(*) FROM tigertrace.observations) AS total_observations,
    (SELECT COUNT(*) FROM tigertrace.alerts WHERE status = 'OPEN') AS open_alerts,
    (SELECT COUNT(*) FROM tigertrace.images WHERE is_quarantined = TRUE) AS quarantined_blanks,
    (SELECT COALESCE(SUM(storage_saved_bytes), 0) FROM tigertrace.import_runs) AS storage_saved_bytes;

CREATE OR REPLACE VIEW tigertrace.v_latest_tiger_observation AS
SELECT DISTINCT ON (o.tiger_id)
    o.tiger_id,
    t.public_code,
    t.name AS tiger_name,
    o.observed_at,
    cs.code AS camera_code,
    cs.name AS camera_name,
    cs.zone_type,
    ST_AsGeoJSON(o.location::geometry) AS location_geojson,
    o.identity_confidence
FROM tigertrace.observations o
JOIN tigertrace.tigers t ON t.id = o.tiger_id
JOIN tigertrace.camera_stations cs ON cs.id = o.camera_station_id
ORDER BY o.tiger_id, o.observed_at DESC;

CREATE OR REPLACE VIEW tigertrace.v_open_alerts AS
SELECT
    a.id AS alert_id,
    a.tiger_id,
    t.public_code AS tiger_code,
    t.name AS tiger_name,
    a.alert_type,
    a.severity,
    a.confidence,
    a.title,
    a.summary,
    a.triggered_at,
    o.camera_station_id,
    cs.code AS camera_code
FROM tigertrace.alerts a
JOIN tigertrace.tigers t ON t.id = a.tiger_id
LEFT JOIN tigertrace.observations o ON o.id = a.observation_id
LEFT JOIN tigertrace.camera_stations cs ON cs.id = o.camera_station_id
WHERE a.status = 'OPEN'
ORDER BY a.triggered_at DESC;

-- =============================================================================
-- 6. Initial Seed Data (Pench Tiger Reserve Simulation & Ground Truth)
-- =============================================================================

-- Camera Stations
INSERT INTO tigertrace.camera_stations (id, code, name, zone_type, location, simulation, installed_at, metadata)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'CAM-01', 'Pench Core East - Totladoh', 'CORE', ST_SetSRID(ST_MakePoint(79.2500, 21.6500), 4326)::geography, TRUE, '2026-01-01 00:00:00+00', '{"resolution": "1920x1080", "battery": 92}'::jsonb),
    ('c2222222-2222-2222-2222-222222222222', 'CAM-02', 'Pench Core West - Khursapar', 'CORE', ST_SetSRID(ST_MakePoint(79.2610, 21.6620), 4326)::geography, TRUE, '2026-01-01 00:00:00+00', '{"resolution": "1920x1080", "battery": 88}'::jsonb),
    ('c3333333-3333-3333-3333-333333333333', 'CAM-03', 'Pench Buffer North - Sillari Boundary', 'VILLAGE_ADJACENT', ST_SetSRID(ST_MakePoint(79.2900, 21.6850), 4326)::geography, TRUE, '2026-01-01 00:00:00+00', '{"resolution": "1920x1080", "battery": 95}'::jsonb)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, location = EXCLUDED.location;

-- Reserve Zones
INSERT INTO tigertrace.zones (id, name, zone_type, geometry, priority, metadata)
VALUES
    ('z1111111-1111-1111-1111-111111111111', 'Pench Critical Tiger Habitat (Core)', 'CORE',
     ST_SetSRID(ST_GeomFromText('MULTIPOLYGON(((79.20 21.60, 79.30 21.60, 79.30 21.70, 79.20 21.70, 79.20 21.60)))'), 4326), 1, '{"protected_status": "Strict Reserve"}'::jsonb),
    ('z2222222-2222-2222-2222-222222222222', 'Pench Buffer Zone', 'BUFFER',
     ST_SetSRID(ST_GeomFromText('MULTIPOLYGON(((79.18 21.58, 79.32 21.58, 79.32 21.72, 79.18 21.72, 79.18 21.58)))'), 4326), 2, '{"protected_status": "Eco-sensitive Buffer"}'::jsonb),
    ('z3333333-3333-3333-3333-333333333333', 'Sillari Village Fringe Area', 'VILLAGE_ADJACENT',
     ST_SetSRID(ST_GeomFromText('MULTIPOLYGON(((79.28 21.68, 79.31 21.68, 79.31 21.71, 79.28 21.71, 79.28 21.68)))'), 4326), 3, '{"settlement": "Sillari", "alert_level": "High"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Known Tigers Catalogue
INSERT INTO tigertrace.tigers (id, public_code, name, sex, status, identity_confidence, metadata)
VALUES
    ('t1111111-1111-1111-1111-111111111111', 'TGR-001', 'Bagheera (Dominant Male)', 'MALE', 'VERIFIED', 0.98, '{"territory": "Totladoh Core", "age_years": 6}'::jsonb),
    ('t2222222-2222-2222-2222-222222222222', 'TGR-002', 'Collarwali Lineage (Female)', 'FEMALE', 'VERIFIED', 0.96, '{"territory": "Khursapar", "age_years": 4}'::jsonb),
    ('t3333333-3333-3333-3333-333333333333', 'TGR-003', 'Langdi (Sub-adult)', 'FEMALE', 'ACTIVE', 0.92, '{"territory": "Pench-Kanha Corridor", "age_years": 3}'::jsonb),
    ('t4444444-4444-4444-4444-444444444444', 'TGR-004', 'Raiyyakassa Male', 'MALE', 'ACTIVE', 0.94, '{"territory": "Karmajhiri", "age_years": 7}'::jsonb)
ON CONFLICT (public_code) DO NOTHING;

-- Initial Movement Baseline for TGR-001 (Core-bound Male)
INSERT INTO tigertrace.movement_baselines (
    id, tiger_id, valid_from, observation_count, centroid, range_geometry, range_area_km2,
    known_camera_ids, known_zone_types, baseline_policy, parameters
)
VALUES (
    'b1111111-1111-1111-1111-111111111111',
    't1111111-1111-1111-1111-111111111111',
    '2026-01-01 00:00:00+00',
    12,
    ST_SetSRID(ST_MakePoint(79.2550, 21.6560), 4326)::geography,
    ST_SetSRID(ST_GeomFromText('MULTIPOLYGON(((79.24 21.64, 79.27 21.64, 79.27 21.67, 79.24 21.67, 79.24 21.64)))'), 4326),
    18.5,
    ARRAY['c1111111-1111-1111-1111-111111111111'::uuid, 'c2222222-2222-2222-2222-222222222222'::uuid],
    ARRAY['CORE'],
    'CONVEX_HULL_BUFFER_V1',
    '{"buffer_radius_meters": 1500, "min_observations": 5}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
