/**
 * Market News Hook
 * Fetches latest market news with sentiment analysis
 */

import { useQuery } from '@tanstack/react-query';
import { MarketStory } from '@/resources/mock-data/indexes';

interface MarketNewsResponse {
  success: boolean;
  data: MarketStory[];
  cached?: boolean;
  source?: string;
  timestamp: number;
  error?: string;
}

/**
 * Fetch market news from API
 */
async function fetchMarketNews(limit: number = 10): Promise<MarketStory[]> {
  const response = await fetch(`/api/market/news?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const json: MarketNewsResponse = await response.json();

  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch market news');
  }

  return json.data;
}

/**
 * Hook to fetch and manage market news
 * 
 * Features:
 * - Auto-refresh every 5 minutes
 * - Smart caching
 * - Automatic retry on failure
 * 
 * @param limit - Number of news articles to fetch (default: 10)
 * @returns Market news data with loading and error states
 */
export function useMarketNews(limit: number = 10) {
  return useQuery({
    queryKey: ['market', 'news', limit],
    queryFn: () => fetchMarketNews(limit),
    staleTime: 4 * 60 * 1000, // Consider data stale after 4 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: false, // Don't refetch on every mount (news doesn't change that fast)
    retry: 2, // Retry failed requests 2 times
    retryDelay: 2000, // Wait 2 seconds between retries
  });
}

