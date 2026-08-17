import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  AlertTriangle,
  Activity,
  ArrowRight,
  ShieldCheck,
  Eye,
  CheckCircle2,
  Database,
  Radio,
  Zap,
  Play,
  Pause,
  Clock,
  Signal,
  TrendingUp,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { tigerService } from '../service/api';
import { mockTigers, mockSightings, mockAlerts, mockCameraTraps } from '../data/mockData';
import type { TigerProfile, Sighting, AlertItem, CameraTrap, ReserveZone } from '../types/tiger';

// Simulation Pool of Realistic Live Captures
const SIMULATION_CAPTURES = [
  {
    tigerId: 'SIM-TIG-001',
    confidence: 0.96,
    secondId: 'SIM-TIG-006',
    secondConf: 0.72,
    isAmbiguous: false,
    camera: 'STN-TR-04',
    cameraName: 'Turia Waterhole Station 04',
    zone: 'Turia' as ReserveZone,
    flank: 'RIGHT' as const,
    photoUrl: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=600&q=80',
    notes: 'Resident female adult drinking at north waterpoint.'
  },
  {
    tigerId: 'SIM-TIG-002',
    confidence: 0.93,
    secondId: 'SIM-TIG-003',
    secondConf: 0.76,
    isAmbiguous: false,
    camera: 'STN-KJ-02',
    cameraName: 'Karmajhiri Core Crossing 02',
    zone: 'Karmajhiri' as ReserveZone,
    flank: 'LEFT' as const,
    photoUrl: 'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?auto=format&fit=crop&w=600&q=80',
    notes: 'Dominant male patrolling territorial boundary ridge.'
  },
  {
    tigerId: 'SIM-TIG-003',
    confidence: 0.94,
    secondId: 'SIM-TIG-004',
    secondConf: 0.81,
    isAmbiguous: false,
    camera: 'STN-JM-01',
    cameraName: 'Jamtara Riverine Ridge',
    zone: 'Jamtara' as ReserveZone,
    flank: 'BOTH' as const,
    photoUrl: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=600&q=80',
    notes: 'Adult male moving along seasonal nullah.'
  },
  {
    tigerId: 'SIM-TIG-005',
    confidence: 0.87,
    secondId: 'SIM-TIG-001',
    secondConf: 0.82,
    isAmbiguous: true, // Close match differential triggers Biologist Review Alert!
    camera: 'STN-RK-03',
    cameraName: 'Rukhad Buffer Post 03',
    zone: 'Rukhad' as ReserveZone,
    flank: 'LEFT' as const,
    photoUrl: 'https://images.unsplash.com/photo-1501706362039-c06b2d715385?auto=format&fit=crop&w=600&q=80',
    notes: 'Sub-adult female dispersing towards corridor boundary. Ambiguous stripe match.'
  },
  {
    tigerId: 'SIM-TIG-006',
    confidence: 0.95,
    secondId: 'SIM-TIG-001',
    secondConf: 0.68,
    isAmbiguous: false,
    camera: 'STN-TL-05',
    cameraName: 'Teliya Lake Bed Station',
    zone: 'Teliya' as ReserveZone,
    flank: 'RIGHT' as const,
    photoUrl: 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=600&q=80',
    notes: 'Resident female marked near central lake bank.'
  },
  {
    tigerId: 'SIM-TIG-004',
    confidence: 0.91,
    secondId: 'SIM-TIG-002',
    secondConf: 0.79,
    isAmbiguous: false,
    camera: 'STN-KH-02',
    cameraName: 'Khursapar Southern Trail',
    zone: 'Khursapar' as ReserveZone,
    flank: 'LEFT' as const,
    photoUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80',
    notes: 'Adult male marked on night patrol.'
  }
];

