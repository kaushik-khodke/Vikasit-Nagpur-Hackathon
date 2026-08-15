TigerTrace
Automated Camera-Trap Triage, Individual Tiger Identification & Movement Intelligence System
Version: 1.0
Project Type: Hackathon MVP / Prototype
Target Deployment: Pench Tiger Reserve
Primary Users: Forest Department staff, wildlife researchers, conservation managers
Prototype Scale: 3 simulated camera-trap stations
Deployment Constraint: Offline-first, ordinary laptop, no dedicated GPU or internet required
________________________________________
1. Product Overview
1.1 Product Name
TigerTrace
1.2 Product Title
TigerTrace: An Offline AI Platform for Automated Camera-Trap Triage, Tiger Re-identification and Movement Intelligence
1.3 Product Vision
TigerTrace is an offline-first wildlife intelligence platform designed to transform raw camera-trap imagery into actionable individual-tiger intelligence.
The system will automatically process camera-trap images, remove blank/false-trigger frames through safe quarantine, identify individual tigers using their unique stripe patterns, maintain a persistent history of tiger observations, estimate individual tiger occupancy and movement ranges, and detect meaningful deviations such as movement into unfamiliar territory, buffer regions, or village-adjacent areas.
For the hackathon MVP, physical cameras will be represented by three simulated camera stations containing sample/synthetic camera-trap data. The architecture will nevertheless be designed so that the same pipeline can later ingest real SD-card image folders from field cameras.
________________________________________
2. Problem Statement
Pench Tiger Reserve deploys camera traps across grid-based stations during monitoring cycles. These deployments can generate tens of thousands of images, many of which are false triggers caused by vegetation, insects, rain, heat shimmer, changing light and other environmental conditions.
Manual processing requires substantial time before useful ecological information can be extracted.
The next challenge is identifying individual tigers. Tigers can be distinguished through their unique flank stripe patterns, but manually comparing photographs against an existing catalogue is slow and error-prone.
Finally, understanding whether a tiger's movement is normal or represents a meaningful behavioural/spatial deviation requires comparing current observations with historical movement patterns.
The PS therefore requires an end-to-end system that converts raw camera-trap folders into:
•	Cleaned image data
•	Individual tiger identities
•	Persistent tiger histories
•	Spatial occupancy information
•	Movement patterns
•	Behavioural/spatial deviation alerts
The source PS specifically requires raw image-directory ingestion, individual identification, mapped occupancy and deviation/trend alerts.
________________________________________
3. Product Objectives
TigerTrace will achieve the following primary objectives:
O1 — Automate camera-trap triage
Automatically distinguish useful images from blank/false-trigger images and safely quarantine irrelevant frames.
O2 — Identify individual tigers
Detect a tiger, isolate its flank/stripe pattern and match it against a growing individual catalogue.
O3 — Build persistent tiger intelligence
Store each observation with:
•	Tiger ID
•	Image
•	Camera station
•	Timestamp
•	GPS coordinates
•	Confidence
•	Detection information
O4 — Generate tiger-wise spatial intelligence
For every known tiger, calculate and visualize:
•	Capture locations
•	Activity centroid
•	Estimated occupied area
•	Approximate home range
•	Territory overlap
O5 — Detect movement deviations
Compare current observations with historical behaviour and detect meaningful changes.
O6 — Produce actionable alerts
Generate alerts when a tiger:
•	Moves outside its established range
•	Appears at a previously unused station
•	Moves toward buffer areas
•	Appears near village-adjacent stations
•	Disappears for an unusually long period
O7 — Remain usable offline
The prototype should operate without internet connectivity and without requiring a dedicated GPU, reflecting the field-hardware constraint in the PS.
________________________________________
4. Target Users
4.1 Primary User — Forest Department Staff
Needs:
•	Simple dashboard
•	Camera processing status
•	Tiger locations
•	Alerts
•	Evidence behind alerts
•	Easy-to-understand maps
•	No requirement for data-science expertise
4.2 Secondary User — Wildlife Researchers
Needs:
•	Individual tiger histories
•	Capture records
•	Spatial occupancy
•	Movement patterns
•	Historical comparisons
•	Confidence scores
•	Exportable data
4.3 System Administrator
Needs:
•	Camera configuration
•	Data ingestion
•	Model configuration
•	Database management
•	Audit logs
•	Review queue
The PS explicitly states that the interface should be usable by forest-department staff who are not data scientists and that automated decisions must be auditable and correctable by humans.
________________________________________
5. MVP Scope
The initial prototype will use 3 simulated camera stations.
5.1 Camera Configuration
CAM-01
Zone: Core forest
Purpose: Establish normal tiger activity.
CAM-02
Zone: Core / overlapping territory
Purpose: Demonstrate multiple tiger observations and territorial overlap.
CAM-03
Zone: Buffer / village-adjacent region
Purpose: Demonstrate abnormal movement and generate an alert.
The three-camera configuration is a prototype simplification. The architecture must not hard-code the number of cameras.
Future deployments should be able to add additional camera stations without changing the core processing pipeline.
________________________________________
6. High-Level System Architecture
                    TIGERTRACE
                         │
             ┌───────────┴───────────┐
             │                       │
       SIMULATION MODE          FIELD MODE
             │                       │
      3 Virtual Cameras         SD Card Folder
             │                       │
             └───────────┬───────────┘
                         ▼
                 DATA INGESTION
                         │
                         ▼
                BLANK IMAGE FILTER
                         │
                         ▼
                  TIGER DETECTION
                         │
                         ▼
                  FLANK EXTRACTION
                         │
                         ▼
                STRIPE / RE-ID ENGINE
                         │
                         ▼
                  TIGER DATABASE
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      SPATIAL         HISTORY       ANALYTICS
      ENGINE          ENGINE          ENGINE
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                  DEVIATION ENGINE
                         │
                         ▼
                    ALERT ENGINE
                         │
                         ▼
                 TIGERTRACE DASHBOARD
