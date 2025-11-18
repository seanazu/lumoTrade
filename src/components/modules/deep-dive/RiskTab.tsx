"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";

interface RiskTabProps {
  ticker: string;
}

const RiskTab: React.FC<RiskTabProps> = ({ ticker }) => {
  // Mock risk data
  const riskData = {
    gapRiskScore: 68,
    volatilityBand: "±3.2%",
    maxDrawdown: "-12.5%",
    betaToSP500: 1.15,
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#f87171";
    if (score >= 40) return "#fbbf24";
    return "#4ade80";
  };

  return (
    <GlassCard>
      <h4 className="text-lg font-bold mb-4">Risk Analysis</h4>

      {/* Gap Risk Score Gauge */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Gap Risk Score</span>
          <span className="text-2xl font-bold" style={{ color: getScoreColor(riskData.gapRiskScore) }}>
            {riskData.gapRiskScore}/100
          </span>
        </div>
        <div className="h-4 bg-bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: getScoreColor(riskData.gapRiskScore) }}
            initial={{ width: 0 }}
            animate={{ width: `${riskData.gapRiskScore}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          High score indicates elevated gap risk on catalysts
        </p>
      </div>

      {/* Other Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-bg-secondary">
          <p className="text-sm text-muted-foreground mb-1">Volatility Band</p>
          <p className="text-xl font-bold">{riskData.volatilityBand}</p>
        </div>
        <div className="p-4 rounded-lg bg-bg-secondary">
          <p className="text-sm text-muted-foreground mb-1">Max Drawdown (3M)</p>
          <p className="text-xl font-bold text-red-400">{riskData.maxDrawdown}</p>
        </div>
        <div className="p-4 rounded-lg bg-bg-secondary">
          <p className="text-sm text-muted-foreground mb-1">Beta to S&P 500</p>
          <p className="text-xl font-bold">{riskData.betaToSP500}</p>
        </div>
      </div>
    </GlassCard>
  );
};

export { RiskTab };

