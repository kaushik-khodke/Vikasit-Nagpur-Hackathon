import React, { useEffect, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Polygon,
  ZoomControl,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  ChevronUp,
  ChevronDown,
  Check
} from 'lucide-react';
import type { TigerProfile, CameraTrap, ReserveZone } from '../../types/tiger';
import {
  PENCH_RESERVE_BOUNDARY,
  PENCH_100M_BUFFER_COORDINATES,
  NEARBY_VILLAGES,
} from '../../data/gisData';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon paths in case standard markers are used
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom DivIcon for Camera Trap Stations & Edge Perimeter Alarms
const createCameraIcon = (camera: CameraTrap) => {
  const isOnline = camera.status === 'ONLINE';
  const isMaint = camera.status === 'MAINTENANCE_REQUIRED';
  const isEdge = camera.isEdgeCamera;
  const hasAlert = camera.hasActiveAlert;

  if (hasAlert) {
    return L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div class="edge-alert-map-marker" style="
          position: relative;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        " title="🚨 PERIMETER TIGER ALERT - ${camera.name}">
          <div style="
            position: absolute;
            inset: -8px;
            border-radius: 50%;
            border: 2px solid #EF4444;
            background: rgba(239, 68, 68, 0.35);
            animation: mapRadarPing 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            background-color: #DC2626;
            color: #FFFFFF;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #FFFFFF;
            box-shadow: 0 0 14px #EF4444;
            font-size: 14px;
            z-index: 2;
          ">🚨</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18]
    });
  }

  const bg = isEdge ? '#0284C7' : (isOnline ? '#1B5E3C' : isMaint ? '#D97706' : '#DC2626');
  const iconChar = isEdge ? '🛡️' : '📷';

  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div style="
        background-color: ${bg};
        color: #FFFFFF;
        width: ${isEdge ? '28px' : '26px'};
        height: ${isEdge ? '28px' : '26px'};
        border-radius: ${isEdge ? '50%' : '6px'};
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #FFFFFF;
        box-shadow: 0 3px 8px rgba(0,0,0,0.5);
        font-size: ${isEdge ? '13px' : '12px'};
      " title="${isEdge ? 'Edge Perimeter Camera' : 'Camera Trap Station'} - ${camera.name}">${iconChar}</div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -15]
  });
};

