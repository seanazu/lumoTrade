import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface MetricPillProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  change?: number;
  sparklineData?: number[];
}

const MetricPill = forwardRef<HTMLDivElement, MetricPillProps>(
  ({ label, value, change, sparklineData, className, ...props }, ref) => {
    const isPositive = change && change > 0;
    const isNegative = change && change < 0;

    return (
      <div
        ref={ref}
        className={cn(
          "glass-card px-4 py-3 hover:scale-105 hover:shadow-lg transition-all cursor-pointer",
          className
        )}
        {...props}
      >
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tabular-nums">{value}</span>
            {change !== undefined && (
              <span
                className={cn(
                  "text-xs font-medium tabular-nums",
                  isPositive && "text-green-400",
                  isNegative && "text-red-400"
                )}
              >
                {isPositive && "+"}
                {change.toFixed(2)}%
              </span>
            )}
          </div>
          {sparklineData && sparklineData.length > 0 && (
            <div className="flex items-end gap-0.5 h-6 mt-1">
              {sparklineData.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 bg-accent-cyan/50 rounded-sm"
                  style={{ height: `${(value / Math.max(...sparklineData)) * 100}%` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);
MetricPill.displayName = "MetricPill";

export { MetricPill };

