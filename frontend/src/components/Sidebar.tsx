import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Camera,
  Images,
  Database,
  Map,
  AlertTriangle,
  X,
  Trees,
  Info
} from 'lucide-react';
import { mockAlerts, mockSightings, mockTigers } from '../data/mockData';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const pendingReviewCount = mockSightings.filter(s => s.reviewStatus === 'PENDING_REVIEW').length;
  const unreadAlertsCount = mockAlerts.filter(a => !a.acknowledged).length;

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      name: 'Camera Trap Processing',
      path: '/camera-processing',
      icon: Camera,
      badge: '3 Batches'
    },
    {
      name: 'Image Review',
      path: '/image-review',
      icon: Images,
      badge: pendingReviewCount > 0 ? `${pendingReviewCount} Pending` : null,
      badgeVariant: 'warning' as const
    },
    {
      name: 'Tiger Database',
      path: '/tigers',
      icon: Database,
      badge: `${mockTigers.length} Tigers`
    },
    {
      name: 'Movement & Territory',
      path: '/movement',
      icon: Map,
      badge: null
    },
    {
      name: 'Alerts',
      path: '/alerts',
      icon: AlertTriangle,
      badge: unreadAlertsCount > 0 ? `${unreadAlertsCount} Action` : null,
      badgeVariant: 'danger' as const
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`tt-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header / Department Emblem */}
        <div className="sidebar-header">
          <div className="brand-lockup">
            <div className="brand-logo-badge">
              <span className="brand-emblem">🐅</span>
            </div>
            <div className="brand-text">
              <div className="brand-title">TIGER TRACKER</div>
              <div className="brand-subtitle">Pench Tiger Reserve</div>
            </div>
          </div>
          
          <button
            className="mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Reserve Jurisdiction Sub-header */}
        <div className="reserve-tag-strip">
          <div className="reserve-indicator">
            <Trees size={13} className="trees-icon" />
            <span>Forest Department System</span>
          </div>
          <span className="prototype-pill">PROTOTYPE</span>
        </div>

        {/* Navigation List */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">MONITORING MODULES</div>
          <ul className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path} className="nav-item">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                    onClick={onCloseMobile}
                  >
                    <div className="nav-link-left">
                      <Icon size={16} className="nav-icon" />
                      <span className="nav-text">{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`nav-badge ${
                          item.badgeVariant === 'danger'
                            ? 'badge-danger'
                            : item.badgeVariant === 'warning'
                            ? 'badge-warning'
                            : 'badge-default'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer / Data Honesty Box */}
        <div className="sidebar-footer">
          <div className="telemetry-box">
            <div className="telemetry-header">
              <Info size={12} />
              <span>DATASET SPECIFICATION</span>
            </div>
            <div className="telemetry-details">
              <div className="detail-row">
                <span className="detail-label">Data Mode:</span>
                <span className="detail-val">Synthetic Prototype</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Primary Input:</span>
                <span className="detail-val">Camera-trap imagery</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Camera Array:</span>
                <span className="detail-val">24 Active Stations</span>
              </div>
            </div>
          </div>

          <div className="footer-copyright">
            <span>Pench Tiger Reserve</span>
            <span className="version-tag">v2.1</span>
          </div>
        </div>
      </aside>

      <style>{`
        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.4);
          z-index: 99;
        }

        .tt-sidebar {
          width: var(--sidebar-width);
          background-color: var(--bg-sidebar);
          color: var(--text-inverse);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 100;
          transition: transform var(--transition-fast);
        }

        .sidebar-header {
          height: var(--header-height);
          padding: 0 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #0F3824;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .brand-lockup {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-logo-badge {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: #1B5E3C;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .brand-title {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: #FFFFFF;
          line-height: 1.2;
        }

        .brand-subtitle {
          font-size: 11px;
          color: #A3C9B4;
          font-weight: 400;
        }

        .mobile-close-btn {
          display: none;
          color: #A3C9B4;
          padding: 4px;
        }

        .reserve-tag-strip {
          padding: 8px 18px;
          background: rgba(0, 0, 0, 0.15);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: #A3C9B4;
        }

        .reserve-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .trees-icon {
          color: #86EFAC;
        }

        .prototype-pill {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          color: #FEF08A;
          background: rgba(250, 204, 21, 0.2);
          padding: 1px 5px;
          border-radius: 2px;
          border: 1px solid rgba(250, 204, 21, 0.35);
        }

        .sidebar-nav {
          flex: 1;
          padding: 14px 10px;
          overflow-y: auto;
        }

        .nav-section-label {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #8EBAA1;
          margin-bottom: 8px;
          padding-left: 8px;
        }

        .nav-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          color: #D3E5DB;
          font-size: 12.5px;
          font-weight: 500;
          transition: all var(--transition-fast);
        }

        .nav-link-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .nav-icon {
          color: #8EBAA1;
          transition: color var(--transition-fast);
        }

        .nav-link:hover {
          background-color: var(--bg-sidebar-hover);
          color: #FFFFFF;
        }

        .nav-link:hover .nav-icon {
          color: #FFFFFF;
        }

        .nav-link.active {
          background-color: var(--bg-sidebar-active);
          color: #FFFFFF;
          font-weight: 600;
        }

        .nav-link.active .nav-icon {
          color: #86EFAC;
        }

        .nav-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          padding: 1px 5px;
          border-radius: 3px;
          line-height: 1.2;
        }

        .nav-badge.badge-default {
          background-color: rgba(255, 255, 255, 0.12);
          color: #D3E5DB;
        }

        .nav-badge.badge-warning {
          background-color: #FEF3C7;
          color: #92400E;
        }

        .nav-badge.badge-danger {
          background-color: #FEE2E2;
          color: #991B1B;
        }

        .sidebar-footer {
          padding: 12px 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background-color: #0F3824;
        }

        .telemetry-box {
          background-color: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-sm);
          padding: 8px 10px;
          margin-bottom: 10px;
        }

        .telemetry-header {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: #86EFAC;
          margin-bottom: 5px;
        }

        .telemetry-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 10.5px;
        }

        .detail-label {
          color: #8EBAA1;
        }

        .detail-val {
          font-family: var(--font-mono);
          color: #FFFFFF;
          font-weight: 500;
        }

        .footer-copyright {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10.5px;
          color: #8EBAA1;
        }

        .version-tag {
          font-family: var(--font-mono);
          font-size: 9.5px;
          background: rgba(255, 255, 255, 0.08);
          padding: 1px 4px;
          border-radius: 2px;
        }

        @media (max-width: 992px) {
          .tt-sidebar {
            transform: translateX(-100%);
          }

          .tt-sidebar.open {
            transform: translateX(0);
          }

          .mobile-close-btn {
            display: block;
          }
        }
      `}</style>
    </>
  );
};
export default Sidebar;
