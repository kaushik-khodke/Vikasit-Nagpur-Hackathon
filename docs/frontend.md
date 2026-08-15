You are the senior frontend engineer responsible for building the TigerTrace frontend.

PROJECT:
TigerTrace is an automated wildlife-intelligence and camera-trap monitoring platform designed for the hackathon problem statement for tiger surveillance.

The system will eventually process camera-trap images, identify individual tigers using stripe/flank re-identification, maintain historical observations, estimate movement/range, detect movement deviations and generate actionable alerts.

IMPORTANT:
This phase is FRONTEND ONLY.

Do NOT implement the backend, PostgreSQL, PostGIS, pgvector, AI inference, camera ingestion or real API integration yet.

However, the frontend architecture MUST be API-ready so that the mock data layer can later be replaced by FastAPI APIs without redesigning the UI.

==================================================
1. TECHNOLOGY STACK
==================================================

Use:

- Next.js 16+
- TypeScript
- App Router
- Tailwind CSS
- shadcn/ui
- Lucide React icons
- TanStack Query for server-state/API-ready data fetching
- Zustand only where global client state is actually required
- React Hook Form
- Zod
- Recharts
- MapLibre GL JS
- ESLint
- Prettier

Do not introduce unnecessary libraries.

Use strict TypeScript.

Avoid any usage of `any` unless absolutely unavoidable.

==================================================
2. DESIGN DIRECTION
==================================================

TigerTrace must look like an official wildlife-management / forest-department operations platform.

The UI should be:

- Professional
- Official
- Clean
- Light theme
- Modern
- Trustworthy
- Evidence-driven
- Map-centric
- Information-rich but not cluttered
- Desktop-first
- Suitable for a forest officer/researcher
- Suitable for a hackathon judge demonstration

DO NOT make it look like:

- A gaming dashboard
- Cyberpunk UI
- Cryptocurrency dashboard
- Neon AI dashboard
- Sci-fi command center
- Generic SaaS template

Use a restrained conservation-inspired visual language.

Primary visual direction:

- Light neutral background
- White surfaces/cards
- Deep forest/navy primary color
- Muted green for normal/success
- Amber for warnings/review
- Red for critical alerts
- Blue for informational states
- Dark neutral typography

IMPORTANT:
Never rely on color alone to communicate status.

Use:
- Icons
- Labels
- Badges
- Text
- Color

together.

==================================================
3. APPLICATION SHELL
==================================================

Create a professional desktop application shell.

Layout:

--------------------------------------------------
TOP BAR
--------------------------------------------------
TigerTrace logo/name
Reserve name
System status
Simulation mode indicator
Settings
--------------------------------------------------
SIDEBAR | MAIN CONTENT
         |
         |
         |
--------------------------------------------------

Sidebar navigation:

MAIN
- Dashboard
- Monitoring
- Processing

WILDLIFE
- Tigers
- Camera Stations
- Reserve Map

INTELLIGENCE
- Alerts
- Movement Analysis

MANAGEMENT
- Review Queue
- Settings

The sidebar must clearly show the active route.

Use Lucide icons.

==================================================
4. GLOBAL SYSTEM STATUS
==================================================

The top bar should show:

System:
● Operational

Database:
Connected

AI:
Ready

Mode:
Simulation

For the MVP, display:

SIMULATION MODE

This must be visually obvious.

Do not pretend simulated camera data is live field data.

==================================================
5. ROUTES
==================================================

Create these routes:

/
 /dashboard

 /monitoring
 /processing

 /tigers
 /tigers/[id]

 /cameras
 /cameras/[id]

 /map

 /movement

 /alerts
 /alerts/[id]

 /review

 /settings

Use Next.js App Router.

==================================================
6. DASHBOARD
==================================================

Create the main TigerTrace command dashboard.

The dashboard should immediately answer:

1. How many tigers are being tracked?
2. How many cameras are active?
3. How much data has been processed?
4. Are there active alerts?
5. Where is the activity happening?
6. What happened in the latest processing run?

Top KPI cards:

- Tigers Tracked
- Active Cameras
- Images Processed
- Useful Images
- Active Alerts

Example demo values:

Tigers Tracked:
4

Active Cameras:
3

Images Processed:
12,480

Useful Images:
2,633

Active Alerts:
1

These are temporary mock values.

Do NOT hard-code these values inside UI components.

Use typed mock data.

Dashboard sections:

1. KPI cards
2. Reserve map preview
3. Active alerts
4. Recent tiger observations
5. Latest processing run
6. Camera status

==================================================
7. PROCESSING CENTER
==================================================

Create:

/processing

This is one of the most important hackathon demo screens.

Header:

