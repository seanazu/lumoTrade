import { ChartIndicator } from "@/types/chart";

export const INDICATORS: { value: ChartIndicator; label: string }[] = [
  { value: "MA", label: "Moving Average" },
  { value: "VWAP", label: "VWAP" },
  { value: "RSI", label: "RSI" },
  { value: "MACD", label: "MACD" },
];

