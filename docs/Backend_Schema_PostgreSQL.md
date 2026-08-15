# TigerTrace — Backend Database Schema

**PostgreSQL + PostGIS + pgvector | Production-Oriented MVP Schema**

**Project:** TigerTrace  
**Purpose:** Automated Camera-Trap Triage, Individual Tiger Identification & Movement Intelligence  
**MVP:** 3 simulated camera stations  
**Version:** 1.0  
**Database Decision:** **PostgreSQL only — SQLite is not part of the architecture.**

---

## 1. Purpose and Scope

This document defines the persistent backend schema for TigerTrace. It supports:

- Raw camera-trap ingestion
- Safe blank-image triage
- Tiger detection and re-identification
- Persistent tiger observations
- Camera/station/time/GPS relationships
- Spatial intelligence
- Movement baselines
- Movement-deviation alerts
- Alert evidence
- Human review
- Auditability

The source problem statement requires a persistent database linking each identified tiger to images, stations, timestamps and GPS locations, together with mapped occupancy and movement-deviation intelligence.

---

## 2. Database Stack

| Component | Technology | Purpose |
|---|---|---|
| Database | PostgreSQL 16+ | Single source of truth |
| Spatial | PostGIS | GPS, zones, range and overlap |
| Vector | pgvector | Re-ID embeddings and similarity search |
| ORM | SQLAlchemy 2.x | Persistence layer |
| Migrations | Alembic | Versioned schema |
| Driver | psycopg 3 | PostgreSQL connectivity |
| Backup | pg_dump / pgBackRest | Recovery |
| Pooling | SQLAlchemy pool; PgBouncer later | Connection management |

> **Important:** No SQLite database, SQLite fallback, or SQLite-specific repository implementation should be used.

---

## 3. PostgreSQL Extensions and Namespace

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS tigertrace;
SET search_path TO tigertrace, public;
```

### Extensions

- **PostGIS** — geography/geometry and spatial functions.
- **pgvector** — vector storage and nearest-neighbor search.
- **pgcrypto** — UUID generation utilities.

---

## 4. Entity Relationship Overview

```text
CAMERA_STATIONS ─────┐
                     │
IMAGES ──────────────┼── OBSERVATIONS ─── TIGERS ─── TIGER_EMBEDDINGS
   │                 │         │
   ▼                 │         ▼
DETECTIONS           │    SPATIAL_SNAPSHOTS
   │                 │         │
   ▼                 │    MOVEMENT_BASELINES
FLANK_CROPS          │         │
                     └─────────┼──────────┐
                               ▼          ▼
                             ALERTS   REVIEW_TASKS
                               │
                               ▼
                        ALERT_EVIDENCE

AUDIT_EVENTS record important automated/user actions.
ZONES support spatial classification and alert rules.
```

All UUIDs are internal identifiers. Public codes such as `TGR-001` and `CAM-01` are unique business identifiers.

---

# 5. Core Tables

| Table | Purpose |
|---|---|
| `camera_stations` | Physical/simulated camera configuration and location |
| `zones` | Reserve/core/buffer/village/corridor geometries |
| `import_runs` | One ingestion and processing execution |
| `images` | Canonical record for every ingested image |
| `image_metadata` | Normalized timestamps/GPS and source metadata |
| `detections` | AI object detections |
| `flank_crops` | Tiger flank/stripe crop outputs |
| `tigers` | Persistent individual tiger catalogue |
| `tiger_embeddings` | Re-ID vector references |
| `observations` | Confirmed tiger-camera-image-time-location events |
| `spatial_snapshots` | Reproducible spatial analytics |
| `movement_baselines` | Versioned historical movement baselines |
| `alerts` | Deviation events |
| `alert_evidence` | Evidence supporting alerts |
| `review_tasks` | Human-in-the-loop tasks |
| `audit_events` | Immutable trace of important decisions |

---

# 6. `camera_stations`

Stores physical or simulated camera station configuration.

```sql
CREATE TABLE tigertrace.camera_stations (
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

    CHECK (
        zone_type IN (
            'CORE',
            'BUFFER',
            'VILLAGE_ADJACENT',
            'CORRIDOR',
            'UNKNOWN'
        )
    )
);
```

### MVP

- `CAM-01` — Core
- `CAM-02` — Core / overlap
- `CAM-03` — Village-adjacent / buffer simulation

`simulation=true` for MVP cameras.

---

# 7. `zones`

Stores reserve zones used by spatial analytics and alert rules.

```sql
CREATE TABLE tigertrace.zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(160) NOT NULL,
    zone_type VARCHAR(32) NOT NULL,
    geometry GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    priority SMALLINT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

