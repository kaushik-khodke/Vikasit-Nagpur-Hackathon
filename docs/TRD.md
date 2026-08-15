TIGERTRACE

Technical Requirements Document (TRD)

Automated Camera-Trap Triage, Individual Tiger Identification & Movement Intelligence System

Target: Pench Tiger Reserve | Prototype: 3 simulated camera stations | Deployment: Offline-first laptop

Version 1.0 | Engineering Baseline | August 2026

# 1. Technical Scope and Engineering Goals

TigerTrace is an offline-first application that ingests raw camera-trap image folders, performs safe triage, detects tiger subjects, generates individual re-identification candidates from flank/stripe appearance, persists observations, computes prototype spatial intelligence, compares current observations against historical baselines, and produces explainable movement-deviation alerts.

The source PS requires raw directory ingestion, reversible blank-image removal, individual identification linked to image/station/timestamp/GPS, tiger-wise occupancy and mapped home-range outputs, and deviation alerts for range shifts, new stations, buffer/village movement and prolonged absence. It also requires ordinary field hardware without a dedicated GPU or internet, auditable/correctable automated decisions, and robust handling of messy field data. fileciteturn0file0L16-L19 fileciteturn0file0L45-L51

Prototype scope is intentionally limited to three simulated camera stations. The architecture remains camera-count agnostic so real SD-card folders can replace the simulator later.

# 2. Architecture Principles

- Offline-first; no cloud dependency for core processing, database, maps, inference or alerts.

- Modular processing stages with independently testable interfaces.

- Human-in-the-loop for low-confidence identity and sensitive decisions.

- Evidence-first alerts containing the observation, baseline, rule, confidence and supporting image(s).

- Idempotent processing so reruns do not duplicate observations or alerts.

- Fail-soft ingestion: corrupt files are isolated and logged without aborting a batch.

- Model abstraction so models can be swapped without rewriting application logic.

- Configuration over hard-coding for cameras, zones, thresholds and model versions.

- Auditability of model version, input, output, confidence, run and reviewer action.

- PostgreSQL/PostGIS is the database foundation for both MVP and production; there is no SQLite migration path.

# 3. Recommended Industry-Level Stack

# 4. System Context

Two input modes feed the same backend pipeline: Simulation Mode uses three virtual camera directories with permitted sample/synthetic data; Field Mode consumes real SD-card directories. The simulator must not bypass the backend, database or alert engine.

# 5. Logical Architecture

# 6. Repository Structure

tigertrace/
├── apps/web/                 # Next.js frontend
├── services/api/
│   ├── app/
│   │   ├── api/              # REST routers
│   │   ├── core/             # settings, logging
│   │   ├── db/               # SQLAlchemy + migrations
│   │   ├── models/           # ORM models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # domain services
│   │   ├── pipelines/        # orchestration
│   │   ├── ml/               # model adapters
│   │   ├── geospatial/       # spatial logic
│   │   └── main.py
│   └── tests/
├── ml/{models,training,evaluation}/
├── data/{simulator,sample,quarantine,processed}/
├── config/{cameras.yaml,thresholds.yaml,demo_scenario.yaml}
├── scripts/  docs/
├── docker-compose.yml
├── .env.example
└── README.md

# 7. Data Ingestion

- Support JPEG/JPG and PNG in MVP; design for RAW later.

- Ingest directory-based SD-card copies.

- Support optional JSON/CSV sidecar metadata.

- Parse camera timestamps with filesystem fallback only when configured.

- Resolve camera ID through folder mapping or import profile.

- Use SHA-256 checksum for content identity and deduplication.

Pipeline: scan → validate → fingerprint → normalize metadata → persist Image → enqueue processing.

- Unreadable image → CORRUPT; log and continue.

- Missing timestamp → METADATA_WARNING.

- Unknown camera → UNMAPPED_CAMERA review item.

- Duplicate checksum → no duplicate observation.