________________________________________
7. Core Functional Requirements
FR-01 — Camera Data Ingestion
The system shall accept camera-trap image directories.
For the MVP, each virtual camera will have its own directory:
camera_data/
├── CAM_01/
├── CAM_02/
└── CAM_03/
Each image should have associated metadata where available.
The ingestion engine shall:
1.	Scan camera directories.
2.	Discover supported image files.
3.	Extract timestamps.
4.	Associate images with camera IDs.
5.	Read available GPS/location information.
6.	Detect malformed or unreadable files.
7.	Add valid images to the processing queue.
The architecture must support messy real-world input such as inconsistent folder names, camera-clock problems and mixed SD-card data.
________________________________________
FR-02 — Blank Image Detection
The system shall classify incoming images as:
•	Blank / false trigger
•	Wildlife
•	Tiger
•	Human
•	Other relevant subject
The minimum MVP requirement is to reliably distinguish:
Blank vs useful image
Blank examples may include:
•	Empty forest
•	Moving vegetation
•	Rain
•	Shadows
•	Lighting changes
•	Insects
•	Heat shimmer
The PS specifically identifies these types of false triggers as a major source of camera-trap workload.
________________________________________
FR-03 — Safe Image Quarantine
Blank images must not be permanently deleted immediately.
Instead:
Incoming
   │
   ▼
AI Classification
   │
   ├── Useful ──► Working Dataset
   │
   └── Blank ──► Quarantine
Each quarantined image should retain:
•	Original path
•	Classification
•	Confidence
•	Timestamp
•	Camera ID
•	Quarantine timestamp
The user should have the ability to restore a quarantined image.
This satisfies the PS requirement for reversible/staged deletion.
________________________________________
FR-04 — Processing Statistics
After each run, TigerTrace shall display:
•	Total images processed
•	Blank images detected
•	Useful images retained
•	Tigers detected
•	Processing time
•	Estimated storage saved
•	Processing throughput
Example:
PROCESSING COMPLETE

Images Processed       12,480
Blank Images            9,847
Useful Images           2,633
Tigers Detected            31
Processing Time         4m 28s
Storage Saved           3.8 GB
________________________________________
FR-05 — Tiger Detection
For retained images, the system shall determine whether a tiger is present.
For each detection:
Image
  ↓
Tiger Detection
  ↓
Bounding Box
  ↓
Tiger Crop
The system shall store:
•	Detection confidence
•	Bounding-box coordinates
•	Source image
•	Camera ID
•	Timestamp
________________________________________
FR-06 — Flank Extraction
For detected tigers, TigerTrace shall attempt to isolate the flank region.
Original Image
       ↓
Tiger Detection
       ↓
Tiger Crop
       ↓
Flank Detection
       ↓
