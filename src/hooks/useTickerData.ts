import { useQuery } from "@tanstack/react-query";
import { Ticker } from "@/types/ticker";
import { AIInsight, TradePlan, Timeframe } from "@/types/trade";
import { getTickerBySymbol } from "@/resources/mock-data/tickers";
import { getAISummary } from "@/resources/mock-data/ai-summaries";
import { getTradePlan } from "@/resources/mock-data/trade-plans";
import { getCatalysts } from "@/resources/mock-data/catalysts";
import { getMetrics } from "@/resources/mock-data/metrics";
import { getNews } from "@/resources/mock-data/news";

/**
 * Custom hook to fetch all ticker data
 */
export function useTickerData(ticker: string, timeframe: Timeframe = "swing") {
  return useQuery({
    queryKey: ["ticker", ticker, timeframe],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const tickerData = getTickerBySymbol(ticker);
      if (!tickerData) {
        throw new Error(`Ticker ${ticker} not found`);
      }

      const aiSummary = getAISummary(ticker);
      const tradePlan = getTradePlan(ticker, timeframe);
      const catalysts = getCatalysts(ticker);
      const metrics = getMetrics(ticker);
      const news = getNews(ticker);

      return {
        ticker: tickerData,
        aiSummary,
        tradePlan,
        catalysts,
        metrics,
        news,
      };
    },
    enabled: !!ticker,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to fetch just ticker info
 */
export function useTickerInfo(ticker: string) {
  return useQuery({
    queryKey: ["ticker-info", ticker],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return getTickerBySymbol(ticker);
    },
    enabled: !!ticker,
  });
}