# 8. Three-Camera Simulator

The simulator must generate or replay deterministic observation events. It must create actual processing jobs; it must never directly insert a final alert.

- Normal repeated detections.

- Multiple individual detections.

- New-station detection at CAM-03.

- Buffer/village movement alert.

- Optional prolonged-absence scenario.

The demo scenario must be resettable and reproducible.

# 9. Blank Image Triage

Image → quality check → blank classifier → confidence policy → quarantine or retain.

No hard delete in MVP. Quarantine preserves original path, checksum and metadata, and a restore action returns the file to the working dataset.

The PS explicitly requires safe/reversible blank-image handling and reporting of removed frames and saved time/space. fileciteturn0file0L20-L25

# 10. Detection Pipeline

For each retained image: run object detection → filter configured classes → store bounding boxes/confidence → crop tiger → pass crop to flank extraction. Human-containing images receive privacy-aware handling.

The PS requires tiger detection/flank isolation and privacy safeguards for humans. fileciteturn0file0L26-L31 fileciteturn0file0L49-L51

# 11. Individual Tiger Re-Identification

Pipeline: tiger crop → flank quality check → flank crop → normalization → embedding → pgvector candidate retrieval → similarity scoring → decision policy.

Thresholds must be calibrated on a held-out validation set; they are configuration, not assumed scientific truth.

- Canonical Tiger ID.

- Reference embeddings and images.

- Identity confidence.

- Human verification state.

- Sex/age only when supported by data.

The PS requires confident automatic matches, human review of ambiguous matches, and automatic enrollment of new individuals. fileciteturn0file0L26-L31

# 12. Similarity Search

Use pgvector with normalized embeddings and cosine similarity search. Exact search is appropriate for the small MVP catalogue; HNSW indexing can be introduced after scale and embedding behavior are validated.

# 13. Database Design

- Foreign keys enabled.

- Indexes on checksum, camera_id, captured_at, tiger_id and alert status.

- Unique checksum for image deduplication.

- Store timestamps in UTC internally.

- Use UUID/ULID identifiers.

- Use state transitions instead of destructive deletes.

# 14. Spatial Intelligence

Every confirmed observation becomes a point feature from the camera station's configured GPS.

MVP activity centroid: calculate a documented centroid from unique capture points to avoid bias from high-volume cameras.

MVP occupied area: convex hull or buffered capture-point polygon, depending on point count. The UI must label this as an estimated prototype area.

Production path: configurable ecological estimator such as KDE after sufficient observation density.

Territorial overlap: geometry intersection between individual range polygons.

The PS requires capture locations, home-range estimate, activity centroid, estimated occupied area, mapped visualization and territorial overlap. fileciteturn0file0L32-L36

# 15. Zone Model

MVP boundaries may use clearly labelled simulation polygons. Production boundaries should come from authoritative GIS data.

# 16. Movement Baseline

For each tiger, maintain a versioned baseline containing known stations, observation frequency, capture points, activity centroid, occupied area, last-seen time and zone distribution.

A baseline version must be attached to each deviation alert so the comparison is reproducible.

# 17. Deviation Rules

The PS gives example thresholds of 15–20 sq km in core and 5 km in buffer; these shall be configurable and validated. fileciteturn0file0L39-L44

The system must distinguish genuine behavioural deviation from uneven survey effort, including newly installed cameras. fileciteturn0file0L42-L44

# 18. Alert Engine

Observation → baseline lookup → rule evaluation → survey-effort check → evidence collection → deduplication → alert.

- Detected change.

- Location and timestamp.

- Historical comparison.

- Rule fired.

- Confidence.

- Supporting image(s).

- Supporting map/movement evidence.

- Review status.

Repeated processing of the same observation must not create duplicate alerts.

# 19. Human Review

Every reviewer action creates an audit event.

# 20. REST API

