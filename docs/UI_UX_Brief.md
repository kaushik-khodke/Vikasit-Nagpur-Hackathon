TIGERTRACE
UI/UX Design Brief
Offline Wildlife Intelligence Control Room for Pench Tiger Reserve
Hackathon MVP | 3 Simulated Camera Stations | Desktop-first
Version 1.0 | August 2026
1. Purpose
This brief defines the visual direction, information architecture, interaction principles and screen-level UX requirements for TigerTrace. The UI must make a technically complex AI and geospatial workflow understandable to forest-department users and hackathon judges without requiring data-science expertise.
The PS requires usability for forest staff who are not data scientists and requires automated decisions to be auditable and correctable by humans. fileciteturn0file0L45-L51
2. Product UX Vision
TigerTrace should feel like a professional conservation operations platform rather than a generic AI dashboard.
Core UX promise:
RAW CAMERA DATA  →  AI PROCESSING  →  TIGER MEMORY
        →  SPATIAL INTELLIGENCE  →  MOVEMENT ALERT  →  HUMAN ACTION
•	Calm when the ecosystem is normal.
•	Highly visible when something needs attention.
•	Evidence before conclusions.
•	Simple language before technical terminology.
•	Map-first for spatial decisions.
•	Every important AI decision is explainable and reversible where applicable.
3. Target Users
User	Primary Needs	UX Priority
Forest Department Staff	Alerts, map, tiger identity, clear actions	Very High
Wildlife Researcher	History, spatial analytics, observations, evidence	High
Reviewer	Ambiguous AI results and correction tools	High
Judge / Demo Viewer	Immediate understanding of end-to-end value	High
4. Design Personality
Attribute	Direction
Overall	Official, professional, calm, field-operations oriented
Visual Density	Information-rich but organized; avoid clutter
Tone	Precise, trustworthy, evidence-driven
Interaction	Fast, predictable, low-friction
Aesthetic	Modern conservation technology; not gaming/cyberpunk
Motion	Subtle and purposeful; no decorative animations
Accessibility	High contrast, readable typography, clear status semantics
5. Visual Design Direction
Use a light, professional interface with restrained nature-inspired accents. The application should not rely on a dark 'AI command center' aesthetic.
Element	Recommended Direction
Base	Warm/off-white or very light neutral background
Surface	White cards with subtle borders/shadows
Primary	Deep forest/navy tone for navigation and major controls
Success	Muted green
Warning	Amber
Critical	Red
Info	Blue
Text	Dark neutral, not pure black
Map	Muted base map with strong alert overlays
Status colors must not be the only signal; pair color with icons, labels and text.
6. Typography
•	Use a clean sans-serif such as Inter or Geist.
•	Use strong hierarchy: page title → section title → metric → supporting metadata.
•	Avoid excessively small text in tables and map panels.
•	Numerical KPIs should use tabular/monospaced numerals where supported.
•	Use sentence case for labels and actions.
7. Layout System
Desktop-first because the MVP targets a forest-office laptop. Recommended minimum design frame: 1440 × 900.
┌─────────────────────────────────────────────────────────────┐
│ TOP BAR: Logo | Reserve | System Status | User/Settings     │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│ SIDEBAR       │                 MAIN CONTENT                 │
│               │                                             │
│ Dashboard     │                                             │
│ Processing    │                                             │
│ Tigers        │                                             │
│ Cameras       │                                             │
│ Map           │                                             │
│ Alerts        │                                             │
│ Review        │                                             │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
Recommended sidebar width: approximately 220–250 px. Main content should prioritize the map and high-value operational information.
8. Global Navigation
🐅 TIGERTRACE

MAIN
  Dashboard
  Monitoring
  Processing

WILDLIFE
  Tigers
  Camera Stations
  Reserve Map

INTELLIGENCE
  Alerts
  Movement Analysis

MANAGEMENT
  Review Queue
  System / Settings
Avoid the term 'Live CCTV' for the MVP because camera traps are represented as image-capture stations rather than continuous video feeds.
9. Dashboard UX
The dashboard is the operational home screen and must answer four questions immediately:
•	How many tigers are being tracked?
•	Are the cameras/data processing healthy?
•	Is anything abnormal happening?
•	Where is it happening?
┌──────────────────────────────────────────────────────────┐
│ TIGERTRACE                         ● OFFLINE / READY      │
├──────────┬──────────┬──────────┬─────────────────────────┤
│ TIGERS   │ CAMERAS  │ IMAGES   │ ACTIVE ALERTS          │
│ 4        │ 3        │ 12,480   │ 2                     │
├───────────────────────────────────────┬──────────────────┤
│                                       │ ALERTS           │
│             RESERVE MAP               │ 🚨 TGR-001       │
│                                       │ ⚠ TGR-003        │
├───────────────────────────────────────┴──────────────────┤
│ LAST PROCESSING RUN                                      │
└──────────────────────────────────────────────────────────┘
The active-alert card should be visually prominent, but normal state should remain calm rather than permanently red.
10. Processing Center UX
The processing screen is the primary demonstration screen and must make the pipeline visible.
PROCESS CAMERA DATA

