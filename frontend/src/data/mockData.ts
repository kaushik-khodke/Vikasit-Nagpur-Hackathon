import type {
  TigerProfile,
  Sighting,
  CameraTrap,
  AlertItem,
  CameraProcessingBatch,
  ReserveOverviewStats
} from '../types/tiger';

export const mockOverviewStats: ReserveOverviewStats = {
  totalCatalogedTigers: 6,
  maleCount: 3,
  femaleCount: 2,
  subAdultCount: 1,
  activeCameraStations: 24,
  totalCameraStations: 26,
  observationsPast30Days: 48,
  pendingReviewCount: 2,
  activeAlertsCount: 3,
};

// Deterministic mock tigers: SIM-TIG-001 through SIM-TIG-006
export const mockTigers: TigerProfile[] = [
  {
    id: 'SIM-TIG-001',
    code: 'SIM-TIG-001',
    sex: 'FEMALE',
    ageClass: 'ADULT',
    firstDetected: '2024-03-12T00:00:00Z',
    lastDetected: '2026-08-14T06:14:00Z',
    detectionCount: 38,
    confidence: 0.94,
    stripeSignature: 'STRIPE-SIG-001',
    primaryZone: 'Turia',
    activityStatus: 'ACTIVE_RESIDENT',
    cameraStations: ['STN-TR-01', 'STN-TR-04', 'STN-TR-06'],
    homeRange: {
      areaSqKm: 24.5,
      coreCenter: { lat: 21.7245, lng: 79.3182 },
      polygonCoordinates: [
        [21.745, 79.300],
        [21.750, 79.335],
        [21.720, 79.350],
        [21.705, 79.320],
        [21.715, 79.295],
        [21.745, 79.300]
      ]
    },
    detections: [
      {
        id: 'DET-001-A',
        timestamp: '2026-08-14T06:14:00Z',
        cameraStationId: 'STN-TR-04',
        cameraStationName: 'Turia Waterhole Station 04',
        zone: 'Turia',
        location: { lat: 21.7245, lng: 79.3182 },
        flankSide: 'RIGHT',
        confidence: 0.94,
        thumbnailUrl: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'DET-001-B',
        timestamp: '2026-08-10T19:30:00Z',
        cameraStationId: 'STN-TR-01',
        cameraStationName: 'Turia Core Checkpoint 01',
        zone: 'Turia',
        location: { lat: 21.7310, lng: 79.3105 },
        flankSide: 'LEFT',
        confidence: 0.92,
        thumbnailUrl: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=600&q=80'
      }
    ],
    notes: 'Adult resident female consistently captured in the central Turia sector. Stable territorial boundary observed across 18 camera stations.',
    imageUrl: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=600&q=80',
    isSynthetic: true
  },
  {
    id: 'SIM-TIG-002',
    code: 'SIM-TIG-002',
    sex: 'MALE',
    ageClass: 'ADULT',
    firstDetected: '2024-05-18T00:00:00Z',
    lastDetected: '2026-08-13T21:40:00Z',
    detectionCount: 29,
    confidence: 0.91,
    stripeSignature: 'STRIPE-SIG-002',
    primaryZone: 'Karmajhiri',
    activityStatus: 'ACTIVE_RESIDENT',
    cameraStations: ['STN-KJ-02', 'STN-KJ-05', 'STN-KJ-08'],
    homeRange: {
      areaSqKm: 46.2,
      coreCenter: { lat: 21.7892, lng: 79.2451 },
      polygonCoordinates: [
        [21.810, 79.220],
        [21.820, 79.270],
        [21.775, 79.280],
        [21.760, 79.230],
        [21.780, 79.210],
        [21.810, 79.220]
      ]
    },
    detections: [
      {
        id: 'DET-002-A',
        timestamp: '2026-08-13T21:40:00Z',
        cameraStationId: 'STN-KJ-05',
        cameraStationName: 'Karmajhiri Riverbed Station 05',
        zone: 'Karmajhiri',
        location: { lat: 21.7892, lng: 79.2451 },
        flankSide: 'RIGHT',
        confidence: 0.91,
        thumbnailUrl: 'https://images.unsplash.com/photo-1503066211613-c17ebc9daef0?auto=format&fit=crop&w=600&q=80'
      }
    ],
    notes: 'Dominant adult male occupying Karmajhiri riverine tract. Demonstrates extensive spatial range overlapping with SIM-TIG-001 boundary.',
    imageUrl: 'https://images.unsplash.com/photo-1503066211613-c17ebc9daef0?auto=format&fit=crop&w=600&q=80',
    isSynthetic: true
  },
  {
    id: 'SIM-TIG-003',
    code: 'SIM-TIG-003',
    sex: 'MALE',
    ageClass: 'ADULT',
    firstDetected: '2023-11-04T00:00:00Z',
    lastDetected: '2026-08-11T18:05:00Z',
    detectionCount: 42,
    confidence: 0.88,
    stripeSignature: 'STRIPE-SIG-003',
    primaryZone: 'Jamtara',
    activityStatus: 'MONITORED',
    cameraStations: ['STN-JM-01', 'STN-JM-04', 'STN-JM-07'],
    homeRange: {
      areaSqKm: 31.8,
      coreCenter: { lat: 21.6841, lng: 79.3892 },
      polygonCoordinates: [
        [21.705, 79.365],
        [21.710, 79.410],
        [21.665, 79.415],
        [21.660, 79.370],
        [21.705, 79.365]
      ]
    },
    detections: [
      {
        id: 'DET-003-A',
        timestamp: '2026-08-11T18:05:00Z',
        cameraStationId: 'STN-JM-04',
        cameraStationName: 'Jamtara Southern Ridge 04',
        zone: 'Jamtara',
        location: { lat: 21.6841, lng: 79.3892 },
        flankSide: 'LEFT',
        confidence: 0.88,
        thumbnailUrl: 'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?auto=format&fit=crop&w=600&q=80'
      }
    ],
    notes: 'Mature resident male in eastern Jamtara. Recent camera trap images indicate reduced gait speed.',
    imageUrl: 'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?auto=format&fit=crop&w=600&q=80',
    isSynthetic: true
  },
  {
    id: 'SIM-TIG-004',
    code: 'SIM-TIG-004',
    sex: 'FEMALE',
    ageClass: 'ADULT',
    firstDetected: '2025-01-15T00:00:00Z',
    lastDetected: '2026-08-15T04:22:00Z',
    detectionCount: 16,
    confidence: 0.87,
    stripeSignature: 'STRIPE-SIG-004',
    primaryZone: 'Khursapar',
    activityStatus: 'ACTIVE_RESIDENT',
    cameraStations: ['STN-KP-02', 'STN-KP-04'],
    homeRange: {
      areaSqKm: 18.3,
      coreCenter: { lat: 21.6312, lng: 79.2891 },
      polygonCoordinates: [
        [21.650, 79.270],
        [21.655, 79.310],
        [21.615, 79.315],
        [21.610, 79.275],
        [21.650, 79.270]
      ]
    },
    detections: [
      {
        id: 'DET-004-A',
        timestamp: '2026-08-15T04:22:00Z',
        cameraStationId: 'STN-KP-02',
        cameraStationName: 'Khursapar Valley 02',
        zone: 'Khursapar',
        location: { lat: 21.6312, lng: 79.2891 },
        flankSide: 'LEFT',
        confidence: 0.87,
        thumbnailUrl: 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=600&q=80'
      }
    ],
    notes: 'Breeding female observed with cub presence in 2026 camera trap array sequence.',
    imageUrl: 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=600&q=80',
    isSynthetic: true
  },
  {
    id: 'SIM-TIG-005',
    code: 'SIM-TIG-005',
    sex: 'MALE',
    ageClass: 'SUB_ADULT',
    firstDetected: '2025-09-20T00:00:00Z',
    lastDetected: '2026-08-12T23:12:00Z',
    detectionCount: 11,
    confidence: 0.82,
    stripeSignature: 'STRIPE-SIG-005',
    primaryZone: 'Rukhad',
    activityStatus: 'TRANSIENT',
    cameraStations: ['STN-RK-01', 'STN-RK-03'],
    homeRange: {
      areaSqKm: 58.0,
      coreCenter: { lat: 21.8542, lng: 79.4215 },
      polygonCoordinates: [
        [21.880, 79.390],
        [21.890, 79.450],
        [21.825, 79.460],
        [21.815, 79.400],
        [21.880, 79.390]
      ]
    },
    detections: [
      {
        id: 'DET-005-A',
        timestamp: '2026-08-12T23:12:00Z',
        cameraStationId: 'STN-RK-03',
        cameraStationName: 'Rukhad Forest Passage 03',
        zone: 'Rukhad',
        location: { lat: 21.8542, lng: 79.4215 },
        flankSide: 'RIGHT',
        confidence: 0.82,
        thumbnailUrl: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=600&q=80'
      }
    ],
    notes: 'Transient sub-adult male exhibiting dispersal movement across the northern forest corridor.',
    imageUrl: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=600&q=80',
    isSynthetic: true
  },
  {
    id: 'SIM-TIG-006',
    code: 'SIM-TIG-006',
    sex: 'FEMALE',
    ageClass: 'ADULT',
    firstDetected: '2025-04-10T00:00:00Z',
    lastDetected: '2026-08-14T01:50:00Z',
    detectionCount: 19,
    confidence: 0.89,
    stripeSignature: 'STRIPE-SIG-006',
    primaryZone: 'Teliya',
    activityStatus: 'ACTIVE_RESIDENT',
    cameraStations: ['STN-TL-01', 'STN-TL-02'],
    homeRange: {
      areaSqKm: 15.4,
      coreCenter: { lat: 21.7104, lng: 79.3518 },
      polygonCoordinates: [
        [21.725, 79.340],
        [21.730, 79.370],
        [21.695, 79.375],
        [21.690, 79.345],
        [21.725, 79.340]
      ]
    },
    detections: [
      {
        id: 'DET-006-A',
        timestamp: '2026-08-14T01:50:00Z',
        cameraStationId: 'STN-TL-02',
        cameraStationName: 'Teliya Reservoir Edge 02',
        zone: 'Teliya',
        location: { lat: 21.7104, lng: 79.3518 },
        flankSide: 'BOTH',
        confidence: 0.89,
        thumbnailUrl: 'https://images.unsplash.com/photo-1501706362039-c06b2d715385?auto=format&fit=crop&w=600&q=80'
      }
    ],
    notes: 'Resident female in Teliya sector. Demonstrates high camera capture frequency around waterbody fringe.',
    imageUrl: 'https://images.unsplash.com/photo-1501706362039-c06b2d715385?auto=format&fit=crop&w=600&q=80',
    isSynthetic: true
  }
];

