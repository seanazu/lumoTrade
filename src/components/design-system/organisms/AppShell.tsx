"use client";

import { useState, useEffect, type ReactNode, type FC } from "react";
import { TopBar } from "./TopBar";
import { GlobalSidebar } from "./GlobalSidebar";
import { ProgressSidePanel, ProgressFloatingButton } from "@/components/modules/progress/ProgressSidePanel";

export interface AppShellProps {
  topBarContent?: ReactNode;
  alertCount?: number;
  userEmail?: string;
  children: ReactNode;
  showGlobalSidebar?: boolean;
}

const AppShell: FC<AppShellProps> = ({
  topBarContent,
  alertCount,
  userEmail,
  children,
  showGlobalSidebar = true,
}) => {
  // Sidebar only for mobile, closed by default
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <TopBar
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        alertCount={alertCount}
        userEmail={userEmail}
      >
        {topBarContent}
      </TopBar>

      <div className="flex flex-1 relative overflow-hidden">
        {showGlobalSidebar && (
          <GlobalSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Global Progress Tracking */}
      <ProgressSidePanel />
      <ProgressFloatingButton />
    </div>
  );
};

export { AppShell };

