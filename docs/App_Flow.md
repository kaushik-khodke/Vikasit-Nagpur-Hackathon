TIGERTRACE
Application Flow Document
Automated Camera-Trap Triage, Individual Tiger Identification & Movement Intelligence
Pench Tiger Reserve | Hackathon MVP | 3 Simulated Camera Stations
Version 1.0 | August 2026
1. Application Flow Objective
This document defines the end-to-end user and system flow for the TigerTrace MVP. The application is designed around three simulated camera stations for the prototype, while preserving the same processing path that will later accept real camera-trap SD-card folders.
The flow follows the core PS requirements: raw directory ingestion, safe blank-image handling, tiger identification, persistent observations, spatial intelligence, deviation detection, alerts and human review. fileciteturn0file0L16-L19 fileciteturn0file0L20-L44
2. Overall System Flow
TIGERTRACE
    │
    ▼
SYSTEM CHECK
    │
    ▼
DASHBOARD
    │
    ├── Camera Stations
    ├── Tigers
    ├── Reserve Map
    ├── Processing
    ├── Alerts
    └── Review Queue
              │
              ▼
      PROCESS CAMERA DATA
              │
              ▼
          INGESTION
              │
              ▼
       IMAGE TRIAGE AI
         │          │
       BLANK      USEFUL
         │          │
   QUARANTINE      ▼
             TIGER DETECTION
                    │
                    ▼
             FLANK EXTRACTION
                    │
                    ▼
               TIGER RE-ID
             /      |                MATCHED AMBIGUOUS  NEW
            |        |        |
            |     REVIEW      |
            └────────┼────────┘
                     ▼
             OBSERVATION DB
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       HISTORY    SPATIAL     BASELINE
                     │
                     ▼
             DEVIATION ENGINE
                 /                    NORMAL    DEVIATION
                         │
                         ▼
                    ALERT ENGINE
                         │
                         ▼
                    HUMAN REVIEW
3. Entry and System Check
When TigerTrace starts, the application performs a local readiness check.
•	Database availability
•	AI model availability
•	Storage availability
•	Camera configuration
•	Local map/simulation data
The user then enters the main dashboard. The MVP does not require authentication unless a later deployment introduces multi-user access.
4. Dashboard Flow
The dashboard is the primary control room view.
•	Total identified tigers
•	Configured camera stations
•	Images processed
•	Active alerts
•	Latest processing run
•	Reserve map
•	Recent alerts
The dashboard is data-driven: KPI values, tiger records, camera records and alerts must come from the local backend/database rather than static frontend mock data.
5. Camera Station Flow
Camera	Zone	MVP Purpose
CAM-01	Core	Establish normal tiger activity
CAM-02	Core / overlap	Show multiple individuals and territorial overlap
CAM-03	Buffer / village-adjacent	Generate abnormal movement scenario
The three-camera count is an MVP decision. The backend must remain camera-count agnostic.
6. Camera Data Processing Flow
The user opens Processing and chooses either real camera data or the deterministic simulation.
SELECT DATA SOURCE
   │
   ├── CAM-01
   ├── CAM-02
   ├── CAM-03
   └── ALL CAMERAS
          │
          ▼
   START PROCESSING
          │
          ▼
   INGEST → VALIDATE → TRIAGE → DETECT → RE-ID
          → DATABASE → SPATIAL → DEVIATION → ALERT
For the hackathon, the preferred control is RUN SIMULATION. The simulator must feed the same backend pipeline instead of directly creating final results.
7. Processing Pipeline UI
CAMERA DATA
    ↓ ✓
INGESTION
    ↓ ✓
IMAGE VALIDATION
    ↓ ✓
BLANK IMAGE FILTER
    ↓ ✓
TIGER DETECTION
    ↓ ✓
FLANK EXTRACTION
    ↓ ✓
TIGER RE-IDENTIFICATION
    ↓ ✓
DATABASE UPDATE
    ↓ ✓
SPATIAL ANALYSIS
    ↓ ✓
DEVIATION ANALYSIS
    ↓ ✓
ALERT GENERATION
    ↓ ✓
PROCESSING COMPLETE
8. Image Triage Flow
TigerTrace first separates blank/false-trigger images from useful images.
12,480 RAW IMAGES
        │
        ▼
   BLANK FILTER
      /        BLANK   USEFUL
     │        │
     ▼        ▼