Stripe Region
The flank crop becomes the primary visual input for individual re-identification.
________________________________________
FR-07 — Individual Tiger Re-identification
TigerTrace shall compare extracted stripe patterns against the existing tiger catalogue.
Possible results:
High-confidence match
TGR-001
Confidence: 94%
Automatically associate the observation with the individual.
Ambiguous match
Possible:
TGR-001 — 52%
TGR-004 — 47%

ACTION:
Human Review Required
No match
Create a new candidate individual:
New Individual

TGR-005
Status: Pending Verification
The PS explicitly requires automatic enrollment of new individuals and human review of ambiguous matches.
________________________________________
FR-08 — Persistent Tiger Database
The system shall maintain a queryable database.
Tiger
Tiger
-----
id
name
sex
status
first_seen
last_seen
confidence
Camera Station
CameraStation
-------------
id
name
latitude
longitude
zone
status
Observation
Observation
-----------
id
tiger_id
camera_id
image_id
timestamp
latitude
longitude
confidence
Image
Image
-----
id
file_path
camera_id
timestamp
classification
processing_status
Alert
Alert
-----
id
tiger_id
alert_type
severity
timestamp
station_id
confidence
evidence
status
This structure supports the PS requirement to link individual tigers to images, stations, timestamps and GPS locations.
________________________________________
FR-09 — Tiger Profile
Each tiger shall have a dedicated profile.
Example:
TGR-001

Sex: Male
First Seen: 2026-06-03
Last Seen: 2026-08-15

Known Stations:
CAM-01
CAM-02

Estimated Range:
42.3 km²

Activity Centroid:
21.xxxx, 79.xxxx

Current Status:
⚠ MOVEMENT DEVIATION
The profile shall include:
•	Representative image
•	Stripe pattern
•	Capture history
•	Station history
•	Map
•	Range
•	Movement timeline
•	Alerts
•	Confidence information
________________________________________
FR-10 — Spatial Intelligence
For every individual tiger, TigerTrace shall calculate:
Capture Locations
All stations where the tiger has been detected.
Activity Centroid
Approximate geographic centre of recorded activity.
Occupied Area
Estimated spatial area covered by observations.
Home Range
Approximate historical movement area.
Territory Overlap
Display areas shared by multiple individuals.
The PS explicitly requires these outputs and map visualization.
For the MVP, these calculations may use simplified spatial methods appropriate for demonstration rather than claiming scientific-grade ecological estimation.
________________________________________
FR-11 — Reserve Map
The dashboard shall contain an interactive map.
Map elements:
•	Camera stations
•	Tiger territories
•	Tiger activity centroids
•	Capture locations
•	Movement paths
•	Buffer region
•	Village-adjacent area
•	Alert locations
•	Territory overlap
Example:
             CORE ZONE

      🟢 CAM-01
          │
          │
       🐅 TGR-001
          │
          ▼
      🟢 CAM-02
          │
          │
──────────┼──────────
       BUFFER
          │
          ▼
      🔴 CAM-03
          │
          ▼
       VILLAGE

       🚨 ALERT
________________________________________
FR-12 — Movement History
TigerTrace shall maintain a chronological movement history.
Example:
TGR-001

June 10     CAM-01
June 18     CAM-01
June 25     CAM-02
July 03     CAM-02
July 18     CAM-01
Aug 15      CAM-03 🚨
The dashboard shall visualize the movement trajectory.
________________________________________
FR-13 — Movement Deviation Detection
The deviation engine shall compare current observations against historical behaviour.
Minimum detection rules:
Rule A — New Station
IF tiger appears at a station
AND station has never appeared in tiger history
THEN generate NEW_STATION alert
Rule B — Range Shift
IF current activity/location
moves beyond configured historical threshold
THEN generate RANGE_SHIFT alert
The PS specifies thresholds of approximately 15–20 sq km in the core and 5 km in the buffer region. These values should be configurable rather than hard-coded.
Rule C — Buffer Movement
IF tiger moves into buffer region
THEN generate BUFFER_ENTRY alert
Rule D — Village-Adjacent Movement
IF tiger appears at a village-adjacent station
THEN generate HIGH_PRIORITY alert
Rule E — Prolonged Absence
IF normally regular tiger
is not detected for configured period
THEN generate ABSENCE alert
________________________________________
FR-14 — Survey-Effort Awareness
TigerTrace must avoid treating every new detection as behavioural deviation.
Example:
Camera CAM-03 was installed recently.

TGR-001 appears at CAM-03.

