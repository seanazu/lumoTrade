/**
 * Market Indexes Hook
 * Fetches real-time data for major market indexes
 */

import { useQuery } from '@tanstack/react-query';
import { IndexData } from '@/resources/mock-data/indexes';

interface MarketIndexesResponse {
  success: boolean;
  data: IndexData[];
  cached?: boolean;
  source?: string;
  timestamp: number;
  error?: string;
}

/**
 * Fetch market indexes from API
 */
async function fetchMarketIndexes(): Promise<IndexData[]> {
  const response = await fetch('/api/market/indexes', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const json: MarketIndexesResponse = await response.json();

  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch market indexes');
  }

  return json.data;
}

/**
 * Hook to fetch and manage market indexes data
 * 
 * Features:
 * - Auto-refresh every 30 seconds during market hours
 * - Auto-refresh every 5 minutes outside market hours
 * - Smart caching with React Query
 * - Automatic retry on failure
 * 
 * @returns Market indexes data with loading and error states
 */
export function useMarketIndexes() {
  const isMarketHours = checkMarketHours();
  
  // Refresh interval: 30s during market hours, 5min otherwise
  const refetchInterval = isMarketHours ? 30 * 1000 : 5 * 60 * 1000;

  return useQuery({
    queryKey: ['market', 'indexes'],
    queryFn: fetchMarketIndexes,
    staleTime: 20 * 1000, // Consider data stale after 20 seconds
    refetchInterval, // Auto-refresh
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Refetch on component mount
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

/**
 * Check if current time is during market hours (9:30 AM - 4:00 PM ET, Mon-Fri)
 * This is a simple approximation - production would use more sophisticated logic
 */
function checkMarketHours(): boolean {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  // Weekend check
  if (day === 0 || day === 6) {
    return false;
  }

  // Rough market hours check (9 AM - 4 PM local time as proxy)
  // In production, you'd convert to ET timezone properly
  return hour >= 9 && hour < 16;
}

