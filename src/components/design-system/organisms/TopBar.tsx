"use client";

import * as React from "react";
import { Menu, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../atoms/Avatar";
import { Badge } from "../atoms/Badge";
import { ThemeToggle } from "../atoms/ThemeToggle";
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
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-bg-primary/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center gap-4 px-4">
        {/* Menu button for mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-accent-cyan/10 rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center font-bold text-sm">
            L
          </div>
          <span className="font-bold text-lg hidden sm:inline">LumoTrade</span>
        </div>

        {/* Center content (search, timeframe toggle, etc.) */}
        <div className="flex-1 flex items-center justify-center px-4">
          {children}
        </div>

        {/* Right side - Theme, Alerts and User */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Alerts */}
          <button className="relative p-2 hover:bg-primary/10 rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
            {alertCount > 0 && (
              <Badge
                variant="bullish"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {alertCount}
              </Badge>
            )}
          </button>

          {/* User Avatar */}
          <Avatar>
            <AvatarImage src="" />
            <AvatarFallback>
              {userEmail ? userEmail[0].toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export { TopBar };

