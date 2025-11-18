"use client";

import * as React from "react";
import { motion } from "framer-motion";

interface ConfidenceMeterProps {
  value: number; // 0-100
}

const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({ value }) => {
  const getColor = (val: number) => {
    if (val >= 75) return "#4ade80";
    if (val >= 50) return "#00d9ff";
    return "#f87171";
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        {/* Animated arc */}
        <motion.circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={getColor(value)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold tabular-nums" style={{ color: getColor(value) }}>
          {value}%
        </span>
      </div>
    </div>
  );
};

export { ConfidenceMeter };

