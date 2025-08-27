'use client';

import React, { ReactNode } from 'react';
import ConnectionStatusDisplay from '@/components/ConnectionStatusDisplay';
import RoverModeDisplay from '@/components/RoverModeDisplay';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="pageContainer">
      <header className="header">
        <div className="header-left">
          <h1 className="title">ROS2 Offline Dashboard</h1>
        </div>
        <div className="header-center">
          <ConnectionStatusDisplay />
          <RoverModeDisplay />
        </div>
      </header>
      <main className="mainContent">{children}</main>
      <style jsx>{`
        .pageContainer {
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .header {
          background-color: #333;
          color: #fff;
          padding: 0.5rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .header-left {
          flex: 1;
        }
        .header-center {
          flex: 1;
          display: flex;
          justify-content: center;
          gap: 1rem;
        }
        .title {
          margin: 0;
          font-size: 1.2rem;
        }
        .mainContent {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};

export default Layout;
