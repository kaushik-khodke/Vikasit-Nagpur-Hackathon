import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Clock,
  CheckCircle,
  Send,
  Search
} from 'lucide-react';
import { mockAlerts } from '../data/mockData';
import type { AlertSeverity } from '../types/tiger';

export const Alerts: React.FC = () => {
  const [alertsState, setAlertsState] = useState(mockAlerts);
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleAcknowledge = (id: string) => {
    setAlertsState((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: !a.acknowledged } : a))
    );
  };

  const filteredAlerts = alertsState.filter((a) => {
    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.associatedTigerCode && a.associatedTigerCode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSeverity && matchesSearch;
  });

  const unacknowledgedCount = alertsState.filter((a) => !a.acknowledged).length;

  return (
    <div className="alerts-page">
      {/* Top Banner Alert Summary */}
      <div className="alerts-hero tt-card">
        <div className="hero-text-col">
          <div className="hero-badge-row">
            <ShieldAlert size={14} className="text-danger" />
            <span>FIELD OPERATIONS EARLY WARNING SYSTEM</span>
          </div>
          <h2 className="hero-title">Perimeter, Corridor & Conflict Alert Console</h2>
          <p className="hero-desc">
            Automated alerts generated from camera trap AI triggers, highway underpass sensors, and GPS radio collar geo-fences across Pench Tiger Reserve boundaries.
          </p>
        </div>

        <div className="hero-stat-box">
          <div className="stat-pill red">
            <AlertTriangle size={18} />
            <div>
              <div className="num telemetry-num">{unacknowledgedCount}</div>
              <div className="lbl">Action Required</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="tt-card alert-filters-card">
        <div className="search-box">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Search alerts by tiger code, zone, or alert type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="severity-tabs">
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              className={`sev-tab ${severityFilter === sev ? 'active' : ''} ${sev.toLowerCase()}`}
              onClick={() => setSeverityFilter(sev)}
            >
              {sev === 'ALL' ? 'All Severities' : `${sev} Priority`}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Stream List */}
      <div className="alerts-list">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`tt-card alert-card ${alert.severity.toLowerCase()} ${
              alert.acknowledged ? 'acknowledged' : 'unacknowledged'
            }`}
          >
            <div className="alert-card-top">
              <div className="alert-header-left">
                <span className={`badge ${alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? 'badge-red' : alert.severity === 'MEDIUM' ? 'badge-amber' : 'badge-blue'}`}>
                  {alert.severity} SEVERITY
                </span>
                <span className="badge badge-subtle">{alert.category.replace(/_/g, ' ')}</span>
                <span className="alert-id telemetry-num">{alert.id}</span>
              </div>

              <div className="alert-time-meta">
                <Clock size={12} />
                <span className="telemetry-num">{new Date(alert.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <div className="alert-card-main">
              <h3 className="alert-main-title">{alert.title}</h3>
              <p className="alert-description">{alert.description}</p>

              {alert.actionRequired && (
                <div className="action-required-callout">
                  <strong className="callout-label">Prescribed Range Action:</strong>
                  <span>{alert.actionRequired}</span>
                </div>
              )}

              <div className="alert-footer-meta">
                <div className="meta-left">
                  <div className="meta-tag">
                    <MapPin size={12} className="text-amber" />
                    <span>{alert.zone} Zone</span>
                  </div>

                  {alert.associatedTigerCode && (
                    <div className="meta-tag">
                      <span className="tiger-sym">🐅</span>
                      <span>
                        {alert.associatedTigerCode} ({alert.associatedTigerName})
                      </span>
                    </div>
                  )}
                </div>

                <div className="meta-actions">
                  <Link to="/movement" className="tt-btn tt-btn-ghost btn-sm">
                    <MapPin size={14} />
                    <span>View on GIS Map</span>
                  </Link>

                  <button
                    className={`tt-btn ${alert.acknowledged ? 'tt-btn-secondary' : 'tt-btn-primary'} btn-sm`}
                    onClick={() => toggleAcknowledge(alert.id)}
                  >
                    {alert.acknowledged ? (
                      <>
                        <CheckCircle size={14} />
                        <span>Acknowledged</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Acknowledge & Dispatch Unit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="tt-card empty-alerts">
            <CheckCircle size={36} className="text-forest" />
            <h3>No active alerts matching criteria</h3>
            <p>All forest sectors in the selected range are operating within normal baseline.</p>
          </div>
        )}
      </div>

      <style>{`
        .alerts-page {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .alerts-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 24px;
        }

        @media (max-width: 768px) {
          .alerts-hero {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }
        }

        .hero-badge-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          color: #f87171;
          margin-bottom: 4px;
        }

        .hero-title {
          font-size: 20px;
          margin-bottom: 4px;
        }

        .hero-desc {
          font-size: 13px;
          color: var(--text-secondary);
          max-width: 700px;
        }

        .stat-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 18px;
          border-radius: var(--radius-md);
        }

        .stat-pill.red {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }

        .stat-pill .num {
          font-size: 20px;
          font-weight: 700;
          line-height: 1;
        }

        .stat-pill .lbl {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .alert-filters-card {
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 260px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 6px 12px;
        }

        .search-input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 13px;
          color: var(--text-primary);
          width: 100%;
        }

        .severity-tabs {
          display: flex;
          gap: 6px;
        }

        .sev-tab {
          padding: 5px 12px;
          border-radius: var(--radius-full);
          font-size: 12px;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          transition: all var(--transition-fast);
        }

        .sev-tab.active {
          background: var(--bg-card-elevated);
          color: #fff;
          font-weight: 600;
          border-color: var(--border-default);
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .alert-card {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all var(--transition-fast);
        }

        .alert-card.high {
          border-left: 4px solid #ef4444;
        }

        .alert-card.medium {
          border-left: 4px solid #f59e0b;
        }

        .alert-card.low {
          border-left: 4px solid #38bdf8;
        }

        .alert-card.acknowledged {
          opacity: 0.75;
          background: rgba(14, 26, 22, 0.4);
        }

        .alert-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .alert-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .alert-id {
          font-size: 11px;
          color: var(--text-muted);
        }

        .alert-time-meta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: var(--text-muted);
        }

        .alert-main-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .alert-description {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .action-required-callout {
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.25);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          font-size: 12px;
          color: #fde68a;
          margin-top: 6px;
          display: flex;
          gap: 6px;
        }

        .callout-label {
          color: var(--accent-tiger);
          flex-shrink: 0;
        }

        .alert-footer-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 8px;
          border-top: 1px solid var(--border-subtle);
        }

        .meta-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .meta-tag {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.04);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .tiger-sym {
          font-size: 12px;
        }

        .meta-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .empty-alerts {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 40px;
          gap: 8px;
        }
      `}</style>
    </div>
  );
};
export default Alerts;
