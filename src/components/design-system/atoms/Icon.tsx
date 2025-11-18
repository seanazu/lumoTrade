import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface IconProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  size?: number;
  glow?: boolean;
}

const Icon = React.forwardRef<HTMLDivElement, IconProps>(
  ({ icon: IconComponent, size = 20, glow, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center justify-center", className)}
        {...props}
      >
        <IconComponent
          size={size}
          className={cn(glow && "text-accent-cyan glow-text")}
        />
      </div>
    );
  }
);
Icon.displayName = "Icon";

export { Icon };

