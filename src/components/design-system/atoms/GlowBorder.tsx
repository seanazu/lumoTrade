import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlowBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: "cyan" | "violet" | "magenta" | "lime";
  animated?: boolean;
}

const glowColors = {
  cyan: "shadow-[0_0_20px_rgba(0,217,255,0.3)]",
  violet: "shadow-[0_0_20px_rgba(139,92,246,0.3)]",
  magenta: "shadow-[0_0_20px_rgba(247,0,255,0.3)]",
  lime: "shadow-[0_0_20px_rgba(125,214,63,0.3)]",
};

const GlowBorder = React.forwardRef<HTMLDivElement, GlowBorderProps>(
  ({ glowColor = "cyan", animated, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-2xl border border-white/10",
          glowColors[glowColor],
          animated && "animate-pulse",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlowBorder.displayName = "GlowBorder";

export { GlowBorder };