System:
"This is a new observation,
but insufficient historical coverage exists
to classify this as a genuine movement deviation."
This is a critical requirement because the PS specifically warns that a tiger appearing at a new station may be caused by new camera deployment rather than actual behavioural change.
________________________________________
FR-15 — Alert Engine
Every alert shall contain:
•	Alert ID
•	Tiger ID
•	Alert type
•	Date/time
•	Camera station
•	Location
•	Severity
•	Confidence
•	Detected change
•	Historical baseline
•	Supporting image
•	Supporting movement history
•	Recommended review/action status
Example:
🚨 MOVEMENT DEVIATION

Tiger: TGR-001
Station: CAM-03
Zone: Village Buffer

Reason:
First recorded capture outside established range.

Historical Range:
CAM-01 → CAM-02

Current Detection:
CAM-03

Confidence:
94%

Evidence:
[Image] [Movement History] [Map]

Status:
Requires Forest Staff Review
________________________________________
FR-16 — Human Review System
The system shall provide a review queue for uncertain AI decisions.
Review categories:
•	Ambiguous tiger identity
•	Possible false blank
•	New tiger candidate
•	Low-confidence detection
•	Movement deviation
Reviewer actions:
[ ACCEPT ]
[ REJECT ]
[ ASSIGN TIGER ]
[ RESTORE IMAGE ]
All manual corrections should be logged.
________________________________________
FR-17 — Auditability
Every AI decision should have traceable information.
For example:
Decision:
TGR-001

Model Confidence:
94%

Input:
IMG_008321.jpg

Processing Time:
1.24 seconds

Decision:
Automatic Match

Reviewer:
Not Required
For ambiguous results:
AI:
TGR-001 — 51%
TGR-004 — 48%

Decision:
Human Review

Reviewer:
Forest Staff

Final:
TGR-004
________________________________________
FR-18 — Demo / Simulation Mode
The MVP shall provide a dedicated Simulation Mode.
The simulation represents three camera stations.
CAM-01
CAM-02
CAM-03
The simulator will generate a controlled sequence of observations.
Demonstration Scenario
Stage 1
TGR-001 is repeatedly detected at CAM-01 and CAM-02.
Status:
NORMAL
Stage 2
TGR-002 is detected at CAM-02.
System establishes overlapping activity.
Stage 3
TGR-001 appears at CAM-03.
CAM-03 represents a buffer/village-adjacent station.
System detects:
•	New station
•	Outside established range
•	Buffer/village proximity
Stage 4
TigerTrace generates:
🚨 MOVEMENT DEVIATION ALERT
This gives judges a complete end-to-end demonstration without requiring physical camera hardware.
________________________________________
8. Dashboard Requirements
The main dashboard should contain:
Header
🐅 TIGERTRACE
Pench Tiger Reserve Intelligence
● Offline System
KPI Cards
Tigers        Cameras        Images        Alerts
   4             3            12,480          2
Main Map
Largest dashboard component.
Displays:
•	Cameras
•	Tigers
•	Territories
•	Movement paths
•	Alert zones
Recent Alerts
🚨 TGR-001
Village Buffer Entry
2 min ago

⚠ TGR-003
New Station
18 min ago
Processing Status
Last Run:
12,480 images

Blank:
9,847

Useful:
2,633

Processing:
Complete
________________________________________
9. Main Application Screens
Screen 1 — Dashboard
Purpose:
Give forest staff a complete system overview.
________________________________________
Screen 2 — Camera Stations
Show:
•	Camera ID
•	Location
•	Zone
•	Images processed
•	Last processing time
•	Camera status
Example:
CAM-01   Core       ● Active
CAM-02   Core       ● Active
CAM-03   Buffer     ● Active
________________________________________
Screen 3 — Processing Center
User can:
[ SELECT CAMERA DATA ]
[ START PROCESSING ]
Then view:
Scanning...
Filtering...
Detecting...
Identifying...
Updating database...
Generating spatial intelligence...
Generating alerts...
________________________________________
Screen 4 — Tiger Catalogue
Grid of all identified individuals.
Each card:
[Tiger Image]

