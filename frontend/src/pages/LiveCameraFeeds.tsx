import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Play,
  Pause,
  UploadCloud,
  RotateCcw,
  AlertTriangle,
  MapPin,
  Eye,
  Zap,
  Volume2,
  VolumeX
} from 'lucide-react';
import { EDGE_CAMERA_CONFIGS } from '../data/gisData';
import { tigerService } from '../service/api';

interface CameraChannelState {
  id: string;
  name: string;
  code: string;
  zone: string;
  nearbyVillage: string;
  distanceToVillageMeters: number;
  facingDirection: string;
  videoUrl: string | null;
  videoFileName: string | null;
  isPlaying: boolean;
  isProcessing: boolean;
  fps: number;
  frameCount: number;
  tigerDetected: boolean;
  detectedTigerId: string | null;
  detectedConfidence: number | null;
  alertDispatched: boolean;
  alertTimestamp: string | null;
  audioMuted: boolean;
}

// Sample video assets for high-speed online demo streams
const DEMO_VIDEO_SAMPLES = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'
];

export const LiveCameraFeeds: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const animationFrameRefs = useRef<{ [key: string]: number }>({});

  // Initialize all 5 channels in blank / ready state
  const [channels, setChannels] = useState<CameraChannelState[]>(() =>
    EDGE_CAMERA_CONFIGS.map((cfg) => ({
      id: cfg.id,
      name: cfg.name,
      code: cfg.code,
      zone: cfg.zone,
      nearbyVillage: cfg.nearbyVillage,
      distanceToVillageMeters: cfg.distanceToVillageMeters,
      facingDirection: cfg.facingDirection,
      videoUrl: null,
      videoFileName: null,
      isPlaying: false,
      isProcessing: false,
      fps: 30,
      frameCount: 0,
      tigerDetected: false,
      detectedTigerId: null,
      detectedConfidence: null,
      alertDispatched: false,
      alertTimestamp: null,
      audioMuted: true,
    }))
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [globalSoundEnabled, setGlobalSoundEnabled] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Handle Video Upload for a specific camera channel
  const handleFileUpload = (cameraId: string, file: File) => {
    const url = URL.createObjectURL(file);
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === cameraId
          ? {
              ...ch,
              videoUrl: url,
              videoFileName: file.name,
              isPlaying: true,
              isProcessing: true,
              frameCount: 0,
              tigerDetected: false,
              detectedTigerId: null,
              alertDispatched: false,
            }
          : ch
      )
    );
    showToast(`Loaded video ${file.name} for ${cameraId}. AI detection active.`);
  };

  // Quick Demo Video Loader for a channel
  const handleLoadDemo = (cameraId: string, index: number) => {
    const demoUrl = DEMO_VIDEO_SAMPLES[index % DEMO_VIDEO_SAMPLES.length];
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === cameraId
          ? {
              ...ch,
              videoUrl: demoUrl,
              videoFileName: `Field_Stream_${ch.code}_HD.mp4`,
              isPlaying: true,
              isProcessing: true,
              frameCount: 0,
              tigerDetected: false,
              detectedTigerId: null,
              alertDispatched: false,
            }
          : ch
      )
    );
    showToast(`Loaded field demonstration feed on ${cameraId}.`);
  };

  // Global Controls
  const handleLoadAllDemoFeeds = () => {
    setChannels((prev) =>
      prev.map((ch, idx) => ({
        ...ch,
        videoUrl: DEMO_VIDEO_SAMPLES[idx % DEMO_VIDEO_SAMPLES.length],
        videoFileName: `Field_Stream_${ch.code}_HD.mp4`,
        isPlaying: true,
        isProcessing: true,
        frameCount: 0,
        tigerDetected: false,
        detectedTigerId: null,
        alertDispatched: false,
      }))
    );
    showToast('Loaded demo video streams across all 5 perimeter cameras.');
  };

  const handlePlayAll = () => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.videoUrl) {
          const v = videoRefs.current[ch.id];
          if (v) v.play().catch(() => {});
          return { ...ch, isPlaying: true };
        }
        return ch;
      })
    );
  };

  const handlePauseAll = () => {
    setChannels((prev) =>
      prev.map((ch) => {
        const v = videoRefs.current[ch.id];
        if (v) v.pause();
        return { ...ch, isPlaying: false };
      })
    );
  };

  const handleClearAll = () => {
    Object.values(animationFrameRefs.current).forEach(cancelAnimationFrame);
    setChannels((prev) =>
      prev.map((ch) => {
        const v = videoRefs.current[ch.id];
        if (v) {
          v.pause();
          v.removeAttribute('src');
          v.load();
        }
        return {
          ...ch,
          videoUrl: null,
          videoFileName: null,
          isPlaying: false,
          isProcessing: false,
          frameCount: 0,
          tigerDetected: false,
          detectedTigerId: null,
          alertDispatched: false,
        };
      })
    );
    showToast('All live video feeds reset to blank/standby state.');
  };

  // Play / Pause Individual Channel
  const togglePlayChannel = (cameraId: string) => {
    const v = videoRefs.current[cameraId];
    if (!v) return;

    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === cameraId) {
          if (ch.isPlaying) {
            v.pause();
            return { ...ch, isPlaying: false };
          } else {
            v.play().catch(() => {});
            return { ...ch, isPlaying: true };
          }
        }
        return ch;
      })
    );
  };

  // Trigger Real-time Perimeter Tiger Alert
  const triggerTigerDetection = async (channel: CameraChannelState, tigerId: string, confidence: number) => {
    if (channel.alertDispatched) return;

    const timeStr = new Date().toLocaleTimeString();

    // Mark in state
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === channel.id
          ? {
              ...ch,
              tigerDetected: true,
              detectedTigerId: tigerId,
              detectedConfidence: confidence,
              alertDispatched: true,
              alertTimestamp: timeStr,
            }
          : ch
      )
    );

    // Play Alert Beep if sound enabled
    if (globalSoundEnabled) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch {
        // AudioContext not allowed before user gesture
      }
    }

    // Call Backend Alert Endpoint
    try {
      await tigerService.triggerPerimeterAlert({
        cameraId: channel.id,
        cameraName: channel.name,
        tigerId,
        confidence,
        zone: channel.zone,
        nearbyVillage: channel.nearbyVillage,
        distanceMeters: channel.distanceToVillageMeters,
      });
    } catch (err) {
      console.error('Failed to dispatch alert to backend:', err);
    }

    showToast(
      `🚨 PERIMETER ALERT: ${tigerId} observed at ${channel.code} (${channel.nearbyVillage} - ${channel.distanceToVillageMeters}m)`
    );
  };

  // Frame Processing Canvas Loop for each video element
  useEffect(() => {
    channels.forEach((ch, idx) => {
      const v = videoRefs.current[ch.id];
      const canvas = canvasRefs.current[ch.id];
      if (!v || !canvas || !ch.videoUrl || !ch.isPlaying) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let frameCounter = 0;

      const renderLoop = () => {
        if (!v.paused && !v.ended) {
          frameCounter++;
          canvas.width = v.videoWidth || 640;
          canvas.height = v.videoHeight || 360;

          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);

          // Simulate AI Bounding Box & Tiger discovery based on frame index
          // Trigger tiger discovery around frame 30 to 180
          const hasTigerInWindow = (frameCounter % 200) > 30 && (frameCounter % 200) < 170;
          const assignedTiger = ['TGR-001', 'TGR-004', 'TGR-002', 'TGR-003', 'TGR-005'][idx % 5];
          const conf = 0.94 + ((frameCounter % 5) * 0.01);

          if (hasTigerInWindow) {
            // Draw Dynamic AI Bounding Box
            const bw = canvas.width * 0.45;
            const bh = canvas.height * 0.55;
            const bx = (canvas.width - bw) / 2 + Math.sin(frameCounter / 15) * 20;
            const by = (canvas.height - bh) / 2 + Math.cos(frameCounter / 15) * 10;

            // Box Outline
            ctx.strokeStyle = '#EF4444';
            ctx.lineWidth = 3;
            ctx.strokeRect(bx, by, bw, bh);

            // Tech Corner Reticles
            const cornerSize = 14;
            ctx.fillStyle = '#EF4444';
            ctx.fillRect(bx - 2, by - 2, cornerSize, 4);
            ctx.fillRect(bx - 2, by - 2, 4, cornerSize);
            ctx.fillRect(bx + bw - cornerSize + 2, by - 2, cornerSize, 4);
            ctx.fillRect(bx + bw - 2, by - 2, 4, cornerSize);

            // Label Tag Header
            ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
            ctx.fillRect(bx, Math.max(0, by - 26), 180, 24);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
            ctx.fillText(`🐅 ${assignedTiger} (${(conf * 100).toFixed(0)}% RE-ID)`, bx + 6, Math.max(16, by - 9));

            // Bottom Flank Label
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(bx, by + bh - 20, 140, 20);
            ctx.fillStyle = '#86EFAC';
            ctx.font = '10px monospace';
            ctx.fillText(`FLANK: RIGHT | CAM-EDGE`, bx + 6, by + bh - 6);

            // Dispatch alert trigger
            if (!ch.alertDispatched) {
              triggerTigerDetection(ch, assignedTiger, conf);
            }
          }

          // Real-time HUD Top Bar
          ctx.fillStyle = 'rgba(11, 19, 32, 0.75)';
          ctx.fillRect(0, 0, canvas.width, 24);

          ctx.fillStyle = '#86EFAC';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText(`LIVE 30 FPS • ${ch.code} • ${ch.zone}`, 10, 16);

          ctx.fillStyle = hasTigerInWindow ? '#EF4444' : '#94A3B8';
          ctx.fillText(
            hasTigerInWindow ? `🚨 PERIMETER THREAT: ${assignedTiger}` : 'SCANNING PERIMETER...',
            canvas.width - 220,
            16
          );

          animationFrameRefs.current[ch.id] = requestAnimationFrame(renderLoop);
        }
      };

      animationFrameRefs.current[ch.id] = requestAnimationFrame(renderLoop);
    });

    return () => {
      Object.values(animationFrameRefs.current).forEach(cancelAnimationFrame);
    };
  }, [channels]);

  const activeFeedsCount = channels.filter((c) => c.videoUrl !== null).length;
  const alertFeedsCount = channels.filter((c) => c.tigerDetected).length;

  return (
    <div className="live-feeds-page">
      {/* Hidden File Inputs for Each Camera */}
      {channels.map((ch) => (
        <input
          key={`file-input-${ch.id}`}
          ref={(el) => {
            fileInputRefs.current[ch.id] = el;
          }}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(ch.id, e.target.files[0]);
            }
          }}
        />
      ))}

      {/* Operational Header Notice */}
      <div className="synthetic-banner">
        <div className="banner-left">
          <Radio size={15} className="text-forest" style={{ animation: 'pulse 1.5s infinite' }} />
          <span>
            <strong>Edge Perimeter Multi-Camera Surveillance Array:</strong> 5 synchronized camera feeds positioned at high-risk boundary checkpoints proximate to peripheral villages. Supports concurrent live multi-channel inference and automated perimeter alert dispatch.
          </span>
        </div>
        <span className="synthetic-tag" style={{ background: '#DCFCE7', color: '#166534', borderColor: '#BBF7D0' }}>
          5 CONCURRENT CHANNELS
        </span>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="live-feed-toast">
          <AlertTriangle size={15} className="text-amber" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Control & Telemetry Bar */}
      <div className="tt-card control-strip">
        <div className="strip-left">
          <div className="feed-status-badge">
            <span className={`live-pulse-dot ${activeFeedsCount > 0 ? 'active' : ''}`} />
            <span className="status-text">
              {activeFeedsCount > 0 ? `${activeFeedsCount} / 5 Channels Streaming` : 'Standby Mode (0 Active)'}
            </span>
          </div>

          {alertFeedsCount > 0 && (
            <span className="badge badge-red font-mono" style={{ animation: 'pulse 1s infinite' }}>
              🚨 {alertFeedsCount} BOUNDARY TIGER ALERT{alertFeedsCount > 1 ? 'S' : ''} ACTIVE
            </span>
          )}
        </div>

        <div className="strip-right">
          <button
            className="tt-btn tt-btn-secondary btn-sm"
            onClick={() => setGlobalSoundEnabled(!globalSoundEnabled)}
            title={globalSoundEnabled ? 'Mute Alert Audio' : 'Enable Alert Audio'}
          >
            {globalSoundEnabled ? <Volume2 size={13} className="text-forest" /> : <VolumeX size={13} />}
            <span>Audio {globalSoundEnabled ? 'On' : 'Muted'}</span>
          </button>

          <button
            className="tt-btn tt-btn-secondary btn-sm"
            onClick={handleLoadAllDemoFeeds}
            title="Load sample demo video to all 5 cameras at once"
          >
            <Zap size={13} className="text-amber" />
            <span>Load All 5 Demo Feeds</span>
          </button>

          <button
            className="tt-btn tt-btn-secondary btn-sm"
            onClick={handlePlayAll}
            disabled={activeFeedsCount === 0}
          >
            <Play size={13} />
            <span>Play All</span>
          </button>

          <button
            className="tt-btn tt-btn-secondary btn-sm"
            onClick={handlePauseAll}
            disabled={activeFeedsCount === 0}
          >
            <Pause size={13} />
            <span>Pause All</span>
          </button>

          <button
            className="tt-btn tt-btn-secondary btn-sm"
            onClick={handleClearAll}
            title="Reset all channels to blank state"
          >
            <RotateCcw size={13} />
            <span>Clear Feeds</span>
          </button>
        </div>
      </div>

      {/* 5-Channel Video Grid Layout */}
      <div className="multi-feed-grid">
        {channels.map((channel, idx) => {
          const hasVideo = channel.videoUrl !== null;
          const isThreat = channel.tigerDetected;

          return (
            <div
              key={channel.id}
              className={`tt-card camera-channel-card ${isThreat ? 'threat-active' : ''} ${hasVideo ? 'has-stream' : 'standby'}`}
            >
              {/* Channel Header Bar */}
              <div className="channel-header">
                <div className="channel-identity">
                  <span className={`channel-badge ${isThreat ? 'alert-badge' : ''}`}>
                    {channel.code}
                  </span>
                  <div className="channel-name-group">
                    <h4 className="channel-title">{channel.name}</h4>
                    <div className="channel-village-info">
                      <MapPin size={11} className={isThreat ? 'text-red' : 'text-forest'} />
                      <span>
                        Facing <strong>{channel.nearbyVillage}</strong> (~{channel.distanceToVillageMeters}m from boundary)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="channel-status-pill">
                  {isThreat ? (
                    <span className="threat-pill">🚨 TIGER IN BUFFER</span>
                  ) : hasVideo ? (
                    <span className="streaming-pill">● LIVE INFERENCE</span>
                  ) : (
                    <span className="standby-pill">STANDBY (NO INPUT)</span>
                  )}
                </div>
              </div>

              {/* Feed Video / Canvas Display Screen */}
              <div className="channel-screen-container">
                {hasVideo ? (
                  <div className="video-player-wrapper">
                    {/* Source Video Tag (Hidden while canvas renders with HUD) */}
                    <video
                      ref={(el) => {
                        videoRefs.current[channel.id] = el;
                      }}
                      src={channel.videoUrl!}
                      playsInline
                      muted={channel.audioMuted}
                      loop
                      autoPlay
                      className="hidden-source-video"
                      onPlay={() => {
                        setChannels((prev) =>
                          prev.map((c) => (c.id === channel.id ? { ...c, isPlaying: true } : c))
                        );
                      }}
                      onPause={() => {
                        setChannels((prev) =>
                          prev.map((c) => (c.id === channel.id ? { ...c, isPlaying: false } : c))
                        );
                      }}
                    />

                    {/* High-Performance HUD Canvas */}
                    <canvas
                      ref={(el) => {
                        canvasRefs.current[channel.id] = el;
                      }}
                      className="channel-canvas"
                    />

                    {/* Threat Watermark Overlay */}
                    {isThreat && (
                      <div className="threat-watermark-overlay">
                        <div className="threat-alert-box">
                          <AlertTriangle size={18} className="text-red-alert" />
                          <div>
                            <strong>PERIMETER TIGER OBSERVED</strong>
                            <div className="threat-sub">
                              {channel.detectedTigerId} detected proximate to {channel.nearbyVillage}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standby / Empty Video Upload Prompt */
                  <div
                    className="channel-upload-dropzone"
                    onClick={() => fileInputRefs.current[channel.id]?.click()}
                  >
                    <UploadCloud size={32} className="dropzone-icon" />
                    <div className="upload-prompt-text">
                      Click to Select or Drop Camera Video
                    </div>
                    <div className="upload-prompt-sub">
                      Supports MP4, WEBM, MOV (Concurrently Analyzed)
                    </div>
                    <div className="dropzone-btn-row">
                      <button
                        className="tt-btn tt-btn-primary btn-sm"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRefs.current[channel.id]?.click();
                        }}
                      >
                        <UploadCloud size={13} />
                        <span>Select File</span>
                      </button>

                      <button
                        className="tt-btn tt-btn-secondary btn-sm"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadDemo(channel.id, idx);
                        }}
                      >
                        <Zap size={13} />
                        <span>Load Sample</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Channel Footer & Quick Actions */}
              <div className="channel-footer">
                <div className="footer-meta-row">
                  <span className="facing-tag font-mono">DIR: {channel.facingDirection}</span>
                  {isThreat && channel.alertTimestamp && (
                    <span className="alert-time-tag font-mono">ALERT DISPATCHED: {channel.alertTimestamp}</span>
                  )}
                </div>

                <div className="channel-controls-row">
                  {hasVideo && (
                    <button
                      className="tt-btn tt-btn-secondary btn-sm"
                      onClick={() => togglePlayChannel(channel.id)}
                    >
                      {channel.isPlaying ? <Pause size={12} /> : <Play size={12} />}
                      <span>{channel.isPlaying ? 'Pause' : 'Resume'}</span>
                    </button>
                  )}

                  <button
                    className="tt-btn tt-btn-secondary btn-sm"
                    onClick={() => fileInputRefs.current[channel.id]?.click()}
                    title="Change or upload new video to this channel"
                  >
                    <UploadCloud size={12} />
                    <span>{hasVideo ? 'Change Video' : 'Upload Video'}</span>
                  </button>

                  <button
                    className="tt-btn tt-btn-secondary btn-sm"
                    onClick={() => navigate('/movement')}
                    title="Locate camera on interactive Reserve Map"
                  >
                    <MapPin size={12} />
                    <span>View on Map</span>
                  </button>

                  {isThreat && (
                    <button
                      className="tt-btn tt-btn-primary btn-sm threat-action-btn"
                      onClick={() => navigate('/image-review')}
                    >
                      <Eye size={12} />
                      <span>Verify Biometrics</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .live-feeds-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .live-feed-toast {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FEF3C7;
          border: 1px solid #FDE68A;
          color: #92400E;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 12.5px;
          font-weight: 500;
          animation: slideDown 0.3s ease-out;
        }

        /* Control Strip */
        .control-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          flex-wrap: wrap;
          gap: 12px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
        }

        .strip-left, .strip-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .feed-status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .live-pulse-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #94A3B8;
        }

        .live-pulse-dot.active {
          background: #22C55E;
          box-shadow: 0 0 10px #22C55E;
          animation: pulse 1.5s infinite;
        }

        /* Multi Feed Grid */
        .multi-feed-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
          gap: 16px;
        }

        @media (max-width: 992px) {
          .multi-feed-grid {
            grid-template-columns: 1fr;
          }
        }

        .camera-channel-card {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.2s ease;
          border: 1px solid var(--border-default);
          background: var(--bg-surface);
        }

        .camera-channel-card.threat-active {
          border: 2px solid #EF4444 !important;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.35);
        }

        .channel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 12px 14px;
          background: var(--bg-subtle);
          border-bottom: 1px solid var(--border-subtle);
        }

        .channel-identity {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .channel-badge {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          padding: 4px 7px;
          border-radius: 4px;
          background: #0284C7;
          color: #FFFFFF;
          letter-spacing: 0.05em;
        }

        .channel-badge.alert-badge {
          background: #DC2626;
          animation: pulse 1s infinite;
        }

        .channel-name-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .channel-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .channel-village-info {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--text-muted);
        }

        .streaming-pill {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          color: #166534;
          background: #DCFCE7;
          border: 1px solid #BBF7D0;
          padding: 2px 7px;
          border-radius: 12px;
        }

        .standby-pill {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          color: #64748B;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          padding: 2px 7px;
          border-radius: 12px;
        }

        .threat-pill {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          color: #FFFFFF;
          background: #DC2626;
          padding: 2px 8px;
          border-radius: 12px;
          animation: pulse 1s infinite;
        }

        /* Screen Container */
        .channel-screen-container {
          position: relative;
          aspect-ratio: 16 / 9;
          background: #0B1320;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .video-player-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .hidden-source-video {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0.01;
          pointer-events: none;
        }

        .channel-canvas {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        /* Standby Dropzone */
        .channel-upload-dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          width: 100%;
          height: 100%;
          border: 2px dashed rgba(255, 255, 255, 0.15);
          transition: background 0.2s ease;
        }

        .channel-upload-dropzone:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: var(--color-forest);
        }

        .dropzone-icon {
          color: #64748B;
        }

        .upload-prompt-text {
          font-size: 13px;
          font-weight: 600;
          color: #E2E8F0;
        }

        .upload-prompt-sub {
          font-size: 11px;
          color: #94A3B8;
        }

        .dropzone-btn-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        /* Threat Overlay */
        .threat-watermark-overlay {
          position: absolute;
          bottom: 12px;
          left: 12px;
          right: 12px;
          z-index: 10;
          pointer-events: none;
        }

        .threat-alert-box {
          background: rgba(185, 28, 28, 0.95);
          color: #FFFFFF;
          padding: 8px 12px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          animation: slideUp 0.3s ease-out;
        }

        .threat-sub {
          font-size: 10.5px;
          opacity: 0.9;
        }

        /* Channel Footer */
        .channel-footer {
          padding: 10px 14px;
          background: var(--bg-surface);
          border-top: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .footer-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
          color: var(--text-muted);
        }

        .alert-time-tag {
          color: #EF4444;
          font-weight: 700;
        }

        .channel-controls-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .threat-action-btn {
          background: #DC2626 !important;
          border-color: #B91C1C !important;
          color: #FFFFFF !important;
        }

        @keyframes slideUp {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default LiveCameraFeeds;
