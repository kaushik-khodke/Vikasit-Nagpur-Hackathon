# 🐅 TigerTrace

> **An Offline-First AI Platform for Automated Camera-Trap Triage, Stripe-Based Individual Tiger Identification, and Movement Intelligence**  
> *Target Deployment: Pench Tiger Reserve, Central India | Hackathon Prototype: 3 Simulated Camera Stations*

[![Status](https://img.shields.io/badge/System-Offline--First%20Operational-2D6A4F?style=for-the-badge&logo=shield)](https://github.com/)
[![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20FastAPI%20%7C%20PostgreSQL-1D3557?style=for-the-badge)](https://github.com/)
[![Database](https://img.shields.io/badge/DB-PostGIS%20%2B%20pgvector-E63946?style=for-the-badge&logo=postgresql)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-457B9D?style=for-the-badge)](LICENSE)

---

## 📌 Executive Summary

**TigerTrace** transforms raw, chaotic camera-trap footage into actionable conservation intelligence. Designed for field deployment on standard forest department laptops without internet or dedicated GPUs, TigerTrace automates the entire wildlife surveillance lifecycle:

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   RAW CAMERA    │ ──► │ SAFE BLANK IMAGE │ ──► │  TIGER DETECTION │ ──► │ STRIPE PATTERN  │
│  TRAP FOLDERS   │     │  AI TRIAGE (80%) │     │ & FLANK CROPPING │     │  RE-ID ENGINE   │
└─────────────────┘     └──────────────────┘     └──────────────────┘     └─────────────────┘
                                                                                   │
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐              ▼
│ HUMAN-IN-LOOP   │ ◄── │ MOVEMENT & RANGE │ ◄── │ POSTGIS SPATIAL  │ ◄── ┌─────────────────┐
│ REVIEW & AUDIT  │     │ DEVIATION ALERTS │     │   INTELLIGENCE   │     │ PERSISTENT DB   │
└─────────────────┘     └──────────────────┘     └──────────────────┘     │ (PG + PGVECTOR) │
                                                                          └─────────────────┘
```

---

## 🎯 Problem Statement & Impact

1. **Camera-Trap Data Deluge**: Camera-trap monitoring cycles generate 10,000+ to 50,000+ images per cycle. Over **75–85%** are false triggers (swaying branches, rain, shadows, heat shimmer, insects). Manual sorting consumes hundreds of ranger hours.
2. **Individual Identification Bottleneck**: Every tiger has unique flank stripe patterns (like human fingerprints). Manually cross-matching new captures against historical photo-catalogues is slow, inconsistent, and error-prone.
3. **Delayed Threat & Conflict Detection**: Tigers wandering out of protected core reserves into buffer zones or village peripheries often go unnoticed until human-wildlife conflict occurs.
4. **Field Hardware Constraints**: Remote tiger reserves lack cloud connectivity and high-end GPU workstations. Solutions must run **100% offline on standard field laptops**.

---

## ✨ Key Capabilities & Features

### 1. 🔍 Automated Camera-Trap Ingestion & Safe Triage
- **Directory Ingestion**: Ingests multi-camera SD-card directory trees directly (`CAM_01/`, `CAM_02/`, `CAM_03/`).
- **Safe Reversible Quarantine**: Classifies blank/false triggers vs. useful wildlife frames. Quarantines empty frames without destructive permanent deletion, providing an audit trail and 1-click restore.
- **Resource Analytics**: Instantly calculates and visualizes processing throughput, filtered frames, and storage saved (e.g., *9,847 blanks isolated, 3.8 GB storage saved*).

### 2. 🐅 AI Tiger Detection & Flank Extraction
- **Object Detection**: Fast YOLO-family inference adapter to localize tiger subjects with bounding boxes and detection confidence.
- **Flank & Stripe Crop Extraction**: Automatically extracts the lateral flank stripe region for visual re-identification.
- **Privacy Safeguards**: Automatically tags and protects privacy on frames containing humans/field staff.

### 3. 🧬 Stripe-Based Individual Tiger Re-Identification (Re-ID)
- **Vector Embeddings**: Extracts high-dimensional stripe pattern embeddings stored in **pgvector**.
- **Similarity Search**: Cosine similarity matching against the persistent tiger catalogue.
- **Decision Tiers**:
  - **Auto-Match (Confidence ≥ 90%)**: Seamlessly links observation to known individual (e.g., `TGR-001`).
  - **Ambiguous Match (50%–89%)**: Flags for human review with top-candidate similarity scores.
  - **Novel Tiger (< 50%)**: Enrolls a new individual candidate (`TGR-005 - Pending Verification`).

### 4. 🗺️ PostGIS Spatial Intelligence & Territory Mapping
- **Capture Point Mapping**: Interactive, offline-ready MapLibre GL map showing all tiger encounters.
- **Activity Centroid Calculation**: Computes geographic center of activity per tiger, weighted to avoid bias from high-frequency camera traps.
- **Estimated Occupied Area & Home Range**: Computes convex hulls and buffered range polygons.
- **Territory Overlap Analysis**: Intersects spatial geometries to highlight shared corridors and disputed territories between individuals.
- **Zone Awareness**: Multi-tier boundary modeling (**Core Forest**, **Buffer Zone**, **Village-Adjacent High-Risk Zone**).

### 5. 🚨 Explainable Movement Deviation & Alert Engine
- **Rule A — New Station**: Detects when a tiger appears at a camera station never previously recorded in its history.
- **Rule B — Range Shift**: Alerts when a tiger's centroid/activity exceeds historical range thresholds (e.g., > 15 km² displacement).
- **Rule C — Buffer Entry**: Flags movements transitioning from core forest into reserve buffer zones.
- **Rule D — Village Proximity (Critical)**: High-priority immediate alert when a tiger is detected at village-adjacent camera stations.
- **Rule E — Prolonged Absence**: Detects when a resident tiger has not been observed within expected survey intervals.
- **Survey-Effort Awareness**: Intelligently suppresses false alerts caused by newly installed camera traps vs. genuine behavioral shifts.
- **Evidence Drawer**: Every alert includes supporting detection images, tiger identity confidence, historical baseline comparison, and triggered rule reasoning.

### 6. 🛡️ Human-in-the-Loop Review & Immutable Audit Trail
- **Operational Review Queue**: Clean interface for forest officers to confirm or dismiss ambiguous Re-ID matches, restore quarantined blanks, and verify movement alerts.
- **Full Audit Logging**: Every AI classification, human override, and alert confirmation is immutably logged with actor, timestamp, confidence, and rationale.

### 7. 🎬 3-Camera Simulation & Hackathon Demo Engine
- Built-in deterministic simulation runner simulating Pench Tiger Reserve camera stations:
  - **CAM-01 (Core Zone)**: Normal baseline activity for `TGR-001`.
  - **CAM-02 (Core Overlap Zone)**: Shared territory activity between `TGR-001` and `TGR-002`.
  - **CAM-03 (Village-Adjacent Buffer)**: Abnormal movement trigger generating the hero demonstration alert.

---

## 🏗️ System Architecture

```
                                  TIGERTRACE PLATFORM
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
           SIMULATION RUNNER                              FIELD SD-CARD INGEST
         (3 Virtual Stations)                            (Raw Camera Folders)
                    │                                             │
                    └──────────────────────┬──────────────────────┘
                                           ▼
                                INGESTION & PIPELINE
                                (SHA-256 Deduplication)
                                           │
                                           ▼
                                 BLANK IMAGE AI FILTER
                                 ┌─────────┴─────────┐
                                 ▼                   ▼
                           QUARANTINE STORE     USEFUL FRAMES
                            (Safe Staged)            │
                                                     ▼
                                              TIGER DETECTION
                                                     │
                                                     ▼
                                              FLANK EXTRACTION
                                                     │
                                                     ▼
                                           STRIPE RE-ID ENGINE
                                       (pgvector Cosine Similarity)
                                                     │
                                                     ▼
                                            POSTGRESQL + POSTGIS
                                       (Observations, Centroids, Zones)
                                                     │
                                                     ▼
                                         MOVEMENT DEVIATION ENGINE
                                      (Survey-Effort Aware Rule Evaluator)
                                                     │
                                                     ▼
                                            ALERT & EVIDENCE STORE
                                                     │
                                                     ▼
                                          NEXT.JS DASHBOARD & MAPS
                                        (Control Room + Review Queue)
```

---

## 💻 Technology Stack

| Layer | Technology | Purpose & Implementation Details |
|---|---|---|
| **Frontend UI** | **Next.js 15+ / React 19** | Desktop-first App Router, TypeScript, fast client-side transitions |
| **Styling & Icons** | **Tailwind CSS + shadcn/ui** | Clean, official forest-department design system, Lucide React icons |
| **Offline Maps** | **MapLibre GL JS** | Interactive local GIS map rendering camera stations, paths, polygons |
| **Data Analytics** | **Recharts + ECharts** | Processing statistics, timeline telemetry, and tiger activity charts |
| **State & Query** | **TanStack Query + Zustand** | Server-state caching and lightweight UI state |
| **Backend API** | **FastAPI (Python 3.12)** | Asynchronous REST API, auto-generated OpenAPI schemas, background workers |
| **Data Validation** | **Pydantic v2** | Strict schema validation for ingestion, rules, and API payloads |
| **ORM & Migrations** | **SQLAlchemy 2.x + Alembic** | Async ORM with PostGIS spatial types and pgvector integration |
| **Database** | **PostgreSQL 16+** | Single source of truth (SQLite is strictly excluded) |
| **Spatial Engine** | **PostGIS (GEOGRAPHY/GEOMETRY)** | GPS capture points, convex hulls, zone polygons, centroid calculations |
| **Vector Engine** | **pgvector** | Stripe embedding indexing and cosine similarity search |
| **CV & Inference** | **PyTorch + Ultralytics YOLO** | Offline-optimized object detection and flank crop adapters |
| **Image Processing**| **OpenCV + Pillow** | Fast image decode, EXIF metadata extraction, flank normalization |
| **Geospatial Math** | **GeoPandas + Shapely + pyproj** | Home-range polygon generation and territorial overlap intersection |
| **DevOps** | **Docker Compose** | One-command offline deployment containerizing Web, API, and DB |

---

## 🗄️ Database Architecture (PostgreSQL + PostGIS + pgvector)

All database entities exist inside the dedicated `tigertrace` schema:

```text
camera_stations ──────┐
                      │
images ───────────────┼── observations ──── tigers ──── tiger_embeddings (pgvector)
  │                   │         │
  ▼                   │         ▼
detections            │    spatial_snapshots (PostGIS)
  │                   │         │
  ▼                   │    movement_baselines
flank_crops           │         │
                      └─────────┼──────────┐
                                ▼          ▼
                              alerts   review_tasks
                                │
                                ▼
                         alert_evidence
```

### Key Tables
- **`camera_stations`**: Station codes (`CAM-01`), names, zones (`CORE`, `BUFFER`, `VILLAGE_ADJACENT`), and PostGIS Point coordinates (`location GEOGRAPHY(POINT, 4326)`).
- **`images`**: SHA-256 fingerprint, source path, camera reference, EXIF captured timestamp, triage classification (`USEFUL`, `BLANK_HIGH_CONF`, `QUARANTINED`, `CORRUPT`).
- **`detections`**: Bounding boxes, confidence score, subject class (`TIGER`, `ANIMAL`, `PERSON`, `VEHICLE`).
- **`flank_crops`**: Cropped flank image paths, quality score, normalization metadata.
- **`tigers`**: Canonical tiger catalog (`TGR-001`), sex, status (`NORMAL`, `REVIEW_REQUIRED`, `ALERT`), first/last seen timestamps.
- **`tiger_embeddings`**: High-dimensional stripe embeddings (`vector(512)` / `vector(128)` via pgvector) with cosine distance indexing.
- **`observations`**: Confirmed tiger sightings linking Tiger + Image + Camera + Timestamp + GPS location.
- **`spatial_snapshots`**: PostGIS Polygon/MultiPolygon geometries for estimated occupied areas, convex hulls, and activity centroids.
- **`movement_baselines`**: Historical range footprints, station frequency histograms, and baseline versions.
- **`alerts`**: Alert types (`VILLAGE_PROXIMITY`, `BUFFER_ENTRY`, `RANGE_SHIFT`, `NEW_STATION`, `PROLONGED_ABSENCE`), severity (`CRITICAL`, `HIGH`, `MEDIUM`), and confirmation status.
- **`alert_evidence`**: JSONB evidence payload linking current observation, baseline comparison, trigger rules, and supporting imagery.
- **`review_tasks` & `audit_events`**: Full human-in-the-loop task tracker and immutable event log.

---

## 📁 Repository Structure

```
Vikasit-bharat/
├── apps/
│   └── web/                           # Next.js 15+ Frontend Application
│       ├── app/                       # App Router (dashboard, cameras, tigers, map, alerts, etc.)
│       ├── components/                # UI Components (map, tigers, alerts, processing, review)
│       ├── lib/                       # API clients, TanStack Query hooks, types, utilities
│       └── public/                    # Static demo assets, offline map styles, sample images
├── services/
│   └── api/                           # FastAPI Backend Service
│       ├── app/
│       │   ├── api/                   # REST API Routers (v1 endpoints)
│       │   ├── core/                  # App configuration, logging, security
│       │   ├── db/                    # SQLAlchemy engine, session, Alembic migrations
│       │   ├── models/                # ORM Models (PostGIS & pgvector)
│       │   ├── schemas/               # Pydantic v2 request/response schemas
│       │   ├── services/              # Domain logic (triage, reid, spatial, baseline, alert)
│       │   ├── pipelines/             # Orchestration & async processing pipeline
│       │   ├── ml/                    # CV adapters (YOLO detector, stripe embedding extractor)
│       │   ├── geospatial/            # PostGIS/Shapely spatial calculations & convex hulls
│       │   └── main.py                # FastAPI application entry point
│       └── tests/                     # Backend unit and integration tests
├── config/                            # Environment & simulation configurations
│   ├── cameras.yaml                   # Camera registry, GPS coords, and zone assignments
│   ├── thresholds.yaml                # Re-ID thresholds, range shift limits, quarantine rules
│   └── demo_scenario.yaml             # 3-camera deterministic simulation script
├── data/                              # Local data directory (offline storage)
│   ├── simulator/                     # Sample images for CAM-01, CAM-02, CAM-03
│   ├── quarantine/                    # Reversibly quarantined blank frames
│   └── processed/                     # Stored tiger flank crops and artifacts
├── docs/                              # Project Architecture & Specification Documents
│   ├── PRD.md                         # Product Requirements Document
│   ├── TigerTrace_TRD.md              # Technical Requirements Document
│   ├── App_Flow.md                    # End-to-End Application & User Flow
│   ├── UI_UX_Brief.md                 # Design System & UI/UX Guidelines
│   ├── TigerTrace_Backend_Schema_PostgreSQL.md # PostgreSQL Schema Spec
│   └── frontend.md                    # Frontend Engineering Specification
├── scripts/                           # Setup and deployment helper scripts
├── docker-compose.yml                 # Multi-container offline stack definition
├── .env.example                       # Environment variables template
└── README.md                          # Project documentation
```

---

## 🎬 Complete Hackathon Demo Scenario (The 3-Camera Hero Flow)

TigerTrace includes an interactive, deterministic demonstration mode designed specifically for hackathon evaluation:

```
[ Step 1: Dashboard Overview ]
  └─ Display Pench Tiger Reserve control room status, camera counts, and initial metrics.

[ Step 2: Ingest & Triage Batch ]
  └─ Ingest 12,480 simulated camera-trap frames from CAM-01, CAM-02, and CAM-03.
  └─ AI Triage executes: 9,847 blank frames safely quarantined; 2,633 useful frames retained.
  └─ UI demonstrates 3.8 GB storage saved and zero destructive deletions.

[ Step 3: Tiger Re-Identification ]
  └─ Flank crops extracted and matched via pgvector cosine similarity.
  └─ System identifies TGR-001 (Male) and TGR-002 (Female) in core reserve.

[ Step 4: Baseline Spatial Intelligence ]
  └─ TGR-001 historically detected exclusively at CAM-01 and CAM-02 (Core Forest).
  └─ PostGIS renders TGR-001's historical territory polygon (42.3 km²) and activity centroid.

[ Step 5: New Observation at CAM-03 ]
  └─ Simulator feeds a new camera capture of TGR-001 at CAM-03 (Village-Adjacent Buffer).
  └─ Pipeline runs real-time detection -> Flank Re-ID -> Baseline comparison.

[ Step 6: 🚨 Critical Movement Deviation Alert ]
  └─ Deviation Engine evaluates rules:
     • NEW_STATION: CAM-03 has never been visited by TGR-001.
     • RANGE_SHIFT: 5.2 km displacement outside historical centroid.
     • VILLAGE_PROXIMITY: CAM-03 is tagged as VILLAGE_ADJACENT.
     • SURVEY_EFFORT CHECK: Camera is active; genuine behavioral deviation confirmed.
  └─ Red Critical Alert triggers on Dashboard and Reserve Map.

[ Step 7: Evidence Inspection & Ranger Review ]
  └─ Forest officer opens the Alert Evidence Drawer.
  └─ Inspects detection image, stripe similarity score (94%), and movement trajectory.
  └─ Officer clicks [ CONFIRM ALERT ] -> Audit event recorded -> Patrol dispatched.
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Docker & Docker Compose** (Recommended for 1-command deployment)
- *Or Manual Setup*:
  - **Node.js 18+** & **pnpm / npm**
  - **Python 3.12+**
  - **PostgreSQL 16+** with `postgis` and `pgvector` extensions enabled

---

### Option A: 🐳 Docker Compose (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kaushik-khodke/Vikasit-Nagpur-Hackathon.git
   cd Vikasit-Nagpur-Hackathon
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```

3. **Start the entire offline stack**:
   ```bash
   docker compose up --build
   ```

4. **Access the application**:
   - **TigerTrace Dashboard**: [`http://localhost:3000`](http://localhost:3000)
   - **FastAPI Backend Docs**: [`http://localhost:8000/docs`](http://localhost:8000/docs)
   - **PostgreSQL / PostGIS Database**: `localhost:5432` (`tigertrace`)

---

### Option B: 🛠️ Local Development Setup

#### 1. Database Setup
Ensure PostgreSQL is running locally with PostGIS and pgvector extensions:
```sql
CREATE DATABASE tigertrace;
\c tigertrace
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

#### 2. Backend (FastAPI) Setup
```bash
cd services/api
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
python -m app.main
```
*API will run on `http://127.0.0.1:8000`.*

#### 3. Frontend (Next.js) Setup
```bash
cd apps/web
npm install
npm run dev
```
*Web dashboard will run on `http://localhost:3000`.*

---

## 📡 Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | System health, PostGIS, pgvector, and model readiness status |
| `GET` | `/api/v1/dashboard/summary` | Dashboard KPI metrics, active alert count, and storage savings |
| `POST` | `/api/v1/import-runs` | Create a new camera-trap ingestion run |
| `POST` | `/api/v1/import-runs/{id}/start` | Trigger automated ingestion, triage, detection, and Re-ID |
| `GET` | `/api/v1/cameras` | List all camera stations, zones, GPS coordinates, and active status |
| `GET` | `/api/v1/tigers` | Get identified tiger catalogue with status, last seen, and confidence |
| `GET` | `/api/v1/tigers/{id}` | Detailed tiger profile with capture history, stripe patterns, and range |
| `GET` | `/api/v1/tigers/{id}/spatial` | PostGIS GeoJSON features for territory polygons, centroids, and paths |
| `GET` | `/api/v1/map/features` | Full reserve GIS layers (zones, camera stations, all tiger ranges) |
| `GET` | `/api/v1/alerts` | List movement deviation alerts filtered by severity, tiger, or status |
| `GET` | `/api/v1/alerts/{id}` | Comprehensive evidence dossier for a specific alert |
| `POST` | `/api/v1/reviews/{id}/decision` | Submit ranger action (Confirm / Dismiss / Reassign) with audit log |
| `POST` | `/api/v1/quarantine/{id}/restore` | Reversibly restore a quarantined false-trigger image |
| `POST` | `/api/v1/simulation/scenarios/{id}/run` | Execute the deterministic 3-camera hackathon demo scenario |

---

## 📚 Project Documentation Guide

The `/docs` directory contains detailed engineering and design documentation:

- 📄 [`docs/PRD.md`](docs/PRD.md): Product Requirements Document detailing objectives, problem statement, user personas, and functional requirements.
- 📄 [`docs/TigerTrace_TRD.md`](docs/TigerTrace_TRD.md): Technical Requirements Document outlining offline runtime architecture, engineering constraints, and ML evaluation criteria.
- 📄 [`docs/App_Flow.md`](docs/App_Flow.md): Comprehensive application and system flow specification from SD card to ranger alert.
- 📄 [`docs/UI_UX_Brief.md`](docs/UI_UX_Brief.md): Complete UI/UX design brief, visual direction, layout system, and component design language.
- 📄 [`docs/TigerTrace_Backend_Schema_PostgreSQL.md`](docs/TigerTrace_Backend_Schema_PostgreSQL.md): Production PostgreSQL + PostGIS + pgvector schema with SQL DDL, indexes, and constraints.
- 📄 [`docs/frontend.md`](docs/frontend.md): Frontend implementation blueprint for Next.js, shadcn/ui, MapLibre GL, and TanStack Query.

---

## 🌿 Conservation Impact & Future Roadmap

- **Multi-Reserve Federation**: Scaling from Pench Tiger Reserve to central Indian wildlife corridors (Kanha-Pench-Tadoba corridor network).
- **Direct Edge Deployment**: Running quantized ONNX/TensorRT models directly on solar-powered smart camera hubs in the field.
- **Advanced Ecological Modeling**: Integrating scientific Kernel Density Estimation (KDE) and Spatially Explicit Capture-Recapture (SECR) models.
- **Acoustic & Thermal Multimodal Fusion**: Combining camera-trap visual stripe patterns with acoustic bio-sensors for comprehensive reserve security.

---

<div align="center">
  <sub>TigerTrace — From Camera Trap to Conservation Action 🐅</sub><br/>
  <sub>Developed for the Vikasit Bharat / Vikasit Nagpur Hackathon</sub>
</div>