FastAPI should generate OpenAPI documentation automatically and Pydantic schemas should validate all payloads.

# 21. Frontend Architecture

apps/web/
├── app/{dashboard,cameras,tigers,map,alerts,processing,review,settings}/
├── components/{map,tigers,alerts,processing,ui}/
├── lib/{api,types,utils}/
└── tests/

- TanStack Query for server state.

- Zustand only for lightweight client state.

- Typed API client generated from OpenAPI where practical.

- Desktop-first responsive UI.

- Offline map using bundled demo geometry/tiles.

# 22. Main UI Screens

- Dashboard: KPIs, map, recent alerts, last processing run.

- Camera Stations: status, zone, last run and counts.

- Processing Center: select source, start run, stage progress and statistics.

- Tiger Catalogue: individuals, confidence, last seen and alert status.

- Tiger Profile: identity, stripe references, history, map, range and alerts.

- Reserve Map: stations, territories, paths, zones and alert locations.

- Alerts: filters, severity, evidence and review status.

- Human Review: ambiguous matches, blank decisions and alert review.

- Quarantine: staged-deletion browser and restore.

# 23. Offline Strategy

- Bundle model weights locally.

- Local PostgreSQL database with PostGIS and pgvector.

- Local image/derived-file storage.

- Local map data for demo.

- No external API calls for inference/alerts.

- Health screen for model/database/storage availability.

This directly reflects the PS requirement for processing on ordinary field hardware without internet. fileciteturn0file0L45-L49

# 24. Processing Orchestration

MVP should use a local background worker and persistent job table. Redis/Celery is optional and should only be added after profiling.

QUEUED → RUNNING → SUCCEEDED
                  ├→ PARTIAL
                  └→ FAILED

A failed image must not fail the entire batch.

# 25. Model Management

- Model name and version.

- Runtime/framework version.

- Input/output specification.

- Evaluation dataset identifier.

- Metrics.

- Artifact checksum.

- Creation date.

Inference records must store model version for reproducibility.

# 26. ML Evaluation

- Blank triage: precision, recall, F1, false-negative rate, throughput.

- Tiger Re-ID: Top-1, Top-5, unknown-individual detection, false-match rate.

- Alerts: precision, false-alert rate, evidence completeness, reviewer agreement.

The PS explicitly emphasizes false negatives in blank detection, identification accuracy, interpretable occupancy, actionable alerts, constrained-hardware throughput and robustness. fileciteturn0file0L52-L56

Never fabricate metrics. Synthetic demo behavior must be labelled as simulation and separated from measured model validation.

# 27. Testing Strategy

A deterministic golden demo dataset is mandatory.

# 28. Security and Privacy

- Bind backend to localhost by default.

- Restrict CORS if networked.

- Keep sensitive wildlife coordinates private.

- Store audit events.

- Use environment variables for secrets.

- Never commit credentials/API keys.

- Apply privacy-aware handling to human-containing images.

The PS explicitly requires privacy safeguards for humans and auditable/correctable automation. fileciteturn0file0L49-L51

# 29. Observability

- Structured logs.

- Per-run metrics.

- Per-stage timing.

- Inference counts.

- Error counts.

- Alert counts.

- Database/storage/model health.

Provide a local diagnostics view showing failed files and the latest run.

# 30. MVP Performance Targets

The PS requires practical tens-of-thousands-image processing and constrained-hardware evaluation, so throughput must be measured during final validation. fileciteturn0file0L45-L49

# 31. Deployment

docker compose up --build
Frontend: http://localhost:3000
API:      http://localhost:8000
API docs: http://localhost:8000/docs

- Persistent DB volume.

- Model volume.

- Data directory mount.

- Configuration mount.

- Health checks.

- Windows one-command startup script.

# 32. Configuration

camera:
  CAM-01:
    zone: CORE
    latitude: <demo>
    longitude: <demo>
  CAM-02:
    zone: CORE
  CAM-03:
    zone: VILLAGE_ADJACENT

