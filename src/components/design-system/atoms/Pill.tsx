import * as React from "react";
import { cn } from "@/lib/utils";

export interface PillProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

const Pill = React.forwardRef<HTMLDivElement, PillProps>(
  ({ className, active, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer",
          active
            ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/50"
            : "bg-bg-secondary text-muted-foreground border border-white/10 hover:border-accent-cyan/30 hover:bg-accent-cyan/10",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Pill.displayName = "Pill";

export { Pill };

