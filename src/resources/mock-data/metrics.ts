export interface MetricData {
  label: string;
  value: string;
  change?: number;
  sparkline?: number[];
}

export const MOCK_METRICS: Record<string, MetricData[]> = {
  AAPL: [
    {
      label: "Market Cap",
      value: "$2.80T",
    },
    {
      label: "1D Performance",
      value: "+1.34%",
      change: 1.34,
      sparkline: [0.2, 0.5, 0.8, 1.1, 1.34],
    },
    {
      label: "5D Performance",
      value: "+3.24%",
      change: 3.24,
      sparkline: [0, 0.8, 1.5, 2.1, 3.24],
    },
    {
      label: "Volume vs Avg",
      value: "112%",
      change: 12,
      sparkline: [100, 98, 105, 110, 112],
    },
    {
      label: "Short Interest",
      value: "0.8%",
    },
  ],
  TSLA: [
    {
      label: "Market Cap",
      value: "$765B",
    },
    {
      label: "1D Performance",
      value: "-2.34%",
      change: -2.34,
      sparkline: [0, -0.5, -1.2, -1.8, -2.34],
    },
    {
      label: "5D Performance",
      value: "-5.67%",
      change: -5.67,
      sparkline: [0, -1.5, -3.2, -4.5, -5.67],
    },
    {
      label: "Volume vs Avg",
      value: "114%",
      change: 14,
      sparkline: [100, 105, 108, 112, 114],
    },
    {
      label: "Short Interest",
      value: "3.2%",
    },
  ],
  NVDA: [
    {
      label: "Market Cap",
      value: "$1.20T",
    },
    {
      label: "1D Performance",
      value: "+2.63%",
      change: 2.63,
      sparkline: [0, 0.8, 1.5, 2.1, 2.63],
    },
    {
      label: "5D Performance",
      value: "+7.42%",
      change: 7.42,
      sparkline: [0, 2.1, 4.3, 5.8, 7.42],
    },
    {
      label: "Volume vs Avg",
      value: "94%",
      change: -6,
      sparkline: [100, 98, 95, 94, 94],
    },
    {
      label: "Short Interest",
      value: "1.2%",
    },
  ],
  SPY: [
    {
      label: "Market Cap",
      value: "ETF",
    },
    {
      label: "1D Performance",
      value: "+0.27%",
      change: 0.27,
      sparkline: [0, 0.1, 0.15, 0.22, 0.27],
    },
    {
      label: "5D Performance",
      value: "+1.12%",
      change: 1.12,
      sparkline: [0, 0.3, 0.6, 0.9, 1.12],
    },
    {
      label: "Volume vs Avg",
      value: "98%",
      change: -2,
      sparkline: [100, 99, 98, 98, 98],
    },
    {
      label: "Short Interest",
      value: "N/A",
    },
  ],
};

export const getMetrics = (ticker: string): MetricData[] => {
  return MOCK_METRICS[ticker.toUpperCase()] || [];
};

