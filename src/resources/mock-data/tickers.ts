import { Ticker, TickerSearchResult } from "@/types/ticker";

export const MOCK_TICKERS: Ticker[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    exchange: "NASDAQ",
    sector: "Technology",
    price: 178.25,
    change: 2.35,
    changePercent: 1.34,
    volume: 58_234_567,
    avgVolume: 52_000_000,
    marketCap: 2_800_000_000_000,
    float: 15_500_000_000,
    shortInterest: 0.8,
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    exchange: "NASDAQ",
    sector: "Automotive",
    price: 242.15,
    change: -5.80,
    changePercent: -2.34,
    volume: 125_456_789,
    avgVolume: 110_000_000,
    marketCap: 765_000_000_000,
    float: 3_200_000_000,
    shortInterest: 3.2,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    exchange: "NASDAQ",
    sector: "Technology",
    price: 485.60,
    change: 12.45,
    changePercent: 2.63,
    volume: 42_345_678,
    avgVolume: 45_000_000,
    marketCap: 1_200_000_000_000,
    float: 2_450_000_000,
    shortInterest: 1.2,
  },
  {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    exchange: "NYSE",
    sector: "ETF",
    price: 455.82,
    change: 1.23,
    changePercent: 0.27,
    volume: 78_234_567,
    avgVolume: 80_000_000,
    marketCap: 0,
    float: 0,
  },
];

export const TICKER_SEARCH_RESULTS: TickerSearchResult[] = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms, Inc.", exchange: "NASDAQ" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", exchange: "NYSE" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", exchange: "NASDAQ" },
];

export const getTickerBySymbol = (symbol: string): Ticker | undefined => {
  return MOCK_TICKERS.find(
    (t) => t.symbol.toUpperCase() === symbol.toUpperCase()
  );
};

export const searchTickers = (query: string): TickerSearchResult[] => {
  if (!query) return TICKER_SEARCH_RESULTS.slice(0, 5);

  const upperQuery = query.toUpperCase();
  return TICKER_SEARCH_RESULTS.filter(
    (t) =>
      t.symbol.toUpperCase().includes(upperQuery) ||
      t.name.toUpperCase().includes(upperQuery)
  ).slice(0, 5);
};

