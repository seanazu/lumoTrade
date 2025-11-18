import * as React from "react";
import { cn } from "@/lib/utils";

export interface RiskRewardBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  ratio: number;
  risk: number;
  reward: number;
}

const RiskRewardBar = React.forwardRef<HTMLDivElement, RiskRewardBarProps>(
  ({ ratio, risk, reward, className, ...props }, ref) => {
    const riskPercent = (risk / (risk + reward)) * 100;
    const rewardPercent = (reward / (risk + reward)) * 100;

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Risk/Reward</span>
          <span className="font-bold tabular-nums text-accent-cyan">
            1:{ratio.toFixed(2)}
          </span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden bg-bg-secondary">
          <div
            className="bg-red-500 transition-all"
            style={{ width: `${riskPercent}%` }}
          />
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${rewardPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Risking ${risk}</span>
          <span>To make ${reward}</span>
        </div>
      </div>
    );
  }
);
RiskRewardBar.displayName = "RiskRewardBar";

export { RiskRewardBar };

