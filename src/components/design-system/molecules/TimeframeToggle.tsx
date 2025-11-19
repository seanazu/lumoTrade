import { type FC } from "react";
import { Pill } from "../atoms/Pill";
import { cn } from "@/lib/utils";

export type Timeframe = "day" | "swing" | "position";

export interface TimeframeToggleProps {
  value: Timeframe;
  onChange: (value: Timeframe) => void;
  className?: string;
}

const timeframes: { value: Timeframe; label: string }[] = [
  { value: "day", label: "Day Trade" },
  { value: "swing", label: "Swing" },
  { value: "position", label: "Position" },
];

const TimeframeToggle: FC<TimeframeToggleProps> = ({
  value,
  onChange,
  className,
}) => {
  return (
    <div className={cn("flex gap-2", className)}>
      {timeframes.map((timeframe) => (
        <Pill
          key={timeframe.value}
          active={value === timeframe.value}
          onClick={() => onChange(timeframe.value)}
        >
          {timeframe.label}
        </Pill>
      ))}
    </div>
  );
};

export { TimeframeToggle };

