import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  Search,
  MapPin,
  Calendar,
  ArrowRight,
  Camera,
  Layers,
  Info
} from 'lucide-react';
import { mockTigers } from '../data/mockData';
import type { TigerSex, ReserveZone } from '../types/tiger';

export const Tigers: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sexFilter, setSexFilter] = useState<TigerSex | 'ALL'>('ALL');
  const [zoneFilter, setZoneFilter] = useState<ReserveZone | 'ALL'>('ALL');

  const filteredTigers = mockTigers.filter((tiger) => {
    const matchesSearch =
      tiger.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tiger.stripeSignature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tiger.primaryZone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSex = sexFilter === 'ALL' || tiger.sex === sexFilter;
    const matchesZone = zoneFilter === 'ALL' || tiger.primaryZone === zoneFilter;

    return matchesSearch && matchesSex && matchesZone;
  });

  return (
    <div className="tigers-page">
      {/* Synthetic Notice */}
      <div className="synthetic-banner">
        <div className="banner-text">
          <strong>Fauna Population Inventory:</strong> Listing deterministic individual records (<span className="telemetry-num">SIM-TIG-001</span> to <span className="telemetry-num">SIM-TIG-006</span>) established from camera-trap flank identification.
        </div>
        <span className="synthetic-tag">PROTOTYPE REGISTRY</span>
      </div>

      {/* Filter and Search Bar */}
      <div className="tt-card filters-card">
        <div className="search-box">
          <Search size={14} className="text-muted" />
          <input
            type="text"
            placeholder="Search by Individual ID (e.g. SIM-TIG-001) or Stripe Signature..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label className="filter-label">Sex:</label>
            <div className="filter-chips">
              {(['ALL', 'FEMALE', 'MALE'] as const).map((s) => (
                <button
                  key={s}
                  className={`filter-chip ${sexFilter === s ? 'active' : ''}`}
                  onClick={() => setSexFilter(s)}
                >
                  {s === 'ALL' ? 'All' : s === 'FEMALE' ? '♀ Female' : '♂ Male'}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Primary Zone:</label>
            <select
              className="tt-select filter-select"
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value as any)}
            >
              <option value="ALL">All Pench Sectors</option>
              <option value="Turia">Turia Sector</option>
              <option value="Karmajhiri">Karmajhiri Sector</option>
              <option value="Jamtara">Jamtara Sector</option>
              <option value="Rukhad">Rukhad Corridor</option>
              <option value="Teliya">Teliya Sector</option>
              <option value="Khursapar">Khursapar Range</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tigers Cards Grid */}
      <div className="tigers-grid">
        {filteredTigers.map((tiger) => (
          <div key={tiger.id} className="tt-card tiger-card">
            {/* Card Photo & Badges */}
            <div className="card-image-wrap">
              <img src={tiger.imageUrl} alt={tiger.id} className="card-tiger-img" />
              <div className="card-top-badges">
                <span className="badge badge-forest">{tiger.id}</span>
                <span className="badge badge-subtle">
                  {tiger.sex === 'FEMALE' ? '♀ Female' : '♂ Male'} ({tiger.ageClass})
                </span>
              </div>
              <div className="card-bottom-zone">
                <MapPin size={11} />
                <span>{tiger.primaryZone} Sector</span>
              </div>
            </div>

            {/* Card Content Details */}
            <div className="card-body">
              <div className="tiger-header-row">
                <h3 className="tiger-title">{tiger.id}</h3>
                <span className="stripe-sig-tag telemetry-num">{tiger.stripeSignature}</span>
              </div>

              <p className="tiger-notes">{tiger.notes}</p>

              <div className="tiger-telemetry-metrics">
                <div className="metric-box">
                  <span className="metric-lbl">Estimated Territory</span>
                  <span className="metric-val telemetry-num">{tiger.homeRange.areaSqKm} km²</span>
                </div>
                <div className="metric-box">
                  <span className="metric-lbl">Camera Detections</span>
                  <span className="metric-val telemetry-num">{tiger.detectionCount} observations</span>
                </div>
              </div>

              <div className="sighting-latest-row">
                <div className="latest-left">
                  <Calendar size={11} className="text-muted" />
                  <span className="latest-text">
                    Last Captured: {new Date(tiger.lastDetected).toLocaleDateString()}
                  </span>
                </div>
                <span className="badge badge-subtle">
                  {tiger.cameraStations.length} Camera Stations
                </span>
              </div>

              {/* View Dossier Action */}
              <Link to={`/tigers/${tiger.id}`} className="tt-btn tt-btn-secondary view-dossier-btn">
                <span>View Full Identity Dossier</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredTigers.length === 0 && (
        <div className="tt-card empty-results">
          <Database size={32} className="text-muted" />
          <h3>No individual records matched the filter criteria</h3>
          <p>Try resetting the search keywords or sector selection.</p>
        </div>
      )}

      <style>{`
        .tigers-page {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .filters-card {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 260px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 6px 10px;
        }

        .search-input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 12px;
          color: var(--text-primary);
          width: 100%;
        }

        .filters-row {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .filter-label {
          font-size: 11.5px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .filter-chips {
          display: flex;
          gap: 4px;
        }

        .filter-chip {
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          color: var(--text-secondary);
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          transition: all var(--transition-fast);
        }

        .filter-chip.active {
          background: var(--color-primary-bg);
          color: var(--color-primary);
          font-weight: 600;
          border-color: var(--border-active);
        }

        .filter-select {
          min-width: 150px;
        }

        .tigers-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        @media (max-width: 1100px) {
          .tigers-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 680px) {
          .tigers-grid {
            grid-template-columns: 1fr;
          }
        }

        .tiger-card {
          padding: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .card-image-wrap {
          position: relative;
          height: 160px;
          width: 100%;
          background: #EEF2EF;
        }

        .card-tiger-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .card-top-badges {
          position: absolute;
          top: 8px;
          left: 8px;
          right: 8px;
          display: flex;
          justify-content: space-between;
        }

        .card-bottom-zone {
          position: absolute;
          bottom: 8px;
          left: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.9);
          color: var(--text-primary);
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(0,0,0,0.1);
        }

        .card-body {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .tiger-header-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .tiger-title {
          font-size: 14px;
          font-weight: 700;
        }

        .stripe-sig-tag {
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .tiger-notes {
          font-size: 11.5px;
          color: var(--text-secondary);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .tiger-telemetry-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 7px 10px;
        }

        .metric-box {
          display: flex;
          flex-direction: column;
        }

        .metric-lbl {
          font-size: 9.5px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .metric-val {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .sighting-latest-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .latest-left {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .view-dossier-btn {
          width: 100%;
          justify-content: space-between;
          margin-top: auto;
        }

        .empty-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 30px;
          gap: 6px;
        }
      `}</style>
    </div>
  );
};
export default Tigers;
