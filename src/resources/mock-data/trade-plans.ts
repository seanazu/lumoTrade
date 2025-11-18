import { TradePlan, Timeframe } from "@/types/trade";

type TradePlansByTimeframe = Record<Timeframe, TradePlan>;

export const MOCK_TRADE_PLANS: Record<string, TradePlansByTimeframe> = {
  AAPL: {
    day: {
      setup: "Opening Range Breakout",
      entry: { min: 177.50, max: 178.00 },
      target: [179.50, 180.75],
      stop: 176.80,
      riskReward: 2.8,
      confidence: 72,
      timeHorizon: "Intraday",
      playbook: {
        bestCase: "Clean break above 178 with volume, ride to 180.75 resistance",
        baseCase: "Target 1 at 179.50, take half off and trail stop",
        invalidation: "Break below 176.80 or failure to hold opening range",
      },
    },
    swing: {
      setup: "Pullback to Support",
      entry: { min: 175.00, max: 177.00 },
      target: [182.00, 185.50],
      stop: 172.50,
      riskReward: 3.4,
      confidence: 78,
      timeHorizon: "1-3 weeks",
      playbook: {
        bestCase: "Bounce from 175 support, momentum back to ATH at 185.50",
        baseCase: "Rally to 182 resistance, consolidate before next leg",
        invalidation: "Close below 172.50 or breakdown of uptrend channel",
      },
    },
    position: {
      setup: "Earnings Momentum Play",
      entry: { min: 175.00, max: 180.00 },
      target: [195.00, 205.00],
      stop: 167.00,
      riskReward: 2.5,
      confidence: 68,
      timeHorizon: "1-3 months",
      playbook: {
        bestCase: "Services beat drives multiple expansion to $205",
        baseCase: "Gradual grind to $195 on earnings certainty",
        invalidation: "Break below 200-day MA at 167 or earnings miss",
      },
    },
  },
  TSLA: {
    day: {
      setup: "Mean Reversion Fade",
      entry: { min: 241.00, max: 243.00 },
      target: [238.50, 236.00],
      stop: 245.50,
      riskReward: 2.1,
      confidence: 65,
      timeHorizon: "Intraday",
      playbook: {
        bestCase: "Fade the gap up, revert to VWAP at 236",
        baseCase: "Scalp to 238.50 and reassess",
        invalidation: "Break above 245.50 with momentum",
      },
    },
    swing: {
      setup: "Range Bounce",
      entry: { min: 235.00, max: 240.00 },
      target: [255.00, 268.00],
      stop: 228.00,
      riskReward: 2.8,
      confidence: 70,
      timeHorizon: "1-2 weeks",
      playbook: {
        bestCase: "Break above range at 255, squeeze to 268 resistance",
        baseCase: "Bounce to mid-range 255 and consolidate",
        invalidation: "Loss of 228 support breaks range structure",
      },
    },
    position: {
      setup: "Delivery Beat Catalyst",
      entry: { min: 230.00, max: 245.00 },
      target: [280.00, 305.00],
      stop: 215.00,
      riskReward: 2.7,
      confidence: 62,
      timeHorizon: "1-2 months",
      playbook: {
        bestCase: "Q4 delivery surprise + margin recovery to $305",
        baseCase: "Gradual recovery to $280 on improving sentiment",
        invalidation: "Break below 215 or delivery miss",
      },
    },
  },
  NVDA: {
    day: {
      setup: "Momentum Continuation",
      entry: { min: 484.00, max: 486.00 },
      target: [492.00, 496.50],
      stop: 481.00,
      riskReward: 3.1,
      confidence: 80,
      timeHorizon: "Intraday",
      playbook: {
        bestCase: "Clean breakout above 486, momentum to 496.50",
        baseCase: "Grind to 492 and take profits",
        invalidation: "Loss of 481 or failed breakout",
      },
    },
    swing: {
      setup: "Breakout Continuation",
      entry: { min: 480.00, max: 488.00 },
      target: [510.00, 525.00],
      stop: 472.00,
      riskReward: 3.5,
      confidence: 82,
      timeHorizon: "2-3 weeks",
      playbook: {
        bestCase: "AI hype continues, run to new ATH at 525",
        baseCase: "Test 510 resistance and consolidate",
        invalidation: "Break below 472 or failed breakout structure",
      },
    },
    position: {
      setup: "AI Supercycle Theme",
      entry: { min: 470.00, max: 490.00 },
      target: [550.00, 600.00],
      stop: 440.00,
      riskReward: 3.0,
      confidence: 75,
      timeHorizon: "2-4 months",
      playbook: {
        bestCase: "Blackwell ramp exceeds expectations, $600+ target",
        baseCase: "Steady climb to $550 on AI tailwinds",
        invalidation: "Break below 440 or competitive threats materialize",
      },
    },
  },
  SPY: {
    day: {
      setup: "Bull Flag Pattern",
      entry: { min: 455.00, max: 456.00 },
      target: [458.50, 460.00],
      stop: 453.50,
      riskReward: 2.5,
      confidence: 68,
      timeHorizon: "Intraday",
      playbook: {
        bestCase: "Flag breaks higher, gap fill to 460",
        baseCase: "Grind to 458.50 and take profits",
        invalidation: "Break below 453.50 or reversal pattern",
      },
    },
    swing: {
      setup: "Consolidation Breakout",
      entry: { min: 452.00, max: 456.00 },
      target: [464.00, 470.00],
      stop: 448.00,
      riskReward: 2.8,
      confidence: 72,
      timeHorizon: "1-2 weeks",
      playbook: {
        bestCase: "Break above consolidation, run to 470",
        baseCase: "Test 464 and pause for next leg",
        invalidation: "Break below 448 support level",
      },
    },
    position: {
      setup: "Year-End Rally",
      entry: { min: 450.00, max: 458.00 },
      target: [475.00, 485.00],
      stop: 438.00,
      riskReward: 2.6,
      confidence: 70,
      timeHorizon: "1-2 months",
      playbook: {
        bestCase: "Seasonal tailwinds + soft landing = 485",
        baseCase: "Steady climb to 475 into year-end",
        invalidation: "Break below 438 or recession fears escalate",
      },
    },
  },
};

export const getTradePlan = (
  ticker: string,
  timeframe: Timeframe
): TradePlan | null => {
  const plans = MOCK_TRADE_PLANS[ticker.toUpperCase()];
  return plans?.[timeframe] || null;
};