export const mockSightings: Sighting[] = [
  {
    id: 'OBS-2026-001',
    captureId: 'CAP-TR-0814-01',
    topCandidateId: 'SIM-TIG-001',
    topCandidateConfidence: 0.91,
    secondCandidateId: 'SIM-TIG-004',
    secondCandidateConfidence: 0.87,
    isAmbiguous: true, // Narrow gap (0.91 vs 0.87) requires human verification
    timestamp: '2026-08-14T06:14:00Z',
    cameraTrapId: 'STN-TR-04',
    cameraTrapName: 'Turia Waterhole Station 04',
    zone: 'Turia',
    reviewStatus: 'PENDING_REVIEW',
    location: { lat: 21.7245, lng: 79.3182 },
    flankSide: 'RIGHT',
    thumbnailUrl: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=400&q=80',
    environmentalConditions: {
      timeOfDay: 'DAWN',
      weather: 'Clear',
      temperatureCelsius: 24
    }
  },
  {
    id: 'OBS-2026-002',
    captureId: 'CAP-KP-0815-02',
    topCandidateId: 'SIM-TIG-004',
    topCandidateConfidence: 0.94,
    secondCandidateId: 'SIM-TIG-006',
    secondCandidateConfidence: 0.72,
    isAmbiguous: false,
    timestamp: '2026-08-15T04:22:00Z',
    cameraTrapId: 'STN-KP-02',
    cameraTrapName: 'Khursapar Valley 02',
    zone: 'Khursapar',
    reviewStatus: 'VERIFIED',
    location: { lat: 21.6312, lng: 79.2891 },
    flankSide: 'LEFT',
    thumbnailUrl: 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=400&q=80',
    environmentalConditions: {
      timeOfDay: 'NIGHT',
      weather: 'Dry',
      temperatureCelsius: 22
    }
  },
  {
    id: 'OBS-2026-003',
    captureId: 'CAP-TL-0814-03',
    topCandidateId: 'SIM-TIG-006',
    topCandidateConfidence: 0.93,
    secondCandidateId: 'SIM-TIG-001',
    secondCandidateConfidence: 0.76,
    isAmbiguous: false,
    timestamp: '2026-08-14T01:50:00Z',
    cameraTrapId: 'STN-TL-02',
    cameraTrapName: 'Teliya Reservoir Edge 02',
    zone: 'Teliya',
    reviewStatus: 'VERIFIED',
    location: { lat: 21.7104, lng: 79.3518 },
    flankSide: 'BOTH',
    thumbnailUrl: 'https://images.unsplash.com/photo-1501706362039-c06b2d715385?auto=format&fit=crop&w=400&q=80',
    environmentalConditions: {
      timeOfDay: 'NIGHT',
      weather: 'Overcast',
      temperatureCelsius: 21
    }
  },
  {
    id: 'OBS-2026-004',
    captureId: 'CAP-KJ-0813-04',
    topCandidateId: 'SIM-TIG-002',
    topCandidateConfidence: 0.92,
    secondCandidateId: 'SIM-TIG-003',
    secondCandidateConfidence: 0.71,
    isAmbiguous: false,
    timestamp: '2026-08-13T21:40:00Z',
    cameraTrapId: 'STN-KJ-05',
    cameraTrapName: 'Karmajhiri Riverbed Station 05',
    zone: 'Karmajhiri',
    reviewStatus: 'VERIFIED',
    location: { lat: 21.7892, lng: 79.2451 },
    flankSide: 'RIGHT',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503066211613-c17ebc9daef0?auto=format&fit=crop&w=400&q=80',
    environmentalConditions: {
      timeOfDay: 'NIGHT',
      weather: 'Dry',
      temperatureCelsius: 23
    }
  }
];

