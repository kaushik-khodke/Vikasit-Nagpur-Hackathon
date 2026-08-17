import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Activity,
  ShieldCheck,
  MapPin,
  Clock,
  Info,
  CheckCircle2
} from 'lucide-react';
import { mockTigers, mockSightings } from '../data/mockData';

export const TigerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Find target tiger or default to first
  const tiger = mockTigers.find(
    (t) => t.id.toLowerCase() === id?.toLowerCase() || t.code.toLowerCase() === id?.toLowerCase()
  ) || mockTigers[0];

  // Sightings where this tiger is candidate or verified
  const relatedSightings = mockSightings.filter(
    (s) => s.topCandidateId === tiger.id || s.secondCandidateId === tiger.id
  );

  return (
    <div className="tiger-details-page">
      {/* Synthetic Notice */}
      <div className="synthetic-banner">
        <div className="banner-left">
          <Info size={14} className="text-forest" />
          <span>
            <strong>Individual Registry Record:</strong> Displaying biometric profile and detection history for individual <span className="telemetry-num">{tiger.id}</span>. Data is synthetic and generated from simulated camera-trap array sightings.
          </span>
        </div>
        <span className="synthetic-tag">PROTOTYPE RECORD</span>
      </div>

      {/* Back Navigation Bar */}
      <div className="details-nav-bar">
        <Link to="/tigers" className="tt-btn tt-btn-secondary back-btn">
          <ArrowLeft size={14} />
          <span>Back to Tiger Population Registry</span>
        </Link>

        <div className="dossier-meta">
          <span className="badge badge-forest">Deterministic ID</span>
          <span className="telemetry-num dossier-id">{tiger.id}</span>
        </div>
      </div>

      {/* Main Dossier Header Card */}
      <div className="tt-card dossier-header-card">
        <div className="dossier-profile-grid">
          {/* Tiger Primary Photo */}
          <div className="profile-img-container">
            <img src={tiger.imageUrl} alt={tiger.id} className="profile-img" />
            <span className="status-badge-overlay">
              {tiger.activityStatus.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Dossier Information */}
          <div className="profile-main-info">
            <div className="title-row">
              <div className="code-pill-row">
                <span className="badge badge-amber font-mono">{tiger.id}</span>
                <span className="badge badge-forest">{tiger.primaryZone} Sector</span>
                <span className="badge badge-subtle">
                  {tiger.sex === 'FEMALE' ? '♀ Female' : '♂ Male'} • {tiger.ageClass.replace(/_/g, ' ')}
                </span>
                <span className="badge badge-blue">
                  {(tiger.confidence * 100).toFixed(0)}% Biometric Confidence
                </span>
              </div>
              <h2 className="profile-title">Individual Dossier: {tiger.id}</h2>
            </div>

            <p className="profile-notes">{tiger.notes}</p>

            {/* Metrics Grid */}
            <div className="profile-metrics-grid">
              <div className="p-metric">
                <span className="p-label">Estimated Territory</span>
                <span className="p-val telemetry-num">{tiger.homeRange.areaSqKm} km²</span>
              </div>
              <div className="p-metric">
                <span className="p-label">Camera Observations</span>
                <span className="p-val telemetry-num">{tiger.detectionCount} captures</span>
              </div>
              <div className="p-metric">
                <span className="p-label">First Detected</span>
                <span className="p-val telemetry-num">
                  {new Date(tiger.firstDetected).toLocaleDateString()}
                </span>
              </div>
              <div className="p-metric">
                <span className="p-label">Stripe Signature</span>
                <span className="p-val telemetry-num font-mono">{tiger.stripeSignature}</span>
              </div>
            </div>

            {/* Camera Stations Array */}
            <div className="camera-stations-strip">
              <span className="strip-lbl">Active Stations in Range:</span>
              <div className="station-chips">
                {tiger.cameraStations.map((stn) => (
                  <span key={stn} className="station-chip font-mono">
                    <Camera size={11} />
                    <span>{stn}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Biometric Stripe Dossier & Detection History */}
      <div className="dossier-body-grid">
        {/* Left Column: Biometric Flank Profile */}
        <div className="tt-card stripe-dossier-card">
          <div className="tt-card-header">
            <h3 className="tt-card-title">
              <ShieldCheck size={16} className="text-forest" />
              <span>Biometric Flank Profile</span>
            </h3>
            <span className="badge badge-forest">
              <CheckCircle2 size={11} /> High Match Confidence
            </span>
          </div>

          <div className="stripe-visual-box">
            <div className="stripe-pattern-graphic">
              <div className="stripe-signature-tag font-mono">{tiger.stripeSignature}</div>
              <div className="stripe-sub-text">Camera-Trap Flank Feature Vector • 512-dim Cosine Metric</div>
            </div>
          </div>

          <div className="stripe-specs-list">
            <div className="spec-row">
              <span className="spec-name">Primary Camera Catch Station:</span>
              <span className="spec-val font-mono">{tiger.cameraStations[0] || 'STN-TR-01'}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Flank Symmetry Assessment:</span>
              <span className="spec-val">Dual-flank matches indexed</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Territory Core Center:</span>
              <span className="spec-val telemetry-num">
                {tiger.homeRange.coreCenter.lat.toFixed(4)}°N, {tiger.homeRange.coreCenter.lng.toFixed(4)}°E
              </span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Last Camera Detection:</span>
              <span className="spec-val telemetry-num">
                {new Date(tiger.lastDetected).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="dossier-actions-row">
            <Link to="/movement" className="tt-btn tt-btn-primary full-width">
              <MapPin size={14} />
              <span>View Territory on Spatial GIS Map</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Historical Camera-Trap Observations */}
        <div className="tt-card detections-history-card">
          <div className="tt-card-header">
            <h3 className="tt-card-title">
              <Activity size={16} className="text-forest" />
              <span>Camera-Trap Detection Timeline</span>
            </h3>
            <span className="badge badge-subtle">
              {tiger.detections.length} Detailed Captures
            </span>
          </div>

          <div className="timeline-stream">
            {tiger.detections.map((d, idx) => (
              <div key={d.id} className="timeline-node">
                <div className="timeline-left">
                  <div className="timeline-dot" />
                  {idx < tiger.detections.length - 1 && <div className="timeline-line" />}
                </div>

                <div className="timeline-content">
                  <div className="node-photo-box">
                    <img src={d.thumbnailUrl} alt={d.id} className="node-photo" />
                  </div>

                  <div className="node-text-body">
                    <div className="node-top">
                      <span className="node-station">{d.cameraStationName}</span>
                      <span className="node-time telemetry-num">
                        {new Date(d.timestamp).toLocaleDateString()} {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="node-details">
                      <span className="badge badge-subtle font-mono">Flank: {d.flankSide}</span>
                      <span className="badge badge-forest font-mono">
                        {(d.confidence * 100).toFixed(0)}% Confidence
                      </span>
                      <span className="node-zone">{d.zone} Sector</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {relatedSightings.length > 0 && (
              <div className="related-sightings-box">
                <div className="related-header">
                  <Clock size={12} className="text-muted" />
                  <span>Recent Screening Sightings Associated with Candidate</span>
                </div>
                {relatedSightings.map(s => (
                  <div key={s.id} className="related-item">
                    <span className="font-mono text-muted">{s.captureId}</span>
                    <span>{s.cameraTrapName}</span>
                    <span className="badge badge-amber font-mono">
                      {(s.topCandidateConfidence * 100).toFixed(0)}% Score
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .tiger-details-page {
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

        .details-nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .back-btn {
          font-size: 12px;
          gap: 6px;
        }

        .dossier-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dossier-id {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .dossier-header-card {
          padding: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
        }

        .dossier-profile-grid {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 20px;
        }

        @media (max-width: 860px) {
          .dossier-profile-grid {
            grid-template-columns: 1fr;
          }
        }

        .profile-img-container {
          position: relative;
          height: 200px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: #090E17;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: var(--shadow-sm);
        }

        .profile-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .status-badge-overlay {
          position: absolute;
          top: 8px;
          left: 8px;
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          background: rgba(16, 185, 129, 0.85);
          color: #FFFFFF;
          border: 1px solid rgba(16, 185, 129, 0.3);
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
        }

        .profile-main-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .code-pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 6px;
        }

        .profile-title {
          font-size: 18px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .profile-notes {
          font-size: 12.5px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .profile-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          margin-top: 4px;
        }

        @media (max-width: 992px) {
          .profile-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .p-metric {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .p-label {
          font-size: 9px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .p-val {
          font-size: 12.5px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .camera-stations-strip {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .strip-lbl {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
        }

        .station-chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .station-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: var(--color-primary-light);
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 10.5px;
          font-weight: 600;
        }

        .dossier-body-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 900px) {
          .dossier-body-grid {
            grid-template-columns: 1fr;
          }
        }

        .stripe-visual-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
          padding: 24px 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          position: relative;
          overflow: hidden;
        }

        .stripe-visual-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent);
        }

        .stripe-pattern-graphic {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          text-align: center;
        }

        .stripe-signature-tag {
          font-size: 13px;
          font-weight: 700;
          color: #34D399;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 4px 12px;
          border-radius: 6px;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.15);
        }

        .stripe-sub-text {
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .stripe-specs-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 14px;
        }

        .spec-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .spec-name {
          color: var(--text-muted);
        }

        .spec-val {
          font-weight: 600;
          color: #FFFFFF;
        }

        .dossier-actions-row {
          margin-top: auto;
        }

        .full-width {
          width: 100%;
        }

        .timeline-stream {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .timeline-node {
          display: flex;
          gap: 10px;
        }

        .timeline-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 12px;
          padding-top: 6px;
        }

        .timeline-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-primary);
          box-shadow: 0 0 8px var(--color-primary);
        }

        .timeline-line {
          width: 1.5px;
          flex: 1;
          background: rgba(255, 255, 255, 0.06);
          margin-top: 6px;
        }

        .timeline-content {
          flex: 1;
          display: flex;
          gap: 10px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
          padding: 10px;
          transition: all 0.25s ease;
        }

        .timeline-content:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .node-photo-box {
          width: 48px;
          height: 48px;
          border-radius: 6px;
          overflow: hidden;
          background: #090E17;
          border: 1px solid rgba(255, 255, 255, 0.06);
          flex-shrink: 0;
        }

        .node-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .node-text-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .node-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .node-station {
          font-size: 12px;
          font-weight: 600;
          color: #FFFFFF;
        }

        .node-time {
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .node-details {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
        }

        .node-zone {
          color: var(--text-muted);
          font-size: 10.5px;
        }

        .related-sightings-box {
          background: rgba(251, 191, 36, 0.03);
          border: 1px solid rgba(251, 191, 36, 0.15);
          border-radius: var(--radius-sm);
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 6px;
        }

        .related-header {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          font-weight: 700;
          color: #FBBF24;
          text-transform: uppercase;
        }

        .related-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11.5px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};
export default TigerDetails;
