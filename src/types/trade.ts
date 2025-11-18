export type Timeframe = "day" | "swing" | "position";
export type Sentiment = "bullish" | "bearish" | "neutral";

export interface TradePlan {
  setup: string;
  entry: {
    min: number;
    max: number;
  };
  target: number[];
  stop: number;
  riskReward: number;
  confidence: number;
  timeHorizon: string;
  playbook: {
    bestCase: string;
    baseCase: string;
    invalidation: string;
  };
}

export interface AIInsight {
  sentiment: Sentiment;
  tldr: string[];
  drivers: string[];
  risks: string[];
  rating: number;
}

export interface TradeSetup {
  ticker: string;
  timeframe: Timeframe;
  plan: TradePlan;
  insight: AIInsight;
}

