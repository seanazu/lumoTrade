import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-foreground/10 text-foreground",
        bullish: "border-transparent bg-[#4ecdc4]/10 text-[#4ecdc4]",
        bearish: "border-transparent bg-[#ff6b6b]/10 text-[#ff6b6b]",
        neutral: "border-transparent bg-muted text-muted-foreground",
        outline: "border-border text-foreground",
        violet: "border-transparent bg-violet-500/10 text-violet-500",
        magenta: "border-transparent bg-fuchsia-500/10 text-fuchsia-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

