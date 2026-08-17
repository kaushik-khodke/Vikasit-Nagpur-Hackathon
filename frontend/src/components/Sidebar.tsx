import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  Camera,
  Images,
  Database,
  Map,
  AlertTriangle,
  X,
  Trees,
  ChevronLeft
} from 'lucide-react';
import { tigerService } from '../service/api';

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
  const [batchesCount, setBatchesCount] = useState<number>(3);
  const [pendingReviewCount, setPendingReviewCount] = useState<number>(1);
  const [tigersCount, setTigersCount] = useState<number>(4);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(2);

  useEffect(() => {
    const fetchSidebarCounts = async () => {
      try {
        const [batches, sightings, tigers, alerts] = await Promise.all([
          tigerService.getProcessingBatches(),
          tigerService.getRecentSightings(),
          tigerService.getAllTigers(),
          tigerService.getAlerts(),
        ]);
        if (batches) setBatchesCount(batches.length);
        if (sightings) setPendingReviewCount(sightings.filter(s => s.reviewStatus === 'PENDING_REVIEW').length);
        if (tigers) setTigersCount(tigers.length);
        if (alerts) setUnreadAlertsCount(alerts.filter(a => !a.acknowledged).length);
      } catch (err) {
        console.error('Sidebar count error:', err);
      }
    };

    fetchSidebarCounts();
    const interval = setInterval(fetchSidebarCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      name: 'Live Edge Feeds',
      path: '/live-feeds',
      icon: Radio,
      badge: '5 Feeds',
      badgeVariant: 'warning' as const
    },
    {
      name: 'Camera Trap Processing',
      path: '/camera-processing',
      icon: Camera,
      badge: batchesCount > 0 ? `${batchesCount} Batches` : null
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
      badge: `${tigersCount} Tigers`
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

        {/* Reserve Jurisdiction Sub-header */}
        <div className="reserve-tag-strip">
          <div className="reserve-indicator">
            <Trees size={13} className="trees-icon" />
            <span>Forest Department System</span>
          </div>
          <span className="prototype-pill" style={{ background: '#15803D', color: '#DCFCE7' }}>ACTIVE</span>
        </div>

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

        {/* Tiger Photo Section */}
        <div className="tiger-photo-section">
          <div className="tiger-photo-container">
            <img 
              src="/images.jpg" 
              alt="Bengal Tiger in Pench Reserve" 
              className="tiger-photo"
            />
            <div className="tiger-photo-overlay">
              <div className="tiger-info">
                <span className="tiger-emoji">🐅</span>
                <span className="tiger-label">Bengal Tiger</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer / Data Specification Box */}
        <div className="sidebar-footer">
          {isCollapsed ? (
            <div className="footer-collapsed">
              <span className="version-tag">v2.1</span>
            </div>
          ) : (
            <div className="telemetry-details">
              <div className="detail-row">
                <span className="detail-label">Data Mode:</span>
                <span className="detail-val">Live Field Ingestion</span>
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
          )}

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
          background-color: rgba(0, 0, 0, 0.6);
          z-index: 99;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .tt-sidebar {
          width: var(--sidebar-width);
          background: linear-gradient(180deg, #070D16 0%, #03060B 100%);
          color: var(--text-inverse);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 100;
          transition: width var(--transition-normal), transform var(--transition-normal);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 4px 0 25px rgba(0, 0, 0, 0.4);
          overflow: hidden;
        }

        .tt-sidebar.collapsed {
          width: var(--sidebar-collapsed-width);
        }

        .sidebar-header {
          height: 56px;
          padding: 0 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #04080E;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          flex-shrink: 0;
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
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          cursor: pointer;
          transition: transform var(--transition-fast), background-color var(--transition-fast), box-shadow var(--transition-fast);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255,255,255,0.15);
          position: relative;
          overflow: hidden;
        }

        .brand-logo-badge::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .brand-logo-badge:hover {
          transform: scale(1.08);
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.6), inset 0 1px 0 rgba(255,255,255,0.2);
        }

        .brand-logo-badge:hover::before {
          opacity: 1;
        }

        .collapsed-logo-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: linear-gradient(135deg, #059669 0%, #10B981 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .collapsed-logo-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 0 14px rgba(52, 211, 153, 0.5);
          border-color: #34D399;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-title {
          font-family: var(--font-display);
          font-size: 13.5px;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #FFFFFF;
          line-height: 1.2;
        }

        .brand-subtitle {
          font-size: 10px;
          color: #64748B;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .collapse-toggle-btn {
          color: #64748B;
          padding: 6px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .collapse-toggle-btn:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .mobile-close-btn {
          display: none;
          color: #64748B;
          padding: 6px;
        }

        .reserve-tag-strip {
          padding: 5px 14px;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 9px;
          color: #94A3B8;
          animation: fadeIn 0.2s ease-in-out;
          flex-shrink: 0;
        }

        .reserve-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .trees-icon {
          color: #10B981;
        }

        .prototype-pill {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          color: #34D399;
          background: rgba(16, 185, 129, 0.15);
          padding: 1px 5px;
          border-radius: 4px;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }

        .sidebar-nav {
          flex: 0 0 auto;
          padding: 8px 8px;
          overflow: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .sidebar-nav::-webkit-scrollbar {
          display: none;
        }

        .tt-sidebar.collapsed .sidebar-nav {
          padding: 14px 6px;
        }

        .nav-section-label {
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #475569;
          margin-bottom: 6px;
          padding-left: 8px;
          white-space: nowrap;
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
          padding: 7px 10px;
          border-radius: var(--radius-sm);
          color: #94A3B8;
          font-size: 12px;
          font-weight: 500;
          transition: all var(--transition-fast);
          text-decoration: none;
          position: relative;
        }

        .nav-link-collapsed {
          justify-content: center;
          padding: 10px 0;
          border-radius: 8px;
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
          color: #64748B;
          transition: color var(--transition-fast), transform var(--transition-fast);
          flex-shrink: 0;
        }

        .nav-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.04);
          color: #FFFFFF;
        }

        .nav-link:hover .nav-icon {
          color: #FFFFFF;
          transform: scale(1.05);
        }

        .nav-link.active {
          background-color: rgba(16, 185, 129, 0.12);
          color: #FFFFFF;
          font-weight: 600;
          box-shadow: inset 3px 0 0 #10B981, 0 0 16px rgba(16, 185, 129, 0.2);
          border-radius: 8px;
          animation: activeGlow 2s ease-in-out infinite;
        }

        @keyframes activeGlow {
          0%, 100% { box-shadow: inset 3px 0 0 #10B981, 0 0 12px rgba(16, 185, 129, 0.15); }
          50% { box-shadow: inset 3px 0 0 #10B981, 0 0 20px rgba(16, 185, 129, 0.3); }
        }

        .nav-link.active .nav-icon {
          color: #10B981;
          animation: iconPulse 2s ease-in-out infinite;
        }

        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        .nav-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          line-height: 1.2;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .nav-badge.badge-default {
          background-color: rgba(255, 255, 255, 0.08);
          color: #94A3B8;
        }

        .nav-badge.badge-warning {
          background-color: rgba(245, 158, 11, 0.15);
          color: #FBBF24;
          border: 1px solid rgba(245, 158, 11, 0.25);
        }

        .nav-badge.badge-danger {
          background-color: rgba(239, 68, 68, 0.15);
          color: #F87171;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }

        .collapsed-badge-pip {
          position: absolute;
          top: -2px;
          right: -4px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          border: 1.5px solid #070D16;
        }

        .pip-danger {
          background-color: #EF4444;
          box-shadow: 0 0 6px #EF4444;
        }

        .pip-warning {
          background-color: #F59E0B;
          box-shadow: 0 0 6px #F59E0B;
        }

        .pip-default {
          background-color: #10B981;
          box-shadow: 0 0 6px #10B981;
        }

        .sidebar-footer {
          padding: 12px 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          background-color: #04080E;
        }

        .tiger-photo-section {
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 0;
          border-top: 1px solid rgba(255, 140, 0, 0.1);
          border-bottom: 1px solid rgba(255, 140, 0, 0.1);
          background: linear-gradient(180deg, rgba(255, 140, 0, 0.04) 0%, rgba(255, 140, 0, 0.02) 100%);
          flex: 1;
        }

        .tiger-photo-container {
          position: relative;
          width: 100%;
          flex: 1;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1.5px solid rgba(255, 140, 0, 0.2);
          box-shadow: 0 4px 12px rgba(255, 140, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transition: all var(--transition-normal);
          min-height: 150px;
        }

        .tiger-photo-container:hover {
          border-color: rgba(255, 140, 0, 0.4);
          box-shadow: 0 6px 20px rgba(255, 140, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          transform: scale(1.02);
        }

        .tiger-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .tiger-photo-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.6) 100%);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 10px;
          opacity: 0;
          transition: opacity var(--transition-normal);
        }

        .tiger-photo-container:hover .tiger-photo-overlay {
          opacity: 1;
        }

        .tiger-info {
          display: flex;
          align-items: center;
          gap: 6px;
          text-align: center;
        }

        .tiger-emoji {
          font-size: 18px;
          animation: tigerBounce 2s ease-in-out infinite;
        }

        @keyframes tigerBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .tiger-label {
          font-size: 11px;
          font-weight: 600;
          color: #FFFFFF;
          letter-spacing: 0.02em;
        }

        .tiger-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6px;
          background: rgba(255, 140, 0, 0.08);
          border: 1px solid rgba(255, 140, 0, 0.15);
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .stat-item:hover {
          background: rgba(255, 140, 0, 0.12);
          border-color: rgba(255, 140, 0, 0.25);
          box-shadow: 0 0 8px rgba(255, 140, 0, 0.1);
        }

        .stat-label {
          font-size: 8px;
          color: #A68A6F;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 700;
          color: #FFA500;
          margin-top: 1px;
          font-family: var(--font-mono);
        }

        .tt-sidebar.collapsed .tiger-photo-section {
          padding: 8px 6px;
        }

        .tt-sidebar.collapsed .tiger-photo-container {
          height: 140px;
        }

        .sidebar-footer {
          padding: 12px 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          background-color: #04080E;
        }

        .tt-sidebar.collapsed .sidebar-footer {
          padding: 10px 4px;
          display: flex;
          justify-content: center;
        }

        .telemetry-details {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-bottom: 6px;
          background: rgba(255, 255, 255, 0.02);
          padding: 5px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
        }

        .detail-label {
          color: #64748B;
        }

        .detail-val {
          color: #94A3B8;
          font-weight: 500;
        }

        .footer-copyright {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 8px;
          color: #475569;
        }

        .footer-collapsed {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .version-tag {
          font-family: var(--font-mono);
          font-size: 9px;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 5px;
          border-radius: 4px;
          color: #64748B;
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
