import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tigertracker_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('tigertracker_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 300);
      return next;
    });
  };

  return (
    <div className={`app-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Persistent Left Sidebar */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        <Header onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        
        <main className="content-viewport">
          <Outlet />
        </main>
      </div>

      <style>{`
        .app-container {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: radial-gradient(circle at 80% 10%, rgba(16, 185, 129, 0.04) 0%, rgba(11, 15, 25, 0) 50%), var(--bg-page);
          position: relative;
          overflow: hidden;
        }

        .app-container::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(45, 212, 191, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.02) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
          animation: bgShift 20s ease-in-out infinite;
        }

        @keyframes bgShift {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .main-content-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin-left: var(--sidebar-width);
          min-width: 0;
          min-height: 100vh;
          transition: margin-left var(--transition-normal);
          position: relative;
          z-index: 1;
        }

        .app-container.sidebar-collapsed .main-content-wrapper {
          margin-left: var(--sidebar-collapsed-width);
        }

        .content-viewport {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 24px;
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
          animation: fadeInUp 0.4s ease-out;
        }

        @media (max-width: 992px) {
          .main-content-wrapper,
          .app-container.sidebar-collapsed .main-content-wrapper {
            margin-left: 0;
          }
          .content-viewport {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};
export default Layout;
