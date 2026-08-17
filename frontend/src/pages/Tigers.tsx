import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  Search,
  MapPin,
  Calendar,
  ArrowRight,
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
        <div className="banner-left">
          <Info size={14} className="text-forest" />
          <span>
            <strong>Fauna Population Inventory:</strong> Listing deterministic individual records (<span className="telemetry-num">SIM-TIG-001</span> to <span className="telemetry-num">SIM-TIG-006</span>) established from camera-trap flank identification.
          </span>
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
            <label className="filter-label">Primary Sector:</label>
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
                <span className="badge badge-forest font-mono">{tiger.id}</span>
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
                <h3 className="tiger-title font-mono">{tiger.id}</h3>
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
                  <span className="metric-val telemetry-num">{tiger.detectionCount} captures</span>
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
          animation: fadeInUp 0.4s ease-out;
        }

        .banner-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filters-card {
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
        }

        .search-box {
          flex: 1;
          min-width: 260px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: var(--radius-sm);
          padding: 6px 12px;
          transition: all var(--transition-fast);
        }

        .search-box:focus-within {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
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
          gap: 8px;
        }

        .filter-label {
          font-size: 11.5px;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .filter-chips {
          display: flex;
          gap: 4px;
          background: rgba(255, 255, 255, 0.03);
          padding: 2px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .filter-chip {
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          transition: all var(--transition-fast);
        }

        .filter-chip.active {
          background: rgba(16, 185, 129, 0.12);
          color: #34D399;
          font-weight: 600;
          box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.25);
        }

        .filter-select {
          min-width: 160px;
        }

        .tigers-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
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
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tiger-card:hover {
          transform: translateY(-3px);
          border-color: rgba(16, 185, 129, 0.25);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(16, 185, 129, 0.1);
        }

        .card-image-wrap {
          position: relative;
          height: 170px;
          width: 100%;
          background: #090E17;
          overflow: hidden;
        }

        .card-tiger-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .tiger-card:hover .card-tiger-img {
          transform: scale(1.04);
        }

        .card-top-badges {
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          display: flex;
          justify-content: space-between;
          z-index: 10;
        }

        .card-top-badges .badge-forest {
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
        }

        .card-bottom-zone {
          position: absolute;
          bottom: 10px;
          left: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(11, 15, 25, 0.85);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          color: #34D399;
          font-size: 10.5px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.08);
          z-index: 10;
        }

        .card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .tiger-header-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .tiger-title {
          font-size: 15px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .stripe-sig-tag {
          font-size: 11px;
          color: var(--color-primary-light);
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 1px 6px;
          border-radius: 4px;
        }

        .tiger-notes {
          font-size: 11.5px;
          color: var(--text-secondary);
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .tiger-telemetry-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
        }

        .metric-box {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .metric-lbl {
          font-size: 9px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .metric-val {
          font-size: 12.5px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .sighting-latest-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-muted);
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          padding-top: 10px;
        }

        .latest-left {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .view-dossier-btn {
          width: 100%;
          justify-content: space-between;
          margin-top: 4px;
        }

        .empty-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 40px;
          gap: 10px;
        }

        .text-forest { color: var(--color-primary-light); }
        .font-mono { font-family: var(--font-mono); }
      `}</style>
    </div>
  );
};
export default Tigers;
