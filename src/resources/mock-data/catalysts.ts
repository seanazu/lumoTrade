import { ChartEvent } from "@/types/chart";

export interface Catalyst {
  type: "earnings" | "dividend" | "pr" | "macro";
  label: string;
  date: string;
  description: string;
}

export const MOCK_CATALYSTS: Record<string, Catalyst[]> = {
  AAPL: [
    {
      type: "earnings",
      label: "Q4 Earnings",
      date: "Jan 30",
      description: "Expected EPS $2.10, Revenue $117.9B. Focus on iPhone 15 sales and Services growth.",
    },
    {
      type: "pr",
      label: "Vision Pro Launch",
      date: "Feb 2",
      description: "Official retail launch of Vision Pro. Early reviews and adoption data will be key.",
    },
    {
      type: "dividend",
      label: "Ex-Dividend",
      date: "Feb 9",
      description: "$0.24 per share dividend payment",
    },
  ],
  TSLA: [
    {
      type: "earnings",
      label: "Q4 Earnings",
      date: "Jan 24",
      description: "Expected EPS $0.73, Revenue $25.8B. Cybertruck margins and FSD updates in focus.",
    },
    {
      type: "pr",
      label: "Autonomy Day",
      date: "Mar 15",
      description: "Major announcement on Full Self-Driving and robotaxi network timeline.",
    },
  ],
  NVDA: [
    {
      type: "earnings",
      label: "Q4 Earnings",
      date: "Feb 21",
      description: "Expected EPS $4.59, Revenue $20.4B. Data center guidance will be critical.",
    },
    {
      type: "pr",
      label: "GTC Conference",
      date: "Mar 18",
      description: "GPU Technology Conference - Blackwell architecture deep dive expected.",
    },
  ],
  SPY: [
    {
      type: "macro",
      label: "FOMC Meeting",
      date: "Jan 31",
      description: "Federal Reserve interest rate decision. Markets pricing in hold at 5.25-5.50%.",
    },
    {
      type: "macro",
      label: "CPI Report",
      date: "Feb 13",
      description: "January inflation data. Key indicator for Fed policy path.",
    },
  ],
};

export const getCatalysts = (ticker: string): Catalyst[] => {
  return MOCK_CATALYSTS[ticker.toUpperCase()] || [];
};

export const getChartEvents = (ticker: string): ChartEvent[] => {
  const catalysts = getCatalysts(ticker);
  return catalysts.map((c, index) => ({
    timestamp: Date.now() + index * 7 * 24 * 60 * 60 * 1000,
    type: c.type,
    label: c.label,
    description: c.description,
  }));
};

