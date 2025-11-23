import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  gradient?: boolean;
  hover?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ gradient, hover, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base glass card styles
          "rounded-lg border p-6",
          // Light mode - Minimal clean
          "bg-white border-black/[0.08]",
          "shadow-[0_0_0_1px_rgba(0,0,0,0.05)]",
          // Dark mode - Cool modern
          "dark:bg-white/[0.05] dark:border-white/[0.1]",
          "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]",
          // Hover effects
          hover && "transition-all duration-200",
          hover && "hover:border-black/[0.12] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.08)]",
          hover && "dark:hover:border-white/[0.15] dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15)]",
          // Gradient - very subtle
          gradient && "bg-gradient-to-br from-white via-white to-gray-50/30",
          gradient && "dark:from-white/[0.03] dark:via-white/[0.05] dark:to-white/[0.03]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

export { GlassCard };

