import React from 'react';
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
  Info
} from 'lucide-react';
import {
  mockOverviewStats,
  mockSightings,
  mockAlerts,
  mockCameraTraps,
  mockTigers
} from '../data/mockData';

export const Dashboard: React.FC = () => {
  const activeTraps = mockCameraTraps.filter(c => c.status === 'ONLINE').length;
  const recentSightings = mockSightings.slice(0, 4);
  const criticalAlerts = mockAlerts.slice(0, 3);

  return (
    <div className="dashboard-page">
      {/* Synthetic Dataset Notice Banner */}
      <div className="synthetic-banner">
        <div className="banner-left">
          <Info size={14} className="text-forest" />
          <span>
            <strong>Wildlife Information System Prototype:</strong> Displaying simulated camera-trap observations, deterministic identifiers (<span className="telemetry-num">SIM-TIG-001</span> to <span className="telemetry-num">SIM-TIG-006</span>), and territory records for Pench Tiger Reserve.
          </span>
        </div>
        <span className="synthetic-tag">PROTOTYPE SYSTEM</span>
      </div>

      {/* KPI Stats Grid */}
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
            <span className="kpi-value telemetry-num">{mockOverviewStats.totalCatalogedTigers}</span>
            <span className="badge badge-forest font-mono">Deterministic IDs</span>
          </div>
          <div className="kpi-subtext">
            <span>{mockOverviewStats.maleCount} Males</span> • <span>{mockOverviewStats.femaleCount} Females</span> • <span>{mockOverviewStats.subAdultCount} Sub-Adult</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="tt-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Camera Trap Stations</span>
            <div className="kpi-icon-badge">
              <Camera size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value telemetry-num">
              {activeTraps} <span className="kpi-denom">/ {mockOverviewStats.totalCameraStations}</span>
            </span>
            <span className="badge badge-forest font-mono">92.3% Active</span>
          </div>
          <div className="kpi-subtext">
            <span>2 stations scheduled for routine service</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="tt-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Observations (Past 30 Days)</span>
            <div className="kpi-icon-badge">
              <Activity size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value telemetry-num">{mockOverviewStats.observationsPast30Days}</span>
            <span className="badge badge-amber font-mono">{mockOverviewStats.pendingReviewCount} Pending Review</span>
          </div>
          <div className="kpi-subtext">
            <span>High capture rate in Turia & Karmajhiri beats</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="tt-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Active Field Advisories</span>
            <div className="kpi-icon-badge">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value telemetry-num">{mockOverviewStats.activeAlertsCount}</span>
            <span className="badge badge-red font-mono">1 High Priority</span>
          </div>
          <div className="kpi-subtext">
            <span>Boundary dispersal and buffer proximity</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="dashboard-content-split">
        {/* Left Column: Recent Camera Observations Feed */}
        <div className="tt-card section-card">
          <div className="tt-card-header">
            <div>
              <h2 className="tt-card-title">
                <Eye size={16} className="text-forest" />
                <span>Recent Camera-Trap Observations</span>
              </h2>
              <p className="tt-card-subtitle">Biometrically classified tiger photo captures from camera station network</p>
            </div>
            <Link to="/image-review" className="tt-btn tt-btn-secondary btn-sm">
              <span>Biometric Review Queue</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="sightings-table-container">
            <table className="tt-table">
              <thead>
                <tr>
                  <th>Time Recorded</th>
                  <th>Top Candidate ID</th>
                  <th>Camera Station & Sector</th>
                  <th>Flank</th>
                  <th>Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSightings.map((s) => (
                  <tr key={s.id}>
                    <td className="telemetry-num text-muted">
                      {new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <div className="tiger-cell">
                        <div className="tiger-thumb-box">
                          <img src={s.thumbnailUrl} alt={s.topCandidateId} className="tiger-thumb" />
                        </div>
                        <div>
                          <div className="tiger-code-txt font-mono">{s.topCandidateId}</div>
                          <div className="tiger-sub-txt font-mono">
                            {mockTigers.find(t => t.id === s.topCandidateId)?.stripeSignature}
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
                      <span className="telemetry-num font-semibold text-forest">
                        {(s.topCandidateConfidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td>
                      {s.isAmbiguous ? (
                        <span className="badge badge-amber font-mono">Ambiguous</span>
                      ) : s.reviewStatus === 'VERIFIED' ? (
                        <span className="badge badge-forest font-mono">
                          <CheckCircle2 size={11} /> Verified
                        </span>
                      ) : (
                        <span className="badge badge-subtle font-mono">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Advisories & Quick Operations */}
        <div className="right-col-stack">
          {/* Priority Alerts */}
          <div className="tt-card alert-summary-card">
            <div className="tt-card-header">
              <div>
                <h3 className="tt-card-title">
                  <AlertTriangle size={15} className="text-warning" />
                  <span>Observation Advisories</span>
                </h3>
                <p className="tt-card-subtitle">Boundary and perimeter camera alerts</p>
              </div>
              <Link to="/alerts" className="view-all-link">
                View All ({mockAlerts.length})
              </Link>
            </div>

            <div className="alert-items-list">
              {criticalAlerts.map((alert) => (
                <div key={alert.id} className={`alert-entry ${alert.severity.toLowerCase()}`}>
                  <div className="alert-entry-header">
                    <span className={`badge ${alert.severity === 'HIGH' ? 'badge-red' : alert.severity === 'MEDIUM' ? 'badge-amber' : 'badge-subtle'} font-mono`}>
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
        }

        .banner-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

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
          padding: 14px;
        }

        .kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .kpi-label {
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-muted);
        }

        .kpi-icon-badge {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-sm);
          background: var(--color-primary-bg);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kpi-value-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-top: 2px;
        }

        .kpi-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.1;
        }

        .kpi-denom {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 400;
        }

        .kpi-subtext {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
        }

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
          padding: 5px 10px;
          font-size: 11.5px;
        }

        .sightings-table-container {
          overflow-x: auto;
        }

        .tiger-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tiger-thumb-box {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          flex-shrink: 0;
        }

        .tiger-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .tiger-code-txt {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .tiger-sub-txt {
          font-size: 10px;
          color: var(--text-muted);
        }

        .station-txt {
          font-weight: 500;
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
          color: var(--color-primary);
          font-weight: 500;
        }

        .view-all-link:hover {
          text-decoration: underline;
        }

        .alert-items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .alert-entry {
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .alert-entry.high {
          border-left: 3px solid #DC2626;
        }

        .alert-entry.medium {
          border-left: 3px solid #D97706;
        }

        .alert-entry.low {
          border-left: 3px solid #0284C7;
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
          color: var(--text-primary);
        }

        .alert-entry-desc {
          font-size: 10.5px;
          color: var(--text-secondary);
          line-height: 1.4;
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
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 12px 8px;
          text-align: center;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .quick-action-btn:hover {
          background: var(--color-primary-bg);
          border-color: var(--border-active);
          color: var(--color-primary);
        }

        .text-forest { color: var(--color-primary); }
        .text-warning { color: #B45309; }
      `}</style>
    </div>
  );
};
export default Dashboard;
