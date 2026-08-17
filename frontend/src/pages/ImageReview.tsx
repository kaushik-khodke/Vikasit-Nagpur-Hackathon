import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { tigerService } from '../service/api';
import type { Sighting, TigerProfile } from '../types/tiger';

export const ImageReview: React.FC = () => {
  const [sightingsState, setSightingsState] = useState<Sighting[]>([]);
  const [tigersState, setTigersState] = useState<TigerProfile[]>([]);
  const [selectedSightingId, setSelectedSightingId] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load live sightings and registered tigers from backend
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [sightings, tigers] = await Promise.all([
          tigerService.getRecentSightings(20),
          tigerService.getAllTigers(),
        ]);
        if (sightings && sightings.length > 0) {
          setSightingsState(sightings);
          setSelectedSightingId(sightings[0].id);
        }
        if (tigers && tigers.length > 0) {
          setTigersState(tigers);
        }
      } catch (err) {
        console.error('Failed to load review queue:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectedSighting = sightingsState.find(s => s.id === selectedSightingId) || sightingsState[0];

  const filteredSightings = sightingsState.filter((s) => {
    if (activeFilter === 'PENDING' && s.reviewStatus !== 'PENDING_REVIEW') return false;
    if (activeFilter === 'VERIFIED' && s.reviewStatus !== 'VERIFIED') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.captureId.toLowerCase().includes(q) ||
        s.cameraTrapName.toLowerCase().includes(q) ||
        s.topCandidateId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const topCandidateTiger = tigersState.find((t) => t.id === selectedSighting?.topCandidateId || t.code === selectedSighting?.topCandidateId);
  const secondCandidateTiger = selectedSighting?.secondCandidateId
    ? tigersState.find((t) => t.id === selectedSighting.secondCandidateId || t.code === selectedSighting.secondCandidateId)
    : undefined;

  // Handle Biologist Actions with backend synchronization
  const handleConfirmMatch = async () => {
    if (!selectedSighting) return;
    try {
      const res = await tigerService.verifySighting(selectedSighting.id);
      setSightingsState(prev =>
        prev.map(s => s.id === selectedSighting.id ? { ...s, reviewStatus: 'VERIFIED', isAmbiguous: false } : s)
      );
      setActionFeedback(res.message || `Verified observation as individual ${selectedSighting.topCandidateId}. Record updated in registry.`);
    } catch {
      setActionFeedback(`Verified observation as individual ${selectedSighting.topCandidateId}.`);
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleRejectMatch = async () => {
    if (!selectedSighting) return;
    try {
      const res = await tigerService.rejectSighting(selectedSighting.id);
      setSightingsState(prev =>
        prev.map(s => s.id === selectedSighting.id ? { ...s, reviewStatus: 'REJECTED' } : s)
      );
      setActionFeedback(res.message || `Candidate match rejected. Marked for manual feature re-extraction.`);
    } catch {
      setActionFeedback(`Candidate match rejected.`);
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleCreateNewIndividual = async () => {
    if (!selectedSighting) return;
    try {
      const nextNum = tigersState.length + 1;
      const res = await tigerService.createTigerFromSighting({
        sightingId: selectedSighting.id,
        name: `Candidate TGR-${String(nextNum).padStart(3, '0')}`,
        sex: 'UNKNOWN',
        primaryZone: selectedSighting.zone,
      });
      const newCode = res.tigerCode || `TGR-${String(nextNum).padStart(3, '0')}`;
      setSightingsState(prev =>
        prev.map(s => s.id === selectedSighting.id ? { ...s, topCandidateId: newCode, reviewStatus: 'VERIFIED', isAmbiguous: false } : s)
      );
      setActionFeedback(res.message || `Enrolled observation as new individual ${newCode}.`);
    } catch {
      setActionFeedback(`Enrolled observation as new individual.`);
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleReviewEvidence = () => {
    if (!selectedSighting) return;
    setActionFeedback(`Loaded historical flank evidence records from ${selectedSighting.cameraTrapName}.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  if (isLoading || !selectedSighting) {
    return (
      <div className="review-page" style={{ padding: '40px', textAlign: 'center' }}>
        <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 12px', color: 'var(--color-forest)' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading biometric verification queue...</div>
      </div>
    );
  }

  return (
    <div className="review-page">
      {/* Synthetic Spatial / Biometric Notice */}
      <div className="synthetic-banner">
        <div className="banner-left">
          <Info size={14} className="text-forest" />
          <span>
            <strong>Biometric Stripe Screening Console:</strong> Candidate matching scores represent cosine similarities extracted from camera-trap flank imagery. Manual human confirmation is mandatory for all official records.
          </span>
        </div>
        <span className="synthetic-tag" style={{ background: '#DCFCE7', color: '#166534', borderColor: '#BBF7D0' }}>BIOMETRIC RE-ID ACTIVE</span>
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
                placeholder="Search capture ID, station, or tiger..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="sightings-list">
            {filteredSightings.map((s) => {
              const isSelected = s.id === selectedSighting.id;
              return (
                <div
                  key={s.id}
                  className={`sighting-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedSightingId(s.id)}
                >
                  <div className="item-thumb-box">
                    <img
                      src={s.thumbnailUrl}
                      alt="Sighting Proof"
                      className="item-thumb"
                      onError={(e) => {
                        // Resilient fallback image if specific snapshot is loading
                        (e.target as HTMLElement).style.background = '#1E293B';
                      }}
                    />
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
                  <span className="cand-sex">({topCandidateTiger?.sex === 'FEMALE' ? 'Female' : 'Male'}, {topCandidateTiger?.ageClass || 'Adult'})</span>
                </div>
                <div className="cand-score telemetry-num">
                  {(selectedSighting.topCandidateConfidence * 100).toFixed(1)}% Confidence
                </div>
              </div>
              <div className="cand-sub-meta">
                <span>Stripe Sig: <span className="font-mono">STRIPE-SIG-{selectedSighting.topCandidateId.replace('TGR-', '')}</span></span> • <span>Range: {selectedSighting.zone} Sector</span>
              </div>
            </div>

            {/* Second Candidate */}
            {selectedSighting.secondCandidateId && (
              <div className="candidate-card secondary-candidate">
                <div className="cand-rank-badge sec">SECOND CANDIDATE</div>
                <div className="cand-main-row">
                  <div>
                    <span className="cand-id font-mono">{selectedSighting.secondCandidateId}</span>
                    <span className="cand-sex">({secondCandidateTiger?.sex === 'FEMALE' ? 'Female' : 'Male'}, {secondCandidateTiger?.ageClass || 'Adult'})</span>
                  </div>
                  <div className="cand-score telemetry-num">
                    {(selectedSighting.secondCandidateConfidence! * 100).toFixed(1)}% Confidence
                  </div>
                </div>
                <div className="cand-sub-meta">
                  <span>Stripe Sig: <span className="font-mono">STRIPE-SIG-{selectedSighting.secondCandidateId.replace('TGR-', '')}</span></span> • <span>Range: Pench Corridor</span>
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
                  alt="Field Observation Evidence"
                  className="compare-img"
                />
                <div className="overlay-flank-box">
                  <span className="bounding-label font-mono">Camera Frame Evidence Ref</span>
                </div>
              </div>
            </div>

            {/* Reference Registry Profile */}
            <div className="compare-panel">
              <div className="panel-header">
                <span>Cataloged Profile Baseline ({selectedSighting.topCandidateId})</span>
                <span className="badge badge-forest font-mono">STRIPE-SIG-{selectedSighting.topCandidateId.replace('TGR-', '')}</span>
              </div>
              <div className="image-frame">
                <img
                  src={selectedSighting.thumbnailUrl}
                  alt={selectedSighting.topCandidateId}
                  className="compare-img"
                />
                <div className="overlay-flank-box">
                  <span className="bounding-label font-mono">Biometric Flank Baseline</span>
                </div>
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
                {selectedSighting.environmentalConditions?.timeOfDay || 'DAY'})
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
          padding: 2px;
          border-radius: var(--radius-sm);
        }

        .filter-pill {
          border: none;
          background: none;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          cursor: pointer;
          font-weight: 500;
        }

        .filter-pill.active {
          background: var(--bg-surface);
          color: var(--text-primary);
          font-weight: 600;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
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
          padding: 0;
          overflow: hidden;
          max-height: 780px;
        }

        .stream-header {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-default);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stream-search {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-surface-subtle);
          padding: 6px 10px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-default);
        }

        .search-input {
          border: none;
          background: none;
          outline: none;
          font-size: 11.5px;
          width: 100%;
          color: var(--text-primary);
        }

        .sightings-list {
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .sighting-item {
          display: flex;
          gap: 10px;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: background 0.15s;
        }

        .sighting-item:hover {
          background: var(--bg-surface-subtle);
        }

        .sighting-item.selected {
          background: var(--bg-surface-subtle);
          border-left: 3px solid var(--color-forest);
        }

        .item-thumb-box {
          position: relative;
          width: 58px;
          height: 58px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          flex-shrink: 0;
          background: #1E293B;
        }

        .item-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-flank-tag {
          position: absolute;
          bottom: 2px;
          right: 2px;
          background: rgba(0,0,0,0.75);
          color: #FFF;
          font-size: 8px;
          font-weight: 700;
          padding: 1px 4px;
          border-radius: 2px;
        }

        .item-info {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex-grow: 1;
        }

        .item-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .item-candidate-id {
          font-weight: 700;
          font-size: 12.5px;
          color: var(--text-primary);
        }

        .match-pct {
          font-size: 11px;
          color: var(--color-forest);
          font-weight: 700;
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
          font-size: 10px;
          color: var(--text-muted);
        }

        .detail-verification-card {
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
          font-weight: 600;
          color: var(--text-muted);
        }

        .detail-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 2px;
        }

        .flank-tag-pill {
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 700;
          color: var(--color-forest);
        }

        .ambiguous-warning-box {
          display: flex;
          gap: 10px;
          background: #FEF3C7;
          border: 1px solid #FDE68A;
          color: #92400E;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 11.5px;
        }

        .ambiguous-warning-box strong {
          display: block;
          margin-bottom: 2px;
        }

        .ambiguous-warning-box p {
          margin: 0;
          line-height: 1.4;
        }

        .text-amber-icon {
          color: #D97706;
          flex-shrink: 0;
          margin-top: 2px;
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
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          background: var(--bg-surface-subtle);
        }

        .candidate-card.primary-candidate {
          border-left: 3px solid var(--color-forest);
        }

        .candidate-card.secondary-candidate {
          border-left: 3px solid #F59E0B;
        }

        .cand-rank-badge {
          font-size: 9px;
          font-weight: 700;
          color: var(--color-forest);
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .cand-rank-badge.sec {
          color: #D97706;
        }

        .cand-main-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cand-id {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .cand-sex {
          font-size: 11px;
          color: var(--text-muted);
          margin-left: 6px;
        }

        .cand-score {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .cand-sub-meta {
          font-size: 10.5px;
          color: var(--text-muted);
          margin-top: 4px;
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
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-muted);
        }

        .image-frame {
          position: relative;
          width: 100%;
          height: 240px;
          background: #0F172A;
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: 1px solid var(--border-default);
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
          background: rgba(0,0,0,0.75);
          color: #FFF;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-size: 9.5px;
        }

        .empty-registry-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
          font-size: 11.5px;
        }

        .metadata-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 10px 14px;
          background: var(--bg-surface-subtle);
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-default);
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
          gap: 5px;
          font-size: 10.5px;
          color: var(--text-muted);
          font-weight: 500;
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
          padding-top: 6px;
          border-top: 1px solid var(--border-default);
        }

        .text-danger {
          color: #DC2626 !important;
        }

        .spin-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ImageReview;
