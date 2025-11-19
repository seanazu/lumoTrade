import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface PillProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

const Pill = forwardRef<HTMLDivElement, PillProps>(
  ({ className, active, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer active:scale-95",
          active
            ? "bg-primary/20 text-primary border border-primary/50 shadow-sm shadow-primary/20"
            : "bg-secondary text-muted-foreground border border-border hover:border-primary/30 hover:bg-primary/10 hover:text-primary hover:shadow-sm",
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

