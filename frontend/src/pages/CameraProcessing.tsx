import React, { useState } from 'react';
import {
  UploadCloud,
  FileCheck,
  Clock,
  Filter,
  HardDrive,
  Layers,
  ShieldCheck,
  Archive,
  AlertCircle,
  Eye
} from 'lucide-react';
import { mockBatches, mockCameraTraps } from '../data/mockData';

export const CameraProcessing: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState('ALL');

  // Aggregated quarantine and screening metrics across active batches
  const totalImgs = mockBatches.reduce((acc, b) => acc + b.totalImages, 0);
  const totalBlank = mockBatches.reduce((acc, b) => acc + b.blankImages, 0);
  const totalRetained = mockBatches.reduce((acc, b) => acc + b.imagesRetained, 0);
  const totalQuarantined = mockBatches.reduce((acc, b) => acc + b.imagesQuarantined, 0);
  const totalReview = mockBatches.reduce((acc, b) => acc + b.imagesRequiringReview, 0);
  const totalTigers = mockBatches.reduce((acc, b) => acc + b.tigersDetected, 0);

  return (
    <div className="processing-page">
      {/* Synthetic Processing Notice */}
      <div className="synthetic-banner">
        <div className="banner-text">
          <strong>Camera Trap Ingest Pipeline:</strong> Raw SD-card dumps are screened for empty/vegetation captures and routed to reversible quarantine storage before stripe extraction.
        </div>
        <span className="synthetic-tag">PROTOTYPE INGEST PIPELINE</span>
      </div>

      {/* Overview Screening Metrics Cards */}
      <div className="metrics-summary-grid">
        <div className="tt-card metric-box">
          <span className="m-label">Total Ingested Images</span>
          <span className="m-val telemetry-num">{totalImgs}</span>
          <span className="m-sub">Across 3 field batches</span>
        </div>

        <div className="tt-card metric-box">
          <span className="m-label">Images Retained (Fauna)</span>
          <span className="m-val text-forest telemetry-num">{totalRetained}</span>
          <span className="m-sub">{((totalRetained / totalImgs) * 100).toFixed(0)}% valid detections</span>
        </div>

        <div className="tt-card metric-box">
          <span className="m-label">Quarantined Blanks (Reversible)</span>
          <span className="m-val text-amber telemetry-num">{totalQuarantined}</span>
          <span className="m-sub">Preserved in archive, no permanent deletion</span>
        </div>

        <div className="tt-card metric-box">
          <span className="m-label">Requiring Biologist Review</span>
          <span className="m-val text-info telemetry-num">{totalReview}</span>
          <span className="m-sub">Partial / low-light flank frames</span>
        </div>

        <div className="tt-card metric-box">
          <span className="m-label">Tiger Detections Extracted</span>
          <span className="m-val text-primary-highlight telemetry-num">{totalTigers}</span>
          <span className="m-sub">Candidate matches populated</span>
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
              Exif metadata, camera ID headers, and camera timestamps will be indexed.
            </div>
            <div className="dropzone-actions">
              <button className="tt-btn tt-btn-primary">
                <span>Select Folder from SD Card</span>
              </button>
              <button className="tt-btn tt-btn-secondary">
                <span>Select Archive (.ZIP)</span>
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
              <span>Screening & Safe Quarantine Policy</span>
            </h3>
            <span className="badge badge-forest">Audit-Safe Storage</span>
          </div>

          <div className="policy-items-list">
            <div className="policy-item">
              <ShieldCheck size={16} className="text-forest policy-icon" />
              <div>
                <strong>Reversible Quarantine Model</strong>
                <p>
                  Images classified as empty blanks (wind triggers, vegetation movement) are placed in a quarantined folder with metadata tags. They are never permanently deleted and can be reviewed or restored at any point.
                </p>
              </div>
            </div>

            <div className="policy-item">
              <FileCheck size={16} className="text-forest policy-icon" />
              <div>
                <strong>Metadata Preservation</strong>
                <p>
                  Original capture timestamps, camera station serial numbers, and sequential frame indexes are retained verbatim for government wildlife census audits.
                </p>
              </div>
            </div>

            <div className="policy-item">
              <AlertCircle size={16} className="text-warning policy-icon" />
              <div>
                <strong>Low-Confidence Frame Triage</strong>
                <p>
                  Obscured captures or partial flanks are tagged for human biologist inspection in the Image Review queue rather than auto-discarded.
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
              <span>Batch Screening & Ingest Queues</span>
            </h3>
            <p className="tt-card-subtitle">Dataset import progress by camera station and beat</p>
          </div>
        </div>

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
                <th>Tigers Found</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockBatches.map((b) => (
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
                  <td className="telemetry-num text-muted">{b.imagesQuarantined} (Reversible)</td>
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
                      <span className="badge badge-blue">{b.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .processing-page {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .metrics-summary-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }

        @media (max-width: 1100px) {
          .metrics-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .metrics-summary-grid {
            grid-template-columns: 1fr;
          }
        }

        .metric-box {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 14px;
        }

        .m-label {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .m-val {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .m-sub {
          font-size: 10.5px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .text-forest { color: var(--color-primary); }
        .text-amber { color: #B45309; }
        .text-info { color: #0284C7; }
        .text-primary-highlight { color: #15803D; font-weight: 700; }
        .font-bold { font-weight: 600; }

        .dropzone-box {
          border: 1.5px dashed var(--border-default);
          border-radius: var(--radius-sm);
          background: var(--bg-surface-subtle);
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 14px;
        }

        .dropzone-icon {
          color: var(--color-primary);
          margin-bottom: 8px;
        }

        .dropzone-main-text {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 3px;
        }

        .dropzone-sub-text {
          font-size: 11.5px;
          color: var(--text-muted);
          margin-bottom: 14px;
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
          gap: 12px;
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
          font-size: 12px;
        }

        .policy-item p {
          margin-top: 2px;
          font-size: 11px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .batch-id-tag {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          color: var(--text-primary);
          background: var(--bg-surface-subtle);
          padding: 1px 5px;
          border-radius: 3px;
          border: 1px solid var(--border-default);
        }

        .station-title {
          font-weight: 600;
          color: var(--text-primary);
        }

        .time-sub-tag {
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .uploader-cell {
          font-size: 11.5px;
        }

        .progress-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 110px;
        }

        .progress-bar-container {
          flex: 1;
          height: 5px;
          background: var(--border-default);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 3px;
        }

        .progress-bar-fill.completed {
          background: var(--color-primary);
        }

        .progress-bar-fill.processing {
          background: #3B82F6;
        }

        .progress-pct {
          font-size: 10.5px;
          color: var(--text-muted);
          min-width: 26px;
        }
      `}</style>
    </div>
  );
};
export default CameraProcessing;