export const mockAlerts: AlertItem[] = [
  {
    id: 'ALT-2026-001',
    title: 'Dispersal Movement Near Reserve Boundary',
    description: 'Sub-adult male SIM-TIG-005 observed at Northern Rukhad Station 03, within 500m of outer buffer line.',
    severity: 'HIGH',
    category: 'SPATIAL_DISPERSAL',
    timestamp: '2026-08-15T05:30:00Z',
    zone: 'Rukhad',
    location: { lat: 21.8542, lng: 79.4215 },
    associatedTigerId: 'SIM-TIG-005',
    acknowledged: false,
    prescribedAction: 'Notify Range Officer Rukhad for enhanced foot patrol along buffer line.'
  },
  {
    id: 'ALT-2026-002',
    title: 'Camera Trap Observation Near Village Fringe',
    description: 'Detection of SIM-TIG-006 at Teliya Station 02 proximate to peripheral agricultural fringe.',
    severity: 'MEDIUM',
    category: 'HUMAN_SETTLEMENT_PROXIMITY',
    timestamp: '2026-08-14T02:10:00Z',
    zone: 'Teliya',
    location: { lat: 21.7104, lng: 79.3518 },
    associatedTigerId: 'SIM-TIG-006',
    acknowledged: false,
    prescribedAction: 'Issue advisory to village forest committee for night vigilance.'
  },
  {
    id: 'ALT-2026-003',
    title: 'Camera Trap Station Requires Routine Battery Service',
    description: 'Station STN-JM-07 (Jamtara East) reported low capture trigger frequency over past 72 hours.',
    severity: 'LOW',
    category: 'CAMERA_STATION_MAINTENANCE',
    timestamp: '2026-08-13T10:00:00Z',
    zone: 'Jamtara',
    location: { lat: 21.6811, lng: 79.3950 },
    acknowledged: true,
    prescribedAction: 'Inspect lens cleanliness and replace AA battery pack during weekly beat route.'
  }
];

