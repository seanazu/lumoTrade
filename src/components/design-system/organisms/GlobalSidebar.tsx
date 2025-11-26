"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Home, BarChart3, Brain, Settings, X, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { FC } from "react";
import { cn } from "@/lib/utils";

interface GlobalSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: BarChart3, label: "Analyzer", href: "/analyzer" },
  { icon: Brain, label: "Model Monitor", href: "/model-monitor" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export const GlobalSidebar: FC<GlobalSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay for mobile - hidden on desktop */}
          <motion.div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sidebar - mobile only, hidden on desktop */}
          <motion.aside
            className="md:hidden fixed top-0 left-0 bottom-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 w-64"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white">
                  L
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">LumoTrade</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-1 mt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                                (item.href !== "/" && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg transition-all group relative",
                      isActive 
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-r"
                        layoutId="activeIndicator"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"
                    )} />
                    <span className="font-medium">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p className="font-semibold text-gray-900 dark:text-white">Version 2.0</p>
                <p className="mt-1">AI-Powered Trading</p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