QUARANTINE  DOWNSTREAM AI
•	Display total images processed.
•	Display blank/false-trigger count.
•	Display useful images retained.
•	Display estimated storage saved.
•	Keep blank images in reversible quarantine rather than permanently deleting them.
The PS explicitly requires safe/reversible blank-image removal and reporting of processing/storage savings. fileciteturn0file0L20-L25
9. Tiger Detection and Flank Extraction
USEFUL IMAGE
     │
     ▼
OBJECT DETECTION
     │
     ▼
TIGER BOUNDING BOX
     │
     ▼
TIGER CROP
     │
     ▼
FLANK EXTRACTION
     │
     ▼
STRIPE REPRESENTATION
The detection record stores source image, bounding box and confidence. The flank crop becomes the input for individual re-identification.
10. Tiger Re-identification Flow
FLANK IMAGE
    │
    ▼
STRIPE EMBEDDING
    │
    ▼
SIMILARITY SEARCH
    │
    ├──────────────┬───────────────┐
    ▼              ▼               ▼
MATCHED       AMBIGUOUS          NEW
    │              │               │
    ▼              ▼               ▼
AUTO LINK       HUMAN REVIEW    NEW TIGER
    │              │               │
    └──────────────┼───────────────┘
                   ▼
             OBSERVATION DB
Confident matches may be assigned automatically. Ambiguous matches must enter human review, while sufficiently novel observations can create a new individual candidate. This matches the PS requirement for persistent individual identification and human handling of ambiguous matches. fileciteturn0file0L26-L31
11. Human Review Flow
Review Type	What the User Sees	Available Actions
Ambiguous Tiger	New flank image + candidate tiger references + similarity scores	Assign TGR / Create New / Reject
Possible Blank	Image + blank confidence	Quarantine / Restore
New Individual	Reference crop + catalogue	Enroll / Merge / Reject
Movement Alert	Map + image + baseline + reason	Confirm / Dismiss / Investigate
Every manual decision should create an audit record.
12. Tiger Catalogue Flow
After processing, the user can open Tigers to see all known/candidate individuals.
TIGER CATALOGUE

TGR-001   Male      NORMAL
TGR-002   Female    NORMAL
TGR-003   Unknown   REVIEW
TGR-004   Male      ALERT
Each tiger card should show representative image, public ID, identity confidence, last seen station and current status.
13. Tiger Profile Flow
Selecting a tiger opens a detailed profile.
•	Identity and representative stripe image
•	First and last observed timestamps
•	Known camera stations
•	Capture history
•	Estimated occupied area
•	Activity centroid
•	Movement map
•	Historical baseline
•	Active alerts
•	Supporting images
TGR-001
│
├── Overview
├── Movement
├── Map
├── Images
└── Alerts
14. Movement History Flow
TGR-001 MOVEMENT HISTORY

June
CAM-01
  ↓
CAM-01
  ↓
CAM-02

July
CAM-02
  ↓
CAM-01

August
CAM-02
The movement view should show a chronological sequence and a map trajectory. This historical record becomes the baseline for deviation analysis.
15. Spatial Intelligence Flow
OBSERVATIONS
     │
     ├── Capture Points
     ├── Activity Centroid
     ├── Occupied Area
     ├── Approx. Home Range
     └── Territory Overlap
             │
             ▼
       RESERVE MAP
The PS requires mapped capture locations, a home-range estimate, activity centroid, estimated occupied area and visible overlap between individuals. fileciteturn0file0L32-L36
16. Reserve Map
The reserve map is the primary visual intelligence surface.
•	Camera station markers
•	Tiger capture points
•	Tiger movement paths
•	Individual range polygons
•	Activity centroid
•	Core zone
•	Buffer zone
•	Village-adjacent zone
•	Alert locations
•	Territory overlap
             CORE ZONE

        🟢 CAM-01
                           🐅 TGR-001
                                   🟢 CAM-02

────────────────────────
             BUFFER

                  🔴 CAM-03
                      │
                   VILLAGE
17. Critical Movement-Deviation Demo
This is the hero workflow for the hackathon demonstration.
INITIAL STATE

TGR-001
Known stations:
CAM-01
CAM-02

Status: NORMAL

        ↓

NEW CAMERA DATA

TGR-001 detected at CAM-03

        ↓

BASELINE COMPARISON

        ↓

NEW STATION?
YES

        ↓

OUTSIDE HISTORICAL RANGE?
YES

        ↓

BUFFER / VILLAGE ADJACENT?
YES

        ↓