Camera Data Processing

Controls:

Data Source:
[ All Cameras ]

Mode:
[ Simulation ]

Button:

[ Run Simulation ]

Show processing pipeline:

1. Ingestion
2. Image Validation
3. Blank Image Filter
4. Tiger Detection
5. Flank Extraction
6. Tiger Re-identification
7. Database Update
8. Spatial Analysis
9. Deviation Analysis
10. Alert Generation

Use a visual stepper/progress component.

Processing states:

- Pending
- Processing
- Completed
- Failed

Show:

Total Images
Processed
Blank Images
Useful Images
Tiger Detections
New Tigers
Alerts Generated

After processing finishes, show a clean summary card.

==================================================
8. IMAGE TRIAGE RESULT
==================================================

Create a result section:

IMAGE TRIAGE COMPLETE

12,480
Total Images

9,847
Blank / Quarantined

2,633
Useful Images

3.8 GB
Estimated Storage Saved

Actions:

[ View Quarantine ]

[ Continue Processing ]

Important:

Do not show permanent deletion.

Use terminology:

Quarantine

because blank images will later be safely handled by the backend.

==================================================
9. CAMERA STATIONS
==================================================

Create:

/cameras

Display three MVP camera stations:

CAM-01
Core Zone
Active

CAM-02
Core / Overlap
Active

CAM-03
Village Adjacent
Active

Each card should show:

- Camera ID
- Zone
- Status
- Last processing time
- Image count
- Latest observation
- Location

Clicking a camera opens:

/cameras/[id]

Camera details:

- Camera information
- Map location
- Recent images
- Recent tiger detections
- Processing history
- Statistics

==================================================
10. TIGER CATALOGUE
==================================================

Create:

/tigers

Show tiger cards/table.

Example:

TGR-001
Male
Normal
Last Seen: CAM-02
Confidence: 96%

TGR-002
Female
Normal

TGR-003
Unknown
Review Required

TGR-004
Male
Alert

Provide:

- Search
- Filter by status
- Filter by sex
- Sort by last seen
- Sort by confidence

==================================================
11. TIGER PROFILE
==================================================

Create:

/tigers/[id]

This is a major screen.

Header:

TGR-001
● NORMAL

Show:

- Representative tiger image
- Identity confidence
- First seen
- Last seen
- Known camera stations
- Estimated occupied area
- Activity centroid

Tabs:

Overview
Movement
Map
Images
Alerts

Overview:

Identity information
Current status
Recent observations
Statistics

Movement:

Timeline
Camera sequence
Movement summary

Map:

Tiger observations
Historical range
Current location

Images:

Camera images
Flank crops
Detection images

Alerts:

Alerts associated with this tiger

==================================================
12. TIGER IDENTIFICATION UI
==================================================

Create a reusable identification result component.

Display:

FLANK IMAGE

Candidate:

TGR-001

Identity Confidence:

94%

Previous Stations:

CAM-01
CAM-02

Decision:

AUTO MATCH

Actions:

[ Accept ]

[ Review ]

For ambiguous matches:

AMBIGUOUS IDENTIFICATION

TGR-001
52%

TGR-004
48%

Actions:

[ Assign TGR-001 ]
[ Assign TGR-004 ]
[ Create New Tiger ]
[ Reject ]

This is only UI/mock interaction for now.

==================================================
13. RESERVE MAP
==================================================

Create:

/map

Use MapLibre GL JS.

The map should show:

- Camera stations
- Tiger observation points
- Movement paths
- Tiger range
- Activity centroid
- Core zone
- Buffer zone
- Village-adjacent zone
- Alert locations

Use mock coordinates for the MVP.

Do NOT hard-code map logic directly into components.

Create a typed map-data layer.

Example:

camera:
{
  id,
  code,
  latitude,
  longitude,
  zone
}

observation:
{
  tigerId,
  cameraId,
  latitude,
  longitude,
  timestamp
}

range:
{
  tigerId,
  geometry
}

==================================================
14. MOVEMENT ANALYSIS
==================================================

Create:

/movement

Show:

Tiger selector:

[ TGR-001 ▼ ]

Then:

Movement timeline

Example:

CAM-01
↓
CAM-01
↓
CAM-02
↓
CAM-02
↓
CAM-01
↓
CAM-03 🚨

Show:

Historical Range
Current Location
New Station
Distance from Baseline
Activity Centroid

Combine:

- Timeline
- Map
- Statistics

==================================================
15. ALERTS
==================================================

Create:

/alerts

Show alert list.

Example:

CRITICAL
TGR-001
Village-Adjacent Movement
CAM-03
93% confidence

MEDIUM
TGR-003
New Camera Station
CAM-02
76% confidence