thresholds:
  blank_auto_quarantine: <calibrated>
  reid_auto_match: <calibrated>
  reid_review: <calibrated>
  range_shift_core_km2: 15
  range_shift_buffer_km: 5
  prolonged_absence_days: <configured>

The 15–20 sq km core and 5 km buffer figures from the PS should be treated as configurable requirements, not universal ecological constants. fileciteturn0file0L39-L41

# 33. Data Lifecycle

Raw → Validated → Processed → Derived → Quarantined/Restored → Archived.

- Never overwrite raw images silently.

- Trace derived crops to source image and model version.

- Make quarantine reversible.

- Retain audit events.

- Use import runs for lineage.

# 34. End-to-End Acceptance Test

- Start TigerTrace without internet.

- Load deterministic three-camera scenario.

- Ingest folders without manual renaming.

- Complete triage and show quarantine statistics.

- Detect tiger images.

- Match known tigers and route ambiguous/new cases to review.

- Persist observations with camera, timestamp and location.

- Display tiger histories and map.

- Generate estimated spatial footprint and overlap.

- Process new CAM-03 observation.

- Generate movement/buffer/village alert.

- Open supporting evidence and baseline.

- Confirm or dismiss through review.

- Re-run dataset and verify no duplicates.

# 35. Development Roadmap

# 36. Definition of Done

- Implemented in intended module.

- Validated contracts exist.

- Tests cover core behavior.

- Errors do not crash unrelated processing.

- Audit/logging requirements satisfied.

- UI exposes required state.

- Works offline.

- Golden dataset verifies behavior.

- Documentation covers setup, configuration and limitations.

# 37. Non-Negotiable Engineering Decisions

- Use three simulated cameras for MVP; keep camera count configurable.

- No static frontend mock data for actual dashboard outputs.

- Simulator must create real processing observations; alert must come from the deviation engine.

- Never permanently delete blank images in MVP.

- Never silently auto-assign ambiguous tiger identities.

- Do not claim scientific-grade home-range accuracy from a small prototype.

- No cloud dependency for core processing.

- Frontend never calls model code directly; inference results flow through backend/domain services.

# 38. Final Technical Definition

TigerTrace is a modular offline-first wildlife intelligence application built as a Next.js + FastAPI modular monolith with local ML inference, PostgreSQL persistence with PostGIS and pgvector, local geospatial processing, and a deterministic three-camera simulation layer. The same PostgreSQL foundation is used for both MVP and production; scalable workers and larger vector indexes can be introduced without changing the core domain contracts.

The technical objective is a reproducible chain of evidence from raw camera-trap input to individual identity, spatial history, behavioural baseline and actionable deviation alert.

# 39. Source Alignment

This TRD is grounded in the uploaded Forest & Wildlife PS. The PS requires raw directory ingestion; safe reversible blank-image handling; individual tiger identification using flank/stripe patterns; persistent image/station/timestamp/GPS linkage; tiger-wise mapped occupancy and overlap; deviation detection; offline operation on ordinary hardware; privacy safeguards; human-auditable decisions; and an end-to-end working pipeline with database, map visualization and alert output. fileciteturn0file0L20-L31 fileciteturn0file0L32-L44 fileciteturn0file0L45-L59

Technology choices such as Next.js, FastAPI, SQLAlchemy, pgvector, Docker and MapLibre are engineering recommendations added to make the MVP implementable; they are not verbatim requirements from the PS.

### Table 1

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | Next.js 16+ / React / TypeScript | Production dashboard and routing |
| UI | Tailwind CSS + shadcn/ui | Accessible professional UI |
| Maps | MapLibre GL JS | Local/offline map rendering |
| Charts | Apache ECharts | Analytics and movement charts |
| API | Python 3.12 + FastAPI | Typed REST API |
| Validation | Pydantic v2 | Schema/config validation |
| ORM | SQLAlchemy 2.x | Database access |
| Migrations | Alembic | Schema versioning |
| Database | PostgreSQL 16+ + PostGIS + pgvector | Relational, geospatial and vector persistence |

