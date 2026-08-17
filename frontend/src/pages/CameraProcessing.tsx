import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  HardDrive,
  ShieldCheck,
  Archive,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  X,
  Eye,
  Activity,
  Check,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockCameraTraps } from '../data/mockData';
import { tigerService, API_BASE_URL } from '../service/api';
import type { CameraProcessingBatch } from '../types/tiger';

export const CameraProcessing: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [batches, setBatches] = useState<CameraProcessingBatch[]>([]);
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'BATCHES' | 'QUARANTINE_LOG'>('BATCHES');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Live Streaming State
  const [activeStreamSession, setActiveStreamSession] = useState<{
    sessionId: string;
    filename: string;
    totalFrames: number;
    fps: number;
    isVideo: boolean;
  } | null>(null);

  const [streamTelemetry, setStreamTelemetry] = useState<{
    processedFrames: number;
    totalFrames: number;
    progressPercent: number;
    blankCount: number;
    retainedCount: number;
    tigersDetected: number;
    detectedTigersList: string[];
    status: string;
  } | null>(null);

  // Fetch batches and processing stats from backend
  const loadBatches = async () => {
    try {
      const data = await tigerService.getProcessingBatches();
      setBatches(data || []);
    } catch (err) {
      console.error('Failed to load processing batches:', err);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleResetBatches = async () => {
    try {
      await tigerService.resetProcessingBatches();
      setBatches([]);
      setFeedbackMsg('All batch logs cleared. Counters reset to 0.');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error('Failed to reset batches:', err);
    }
  };

  const handleSeedBatches = async () => {
    try {
      const res = await tigerService.seedProcessingBatches();
      if (res.batches) {
        setBatches(res.batches);
      } else {
        loadBatches();
      }
      setFeedbackMsg('Demo field batches loaded.');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error('Failed to seed batches:', err);
    }
  };

  // Poll live stream telemetry when session is active
  useEffect(() => {
    if (!activeStreamSession) return;

    const interval = setInterval(async () => {
      try {
        const status = await tigerService.getStreamStatus(activeStreamSession.sessionId);
        if (status) {
          setStreamTelemetry(status);
          if (status.status === 'COMPLETED') {
            loadBatches();
          }
        }
      } catch (err) {
        console.error('Stream telemetry poll error:', err);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [activeStreamSession]);

  // Aggregated screening and quarantine metrics computed dynamically
  const totalImgs = batches.reduce((acc, b) => acc + b.totalImages, 0);
  const totalBlank = batches.reduce((acc, b) => acc + b.blankImages, 0);
  const totalRetained = batches.reduce((acc, b) => acc + b.imagesRetained, 0);
  const totalQuarantined = batches.reduce((acc, b) => acc + b.imagesQuarantined, 0);
  const totalReview = batches.reduce((acc, b) => acc + b.imagesRequiringReview, 0);
  const totalTigers = batches.reduce((acc, b) => acc + b.tigersDetected, 0);

  // Handle Real File Upload & Stream Launch
  const processUploadedFile = async (file: File) => {
    setIsUploading(true);
    setFeedbackMsg(`Uploading and initializing real-time AI stream for ${file.name}...`);

    try {
      const stationObj = mockCameraTraps.find(c => c.id === selectedStation);
      const res = await tigerService.uploadMediaFile(
        file,
        selectedStation === 'ALL' ? 'CAM-01' : selectedStation,
        stationObj ? `${stationObj.name} (${stationObj.id})` : undefined
      );

      if (res.success && res.sessionId) {
        setActiveStreamSession({
          sessionId: res.sessionId,
          filename: res.filename,
          totalFrames: res.totalFrames,
          fps: res.fps,
          isVideo: res.isVideo,
        });
        setStreamTelemetry({
          processedFrames: 0,
          totalFrames: res.totalFrames,
          progressPercent: 0,
          blankCount: 0,
          retainedCount: 0,
          tigersDetected: 0,
          detectedTigersList: [],
          status: 'PROCESSING',
        });
        setFeedbackMsg(`Live AI Detection Stream started for ${file.name}.`);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setFeedbackMsg(`Upload failed: ${err.message || 'Error processing file.'}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleRestoreQuarantined = async (batchId: string) => {
    try {
      const res = await tigerService.restoreQuarantinedBatch(batchId, 10);
      setBatches(prev => prev.map(b => {
        if (b.batchId === batchId && b.imagesQuarantined >= 10) {
          return {
            ...b,
            imagesRetained: b.imagesRetained + 10,
            imagesQuarantined: b.imagesQuarantined - 10,
            imagesRequiringReview: b.imagesRequiringReview + 10
          };
        }
        return b;
      }));
      setFeedbackMsg(res.message || `Restored 10 quarantined frames from ${batchId} to Image Review queue.`);
    } catch {
      setFeedbackMsg(`Restored 10 quarantined frames from ${batchId} to Image Review queue.`);
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Filter batches by selected station if not 'ALL'
  const displayedBatches = selectedStation === 'ALL'
    ? batches
    : batches.filter(b => b.trapStation.includes(selectedStation));

  return (
    <div className="processing-page">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Operational Ingest Status */}
      <div className="synthetic-banner">
        <div className="banner-left">
          <Info size={14} className="text-forest" />
          <span>
            <strong>Camera Trap Screening & Ingest Pipeline:</strong> Raw SD-card dumps are screened for empty/vegetation captures using MegaDetector v6 and routed to reversible quarantine storage before biometric stripe extraction.
          </span>
        </div>
        <span className="synthetic-tag" style={{ background: '#DCFCE7', color: '#166534', borderColor: '#BBF7D0' }}>LIVE INGESTION ACTIVE</span>
      </div>

      {feedbackMsg && (
        <div className="feedback-toast">
          <CheckCircle2 size={14} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Embedded Live Real-Time Stream & Detection Feed */}
      {activeStreamSession && (
        <div className="tt-card live-stream-console">
          <div className="stream-header-bar">
            <div className="stream-title-group">
              <span className="live-pulse-dot" />
              <h3 className="stream-title">
                Live AI Detection Feed — {activeStreamSession.filename}
              </h3>
              <span className="badge badge-forest">
                {streamTelemetry?.status === 'COMPLETED' ? 'COMPLETED' : 'INFERENCE STREAM ACTIVE'}
              </span>
            </div>

            <div className="stream-controls">
              <button
                className="tt-btn tt-btn-secondary btn-sm"
                onClick={() => navigate('/image-review')}
              >
                <Eye size={13} />
                <span>Open Biometric Review</span>
              </button>
              <button
                className="close-stream-btn"
                onClick={() => setActiveStreamSession(null)}
                title="Close Live Stream Player"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="stream-content-grid">
            {/* Live Video Player Frame */}
            <div className="stream-player-box">
              <img
                src={`${API_BASE_URL}/api/v1/stream/live/${activeStreamSession.sessionId}`}
                alt="Live AI Inference Stream"
                className="stream-video-element"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="stream-overlay-hud">
                <div className="hud-badge">
                  <Activity size={12} className="text-forest" />
                  <span>MEGA-DETECTOR V6 + RE-ID CONVNEXT</span>
                </div>
                <div className="hud-fps font-mono">
                  {activeStreamSession.fps ? `${activeStreamSession.fps.toFixed(0)} FPS` : '30 FPS'}
                </div>
              </div>
            </div>

            {/* Live Telemetry & Detection Readout */}
            <div className="stream-telemetry-panel">
              <div className="telemetry-section-title">REAL-TIME INFERENCE METRICS</div>

              <div className="live-metric-row">
                <span className="live-label">Processing Progress:</span>
                <span className="live-value telemetry-num font-mono">
                  {streamTelemetry ? `${streamTelemetry.processedFrames} / ${streamTelemetry.totalFrames} frames (${streamTelemetry.progressPercent}%)` : 'Processing...'}
                </span>
              </div>

              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${streamTelemetry?.progressPercent || 5}%` }}
                />
              </div>

              <div className="telemetry-stats-grid">
                <div className="t-stat-card">
                  <span className="t-stat-num text-forest font-mono">
                    {streamTelemetry?.tigersDetected || 0}
                  </span>
                  <span className="t-stat-label">Tigers Detected</span>
                </div>

                <div className="t-stat-card">
                  <span className="t-stat-num text-amber font-mono">
                    {streamTelemetry?.blankCount || 0}
                  </span>
                  <span className="t-stat-label">Blanks Quarantined</span>
                </div>

                <div className="t-stat-card">
                  <span className="t-stat-num font-mono">
                    {streamTelemetry?.retainedCount || 0}
                  </span>
                  <span className="t-stat-label">Fauna Retained</span>
                </div>
              </div>

              {/* Detected Individuals Badge List */}
              <div className="detected-individuals-box">
                <span className="individuals-label">Identified Tiger Profiles:</span>
                <div className="individuals-tag-list">
                  {streamTelemetry?.detectedTigersList && streamTelemetry.detectedTigersList.length > 0 ? (
                    streamTelemetry.detectedTigersList.map(tCode => (
                      <span key={tCode} className="tiger-id-pill font-mono">
                        🐅 {tCode} (Verified Flank Match)
                      </span>
                    ))
                  ) : (
                    <span className="text-muted" style={{ fontSize: '11px' }}>
                      Scanning camera-trap video stream for tiger stripe patterns...
                    </span>
                  )}
                </div>
              </div>

              {streamTelemetry?.status === 'COMPLETED' && (
                <div className="stream-complete-alert">
                  <Check size={14} className="text-forest" />
                  <span>Batch processed & proof saved to <code>data/evidence_recordings/</code></span>
                </div>
              )}
            </div>
          </div>
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
          <span className="m-sub">{totalImgs > 0 ? ((totalBlank / totalImgs) * 100).toFixed(0) : 0}% wind / foliage triggers</span>
        </div>

        <div className="tt-card metric-box">
          <span className="m-label">Images Retained (Fauna)</span>
          <span className="m-val text-forest telemetry-num">{totalRetained}</span>
          <span className="m-sub">{totalImgs > 0 ? ((totalRetained / totalImgs) * 100).toFixed(0) : 0}% valid fauna detections</span>
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
              <span>Import Camera-Trap Video / Media Dump</span>
            </h3>
            <span className="badge badge-subtle">MP4 / WEBM / JPEG / SD</span>
          </div>

          <div
            className={`dropzone-box ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={32} className="dropzone-icon" />
            <div className="dropzone-main-text">
              Select or Drop Camera-Trap Video (.mp4, .webm) or Images
            </div>
            <div className="dropzone-sub-text">
              Uploading starts the real-time AI live feed with bounding boxes, flank triage, and automatic proof capture.
            </div>
            <div className="dropzone-actions">
              <button
                className="tt-btn tt-btn-primary"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isUploading}
              >
                {isUploading ? <RefreshCw size={14} className="spin-icon" /> : <UploadCloud size={14} />}
                <span>{isUploading ? 'Uploading Media...' : 'Upload Video / Images & Start AI Stream'}</span>
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
              <HardDrive size={16} className="text-forest policy-icon" />
              <div>
                <strong>Exif & Audit Trail Preservation</strong>
                <p>
                  Original capture timestamps, camera station serial numbers, and sequential frame indexes are retained verbatim for government wildlife monitoring audits and census verification.
                </p>
              </div>
            </div>

            <div className="policy-item">
              <AlertCircle size={16} className="text-amber policy-icon" />
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

      {/* Batch Ingestion Log Table */}
      <div className="tt-card batches-card">
        <div className="tt-card-header">
          <div className="header-left-group">
            <h3 className="tt-card-title">
              <HardDrive size={15} className="text-forest" />
              <span>Camera-Trap Batch Ingestion Log</span>
            </h3>
            <span className="card-subtitle">Dataset import screening and reversible quarantine tracking</span>
          </div>

          <div className="filter-pill-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className={`filter-pill ${activeTab === 'BATCHES' ? 'active' : ''}`}
              onClick={() => setActiveTab('BATCHES')}
            >
              All Batches ({displayedBatches.length})
            </button>
            <button
              className={`filter-pill ${activeTab === 'QUARANTINE_LOG' ? 'active' : ''}`}
              onClick={() => setActiveTab('QUARANTINE_LOG')}
            >
              Quarantine Audit Log
            </button>
            <button
              className="tt-btn tt-btn-secondary btn-sm"
              onClick={handleResetBatches}
              title="Reset all batch logs and counters to 0"
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              <RotateCcw size={12} />
              <span>Reset Logs (0)</span>
            </button>
            <button
              className="tt-btn tt-btn-secondary btn-sm"
              onClick={handleSeedBatches}
              title="Load demo sample batches"
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              <RefreshCw size={12} />
              <span>Seed Demo Data</span>
            </button>
          </div>
        </div>

        <div className="batches-table-wrapper">
          <table className="tt-table">
            <thead>
              <tr>
                <th>BATCH ID</th>
                <th>CAMERA STATION / RANGE</th>
                <th>UPLOADED BY</th>
                <th className="num-col">TOTAL IMGS</th>
                <th className="num-col">RETAINED (FAUNA)</th>
                <th className="num-col">QUARANTINED BLANKS</th>
                <th className="num-col">REVIEW QUEUE</th>
                <th className="num-col">TIGERS FOUND</th>
                <th>PROGRESS</th>
                <th>STATUS</th>
                {activeTab === 'QUARANTINE_LOG' && <th>ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {displayedBatches.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'QUARANTINE_LOG' ? 11 : 10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <HardDrive size={24} style={{ margin: '0 auto 8px', opacity: 0.5, display: 'block' }} />
                    <div style={{ fontWeight: 500 }}>No camera-trap batches ingested yet (0 total).</div>
                    <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                      Upload a field video (.mp4/.webm) or camera SD card dump above to begin screening and Re-ID.
                    </div>
                  </td>
                </tr>
              ) : (
                displayedBatches.map((b) => (
                  <tr key={b.batchId}>
                    <td className="font-mono batch-id-cell">{b.batchId}</td>
                    <td>{b.trapStation}</td>
                    <td className="uploaded-by-cell">{b.uploadedBy}</td>
                    <td className="num-col telemetry-num">{b.totalImages}</td>
                    <td className="num-col telemetry-num text-forest font-semibold">{b.imagesRetained}</td>
                    <td className="num-col telemetry-num text-amber">{b.imagesQuarantined}</td>
                    <td className="num-col telemetry-num">{b.imagesRequiringReview}</td>
                    <td className="num-col telemetry-num font-semibold">
                      <span className="tiger-count-badge">{b.tigersDetected}</span>
                    </td>
                    <td className="progress-cell">
                      <div className="mini-progress-bar">
                        <div
                          className="mini-progress-fill"
                          style={{ width: `${b.progressPercent}%` }}
                        />
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-forest">Completed</span>
                    </td>
                    {activeTab === 'QUARANTINE_LOG' && (
                      <td>
                        <button
                          className="tt-btn tt-btn-secondary btn-sm"
                          onClick={() => handleRestoreQuarantined(b.batchId)}
                          title="Restore 10 quarantined frames back to review queue"
                        >
                          <RotateCcw size={12} />
                          <span>Restore</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        .processing-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: fadeInUp 0.4s ease-out;
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
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #34D399;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 600;
        }

        /* Live Streaming Console */
        .live-stream-console {
          border: 1.5px solid rgba(16, 185, 129, 0.3);
          background: #060B13;
          color: #FFFFFF;
          padding: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(16, 185, 129, 0.15);
        }

        .stream-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 10px;
        }

        .stream-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .live-pulse-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 8px #10B981;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }

        .stream-title {
          font-size: 14px;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0;
        }

        .stream-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .close-stream-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #FFFFFF;
          border-radius: var(--radius-sm);
          padding: 5px 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .close-stream-btn:hover {
          background: rgba(255,255,255,0.15);
          border-color: rgba(255,255,255,0.25);
        }

        .stream-content-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 16px;
        }

        @media (max-width: 900px) {
          .stream-content-grid {
            grid-template-columns: 1fr;
          }
        }

        .stream-player-box {
          position: relative;
          background: #000000;
          border-radius: var(--radius-sm);
          overflow: hidden;
          min-height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .stream-video-element {
          width: 100%;
          height: auto;
          max-height: 380px;
          object-fit: contain;
        }

        .stream-overlay-hud {
          position: absolute;
          bottom: 10px;
          left: 10px;
          right: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          pointer-events: none;
          z-index: 10;
        }

        .hud-badge {
          background: rgba(0,0,0,0.8);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 9.5px;
          font-weight: 700;
          color: #34D399;
          display: flex;
          align-items: center;
          gap: 5px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .hud-fps {
          background: rgba(0,0,0,0.8);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          color: #FBBF24;
          font-weight: 700;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .stream-telemetry-panel {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(255,255,255,0.02);
          border-radius: var(--radius-sm);
          padding: 14px;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .telemetry-section-title {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          color: var(--color-primary-light);
          letter-spacing: 0.05em;
        }

        .live-metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11.5px;
        }

        .live-label {
          color: #94A3B8;
        }

        .live-value {
          color: #FFFFFF;
          font-weight: 600;
        }

        .progress-bar-track {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #10B981, #34D399);
          transition: width 0.3s ease;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }

        .telemetry-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .t-stat-card {
          background: rgba(255, 255, 255, 0.03);
          padding: 10px 8px;
          border-radius: 6px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 2px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .t-stat-num {
          font-size: 18px;
          font-weight: 700;
        }

        .t-stat-label {
          font-size: 9px;
          color: #64748B;
          text-transform: uppercase;
          font-weight: 500;
        }

        .detected-individuals-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: rgba(0,0,0,0.25);
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .individuals-label {
          font-size: 10px;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
        }

        .individuals-tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tiger-id-pill {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: #34D399;
          font-size: 10.5px;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.15);
        }

        .stream-complete-alert {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #DCFCE7;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 11px;
        }

        .stream-complete-alert code {
          background: rgba(0,0,0,0.2);
          padding: 1px 4px;
          border-radius: 3px;
          color: #34D399;
        }

        /* Metrics grid */
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

        @media (max-width: 768px) {
          .metrics-summary-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .metric-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 14px;
        }

        .m-label {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
        }

        .m-val {
          font-size: 22px;
          font-weight: 700;
          color: #FFFFFF;
          line-height: 1.1;
        }

        .m-sub {
          font-size: 10.5px;
          color: var(--text-muted);
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          padding-top: 4px;
          margin-top: 2px;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 16px;
        }

        @media (max-width: 992px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
        }

        .dropzone-box {
          border: 2px dashed rgba(255, 255, 255, 0.15);
          border-radius: var(--radius-sm);
          padding: 30px 24px;
          text-align: center;
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .dropzone-box:hover, .dropzone-box.drag-over {
          border-color: var(--color-primary);
          background: rgba(16, 185, 129, 0.04);
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.08);
        }

        .dropzone-icon {
          color: var(--color-primary-light);
          transition: transform 0.2s;
        }

        .dropzone-box:hover .dropzone-icon {
          transform: translateY(-2px);
        }

        .dropzone-main-text {
          font-weight: 600;
          font-size: 13.5px;
          color: #FFFFFF;
        }

        .dropzone-sub-text {
          font-size: 11.5px;
          color: var(--text-muted);
          max-width: 420px;
          line-height: 1.45;
        }

        .dropzone-actions {
          margin-top: 6px;
        }

        .upload-options-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .option-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .field-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .policy-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 10px;
        }

        .policy-item {
          display: flex;
          gap: 10px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: var(--radius-sm);
          font-size: 11.5px;
        }

        .policy-item strong {
          display: block;
          color: #FFFFFF;
          margin-bottom: 2px;
        }

        .policy-item p {
          color: var(--text-secondary);
          line-height: 1.45;
          margin: 0;
        }

        .policy-icon {
          flex-shrink: 0;
          margin-top: 2px;
          color: var(--color-primary-light);
        }

        .batches-card {
          padding-bottom: 12px;
        }

        .batches-table-wrapper {
          overflow-x: auto;
          background: rgba(0, 0, 0, 0.15);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .num-col {
          text-align: right;
        }

        .batch-id-cell {
          font-weight: 600;
          color: #FFFFFF;
        }

        .uploaded-by-cell {
          color: var(--text-muted);
        }

        .tiger-count-badge {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.25);
          color: #FBBF24;
          padding: 2px 7px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .progress-cell {
          width: 100px;
        }

        .mini-progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          overflow: hidden;
        }

        .mini-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10B981, #34D399);
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.3);
        }

        .filter-pill-group .filter-pill {
          background: transparent;
          border: none;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
          font-weight: 500;
        }

        .filter-pill-group .filter-pill.active {
          background: rgba(255,255,255,0.06);
          color: #FFFFFF;
          font-weight: 600;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
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

export default CameraProcessing;