export const Dashboard: React.FC = () => {
  const [tigers, setTigers] = useState<TigerProfile[]>(mockTigers);
  const [sightings, setSightings] = useState<Sighting[]>(mockSightings);
  const [alerts, setAlerts] = useState<AlertItem[]>(mockAlerts);
  const [cameras, setCameras] = useState<CameraTrap[]>(mockCameraTraps);

  // Real-time Simulation Engine States
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [streamIntervalSec, setStreamIntervalSec] = useState<number>(7);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [lastEventTime, setLastEventTime] = useState<string>('Just now');
  const [lastCaptureToast, setLastCaptureToast] = useState<{
    id: string;
    tigerId: string;
    station: string;
    zone: string;
    confidence: number;
    flank: string;
    isAmbiguous: boolean;
  } | null>(null);

  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const [liveEventCount, setLiveEventCount] = useState<number>(0);
  const [totalDetectionsToday, setTotalDetectionsToday] = useState<number>(54);

  const simIndexRef = useRef<number>(0);

  // Live Digital Clock (Updates every 1s)
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Initial Data Fetch
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [tList, sList, aList, cList] = await Promise.all([
          tigerService.getAllTigers(),
          tigerService.getRecentSightings(10),
          tigerService.getAlerts(),
          tigerService.getCameraTraps(),
        ]);
        if (tList && tList.length > 0) setTigers(tList);
        if (sList && sList.length > 0) setSightings(sList);
        if (aList && aList.length > 0) setAlerts(aList);

        const alertStationIds = new Set(
          (aList || []).filter(a => !a.acknowledged).map(a => a.associatedCameraId || (a as any).stationId)
        );

        if (cList && cList.length > 0) {
          const mappedCams = cList.map(c => ({
            ...c,
            hasActiveAlert: alertStationIds.has(c.id) || alertStationIds.has(c.code) || c.hasActiveAlert
          }));
          setCameras(mappedCams);
        }
      } catch (err) {
        console.warn('Using mock telemetry for dashboard:', err);
      }
    };
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Function to inject a dynamic live detection event
  const triggerLiveEvent = () => {
    const sim = SIMULATION_CAPTURES[simIndexRef.current % SIMULATION_CAPTURES.length];
    simIndexRef.current += 1;

    const newId = `SGT-LIVE-${Date.now().toString().slice(-5)}`;
    const captureId = `CAP-${sim.camera.replace('STN-', '')}-${Date.now().toString().slice(-4)}`;

    const newSighting: Sighting = {
      id: newId,
      captureId,
      topCandidateId: sim.tigerId,
      topCandidateConfidence: sim.confidence,
      secondCandidateId: sim.secondId,
      secondCandidateConfidence: sim.secondConf,
      isAmbiguous: sim.isAmbiguous,
      timestamp: new Date().toISOString(),
      cameraTrapId: sim.camera,
      cameraTrapName: sim.cameraName,
      zone: sim.zone,
      reviewStatus: sim.isAmbiguous ? 'PENDING_REVIEW' : 'VERIFIED',
      location: { lat: 21.73 + (Math.random() * 0.04 - 0.02), lng: 79.31 + (Math.random() * 0.04 - 0.02) },
      flankSide: sim.flank,
      thumbnailUrl: sim.photoUrl,
      environmentalConditions: {
        timeOfDay: 'DAY',
        weather: 'Clear Ambient 28°C',
        temperatureCelsius: 28.5
      }
    };

    // Prepend to sightings stream
    setSightings(prev => [newSighting, ...prev.slice(0, 14)]);
    setHighlightedRowId(newId);
    setTotalDetectionsToday(prev => prev + 1);
    setLiveEventCount(prev => prev + 1);
    setLastEventTime('Just now');

    // If ambiguous, dynamically generate a high priority Biologist Review Alert
    if (sim.isAmbiguous) {
      const newAlert: AlertItem = {
        id: `ALT-LIVE-${Date.now().toString().slice(-4)}`,
        title: `Ambiguous Match Flagged: Station ${sim.camera}`,
        description: `Differential between ${sim.tigerId} (${(sim.confidence * 100).toFixed(0)}%) and ${sim.secondId} (${(sim.secondConf * 100).toFixed(0)}%) is under 8%. Mandatory biologist verification queued.`,
        severity: 'HIGH',
        category: 'UNIDENTIFIED_STRIPE_CAPTURE',
        timestamp: new Date().toISOString(),
        acknowledged: false,
        associatedTigerId: sim.tigerId,
        associatedCameraId: sim.camera,
        zone: sim.zone
      };
      setAlerts(prev => [newAlert, ...prev.slice(0, 5)]);
    }

    // Trigger floating toast
    setLastCaptureToast({
      id: newId,
      tigerId: sim.tigerId,
      station: sim.cameraName,
      zone: sim.zone,
      confidence: sim.confidence,
      flank: sim.flank,
      isAmbiguous: sim.isAmbiguous
    });

    // Auto-clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedRowId(null);
    }, 3200);

    // Auto-dismiss toast after 4.5 seconds
    setTimeout(() => {
      setLastCaptureToast(prev => (prev?.id === newId ? null : prev));
    }, 4500);
  };

  // Realtime Simulation Timer Loop
  useEffect(() => {
    if (!isLiveStreaming) return;

    const timer = setInterval(() => {
      triggerLiveEvent();
    }, streamIntervalSec * 1000);

    return () => clearInterval(timer);
  }, [isLiveStreaming, streamIntervalSec]);

  // Derived Metrics
  const males = tigers.filter(t => t.sex === 'MALE').length;
  const females = tigers.filter(t => t.sex === 'FEMALE').length;
  const subAdults = tigers.filter(t => t.ageClass === 'SUB_ADULT').length;
  const activeTraps = cameras.filter(c => c.status === 'ONLINE').length || 24;
  const pendingCount = sightings.filter(s => s.reviewStatus === 'PENDING_REVIEW').length;
  const recentSightings = sightings.slice(0, 6);
  const criticalAlerts = alerts.slice(0, 3);

  return (
    <div className="dashboard-page">
      {/* Floating Live Capture Toast Alert */}
      {lastCaptureToast && (
        <div className={`live-capture-toast ${lastCaptureToast.isAmbiguous ? 'toast-ambiguous' : 'toast-success'}`}>
          <div className="toast-icon-wrap">
            {lastCaptureToast.isAmbiguous ? (
              <AlertTriangle size={18} className="text-amber" />
            ) : (
              <Zap size={18} className="text-success pulse-anim" />
            )}
          </div>
          <div className="toast-content">
            <div className="toast-header-row">
              <span className="toast-badge">
                {lastCaptureToast.isAmbiguous ? '⚠️ AMBIGUOUS MATCH' : '⚡ LIVE FIELD DETECTION'}
              </span>
              <span className="toast-time">Just now</span>
            </div>
            <div className="toast-title">
              <strong>{lastCaptureToast.tigerId}</strong> sighted at <span>{lastCaptureToast.station}</span>
            </div>
            <div className="toast-meta font-mono">
              Confidence: {(lastCaptureToast.confidence * 100).toFixed(1)}% • {lastCaptureToast.flank} Flank • {lastCaptureToast.zone} Sector
            </div>
          </div>
          <Link to="/image-review" className="toast-action-btn">
            Inspect <ChevronRight size={12} />
          </Link>
        </div>
      )}

      {/* Real-time Field Telemetry Command Bar */}
      <div className="tt-card realtime-command-bar">
        <div className="command-left">
          <div className="live-status-pill">
            <span className={`live-pulsing-dot ${isLiveStreaming ? 'active' : 'paused'}`} />
            <span className="live-status-txt">
              {isLiveStreaming ? 'LIVE FIELD INGESTION ACTIVE' : 'INGESTION STREAM PAUSED'}
            </span>
          </div>

          <div className="telemetry-item hide-mobile">
            <Clock size={13} className="text-muted" />
            <span className="telemetry-label">Pench Field Time:</span>
            <span className="telemetry-val font-mono">
              {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
            </span>
          </div>

          <div className="telemetry-item hide-mobile">
            <Signal size={13} className="text-success" />
            <span className="telemetry-label">Network Array:</span>
            <span className="telemetry-val font-mono">24/24 Online • 34ms</span>
          </div>

          <div className="telemetry-item hide-mobile">
            <Radio size={13} className="text-forest" />
            <span className="telemetry-label">Live Ingested:</span>
            <span className="telemetry-val font-mono text-forest font-bold">+{liveEventCount} frames</span>
          </div>
        </div>

        <div className="command-right">
          {/* Interval Speed Selector */}
          <div className="stream-speed-select-wrap">
            <Sliders size={13} className="text-muted" />
            <select
              className="stream-speed-select"
              value={streamIntervalSec}
              onChange={(e) => setStreamIntervalSec(Number(e.target.value))}
              title="Change automated event trigger interval"
            >
              <option value={4}>Speed: Fast (4s)</option>
              <option value={7}>Speed: Normal (7s)</option>
              <option value={15}>Speed: Calm (15s)</option>
            </select>
          </div>

          {/* Toggle Stream Play/Pause */}
          <button
            type="button"
            className={`tt-btn ${isLiveStreaming ? 'tt-btn-secondary' : 'tt-btn-primary'} btn-sm`}
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            title={isLiveStreaming ? 'Pause automated capture stream' : 'Resume real-time automated capture stream'}
          >
            {isLiveStreaming ? <Pause size={13} /> : <Play size={13} />}
            <span>{isLiveStreaming ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>

          {/* Instant Manual Trigger Button */}
          <button
            type="button"
            className="tt-btn tt-btn-primary btn-sm trigger-btn"
            onClick={triggerLiveEvent}
            title="Simulate an instant live camera trap trigger"
          >
            <Zap size={13} className="zap-icon" />
            <span>Trigger Capture Now</span>
          </button>
        </div>
      </div>

      {/* Dynamic KPI Stats Grid */}
      <div className="kpi-grid">
        {/* Metric 1 */}
        <div className="tt-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Cataloged Individuals</span>
            <div className="kpi-icon-badge">
              <Database size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value telemetry-num">{tigers.length || 6}</span>
            <span className="badge badge-forest font-mono">100% ID Match</span>
          </div>
          <div className="kpi-subtext">
            <span>{males} Males</span> • <span>{females} Females</span> • <span>{subAdults} Sub-Adult</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="tt-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Active Camera Stations</span>
            <div className="kpi-icon-badge">
              <Camera size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value telemetry-num">
              {activeTraps} <span className="kpi-denom">/ 24</span>
            </span>
            <span className="badge badge-forest font-mono">
              <span className="mini-pulse-dot" /> 100% Online
            </span>
          </div>
          <div className="kpi-subtext">
            <span>Solar & LoRa telemetry links nominal</span>
          </div>
        </div>

        {/* Metric 3: Realtime Detections Counter */}
        <div className="tt-card kpi-card live-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">24h Capture Detections</span>
            <div className="kpi-icon-badge live-badge-icon">
              <Activity size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value telemetry-num live-counter-glow">
              {totalDetectionsToday}
            </span>
            <span className="badge badge-forest font-mono">
              <TrendingUp size={11} /> +{liveEventCount} Today
            </span>
          </div>
          <div className="kpi-subtext">
            <span>Last trigger: <strong className="text-forest">{lastEventTime}</strong></span>
          </div>
        </div>

        {/* Metric 4: Biologist Review Queue */}
        <div className="tt-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Pending Biometric Review</span>
            <div className="kpi-icon-badge warning-badge-icon">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value telemetry-num text-amber">{pendingCount}</span>
            <span className={`badge ${pendingCount > 0 ? 'badge-amber' : 'badge-forest'} font-mono`}>
              {pendingCount > 0 ? 'Action Needed' : 'Queue Clear'}
            </span>
          </div>
          <div className="kpi-subtext">
            <span>Differential &lt; 8% flagged for confirmation</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="dashboard-content-split">
        {/* Left Column: Real-Time Camera Observations Feed */}
        <div className="tt-card section-card">
          <div className="tt-card-header">
            <div>
              <h2 className="tt-card-title">
                <Eye size={16} className="text-forest" />
                <span>Live Observation Feed</span>
                <span className="live-pill-tag">
                  <span className="pulsing-mini-dot" /> STREAMING
                </span>
              </h2>
              <p className="tt-card-subtitle">
                Real-time camera station triggers biometrically matched against the Pench Tiger stripe catalog
              </p>
            </div>
            <Link to="/image-review" className="tt-btn tt-btn-secondary btn-sm">
              <span>Review Queue ({pendingCount})</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="sightings-table-container">
            <table className="tt-table">
              <thead>
                <tr>
                  <th>Capture Time</th>
                  <th>Identified Individual</th>
                  <th>Camera Station & Sector</th>
                  <th>Flank</th>
                  <th>Confidence</th>
                  <th>Review Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSightings.map((s, index) => {
                  const isHighlighted = s.id === highlightedRowId;
                  const isNewest = index === 0;

                  return (
                    <tr
                      key={s.id}
                      className={`sighting-row ${isHighlighted ? 'row-just-arrived' : ''}`}
                    >
                      <td className="telemetry-num text-muted">
                        <div className="time-cell-wrap">
                          {isNewest && <span className="new-tag-pill">NEW</span>}
                          <span>
                            {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="tiger-cell">
                          <div className="tiger-thumb-box">
                            <img
                              src={s.thumbnailUrl}
                              alt={s.topCandidateId}
                              className="tiger-thumb"
                              onError={(e) => {
                                (e.target as HTMLElement).style.background = '#1E293B';
                              }}
                            />
                          </div>
                          <div>
                            <div className="tiger-code-txt font-mono">{s.topCandidateId}</div>
                            <div className="tiger-sub-txt font-mono">
                              STRIPE-SIG-{s.topCandidateId.replace('SIM-TIG-', '').replace('TGR-', '')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="station-txt">{s.cameraTrapName}</div>
                        <span className="zone-pill">{s.zone} Sector</span>
                      </td>
                      <td>
                        <span className="badge badge-subtle font-mono">{s.flankSide}</span>
                      </td>
                      <td>
                        <div className="confidence-cell">
                          <span className="telemetry-num font-semibold text-forest">
                            {(s.topCandidateConfidence * 100).toFixed(1)}%
                          </span>
                          <div className="conf-mini-bar-track">
                            <div
                              className="conf-mini-bar-fill"
                              style={{ width: `${s.topCandidateConfidence * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        {s.isAmbiguous ? (
                          <span className="badge badge-amber font-mono">
                            <AlertTriangle size={11} /> Ambiguous
                          </span>
                        ) : s.reviewStatus === 'VERIFIED' ? (
                          <span className="badge badge-forest font-mono">
                            <CheckCircle2 size={11} /> Verified
                          </span>
                        ) : (
                          <span className="badge badge-subtle font-mono">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Observation Advisories & Quick Access */}
        <div className="right-col-stack">
          {/* Priority Alerts */}
          <div className="tt-card alert-summary-card">
            <div className="tt-card-header">
              <div>
                <h3 className="tt-card-title">
                  <AlertTriangle size={15} className="text-warning" />
                  <span>Real-Time Field Advisories</span>
                </h3>
                <p className="tt-card-subtitle">Boundary, perimeter, & biometric divergence flags</p>
              </div>
              <Link to="/alerts" className="view-all-link">
                View All ({alerts.length})
              </Link>
            </div>

            <div className="alert-items-list">
              {criticalAlerts.map((alert) => (
                <div key={alert.id} className={`alert-entry ${alert.severity.toLowerCase()}`}>
                  <div className="alert-entry-header">
                    <span className={`badge ${alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? 'badge-red' : alert.severity === 'MEDIUM' ? 'badge-amber' : 'badge-subtle'} font-mono`}>
                      {alert.severity}
                    </span>
                    <span className="alert-time telemetry-num">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="alert-entry-title">{alert.title}</div>
                  <div className="alert-entry-desc">{alert.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="tt-card quick-links-card">
            <h3 className="tt-card-title">
              <ShieldCheck size={15} className="text-forest" />
              <span>Forest Monitoring Quick Access</span>
            </h3>
            <div className="quick-actions-grid">
              <Link to="/camera-processing" className="quick-action-btn">
                <Camera size={16} />
                <span>Import SD Dump</span>
              </Link>
              <Link to="/movement" className="quick-action-btn">
                <Activity size={16} />
                <span>Spatial Map</span>
              </Link>
              <Link to="/tigers" className="quick-action-btn">
                <Database size={16} />
                <span>Fauna Registry</span>
              </Link>
              <Link to="/image-review" className="quick-action-btn">
                <Eye size={16} />
                <span>Stripe Matcher</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 14px;
          animation: fadeInUp 0.4s ease-out;
        }

        /* Realtime Floating Toast — Glassmorphic Dark */
        .live-capture-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08);
          animation: slideInToast 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          max-width: 440px;
          color: #E2E8F0;
        }

        .live-capture-toast.toast-success {
          border-left: 4px solid #10B981;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 15px rgba(16, 185, 129, 0.15);
        }

        .live-capture-toast.toast-ambiguous {
          border-left: 4px solid #F59E0B;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 15px rgba(245, 158, 11, 0.15);
        }

        @keyframes slideInToast {
          from {
            transform: translateY(30px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        .toast-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .toast-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .toast-badge {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #34D399;
        }

        .toast-ambiguous .toast-badge {
          color: #FBBF24;
        }

        .toast-time {
          font-size: 10px;
          color: #64748B;
        }

        .toast-title {
          font-size: 12.5px;
          color: #F8FAFC;
          line-height: 1.4;
        }

        .toast-title strong {
          color: #FFFFFF;
        }

        .toast-title span {
          color: #34D399;
        }

        .toast-meta {
          font-size: 10.5px;
          color: #94A3B8;
        }

        .toast-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #34D399;
          text-decoration: none;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .toast-action-btn:hover {
          background: var(--color-primary);
          color: #FFFFFF;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
        }

        /* Realtime Command Bar */
        .realtime-command-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          flex-wrap: wrap;
          gap: 12px;
          box-shadow: var(--shadow-sm);
        }

        .command-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .live-status-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 4px 12px;
          border-radius: 20px;
        }

        .live-pulsing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .live-pulsing-dot.active {
          background: #10B981;
          box-shadow: 0 0 8px #10B981;
          animation: pulseGreen 1.8s infinite;
        }

        .live-pulsing-dot.paused {
          background: #64748B;
        }

        @keyframes pulseGreen {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        .live-status-txt {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--text-primary);
        }

        .telemetry-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
        }

        .telemetry-label {
          color: var(--text-muted);
        }

        .telemetry-val {
          color: var(--text-secondary);
          font-weight: 600;
        }

        .command-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stream-speed-select-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: var(--radius-sm);
          padding: 4px 8px;
        }

        .stream-speed-select {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 11.5px;
          font-weight: 500;
          outline: none;
          cursor: pointer;
        }

        .trigger-btn {
          background: linear-gradient(135deg, #059669 0%, #10B981 100%);
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.2);
        }

        .trigger-btn:hover {
          background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
        }

        .zap-icon {
          animation: zapPulse 2s ease-in-out infinite;
        }

        @keyframes zapPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }

        /* KPI Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        @media (max-width: 1100px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .kpi-grid {
            grid-template-columns: 1fr;
          }
        }

        .kpi-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 16px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .kpi-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .kpi-icon-badge {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--color-primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .kpi-card:hover .kpi-icon-badge {
          background: var(--color-primary-bg);
          border-color: var(--border-active);
          transform: scale(1.05);
        }

        .kpi-icon-badge.live-badge-icon {
          color: #34D399;
        }

        .kpi-icon-badge.warning-badge-icon {
          color: #FBBF24;
        }

        .kpi-value-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-top: 4px;
        }

        .kpi-value {
          font-size: 26px;
          font-weight: 700;
          color: #FFFFFF;
          line-height: 1.1;
          letter-spacing: -0.02em;
          transition: all 0.3s ease;
        }

        .kpi-denom {
          font-size: 14px;
          color: var(--text-muted);
          font-weight: 400;
        }

        .kpi-subtext {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          padding-top: 6px;
        }

        .kpi-subtext span {
          color: var(--text-secondary);
        }

        .mini-pulse-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #10B981;
          border-radius: 50%;
          margin-right: 4px;
          box-shadow: 0 0 6px #10B981;
        }

        /* Split Layout */
        .dashboard-content-split {
          display: grid;
          grid-template-columns: 1.8fr 1.2fr;
          gap: 14px;
        }

        @media (max-width: 1024px) {
          .dashboard-content-split {
            grid-template-columns: 1fr;
          }
        }

        .btn-sm {
          padding: 5px 12px;
          font-size: 11.5px;
        }

        .live-pill-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-left: 8px;
          font-size: 9px;
          font-weight: 700;
          font-family: var(--font-mono);
          background: rgba(16, 185, 129, 0.15);
          color: #34D399;
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 2px 8px;
          border-radius: 10px;
        }

        .pulsing-mini-dot {
          width: 5px;
          height: 5px;
          background: #10B981;
          border-radius: 50%;
          box-shadow: 0 0 6px #10B981;
          animation: pulseGreen 1.5s infinite;
        }

        .sightings-table-container {
          overflow-x: auto;
          background: rgba(0, 0, 0, 0.15);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        /* Row Flash on Ingest */
        .sighting-row {
          transition: background-color 0.8s ease;
        }

        .sighting-row.row-just-arrived {
          background-color: rgba(16, 185, 129, 0.2) !important;
          animation: flashHighlight 3s ease forwards;
        }

        @keyframes flashHighlight {
          0% {
            background-color: rgba(16, 185, 129, 0.25);
          }
          70% {
            background-color: rgba(16, 185, 129, 0.1);
          }
          100% {
            background-color: transparent;
          }
        }

        .time-cell-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .new-tag-pill {
          font-size: 8px;
          font-weight: 800;
          background: linear-gradient(135deg, #10B981, #069669);
          color: #FFFFFF;
          padding: 2px 5px;
          border-radius: 4px;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
          animation: bounceNew 1s infinite alternate;
        }

        @keyframes bounceNew {
          from { transform: scale(0.92); }
          to { transform: scale(1.05); }
        }

        .confidence-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .conf-mini-bar-track {
          width: 50px;
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          overflow: hidden;
        }

        .conf-mini-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #10B981, #34D399);
          border-radius: 2px;
        }

        .tiger-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tiger-thumb-box {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .tiger-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .tiger-code-txt {
          font-size: 12px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .tiger-sub-txt {
          font-size: 10px;
          color: var(--text-muted);
        }

        .station-txt {
          font-weight: 600;
          color: var(--text-primary);
        }

        .zone-pill {
          display: inline-block;
          font-size: 10px;
          color: var(--text-muted);
          margin-top: 1px;
        }

        .font-semibold {
          font-weight: 600;
        }

        .font-mono {
          font-family: var(--font-mono);
        }

        .right-col-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .view-all-link {
          font-size: 11.5px;
          color: var(--color-primary-light);
          font-weight: 600;
          transition: all 0.2s;
        }

        .view-all-link:hover {
          color: #FFFFFF;
          text-decoration: none;
        }

        .alert-items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .alert-entry {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: all 0.2s ease;
        }

        .alert-entry:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .alert-entry.high, .alert-entry.critical {
          border-left: 3px solid #F87171;
        }

        .alert-entry.medium {
          border-left: 3px solid #F59E0B;
        }

        .alert-entry.low {
          border-left: 3px solid #38BDF8;
        }

        .alert-entry-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .alert-time {
          font-size: 10px;
          color: var(--text-muted);
        }

        .alert-entry-title {
          font-size: 11.5px;
          font-weight: 600;
          color: #FFFFFF;
        }

        .alert-entry-desc {
          font-size: 10.5px;
          color: var(--text-secondary);
          line-height: 1.45;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-top: 10px;
        }

        .quick-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: var(--radius-sm);
          padding: 14px 10px;
          text-align: center;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .quick-action-btn:hover {
          background: var(--color-primary-bg);
          border-color: var(--border-active);
          color: #FFFFFF;
          transform: translateY(-1px);
          box-shadow: var(--shadow-glow-emerald);
        }

        .text-forest { color: var(--color-primary-light); }
        .text-warning { color: #F59E0B; }
        .text-amber { color: #FBBF24; }
        .text-success { color: #34D399; }

        @media (max-width: 768px) {
          .hide-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
