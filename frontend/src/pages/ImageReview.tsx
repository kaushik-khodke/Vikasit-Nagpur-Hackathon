import React, { useState } from 'react';
import {
  Images,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserPlus,
  FileSearch,
  Camera,
  MapPin,
  Calendar,
  Thermometer,
  Search,
  Sparkles,
  Info
} from 'lucide-react';
import { mockSightings, mockTigers } from '../data/mockData';
import type { Sighting } from '../types/tiger';

export const ImageReview: React.FC = () => {
  const [selectedSighting, setSelectedSighting] = useState<Sighting>(mockSightings[0]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('ALL');

  const filteredSightings = mockSightings.filter((s) => {
    if (activeFilter === 'PENDING') return s.reviewStatus === 'PENDING_REVIEW';
    if (activeFilter === 'VERIFIED') return s.reviewStatus === 'VERIFIED';
    return true;
  });

  const topCandidateTiger = mockTigers.find((t) => t.id === selectedSighting.topCandidateId);
  const secondCandidateTiger = selectedSighting.secondCandidateId
    ? mockTigers.find((t) => t.id === selectedSighting.secondCandidateId)
    : undefined;

  return (
    <div className="review-page">
      {/* Synthetic Spatial / Biometric Notice */}
      <div className="synthetic-banner">
        <div className="banner-text">
          <strong>Biometric Match Prototype:</strong> Candidate scores represent simulated stripe-pattern cosine similarities. Manual human confirmation is mandatory for official records.
        </div>
        <span className="synthetic-tag">PROTOTYPE SIMILARITY SCORES</span>
      </div>

      {/* Control Bar */}
      <div className="tt-card review-control-bar">
        <div className="control-left">
          <div className="section-tag">
            <Images size={13} />
            <span>CAMERA-TRAP BIOMETRIC VERIFICATION QUEUE</span>
          </div>
          <div className="queue-summary">
            <span>{mockSightings.length} Total Processed Captures</span> •{' '}
            <span className="text-warning">
              {mockSightings.filter(s => s.reviewStatus === 'PENDING_REVIEW').length} Awaiting Biologist Verification
            </span>
          </div>
        </div>

        <div className="control-right">
          <div className="filter-pill-group">
            <button
              className={`filter-pill ${activeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveFilter('ALL')}
            >
              All ({mockSightings.length})
            </button>
            <button
              className={`filter-pill ${activeFilter === 'PENDING' ? 'active' : ''}`}
              onClick={() => setActiveFilter('PENDING')}
            >
              Pending ({mockSightings.filter(s => s.reviewStatus === 'PENDING_REVIEW').length})
            </button>
            <button
              className={`filter-pill ${activeFilter === 'VERIFIED' ? 'active' : ''}`}
              onClick={() => setActiveFilter('VERIFIED')}
            >
              Verified
            </button>
          </div>
        </div>
      </div>

      {/* Main Review Layout */}
      <div className="review-layout-grid">
        {/* Left: Observations Stream List */}
        <div className="tt-card stream-card">
          <div className="stream-header">
            <h3 className="tt-card-title">
              <span>Observation Feed</span>
            </h3>
            <div className="stream-search">
              <Search size={13} className="text-muted" />
              <input type="text" placeholder="Search capture ID or station..." className="search-input" />
            </div>
          </div>

          <div className="sightings-list">
            {filteredSightings.map((s) => {
              const isSelected = s.id === selectedSighting.id;
              return (
                <div
                  key={s.id}
                  className={`sighting-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedSighting(s)}
                >
                  <div className="item-thumb-box">
                    <img src={s.thumbnailUrl} alt="Sighting" className="item-thumb" />
                    <span className="item-flank-tag">{s.flankSide}</span>
                  </div>

                  <div className="item-info">
                    <div className="item-header-row">
                      <span className="item-candidate-id">{s.topCandidateId}</span>
                      <span className="telemetry-num match-pct">
                        {(s.topCandidateConfidence * 100).toFixed(0)}% Match
                      </span>
                    </div>

                    <div className="item-station-line">
                      <Camera size={11} className="text-muted" />
                      <span>{s.cameraTrapName}</span>
                    </div>

                    <div className="item-meta-row">
                      <span className="item-time">
                        {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {s.isAmbiguous ? (
                        <span className="badge badge-amber">Ambiguous</span>
                      ) : s.reviewStatus === 'VERIFIED' ? (
                        <span className="badge badge-forest">Verified</span>
                      ) : (
                        <span className="badge badge-subtle">Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Stripe Comparison & Candidates */}
        <div className="tt-card detail-verification-card">
          {/* Header of selected capture */}
          <div className="detail-top-bar">
            <div>
              <div className="detail-id-tag telemetry-num">{selectedSighting.captureId} • {selectedSighting.zone} Sector</div>
              <h2 className="detail-title">
                Camera-Trap Observation: {selectedSighting.cameraTrapName}
              </h2>
            </div>

            <div className="flank-tag-pill">
              <span>{selectedSighting.flankSide} FLANK CAPTURE</span>
            </div>
          </div>

          {/* Ambiguity Alert Banner if candidates are close */}
          {selectedSighting.isAmbiguous && (
            <div className="ambiguous-warning-box">
              <AlertTriangle size={16} className="text-amber-icon" />
              <div>
                <strong>AMBIGUOUS MATCH — HUMAN REVIEW REQUIRED</strong>
                <p>
                  The confidence differential between candidate <strong>{selectedSighting.topCandidateId}</strong> ({(selectedSighting.topCandidateConfidence * 100).toFixed(0)}%) and <strong>{selectedSighting.secondCandidateId}</strong> ({(selectedSighting.secondCandidateConfidence! * 100).toFixed(0)}%) is under 8%. Thorough stripe pattern manual comparison is advised.
                </p>
              </div>
            </div>
          )}

          {/* Candidate Breakdown Bar */}
          <div className="candidates-overview-grid">
            {/* Top Candidate */}
            <div className="candidate-card primary-candidate">
              <div className="cand-rank-badge">TOP CANDIDATE</div>
              <div className="cand-main-row">
                <div>
                  <span className="cand-id telemetry-num">{selectedSighting.topCandidateId}</span>
                  <span className="cand-sex">({topCandidateTiger?.sex === 'FEMALE' ? 'Female' : 'Male'}, {topCandidateTiger?.ageClass})</span>
                </div>
                <div className="cand-score telemetry-num">
                  {(selectedSighting.topCandidateConfidence * 100).toFixed(1)}% Confidence
                </div>
              </div>
              <div className="cand-sub-meta">
                <span>Stripe Sig: {topCandidateTiger?.stripeSignature}</span> • <span>Range: {topCandidateTiger?.primaryZone}</span>
              </div>
            </div>

            {/* Second Candidate */}
            {selectedSighting.secondCandidateId && secondCandidateTiger && (
              <div className="candidate-card secondary-candidate">
                <div className="cand-rank-badge sec">RUNNER-UP CANDIDATE</div>
                <div className="cand-main-row">
                  <div>
                    <span className="cand-id telemetry-num">{selectedSighting.secondCandidateId}</span>
                    <span className="cand-sex">({secondCandidateTiger.sex === 'FEMALE' ? 'Female' : 'Male'})</span>
                  </div>
                  <div className="cand-score telemetry-num">
                    {(selectedSighting.secondCandidateConfidence! * 100).toFixed(1)}% Confidence
                  </div>
                </div>
                <div className="cand-sub-meta">
                  <span>Stripe Sig: {secondCandidateTiger.stripeSignature}</span> • <span>Range: {secondCandidateTiger.primaryZone}</span>
                </div>
              </div>
            )}
          </div>

          {/* Dual Image Comparison Panel */}
          <div className="flank-compare-grid">
            {/* Field Capture */}
            <div className="compare-panel">
              <div className="panel-header">
                <span>Current Observation ({selectedSighting.flankSide} FLANK)</span>
                <span className="badge badge-subtle">{selectedSighting.cameraTrapId}</span>
              </div>
              <div className="image-frame">
                <img
                  src={selectedSighting.thumbnailUrl}
                  alt="Field Observation"
                  className="compare-img"
                />
                <div className="overlay-flank-box">
                  <span className="bounding-label">Stripe Segment Grid Ref</span>
                </div>
              </div>
            </div>

            {/* Reference Registry Profile */}
            <div className="compare-panel">
              <div className="panel-header">
                <span>Cataloged Profile Reference ({selectedSighting.topCandidateId})</span>
                <span className="badge badge-forest">{topCandidateTiger?.stripeSignature}</span>
              </div>
              <div className="image-frame">
                {topCandidateTiger ? (
                  <img
                    src={topCandidateTiger.imageUrl}
                    alt={topCandidateTiger.id}
                    className="compare-img"
                  />
                ) : (
                  <div className="empty-registry-state">
                    <Info size={32} />
                    <span>No baseline archive record found.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Environmental Metadata Strip */}
          <div className="metadata-strip">
            <div className="meta-cell">
              <div className="cell-label">
                <Calendar size={11} />
                <span>Timestamp</span>
              </div>
              <div className="cell-value telemetry-num">
                {new Date(selectedSighting.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="meta-cell">
              <div className="cell-label">
                <MapPin size={11} />
                <span>Station & Sector</span>
              </div>
              <div className="cell-value">
                {selectedSighting.cameraTrapName} ({selectedSighting.zone})
              </div>
            </div>

            <div className="meta-cell">
              <div className="cell-label">
                <Thermometer size={11} />
                <span>Observation Context</span>
              </div>
              <div className="cell-value">
                {selectedSighting.environmentalConditions?.weather || 'Clear'},{' '}
                {selectedSighting.environmentalConditions?.temperatureCelsius || 24}°C (
                {selectedSighting.environmentalConditions?.timeOfDay})
              </div>
            </div>
          </div>

          {/* Biologist Decision Action Buttons */}
          <div className="decision-action-bar">
            <button className="tt-btn tt-btn-primary">
              <CheckCircle2 size={14} />
              <span>Confirm Match as {selectedSighting.topCandidateId}</span>
            </button>
            <button className="tt-btn tt-btn-secondary">
              <UserPlus size={14} />
              <span>Create New Individual</span>
            </button>
            <button className="tt-btn tt-btn-secondary">
              <FileSearch size={14} />
              <span>Review Evidence Archives</span>
            </button>
            <button className="tt-btn tt-btn-ghost text-danger">
              <XCircle size={14} />
              <span>Reject Match</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .review-page {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .review-control-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
        }

        @media (max-width: 768px) {
          .review-control-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }

        .section-tag {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          color: var(--color-primary);
          letter-spacing: 0.04em;
        }

        .queue-summary {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-primary);
          margin-top: 2px;
        }

        .filter-pill-group {
          display: flex;
          gap: 4px;
          background: var(--bg-surface-subtle);
          padding: 3px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-default);
        }

        .filter-pill {
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 11.5px;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .filter-pill.active {
          background: #FFFFFF;
          color: var(--color-primary);
          font-weight: 600;
          border: 1px solid var(--border-default);
        }

        .review-layout-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 14px;
        }

        @media (max-width: 1024px) {
          .review-layout-grid {
            grid-template-columns: 1fr;
          }
        }

        .stream-card {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 210px);
          min-height: 500px;
          padding: 14px;
        }

        .stream-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 10px;
        }

        .stream-search {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 5px 8px;
        }

        .search-input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 11.5px;
          color: var(--text-primary);
          width: 100%;
        }

        .sightings-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-right: 2px;
        }

        .sighting-item {
          display: flex;
          gap: 10px;
          padding: 8px;
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sighting-item:hover {
          border-color: var(--border-active);
          background: #FFFFFF;
        }

        .sighting-item.selected {
          border-color: var(--color-primary);
          background: var(--color-primary-bg);
        }

        .item-thumb-box {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: #E6EDE8;
          flex-shrink: 0;
        }

        .item-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-flank-tag {
          position: absolute;
          bottom: 2px;
          left: 2px;
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 700;
          background: rgba(0, 0, 0, 0.7);
          color: #FFFFFF;
          padding: 1px 3px;
          border-radius: 2px;
        }

        .item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .item-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .item-candidate-id {
          font-family: var(--font-mono);
          font-size: 11.5px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .match-pct {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--color-primary);
        }

        .item-station-line {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          color: var(--text-secondary);
        }

        .item-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
        }

        .item-time {
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        .detail-verification-card {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .detail-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-default);
          padding-bottom: 10px;
        }

        .detail-id-tag {
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .detail-title {
          font-size: 16px;
          font-weight: 600;
        }

        .flank-tag-pill {
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .ambiguous-warning-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background-color: var(--status-warning-bg);
          border: 1px solid var(--status-warning-border);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          font-size: 12px;
          color: var(--status-warning-text);
        }

        .text-amber-icon {
          color: #B45309;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .ambiguous-warning-box p {
          margin-top: 2px;
          font-size: 11.5px;
          line-height: 1.4;
        }

        .candidates-overview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @media (max-width: 640px) {
          .candidates-overview-grid {
            grid-template-columns: 1fr;
          }
        }

        .candidate-card {
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          background: var(--bg-surface-subtle);
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .candidate-card.primary-candidate {
          border-left: 3px solid var(--color-primary);
          background: #F4F8F5;
        }

        .candidate-card.secondary-candidate {
          border-left: 3px solid #D97706;
        }

        .cand-rank-badge {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          color: var(--color-primary);
          letter-spacing: 0.05em;
        }

        .cand-rank-badge.sec {
          color: #B45309;
        }

        .cand-main-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .cand-id {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .cand-sex {
          font-size: 11px;
          color: var(--text-muted);
          margin-left: 4px;
        }

        .cand-score {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-primary);
        }

        .cand-sub-meta {
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .flank-compare-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 640px) {
          .flank-compare-grid {
            grid-template-columns: 1fr;
          }
        }

        .compare-panel {
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: var(--bg-surface);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 10px;
          background: var(--bg-surface-subtle);
          border-bottom: 1px solid var(--border-default);
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .image-frame {
          position: relative;
          height: 240px;
          background: #EEF2EF;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .compare-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .overlay-flank-box {
          position: absolute;
          inset: 20px;
          border: 1.5px dashed #D97706;
          pointer-events: none;
          display: flex;
          align-items: flex-end;
          padding: 4px;
        }

        .bounding-label {
          background: rgba(0, 0, 0, 0.7);
          color: #FFFFFF;
          font-family: var(--font-mono);
          font-size: 9px;
          padding: 1px 4px;
          border-radius: 2px;
        }

        .empty-registry-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 16px;
          gap: 8px;
          color: var(--text-muted);
          font-size: 11.5px;
        }

        .metadata-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
        }

        @media (max-width: 640px) {
          .metadata-strip {
            grid-template-columns: 1fr;
          }
        }

        .meta-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .cell-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .cell-value {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .decision-action-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding-top: 4px;
        }

        .text-warning { color: var(--status-warning-text); }
        .text-danger { color: var(--status-critical-text); }
      `}</style>
    </div>
  );
};
export default ImageReview;
