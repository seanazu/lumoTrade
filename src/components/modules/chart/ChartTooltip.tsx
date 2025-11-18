"use client";

import * as React from "react";

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-semibold">${entry.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export { ChartTooltip };

