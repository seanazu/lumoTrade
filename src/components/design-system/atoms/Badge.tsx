import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent-cyan/20 text-accent-cyan",
        bullish: "border-transparent bg-green-500/20 text-green-400",
        bearish: "border-transparent bg-red-500/20 text-red-400",
        neutral: "border-transparent bg-gray-500/20 text-gray-300",
        outline: "border-border-glow text-foreground",
        violet: "border-transparent bg-accent-violet/20 text-accent-violet",
        magenta: "border-transparent bg-accent-magenta/20 text-accent-magenta",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

