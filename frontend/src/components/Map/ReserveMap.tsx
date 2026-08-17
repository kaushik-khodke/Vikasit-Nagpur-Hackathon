import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Polygon,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import type { TigerProfile, CameraTrap, ReserveZone } from '../../types/tiger';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon paths in case standard markers are used
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom DivIcon for Camera Trap Stations
const createCameraIcon = (status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE_REQUIRED') => {
  const isOnline = status === 'ONLINE';
  const isMaint = status === 'MAINTENANCE_REQUIRED';
  const bg = isOnline ? '#1B5E3C' : isMaint ? '#D97706' : '#DC2626';

  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div style="
        background-color: ${bg};
        color: #FFFFFF;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #FFFFFF;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        font-size: 11px;
      " title="Camera Trap Station">📷</div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14]
  });
};

// Custom DivIcon for Tiger Detection Points
const createTigerDetectionIcon = (tigerId: string, isSelected: boolean) => {
  const bg = isSelected ? '#B45309' : '#1B5E3C';
  const border = isSelected ? '#FEF3C7' : '#FFFFFF';

  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div style="
        background-color: ${bg};
        color: #FFFFFF;
        padding: 3px 6px;
        border-radius: 4px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: 700;
        border: 1.5px solid ${border};
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      ">🐅 ${tigerId}</div>
    `,
    iconSize: [68, 22],
    iconAnchor: [34, 11],
    popupAnchor: [0, -12]
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

// Palette for territory polygons (restrained earthy/forest tones)
const polygonPalette = ['#1B5E3C', '#2563EB', '#D97706', '#7C3AED', '#0D9488', '#BE123C'];

export interface ReserveMapProps {
  tigers: TigerProfile[];
  cameras: CameraTrap[];
  selectedZone?: ReserveZone | 'ALL';
  selectedTigerId?: string;
  showCameras?: boolean;
  showPolygons?: boolean;
  showPaths?: boolean;
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
  height = '100%',
  className = ''
}) => {
  // Synthetic coordinates for Pench Tiger Reserve area
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

  return (
    <div className={`reserve-map-wrapper ${className}`} style={{ height, position: 'relative', minHeight: '380px' }}>
      {/* Synthetic Spatial Data Watermark */}
      <div className="map-synthetic-watermark">
        <span className="watermark-dot" />
        <span>Prototype / Synthetic Spatial Data</span>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        className="leaflet-map-canvas"
        style={{ height: '100%', width: '100%', borderRadius: '6px' }}
      >
        <MapViewController center={activeCenter} zoom={activeZoom} />

        {/* Clean, readable CartoDB Voyager Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={18}
        />

        {/* Home Range Territory Polygons */}
        {showPolygons && tigers.map((tiger, idx) => {
          const color = polygonPalette[idx % polygonPalette.length];
          const isSelected = selectedTigerId === tiger.id;

          return (
            <Polygon
              key={`poly-${tiger.id}`}
              positions={tiger.homeRange.polygonCoordinates}
              pathOptions={{
                color: isSelected ? '#B45309' : color,
                fillColor: isSelected ? '#B45309' : color,
                fillOpacity: isSelected ? 0.28 : 0.12,
                weight: isSelected ? 2.5 : 1.5,
                dashArray: isSelected ? undefined : '4, 4'
              }}
            >
              <Popup>
                <div className="tt-map-popup">
                  <div className="popup-header-row">
                    <span className="popup-id-badge">{tiger.id}</span>
                    <span className="popup-zone-badge">{tiger.primaryZone}</span>
                  </div>
                  <div className="popup-body">
                    <div className="popup-stat-row">
                      <span className="lbl">Estimated Range:</span>
                      <span className="val">{tiger.homeRange.areaSqKm} km²</span>
                    </div>
                    <div className="popup-stat-row">
                      <span className="lbl">Observations:</span>
                      <span className="val">{tiger.detectionCount} captures</span>
                    </div>
                    <div className="popup-stat-row">
                      <span className="lbl">Status:</span>
                      <span className="val">{tiger.activityStatus.replace(/_/g, ' ')}</span>
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
          if (tiger.detections.length < 2) return null;
          const isSelected = selectedTigerId === tiger.id;
          const pathCoords: [number, number][] = tiger.detections.map(d => [d.location.lat, d.location.lng]);

          return (
            <Polyline
              key={`path-${tiger.id}`}
              positions={pathCoords}
              pathOptions={{
                color: isSelected ? '#B45309' : '#1B5E3C',
                weight: isSelected ? 3 : 2,
                opacity: isSelected ? 0.9 : 0.6,
                dashArray: '5, 6'
              }}
            />
          );
        })}

        {/* Tiger Detection Locations */}
        {tigers.map((tiger) =>
          tiger.detections.map((detection) => {
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
            icon={createCameraIcon(camera.status)}
          >
            <Popup>
              <div className="tt-map-popup">
                <div className="popup-header-row">
                  <span className="popup-station-badge">STATION {camera.code}</span>
                  <span className={`popup-status-badge ${camera.status.toLowerCase()}`}>
                    {camera.status}
                  </span>
                </div>
                <div className="popup-station-name">{camera.name}</div>
                <div className="popup-body">
                  <div className="popup-stat-row">
                    <span className="lbl">Forest Range:</span>
                    <span className="val">{camera.zone}</span>
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
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <style>{`
        .reserve-map-wrapper {
          width: 100%;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-default);
          background: #FFFFFF;
        }

        .map-synthetic-watermark {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 500;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid #C5D6CC;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 10.5px;
          font-weight: 600;
          color: #1B5E3C;
          display: flex;
          align-items: center;
          gap: 5px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          pointer-events: none;
        }

        .watermark-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #1B5E3C;
        }

        .tt-map-popup {
          font-family: var(--font-sans);
          font-size: 12px;
          line-height: 1.4;
          color: var(--text-primary);
          min-width: 200px;
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

        .popup-station-name {
          font-size: 12.5px;
          font-weight: 600;
          color: #26332C;
          margin-bottom: 6px;
        }

        .popup-photo-frame {
          width: 100%;
          height: 100px;
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
      `}</style>
    </div>
  );
};
export default ReserveMap;