export const mockCameraTraps: CameraTrap[] = [
  {
    id: 'STN-TR-01',
    code: 'STN-TR-01',
    name: 'Turia Gate Core Station 01',
    zone: 'Turia',
    lat: 21.7310,
    lng: 79.3105,
    status: 'ONLINE',
    lastServiceDate: '2026-08-01',
    totalCapturesRecorded: 412,
    tigersObservedCount: 14
  },
  {
    id: 'STN-TR-04',
    code: 'STN-TR-04',
    name: 'Turia Waterhole Station 04',
    zone: 'Turia',
    lat: 21.7245,
    lng: 79.3182,
    status: 'ONLINE',
    lastServiceDate: '2026-08-01',
    totalCapturesRecorded: 689,
    tigersObservedCount: 22
  },
  {
    id: 'STN-KJ-05',
    code: 'STN-KJ-05',
    name: 'Karmajhiri Riverbed Station 05',
    zone: 'Karmajhiri',
    lat: 21.7892,
    lng: 79.2451,
    status: 'ONLINE',
    lastServiceDate: '2026-07-28',
    totalCapturesRecorded: 340,
    tigersObservedCount: 11
  },
  {
    id: 'STN-JM-04',
    code: 'STN-JM-04',
    name: 'Jamtara Southern Ridge 04',
    zone: 'Jamtara',
    lat: 21.6841,
    lng: 79.3892,
    status: 'ONLINE',
    lastServiceDate: '2026-08-04',
    totalCapturesRecorded: 295,
    tigersObservedCount: 9
  },
  {
    id: 'STN-KP-02',
    code: 'STN-KP-02',
    name: 'Khursapar Valley 02',
    zone: 'Khursapar',
    lat: 21.6312,
    lng: 79.2891,
    status: 'ONLINE',
    lastServiceDate: '2026-07-25',
    totalCapturesRecorded: 520,
    tigersObservedCount: 16
  },
  {
    id: 'STN-RK-03',
    code: 'STN-RK-03',
    name: 'Rukhad Forest Passage 03',
    zone: 'Rukhad',
    lat: 21.8542,
    lng: 79.4215,
    status: 'ONLINE',
    lastServiceDate: '2026-08-02',
    totalCapturesRecorded: 180,
    tigersObservedCount: 6
  },
  {
    id: 'STN-TL-02',
    code: 'STN-TL-02',
    name: 'Teliya Reservoir Edge 02',
    zone: 'Teliya',
    lat: 21.7104,
    lng: 79.3518,
    status: 'ONLINE',
    lastServiceDate: '2026-08-05',
    totalCapturesRecorded: 410,
    tigersObservedCount: 12
  },
  {
    id: 'STN-JM-07',
    code: 'STN-JM-07',
    name: 'Jamtara East 07',
    zone: 'Jamtara',
    lat: 21.6811,
    lng: 79.3950,
    status: 'MAINTENANCE_REQUIRED',
    lastServiceDate: '2026-06-15',
    totalCapturesRecorded: 88,
    tigersObservedCount: 2
  }
];

