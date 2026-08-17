import React, { useState } from 'react';
import {
  Camera,
  Layers,
  Activity,
  Trees,
  Info,
  MapPin
} from 'lucide-react';
import { mockTigers, mockCameraTraps } from '../data/mockData';
import type { ReserveZone } from '../types/tiger';
import { ReserveMap } from '../components/Map/ReserveMap';

// Palette for territory items
const polygonColors = ['#1B5E3C', '#2563EB', '#D97706', '#7C3AED', '#0D9488', '#BE123C'];

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

  const selectedTiger = mockTigers.find(t => t.id === selectedTigerId);

  return (
    <div className="movement-page">
      {/* Synthetic Spatial Data Notice */}
      <div className="synthetic-banner">
        <div className="banner-left">
          <Info size={14} className="text-forest" />
          <span>
            <strong>Prototype Spatial Intelligence Layer:</strong> Territory polygons, camera-trap stations, and movement paths are generated from synthetic camera array detections for demonstration purposes.
          </span>
        </div>
        <span className="synthetic-tag">PROTOTYPE SPATIAL DATA</span>
      </div>

      {/* Map Control Bar */}
      <div className="tt-card map-control-bar">
        <div className="bar-left">
          <div className="filter-group">
            <label className="control-label">Filter Sector / Beat:</label>
            <select
              className="tt-select"
              value={selectedZone}
              onChange={(e) => {
                setSelectedZone(e.target.value as any);
                if (selectedTigerId !== 'ALL') {
                  const target = mockTigers.find(t => t.id === selectedTigerId);
                  if (target && e.target.value !== 'ALL' && target.primaryZone !== e.target.value) {
                    setSelectedTigerId('ALL');
                  }
                }
              }}
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

        {/* Toggle Layer Visibility */}
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
            <span>Territory Polygons</span>
          </button>

          <button
            className={`layer-toggle-btn ${showPaths ? 'active' : ''}`}
            onClick={() => setShowPaths(!showPaths)}
          >
            <Activity size={13} />
            <span>Observed Paths</span>
          </button>
        </div>
      </div>

      {/* Main Map Viewport and Side Legend */}
      <div className="map-layout-grid">
        {/* Real Leaflet Map Container */}
        <div className="map-container-card">
          <ReserveMap
            tigers={filteredTigers}
            cameras={filteredCameras}
            selectedZone={selectedZone}
            selectedTigerId={selectedTigerId}
            showCameras={showCameras}
            showPolygons={showPolygons}
            showPaths={showPaths}
            height="100%"
          />
        </div>

        {/* Right: Territory & Overlap Information Panel */}
        <div className="map-side-panel">
          {/* Active Tiger Info Card if one is selected */}
          {selectedTiger && (
            <div className="tt-card active-tiger-summary">
              <div className="summary-header">
                <div>
                  <span className="badge badge-amber">{selectedTiger.id}</span>
                  <h4 className="active-tiger-title">{selectedTiger.id} Dossier Focus</h4>
                </div>
                <span className="badge badge-forest">{selectedTiger.primaryZone}</span>
              </div>
              <div className="summary-metrics">
                <div className="s-metric">
                  <span className="s-lbl">Sex & Age:</span>
                  <span className="s-val">
                    {selectedTiger.sex === 'FEMALE' ? 'Female' : 'Male'} ({selectedTiger.ageClass})
                  </span>
                </div>
                <div className="s-metric">
                  <span className="s-lbl">Estimated Territory:</span>
                  <span className="s-val">{selectedTiger.homeRange.areaSqKm} km²</span>
                </div>
                <div className="s-metric">
                  <span className="s-lbl">Total Observations:</span>
                  <span className="s-val">{selectedTiger.detectionCount} captures</span>
                </div>
                <div className="s-metric">
                  <span className="s-lbl">Status:</span>
                  <span className="s-val">{selectedTiger.activityStatus.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <button
                className="tt-btn tt-btn-secondary reset-focus-btn"
                onClick={() => setSelectedTigerId('ALL')}
              >
                <span>Reset Map View</span>
              </button>
            </div>
          )}

          {/* Territory Extent List */}
          <div className="tt-card territory-list-card">
            <div className="tt-card-header">
              <h3 className="tt-card-title">
                <Trees size={15} className="text-forest" />
                <span>Estimated Territory Extents</span>
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

          {/* Overlap Notes */}
          <div className="tt-card overlap-analysis-card">
            <div className="tt-card-header">
              <h3 className="tt-card-title">
                <MapPin size={15} className="text-forest" />
                <span>Spatial Overlap Observations</span>
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

        .banner-left {
          display: flex;
          align-items: center;
          gap: 8px;
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
          grid-template-columns: 1fr 310px;
          gap: 14px;
        }

        @media (max-width: 1024px) {
          .map-layout-grid {
            grid-template-columns: 1fr;
          }
        }

        .map-container-card {
          height: calc(100vh - 230px);
          min-height: 520px;
        }

        .map-side-panel {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .active-tiger-summary {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 14px;
          border-left: 3px solid #B45309;
        }

        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .active-tiger-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 4px;
        }

        .summary-metrics {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: var(--bg-surface-subtle);
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          font-size: 11.5px;
        }

        .s-metric {
          display: flex;
          justify-content: space-between;
        }

        .s-lbl {
          color: var(--text-muted);
        }

        .s-val {
          font-weight: 600;
          color: var(--text-primary);
        }

        .reset-focus-btn {
          font-size: 11px;
          padding: 4px 8px;
          width: 100%;
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
