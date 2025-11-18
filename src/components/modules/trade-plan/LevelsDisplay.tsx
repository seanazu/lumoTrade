"use client";

import * as React from "react";
import { ArrowUpCircle, Target, StopCircle } from "lucide-react";
import { TradePlan } from "@/types/trade";
import { formatPrice } from "@/utils/formatting/numbers";

interface LevelsDisplayProps {
  tradePlan: TradePlan;
}

const LevelsDisplay: React.FC<LevelsDisplayProps> = ({ tradePlan }) => {
  return (
    <div className="space-y-3">
      {/* Entry */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30">
        <ArrowUpCircle className="h-5 w-5 text-accent-cyan flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">Entry Zone</p>
          <p className="font-bold tabular-nums">
            ${formatPrice(tradePlan.entry.min)} - ${formatPrice(tradePlan.entry.max)}
          </p>
        </div>
      </div>

      {/* Targets */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
        <Target className="h-5 w-5 text-green-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">
            Target{tradePlan.target.length > 1 ? "s" : ""}
          </p>
          <p className="font-bold tabular-nums text-green-400">
            {tradePlan.target.map((t) => `$${formatPrice(t)}`).join(" → ")}
          </p>
        </div>
      </div>

      {/* Stop */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
        <StopCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">Stop Loss</p>
          <p className="font-bold tabular-nums text-red-400">
            ${formatPrice(tradePlan.stop)}
          </p>
        </div>
      </div>
    </div>
  );
};

export { LevelsDisplay };

