import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  PawPrint,
  Activity,
  Clock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { mockTigers, mockSightings } from '../data/mockData';

export const TigerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Find target tiger or default to first
  const tiger = mockTigers.find(
    (t) => t.id.toLowerCase() === id?.toLowerCase() || t.code.toLowerCase() === id?.toLowerCase()
  ) || mockTigers[0];

  const tigerSightings = mockSightings.filter(
    (s) => s.tigerId === tiger.id || s.tigerCode === tiger.code
  );

  return (
    <div className="tiger-details-page">
      {/* Back Navigation Bar */}
      <div className="details-nav-bar">
        <Link to="/tigers" className="tt-btn tt-btn-ghost back-btn">
          <ArrowLeft size={16} />
          <span>Back to Tiger Population Registry</span>
        </Link>
        <div className="dossier-meta">
          <span className="badge badge-subtle">NTCA / PTR RECORD</span>
          <span className="telemetry-num dossier-id">{tiger.stripePatternId}</span>
        </div>
      </div>

      {/* Main Dossier Header Card */}
      <div className="tt-card dossier-header-card">
        <div className="dossier-profile-grid">
          {/* Tiger Primary Photo */}
          <div className="profile-img-container">
            <img src={tiger.imageUrl} alt={tiger.name} className="profile-img" />
            <span className={`status-badge-overlay ${tiger.status.toLowerCase()}`}>
              {tiger.status}
            </span>
          </div>

          {/* Dossier Information */}
          <div className="profile-main-info">
            <div className="title-row">
              <div>
                <div className="code-pill-row">
                  <span className="badge badge-amber">{tiger.code}</span>
                  <span className="badge badge-forest">{tiger.primaryZone} Core Range</span>
                  <span className="badge badge-subtle">
                    {tiger.gender === 'FEMALE' ? '♀ Female Tigress' : '♂ Male Tiger'} • {tiger.estimatedAgeYears} Years Old
                  </span>
                </div>
                <h2 className="profile-name">{tiger.name}</h2>
              </div>
            </div>

            <p className="profile-bio">{tiger.notes}</p>

            {/* Quick Metrics Bar */}
            <div className="profile-metrics-grid">
              <div className="p-metric">
                <span className="p-label">Estimated Territory</span>
                <span className="p-val telemetry-num">{tiger.territoryAreaSqKm} sq km</span>
              </div>
              <div className="p-metric">
                <span className="p-label">Total Sightings</span>
                <span className="p-val telemetry-num">{tiger.totalSightingsCount} captures</span>
              </div>
              <div className="p-metric">
                <span className="p-label">Collar Tracking</span>
                <span className="p-val">
                  {tiger.collarStatus === 'COLLARED_ACTIVE' ? 'Active VHF / GPS' : 'Uncollared (Visual)'}
                </span>
              </div>
              <div className="p-metric">
                <span className="p-label">Stripe Pattern Matrix</span>
                <span className="p-val telemetry-num">{tiger.stripePatternId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Biometric Stripe Signature & Sightings Timeline */}
      <div className="dossier-body-grid">
        {/* Left Column: Biometric Stripe Dossier */}
        <div className="tt-card stripe-dossier-card">
          <div className="tt-card-header">
            <h3 className="tt-card-title">
              <Sparkles size={16} className="text-amber" />
              <span>Biometric Flank Profile</span>
            </h3>
            <span className="badge badge-forest">
              <CheckCircle2 size={11} /> 100% Unique Match
            </span>
          </div>

          <div className="stripe-visual-box">
            <div className="stripe-canvas-mock">
              <div className="scan-line" />
              <div className="stripe-vector-graphic">
                <PawPrint size={48} className="text-amber" />
                <span className="stripe-code-label">{tiger.stripePatternId}</span>
                <span className="stripe-sub">Neural Flank Embedding • 512-dim</span>
              </div>
            </div>
          </div>

          <div className="stripe-specs-list">
            <div className="spec-row">
              <span className="spec-name">Flank Symmetry Index:</span>
              <span className="spec-val telemetry-num">0.892 (High Right Dominance)</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Primary Camera Catch Station:</span>
              <span className="spec-val">{tiger.lastSightedLocation.cameraTrapId || 'CT-TR-04'}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Last GPS Coordinate Fix:</span>
              <span className="spec-val telemetry-num">
                {tiger.lastSightedLocation.lat.toFixed(4)}°N, {tiger.lastSightedLocation.lng.toFixed(4)}°E
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Historical Sightings & Telemetry Log */}
        <div className="tt-card sightings-history-card">
          <div className="tt-card-header">
            <h3 className="tt-card-title">
              <Activity size={16} className="text-forest" />
              <span>Telemetry & Sighting History</span>
            </h3>
            <span className="badge badge-subtle">
              {tigerSightings.length} Recorded in Current Window
            </span>
          </div>

          <div className="timeline-stream">
            {tigerSightings.map((s, idx) => (
              <div key={s.id} className="timeline-node">
                <div className="timeline-left">
                  <div className="timeline-dot" />
                  {idx < tigerSightings.length - 1 && <div className="timeline-line" />}
                </div>

                <div className="timeline-content">
                  <div className="node-top">
                    <span className="node-station">{s.cameraTrapName}</span>
                    <span className="node-time telemetry-num">
                      {new Date(s.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="node-details">
                    <span className="node-flank">Flank: {s.flankSide}</span>
                    <span className="node-conf">Match: {(s.confidenceScore * 100).toFixed(0)}%</span>
                    <span className="node-zone">{s.zone}</span>
                  </div>
                </div>
              </div>
            ))}

            {tigerSightings.length === 0 && (
              <div className="empty-timeline">
                <Clock size={24} className="text-muted" />
                <span>No recent camera trap captures in the current 24-hour sync window.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .tiger-details-page {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .details-nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .back-btn {
          font-size: 13px;
          gap: 8px;
        }

        .dossier-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dossier-id {
          font-size: 12px;
          color: var(--text-muted);
        }

        .dossier-header-card {
          padding: 24px;
        }

        .dossier-profile-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
        }

        @media (max-width: 900px) {
          .dossier-profile-grid {
            grid-template-columns: 1fr;
          }
        }

        .profile-img-container {
          position: relative;
          height: 240px;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: #08110e;
          border: 1px solid var(--border-default);
        }

        .profile-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .status-badge-overlay {
          position: absolute;
          top: 12px;
          left: 12px;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          background: rgba(0, 0, 0, 0.75);
          color: #34d399;
          border: 1px solid #059669;
          backdrop-filter: blur(4px);
        }

        .profile-main-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .code-pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }

        .profile-name {
          font-size: 22px;
          font-weight: 700;
        }

        .profile-bio {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .profile-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          background: rgba(12, 23, 19, 0.5);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 14px;
          margin-top: auto;
        }

        @media (max-width: 1100px) {
          .profile-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .p-metric {
          display: flex;
          flex-direction: column;
        }

        .p-label {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .p-val {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .dossier-body-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        @media (max-width: 900px) {
          .dossier-body-grid {
            grid-template-columns: 1fr;
          }
        }

        .stripe-visual-box {
          background: #08110e;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          position: relative;
          overflow: hidden;
        }

        .stripe-canvas-mock {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }

        .stripe-vector-graphic {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .stripe-code-label {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          color: var(--accent-tiger);
        }

        .stripe-sub {
          font-size: 10px;
          color: var(--text-muted);
        }

        .stripe-specs-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .spec-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          border-bottom: 1px solid rgba(28, 53, 44, 0.4);
          padding-bottom: 6px;
        }

        .spec-name {
          color: var(--text-muted);
        }

        .spec-val {
          color: var(--text-primary);
          font-weight: 500;
        }

        .timeline-stream {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .timeline-node {
          display: flex;
          gap: 12px;
        }

        .timeline-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 16px;
        }

        .timeline-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--accent-tiger);
          box-shadow: 0 0 6px var(--accent-tiger);
          flex-shrink: 0;
        }

        .timeline-line {
          flex: 1;
          width: 2px;
          background: var(--border-subtle);
          margin-top: 4px;
        }

        .timeline-content {
          flex: 1;
          background: rgba(12, 23, 19, 0.4);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
        }

        .node-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .node-station {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .node-time {
          font-size: 10px;
          color: var(--text-muted);
        }

        .node-details {
          display: flex;
          gap: 8px;
          font-size: 11px;
        }

        .node-flank {
          color: #38bdf8;
          font-family: var(--font-mono);
        }

        .node-conf {
          color: #34d399;
          font-family: var(--font-mono);
        }

        .node-zone {
          color: var(--text-secondary);
        }

        .empty-timeline {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 30px;
          gap: 8px;
          color: var(--text-muted);
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};
export default TigerDetails;
