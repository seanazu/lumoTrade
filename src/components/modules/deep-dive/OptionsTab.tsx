"use client";

import * as React from "react";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";

interface OptionsTabProps {
  ticker: string;
}

const OptionsTab: React.FC<OptionsTabProps> = ({ ticker }) => {
  // Mock options data
  const optionsData = {
    putCallRatio: 0.85,
    impliedVolatility: "42.5%",
    volumeVsOI: "1.8x",
    maxPain: "$178.00",
    largestOI: {
      calls: "$180",
      puts: "$175",
    },
  };

  return (
    <GlassCard>
      <h4 className="text-lg font-bold mb-4">Options & Short Interest</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-bg-secondary">
          <p className="text-sm text-muted-foreground mb-1">Put/Call Ratio</p>
          <p className="text-2xl font-bold">{optionsData.putCallRatio}</p>
        </div>
        <div className="p-4 rounded-lg bg-bg-secondary">
          <p className="text-sm text-muted-foreground mb-1">Implied Volatility</p>
          <p className="text-2xl font-bold">{optionsData.impliedVolatility}</p>
        </div>
        <div className="p-4 rounded-lg bg-bg-secondary">
          <p className="text-sm text-muted-foreground mb-1">Volume vs OI</p>
          <p className="text-2xl font-bold">{optionsData.volumeVsOI}</p>
        </div>
        <div className="p-4 rounded-lg bg-bg-secondary">
          <p className="text-sm text-muted-foreground mb-1">Max Pain</p>
          <p className="text-2xl font-bold">{optionsData.maxPain}</p>
        </div>
      </div>

      <div>
        <h5 className="text-sm font-semibold mb-3 uppercase tracking-wide">
          Largest Open Interest
        </h5>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-xs text-muted-foreground mb-1">Calls</p>
            <p className="text-xl font-bold text-green-400">
              {optionsData.largestOI.calls}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-xs text-muted-foreground mb-1">Puts</p>
            <p className="text-xl font-bold text-red-400">
              {optionsData.largestOI.puts}
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export { OptionsTab };

