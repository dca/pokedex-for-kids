'use client';
import React from 'react';
import TopNavigation from './navigation/TopNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, showNavigation = true }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      {/* Top Navigation */}
      {showNavigation && <TopNavigation />}
      
      <main
        style={{
          width: '100%',
          minHeight: '100vh',
          position: 'relative',
          paddingTop: showNavigation ? '70px' : '0'
        }}
        role="main"
      >
        {children}
      </main>
    </div>
  );
};

export default AppLayout;