MVP may use explicitly labelled demo polygons. Production should use authoritative GIS layers.

---

# 8. `import_runs`

Represents one complete data-processing execution.

```sql
CREATE TABLE tigertrace.import_runs (
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

    CHECK (mode IN ('SIMULATION', 'FIELD')),
    CHECK (
        status IN (
            'QUEUED',
            'RUNNING',
            'SUCCEEDED',
            'PARTIAL',
            'FAILED',
            'CANCELLED'
        )
    )
);
```

---

# 9. `images`

Canonical record for every discovered image.

```sql
CREATE TABLE tigertrace.images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    camera_station_id UUID NOT NULL
        REFERENCES tigertrace.camera_stations(id),

    import_run_id UUID NOT NULL
        REFERENCES tigertrace.import_runs(id),

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

    CHECK (
        status IN (
            'INGESTED',
            'PROCESSING',
            'PROCESSED',
            'QUARANTINED',
            'RESTORED',
            'CORRUPT',
            'ERROR'
        )
    ),

    CHECK (
        classification IS NULL
        OR classification IN (
            'BLANK',
            'WILDLIFE',
            'TIGER',
            'HUMAN',
            'VEHICLE',
            'OTHER'
        )
    )
);
```

### Design Notes

- SHA-256 provides content-level deduplication.
- Original file paths remain traceable.
- Blank images are quarantined rather than permanently deleted.

---

# 10. `image_metadata`

Separates normalized metadata from the main image record.

```sql
CREATE TABLE tigertrace.image_metadata (
    image_id UUID PRIMARY KEY
        REFERENCES tigertrace.images(id)
        ON DELETE CASCADE,

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
```

This preserves messy field metadata and its provenance without corrupting the canonical image record.

---

# 11. `detections`

Stores AI object-detection outputs.

```sql
CREATE TABLE tigertrace.detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    image_id UUID NOT NULL
        REFERENCES tigertrace.images(id)
        ON DELETE CASCADE,

    class_name VARCHAR(32) NOT NULL,
    confidence REAL NOT NULL,

    bbox JSONB NOT NULL,

    model_name VARCHAR(120) NOT NULL,
    model_version VARCHAR(64) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK (confidence >= 0 AND confidence <= 1)
);
```

`bbox` is JSONB to support model-specific bounding-box metadata.

---

# 12. `flank_crops`

Stores derived flank/stripe-region information used for individual re-identification.

```sql
CREATE TABLE tigertrace.flank_crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    detection_id UUID NOT NULL
        REFERENCES tigertrace.detections(id)
        ON DELETE CASCADE,

    crop_path TEXT NOT NULL,

    side VARCHAR(16),
    quality_score REAL,
    extraction_confidence REAL,

    model_name VARCHAR(120),
    model_version VARCHAR(64),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

# 13. `tigers`

Persistent individual tiger catalogue.

```sql
CREATE TABLE tigertrace.tigers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    public_code VARCHAR(32) NOT NULL UNIQUE,

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

    CHECK (
        status IN (
            'CANDIDATE',
            'VERIFIED',
            'ACTIVE',
            'INACTIVE',
            'MERGED',
            'REJECTED'
        )
    ),

    CHECK (
        identity_confidence IS NULL
        OR identity_confidence BETWEEN 0 AND 1
    )
);
```

### Identity

`TGR-001` is a business identifier. It is not the PostgreSQL primary key.

---

# 14. `tiger_embeddings`

Stores local vector representations for flank/stripe re-identification.

```sql
CREATE TABLE tigertrace.tiger_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tiger_id UUID NOT NULL
        REFERENCES tigertrace.tigers(id)
        ON DELETE CASCADE,

    flank_crop_id UUID
        REFERENCES tigertrace.flank_crops(id),

    embedding VECTOR(512) NOT NULL,

    model_name VARCHAR(120) NOT NULL,
    model_version VARCHAR(64) NOT NULL,

    quality_score REAL,

    is_reference BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> `VECTOR(512)` is the initial interface contract. If the selected re-identification model produces another dimension, update the migration and model contract together.

For the small MVP catalogue, exact pgvector search is sufficient. HNSW can be enabled after scale and embedding behavior are validated.

---

# 15. `observations`

This is the central domain event connecting:

