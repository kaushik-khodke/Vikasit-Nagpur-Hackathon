export type TigerSex = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type TigerAgeClass = 'ADULT' | 'SUB_ADULT' | 'CUB' | 'UNKNOWN';
export type TigerActivityStatus = 'ACTIVE_RESIDENT' | 'TRANSIENT' | 'MONITORED' | 'INFREQUENT';
export type ReserveZone = 'Turia' | 'Karmajhiri' | 'Jamtara' | 'Rukhad' | 'Teliya' | 'Khursapar' | 'Buffer Area';

export interface SpatialCoordinate {
  lat: number;
  lng: number;
}

export interface DetectionRecord {
  id: string;
  timestamp: string;
  cameraStationId: string;
  cameraStationName: string;
  zone: ReserveZone;
  location: SpatialCoordinate;
  flankSide: 'LEFT' | 'RIGHT' | 'BOTH' | 'UNCERTAIN';
  confidence: number;
  thumbnailUrl: string;
}

export interface HomeRange {
  areaSqKm: number;
  polygonCoordinates: [number, number][]; // [lat, lng] array
  coreCenter: SpatialCoordinate;
}

export interface TigerProfile {
  id: string; // Deterministic: SIM-TIG-001, SIM-TIG-002, etc.
  code: string; // Same as id for consistency
  sex: TigerSex;
  ageClass: TigerAgeClass;
  firstDetected: string;
  lastDetected: string;
  detectionCount: number;
  confidence: number; // 0 - 1
  stripeSignature: string; // e.g., "STRIPE-SIG-001"
  primaryZone: ReserveZone;
  activityStatus: TigerActivityStatus;
  cameraStations: string[];
  homeRange: HomeRange;
  detections: DetectionRecord[];
  notes: string;
  imageUrl: string;
  isSynthetic: boolean;
}

export interface Sighting {
  id: string;
  captureId: string;
  topCandidateId: string;
  topCandidateConfidence: number; // 0 - 1
  secondCandidateId?: string;
  secondCandidateConfidence?: number; // 0 - 1
  isAmbiguous: boolean; // true if confidence gap < 0.08
  timestamp: string;
  cameraTrapId: string;
  cameraTrapName: string;
  zone: ReserveZone;
  reviewStatus: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED' | 'REJECTED';
  location: SpatialCoordinate;
  flankSide: 'LEFT' | 'RIGHT' | 'BOTH' | 'UNCERTAIN';
  thumbnailUrl: string;
  candidateBaselineUrl?: string;
  environmentalConditions?: {
    timeOfDay: 'DAY' | 'NIGHT' | 'DUSK' | 'DAWN';
    weather: string;
    temperatureCelsius?: number;
  };
}

export interface CameraTrap {
  id: string;
  code: string;
  name: string;
  zone: ReserveZone;
  lat: number;
  lng: number;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE_REQUIRED';
  lastServiceDate: string;
  totalCapturesRecorded: number;
  tigersObservedCount: number;
  isEdgeCamera?: boolean;
  nearbyVillage?: string;
  distanceToVillageMeters?: number;
  hasActiveAlert?: boolean;
  activeAlertDetails?: {
    tigerId?: string;
    confidence?: number;
    timestamp?: string;
  };
}

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertCategory = 
  | 'PERIMETER_DETECTION' 
  | 'SPATIAL_DISPERSAL' 
  | 'HUMAN_SETTLEMENT_PROXIMITY' 
  | 'UNIDENTIFIED_STRIPE_CAPTURE' 
  | 'CAMERA_STATION_MAINTENANCE'
  | 'TERRITORY_OVERLAP';

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  category: AlertCategory;
  timestamp: string;
  zone: ReserveZone;
  location?: SpatialCoordinate;
  associatedTigerId?: string;
  associatedCameraId?: string;
  acknowledged: boolean;
  prescribedAction?: string;
}

export interface CameraProcessingBatch {
  cameraCode: string;
  batchId: string;
  uploadedAt: string;
  uploadedBy: string;
  trapStation: string;
  totalImages: number;
  blankImages: number;
  imagesRetained: number;
  imagesQuarantined: number;
  imagesRequiringReview: number;
  tigersDetected: number;
  status: 'QUEUED' | 'EXTRACTING' | 'IDENTIFYING' | 'COMPLETED';
  progressPercent: number;
}

export interface ReserveOverviewStats {
  totalCatalogedTigers: number;
  maleCount: number;
  femaleCount: number;
  subAdultCount: number;
  activeCameraStations: number;
  totalCameraStations: number;
  observationsPast30Days: number;
  pendingReviewCount: number;
  activeAlertsCount: number;
}
