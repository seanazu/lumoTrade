export interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  p0: number;
  p50: number;
  p90: number;
  high: number;
  low: number;
  volume: number;
}

export interface IndexAnalysis {
  symbol: string;
  trend: "bullish" | "bearish" | "neutral";
  support: number[];
  resistance: number[];
  macd: {
    value: number;
    signal: number;
    histogram: number;
    trend: "bullish" | "bearish";
  };
  rsi: number;
  volume: {
    current: number;
    average: number;
    anomaly: boolean;
  };
}

export const MOCK_INDEXES: IndexData[] = [
  {
    symbol: "^IXIC",
    name: "NASDAQ Composite",
    price: 16825.93,
    change: 145.25,
    changePercent: 0.87,
    p0: 16200,
    p50: 16825,
    p90: 17400,
    high: 16890.50,
    low: 16720.30,
    volume: 5234000000,
  },
  {
    symbol: "^DJI",
    name: "Dow Jones Industrial Average",
    price: 38475.60,
    change: -85.30,
    changePercent: -0.22,
    p0: 37800,
    p50: 38475,
    p90: 39200,
    high: 38520.80,
    low: 38390.20,
    volume: 385000000,
  },
  {
    symbol: "^GSPC",
    name: "S&P 500",
    price: 5048.42,
    change: 22.58,
    changePercent: 0.45,
    p0: 4900,
    p50: 5048,
    p90: 5200,
    high: 5065.30,
    low: 5032.10,
    volume: 3456000000,
  },
  {
    symbol: "^RUT",
    name: "Russell 2000",
    price: 2042.15,
    change: 8.45,
    changePercent: 0.42,
    p0: 1980,
    p50: 2042,
    p90: 2110,
    high: 2048.90,
    low: 2035.20,
    volume: 1234000000,
  },
];

export const MOCK_INDEX_ANALYSIS: Record<string, IndexAnalysis> = {
  "^IXIC": {
    symbol: "^IXIC",
    trend: "bullish",
    support: [16200, 15850, 15400],
    resistance: [17000, 17400, 17800],
    macd: {
      value: 85.3,
      signal: 72.1,
      histogram: 13.2,
      trend: "bullish",
    },
    rsi: 62.5,
    volume: {
      current: 5234000000,
      average: 4987000000,
      anomaly: false,
    },
  },
  "^DJI": {
    symbol: "^DJI",
    trend: "neutral",
    support: [37800, 37200, 36800],
    resistance: [38800, 39200, 39600],
    macd: {
      value: -15.2,
      signal: -12.8,
      histogram: -2.4,
      trend: "bearish",
    },
    rsi: 48.3,
    volume: {
      current: 385000000,
      average: 392000000,
      anomaly: false,
    },
  },
  "^GSPC": {
    symbol: "^GSPC",
    trend: "bullish",
    support: [4900, 4820, 4750],
    resistance: [5100, 5200, 5280],
    macd: {
      value: 42.5,
      signal: 38.2,
      histogram: 4.3,
      trend: "bullish",
    },
    rsi: 58.7,
    volume: {
      current: 3456000000,
      average: 3298000000,
      anomaly: false,
    },
  },
  "^RUT": {
    symbol: "^RUT",
    trend: "bullish",
    support: [1980, 1920, 1875],
    resistance: [2080, 2110, 2150],
    macd: {
      value: 18.6,
      signal: 15.3,
      histogram: 3.3,
      trend: "bullish",
    },
    rsi: 55.2,
    volume: {
      current: 1234000000,
      average: 1198000000,
      anomaly: false,
    },
  },
};

export interface MarketStory {
  title: string;
  summary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  importance: "high" | "medium" | "low";
  time: string;
  source: string;
}

export const MOCK_MARKET_STORIES: MarketStory[] = [
  {
    title: "Fed Signals Potential Rate Pause as Inflation Cools",
    summary: "Federal Reserve officials indicated willingness to maintain current interest rates as inflation data shows continued moderation. Markets rally on dovish tone.",
    sentiment: "bullish",
    importance: "high",
    time: "2h ago",
    source: "Federal Reserve",
  },
  {
    title: "Tech Sector Leads Market Higher on Strong Earnings",
    summary: "Major tech companies beat earnings expectations, driving NASDAQ to new highs. Cloud and AI segments showing exceptional growth.",
    sentiment: "bullish",
    importance: "high",
    time: "4h ago",
    source: "MarketWatch",
  },
  {
    title: "Treasury Yields Retreat as Bond Markets Stabilize",
    summary: "10-year Treasury yields pull back from recent highs, providing relief to equity markets and reducing recession concerns.",
    sentiment: "bullish",
    importance: "medium",
    time: "6h ago",
    source: "Bloomberg",
  },
];

export interface MarketPrediction {
  direction: "bullish" | "bearish" | "neutral";
  confidence: number;
  timeframe: string;
  keyFactors: string[];
  targets: {
    nasdaq: number;
    sp500: number;
    dow: number;
  };
  risks: string[];
}

export const MOCK_MARKET_PREDICTION: MarketPrediction = {
  direction: "bullish",
  confidence: 72,
  timeframe: "Next 1-2 weeks",
  keyFactors: [
    "Fed dovish pivot reducing rate hike expectations",
    "Strong earnings momentum in tech sector",
    "Cooling inflation supporting risk assets",
    "Improving investor sentiment and positioning",
    "Technical breakouts in major indexes",
  ],
  targets: {
    nasdaq: 17200,
    sp500: 5150,
    dow: 38900,
  },
  risks: [
    "Unexpected hawkish Fed comments",
    "Geopolitical tensions escalation",
    "Disappointing economic data",
  ],
};