- Tiger
- Image
- Camera
- Timestamp
- GPS location
- Identity confidence
- Processing run

```sql
CREATE TABLE tigertrace.observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tiger_id UUID NOT NULL
        REFERENCES tigertrace.tigers(id),

    image_id UUID NOT NULL
        REFERENCES tigertrace.images(id),

    camera_station_id UUID NOT NULL
        REFERENCES tigertrace.camera_stations(id),

    flank_crop_id UUID
        REFERENCES tigertrace.flank_crops(id),

    observed_at TIMESTAMPTZ NOT NULL,

    location GEOGRAPHY(POINT, 4326) NOT NULL,

    identity_confidence REAL NOT NULL,

    identity_method VARCHAR(32) NOT NULL,

    verification_status VARCHAR(24)
        NOT NULL DEFAULT 'AUTO',

    source_run_id UUID NOT NULL
        REFERENCES tigertrace.import_runs(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK (
        identity_method IN (
            'REID',
            'HUMAN',
            'SIMULATION'
        )
    ),

    CHECK (
        verification_status IN (
            'AUTO',
            'REVIEW_REQUIRED',
            'VERIFIED',
            'REJECTED'
        )
    ),

    CHECK (
        identity_confidence BETWEEN 0 AND 1
    )
);
```

---

# 16. `spatial_snapshots`

Stores reproducible spatial-analysis results for a tiger and processing run.

```sql
CREATE TABLE tigertrace.spatial_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tiger_id UUID NOT NULL
        REFERENCES tigertrace.tigers(id),

    import_run_id UUID NOT NULL
        REFERENCES tigertrace.import_runs(id),

    analysis_window_start TIMESTAMPTZ NOT NULL,
    analysis_window_end TIMESTAMPTZ NOT NULL,

    activity_centroid GEOGRAPHY(POINT, 4326),

    occupied_area_km2 NUMERIC(14,4),

    range_geometry
        GEOMETRY(MULTIPOLYGON, 4326),

    estimator VARCHAR(64) NOT NULL,

    observation_count INTEGER NOT NULL DEFAULT 0,

    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

The MVP can use a documented convex-hull/buffer estimate. A validated ecological estimator can replace it later without changing the observation model.

---

# 17. `movement_baselines`

Versioned historical movement baseline used to determine abnormal behavior.

```sql
CREATE TABLE tigertrace.movement_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tiger_id UUID NOT NULL
        REFERENCES tigertrace.tigers(id),

    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ,

    observation_count INTEGER NOT NULL DEFAULT 0,

    centroid GEOGRAPHY(POINT, 4326),

    range_geometry
        GEOMETRY(MULTIPOLYGON, 4326),

    range_area_km2 NUMERIC(14,4),

    known_camera_ids UUID[]
        NOT NULL DEFAULT '{}',

    known_zone_types VARCHAR(32)[]
        NOT NULL DEFAULT '{}',

    baseline_policy VARCHAR(64) NOT NULL,

    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Baseline versioning makes every movement alert reproducible and explainable.

---

# 18. `alerts`

Stores actionable movement-deviation events.

```sql
CREATE TABLE tigertrace.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tiger_id UUID NOT NULL
        REFERENCES tigertrace.tigers(id),

    observation_id UUID
        REFERENCES tigertrace.observations(id),

    baseline_id UUID
        REFERENCES tigertrace.movement_baselines(id),

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

    CHECK (
        alert_type IN (
            'NEW_STATION',
            'RANGE_SHIFT',
            'BUFFER_ENTRY',
            'VILLAGE_PROXIMITY',
            'PROLONGED_ABSENCE',
            'SURVEY_ARTIFACT'
        )
    ),

    CHECK (
        severity IN (
            'INFO',
            'MEDIUM',
            'HIGH',
            'CRITICAL'
        )
    ),

    CHECK (
        status IN (
            'OPEN',
            'ACKNOWLEDGED',
            'CONFIRMED',
            'DISMISSED',
            'RESOLVED'
        )
    ),

    CHECK (confidence BETWEEN 0 AND 1)
);
```

---

# 19. `alert_evidence`

Stores the evidence chain supporting an alert.