Source
[ All 3 Cameras ▼ ]

[ ▶ Run Simulation ]

Processing Pipeline
✓ Ingestion
✓ Validation
✓ Blank Filtering
● Tiger Detection
○ Re-identification
○ Spatial Analysis
○ Alert Analysis

Images: 7,842 / 12,480
Elapsed: 02:18
•	Show current stage.
•	Show progress and counts.
•	Allow cancellation where safe.
•	Never hide processing failures.
•	After completion, show a concise run summary and next recommended action.
11. Triage Results UX
The triage result should communicate the value of automation immediately.
IMAGE TRIAGE COMPLETE

12,480  Total
 9,847  Blank / Quarantined
 2,633  Useful
 3.8 GB  Estimated Storage Saved

[ View Quarantine ]   [ Continue to Tiger Detection ]
Quarantine must be presented as safe/reversible rather than destructive because the PS explicitly requires staged deletion. fileciteturn0file0L20-L25
12. Tiger Identification UX
The identity interface should visually prioritize the flank/stripe evidence and confidence.
┌────────────────────────────────────────────────────┐
│ IDENTIFICATION RESULT                              │
├───────────────────────┬────────────────────────────┤
│                       │ MATCH                       │
│     [ FLANK IMAGE ]   │ TGR-001                    │
│                       │ Confidence 94%             │
│                       │                             │
│                       │ Previous: CAM-01, CAM-02  │
└───────────────────────┴────────────────────────────┘
                  [ Accept ] [ Review ]
Avoid presenting a confidence score as absolute truth. Pair it with a decision state such as Auto-match, Review required or New candidate.
13. Ambiguous Match UX
Ambiguous matches require a comparison workspace.
AMBIGUOUS IDENTIFICATION

NEW OBSERVATION          CANDIDATES
[ FLANK IMAGE ]          TGR-001   52%
                         TGR-004   48%

[ Assign TGR-001 ]  [ Assign TGR-004 ]
[ Create New Tiger ] [ Reject ]
The PS requires ambiguous matches to be surfaced for human review rather than silently guessed. fileciteturn0file0L26-L30
14. Tiger Catalogue UX
Use a clean card/table hybrid. Cards are useful for visual identity; a table is useful for operational scanning.
Tiger	Last Seen	Stations	Range	Status
TGR-001	Today 14:32	CAM-01, CAM-02	42.3 km²	🟢 Normal
TGR-002	Today 13:17	CAM-02	31.7 km²	🟢 Normal
TGR-003	Today 12:51	CAM-02	—	⚠ Review
TGR-004	Today 14:41	CAM-03	—	🚨 Alert
15. Tiger Profile UX
The profile should be an evidence-rich single source of truth.
TGR-001                                  🟢 NORMAL

[ Representative Stripe Image ]

Identity confidence     96%
First seen              CAM-01
Last seen               CAM-02
Known stations          CAM-01, CAM-02
Estimated area          42.3 km²

Tabs:
Overview | Movement | Map | Images | Alerts
The PS expects each identified individual to have a persistent relationship with images, stations, timestamps and GPS locations. fileciteturn0file0L26-L31
16. Map UX
The reserve map is the primary spatial-intelligence surface.
•	Camera markers with station IDs.
•	Tiger observation points.
•	Historical movement path.
•	Current/last-seen marker.
•	Individual territory/range polygons.
•	Activity centroid.
•	Core, buffer and village-adjacent zones.
•	Territory overlap.
•	Alert location.
Use muted map styling so operational overlays remain visually dominant.
LEGEND
● Camera
🐅 Tiger observation
— Movement path
▒ Historical range
🔴 Alert
▧ Buffer
▥ Village-adjacent
The PS requires mapped occupancy, home-range estimates, activity centroid and territorial overlap. fileciteturn0file0L32-L36
17. Movement Analysis UX
The movement page should combine timeline and map instead of forcing the user to interpret raw coordinates.
TGR-001 MOVEMENT

