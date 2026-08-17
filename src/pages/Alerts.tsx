import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Clock,
  CheckCircle2,
  Send,
  Search,
  Info
} from 'lucide-react';
import { mockAlerts, mockTigers } from '../data/mockData';
import type { AlertSeverity, AlertItem } from '../types/tiger';

export const Alerts: React.FC = () => {
  const [alertsState, setAlertsState] = useState<AlertItem[]>(mockAlerts);
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
      (a.associatedTigerId && a.associatedTigerId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSeverity && matchesSearch;
  });

  const unacknowledgedCount = alertsState.filter((a) => !a.acknowledged).length;

  return (
    <div className="alerts-page">
      {/* Synthetic Notice */}
      <div className="synthetic-banner">
        <div className="banner-left">
          <Info size={14} className="text-forest" />
          <span>
            <strong>Field Advisory Prototype:</strong> Simulated observation alerts based on camera-trap triggers, boundary buffer proximity, and routine camera station diagnostics.
          </span>
        </div>
        <span className="synthetic-tag">PROTOTYPE ADVISORY CONSOLE</span>
      </div>

      {/* Top Banner Alert Summary */}
      <div className="alerts-hero tt-card">
        <div className="hero-text-col">
          <div className="hero-badge-row">
            <ShieldAlert size={14} className="text-danger" />
            <span>FIELD OPERATIONS & CAMERA OBSERVATION ALERTS</span>
          </div>
          <h2 className="hero-title">Perimeter, Dispersal & Station Diagnostics Console</h2>
          <p className="hero-desc">
            Operational advisories generated from camera-trap network captures, reserve boundary buffer checks, and camera station battery maintenance diagnostics across Pench Tiger Reserve.
          </p>
        </div>

        <div className="hero-stat-box">
          <div className={`stat-pill ${unacknowledgedCount > 0 ? 'red' : 'green'}`}>
            <AlertTriangle size={18} />
            <div>
              <div className="num telemetry-num">{unacknowledgedCount}</div>
              <div className="lbl">Awaiting Action</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="tt-card alert-filters-card">
        <div className="search-box">
          <Search size={14} className="text-muted" />
          <input
            type="text"
            placeholder="Search alerts by Tiger ID (e.g. SIM-TIG-005), sector, or alert category..."
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
        {filteredAlerts.map((alert) => {
          const associatedTiger = alert.associatedTigerId
            ? mockTigers.find((t) => t.id === alert.associatedTigerId)
            : undefined;

          return (
            <div
              key={alert.id}
              className={`tt-card alert-card ${alert.severity.toLowerCase()} ${
                alert.acknowledged ? 'acknowledged' : 'unacknowledged'
              }`}
            >
              <div className="alert-card-top">
                <div className="alert-header-left">
                  <span
                    className={`badge ${
                      alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
                        ? 'badge-red'
                        : alert.severity === 'MEDIUM'
                        ? 'badge-amber'
                        : 'badge-blue'
                    }`}
                  >
                    {alert.severity} PRIORITY
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

                {alert.prescribedAction && (
                  <div className="action-required-callout">
                    <strong className="callout-label">Prescribed Range Action:</strong>
                    <span>{alert.prescribedAction}</span>
                  </div>
                )}

                <div className="alert-footer-meta">
                  <div className="meta-left">
                    <div className="meta-tag">
                      <MapPin size={12} className="text-forest" />
                      <span>{alert.zone} Sector</span>
                    </div>

                    {alert.associatedTigerId && (
                      <div className="meta-tag">
                        <span className="tiger-sym">🐅</span>
                        <span className="font-mono font-bold">
                          {alert.associatedTigerId} {associatedTiger ? `(${associatedTiger.sex === 'FEMALE' ? 'Female' : 'Male'}, ${associatedTiger.primaryZone})` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="meta-actions">
                    <Link to="/movement" className="tt-btn tt-btn-secondary btn-sm">
                      <MapPin size={13} />
                      <span>View on GIS Map</span>
                    </Link>

                    <button
                      className={`tt-btn ${alert.acknowledged ? 'tt-btn-secondary' : 'tt-btn-primary'} btn-sm`}
                      onClick={() => toggleAcknowledge(alert.id)}
                    >
                      {alert.acknowledged ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Acknowledged</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>Acknowledge & Notify Beat Officer</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="tt-card empty-alerts">
            <CheckCircle2 size={32} className="text-forest" />
            <h3>No active alerts matching criteria</h3>
            <p>All forest sectors in the selected range are operating within normal baseline.</p>
          </div>
        )}
      </div>

      <style>{`
        .alerts-page {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .banner-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .alerts-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
        }

        @media (max-width: 768px) {
          .alerts-hero {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }

        .hero-badge-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 700;
          color: var(--status-critical-text);
          margin-bottom: 2px;
        }

        .hero-title {
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .hero-desc {
          font-size: 12px;
          color: var(--text-secondary);
          max-width: 700px;
          line-height: 1.4;
        }

        .stat-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          border-radius: var(--radius-sm);
        }

        .stat-pill.red {
          background: #FEE2E2;
          border: 1px solid #FECACA;
          color: #991B1B;
        }

        .stat-pill.green {
          background: #DCFCE7;
          border: 1px solid #BBF7D0;
          color: #166534;
        }

        .stat-pill .num {
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
        }

        .stat-pill .lbl {
          font-size: 10.5px;
          color: var(--text-secondary);
          margin-top: 1px;
        }

        .alert-filters-card {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 260px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 6px 10px;
        }

        .search-input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 12px;
          color: var(--text-primary);
          width: 100%;
        }

        .severity-tabs {
          display: flex;
          gap: 4px;
        }

        .sev-tab {
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 11.5px;
          color: var(--text-secondary);
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          transition: all var(--transition-fast);
        }

        .sev-tab.active {
          background: #FFFFFF;
          color: var(--color-primary);
          font-weight: 600;
          border-color: var(--border-active);
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alert-card {
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: all var(--transition-fast);
        }

        .alert-card.high {
          border-left: 3.5px solid #DC2626;
        }

        .alert-card.medium {
          border-left: 3.5px solid #D97706;
        }

        .alert-card.low {
          border-left: 3.5px solid #0284C7;
        }

        .alert-card.acknowledged {
          opacity: 0.8;
          background: #FAFBF9;
        }

        .alert-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .alert-header-left {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .alert-id {
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .alert-time-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .alert-main-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .alert-description {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.45;
        }

        .action-required-callout {
          background: #FEF3C7;
          border: 1px solid #FDE68A;
          border-radius: var(--radius-sm);
          padding: 6px 10px;
          font-size: 11.5px;
          color: #92400E;
          margin-top: 4px;
          display: flex;
          gap: 6px;
        }

        .callout-label {
          color: #78350F;
          flex-shrink: 0;
        }

        .alert-footer-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding-top: 8px;
          border-top: 1px solid var(--border-subtle);
        }

        .meta-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .meta-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          color: var(--text-secondary);
        }

        .meta-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-sm {
          padding: 4px 10px;
          font-size: 11.5px;
        }

        .empty-alerts {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 28px;
          gap: 6px;
        }

        .text-forest { color: var(--color-primary); }
        .text-danger { color: var(--status-critical-text); }
        .font-mono { font-family: var(--font-mono); }
        .font-bold { font-weight: 600; }
      `}</style>
    </div>
  );
};
export default Alerts;
