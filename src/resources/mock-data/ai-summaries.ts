import { AIInsight } from "@/types/trade";

export const MOCK_AI_SUMMARIES: Record<string, AIInsight> = {
  AAPL: {
    sentiment: "bullish",
    tldr: [
      "Strong earnings beat with Services revenue up 16% YoY",
      "New iPhone launch driving upgrade cycle momentum",
      "Vision Pro gaining traction in enterprise segment",
    ],
    drivers: [
      "Services segment showing resilient growth despite macro headwinds",
      "India market expansion accelerating (40% YoY growth)",
      "AI features in iOS driving higher ASPs",
      "Buyback program providing consistent support",
    ],
    risks: [
      "China regulatory uncertainty remains elevated",
      "Valuation at 28x forward P/E near historical highs",
    ],
    rating: 85,
  },
  TSLA: {
    sentiment: "neutral",
    tldr: [
      "Q3 deliveries missed estimates by 3%",
      "Cybertruck production ramping but margins compressed",
      "FSD subscription revenue growing but slower than expected",
    ],
    drivers: [
      "Energy storage business hitting record deployments",
      "Price cuts stabilizing, demand showing signs of recovery",
      "Austin/Berlin factories reaching target efficiency",
    ],
    risks: [
      "Intense competition from BYD and other Chinese EVs",
      "Margin pressure from incentives likely to continue",
      "Execution risk on robotaxi timeline promises",
    ],
    rating: 65,
  },
  NVDA: {
    sentiment: "bullish",
    tldr: [
      "Data center revenue up 279% YoY driven by AI demand",
      "H100/H200 supply constraints easing into Q4",
      "New Blackwell architecture seeing unprecedented pre-orders",
    ],
    drivers: [
      "Enterprise AI adoption accelerating across verticals",
      "Cloud providers expanding GPU capacity aggressively",
      "Software/services monetization gaining traction",
      "Sovereign AI demand creating new growth vector",
    ],
    risks: [
      "Competition from AMD and custom chips intensifying",
      "Concentration risk with top 4 customers at 40% of revenue",
    ],
    rating: 92,
  },
  SPY: {
    sentiment: "neutral",
    tldr: [
      "S&P 500 consolidating near all-time highs",
      "Earnings season showing resilient corporate profits",
      "Fed signaling potential pause in hiking cycle",
    ],
    drivers: [
      "Strong jobs data supporting soft landing narrative",
      "Tech sector leadership continuing into Q4",
      "Seasonality turning favorable into year-end",
    ],
    risks: [
      "Valuation stretched with forward P/E at 19x",
      "Rising bond yields creating competition for equity flows",
    ],
    rating: 70,
  },
};

export const getAISummary = (ticker: string): AIInsight => {
  return (
    MOCK_AI_SUMMARIES[ticker.toUpperCase()] || {
      sentiment: "neutral",
      tldr: ["No AI analysis available for this ticker"],
      drivers: [],
      risks: [],
      rating: 50,
    }
  );
};