| Queue | Local worker; Redis + RQ/Celery later | Background processing |
| CV | PyTorch + torchvision | Inference runtime |
| Detection | Ultralytics YOLO-family adapter | Tiger/subject detection prototype |
| Re-ID | PyTorch embedding adapter + pgvector | Stripe similarity retrieval |
| Images | OpenCV + Pillow | Decode/crop/transform |
| Geospatial | GeoPandas + Shapely + pyproj | Spatial calculations |
| Logging | structlog + Python logging | Structured local logs |
| Testing | pytest + pytest-asyncio | Backend tests |
| Frontend Testing | Vitest + RTL + Playwright | UI/E2E testing |
| Packaging | Docker Compose | Reproducible local deployment |
| CI | GitHub Actions | Lint/test/build/security checks |

### Table 2

| Module | Responsibility | Interface |
| --- | --- | --- |
| Ingestion | Discover files, normalize metadata, create jobs | Internal service |
| Triage | Blank/useful classification and quarantine | Model adapter |
| Detection | Tiger/animal/person/vehicle detection | Model adapter |
| Re-ID | Flank extraction, embeddings and matching | Model adapter + pgvector |
| Observation | Persist images/detections/identity decisions | SQLAlchemy |
| Spatial | Centroids, ranges and overlaps | GeoPandas/Shapely |
| Deviation | Historical comparison and rules | Domain service |
| Alert | Create, deduplicate and rank alerts | Domain service |
| Review | Human decisions and corrections | REST API |
| Simulation | Deterministic camera event playback | REST/internal service |
| Frontend | Dashboard, map, catalogue and review | Next.js |

### Table 3

| Camera | Zone | Role |
| --- | --- | --- |
| CAM-01 | CORE | Normal territory baseline |
| CAM-02 | CORE/OVERLAP | Multiple tiger observations and overlap |
| CAM-03 | VILLAGE_ADJACENT | Abnormal movement demonstration |

### Table 4

| State | Meaning |
| --- | --- |
| BLANK_HIGH_CONF | Automatically quarantine |
| BLANK_REVIEW | Possible blank; human review |
| USEFUL | Retain for downstream analysis |
| CORRUPT | Unreadable file |
| ERROR | Processing failure |

### Table 5

| Condition | Action |
| --- | --- |
| Score ≥ calibrated match threshold + sufficient margin | Automatic match |
| Review-band score or small candidate margin | Human review |
| All candidates below new-individual threshold | Create new individual candidate |
| Poor flank quality | Unidentified/review |

### Table 6

| Table | Core Fields |
| --- | --- |
| camera_stations | id, code, name, latitude, longitude, zone_type, active |
| import_runs | id, mode, source_path, started_at, completed_at, status, stats |
| images | id, checksum, path, camera_id, captured_at, size_bytes, status |
| detections | id, image_id, class, bbox, confidence |
| flank_crops | id, detection_id, path, quality_score |
| tigers | id, public_code, sex, status, first_seen, last_seen |
| tiger_embeddings | id, tiger_id, vector_ref, model_version, created_at |
| observations | id, tiger_id, image_id, camera_id, timestamp, lat, lon, confidence |
| zones | id, name, type, geometry |
| spatial_snapshots | id, tiger_id, run_id, centroid, range_area, geometry |
| alerts | id, tiger_id, type, severity, status, confidence, created_at |
| alert_evidence | id, alert_id, observation_id, rule_result, evidence |
| review_tasks | id, entity_type, entity_id, status, decision |
| audit_events | id, actor, action, entity_type, entity_id, payload, created_at |

### Table 7

