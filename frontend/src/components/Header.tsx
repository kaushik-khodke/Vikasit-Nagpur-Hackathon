import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Bell
} from 'lucide-react';
import { mockAlerts } from '../data/mockData';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const unreadAlerts = mockAlerts.filter(a => !a.acknowledged).length;

  const getPageInfo = (pathname: string) => {
    if (pathname.startsWith('/tigers/')) {
      return {
        title: 'Individual Tiger Dossier',
        category: 'Fauna Records / Identity Registry',
      };
    }

    switch (pathname) {
      case '/dashboard':
        return {
          title: 'Wildlife Monitoring Dashboard',
          category: 'Overview & Camera Statistics',
        };
      case '/camera-processing':
        return {
          title: 'Camera Trap Batch Ingest & Screening',
          category: 'Dataset Ingestion Pipeline',
        };
      case '/image-review':
        return {
          title: 'Stripe Pattern Biometric Review',
          category: 'Candidate Verification & Matching',
        };
      case '/tigers':
        return {
          title: 'Tiger Population Registry',
          category: 'Fauna Inventory',
        };
      case '/movement':
        return {
          title: 'Spatial Territory & Movement Map',
          category: 'GIS & Camera Station Records',
        };
      case '/alerts':
        return {
          title: 'Observation Alerts & Field Advisories',
          category: 'Field Operations',
        };
      default:
        return {
          title: 'Tiger Tracker System',
          category: 'Pench Tiger Reserve',
        };
    }
  };

  const pageInfo = getPageInfo(location.pathname);

  return (
    <header className="tt-header">
      <div className="header-left">
        {/* Mobile Hamburger Toggle */}
        <button
          className="menu-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        {/* Page Title & Category Context */}
        <div className="page-heading-group">
          <div className="page-category">{pageInfo.category}</div>
          <h1 className="page-title">{pageInfo.title}</h1>
        </div>
      </div>

      <div className="header-right">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Quick Alert Bell */}
        <button
          className="header-icon-btn"
          aria-label="Notifications"
          title={`${unreadAlerts} unread alert(s)`}
        >
          <Bell size={16} />
          {unreadAlerts > 0 && <span className="alert-badge">{unreadAlerts}</span>}
        </button>

        {/* User Profile Area */}
        <div className="user-profile-widget">
          <div className="user-avatar">
            <span>RS</span>
          </div>
          <div className="user-info">
            <div className="user-name">Officer R. Sharma</div>
            <div className="user-role">Range Forest Officer (RFO)</div>
          </div>
        </div>
      </div>

      <style>{`
        .tt-header {
          height: var(--header-height);
          background: rgba(4, 8, 15, 0.82);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.055);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 50;
          box-shadow: 0 1px 0 rgba(16, 185, 129, 0.08), 0 8px 32px rgba(0, 0, 0, 0.35);
        }

        .tt-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.35) 30%, rgba(45, 212, 191, 0.25) 60%, transparent 100%);
          pointer-events: none;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .menu-toggle-btn {
          display: none;
          color: var(--text-secondary);
          padding: 7px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-default);
          transition: all var(--transition-fast);
        }

        .menu-toggle-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--border-active);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.15);
        }

        .page-heading-group {
          display: flex;
          flex-direction: column;
        }

        .page-category {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          line-height: 1.2;
          background: linear-gradient(90deg, var(--color-primary-light), #2DD4BF, #22D3EE);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 5s ease infinite;
        }

        .page-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
          margin: 2px 0 0 0;
          letter-spacing: -0.015em;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-icon-btn {
          position: relative;
          color: var(--text-secondary);
          padding: 7px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .header-icon-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-active);
          background: rgba(16, 185, 129, 0.08);
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.18);
          transform: translateY(-1px);
        }

        .alert-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: linear-gradient(135deg, #DC2626, #EF4444);
          color: #fff;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          min-width: 15px;
          height: 15px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #04080F;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
          animation: glowPulse 2s ease-in-out infinite;
        }

        .user-profile-widget {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px 4px 4px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          backdrop-filter: blur(8px);
          transition: all var(--transition-fast);
          cursor: pointer;
        }

        .user-profile-widget:hover {
          background: rgba(255, 255, 255, 0.075);
          border-color: rgba(255, 255, 255, 0.14);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          transform: translateY(-1px);
        }

        .user-avatar {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #FFFFFF;
          font-family: var(--font-mono);
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255,255,255,0.15);
          position: relative;
          overflow: hidden;
        }

        .user-avatar::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: avatarSheen 4s ease-in-out infinite;
        }

        @keyframes avatarSheen {
          0% { left: -100%; }
          30%, 100% { left: 150%; }
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .user-role {
          font-size: 9.5px;
          color: var(--text-muted);
          line-height: 1.2;
          margin-top: 1px;
        }

        /* System status indicator */
        .system-status-dot {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: var(--radius-full);
          font-size: 10px;
          font-weight: 600;
          color: var(--color-primary-light);
          font-family: var(--font-mono);
          letter-spacing: 0.04em;
        }

        .sys-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 8px #10B981;
          animation: glowPulse 2s ease-in-out infinite;
        }

        @media (max-width: 992px) {
          .menu-toggle-btn {
            display: flex;
          }
          .system-status-dot {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .tt-header {
            padding: 0 14px;
          }

          .user-info {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};
export default Header;
