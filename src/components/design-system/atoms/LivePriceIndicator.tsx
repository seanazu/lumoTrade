"use client";

import { type FC } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface LivePriceIndicatorProps {
  isConnected: boolean;
  className?: string;
}

export const LivePriceIndicator: FC<LivePriceIndicatorProps> = ({
  isConnected,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs",
        isConnected ? "text-green-500" : "text-muted-foreground",
        className
      )}
      data-onboarding="live-indicator"
    >
      <motion.div
        animate={
          isConnected
            ? {
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Activity className="h-3 w-3" />
      </motion.div>
      <span className="font-medium">
        {isConnected ? "Live" : "Connecting..."}
      </span>
    </div>
  );
};

