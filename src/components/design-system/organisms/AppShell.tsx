"use client";

import { useState, useEffect, type ReactNode, type FC } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";

export interface AppShellProps {
  topBarContent?: ReactNode;
  sidebarContent?: ReactNode;
  alertCount?: number;
  userEmail?: string;
  children: ReactNode;
}

const AppShell: FC<AppShellProps> = ({
  topBarContent,
  sidebarContent,
  alertCount,
  userEmail,
  children,
}) => {
  // Open sidebar by default on desktop if there's content
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && sidebarContent) {
        setSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarContent]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        alertCount={alertCount}
        userEmail={userEmail}
      >
        {topBarContent}
      </TopBar>

      <div className="flex flex-1 relative">
        {sidebarContent && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          >
            {sidebarContent}
          </Sidebar>
        )}

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export { AppShell };

