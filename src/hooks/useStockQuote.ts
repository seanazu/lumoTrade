/**
 * Stock Quote Hook
 * Fetches real-time quote data for a specific stock
 */

import { useQuery } from '@tanstack/react-query';

interface StockQuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  previousClose: number;
  source: string;
}

interface StockQuoteResponse {
  success: boolean;
  data?: StockQuoteData;
  cached?: boolean;
  source?: string;
  timestamp: number;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Fetch stock quote from API
 */
async function fetchStockQuote(symbol: string): Promise<StockQuoteData> {
  if (!symbol) {
    throw new Error('Symbol is required');
  }

  const response = await fetch(`/api/stock/quote/${symbol}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const json: StockQuoteResponse = await response.json();
    throw new Error(json.error?.message || `HTTP ${response.status}`);
  }

  const json: StockQuoteResponse = await response.json();

  if (!json.success || !json.data) {
    throw new Error(json.error?.message || 'Failed to fetch stock quote');
  }

  return json.data;
}

/**
 * Hook to fetch and manage stock quote data
 * 
 * Features:
 * - Auto-refresh every 30 seconds when enabled
 * - Smart caching
 * - Automatic retry on failure
 * - Can be disabled for inactive stocks
 * 
 * @param symbol - Stock symbol to fetch
 * @param options - Hook options
 * @returns Stock quote data with loading and error states
 */
export function useStockQuote(
  symbol: string,
  options: {
    enabled?: boolean;
    refetchInterval?: number;
  } = {}
) {
  const {
    enabled = true,
    refetchInterval = 30 * 1000, // Default: 30 seconds
  } = options;

  return useQuery({
    queryKey: ['stock', 'quote', symbol],
    queryFn: () => fetchStockQuote(symbol),
    enabled: enabled && !!symbol,
    staleTime: 20 * 1000, // Consider data stale after 20 seconds
    refetchInterval: enabled ? refetchInterval : false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
    retryDelay: 1000,
  });
}

