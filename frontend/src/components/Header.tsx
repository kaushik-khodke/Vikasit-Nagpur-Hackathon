import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Bell
} from 'lucide-react';
import { mockAlerts } from '../data/mockData';

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
          background-color: var(--bg-header);
          border-bottom: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .menu-toggle-btn {
          display: none;
          color: var(--text-secondary);
          padding: 6px;
          border-radius: var(--radius-sm);
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          transition: all var(--transition-fast);
        }

        .menu-toggle-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-active);
        }

        .page-heading-group {
          display: flex;
          flex-direction: column;
        }

        .page-category {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--color-primary);
          line-height: 1.2;
        }

        .page-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.2;
          margin: 0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-icon-btn {
          position: relative;
          color: var(--text-secondary);
          padding: 7px;
          border-radius: var(--radius-sm);
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .header-icon-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-active);
          background: #E8F2EC;
        }

        .alert-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          background-color: var(--status-critical-text);
          color: #fff;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          min-width: 14px;
          height: 14px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #FFFFFF;
        }

        .user-profile-widget {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 3px 8px 3px 3px;
          background: var(--bg-surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
        }

        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-sm);
          background: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #FFFFFF;
          font-family: var(--font-mono);
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
        }

        @media (max-width: 992px) {
          .menu-toggle-btn {
            display: flex;
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