Filters:

- All
- Open
- Confirmed
- Dismissed
- Critical
- High
- Medium

==================================================
16. ALERT DETAILS
==================================================

Create:

/alerts/[id]

This is the HERO screen of the application.

Show:

🚨 MOVEMENT DEVIATION

Tiger:
TGR-001

Current Station:
CAM-03

Zone:
Village Adjacent

Identity Confidence:
94%

Alert Confidence:
93%

Reason:

First recorded capture outside the
established historical activity area.

Evidence section:

1. Current image
2. Historical images
3. Historical stations
4. Current location
5. Historical range
6. Current location vs baseline
7. Survey-effort check

Buttons:

[ View Map ]

[ View Tiger ]

[ Confirm Alert ]

[ Dismiss Alert ]

==================================================
17. REVIEW QUEUE
==================================================

Create:

/review

Categories:

Identity Review
Blank Image Review
New Tiger Review
Movement Alert Review

Each review item should show:

- Evidence
- Confidence
- Reason
- Created time
- Recommended action

Create reusable review components.

==================================================
18. SIMULATION MODE
==================================================

The MVP does not have real camera feeds.

Therefore implement a controlled simulation interface.

Create a Simulation Mode indicator.

Simulation scenarios:

1. Normal Movement
2. New Camera Detection
3. Village-Adjacent Movement
4. Ambiguous Tiger Match

Primary scenario:

NORMAL

TGR-001:
CAM-01
↓
CAM-02

Then:

NEW OBSERVATION

TGR-001:
CAM-03

Then:

MOVEMENT DEVIATION

🚨 ALERT

Important:

The frontend simulation must NOT directly set the final alert state.

Instead create a simulated event layer that behaves like an API response.

Architecture:

Simulation Event
      ↓
Mock Service
      ↓
Query/State Layer
      ↓
UI

Later:

Real FastAPI
      ↓
Same Query/State Layer
      ↓
UI

This is extremely important.

==================================================
19. MOCK DATA ARCHITECTURE
==================================================

Do NOT place mock data directly in JSX.

Create:

src/data/

mock-tigers.ts
mock-cameras.ts
mock-observations.ts
mock-alerts.ts
mock-processing.ts
mock-zones.ts
mock-reviews.ts

Create:

src/types/

tiger.ts
camera.ts
observation.ts
alert.ts
processing.ts
review.ts
map.ts

Create:

src/services/

api.ts
simulation.ts

Example architecture:

Component
   ↓
Hook
   ↓
Service
   ↓
Mock API

Later:

Component
   ↓
Hook
   ↓
Service
   ↓
FastAPI
   ↓
PostgreSQL/PostGIS/pgvector

The component should not know whether the data came from mock data or the real backend.

==================================================
20. COMPONENT ARCHITECTURE
==================================================

Create reusable components.

src/components/

layout/
  app-shell.tsx
  sidebar.tsx
  topbar.tsx

dashboard/
  kpi-card.tsx
  alert-summary.tsx
  camera-summary.tsx
  processing-summary.tsx

tigers/
  tiger-card.tsx
  tiger-table.tsx
  tiger-profile.tsx
  tiger-status.tsx
  identity-result.tsx
  match-review.tsx

cameras/
  camera-card.tsx
  camera-status.tsx
  camera-details.tsx

processing/
  processing-stepper.tsx
  processing-stats.tsx
  triage-result.tsx
  processing-summary.tsx

map/
  reserve-map.tsx
  map-legend.tsx
  tiger-marker.tsx
  camera-marker.tsx
  movement-path.tsx

alerts/
  alert-card.tsx
  alert-list.tsx
  alert-evidence.tsx
  alert-severity.tsx

review/
  review-card.tsx
  review-queue.tsx

ui/
  buttons
  cards
  badges
  dialogs
  tables
  tabs
  tooltips
  etc.

==================================================
21. STATE MANAGEMENT
==================================================

Use TanStack Query for server/API-like state.

Use Zustand only for small global UI state such as:

- Sidebar state
- Selected tiger
- Simulation mode
- Map filters
- Global UI preferences

Do not put all application data into Zustand.

==================================================
22. RESPONSIVENESS
==================================================

Primary target:

Desktop / laptop

Design first for:

1440 × 900

Also support:

1280 × 800

1024 × 768

At smaller widths:

- Collapse sidebar
- Reduce secondary panels
- Preserve critical alert information
- Preserve map usability

Mobile is NOT the primary MVP target.

==================================================
23. LOADING / ERROR / EMPTY STATES
==================================================

Every page must have:

Loading state
Empty state
Error state
Success state

Never leave an empty white screen.

Example:

