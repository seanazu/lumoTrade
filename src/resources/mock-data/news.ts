import { Sentiment } from "@/types/trade";

export interface NewsItem {
  source: string;
  headline: string;
  sentiment: Sentiment;
  tag: string;
  time: string;
  summary: string;
  url: string;
}

export const MOCK_NEWS: Record<string, NewsItem[]> = {
  AAPL: [
    {
      source: "Bloomberg",
      headline: "Apple Services Revenue Beats Estimates on Strong App Store Growth",
      sentiment: "bullish",
      tag: "Earnings",
      time: "2h ago",
      summary: "Apple's Services segment reported 16% YoY growth, beating analyst estimates. App Store and Apple Music drove the upside.",
      url: "#",
    },
    {
      source: "Reuters",
      headline: "Vision Pro Pre-Orders Exceed Expectations, Supply Constrained",
      sentiment: "bullish",
      tag: "Product",
      time: "5h ago",
      summary: "Apple's Vision Pro headset seeing strong demand with initial inventory sold out. Production scaling up for broader launch.",
      url: "#",
    },
    {
      source: "WSJ",
      headline: "China Regulatory Concerns Weigh on Apple Outlook",
      sentiment: "bearish",
      tag: "Regulatory",
      time: "1d ago",
      summary: "New restrictions on iPhone use in government offices raise concerns about Apple's China exposure.",
      url: "#",
    },
  ],
  TSLA: [
    {
      source: "CNBC",
      headline: "Tesla Q3 Deliveries Miss Estimates, Price Cuts Continue",
      sentiment: "bearish",
      tag: "Deliveries",
      time: "3h ago",
      summary: "Tesla delivered 435K vehicles in Q3, missing consensus of 449K. Company announced additional price cuts in China.",
      url: "#",
    },
    {
      source: "Bloomberg",
      headline: "Energy Storage Business Hits Record Deployments",
      sentiment: "bullish",
      tag: "Business Update",
      time: "6h ago",
      summary: "Tesla's energy storage division deployed 4.0 GWh in Q3, up 90% YoY, becoming a significant profit contributor.",
      url: "#",
    },
  ],
  NVDA: [
    {
      source: "Reuters",
      headline: "NVIDIA Data Center Revenue Surges 279% on AI Chip Demand",
      sentiment: "bullish",
      tag: "Earnings",
      time: "1h ago",
      summary: "Data center segment revenue reached $14.5B, far exceeding estimates. H100 GPUs remain in short supply.",
      url: "#",
    },
    {
      source: "The Information",
      headline: "Blackwell Architecture Pre-Orders Reach $10B, Sources Say",
      sentiment: "bullish",
      tag: "Product",
      time: "4h ago",
      summary: "NVIDIA's next-gen Blackwell GPUs seeing unprecedented demand from cloud providers and enterprises.",
      url: "#",
    },
    {
      source: "WSJ",
      headline: "AMD and Custom Chips Pose Growing Threat to NVIDIA Dominance",
      sentiment: "bearish",
      tag: "Competition",
      time: "1d ago",
      summary: "AMD gaining AI chip market share while hyperscalers develop in-house alternatives to NVIDIA GPUs.",
      url: "#",
    },
  ],
  SPY: [
    {
      source: "MarketWatch",
      headline: "S&P 500 Consolidates Near All-Time Highs as Earnings Season Begins",
      sentiment: "neutral",
      tag: "Market",
      time: "2h ago",
      summary: "Major indexes trading sideways ahead of key tech earnings. Bond yields stabilizing after recent surge.",
      url: "#",
    },
    {
      source: "Bloomberg",
      headline: "Fed Officials Signal Willingness to Hold Rates Steady",
      sentiment: "bullish",
      tag: "Fed",
      time: "5h ago",
      summary: "Multiple Fed speakers indicate satisfaction with current policy stance, reducing odds of further hikes.",
      url: "#",
    },
  ],
};

export const getNews = (ticker: string): NewsItem[] => {
  return MOCK_NEWS[ticker.toUpperCase()] || [];
};