| Zone | Purpose |
| --- | --- |
| CORE | Core reserve |
| BUFFER | Reserve buffer |
| VILLAGE_ADJACENT | Village-adjacent/high-risk |
| CORRIDOR | Movement corridor |
| UNKNOWN | Unclassified |

### Table 8

| Rule | Trigger | Severity |
| --- | --- | --- |
| NEW_STATION | Station absent from historical station set | Medium |
| RANGE_SHIFT | Current movement exceeds configured baseline threshold | High |
| BUFFER_ENTRY | Tiger enters buffer | High |
| VILLAGE_PROXIMITY | Village-adjacent detection | Critical |
| PROLONGED_ABSENCE | Regular tiger absent beyond configured period | Medium |
| SURVEY_ARTIFACT | Camera coverage explains apparent change | Suppress/Review |

### Table 9

| Review | Inputs | Actions |
| --- | --- | --- |
| Tiger Match | Candidates + similarity | Confirm / assign / reject |
| Blank Image | Image + confidence | Quarantine / restore |
| New Tiger | Reference crop + catalogue | Enroll / merge / reject |
| Movement Alert | Map + evidence + baseline | Confirm / dismiss / investigate |

### Table 10

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | /api/v1/health | Health check |
| POST | /api/v1/import-runs | Create import run |
| POST | /api/v1/import-runs/{id}/start | Start processing |
| GET | /api/v1/import-runs/{id} | Processing status |
| GET | /api/v1/cameras | Camera list |
| GET | /api/v1/tigers | Tiger catalogue |
| GET | /api/v1/tigers/{id} | Tiger profile |
| GET | /api/v1/tigers/{id}/observations | Tiger history |
| GET | /api/v1/tigers/{id}/spatial | Spatial data |
| GET | /api/v1/alerts | Alert list |
| GET | /api/v1/alerts/{id} | Alert evidence |
| POST | /api/v1/reviews/{id}/decision | Submit review |
| GET | /api/v1/dashboard/summary | Dashboard KPIs |
| GET | /api/v1/map/features | Map features |
| POST | /api/v1/simulation/scenarios/{id}/run | Run demo |
| POST | /api/v1/quarantine/{id}/restore | Restore image |

### Table 11

| Layer | Tools | Coverage |
| --- | --- | --- |
| Unit | pytest / Vitest | Rules, utilities, components |
| Integration | pytest + PostgreSQL/PostGIS/pgvector test service | API + DB + pipeline |
| Model Contract | pytest | Adapter input/output |
| E2E | Playwright | Full judge workflow |
| Data Quality | pytest fixtures | Corrupt files, duplicates, timestamps |
| Performance | Locust/custom benchmark | Batch throughput |
| Regression | Golden demo dataset | Stable identities/alerts |

### Table 12

| Metric | Engineering Target |
| --- | --- |
| Startup | < 15 sec on reference laptop |
| Dashboard | < 3 sec for demo dataset |
| Normal local API | p95 < 500 ms |
| Inference | Batch where supported |
| Duplicate processing | Zero duplicate observations/alerts |
| Throughput | Benchmark and report; no fabricated target |

### Table 13

| Phase | Deliverables |
| --- | --- |
| P0 Foundation | Repo, Docker, FastAPI, Next.js, DB, migrations, CI |
| P1 Data Layer | Cameras, import runs, images, checksums, metadata |
| P2 Triage | Blank adapter, quarantine, statistics |
| P3 Tiger CV | Detection, crops, model interfaces |
| P4 Re-ID | Flank, embeddings, pgvector, catalogue, review |
| P5 Spatial | Map, points, centroid, range, overlap |
| P6 Intelligence | Baseline, rules, evidence, deduplication |
| P7 Simulation | 3-camera deterministic scenario |
| P8 Product UI | Dashboard, profiles, alerts, processing, review |
| P9 Hardening | Offline, performance, errors, auditability |
| P10 Demo | Golden dataset, scripted judge flow, documentation |
