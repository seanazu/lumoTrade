"use client";

import { type FC } from "react";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";

interface FundamentalsTabProps {
  ticker: string;
}

const FundamentalsTab: FC<FundamentalsTabProps> = ({ ticker }) => {
  // Mock fundamentals data
  const fundamentals = [
    { label: "P/E Ratio", value: "28.5x", sector: "25.3x" },
    { label: "P/S Ratio", value: "7.2x", sector: "5.8x" },
    { label: "Debt/Equity", value: "1.2", sector: "1.5" },
    { label: "Gross Margin", value: "42.5%", sector: "38.2%" },
    { label: "Operating Margin", value: "22.8%", sector: "18.5%" },
    { label: "ROE", value: "28.3%", sector: "21.5%" },
  ];

  return (
    <GlassCard>
      <h4 className="text-lg font-bold mb-4">Key Ratios</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fundamentals.map((item) => (
          <div key={item.label} className="p-4 rounded-lg bg-bg-secondary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-xs text-muted-foreground">vs Sector</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold">{item.value}</span>
              <span className="text-sm text-muted-foreground">{item.sector}</span>
            </div>
            {/* Simple comparison bar */}
            <div className="mt-2 h-1 bg-bg-primary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-cyan rounded-full"
                style={{
                  width: `${Math.min((parseFloat(item.value) / parseFloat(item.sector)) * 50, 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export { FundamentalsTab };