```sql
CREATE TABLE tigertrace.alert_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    alert_id UUID NOT NULL
        REFERENCES tigertrace.alerts(id)
        ON DELETE CASCADE,

    evidence_type VARCHAR(40) NOT NULL,

    observation_id UUID
        REFERENCES tigertrace.observations(id),

    image_id UUID
        REFERENCES tigertrace.images(id),

    evidence_json JSONB
        NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Example evidence types

- `CURRENT_IMAGE`
- `HISTORICAL_OBSERVATION`
- `NEW_STATION_RESULT`
- `RANGE_COMPARISON`
- `ZONE_MATCH`
- `SURVEY_EFFORT_CHECK`

---

# 20. `review_tasks`

Human-in-the-loop queue for uncertain AI outputs.

```sql
CREATE TABLE tigertrace.review_tasks (
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

    CHECK (
        task_type IN (
            'TIGER_MATCH',
            'BLANK_IMAGE',
            'NEW_TIGER',
            'MOVEMENT_ALERT'
        )
    ),

    CHECK (
        status IN (
            'OPEN',
            'IN_PROGRESS',
            'COMPLETED',
            'CANCELLED'
        )
    )
);
```

The polymorphic `entity_id` approach is acceptable for the MVP. If review volume becomes large, typed review tables can be introduced.

---

# 21. `audit_events`

Immutable trace of automated decisions and human corrections.

```sql
CREATE TABLE tigertrace.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    actor_type VARCHAR(24) NOT NULL,
    actor_id UUID,

    action VARCHAR(80) NOT NULL,

    entity_type VARCHAR(64) NOT NULL,
    entity_id UUID,

    before_state JSONB,
    after_state JSONB,

    metadata JSONB
        NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

This provides the audit trail required for human-correctable automated decisions.

---

# 22. Required Indexes

```sql
CREATE INDEX idx_images_camera_time
ON tigertrace.images(camera_station_id, captured_at);

CREATE INDEX idx_images_run_status
ON tigertrace.images(import_run_id, status);

CREATE INDEX idx_detections_image
ON tigertrace.detections(image_id);

CREATE INDEX idx_observations_tiger_time
ON tigertrace.observations(tiger_id, observed_at);

CREATE INDEX idx_observations_camera_time
ON tigertrace.observations(camera_station_id, observed_at);

CREATE INDEX idx_alerts_status_time
ON tigertrace.alerts(status, triggered_at DESC);

CREATE INDEX idx_camera_location
ON tigertrace.camera_stations USING GIST(location);

CREATE INDEX idx_observation_location
ON tigertrace.observations USING GIST(location);

CREATE INDEX idx_zones_geometry
ON tigertrace.zones USING GIST(geometry);

CREATE INDEX idx_spatial_range
ON tigertrace.spatial_snapshots USING GIST(range_geometry);

CREATE INDEX idx_tiger_embedding
ON tigertrace.tiger_embeddings
USING hnsw (embedding vector_cosine_ops);
```

The HNSW index can be deferred for the small MVP if exact search is faster and simpler.

---

# 23. Idempotency Rules

Processing the same camera folder twice must not create duplicate records.

### Canonical file identity

```text
images.sha256
```

### Observation identity

```text
(tiger_id, image_id)
```

### Alert identity

```text
(observation_id, alert_type, rule_version)
```

Implement database-level unique constraints for these logical identities where appropriate.

---

# 24. Spatial Queries

### Find stations within 5 km

```sql
SELECT
    c.id,
    c.code
FROM tigertrace.camera_stations c
WHERE ST_DWithin(
    c.location,
    :observation_point::geography,
    5000
);
```

### Identify village-adjacent zone

```sql
SELECT
    z.id,
    z.name
FROM tigertrace.zones z
WHERE z.zone_type = 'VILLAGE_ADJACENT'
  AND ST_Contains(
      z.geometry,
      ST_SetSRID(
          ST_GeomFromGeoJSON(:point),
          4326
      )
  );
```

---

# 25. pgvector Re-ID Query

Retrieve the nearest tiger candidates using cosine similarity.

```sql
SELECT
    te.tiger_id,
    1 - (te.embedding <=> :query_embedding)
        AS similarity
FROM tigertrace.tiger_embeddings te
WHERE te.is_reference = TRUE
ORDER BY te.embedding <=> :query_embedding
LIMIT 5;
```

The database retrieves nearest candidates. The application/domain layer applies calibrated:

- Auto-match threshold
- Human-review threshold
- New-individual threshold

---

# 26. Alert Data Flow

```text
OBSERVATION
     │
     ▼
LOAD ACTIVE BASELINE
     │
     ├── New station?
     ├── Range shift?
     ├── Buffer?
     ├── Village adjacent?
     └── Prolonged absence?
             │
             ▼
      SURVEY-EFFORT CHECK
             │
             ▼
      CREATE ALERT + EVIDENCE
             │
             ▼
       OPTIONAL REVIEW TASK
             │
             ▼
          AUDIT EVENT
```

