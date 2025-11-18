"use client";

import * as React from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";

export interface AppShellProps {
  topBarContent?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  alertCount?: number;
  userEmail?: string;
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({
  topBarContent,
  sidebarContent,
  alertCount,
  userEmail,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <TopBar
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        alertCount={alertCount}
        userEmail={userEmail}
      >
        {topBarContent}
      </TopBar>

      <div className="flex flex-1 relative">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        >
          {sidebarContent}
        </Sidebar>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export { AppShell };

