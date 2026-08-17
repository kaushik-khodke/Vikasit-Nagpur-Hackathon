import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Persistent Left Sidebar */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
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
          background-color: var(--bg-app);
        }

        .main-content-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin-left: var(--sidebar-width);
          min-width: 0;
          min-height: 100vh;
          transition: margin-left var(--transition-normal);
        }

        .content-viewport {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 24px;
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
        }

        @media (max-width: 992px) {
          .main-content-wrapper {
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