// Custom DivIcon for Tiger Detection Points
const createTigerDetectionIcon = (tigerId: string, isSelected: boolean) => {
  const bg = isSelected ? '#D97706' : '#13462D';
  const border = isSelected ? '#FEF08A' : '#FFFFFF';

  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div style="
        background-color: ${bg};
        color: #FFFFFF;
        padding: 3px 7px;
        border-radius: 4px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 10.5px;
        font-weight: 700;
        border: 1.5px solid ${border};
        box-shadow: 0 3px 8px rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      ">🐅 ${tigerId}</div>
    `,
    iconSize: [72, 24],
    iconAnchor: [36, 12],
    popupAnchor: [0, -14]
  });
};

// Controller to smoothly animate map viewport on target change
const MapViewController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 0.8 });
  }, [center, zoom, map]);
  return null;
};

// Palette for territory polygons
const polygonPalette = ['#22C55E', '#3B82F6', '#F59E0B', '#A855F7', '#14B8A6', '#EC4899'];

type BasemapStyle = 'google-satellite' | 'esri' | 'osm' | 'google-terrain';

export interface ReserveMapProps {
  tigers: TigerProfile[];
  cameras: CameraTrap[];
  selectedZone?: ReserveZone | 'ALL';
  selectedTigerId?: string;
  showCameras?: boolean;
  showPolygons?: boolean;
  showPaths?: boolean;
  showPenchBoundary?: boolean;
  show100mBuffer?: boolean;
  showVillages?: boolean;
  height?: string | number;
  className?: string;
}

export const ReserveMap: React.FC<ReserveMapProps> = ({
  tigers,
  cameras,
  selectedZone = 'ALL',
  selectedTigerId = 'ALL',
  showCameras = true,
  showPolygons = true,
  showPaths = true,
  showPenchBoundary = true,
  show100mBuffer = true,
  showVillages = true,
  height = '100%',
  className = ''
}) => {
  // Basemap & Overlay State
  const [basemap, setBasemap] = useState<BasemapStyle>('google-satellite');
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showPenchBoundaryLayer, setShowPenchBoundaryLayer] = useState<boolean>(showPenchBoundary);
  const [show100mBufferLayer, setShow100mBufferLayer] = useState<boolean>(show100mBuffer);
  const [showVillagesLayer, setShowVillagesLayer] = useState<boolean>(showVillages);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Center coordinate for Pench Tiger Reserve area
  const defaultCenter: [number, number] = [21.730, 79.320];

  // Determine active center based on selected individual or zone
  let activeCenter: [number, number] = defaultCenter;
  let activeZoom = 11;

  if (selectedTigerId && selectedTigerId !== 'ALL') {
    const target = tigers.find(t => t.id === selectedTigerId);
    if (target && target.homeRange.coreCenter) {
      activeCenter = [target.homeRange.coreCenter.lat, target.homeRange.coreCenter.lng];
      activeZoom = 12;
    }
  } else if (selectedZone && selectedZone !== 'ALL') {
    const zoneCameras = cameras.filter(c => c.zone === selectedZone);
    if (zoneCameras.length > 0) {
      const avgLat = zoneCameras.reduce((sum, c) => sum + c.lat, 0) / zoneCameras.length;
      const avgLng = zoneCameras.reduce((sum, c) => sum + c.lng, 0) / zoneCameras.length;
      activeCenter = [avgLat, avgLng];
      activeZoom = 12;
    }
  }

  const getActiveTitle = () => {
    switch (basemap) {
      case 'google-satellite':
        return showLabels ? 'Satellite (Hybrid)' : 'Google Satellite';
      case 'esri':
        return showLabels ? 'Esri (Hybrid)' : 'Esri World Imagery';
      case 'osm':
        return 'OpenStreetMap';
      case 'google-terrain':
        return 'Google Terrain';
      default:
        return 'Satellite (Hybrid)';
    }
  };

  return (
    <div className={`reserve-map-wrapper ${className}`} style={{ height, position: 'relative', minHeight: '380px' }}>
      {/* Floating Basemap Control Dropdown */}
      <div className="map-custom-layer-control" ref={dropdownRef}>
        <button
          type="button"
          className={`layer-control-trigger ${isDropdownOpen ? 'active' : ''}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-expanded={isDropdownOpen}
          title="Change Basemap Style & Overlays"
        >
          <Layers size={15} className="layer-trigger-icon" />
          <span className="layer-trigger-text">{getActiveTitle()}</span>
          {isDropdownOpen ? (
            <ChevronUp size={14} className="layer-chevron" />
          ) : (
            <ChevronDown size={14} className="layer-chevron" />
          )}
        </button>

        {isDropdownOpen && (
          <div className="layer-control-dropdown">
            <div className="dropdown-section-title">BASEMAP STYLE</div>

            <div className="basemap-options-list">
              {/* Google Satellite */}
              <div
                className={`basemap-option-item ${basemap === 'google-satellite' ? 'selected' : ''}`}
                onClick={() => setBasemap('google-satellite')}
              >
                <div className="option-thumb thumb-google-sat" />
                <span className="option-label">Google Satellite</span>
                {basemap === 'google-satellite' && <Check size={14} className="option-check" />}
              </div>

              {/* Esri World Imagery */}
              <div
                className={`basemap-option-item ${basemap === 'esri' ? 'selected' : ''}`}
                onClick={() => setBasemap('esri')}
              >
                <div className="option-thumb thumb-esri" />
                <span className="option-label">Esri World Imagery</span>
                {basemap === 'esri' && <Check size={14} className="option-check" />}
              </div>

              {/* OpenStreetMap */}
              <div
                className={`basemap-option-item ${basemap === 'osm' ? 'selected' : ''}`}
                onClick={() => setBasemap('osm')}
              >
                <div className="option-thumb thumb-osm" />
                <span className="option-label">OpenStreetMap</span>
                {basemap === 'osm' && <Check size={14} className="option-check" />}
              </div>

              {/* Google Terrain */}
              <div
                className={`basemap-option-item ${basemap === 'google-terrain' ? 'selected' : ''}`}
                onClick={() => setBasemap('google-terrain')}
              >
                <div className="option-thumb thumb-terrain" />
                <span className="option-label">Google Terrain</span>
                {basemap === 'google-terrain' && <Check size={14} className="option-check" />}
              </div>
            </div>

            <div className="dropdown-divider" />

            <div className="dropdown-section-title">GIS BOUNDARIES & OVERLAYS</div>

            <label className="overlay-checkbox-row">
              <input
                type="checkbox"
                checked={showPenchBoundaryLayer}
                onChange={(e) => setShowPenchBoundaryLayer(e.target.checked)}
                className="overlay-checkbox"
              />
              <span className="checkbox-text">Pench Reserve Boundary</span>
            </label>

            <label className="overlay-checkbox-row">
              <input
                type="checkbox"
                checked={show100mBufferLayer}
                onChange={(e) => setShow100mBufferLayer(e.target.checked)}
                className="overlay-checkbox"
              />
              <span className="checkbox-text">100m Alert Buffer Zone</span>
            </label>

            <label className="overlay-checkbox-row">
              <input
                type="checkbox"
                checked={showVillagesLayer}
                onChange={(e) => setShowVillagesLayer(e.target.checked)}
                className="overlay-checkbox"
              />
              <span className="checkbox-text">Nearby Village Boundaries</span>
            </label>

            <label className="overlay-checkbox-row">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="overlay-checkbox"
              />
              <span className="checkbox-text">Road & Place Labels</span>
            </label>
          </div>
        )}
      </div>

      {/* Synthetic Spatial Data Watermark */}
      <div className="map-synthetic-watermark">
        <span className="watermark-dot" />
        <span>Pench Tiger Reserve GIS • Live Spatial View</span>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={11}
        zoomControl={false}
        scrollWheelZoom={true}
        className="leaflet-map-canvas"
        style={{ height: '100%', width: '100%', borderRadius: '6px' }}
      >
        <ZoomControl position="bottomright" />
        <MapViewController center={activeCenter} zoom={activeZoom} />

        {/* Dynamic Basemap Rendering */}
        {basemap === 'google-satellite' && (
          <TileLayer
            key={`google-sat-${showLabels ? 'hybrid' : 'pure'}`}
            attribution='&copy; Google Maps'
            url={
              showLabels
                ? 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
                : 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
            }
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            maxZoom={20}
          />
        )}

        {basemap === 'esri' && (
          <>
            <TileLayer
              key="esri-satellite"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
            {showLabels && (
              <TileLayer
                key="esri-labels"
                attribution='&copy; OpenStreetMap'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
                opacity={0.85}
              />
            )}
          </>
        )}

        {basemap === 'osm' && (
          <TileLayer
            key="osm-standard"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        {basemap === 'google-terrain' && (
          <TileLayer
            key={`google-terrain-${showLabels ? 'labeled' : 'pure'}`}
            attribution='&copy; Google Maps'
            url={
              showLabels
                ? 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'
                : 'https://{s}.google.com/vt/lyrs=t&x={x}&y={y}&z={z}'
            }
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            maxZoom={20}
          />
        )}

        {/* 1. NEARBY VILLAGE BOUNDARIES */}
        {showVillagesLayer && NEARBY_VILLAGES.map((village) => (
          <Polygon
            key={`vil-${village.id}`}
            positions={village.polygonCoordinates}
            pathOptions={{
              color: '#818CF8',
              fillColor: '#6366F1',
              fillOpacity: 0.12,
              weight: 2,
              dashArray: '4, 4'
            }}
          >
            <Popup>
              <div className="tt-map-popup">
                <div className="popup-header-row">
                  <span className="popup-village-badge">VILLAGE BOUNDARY</span>
                  <span className="popup-zone-badge">{village.state}</span>
                </div>
                <div className="popup-station-name">{village.name}</div>
                <div className="popup-body">
                  <div className="popup-stat-row">
                    <span className="lbl">District:</span>
                    <span className="val">{village.district}</span>
                  </div>
                  <div className="popup-stat-row">
                    <span className="lbl">Fringe Sector:</span>
                    <span className="val">{village.zoneFringe}</span>
                  </div>
                  <div className="popup-stat-row">
                    <span className="lbl">Zone Category:</span>
                    <span className="val">Peripheral Settlement</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* 2. TRUE 100-METER GEODESIC BUFFER ZONE */}
        {show100mBufferLayer && (
          <Polygon
            key="pench-100m-alert-buffer"
            positions={PENCH_100M_BUFFER_COORDINATES}
            pathOptions={{
              color: '#F59E0B',
              fillColor: '#F59E0B',
              fillOpacity: 0.08,
              weight: 2.2,
              dashArray: '5, 5'
            }}
          >
            <Popup>
              <div className="tt-map-popup">
                <div className="popup-header-row">
                  <span className="popup-buffer-badge">100m ALERT ZONE</span>
                  <span className="popup-zone-badge">Geodesic Buffer (WGS84)</span>
                </div>
                <div className="popup-station-name">100-Meter Reserve Perimeter Alert Zone</div>
                <div className="popup-body">
                  <div className="popup-stat-row">
                    <span className="lbl">Buffer Offset:</span>
                    <span className="val">100.0 meters</span>
                  </div>
                  <div className="popup-stat-row">
                    <span className="lbl">Operational Rule:</span>
                    <span className="val font-mono">distance(tiger, boundary) &le; 100m</span>
                  </div>
                  <div className="popup-notice">
                    * Automatic high-risk alert triggers if a tiger detection occurs within this 100-meter perimeter.
                  </div>
                </div>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* 3. AUTHORITATIVE PENCH TIGER RESERVE BOUNDARY */}
        {showPenchBoundaryLayer && (
          <Polygon
            key="pench-protected-reserve-boundary"
            positions={PENCH_RESERVE_BOUNDARY}
            pathOptions={{
              color: '#10B981',
              fillColor: '#10B981',
              fillOpacity: 0.05,
              weight: 3.5
            }}
          >
            <Popup>
              <div className="tt-map-popup">
                <div className="popup-header-row">
                  <span className="popup-reserve-badge">PROTECTED AREA</span>
                  <span className="popup-zone-badge">EPSG:4326</span>
                </div>
                <div className="popup-station-name">Pench Tiger Reserve / Protected Area</div>
                <div className="popup-body">
                  <div className="popup-stat-row">
                    <span className="lbl">Category:</span>
                    <span className="val">Critical Tiger Habitat (Core + Sanctuary)</span>
                  </div>
                  <div className="popup-stat-row">
                    <span className="lbl">Reserve Extent:</span>
                    <span className="val">~1,179.6 km²</span>
                  </div>
                  <div className="popup-stat-row">
                    <span className="lbl">Sectors:</span>
                    <span className="val">Turia, Karmajhiri, Jamtara, Khursapar, Rukhad</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* Home Range Territory Polygons */}
        {showPolygons && tigers.map((tiger, idx) => {
          if (!tiger.homeRange?.polygonCoordinates || tiger.homeRange.polygonCoordinates.length === 0) return null;
          const color = polygonPalette[idx % polygonPalette.length];
          const isSelected = selectedTigerId === tiger.id;

          return (
            <Polygon
              key={`poly-${tiger.id}`}
              positions={tiger.homeRange.polygonCoordinates}
              pathOptions={{
                color: isSelected ? '#F59E0B' : color,
                fillColor: isSelected ? '#F59E0B' : color,
                fillOpacity: isSelected ? 0.35 : 0.18,
                weight: isSelected ? 3.5 : 2.2,
                dashArray: isSelected ? undefined : '6, 6'
              }}
            >
              <Popup>
                <div className="tt-map-popup">
                  <div className="popup-header-row">
                    <span className="popup-id-badge">{tiger.id}</span>
                    <span className="popup-zone-badge">{tiger.primaryZone} Sector</span>
                  </div>
                  <div className="popup-body">
                    <div className="popup-stat-row">
                      <span className="lbl">Estimated Range:</span>
                      <span className="val">{tiger.homeRange?.areaSqKm || 20} km²</span>
                    </div>
                    <div className="popup-stat-row">
                      <span className="lbl">Observations:</span>
                      <span className="val">{tiger.detectionCount || (tiger.detections || []).length} captures</span>
                    </div>
                    <div className="popup-stat-row">
                      <span className="lbl">Status:</span>
                      <span className="val">{(tiger.activityStatus || 'ACTIVE_RESIDENT').replace(/_/g, ' ')}</span>
                    </div>
                    <div className="popup-notice">
                      * Synthetic estimate generated from camera-trap array sightings.
                    </div>
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* Movement Polylines (Observed paths connecting camera detections) */}
        {showPaths && tigers.map((tiger) => {
          const detections = tiger.detections || [];
          if (detections.length < 2) return null;
          const isSelected = selectedTigerId === tiger.id;
          const pathCoords: [number, number][] = detections.map(d => [d.location.lat, d.location.lng]);

          return (
            <Polyline
              key={`path-${tiger.id}`}
              positions={pathCoords}
              pathOptions={{
                color: isSelected ? '#FBBF24' : '#34D399',
                weight: isSelected ? 3.5 : 2.5,
                opacity: isSelected ? 0.95 : 0.75,
                dashArray: '6, 6'
              }}
            />
          );
        })}

        {/* Tiger Detection Locations */}
        {tigers.map((tiger) =>
          (tiger.detections || []).map((detection) => {
            const isSelected = selectedTigerId === tiger.id;

            return (
              <Marker
                key={detection.id}
                position={[detection.location.lat, detection.location.lng]}
                icon={createTigerDetectionIcon(tiger.id, isSelected)}
              >
                <Popup>
                  <div className="tt-map-popup">
                    <div className="popup-header-row">
                      <span className="popup-id-badge">{tiger.id}</span>
                      <span className="popup-zone-badge">{detection.zone} Sector</span>
                    </div>
                    <div className="popup-photo-frame">
                      <img src={detection.thumbnailUrl} alt={tiger.id} className="popup-thumb" />
                    </div>
                    <div className="popup-body">
                      <div className="popup-stat-row">
                        <span className="lbl">Camera Station:</span>
                        <span className="val">{detection.cameraStationName}</span>
                      </div>
                      <div className="popup-stat-row">
                        <span className="lbl">Capture Time:</span>
                        <span className="val">
                          {new Date(detection.timestamp).toLocaleDateString()} {new Date(detection.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="popup-stat-row">
                        <span className="lbl">Flank Captured:</span>
                        <span className="val">{detection.flankSide}</span>
                      </div>
                      <div className="popup-stat-row">
                        <span className="lbl">Confidence:</span>
                        <span className="val font-mono font-bold">
                          {(detection.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        )}

        {/* Camera Trap Station Markers */}
        {showCameras && cameras.map((camera) => (
          <Marker
            key={camera.id}
            position={[camera.lat, camera.lng]}
            icon={createCameraIcon(camera)}
          >
            <Popup>
              <div className="tt-map-popup">
                <div className="popup-header-row">
                  <span className={`popup-station-badge ${camera.isEdgeCamera ? 'edge-station-badge' : ''}`}>
                    {camera.isEdgeCamera ? 'PERIMETER EDGE' : 'STATION'} {camera.code}
                  </span>
                  <span className={`popup-status-badge ${camera.hasActiveAlert ? 'alert-active' : camera.status.toLowerCase()}`}>
                    {camera.hasActiveAlert ? '🚨 TIGER ALERT' : camera.status}
                  </span>
                </div>
                <div className="popup-station-name">{camera.name}</div>
                <div className="popup-body">
                  {camera.isEdgeCamera && camera.nearbyVillage && (
                    <div className="popup-village-proximity-strip" style={{
                      background: camera.hasActiveAlert ? 'rgba(239, 68, 68, 0.15)' : 'rgba(2, 132, 199, 0.12)',
                      border: camera.hasActiveAlert ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(2, 132, 199, 0.3)',
                      padding: '5px 8px',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      fontSize: '11px',
                      color: camera.hasActiveAlert ? '#FCA5A5' : '#7DD3FC'
                    }}>
                      <strong>🏡 Adjacent Settlement:</strong> {camera.nearbyVillage} (~{camera.distanceToVillageMeters || 350}m from boundary)
                    </div>
                  )}
                  <div className="popup-stat-row">
                    <span className="lbl">Forest Range:</span>
                    <span className="val">{camera.zone} Sector</span>
                  </div>
                  <div className="popup-stat-row">
                    <span className="lbl">Tigers Observed:</span>
                    <span className="val">{camera.tigersObservedCount} unique individuals</span>
                  </div>
                  <div className="popup-stat-row">
                    <span className="lbl">Total Captures:</span>
                    <span className="val">{camera.totalCapturesRecorded} frames</span>
                  </div>
                  <div className="popup-stat-row">
                    <span className="lbl">Last Service:</span>
                    <span className="val">{camera.lastServiceDate}</span>
                  </div>

                  {camera.isEdgeCamera && (
                    <a
                      href="/live-feeds"
                      className="tt-btn tt-btn-primary btn-sm"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '10px',
                        padding: '6px 10px',
                        textDecoration: 'none',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      <span>📹 Open Live 5-Camera Feed</span>
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <style>{`
        @keyframes mapRadarPing {
          0% {
            transform: scale(0.9);
            opacity: 0.9;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        .edge-station-badge {
          background: #0284C7 !important;
          color: #FFFFFF !important;
        }

        .popup-status-badge.alert-active {
          background: #DC2626 !important;
          color: #FFFFFF !important;
          animation: pulse 1s infinite;
        }

        .reserve-map-wrapper {
          width: 100%;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-default);
          background: #111827;
        }

        /* Top Left Basemap Control */
        .map-custom-layer-control {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 500;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .layer-control-trigger {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #0F172A;
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.18);
          padding: 7px 12px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
          transition: all var(--transition-fast);
        }

        .layer-control-trigger:hover,
        .layer-control-trigger.active {
          background: #1E293B;
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.55);
        }

        .layer-trigger-icon {
          color: #34D399;
        }

        .layer-trigger-text {
          letter-spacing: 0.01em;
        }

        .layer-chevron {
          color: #94A3B8;
          margin-left: 2px;
        }

        /* Dropdown Card (Opens Downward) */
        .layer-control-dropdown {
          margin-top: 8px;
          width: 240px;
          background: #111A2E;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 10px;
          padding: 12px;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(12px);
          animation: dropdownFadeIn 0.15s ease-out;
        }

        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dropdown-section-title {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #64748B;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .basemap-options-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .basemap-option-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 7px 9px;
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all var(--transition-fast);
        }

        .basemap-option-item:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .basemap-option-item.selected {
          background: rgba(16, 185, 129, 0.15);
          border-color: #10B981;
        }

        .option-thumb {
          width: 22px;
          height: 22px;
          border-radius: 4px;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .thumb-google-sat {
          background: #1B3F2F;
          border-color: #2D6A4F;
        }

        .thumb-esri {
          background: #0E4A5C;
          border-color: #155E75;
        }

        .thumb-osm {
          background: #CBD5E1;
          border-color: #94A3B8;
        }

        .thumb-terrain {
          background: #8D4721;
          border-color: #A1552A;
        }

        .option-label {
          font-size: 12px;
          font-weight: 500;
          color: #E2E8F0;
          flex: 1;
        }

        .basemap-option-item.selected .option-label {
          color: #34D399;
          font-weight: 600;
        }

        .option-check {
          color: #34D399;
          flex-shrink: 0;
        }

        .dropdown-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 10px 0;
        }

        .overlay-checkbox-row {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 5px 6px;
          cursor: pointer;
          user-select: none;
        }

        .overlay-checkbox {
          width: 15px;
          height: 15px;
          border-radius: 3px;
          accent-color: #2563EB;
          cursor: pointer;
        }

        .checkbox-text {
          font-size: 12px;
          font-weight: 500;
          color: #E2E8F0;
        }

        .overlay-checkbox-row:hover .checkbox-text {
          color: #FFFFFF;
        }

        /* Watermark */
        .map-synthetic-watermark {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 500;
          background: rgba(17, 24, 39, 0.88);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 10.5px;
          font-weight: 600;
          color: #86EFAC;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          pointer-events: none;
        }

        .watermark-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22C55E;
          box-shadow: 0 0 8px #22C55E;
        }

        .tt-map-popup {
          font-family: var(--font-sans);
          font-size: 12px;
          line-height: 1.4;
          color: var(--text-primary);
          min-width: 210px;
        }

        .popup-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
          gap: 6px;
        }

        .popup-id-badge {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          color: #1B5E3C;
          background: #E8F2EC;
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid #C4DEC0;
        }

        .popup-zone-badge {
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .popup-station-badge {
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 700;
          color: #26332C;
          background: #F0F4F1;
          padding: 2px 6px;
          border-radius: 3px;
        }

        .popup-status-badge {
          font-size: 9.5px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 3px;
        }

        .popup-status-badge.online {
          background: #DCFCE7;
          color: #166534;
        }

        .popup-status-badge.maintenance_required {
          background: #FEF3C7;
          color: #9A3412;
        }

        .popup-status-badge.offline {
          background: #FEE2E2;
          color: #991B1B;
        }

        .popup-reserve-badge {
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 700;
          color: #065F46;
          background: #D1FAE5;
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid #A7F3D0;
        }

        .popup-buffer-badge {
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 700;
          color: #92400E;
          background: #FEF3C7;
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid #FDE68A;
        }

        .popup-village-badge {
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 700;
          color: #3730A3;
          background: #EEF2FF;
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid #C7D2FE;
        }

        .popup-station-name {
          font-size: 12.5px;
          font-weight: 600;
          color: #26332C;
          margin-bottom: 6px;
        }

        .popup-photo-frame {
          width: 100%;
          height: 105px;
          border-radius: 4px;
          overflow: hidden;
          background: #F0F4F1;
          margin-bottom: 8px;
        }

        .popup-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .popup-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .popup-stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }

        .popup-stat-row .lbl {
          color: var(--text-muted);
        }

        .popup-stat-row .val {
          font-weight: 600;
          color: var(--text-primary);
        }

        .popup-notice {
          font-size: 9.5px;
          color: var(--text-muted);
          font-style: italic;
          margin-top: 4px;
          border-top: 1px solid #E6EDE8;
          padding-top: 4px;
        }

        @media (max-width: 768px) {
          .map-custom-layer-control {
            top: 10px;
            left: 10px;
          }

          .map-synthetic-watermark {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
export default ReserveMap;
