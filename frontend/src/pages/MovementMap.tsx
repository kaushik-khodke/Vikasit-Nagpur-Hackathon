import React, { useState } from 'react';
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
import {
  Camera,
  Layers,
  Info,
  Filter,
  Eye,
  Activity,
  Trees
} from 'lucide-react';
import { mockTigers, mockCameraTraps } from '../data/mockData';
import type { ReserveZone } from '../types/tiger';
import 'leaflet/dist/leaflet.css';

// Custom SVG-based DivIcons for crisp, reliable rendering without missing png assets
const createCameraIcon = (status: string) => {
  const isOk = status === 'ONLINE';
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        background-color: ${isOk ? '#1B5E3C' : '#D97706'};
        color: #FFFFFF;
        width: 22px;
        height: 22px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1.5px solid #FFFFFF;
        box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        font-size: 10px;
      ">📷</div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12]
  });
};

const createTigerDetectionIcon = (tigerId: string, isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        background-color: ${isSelected ? '#B45309' : '#3F7D58'};
        color: #FFFFFF;
        padding: 2px 5px;
        border-radius: 3px;
        font-family: monospace;
        font-size: 9px;
        font-weight: 700;
        border: 1.5px solid #FFFFFF;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        white-space: nowrap;
      ">🐅 ${tigerId}</div>
    `,
    iconSize: [60, 20],
    iconAnchor: [30, 10],
    popupAnchor: [0, -10]
  });
};

// Map View Controller to center when filter changes
const MapViewController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

// Palette for territory polygons
const polygonColors = ['#1B5E3C', '#2563EB', '#D97706', '#9333EA', '#0D9488', '#E11D48'];

export const MovementMap: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<ReserveZone | 'ALL'>('ALL');
  const [selectedTigerId, setSelectedTigerId] = useState<string>('ALL');
  const [showCameras, setShowCameras] = useState(true);
  const [showPolygons, setShowPolygons] = useState(true);
  const [showPaths, setShowPaths] = useState(true);

  // Filtered dataset
  const filteredTigers = mockTigers.filter(
    (t) => (selectedZone === 'ALL' || t.primaryZone === selectedZone) &&
           (selectedTigerId === 'ALL' || t.id === selectedTigerId)
  );

  const filteredCameras = mockCameraTraps.filter(
    (c) => selectedZone === 'ALL' || c.zone === selectedZone
  );

  // Default Pench Center coordinates
  const defaultCenter: [number, number] = [21.730, 79.320];
  const activeCenter: [number, number] =
    selectedTigerId !== 'ALL'
      ? (mockTigers.find(t => t.id === selectedTigerId)?.homeRange.coreCenter
          ? [mockTigers.find(t => t.id === selectedTigerId)!.homeRange.coreCenter.lat, mockTigers.find(t => t.id === selectedTigerId)!.homeRange.coreCenter.lng]
          : defaultCenter)
      : defaultCenter;

  return (
    <div className="movement-page">
      {/* Synthetic Spatial Data Notice */}
      <div className="synthetic-banner">
        <div className="banner-text">
          <strong>Prototype Spatial Layer:</strong> The territory polygons, detections, and camera station coordinates below represent simulated data structured for spatial intelligence evaluation.
        </div>
        <span className="synthetic-tag">SYNTHETIC SPATIAL DATA</span>
      </div>

      {/* Map Control Bar */}
      <div className="tt-card map-control-bar">
        <div className="bar-left">
          <div className="filter-group">
            <label className="control-label">Filter Range/Zone:</label>
            <select
              className="tt-select"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value as any)}
            >
              <option value="ALL">All Pench Ranges (Core & Buffer)</option>
              <option value="Turia">Turia Sector</option>
              <option value="Karmajhiri">Karmajhiri Sector</option>
              <option value="Jamtara">Jamtara Sector</option>
              <option value="Rukhad">Rukhad Corridor</option>
              <option value="Teliya">Teliya Sector</option>
              <option value="Khursapar">Khursapar Range</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="control-label">Focus Individual:</label>
            <select
              className="tt-select"
              value={selectedTigerId}
              onChange={(e) => setSelectedTigerId(e.target.value)}
            >
              <option value="ALL">All Identified Tigers ({mockTigers.length})</option>
              {mockTigers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} ({t.sex === 'FEMALE' ? '♀' : '♂'}, {t.primaryZone})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggle Layers */}
        <div className="layer-toggles">
          <button
            className={`layer-toggle-btn ${showCameras ? 'active' : ''}`}
            onClick={() => setShowCameras(!showCameras)}
          >
            <Camera size={13} />
            <span>Camera Stations ({filteredCameras.length})</span>
          </button>

          <button
            className={`layer-toggle-btn ${showPolygons ? 'active' : ''}`}
            onClick={() => setShowPolygons(!showPolygons)}
          >
            <Layers size={13} />
            <span>Estimated Home Ranges</span>
          </button>

          <button
            className={`layer-toggle-btn ${showPaths ? 'active' : ''}`}
            onClick={() => setShowPaths(!showPaths)}
          >
            <Activity size={13} />
            <span>Observed Movement Paths</span>
          </button>
        </div>
      </div>

      {/* Main Map Viewport and Side Legend */}
      <div className="map-layout-grid">
        {/* Real Leaflet Map Container */}
        <div className="tt-card map-container-card">
          <MapContainer
            center={defaultCenter}
            zoom={11}
            scrollWheelZoom={true}
            className="leaflet-map-element"
          >
            <MapViewController center={activeCenter} zoom={selectedTigerId !== 'ALL' ? 12 : 11} />

            {/* CartoDB Voyager / Clean Scientific Tile Layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {/* Render Home Range Polygons */}
            {showPolygons && filteredTigers.map((tiger, idx) => {
              const color = polygonColors[idx % polygonColors.length];
              const isSelected = selectedTigerId === tiger.id;

              return (
                <Polygon
                  key={`poly-${tiger.id}`}
                  positions={tiger.homeRange.polygonCoordinates}
                  pathOptions={{
                    color: isSelected ? '#B45309' : color,
                    fillColor: isSelected ? '#B45309' : color,
                    fillOpacity: isSelected ? 0.25 : 0.12,
                    weight: isSelected ? 2.5 : 1.5,
                    dashArray: isSelected ? undefined : '4, 4'
                  }}
                >
                  <Popup>
                    <div className="map-popup">
                      <div className="popup-title">
                        <strong>{tiger.id}</strong> — Estimated Range
                      </div>
                      <div className="popup-meta">
                        <div><strong>Estimated Area:</strong> {tiger.homeRange.areaSqKm} km²</div>
                        <div><strong>Primary Zone:</strong> {tiger.primaryZone}</div>
                        <div><strong>Observations:</strong> {tiger.detectionCount} total captures</div>
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              );
            })}

            {/* Render Movement Paths (Polylines connecting detections) */}
            {showPaths && filteredTigers.map((tiger, idx) => {
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

            {/* Render Tiger Detection Points */}
            {filteredTigers.map((tiger) =>
              tiger.detections.map((detection) => {
                const isSelected = selectedTigerId === tiger.id;

                return (
                  <Marker
                    key={detection.id}
                    position={[detection.location.lat, detection.location.lng]}
                    icon={createTigerDetectionIcon(tiger.id, isSelected)}
                  >
                    <Popup>
                      <div className="map-popup">
                        <div className="popup-title">
                          <strong>{tiger.id}</strong> ({tiger.sex === 'FEMALE' ? 'Female' : 'Male'}, {tiger.ageClass})
                        </div>
                        <div className="popup-meta">
                          <div><strong>Station:</strong> {detection.cameraStationName}</div>
                          <div><strong>Time:</strong> {new Date(detection.timestamp).toLocaleString()}</div>
                          <div><strong>Flank Captured:</strong> {detection.flankSide}</div>
                          <div><strong>Confidence:</strong> {(detection.confidence * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })
            )}

            {/* Render Camera Trap Station Markers */}
            {showCameras && filteredCameras.map((camera) => (
              <Marker
                key={camera.id}
                position={[camera.lat, camera.lng]}
                icon={createCameraIcon(camera.status)}
              >
                <Popup>
                  <div className="map-popup">
                    <div className="popup-title">
                      <strong>{camera.name}</strong>
                    </div>
                    <div className="popup-meta">
                      <div><strong>Station Code:</strong> <span className="telemetry-num">{camera.code}</span></div>
                      <div><strong>Zone:</strong> {camera.zone}</div>
                      <div><strong>Status:</strong> {camera.status}</div>
                      <div><strong>Tigers Observed:</strong> {camera.tigersObservedCount} unique individuals</div>
                      <div><strong>Total Captures:</strong> {camera.totalCapturesRecorded}</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Right: Territory & Overlap Information Panel */}
        <div className="map-side-panel">
          <div className="tt-card territory-list-card">
            <div className="tt-card-header">
              <h3 className="tt-card-title">
                <Trees size={15} className="text-forest" />
                <span>Range Extent by Individual</span>
              </h3>
            </div>

            <div className="territory-items-list">
              {mockTigers.map((t, idx) => {
                const color = polygonColors[idx % polygonColors.length];
                const isSelected = selectedTigerId === t.id;

                return (
                  <div
                    key={t.id}
                    className={`territory-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedTigerId(selectedTigerId === t.id ? 'ALL' : t.id)}
                  >
                    <div className="item-color-indicator" style={{ backgroundColor: color }} />
                    <div className="item-details">
                      <div className="item-header-line">
                        <span className="item-id-txt">{t.id}</span>
                        <span className="item-zone-txt">{t.primaryZone}</span>
                      </div>
                      <div className="item-meta-line">
                        <span>Range: <strong>{t.homeRange.areaSqKm} km²</strong></span>
                        <span>{t.detectionCount} Detections</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="tt-card overlap-analysis-card">
            <div className="tt-card-header">
              <h3 className="tt-card-title">
                <Info size={15} />
                <span>Spatial Overlap Notes</span>
              </h3>
            </div>
            <p className="overlap-desc">
              Camera-trap records indicate territorial overlap between male <strong>SIM-TIG-002</strong> and resident female <strong>SIM-TIG-001</strong> along the central riverine corridor in Turia-Karmajhiri.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .movement-page {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .map-control-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .bar-left {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-label {
          font-size: 11.5px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .layer-toggles {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .layer-toggle-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          padding: 5px 10px;
          border-radius: var(--radius-sm);
          font-size: 11.5px;
          font-weight: 500;
          transition: all var(--transition-fast);
        }

        .layer-toggle-btn.active {
          background: var(--color-primary-bg);
          border-color: var(--border-active);
          color: var(--color-primary);
          font-weight: 600;
        }

        .map-layout-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 14px;
        }

        @media (max-width: 1024px) {
          .map-layout-grid {
            grid-template-columns: 1fr;
          }
        }

        .map-container-card {
          padding: 0;
          height: calc(100vh - 220px);
          min-height: 520px;
          overflow: hidden;
          position: relative;
        }

        .leaflet-map-element {
          width: 100%;
          height: 100%;
        }

        .map-popup {
          font-size: 12px;
          color: var(--text-primary);
        }

        .popup-title {
          font-size: 12.5px;
          margin-bottom: 4px;
          padding-bottom: 3px;
          border-bottom: 1px solid #E5E7EB;
        }

        .popup-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 11px;
          color: var(--text-secondary);
        }

        .map-side-panel {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .territory-items-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .territory-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .territory-item:hover {
          border-color: var(--border-active);
        }

        .territory-item.selected {
          border-color: #B45309;
          background: #FEF3C7;
        }

        .item-color-indicator {
          width: 8px;
          height: 32px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .item-header-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .item-id-txt {
          font-family: var(--font-mono);
          font-size: 11.5px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .item-zone-txt {
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .item-meta-line {
          display: flex;
          justify-content: space-between;
          font-size: 10.5px;
          color: var(--text-secondary);
        }

        .overlap-desc {
          font-size: 11.5px;
          color: var(--text-secondary);
          line-height: 1.45;
        }

        .text-forest {
          color: var(--color-primary);
        }
      `}</style>
    </div>
  );
};
export default MovementMap;
