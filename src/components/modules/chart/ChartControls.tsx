"use client";

import { type FC } from "react";
import { Pill } from "@/components/design-system/atoms/Pill";
import { ChartTimeframe } from "@/types/chart";
import { CHART_TIMEFRAMES } from "@/resources/constants/timeframes";
import { INDICATORS } from "@/resources/constants/indicators";

interface ChartControlsProps {
  timeframe: ChartTimeframe;
  onTimeframeChange: (timeframe: ChartTimeframe) => void;
  selectedIndicators: string[];
  onIndicatorsChange: (indicators: string[]) => void;
}

const ChartControls: FC<ChartControlsProps> = ({
  timeframe,
  onTimeframeChange,
  selectedIndicators,
  onIndicatorsChange,
}) => {
  const toggleIndicator = (indicator: string) => {
    if (selectedIndicators.includes(indicator)) {
      onIndicatorsChange(selectedIndicators.filter((i) => i !== indicator));
    } else {
      onIndicatorsChange([...selectedIndicators, indicator]);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex gap-2">
        {CHART_TIMEFRAMES.map((tf) => (
          <Pill
            key={tf.value}
            active={timeframe === tf.value}
            onClick={() => onTimeframeChange(tf.value)}
          >
            {tf.label}
          </Pill>
        ))}
      </div>

      <div className="flex gap-2">
        {INDICATORS.map((ind) => (
          <Pill
            key={ind.value}
            active={selectedIndicators.includes(ind.value)}
            onClick={() => toggleIndicator(ind.value)}
          >
            {ind.value}
          </Pill>
        ))}
      </div>
    </div>
  );
};

export { ChartControls };