JUN 10   CAM-01
JUN 18   CAM-01
JUN 25   CAM-02
JUL 03   CAM-02
JUL 18   CAM-01
AUG 15   CAM-03  🚨

[ Timeline ]       [ Map ]

•	Highlight first-time station use.
•	Show current versus historical range.
•	Allow time-window filtering.
•	Explain why a movement is classified as abnormal.
18. Alert UX
Alerts are the most important operational output. They should be actionable, not noisy.
🚨 MOVEMENT DEVIATION

TGR-001
CAM-03 · Village Adjacent

First recorded capture outside
established historical activity area.

Tiger identity       94%
Movement evidence    91%
Alert confidence     93%

[ View Evidence ]
[ View Map ]
[ Confirm ]
[ Dismiss ]
The PS requires alerts to state what changed, supporting evidence and confidence. fileciteturn0file0L39-L44
19. Alert Severity
Level	Meaning	UI Treatment
Critical	Village-adjacent/high-risk movement	Strong alert banner + icon + red accent
High	Meaningful range/buffer deviation	Prominent alert card
Medium	New station or prolonged absence	Standard alert card
Info	Informational/non-actionable event	Quiet notification
Severity must be communicated using label + icon + color, not color alone.
20. Alert Evidence Drawer/Page
Clicking an alert should open a complete evidence view.
•	Current image
•	Tiger identity evidence
•	Current camera and zone
•	Historical capture stations
•	Historical range
•	Current location
•	Triggered rule
•	Survey-effort check
•	Confidence
•	Review actions
WHY WAS THIS ALERT GENERATED?

1. Tiger identity confirmed
2. Station is new for TGR-001
3. Current point is outside baseline
4. Station is village-adjacent
5. No survey-effort artifact detected

Conclusion:
Movement deviation requires review.
This directly supports the PS requirement that alerts distinguish genuine deviations from artifacts such as newly installed cameras. fileciteturn0file0L42-L44
21. Human Review UX
Review must feel like an operational decision workflow, not a model-debugging screen.
•	Large evidence image.
•	Clear candidate comparison.
•	One-line explanation.
•	Confidence and uncertainty visible.
•	Primary action obvious.
•	Secondary action available.
•	Audit confirmation after decision.
22. Simulation UX
The simulator should be visible enough for judges to understand but should not look fake or arcade-like.
SIMULATION MODE

Scenario:
[ Normal → New Station → Village Alert ▼ ]

Cameras
● CAM-01
● CAM-02
● CAM-03

[ ▶ Run Scenario ]

Events
14:31  CAM-01  TGR-001
14:34  CAM-02  TGR-001
14:41  CAM-03  TGR-001  🚨
The simulator must feed the actual processing pipeline. The frontend must not directly manufacture the final alert.
23. Empty, Loading and Error States
State	UX Requirement
Empty	Explain what the user should do next; never show a blank screen
Loading	Show stage/progress when operation is long-running
Partial	Clearly indicate what completed and what failed
Error	Explain impact and recovery action
Offline	Show system state; core local functions remain available
No Alerts	Use calm confirmation such as 'No active movement deviations'
24. Notifications and Feedback
•	Use toast notifications for short-lived confirmations.
•	Use persistent alert cards for operational issues.
•	Never use a toast as the only place to expose a critical alert.
•	After destructive-looking actions, show reversible state and recovery.
•	Use clear success/error wording rather than technical stack traces.
25. Accessibility
•	WCAG-oriented contrast targets.
•	Keyboard-accessible controls.
•	Visible focus states.
•	Tooltips for unfamiliar map symbols.
•	Do not rely on color alone.
•	Readable minimum body text.
•	Accessible labels for icons.
•	Clear error messages.
•	Support browser zoom without breaking primary workflows.
26. Responsive Behavior
Desktop is the primary target. The layout should still adapt to smaller laptop resolutions.
•	At 1440 px: full sidebar + map + alert panel.
•	At ~1280 px: reduce secondary panels and preserve map.
•	At ~1024 px: collapse sidebar to icons/overlay.
•	Mobile is not a primary MVP target; do not compromise desktop information density solely for mobile.
27. Interaction Principles
•	One primary action per screen.
•	Progressive disclosure for advanced analytics.
•	Keep critical evidence within one or two clicks from an alert.
•	Never make the user remember a tiger ID while investigating an alert.
•	Preserve filter state when moving between map, tiger profile and alerts.
•	Use confirmation for irreversible or high-impact actions.
•	Make the system's current processing state obvious.
28. Design System Components
Component	Use
App Shell	Global navigation and system status
KPI Card	High-level operational metrics
Status Badge	Normal/review/alert states
Alert Card	Actionable deviation summary
Evidence Card	Image + metadata + confidence
Tiger Card	Individual summary
Data Table	Operational scanning
Timeline	Movement history
Map Legend	Spatial semantics
Drawer/Modal	Focused evidence/review
Progress Stepper	Processing pipeline
Empty State	Guided next action
Toast	Short confirmation
29. Iconography
Use a consistent outline icon set such as Lucide. Wildlife symbols may be used sparingly for tiger/camera identity, but avoid emoji as the primary production UI language.
•	Camera: camera icon
•	Tiger: animal/tiger icon or approved custom mark
•	Alert: triangle/notification icon
•	Normal: check-circle
•	Review: eye/search icon
•	Location: map-pin
•	Processing: loader/activity
30. Motion Guidelines
•	Processing: subtle stage progress.
•	New alert: brief attention animation once, not continuous flashing.
•	Map: smooth pan/zoom.
•	Panel transitions: short and restrained.
•	Avoid animated backgrounds, particle effects and decorative 3D elements.
The application is a forest-department operations tool; motion should communicate state rather than create spectacle.
31. Judge Demo UX
The interface should support a short, highly legible demonstration.
DASHBOARD
   ↓