TGR-001
Male
Confidence: 96%
Last Seen: CAM-03
Status: 🚨 Alert
________________________________________
Screen 5 — Tiger Profile
Contains:
•	Identity
•	Stripe image
•	Capture history
•	Movement timeline
•	Map
•	Range
•	Alerts
________________________________________
Screen 6 — Reserve Map
Dedicated GIS visualization.
________________________________________
Screen 7 — Alerts
Filter by:
•	Severity
•	Tiger
•	Date
•	Alert type
•	Station
•	Status
________________________________________
Screen 8 — Human Review
Review uncertain AI results.
________________________________________
10. MVP Data Model
                    ┌──────────────┐
                    │    TIGER     │
                    └──────┬───────┘
                           │
                           │ 1:N
                           ▼
                    ┌──────────────┐
                    │ OBSERVATION  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  IMAGE   │ │  CAMERA  │ │ LOCATION │
        └──────────┘ └──────────┘ └──────────┘

                    TIGER
                      │
                      │ 1:N
                      ▼
                   ALERT
________________________________________
11. Suggested Technology Stack
Frontend
•	React
•	TypeScript
•	Vite
•	Tailwind CSS
•	Map-based visualization
•	Charting library for analytics
Backend
•	Python
•	FastAPI
•	REST APIs
•	Background processing pipeline
Database
For MVP:
•	SQLite
Future:
•	PostgreSQL/PostGIS
AI / Computer Vision
Potential components:
•	Object detection model
•	Blank-image classifier
•	Tiger/flank detector
•	Visual embedding model
•	Similarity search for stripe re-identification
The exact models should be selected after dataset/model benchmarking rather than being unnecessarily fixed at the PRD stage.
Geospatial
Potential:
•	GeoPandas
•	Shapely
•	Folium/Leaflet or equivalent frontend mapping
Deployment
Primary target:
Windows/Linux Laptop
        │
        ▼
TigerTrace Local Server
        │
        ▼
Browser
No cloud dependency should be required for the MVP.
________________________________________
12. Non-Functional Requirements
NFR-01 — Offline Operation
Core processing must work without internet.
NFR-02 — Hardware
The system should target an ordinary laptop without a dedicated GPU, as required by the PS.
NFR-03 — Performance
Processing tens of thousands of images should be practical.
For the MVP, benchmark:
•	Images/minute
•	Total processing time
•	Memory usage
•	CPU usage
NFR-04 — Reliability
One corrupt image must not crash the entire processing run.
NFR-05 — Explainability
Every alert must show why it was generated.
NFR-06 — Human Control
Users must be able to correct AI decisions.
NFR-07 — Privacy
Images containing humans must be handled with appropriate privacy safeguards, as specified by the PS.
NFR-08 — Auditability
Automated decisions and manual corrections must be recorded.
________________________________________
13. MVP vs Future Scope
MVP — Hackathon
Camera Infrastructure
•	3 simulated camera stations
AI
•	Blank-image filtering
•	Tiger detection
•	Tiger identification prototype
•	Confidence scoring
Database
•	Tiger catalogue
•	Camera records
•	Observation records
•	Alerts
Spatial
•	Camera locations
•	Tiger capture points
•	Basic territory/range visualization
•	Movement path
•	Buffer/village zone
Intelligence
•	New station detection
•	Range deviation
•	Buffer/village alert
•	Basic prolonged absence logic
UI
•	Dashboard
•	Map
•	Tiger profiles
•	Alerts
•	Processing center
•	Human review
________________________________________
Future Production Version
•	10s/100s of real camera stations
•	Direct SD-card ingestion
•	Real-time/periodic synchronization
•	Advanced tiger re-identification
•	Scientific home-range estimation
•	PostGIS
•	Large-scale distributed processing
•	Camera health monitoring
•	Automated model retraining
•	Multi-reserve deployment
•	Advanced ecological analytics
•	Mobile field application
•	Role-based access control
•	Integration with existing forest-management systems
________________________________________
14. Demo Scenario
The complete hackathon demonstration should follow this sequence.
Step 1 — Show the problem
12,480 Raw Camera Images
Explain that most contain no useful subject.
________________________________________
Step 2 — Start Processing
Click:
PROCESS CAMERA DATA
TigerTrace processes CAM-01, CAM-02 and CAM-03.
________________________________________
Step 3 — Show Triage
12,480 Images
      ↓
