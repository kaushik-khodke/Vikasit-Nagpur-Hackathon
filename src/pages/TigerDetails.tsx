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
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
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
          padding: 2px 7px;
          border-radius: var(--radius-sm);
          background: rgba(27, 94, 60, 0.9);
          color: #FFFFFF;
          border: 1px solid #13462D;
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
          color: var(--text-primary);
        }

        .profile-notes {
          font-size: 12.5px;
          color: var(--text-secondary);
          line-height: 1.45;
        }

        .profile-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
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
          font-size: 9.5px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .p-val {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-primary);
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
          font-weight: 500;
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
          background: #E8F2EC;
          border: 1px solid #C4DEC0;
          color: var(--color-primary);
          padding: 2px 7px;
          border-radius: 3px;
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
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 20px 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .stripe-pattern-graphic {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-align: center;
        }

        .stripe-signature-tag {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-primary);
          background: #DCEDE2;
          border: 1px solid #B8D8C4;
          padding: 3px 10px;
          border-radius: 4px;
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
          border-bottom: 1px solid var(--border-subtle);
        }

        .spec-name {
          color: var(--text-muted);
        }

        .spec-val {
          font-weight: 500;
          color: var(--text-primary);
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
          padding-top: 4px;
        }

        .timeline-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-primary);
        }

        .timeline-line {
          width: 1.5px;
          flex: 1;
          background: var(--border-default);
          margin-top: 4px;
        }

        .timeline-content {
          flex: 1;
          display: flex;
          gap: 10px;
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 8px 10px;
        }

        .node-photo-box {
          width: 48px;
          height: 48px;
          border-radius: 3px;
          overflow: hidden;
          background: #E5E7EB;
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
          color: var(--text-primary);
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
          background: #FDFBF7;
          border: 1px solid #F6E7D2;
          border-radius: var(--radius-sm);
          padding: 8px 10px;
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
          font-weight: 600;
          color: #9A3412;
        }

        .related-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11.5px;
        }
      `}</style>
    </div>
  );
};
export default TigerDetails;
