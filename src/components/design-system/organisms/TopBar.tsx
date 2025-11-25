"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, Bell, User, TrendingUp, Brain, BarChart3, Settings } from "lucide-react";
import { Badge } from "../atoms/Badge";
import { ThemeToggle } from "../atoms/ThemeToggle";
import { AIChatToggle } from "../atoms/AIChatToggle";
import { LivePriceIndicator } from "../atoms/LivePriceIndicator";
import { cn } from "@/lib/utils";

export interface TopBarProps {
  onMenuClick?: () => void;
  alertCount?: number;
  userEmail?: string;
  children?: React.ReactNode;
}

const TopBar: React.FC<TopBarProps> = ({
  onMenuClick,
  alertCount = 0,
  userEmail,
  children,
}) => {
  const pathname = usePathname();
  
  const navItems = [
    { href: "/", label: "Market", icon: TrendingUp },
    { href: "/analyzer", label: "Analyzer", icon: Brain },
    { href: "/model-monitor", label: "Models", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];
  
  return (
      <motion.header
        className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
      <div className="container flex h-16 items-center gap-4 px-4">
        {/* Menu button for mobile */}
        <motion.button
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-primary/10 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Menu className="h-5 w-5" />
        </motion.button>

        {/* Logo */}
        <Link href="/">
            <div className="flex items-center gap-2 group cursor-pointer">
              <motion.div
                className="w-8 h-8 rounded-md bg-gradient-to-br from-[#4ecdc4] to-[#1a535c] flex items-center justify-center font-bold text-sm text-white"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                L
              </motion.div>
              <span className="font-bold text-lg hidden sm:inline text-foreground group-hover:text-[#4ecdc4] transition-colors duration-200">
                LumoTrade
              </span>
            </div>
        </Link>

        {/* Desktop Navigation - Hidden on mobile */}
        <nav className="hidden md:flex flex-1 items-center gap-1 px-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Custom content from children (for specific pages) */}
        {children && (
          <div className="flex-1 flex items-center gap-6 px-6 md:hidden">
          {children}
        </div>
        )}

        {/* Right side - Live Indicator, AI Chat, Theme, Alerts and User */}
        <div className="flex items-center gap-3">
          {/* Live Price Indicator */}
          <LivePriceIndicator isConnected={true} />
          
          {/* AI Chat Toggle */}
          <AIChatToggle />
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Alerts */}
          <motion.button
            className="relative p-2 hover:bg-primary/10 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={alertCount > 0 ? { rotate: [0, -15, 15, -15, 0] } : {}}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              <Bell className="h-5 w-5" />
            </motion.div>
            {alertCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <Badge
                  variant="bullish"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {alertCount}
                </Badge>
              </motion.div>
            )}
          </motion.button>

          {/* User Avatar */}
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer ring-2 ring-transparent hover:ring-primary/30 transition-all"
          >
            <User className="h-4 w-4 text-primary" />
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};

export { TopBar };

