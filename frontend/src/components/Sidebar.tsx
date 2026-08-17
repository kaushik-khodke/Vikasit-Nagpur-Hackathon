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
  ChevronLeft
} from 'lucide-react';
import { mockAlerts, mockSightings, mockTigers } from '../data/mockData';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed,
  onToggleCollapse,
  onCloseMobile
}) => {
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

      <aside className={`tt-sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          {isCollapsed ? (
            /* When collapsed: Tiger logo acts as button to open */
            <button
              className="collapsed-logo-btn"
              onClick={onToggleCollapse}
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <span className="brand-emblem">🐅</span>
            </button>
          ) : (
            /* When expanded: Full brand lockup and compress button */
            <>
              <div className="brand-lockup">
                <button
                  className="brand-logo-badge"
                  onClick={onToggleCollapse}
                  title="Compress sidebar"
                  aria-label="Compress sidebar"
                >
                  <span className="brand-emblem">🐅</span>
                </button>
                <div className="brand-text">
                  <div className="brand-title">TIGER TRACKER</div>
                  <div className="brand-subtitle">Pench Tiger Reserve</div>
                </div>
              </div>

              <div className="header-actions">
                <button
                  className="collapse-toggle-btn"
                  onClick={onToggleCollapse}
                  title="Compress sidebar"
                  aria-label="Compress sidebar"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  className="mobile-close-btn"
                  onClick={onCloseMobile}
                  aria-label="Close sidebar"
                >
                  <X size={18} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Reserve Jurisdiction Sub-header (only when expanded) */}
        {!isCollapsed && (
          <div className="reserve-tag-strip">
            <div className="reserve-indicator">
              <Trees size={13} className="trees-icon" />
              <span>Forest Department System</span>
            </div>
            <span className="prototype-pill">PROTOTYPE</span>
          </div>
        )}

        {/* Navigation List */}
        <nav className="sidebar-nav">
          {!isCollapsed && (
            <div className="nav-section-label">MONITORING MODULES</div>
          )}
          <ul className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path} className="nav-item">
                  <NavLink
                    to={item.path}
                    title={isCollapsed ? item.name : undefined}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''} ${isCollapsed ? 'nav-link-collapsed' : ''}`
                    }
                    onClick={onCloseMobile}
                  >
                    <div className="nav-link-left">
                      <div className="icon-wrapper">
                        <Icon size={18} className="nav-icon" />
                        {isCollapsed && item.badge && (
                          <span
                            className={`collapsed-badge-pip ${
                              item.badgeVariant === 'danger'
                                ? 'pip-danger'
                                : item.badgeVariant === 'warning'
                                ? 'pip-warning'
                                : 'pip-default'
                            }`}
                          />
                        )}
                      </div>
                      {!isCollapsed && (
                        <span className="nav-text">{item.name}</span>
                      )}
                    </div>

                    {!isCollapsed && item.badge && (
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

        {/* Clean Minimal Footer */}
        <div className="sidebar-footer">
          {isCollapsed ? (
            <div className="footer-collapsed">
              <span className="version-tag">v2.1</span>
            </div>
          ) : (
            <div className="footer-copyright">
              <span>Pench Tiger Reserve</span>
              <span className="version-tag">v2.1</span>
            </div>
          )}
        </div>
      </aside>

      <style>{`
        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.45);
          z-index: 99;
          backdrop-filter: blur(2px);
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
          transition: width var(--transition-normal), transform var(--transition-normal);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
        }

        .tt-sidebar.collapsed {
          width: var(--sidebar-collapsed-width);
        }

        .sidebar-header {
          height: var(--header-height);
          padding: 0 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #0F3824;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
        }

        .tt-sidebar.collapsed .sidebar-header {
          justify-content: center;
          padding: 0;
        }

        .brand-lockup {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-logo-badge {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-sm);
          background: #1B5E3C;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          cursor: pointer;
          transition: transform var(--transition-fast), background-color var(--transition-fast);
        }

        .brand-logo-badge:hover {
          background: #25784E;
          transform: scale(1.05);
        }

        .collapsed-logo-btn {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: #1B5E3C;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .collapsed-logo-btn:hover {
          background: #25784E;
          transform: scale(1.08);
          box-shadow: 0 0 12px rgba(134, 239, 172, 0.4);
          border-color: #86EFAC;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-title {
          font-family: var(--font-display);
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: #FFFFFF;
          line-height: 1.2;
        }

        .brand-subtitle {
          font-size: 10.5px;
          color: #A3C9B4;
          font-weight: 400;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .collapse-toggle-btn {
          color: #A3C9B4;
          padding: 6px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .collapse-toggle-btn:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .mobile-close-btn {
          display: none;
          color: #A3C9B4;
          padding: 6px;
        }

        .reserve-tag-strip {
          padding: 8px 14px;
          background: rgba(0, 0, 0, 0.15);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: #A3C9B4;
          animation: fadeIn 0.2s ease-in-out;
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
          padding: 14px 8px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .tt-sidebar.collapsed .sidebar-nav {
          padding: 14px 6px;
        }

        .nav-section-label {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #8EBAA1;
          margin-bottom: 8px;
          padding-left: 8px;
          white-space: nowrap;
        }

        .nav-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 10px;
          border-radius: var(--radius-sm);
          color: #D3E5DB;
          font-size: 12.5px;
          font-weight: 500;
          transition: all var(--transition-fast);
          text-decoration: none;
          position: relative;
        }

        .nav-link-collapsed {
          justify-content: center;
          padding: 10px 0;
          border-radius: var(--radius-md);
        }

        .nav-link-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-icon {
          color: #8EBAA1;
          transition: color var(--transition-fast), transform var(--transition-fast);
          flex-shrink: 0;
        }

        .nav-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-link:hover {
          background-color: var(--bg-sidebar-hover);
          color: #FFFFFF;
        }

        .nav-link:hover .nav-icon {
          color: #FFFFFF;
          transform: scale(1.08);
        }

        .nav-link.active {
          background-color: var(--bg-sidebar-active);
          color: #FFFFFF;
          font-weight: 600;
          box-shadow: inset 3px 0 0 #86EFAC;
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
          white-space: nowrap;
          flex-shrink: 0;
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

        .collapsed-badge-pip {
          position: absolute;
          top: -2px;
          right: -4px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          border: 1.5px solid var(--bg-sidebar);
        }

        .pip-danger {
          background-color: #EF4444;
        }

        .pip-warning {
          background-color: #F59E0B;
        }

        .pip-default {
          background-color: #86EFAC;
        }

        .sidebar-footer {
          padding: 12px 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background-color: #0F3824;
        }

        .tt-sidebar.collapsed .sidebar-footer {
          padding: 10px 4px;
          display: flex;
          justify-content: center;
        }

        .footer-copyright {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10.5px;
          color: #8EBAA1;
        }

        .footer-collapsed {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .version-tag {
          font-family: var(--font-mono);
          font-size: 9.5px;
          background: rgba(255, 255, 255, 0.08);
          padding: 2px 6px;
          border-radius: 3px;
          color: #A3C9B4;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 992px) {
          .tt-sidebar,
          .tt-sidebar.collapsed {
            width: var(--sidebar-width);
            transform: translateX(-100%);
          }

          .tt-sidebar.open {
            transform: translateX(0);
          }

          .collapse-toggle-btn {
            display: none;
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