The system must account for uneven survey effort so that a new detection does not automatically become a false movement alarm.

---

# 27. Backend API → Database Mapping

| API Domain | Database Objects |
|---|---|
| Cameras | `camera_stations`, `zones` |
| Processing | `import_runs`, `images`, `image_metadata` |
| Detection | `detections`, `flank_crops` |
| Tigers | `tigers`, `tiger_embeddings`, `observations` |
| Map | `camera_stations`, `observations`, `zones`, `spatial_snapshots` |
| Movement | `observations`, `movement_baselines`, `spatial_snapshots` |
| Alerts | `alerts`, `alert_evidence` |
| Review | `review_tasks`, `audit_events` |
| Dashboard | Read-only views/aggregations |

---

# 28. Recommended Read Views

```text
v_dashboard_summary
v_latest_tiger_observation
v_open_alerts
v_camera_processing_summary
v_tiger_movement_timeline
```

Use database views for stable read models.

Use materialized views only after measuring dashboard aggregation performance.

---

# 29. Transaction Boundaries

Recommended transaction boundaries:

### Ingestion

```text
Image + metadata
```

### Identity persistence

```text
Observation + identity state
```

### Alert creation

```text
Alert + evidence + review task
```

### Human review

```text
Decision + entity update + audit event
```

### Spatial analytics

```text
Spatial snapshot + baseline reference
```

> Never hold a PostgreSQL transaction open while running long AI inference.

Run inference outside the transaction and persist results in short transactions.

---

# 30. Concurrency

- Claim jobs with row-level locking.
- Use `SELECT ... FOR UPDATE SKIP LOCKED` where appropriate.
- Use unique constraints as the final idempotency guard.
- Avoid global locks.
- Allow independent camera/import jobs to process concurrently when hardware permits.

---

# 31. Environment Configuration

```env
DATABASE_URL=postgresql+psycopg://tigertrace:<password>@localhost:5432/tigertrace

POSTGRES_DB=tigertrace
POSTGRES_USER=tigertrace
POSTGRES_PASSWORD=<secret>

DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20
DB_ECHO=false
```

Secrets must come from environment/secret management.

**Never commit database passwords to Git.**

---

# 32. Docker PostgreSQL

Recommended MVP PostgreSQL service:

```yaml
services:
  postgres:
    image: postgis/postgis:16-3.4

    environment:
      POSTGRES_DB: tigertrace
      POSTGRES_USER: tigertrace
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

    ports:
      - "5432:5432"

    volumes:
      - tigertrace_pgdata:/var/lib/postgresql/data

    healthcheck:
      test:
        [
          "CMD-SHELL",
          "pg_isready -U tigertrace -d tigertrace"
        ]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  tigertrace_pgdata:
```

---

# 33. Alembic Migration Strategy

```text
alembic/
├── env.py
└── versions/
    ├── 001_initial_schema.py
    ├── 002_postgis_pgvector.py
    ├── 003_indexes.py
    └── ...
```

Rules:

- Every schema change is a migration.
- Run migrations against a clean PostgreSQL instance in CI.
- Seed demo data through a repeatable script.
- Do not use SQLite for tests that validate PostgreSQL-specific behavior.

---

# 34. MVP Seed Data

The seed script should create:

```text
CAM-01
  CORE
  simulation=true

CAM-02
  CORE / OVERLAP
  simulation=true

CAM-03
  VILLAGE_ADJACENT
  simulation=true
```

Also seed:

- Demo zone polygons
- `TGR-001` through `TGR-004`
- Historical `TGR-001` observations at CAM-01/CAM-02
- A deterministic CAM-03 observation that triggers movement deviation
- Demo processing run metadata

The seed scenario is for reproducible initialization. The demo alert should still be generated by the same deviation engine used for future field data.

---

# 35. Backup and Recovery

### Development

Use `pg_dump` before destructive schema work.

### Hackathon

Maintain:

- A known-good PostgreSQL dump
- A reproducible seed script
- A known-good migration state

### Production Direction

Use:

- Automated PostgreSQL backup
- pgBackRest or managed PostgreSQL backups
- Tested restoration procedure

Backup creation without restoration testing is insufficient.

---

# 36. Security