RUN SIMULATION
   ↓
SHOW 12,480 RAW IMAGES
   ↓
TRIAGE RESULT
   ↓
TGR-001 IDENTIFIED
   ↓
SHOW NORMAL RANGE
   ↓
NEW CAM-03 OBSERVATION
   ↓
🚨 ALERT
   ↓
MAP + EVIDENCE
   ↓
CONFIRM ALERT
The 'hero moment' is the transition from a normal tiger movement pattern to a clearly explained village-adjacent deviation alert.
32. Visual Hierarchy for the Hero Alert
NORMAL STATE
Green/neutral interface
       ↓
New observation
Blue information state
       ↓
Rule evaluation
Subtle processing state
       ↓
Confirmed deviation
Red critical alert
       ↓
Evidence
Neutral analytical view
       ↓
Human confirmation
Clear success state
This prevents the dashboard from feeling permanently alarming and makes the actual deviation visually meaningful.
33. UX Data Integrity Rules
•	Never display a tiger identity without its confidence/decision state where relevant.
•	Never show an alert without its reason.
•	Never show a spatial polygon without a label explaining its meaning.
•	Never show simulated data without a Simulation Mode indicator.
•	Never imply that prototype range estimates are scientifically validated home ranges.
•	Always provide a path from an alert to its supporting image and historical evidence.
34. Recommended Final UI Structure
TIGERTRACE
│
├── Dashboard
│   ├── KPIs
│   ├── Reserve Map
│   ├── Active Alerts
│   └── Processing Summary
│
├── Monitoring
│   ├── Camera Status
│   └── Recent Observations
│
├── Processing
│   ├── Select Source
│   ├── Pipeline Progress
│   ├── Triage Results
│   └── Run History
│
├── Tigers
│   ├── Catalogue
│   └── Tiger Profile
│
├── Reserve Map
│   ├── Territories
│   ├── Movement
│   └── Camera Stations
│
├── Alerts
│   ├── Alert List
│   └── Evidence
│
└── Review Queue
    ├── Identity Review
    ├── Blank Review
    └── Alert Review
35. UI/UX Definition of Done
•	Every primary flow can be completed without developer assistance.
•	No core dashboard data is hard-coded.
•	Processing progress is visible and recoverable.
•	Ambiguous AI decisions have a review path.
•	Every alert explains what changed and why.
•	Map and tiger history are connected.
•	Simulation mode is clearly labelled.
•	Critical states are accessible without relying on color alone.
•	UI remains usable on the target laptop resolution.
•	A judge can understand the core value within the first minute.
36. Final Design Direction
TigerTrace should look like an official wildlife-management product: light, professional, map-centric, evidence-driven and restrained. The product should communicate confidence without pretending AI is infallible. The most important visual story is not the number of charts or AI widgets; it is the clear transition from raw camera data to an individual tiger's historical pattern and, when justified, to an actionable movement alert.
The source PS specifically evaluates usability, interpretability of occupancy output, actionability of alerts, robustness and suitability for intended end users. The UI therefore prioritizes operational clarity over visual novelty. fileciteturn0file0L52-L56
