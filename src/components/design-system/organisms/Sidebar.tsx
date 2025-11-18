"use client";

import * as React from "react";
import { X, Star, Scan, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

type TabValue = "watchlist" | "scanners" | "recent";

const tabs: { value: TabValue; label: string; icon: React.ElementType }[] = [
  { value: "watchlist", label: "Watchlist", icon: Star },
  { value: "scanners", label: "Scanners", icon: Scan },
  { value: "recent", label: "Recent", icon: Clock },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, children }) => {
  const [activeTab, setActiveTab] = React.useState<TabValue>("watchlist");

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 z-40 w-80 bg-bg-primary border-r border-white/10 transition-transform duration-300 lg:sticky lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header with tabs */}
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Navigation</h2>
              <button
                onClick={onClose}
                className="lg:hidden p-2 hover:bg-accent-cyan/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-colors",
                      activeTab === tab.value
                        ? "bg-accent-cyan/20 text-accent-cyan"
                        : "text-muted-foreground hover:bg-accent-cyan/10"
                    )}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-xs">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {children || (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">
                  {activeTab === "watchlist" && "No tickers in watchlist"}
                  {activeTab === "scanners" && "No active scanners"}
                  {activeTab === "recent" && "No recent searches"}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export { Sidebar };