🚨 MOVEMENT DEVIATION ALERT
The PS requires alerts for range shifts, first capture at unused stations, movement into/toward buffer or village-adjacent stations and prolonged absence. It also requires the system to account for uneven survey effort. fileciteturn0file0L37-L44
18. Alert Generation Flow
NEW OBSERVATION
       │
       ▼
IDENTITY CONFIRMED
       │
       ▼
LOAD TIGER BASELINE
       │
       ▼
CHECK DEVIATION RULES
       │
       ├── No deviation → NORMAL
       │
       └── Deviation
              │
              ▼
       SURVEY-EFFORT CHECK
              │
              ▼
        BUILD EVIDENCE
              │
              ▼
        CREATE ALERT
19. Alert Evidence Screen
Alerts must explain what changed instead of showing only a generic warning.
🚨 MOVEMENT DEVIATION

Tiger: TGR-001
Current Station: CAM-03
Zone: Village Adjacent

Reason:
First recorded capture outside the
established historical activity area.

Historical Stations:
CAM-01, CAM-02

Current:
CAM-03

Tiger Identity Confidence: 94%
Alert Confidence: 93%

[ VIEW IMAGE ]
[ VIEW MOVEMENT ]
[ VIEW MAP ]
[ CONFIRM ALERT ]
[ DISMISS ]
The PS requires each alert to state the change, supporting evidence and confidence level. fileciteturn0file0L39-L44
20. Human Alert Response
The forest staff user can confirm or dismiss an alert.
CONFIRM ALERT
     ↓
ALERT = CONFIRMED
     ↓
AUDIT EVENT CREATED

OR

DISMISS ALERT
     ↓
SELECT REASON
     ├── Camera newly installed
     ├── False identification
     ├── Insufficient evidence
     └── Other
     ↓
AUDIT EVENT CREATED
This supports the PS requirement that genuine behavioural deviations be distinguished from artifacts caused by uneven survey effort. fileciteturn0file0L42-L44
21. Recommended Navigation
🐅 TIGERTRACE

MAIN
├── Dashboard
├── Monitoring
└── Processing

WILDLIFE
├── Tigers
├── Camera Stations
└── Reserve Map

INTELLIGENCE
├── Alerts
└── Movement Analysis

MANAGEMENT
├── Review Queue
└── System / Settings
22. Complete Judge Demonstration Flow
OPEN TIGERTRACE
      ↓
DASHBOARD
      ↓
3 CAMERAS / IMAGE COUNTS
      ↓
RUN SIMULATION
      ↓
IMAGE TRIAGE
      ↓
TIGER DETECTION
      ↓
TGR-001 IDENTIFIED
      ↓
SHOW TIGER HISTORY
      ↓
SHOW NORMAL TERRITORY
      ↓
PROCESS NEW CAMERA DATA
      ↓
TGR-001 DETECTED AT CAM-03
      ↓
🚨 MOVEMENT DEVIATION
      ↓
SHOW MAP + EVIDENCE
      ↓
HUMAN CONFIRMATION
      ↓
CONFIRMED ALERT
23. Critical Technical Principle
The frontend must never fake the final alert. The simulated camera event must enter the same backend ingestion and processing pipeline that real SD-card data will use.
SIMULATOR
    ↓
INGESTION
    ↓
AI / RE-ID
    ↓
DATABASE
    ↓
HISTORICAL BASELINE
    ↓
DEVIATION ENGINE
    ↓
ALERT
    ↓
FRONTEND
This makes the MVP technically defensible: the cameras are simulated, but the application behavior and backend decision path are real.
24. MVP Success Condition
The MVP is successful when a judge can see the complete transformation from camera-trap data to actionable conservation intelligence:
RAW DATA
   ↓
TRIAGE
   ↓
TIGER IDENTIFICATION
   ↓
PERSISTENT MEMORY
   ↓
SPATIAL INTELLIGENCE
   ↓
HISTORICAL COMPARISON
   ↓
DEVIATION DETECTION
   ↓
🚨 ACTIONABLE ALERT
This end-to-end approach aligns with the PS's expected deliverables: a working pipeline demonstrated on sample raw data, an individual database, map-based occupancy visualization, functioning alerts and supporting documentation. fileciteturn0file0L57-L59
25. Prototype-to-Field Transition
MVP	Future Field Deployment
3 simulated cameras	10s/100s of real camera stations
Local sample/synthetic metadata	Real SD-card metadata
Deterministic demo scenarios	Continuous monitoring cycles
Prototype range estimation	Validated ecological range estimation
Local SQLite	PostgreSQL/PostGIS
Local model inference	Optimized field inference
Bundled demo map	Authoritative reserve GIS layers