9,847 Blank
2,633 Useful
Show quarantine rather than destructive deletion.
________________________________________
Step 4 — Show Tiger Identification
The system detects:
TGR-001
TGR-002
TGR-003
TGR-004
Open TGR-001 and show its stripe-pattern profile.
________________________________________
Step 5 — Show Historical Movement
TGR-001 historically appears at:
CAM-01
CAM-02
Its estimated territory is displayed on the map.
________________________________________
Step 6 — Process New Data
A new observation appears:
CAM-03
________________________________________
Step 7 — Generate Alert
TigerTrace identifies:
New Station
+
Outside Historical Range
+
Buffer/Village Proximity
Then:
🚨 MOVEMENT DEVIATION DETECTED
________________________________________
Step 8 — Show Evidence
The judge can click:
VIEW EVIDENCE
and see:
•	Detection image
•	Tiger ID
•	Confidence
•	Camera location
•	Historical locations
•	Movement trajectory
•	Current location
•	Reason for alert
________________________________________
Step 9 — Human Decision
Forest staff can:
[ CONFIRM ALERT ]
[ DISMISS ]
[ REVIEW TIGER ID ]
________________________________________
15. Key Success Metrics
The PS identifies several evaluation areas. TigerTrace should track these explicitly.
Image Triage
•	Blank detection accuracy
•	False-negative rate
•	Images processed/minute
•	Storage saved
Tiger Identification
•	Identification accuracy
•	Top-1 match accuracy
•	Top-K candidate accuracy
•	Unknown/new individual detection
Spatial Intelligence
•	Correct capture-location mapping
•	Range visualization quality
•	Territory overlap visualization
Alerts
•	Alert precision
•	False-alert rate
•	Confidence quality
•	Evidence completeness
System
•	Processing throughput
•	Memory usage
•	Offline reliability
•	Human correction rate
•	UI usability
________________________________________
16. Security & Privacy
The system shall:
•	Keep camera data locally for the offline MVP.
•	Avoid unnecessary cloud uploads.
•	Restrict access to sensitive wildlife-location information.
•	Provide appropriate handling of images containing humans.
•	Maintain audit logs.
•	Prevent irreversible deletion without safeguards.
________________________________________
17. Risks and Mitigation
Risk	Mitigation
Limited real tiger dataset	Use permitted public/sample data + controlled simulation
Tiger re-ID accuracy	Confidence threshold + human review
False alerts	Historical baseline + survey-effort awareness
Laptop performance	Lightweight models + batch processing
Corrupt images	Fault-tolerant ingestion
Camera timestamp errors	Validation and anomaly flags
Limited hackathon hardware	3 virtual camera MVP
Lack of live cameras	Simulation mode
Overclaiming scientific accuracy	Clearly label spatial calculations as prototype estimates
________________________________________
18. Core Product Principle
TigerTrace should never silently guess.
Every automated result should follow:
AI Detection
     ↓
Confidence
     ↓
Decision
     ↓
Evidence
     ↓
Human Correction if Required
This is especially important for tiger identity and movement alerts because an incorrect identification can propagate into incorrect ecological conclusions.
________________________________________
19. Product Differentiation
TigerTrace should not be positioned simply as:
"An AI model that identifies tigers."
The product should be positioned as:
An offline end-to-end camera-trap intelligence system that converts raw field imagery into individual tiger histories, spatial intelligence and actionable movement-deviation alerts.
The key innovation is therefore the integration of multiple stages into a single auditable workflow:
RAW DATA
   ↓
TRIAGE
   ↓
IDENTIFICATION
   ↓
PERSISTENT MEMORY
   ↓
SPATIAL INTELLIGENCE
   ↓
HISTORICAL COMPARISON
   ↓
DEVIATION DETECTION
   ↓
ACTIONABLE ALERT
________________________________________
20. Final MVP Definition
TigerTrace MVP is considered successful when a judge can perform the following workflow on a laptop:
1. Load simulated camera data
            ↓
2. Process 3 camera stations
            ↓
3. Remove/quarantine blank images
            ↓
4. Detect tiger images
            ↓
5. Identify individual tigers
            ↓
6. Store observations
            ↓
7. View tiger history
            ↓
8. View territory/range on map
            ↓
9. Process a new observation
            ↓
10. Detect abnormal movement
            ↓
11. Generate an alert
            ↓
12. Open supporting evidence
            ↓
13. Human reviewer confirms/corrects
If this complete workflow works reliably, the MVP demonstrates the core intent of the problem statement.
________________________________________
21. One-Line Product Pitch
TigerTrace transforms raw camera-trap imagery into individual tiger intelligence — identifying tigers, mapping their movements, and alerting forest teams when their behaviour or range changes.
________________________________________
22. Hackathon Demonstration Tagline
From Camera Trap to Conservation Action.

