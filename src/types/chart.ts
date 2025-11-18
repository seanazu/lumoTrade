export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartZone {
  type: "entry" | "target" | "stop";
  min: number;
  max: number;
  color: string;
}

export interface ChartEvent {
  timestamp: number;
  type: "earnings" | "dividend" | "pr" | "macro";
  label: string;
  description: string;
}

export type ChartTimeframe = "1D" | "5D" | "1M" | "6M" | "1Y";
export type ChartIndicator = "MA" | "VWAP" | "RSI" | "MACD";

