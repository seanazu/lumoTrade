import { cn } from "@/lib/utils";

interface GlowBorderProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowBorder({ children, className, glowColor = "primary" }: GlowBorderProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg p-[1px]",
        "bg-gradient-to-br from-primary/50 via-primary/30 to-primary/50",
        "shadow-lg shadow-primary/20",
        className
      )}
    >
      <div className="relative bg-background rounded-lg">
        {children}
      </div>
    </div>
  );
}

