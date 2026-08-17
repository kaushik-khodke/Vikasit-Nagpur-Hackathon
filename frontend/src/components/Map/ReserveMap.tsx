import React, { useEffect, useState } from 'react';
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
        width: 26px;
        height: 26px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #FFFFFF;
        box-shadow: 0 3px 8px rgba(0,0,0,0.5);
        font-size: 12px;
      " title="Camera Trap Station">📷</div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
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

// Palette for territory polygons (high-visibility tones that shine on satellite & street layers)
const polygonPalette = ['#22C55E', '#3B82F6', '#F59E0B', '#A855F7', '#14B8A6', '#EC4899'];

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
  // Map Layer Type: default to Google Satellite Hybrid view
  const [mapStyle, setMapStyle] = useState<'google-hybrid' | 'esri-satellite' | 'osm' | 'google-terrain'>('google-hybrid');

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
      {/* Map Layer Switcher Toolbar */}
      <div className="map-layer-switcher">
        <div className="layer-switcher-label">Basemap:</div>
        <div className="layer-pill-group">
          <button
            type="button"
            className={`layer-pill-btn ${mapStyle === 'google-hybrid' ? 'active' : ''}`}
            onClick={() => setMapStyle('google-hybrid')}
            title="Google Satellite Hybrid with Roads & Labels"
          >
            <span className="pill-icon">🛰️</span>
            <span>Google Satellite</span>
          </button>

          <button
            type="button"
            className={`layer-pill-btn ${mapStyle === 'esri-satellite' ? 'active' : ''}`}
            onClick={() => setMapStyle('esri-satellite')}
            title="Esri World Satellite Imagery"
          >
            <span className="pill-icon">🌍</span>
            <span>Esri Imagery</span>
          </button>

          <button
            type="button"
            className={`layer-pill-btn ${mapStyle === 'osm' ? 'active' : ''}`}
            onClick={() => setMapStyle('osm')}
            title="OpenStreetMap Standard Vector Map"
          >
            <span className="pill-icon">🗺️</span>
            <span>OpenStreetMap</span>
          </button>

          <button
            type="button"
            className={`layer-pill-btn ${mapStyle === 'google-terrain' ? 'active' : ''}`}
            onClick={() => setMapStyle('google-terrain')}
            title="Google Terrain & Contours"
          >
            <span className="pill-icon">⛰️</span>
            <span>Terrain</span>
          </button>
        </div>
      </div>

      {/* Synthetic Spatial Data Watermark */}
      <div className="map-synthetic-watermark">
        <span className="watermark-dot" />
        <span>Pench Tiger Reserve GIS • Live Spatial View</span>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        className="leaflet-map-canvas"
        style={{ height: '100%', width: '100%', borderRadius: '6px' }}
      >
        <MapViewController center={activeCenter} zoom={activeZoom} />

        {/* Google Satellite Hybrid (Exact match to Google Maps satellite screenshot with roads and labels) */}
        {mapStyle === 'google-hybrid' && (
          <TileLayer
            key="google-hybrid-tiles"
            attribution='&copy; Google Maps'
            url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            maxZoom={20}
          />
        )}

        {/* Esri World Imagery */}
        {mapStyle === 'esri-satellite' && (
          <>
            <TileLayer
              key="esri-satellite"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
            <TileLayer
              key="esri-labels"
              attribution='&copy; OpenStreetMap'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
              opacity={0.85}
            />
          </>
        )}

        {/* OpenStreetMap Standard Tile Layer */}
        {mapStyle === 'osm' && (
          <TileLayer
            key="osm-standard"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        {/* Google Terrain with Contours and Roads */}
        {mapStyle === 'google-terrain' && (
          <TileLayer
            key="google-terrain-tiles"
            attribution='&copy; Google Maps'
            url="https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            maxZoom={20}
          />
        )}

        {/* Home Range Territory Polygons */}
        {showPolygons && tigers.map((tiger, idx) => {
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
          background: #111827;
        }

        .map-layer-switcher {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 500;
          background: rgba(17, 24, 39, 0.88);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          padding: 4px 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        .layer-switcher-label {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .layer-pill-group {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .layer-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #D1D5DB;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .layer-pill-btn:hover {
          background: rgba(255, 255, 255, 0.18);
          color: #FFFFFF;
          border-color: rgba(255, 255, 255, 0.25);
        }

        .layer-pill-btn.active {
          background: #16A34A;
          color: #FFFFFF;
          border-color: #22C55E;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }

        .layer-pill-btn .pill-icon {
          font-size: 12px;
        }

        .map-synthetic-watermark {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 500;
          background: rgba(17, 24, 39, 0.88);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 4px 10px;
          border-radius: 4px;
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
          .map-layer-switcher {
            top: auto;
            bottom: 10px;
            left: 10px;
            right: 10px;
            justify-content: center;
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
