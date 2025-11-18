import { Timeframe } from "@/types/trade";
import { ChartTimeframe } from "@/types/chart";

export const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "day", label: "Day Trade" },
  { value: "swing", label: "Swing" },
  { value: "position", label: "Position" },
];

export const CHART_TIMEFRAMES: { value: ChartTimeframe; label: string }[] = [
  { value: "1D", label: "1D" },
  { value: "5D", label: "5D" },
  { value: "1M", label: "1M" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1Y" },
];