- Use a dedicated application database role.
- Use a separate migration role in production.
- Never use PostgreSQL superuser credentials from the API.
- Restrict database network access to trusted hosts.
- Protect wildlife-location data through API authorization.
- Protect human-containing imagery with appropriate access controls.
- Encrypt production backups.
- Keep database credentials outside source control.

---

# 37. Performance Strategy

| Area | Strategy |
|---|---|
| Image history | Camera/time and run/status indexes |
| Tiger history | `tiger_id + observed_at` index |
| Map | PostGIS GIST indexes |
| Re-ID | pgvector exact search for MVP; HNSW when needed |
| Alerts | Status + triggered_at index |
| Dashboard | Views/materialized views after profiling |
| Very large tables | Consider time partitioning only after measured need |

Do not introduce partitioning prematurely. Profile actual workloads first.

---

# 38. Backend Layering

```text
REST Router
    ↓
Pydantic Schema
    ↓
Domain Service
    ↓
Repository / SQLAlchemy
    ↓
PostgreSQL

AI Adapter
    ↓
Typed Domain Result
    ↓
Domain Service
    ↓
PostgreSQL
```

AI adapters must not directly manipulate frontend state or bypass domain services.

---

# 39. PostgreSQL Integration Testing

Integration tests should run against a real PostgreSQL/PostGIS/pgvector environment.

Test:

- Alembic migrations
- Foreign keys
- Check constraints
- Spatial queries
- Vector retrieval
- Duplicate image protection
- Duplicate observation protection
- Duplicate alert protection
- Transaction rollback
- Alert creation
- Human review
- Audit events

> SQLite-based compatibility tests are intentionally excluded because TigerTrace is PostgreSQL-only.

---

# 40. Backend Schema Definition of Done

- [ ] PostgreSQL is the only database technology.
- [ ] PostGIS is enabled.
- [ ] pgvector is enabled.
- [ ] All tables are managed by Alembic.
- [ ] Foreign keys are implemented.
- [ ] Check constraints are implemented.
- [ ] Spatial indexes are present.
- [ ] Query indexes are present.
- [ ] Three-camera seed configuration is reproducible.
- [ ] Image processing is idempotent.
- [ ] Every observation is traceable to image/camera/time/location.
- [ ] Every alert is traceable to an observation and baseline.
- [ ] Human decisions generate audit events.
- [ ] Backup/restore procedure exists.
- [ ] Integration tests use PostgreSQL rather than SQLite.

---

# 41. Final Backend Data Flow

```text
CAMERA DATA
     │
     ▼
IMPORT_RUN
     │
     ▼
IMAGES → IMAGE_METADATA
     │
     ▼
DETECTIONS
     │
     ▼
FLANK_CROPS
     │
     ▼
TIGER_EMBEDDINGS
     │
     ▼
TIGERS
     │
     ▼
OBSERVATIONS
     ├────────────────┐
     ▼                ▼
SPATIAL_SNAPSHOTS   MOVEMENT_BASELINES
     └────────┬───────┘
              ▼
            ALERTS
              │
              ▼
       ALERT_EVIDENCE
              │
              ▼
        REVIEW_TASKS
              │
              ▼
         AUDIT_EVENTS
```

---

# 42. Final Architecture Decision

**TigerTrace will use PostgreSQL only. SQLite is explicitly removed from the architecture.**

Final recommended database stack:

```text
PostgreSQL 16+
      │
      ├── PostGIS
      │     └── GPS / zones / range / overlap
      │
      └── pgvector
            └── Tiger stripe/flank embeddings
```

Application persistence:

```text
FastAPI
   ↓
SQLAlchemy 2.x
   ↓
psycopg 3
   ↓
PostgreSQL
```

Schema lifecycle:

```text
Alembic
   ↓
PostgreSQL migrations
```

This provides one production-oriented persistence layer for relational data, geospatial intelligence and tiger re-identification vectors.

---

## Final Architecture Principle

The frontend simulation, future real camera ingestion and AI pipeline must all converge on the same backend data model:

```text
Simulated Camera
       │
       ▼
Real Camera-Trap Data
       │
       ▼
   IMPORT_RUN
       │
       ▼
     IMAGES
       │
       ▼
    DETECTION
       │
       ▼
   TIGER RE-ID
       │
       ▼
  OBSERVATIONS
       │
       ├── Spatial Intelligence
       │
       └── Movement Baseline
                │
                ▼
             ALERT
                │
                ▼
        HUMAN REVIEW
                │
                ▼
             AUDIT
```

**PostgreSQL is the single source of truth throughout the entire system.**