export const mockBatches: CameraProcessingBatch[] = [
  {
    batchId: 'BATCH-2026-0816-A',
    uploadedAt: '2026-08-16T08:30:00Z',
    uploadedBy: 'Forester K. Verma (Turia Beat)',
    trapStation: 'Turia Range (Stations 01 to 06)',
    totalImages: 340,
    blankImages: 198,
    imagesRetained: 142,
    imagesQuarantined: 198, // Safe reversible quarantine for vegetation/wind blanks
    imagesRequiringReview: 8,
    tigersDetected: 14,
    status: 'COMPLETED',
    progressPercent: 100
  },
  {
    batchId: 'BATCH-2026-0816-B',
    uploadedAt: '2026-08-16T09:15:00Z',
    uploadedBy: 'Guard S. Meshram (Karmajhiri)',
    trapStation: 'Karmajhiri Core Grid B',
    totalImages: 520,
    blankImages: 310,
    imagesRetained: 210,
    imagesQuarantined: 310,
    imagesRequiringReview: 12,
    tigersDetected: 9,
    status: 'IDENTIFYING',
    progressPercent: 73
  },
  {
    batchId: 'BATCH-2026-0816-C',
    uploadedAt: '2026-08-16T10:45:00Z',
    uploadedBy: 'Biologist D. Joshi',
    trapStation: 'Rukhad Corridor Stations',
    totalImages: 210,
    blankImages: 140,
    imagesRetained: 70,
    imagesQuarantined: 140,
    imagesRequiringReview: 4,
    tigersDetected: 2,
    status: 'EXTRACTING',
    progressPercent: 25
  }
];
