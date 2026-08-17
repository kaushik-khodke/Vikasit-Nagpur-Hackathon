import React, { useState } from 'react';
import {
  UploadCloud,
  FileCheck,
  HardDrive,
  ShieldCheck,
  Archive,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  RotateCcw
} from 'lucide-react';
import { mockBatches, mockCameraTraps } from '../data/mockData';
import type { CameraProcessingBatch } from '../types/tiger';

export const CameraProcessing: React.FC = () => {
  const [batches, setBatches] = useState<CameraProcessingBatch[]>(mockBatches);
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'BATCHES' | 'QUARANTINE_LOG'>('BATCHES');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Aggregated screening and quarantine metrics
  const totalImgs = batches.reduce((acc, b) => acc + b.totalImages, 0);
  const totalBlank = batches.reduce((acc, b) => acc + b.blankImages, 0);
  const totalRetained = batches.reduce((acc, b) => acc + b.imagesRetained, 0);
  const totalQuarantined = batches.reduce((acc, b) => acc + b.imagesQuarantined, 0);
  const totalReview = batches.reduce((acc, b) => acc + b.imagesRequiringReview, 0);
  const totalTigers = batches.reduce((acc, b) => acc + b.tigersDetected, 0);

  const handleSimulateUpload = () => {
    const newBatch: CameraProcessingBatch = {
      batchId: `BATCH-2026-0817-${String.fromCharCode(65 + batches.length)}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Forester S. Meshram (Jamtara Beat)',
      trapStation: selectedStation === 'ALL' ? 'Jamtara Southern Ridge (STN-JM-04)' : `Station ${selectedStation}`,
      totalImages: 280,
      blankImages: 160,
      imagesRetained: 120,
      imagesQuarantined: 160,
      imagesRequiringReview: 6,
      tigersDetected: 8,
      status: 'EXTRACTING',
      progressPercent: 35
    };
    setBatches([newBatch, ...batches]);
    setFeedbackMsg(`Initiated ingestion of SD dump for ${newBatch.trapStation}. Reversible screening underway.`);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleRestoreQuarantined = (batchId: string) => {
    setBatches(prev => prev.map(b => {
      if (b.batchId === batchId && b.imagesQuarantined > 0) {
        return {
          ...b,
          imagesRetained: b.imagesRetained + 10,
          imagesQuarantined: b.imagesQuarantined - 10,
          imagesRequiringReview: b.imagesRequiringReview + 10
        };
      }
      return b;
    }));
    setFeedbackMsg(`Restored 10 quarantined frames from ${batchId} to Image Review queue.`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="processing-page">
      {feedbackMsg && (
        <div className="feedback-toast">
          <CheckCircle2 size={14} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Overview Screening Metrics Cards */}
      <div className="metrics-summary-grid">
        <div className="tt-card metric-box">
          <span className="m-label">Total Ingested Images</span>
          <span className="m-val telemetry-num">{totalImgs}</span>
          <span className="m-sub">Across {batches.length} field SD batches</span>
        </div>

        <div className="tt-card metric-box">
          <span className="m-label">Blank Trigger Frames</span>
          <span className="m-val telemetry-num text-muted">{totalBlank}</span>
          <span className="m-sub">{((totalBlank / totalImgs) * 100).toFixed(0)}% wind / foliage triggers</span>
        </div>

        <div className="tt-card metric-box">
          <span className="m-label">Images Retained (Fauna)</span>
          <span className="m-val text-forest telemetry-num">{totalRetained}</span>
          <span className="m-sub">{((totalRetained / totalImgs) * 100).toFixed(0)}% valid fauna detections</span>
        </div>

        <div className="tt-card metric-box">
          <span className="m-label">Quarantined (Reversible)</span>
          <span className="m-val text-amber telemetry-num">{totalQuarantined}</span>
          <span className="m-sub">Preserved in archive, zero permanent deletion</span>
        </div>

        <div className="tt-card metric-box">
          <span className="m-label">Requiring Biologist Review</span>
          <span className="m-val text-info telemetry-num">{totalReview}</span>
          <span className="m-sub">Partial / low-light flank frames</span>
        </div>

        <div className="tt-card metric-box">
          <span className="m-label">Tiger Detections Extracted</span>
          <span className="m-val text-forest telemetry-num">{totalTigers}</span>
          <span className="m-sub">Candidate matches indexed</span>
        </div>
      </div>

      {/* Upload Dropzone & Safe Ingest Policy */}
      <div className="grid-2">
        <div className="tt-card upload-card">
          <div className="tt-card-header">
            <h3 className="tt-card-title">
              <UploadCloud size={16} className="text-forest" />
              <span>Import Camera-Trap SD Dump</span>
            </h3>
            <span className="badge badge-subtle">SD / FAT32 / Archive</span>
          </div>

          <div className="dropzone-box">
            <UploadCloud size={28} className="dropzone-icon" />
            <div className="dropzone-main-text">
              Select Camera-Trap Media Directory or ZIP File
            </div>
            <div className="dropzone-sub-text">
              Exif metadata, camera station IDs, and camera timestamps will be indexed and screened.
            </div>
            <div className="dropzone-actions">
              <button className="tt-btn tt-btn-primary" onClick={handleSimulateUpload}>
                <UploadCloud size={14} />
                <span>Simulate Ingest from SD Card</span>
              </button>
              <button className="tt-btn tt-btn-secondary" onClick={handleSimulateUpload}>
                <span>Select ZIP Archive</span>
              </button>
            </div>
          </div>

          <div className="upload-options-row">
            <div className="option-field">
              <label className="field-label">Camera Station Deployment:</label>
              <select
                className="tt-select"
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
              >
                <option value="ALL">Auto-read from Station Header / Exif</option>
                {mockCameraTraps.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.zone})
                  </option>
                ))}
              </select>
            </div>

            <div className="option-field">
              <label className="field-label">Screening Filter Profile:</label>
              <select className="tt-select" defaultValue="CONSERVATIVE">
                <option value="CONSERVATIVE">Conservative (Retain low-confidence animal captures)</option>
                <option value="FAST">Standard (Screen obvious wind/foliage blanks)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Screening Policy & Safe Quarantine Concept */}
        <div className="tt-card quarantine-policy-card">
          <div className="tt-card-header">
            <h3 className="tt-card-title">
              <Archive size={16} className="text-forest" />
              <span>Screening & Safe Reversible Quarantine Policy</span>
            </h3>
            <span className="badge badge-forest">Audit-Safe Storage</span>
          </div>

          <div className="policy-items-list">
            <div className="policy-item">
              <ShieldCheck size={16} className="text-forest policy-icon" />
              <div>
                <strong>Reversible Quarantine Model (No Permanent Deletion)</strong>
                <p>
                  Images classified as empty blanks (wind triggers, vegetation movement) are stored in an indexed quarantine archive with original Exif headers. They are never permanently deleted and can be inspected or restored at any time.
                </p>
              </div>
            </div>

            <div className="policy-item">
              <FileCheck size={16} className="text-forest policy-icon" />
              <div>
                <strong>Exif & Audit Trail Preservation</strong>
                <p>
                  Original capture timestamps, camera station serial numbers, and sequential frame indexes are retained verbatim for government wildlife monitoring audits and census verification.
                </p>
              </div>
            </div>

            <div className="policy-item">
              <AlertCircle size={16} className="text-warning policy-icon" />
              <div>
                <strong>Low-Confidence Frame Triage</strong>
                <p>
                  Obscured captures or partial flanks are automatically routed to the human biologist Image Review queue rather than auto-quarantined.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Processing Table */}
      <div className="tt-card batches-card">
        <div className="tt-card-header">
          <div>
            <h3 className="tt-card-title">
              <HardDrive size={15} className="text-forest" />
              <span>Camera-Trap Batch Ingestion Log</span>
            </h3>
            <p className="tt-card-subtitle">Dataset import screening and reversible quarantine tracking</p>
          </div>

          <div className="view-toggle-pills">
            <button
              className={`pill-btn ${activeTab === 'BATCHES' ? 'active' : ''}`}
              onClick={() => setActiveTab('BATCHES')}
            >
              All Batches ({batches.length})
            </button>
            <button
              className={`pill-btn ${activeTab === 'QUARANTINE_LOG' ? 'active' : ''}`}
              onClick={() => setActiveTab('QUARANTINE_LOG')}
            >
              Quarantine Audit Log
            </button>
          </div>
        </div>

        {activeTab === 'BATCHES' ? (
          <div className="batches-table-wrapper">
            <table className="tt-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Camera Station / Range</th>
                  <th>Uploaded By</th>
                  <th>Total Imgs</th>
                  <th>Retained (Fauna)</th>
                  <th>Quarantined Blanks</th>
                  <th>Review Queue</th>
                  <th>Tigers Found</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.batchId}>
                    <td>
                      <span className="batch-id-tag telemetry-num">{b.batchId}</span>
                    </td>
                    <td>
                      <div className="station-title">{b.trapStation}</div>
                      <div className="time-sub-tag">
                        {new Date(b.uploadedAt).toLocaleDateString()} at {new Date(b.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="uploader-cell">{b.uploadedBy}</td>
                    <td className="telemetry-num">{b.totalImages}</td>
                    <td className="telemetry-num text-forest font-bold">{b.imagesRetained}</td>
                    <td>
                      <div className="quarantine-cell">
                        <span className="telemetry-num text-muted">{b.imagesQuarantined}</span>
                        <button
                          className="restore-btn"
                          title="Restore 10 sample frames from quarantine"
                          onClick={() => handleRestoreQuarantined(b.batchId)}
                        >
                          <RotateCcw size={10} />
                          <span>Restore</span>
                        </button>
                      </div>
                    </td>
                    <td className="telemetry-num text-info font-bold">{b.imagesRequiringReview}</td>
                    <td>
                      <span className="badge badge-amber telemetry-num">
                        {b.tigersDetected} Detections
                      </span>
                    </td>
                    <td className="progress-cell">
                      <div className="progress-bar-container">
                        <div
                          className={`progress-bar-fill ${b.status === 'COMPLETED' ? 'completed' : 'processing'}`}
                          style={{ width: `${b.progressPercent}%` }}
                        />
                      </div>
                      <span className="telemetry-num progress-pct">{b.progressPercent}%</span>
                    </td>
                    <td>
                      {b.status === 'COMPLETED' ? (
                        <span className="badge badge-forest">Completed</span>
                      ) : (
                        <span className="badge badge-blue">
                          <RefreshCw size={10} className="spin-icon" /> {b.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="quarantine-audit-view">
            <div className="audit-header">
              <Archive size={16} className="text-forest" />
              <span>Archived Blank & Vegetation Captures (Reversible Storage)</span>
            </div>
            <div className="quarantine-cards-grid">
              {batches.map(b => (
                <div key={b.batchId} className="quarantine-card">
                  <div className="q-head">
                    <span className="font-mono font-bold">{b.batchId}</span>
                    <span className="badge badge-subtle">{b.imagesQuarantined} Frames Quarantined</span>
                  </div>
                  <div className="q-station">{b.trapStation}</div>
                  <div className="q-details">
                    <div>Reason: Vegetation sway & heat triggers without fauna pixels</div>
                    <div>Integrity: 100% Exif preserved in cold archive</div>
                  </div>
                  <button
                    className="tt-btn tt-btn-secondary btn-sm"
                    onClick={() => handleRestoreQuarantined(b.batchId)}
                  >
                    <RotateCcw size={12} />
                    <span>Restore Samples to Review Queue</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .processing-page {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .banner-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .feedback-toast {
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

        .metrics-summary-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }

        @media (max-width: 1200px) {
          .metrics-summary-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 680px) {
          .metrics-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .metric-box {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 12px 14px;
        }

        .m-label {
          font-size: 10.5px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .m-val {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.15;
        }

        .m-sub {
          font-size: 10px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 14px;
        }

        @media (max-width: 900px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
        }

        .upload-card {
          display: flex;
          flex-direction: column;
        }

        .dropzone-box {
          border: 1.5px dashed var(--border-default);
          border-radius: var(--radius-sm);
          background: var(--bg-surface-subtle);
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 12px;
        }

        .dropzone-icon {
          color: var(--color-primary);
          margin-bottom: 6px;
        }

        .dropzone-main-text {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .dropzone-sub-text {
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .dropzone-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .upload-options-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @media (max-width: 640px) {
          .upload-options-row {
            grid-template-columns: 1fr;
          }
        }

        .option-field {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .field-label {
          font-size: 11px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .quarantine-policy-card {
          display: flex;
          flex-direction: column;
        }

        .policy-items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .policy-item {
          display: flex;
          gap: 10px;
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          font-size: 12px;
        }

        .policy-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .policy-item strong {
          color: var(--text-primary);
          font-size: 11.5px;
        }

        .policy-item p {
          margin-top: 2px;
          font-size: 11px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .view-toggle-pills {
          display: flex;
          gap: 4px;
          background: var(--bg-surface-subtle);
          padding: 3px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-default);
        }

        .pill-btn {
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .pill-btn.active {
          background: #FFFFFF;
          color: var(--color-primary);
          font-weight: 600;
          border: 1px solid var(--border-default);
        }

        .batches-table-wrapper {
          overflow-x: auto;
        }

        .batch-id-tag {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          color: var(--color-primary);
        }

        .station-title {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 12px;
        }

        .time-sub-tag {
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .uploader-cell {
          font-size: 11.5px;
          color: var(--text-secondary);
        }

        .quarantine-cell {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .restore-btn {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 9.5px;
          padding: 1px 4px;
          background: #F0F4F1;
          border: 1px solid #DCE5DF;
          border-radius: 2px;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .restore-btn:hover {
          background: #E8F2EC;
          color: var(--color-primary);
          border-color: var(--border-active);
        }

        .progress-cell {
          min-width: 110px;
        }

        .progress-bar-container {
          width: 100%;
          height: 6px;
          background: var(--bg-surface-subtle);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: 2px;
          border: 1px solid var(--border-subtle);
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 300ms ease;
        }

        .progress-bar-fill.completed {
          background: var(--color-primary);
        }

        .progress-bar-fill.processing {
          background: #0284C7;
        }

        .progress-pct {
          font-size: 10px;
          color: var(--text-muted);
        }

        .spin-icon {
          animation: spin 1.5s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        .quarantine-audit-view {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 4px;
        }

        .audit-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .quarantine-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        @media (max-width: 900px) {
          .quarantine-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        .quarantine-card {
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .q-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .q-station {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .q-details {
          font-size: 11px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .text-forest { color: var(--color-primary); }
        .text-amber { color: #9A3412; }
        .text-info { color: #0284C7; }
        .font-bold { font-weight: 600; }
        .font-mono { font-family: var(--font-mono); }
      `}</style>
    </div>
  );
};
export default CameraProcessing;
