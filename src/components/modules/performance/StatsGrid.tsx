"use client";

import { type FC } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Target, Award, BarChart3 } from "lucide-react";

interface StatsGridProps {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  totalPnL: number;
}

export const StatsGrid: FC<StatsGridProps> = ({
  totalTrades,
  winRate,
  profitFactor,
  avgWin,
  avgLoss,
  bestTrade,
  worstTrade,
  totalPnL,
}) => {
  const stats = [
    {
      label: "Total Trades",
      value: totalTrades,
      icon: BarChart3,
      color: "text-blue-500",
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      icon: Target,
      color: winRate >= 50 ? "text-green-500" : "text-red-500",
    },
    {
      label: "Profit Factor",
      value: profitFactor.toFixed(2),
      icon: TrendingUp,
      color: profitFactor >= 1.5 ? "text-green-500" : "text-yellow-500",
    },
    {
      label: "Avg Win",
      value: `$${avgWin.toFixed(2)}`,
      icon: Award,
      color: "text-green-500",
    },
    {
      label: "Avg Loss",
      value: `$${Math.abs(avgLoss).toFixed(2)}`,
      icon: Award,
      color: "text-red-500",
    },
    {
      label: "Best Trade",
      value: `$${bestTrade.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Worst Trade",
      value: `$${Math.abs(worstTrade).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-red-500",
    },
    {
      label: "Total P&L",
      value: `$${totalPnL.toFixed(2)}`,
      icon: TrendingUp,
      color: totalPnL >= 0 ? "text-green-500" : "text-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const IconComponent = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.05 }}
            className="p-4 rounded-lg bg-secondary border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <IconComponent className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

