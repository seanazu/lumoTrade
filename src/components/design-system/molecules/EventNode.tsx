import { forwardRef, type HTMLAttributes } from "react";
import { Calendar, DollarSign, Megaphone, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export type EventType = "earnings" | "dividend" | "pr" | "macro";

export interface EventNodeProps extends HTMLAttributes<HTMLDivElement> {
  type: EventType;
  label: string;
  date: string;
  description?: string;
  isToday?: boolean;
}

const eventIcons = {
  earnings: TrendingUp,
  dividend: DollarSign,
  pr: Megaphone,
  macro: Calendar,
};

const EventNode = forwardRef<HTMLDivElement, EventNodeProps>(
  (
    { type, label, date, description, isToday, className, ...props },
    ref
  ) => {
    const IconComponent = eventIcons[type];

    return (
      <TooltipPrimitive.Provider>
        <TooltipPrimitive.Root>
          <TooltipPrimitive.Trigger asChild>
            <div
              ref={ref}
              className={cn(
                "flex flex-col items-center gap-2 min-w-[80px]",
                className
              )}
              {...props}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  isToday
                    ? "bg-accent-cyan border-accent-cyan glow-border"
                    : "bg-bg-secondary border-white/10 hover:border-accent-cyan/50"
                )}
              >
                <IconComponent
                  className={cn(
                    "h-5 w-5",
                    isToday ? "text-bg-primary" : "text-accent-cyan"
                  )}
                />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{date}</p>
              </div>
            </div>
          </TooltipPrimitive.Trigger>
          {description && (
            <TooltipPrimitive.Portal>
              <TooltipPrimitive.Content
                className="glass-card px-3 py-2 max-w-[250px]"
                sideOffset={5}
              >
                <p className="text-sm">{description}</p>
                <TooltipPrimitive.Arrow className="fill-bg-secondary" />
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          )}
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    );
  }
);
EventNode.displayName = "EventNode";

export { EventNode };