No active alerts:

✓ No active movement deviations

Do not display:

"No data"

without explaining what the user should do.

==================================================
24. ACCESSIBILITY
==================================================

Implement:

- Keyboard navigation
- Visible focus states
- Good contrast
- Semantic HTML
- ARIA labels where needed
- Accessible dialogs
- Accessible tables
- Tooltips for unfamiliar map controls
- Status communicated using text + icon + color

==================================================
25. PERFORMANCE
==================================================

Optimize for a smooth laptop experience.

Use:

- Dynamic imports for heavy map components
- Lazy loading where appropriate
- Memoization only where useful
- Virtualized tables if necessary
- Optimized images
- Avoid unnecessary re-renders
- Avoid huge client-side datasets
- Server components where appropriate
- Client components only when interaction is required

==================================================
26. NO STATIC UI
==================================================

Although this phase uses mock data, the UI must NOT be a collection of static screenshots.

Interactions must work.

Examples:

Clicking a tiger:
→ opens profile

Clicking an alert:
→ opens alert details

Clicking camera:
→ opens camera details

Changing tiger:
→ updates movement/map

Changing filters:
→ updates displayed data

Running simulation:
→ updates processing state

Processing completion:
→ updates dashboard statistics

Generating movement scenario:
→ creates the simulated alert state

Confirming alert:
→ changes alert status

Dismissing alert:
→ changes alert status

==================================================
27. DEMO FLOW
==================================================

The frontend must support this exact judge demonstration:

1. Open Dashboard

2. Show:
   4 Tigers
   3 Cameras
   12,480 Images
   1 Active Alert

3. Open Processing

4. Click:
   RUN SIMULATION

5. Show pipeline:

   Ingestion
   ↓
   Validation
   ↓
   Blank Filtering
   ↓
   Tiger Detection
   ↓
   Re-identification
   ↓
   Spatial Analysis
   ↓
   Alert Analysis

6. Show triage:

   12,480 images
   9,847 blank
   2,633 useful

7. Show:

   TGR-001 identified

8. Open TGR-001

9. Show normal movement:

   CAM-01
   CAM-02

10. Trigger simulation:

   TGR-001 detected at CAM-03

11. Show:

   🚨 MOVEMENT DEVIATION

12. Open alert evidence.

13. Show:

   Current image
   Historical stations
   Historical range
   Current location
   Confidence
   Reason

14. Show map.

15. Confirm alert.

This should be the primary polished demo path.

==================================================
28. IMPORTANT ARCHITECTURAL RULE
==================================================

Do not build fake frontend logic that will need to be thrown away.

The frontend should model the eventual backend contracts.

Future backend:

Next.js
   ↓
FastAPI
   ↓
Services
   ├── Image Ingestion
   ├── Detection
   ├── Re-ID
   ├── Spatial Analysis
   └── Alert Engine
          ↓
PostgreSQL
PostGIS
pgvector

For now:

Next.js
   ↓
Mock API / Simulation Service
   ↓
Typed Data Models

The transition from mock API to FastAPI should require changing service implementation/configuration, not rebuilding components.

==================================================
29. CODE QUALITY
==================================================

Follow industry practices:

- Strict TypeScript
- Small reusable components
- Clear naming
- No duplicated UI
- No giant page components
- No business logic inside JSX
- No API calls directly inside presentation components
- No hard-coded repeated constants
- Environment variables for configuration
- Proper error boundaries where useful
- Proper route loading states
- Proper metadata
- Clean folder structure
- Comments only where they add value

==================================================
30. DELIVERABLE
==================================================

Build the complete frontend.

The result should include:

- Professional application shell
- All routes
- Dashboard
- Processing Center
- Camera Stations
- Tiger Catalogue
- Tiger Profiles
- Reserve Map
- Movement Analysis
- Alerts
- Alert Evidence
- Review Queue
- Simulation Mode
- Loading states
- Error states
- Empty states
- Mock API/data layer
- Typed models
- Reusable components
- Responsive desktop layout

The application must run successfully with:

npm install
npm run dev

No backend should be required to start the frontend.

==================================================
31. FINAL QUALITY BAR
==================================================

Before considering the frontend complete, verify:

- No broken routes
- No TypeScript errors
- No console errors
- No missing images causing broken layouts
- No static dead buttons
- All navigation works
- All major interactions work
- Simulation flow works end-to-end
- Alert flow works end-to-end
- Map loads correctly
- Tiger profile navigation works
- Review workflow works
- Desktop layout looks polished at 1440×900
- Mock data is isolated from UI components
- API abstraction is ready for FastAPI integration

Do not stop after creating only the dashboard.

Build the complete TigerTrace frontend experience.