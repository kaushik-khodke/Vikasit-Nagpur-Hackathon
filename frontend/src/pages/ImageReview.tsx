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
  Info,
  Check,
  X
} from 'lucide-react';
import { mockSightings, mockTigers } from '../data/mockData';
import type { Sighting } from '../types/tiger';

export const ImageReview: React.FC = () => {
  const [sightingsState, setSightingsState] = useState<Sighting[]>(mockSightings);
  const [selectedSightingId, setSelectedSightingId] = useState<string>(mockSightings[0].id);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const filteredSightings = sightingsState.filter((s) => {
    // Filter by tab
    if (activeFilter === 'PENDING' && s.reviewStatus !== 'PENDING_REVIEW') return false;
    if (activeFilter === 'VERIFIED' && s.reviewStatus !== 'VERIFIED') return false;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCandidate = s.topCandidateId?.toLowerCase().includes(q);
      const matchCapture = s.captureId?.toLowerCase().includes(q);
      const matchStation = s.cameraTrapName?.toLowerCase().includes(q);
      const matchZone = s.zone?.toLowerCase().includes(q);
      const matchFlank = s.flankSide?.toLowerCase().includes(q);
      const matchStatus = s.reviewStatus?.toLowerCase().includes(q);
      return matchCandidate || matchCapture || matchStation || matchZone || matchFlank || matchStatus;
    }
    return true;
  });

  const selectedSighting =
    filteredSightings.find(s => s.id === selectedSightingId) ||
    filteredSightings[0] ||
    sightingsState[0];

  const topCandidateTiger = mockTigers.find((t) => t.id === selectedSighting.topCandidateId);
  const secondCandidateTiger = selectedSighting.secondCandidateId
    ? mockTigers.find((t) => t.id === selectedSighting.secondCandidateId)
    : undefined;

  // Handle Biologist Actions
  const handleConfirmMatch = () => {
    setSightingsState(prev =>
      prev.map(s => s.id === selectedSighting.id ? { ...s, reviewStatus: 'VERIFIED', isAmbiguous: false } : s)
    );
    setActionFeedback(`Verified observation as individual ${selectedSighting.topCandidateId}. Record updated in registry.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleRejectMatch = () => {
    setSightingsState(prev =>
      prev.map(s => s.id === selectedSighting.id ? { ...s, reviewStatus: 'REJECTED' } : s)
    );
    setActionFeedback(`Candidate match rejected. Marked for manual feature re-extraction.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleCreateNewIndividual = () => {
    const newId = `SIM-TIG-${String(mockTigers.length + 1).padStart(3, '0')}`;
    setActionFeedback(`Initiated new individual registration workflow for provisional ID: ${newId}.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleReviewEvidence = () => {
    setActionFeedback(`Loaded historical flank comparison frames from station ${selectedSighting.cameraTrapName}.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  return (
    <div className="review-page">
      {/* Synthetic Spatial / Biometric Notice */}
      <div className="synthetic-banner">
        <div className="banner-left">
          <Info size={14} className="text-forest" />
          <span>
            <strong>Biometric Stripe Screening Console:</strong> Candidate matching scores represent prototype cosine similarities extracted from synthetic camera-trap flank imagery. Manual human confirmation is mandatory for all official records.
          </span>
        </div>
        <span className="synthetic-tag">PROTOTYPE BIOMETRIC QUEUE</span>
      </div>

      {/* Control Bar */}
      <div className="tt-card review-control-bar">
        <div className="control-left">
          <div className="section-tag">
            <Images size={13} />
            <span>CAMERA-TRAP BIOMETRIC VERIFICATION QUEUE</span>
          </div>
          <div className="queue-summary">
            <span>{sightingsState.length} Total Processed Captures</span> •{' '}
            <span className="text-warning">
              {sightingsState.filter(s => s.reviewStatus === 'PENDING_REVIEW').length} Awaiting Biologist Verification
            </span>
          </div>
        </div>

        <div className="control-right">
          <div className="filter-pill-group">
            <button
              className={`filter-pill ${activeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveFilter('ALL')}
            >
              All ({sightingsState.length})
            </button>
            <button
              className={`filter-pill ${activeFilter === 'PENDING' ? 'active' : ''}`}
              onClick={() => setActiveFilter('PENDING')}
            >
              Pending ({sightingsState.filter(s => s.reviewStatus === 'PENDING_REVIEW').length})
            </button>
            <button
              className={`filter-pill ${activeFilter === 'VERIFIED' ? 'active' : ''}`}
              onClick={() => setActiveFilter('VERIFIED')}
            >
              Verified ({sightingsState.filter(s => s.reviewStatus === 'VERIFIED').length})
            </button>
          </div>
        </div>
      </div>

      {/* Action Toast Feedback */}
      {actionFeedback && (
        <div className="action-feedback-toast">
          <Check size={14} />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Main Review Layout */}
      <div className="review-layout-grid">
        {/* Left: Observations Stream List */}
        <div className="tt-card stream-card">
          <div className="stream-header">
            <h3 className="tt-card-title">
              <span>Observation Feed</span>
              <span className="feed-count badge badge-subtle">{filteredSightings.length}</span>
            </h3>
            <div className="stream-search">
              <Search size={13} className="text-muted" />
              <input
                type="text"
                placeholder="Search capture ID or station..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="sightings-list">
            {filteredSightings.length === 0 ? (
              <div className="empty-search-state">
                <p>No captures match "{searchQuery}"</p>
                <button className="tt-btn tt-btn-ghost clear-btn-inline" onClick={() => setSearchQuery('')}>
                  Reset search
                </button>
              </div>
            ) : (
              filteredSightings.map((s) => {
                const isSelected = s.id === selectedSighting.id;
                return (
                  <div
                    key={s.id}
                    className={`sighting-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedSightingId(s.id)}
                  >
                    <div className="item-thumb-box">
                      <img src={s.thumbnailUrl} alt="Sighting" className="item-thumb" />
                      <span className="item-flank-tag">{s.flankSide}</span>
                    </div>

                    <div className="item-info">
                      <div className="item-header-row">
                        <span className="item-candidate-id font-mono">{s.topCandidateId}</span>
                        <span className="telemetry-num match-pct">
                          {(s.topCandidateConfidence * 100).toFixed(0)}% Score
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
                        ) : s.reviewStatus === 'REJECTED' ? (
                          <span className="badge badge-red">Rejected</span>
                        ) : (
                          <span className="badge badge-subtle">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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
                  The confidence differential between candidate <strong>{selectedSighting.topCandidateId}</strong> ({(selectedSighting.topCandidateConfidence * 100).toFixed(0)}%) and second candidate <strong>{selectedSighting.secondCandidateId}</strong> ({(selectedSighting.secondCandidateConfidence! * 100).toFixed(0)}%) is under 8%. Thorough stripe pattern manual comparison is required.
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
                  <span className="cand-id font-mono">{selectedSighting.topCandidateId}</span>
                  <span className="cand-sex">({topCandidateTiger?.sex === 'FEMALE' ? 'Female' : 'Male'}, {topCandidateTiger?.ageClass})</span>
                </div>
                <div className="cand-score telemetry-num">
                  {(selectedSighting.topCandidateConfidence * 100).toFixed(1)}% Confidence
                </div>
              </div>
              <div className="cand-sub-meta">
                <span>Stripe Sig: <span className="font-mono">{topCandidateTiger?.stripeSignature}</span></span> • <span>Range: {topCandidateTiger?.primaryZone}</span>
              </div>
            </div>

            {/* Second Candidate */}
            {selectedSighting.secondCandidateId && secondCandidateTiger && (
              <div className="candidate-card secondary-candidate">
                <div className="cand-rank-badge sec">SECOND CANDIDATE</div>
                <div className="cand-main-row">
                  <div>
                    <span className="cand-id font-mono">{selectedSighting.secondCandidateId}</span>
                    <span className="cand-sex">({secondCandidateTiger.sex === 'FEMALE' ? 'Female' : 'Male'})</span>
                  </div>
                  <div className="cand-score telemetry-num">
                    {(selectedSighting.secondCandidateConfidence! * 100).toFixed(1)}% Confidence
                  </div>
                </div>
                <div className="cand-sub-meta">
                  <span>Stripe Sig: <span className="font-mono">{secondCandidateTiger.stripeSignature}</span></span> • <span>Range: {secondCandidateTiger.primaryZone}</span>
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
                <span className="badge badge-subtle font-mono">{selectedSighting.cameraTrapId}</span>
              </div>
              <div className="image-frame">
                <img
                  src={selectedSighting.thumbnailUrl}
                  alt="Field Observation"
                  className="compare-img"
                />
                <div className="overlay-flank-box">
                  <span className="bounding-label font-mono">Camera Frame Segment Ref</span>
                </div>
              </div>
            </div>

            {/* Reference Registry Profile */}
            <div className="compare-panel">
              <div className="panel-header">
                <span>Cataloged Profile Baseline ({selectedSighting.topCandidateId})</span>
                <span className="badge badge-forest font-mono">{topCandidateTiger?.stripeSignature}</span>
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
                    <Info size={28} />
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
                <span>Observation Timestamp</span>
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
                <span>Camera Context</span>
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
            <button className="tt-btn tt-btn-primary" onClick={handleConfirmMatch}>
              <CheckCircle2 size={14} />
              <span>Confirm Match as {selectedSighting.topCandidateId}</span>
            </button>
            <button className="tt-btn tt-btn-secondary" onClick={handleCreateNewIndividual}>
              <UserPlus size={14} />
              <span>Create New Individual</span>
            </button>
            <button className="tt-btn tt-btn-secondary" onClick={handleReviewEvidence}>
              <FileSearch size={14} />
              <span>Review Evidence Archives</span>
            </button>
            <button className="tt-btn tt-btn-ghost text-danger" onClick={handleRejectMatch}>
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

        .banner-left {
          display: flex;
          align-items: center;
          gap: 8px;
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

        .action-feedback-toast {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #DCFCE7;
          border: 1px solid #BBF7D0;
          color: #166534;
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 500;
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
          height: calc(100vh - 230px);
          min-height: 520px;
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
          gap: 8px;
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 5px 8px;
          transition: border-color var(--transition-fast);
        }

        .stream-search:focus-within {
          border-color: var(--border-active);
          background: #FFFFFF;
        }

        .search-input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 11.5px;
          color: var(--text-primary);
          width: 100%;
        }

        .clear-search-btn {
          color: var(--text-muted);
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .clear-search-btn:hover {
          color: var(--text-primary);
        }

        .feed-count {
          font-size: 10px;
          padding: 1px 6px;
        }

        .empty-search-state {
          padding: 30px 14px;
          text-align: center;
          color: var(--text-muted);
          font-size: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .clear-btn-inline {
          font-size: 11.5px;
          color: var(--color-primary);
          text-decoration: underline;
          padding: 4px 8px;
        }

        .sightings-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sighting-item {
          display: flex;
          gap: 10px;
          padding: 8px 10px;
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sighting-item:hover {
          border-color: var(--border-active);
        }

        .sighting-item.selected {
          border-color: var(--color-primary);
          background: #FFFFFF;
          box-shadow: var(--shadow-sm);
        }

        .item-thumb-box {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: #E5E7EB;
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
          font-size: 8px;
          font-weight: 700;
          background: rgba(0, 0, 0, 0.7);
          color: #FFF;
          padding: 1px 3px;
          border-radius: 2px;
          font-family: var(--font-mono);
        }

        .item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .item-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .item-candidate-id {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .match-pct {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-primary);
        }

        .item-station-line {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10.5px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .detail-verification-card {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .detail-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .detail-id-tag {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
          margin-bottom: 2px;
        }

        .detail-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .flank-tag-pill {
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 700;
          background: #E8F2EC;
          border: 1px solid #C4DEC0;
          color: var(--color-primary);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
        }

        .ambiguous-warning-box {
          display: flex;
          gap: 10px;
          background: #FEF3C7;
          border: 1px solid #FDE68A;
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          color: #92400E;
          font-size: 12px;
        }

        .text-amber-icon {
          color: #B45309;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .ambiguous-warning-box strong {
          color: #78350F;
          font-size: 12px;
          display: block;
          margin-bottom: 2px;
        }

        .ambiguous-warning-box p {
          color: #92400E;
          font-size: 11.5px;
          line-height: 1.4;
        }

        .candidates-overview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 768px) {
          .candidates-overview-grid {
            grid-template-columns: 1fr;
          }
        }

        .candidate-card {
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-default);
          background: var(--bg-surface-subtle);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .candidate-card.primary-candidate {
          border-color: #B8D8C4;
          background: #F4F9F6;
        }

        .cand-rank-badge {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          color: var(--color-primary);
          letter-spacing: 0.04em;
        }

        .cand-rank-badge.sec {
          color: #9A3412;
        }

        .cand-main-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .cand-id {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          margin-right: 6px;
        }

        .cand-sex {
          font-size: 11.5px;
          color: var(--text-muted);
        }

        .cand-score {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-primary);
        }

        .cand-sub-meta {
          font-size: 11px;
          color: var(--text-muted);
        }

        .flank-compare-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 768px) {
          .flank-compare-grid {
            grid-template-columns: 1fr;
          }
        }

        .compare-panel {
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: #FFFFFF;
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
          height: 220px;
          background: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .compare-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .overlay-flank-box {
          position: absolute;
          bottom: 8px;
          left: 8px;
          background: rgba(0, 0, 0, 0.7);
          padding: 2px 6px;
          border-radius: 2px;
        }

        .bounding-label {
          font-size: 9.5px;
          color: #86EFAC;
          font-weight: 600;
        }

        .empty-registry-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: #9CA3AF;
          font-size: 12px;
        }

        .metadata-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
        }

        @media (max-width: 768px) {
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
          font-size: 9.5px;
          color: var(--text-muted);
          text-transform: uppercase;
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

        .text-danger {
          color: var(--status-critical-text);
        }

        .text-warning {
          color: #92400E;
        }

        .text-forest {
          color: var(--color-primary);
        }

        .font-mono {
          font-family: var(--font-mono);
        }
      `}</style>
    </div>
  );
};
export default ImageReview;
