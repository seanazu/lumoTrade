"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../atoms/Avatar";
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
          className="lg:hidden p-2 hover:bg-primary/10 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Menu className="h-5 w-5" />
        </motion.button>

        {/* Logo */}
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

        {/* Navigation / Content */}
        <div className="flex-1 flex items-center gap-6 px-6">
          {children}
        </div>

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
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Avatar className="cursor-pointer ring-2 ring-transparent hover:ring-primary/30 transition-all">
              <AvatarImage src="" />
              <AvatarFallback>
                {userEmail ? userEmail[0].toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};

export { TopBar };

