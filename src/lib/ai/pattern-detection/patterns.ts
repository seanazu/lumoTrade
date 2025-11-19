export type PatternType =
  | 'cup_and_handle'
  | 'head_and_shoulders'
  | 'double_top'
  | 'double_bottom'
  | 'ascending_triangle'
  | 'descending_triangle'
  | 'bull_flag'
  | 'bear_flag'
  | 'breakout'
  | 'breakdown';

export interface Pattern {
  type: PatternType;
  confidence: number; // 0-100
  description: string;
  bullish: boolean;
  startIndex: number;
  endIndex: number;
  keyLevels?: {
    support?: number;
    resistance?: number;
    target?: number;
    stopLoss?: number;
  };
}

export interface PricePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const PATTERN_DESCRIPTIONS: Record<PatternType, string> = {
  cup_and_handle: 'Cup and Handle - Bullish continuation pattern',
  head_and_shoulders: 'Head and Shoulders - Bearish reversal pattern',
  double_top: 'Double Top - Bearish reversal at resistance',
  double_bottom: 'Double Bottom - Bullish reversal at support',
  ascending_triangle: 'Ascending Triangle - Bullish breakout setup',
  descending_triangle: 'Descending Triangle - Bearish breakdown setup',
  bull_flag: 'Bull Flag - Bullish continuation after strong move',
  bear_flag: 'Bear Flag - Bearish continuation after strong drop',
  breakout: 'Breakout - Price breaking above resistance',
  breakdown: 'Breakdown - Price breaking below support',
};

