/**
 * Polygon.io API Client
 * Real-time and historical market data
 * Documentation: https://polygon.io/docs/stocks/getting-started
 */

import { apiConfig, isPolygonConfigured } from "../config";
import { PolygonTickerSnapshot, PolygonAggregateBar, ApiError } from "../types";
import { fetchWithRetry, buildUrl, createApiError } from "../utils/http-client";
import { rateLimiter, rateLimitConfigs } from "../utils/rate-limiter";
import { cache, cacheKeys } from "../utils/cache";

// Index symbol mapping (Polygon uses different formats)
const INDEX_SYMBOL_MAP: Record<string, string> = {
  "^GSPC": "I:SPX", // S&P 500
  "^DJI": "I:DJI", // Dow Jones
  "^IXIC": "I:NDX", // NASDAQ Composite
  "^RUT": "I:RUT", // Russell 2000
};

class PolygonClient {
  private baseUrl = apiConfig.polygon.baseUrl;
  private apiKey = apiConfig.polygon.apiKey;

  /**
   * Check if client is configured
   */
  isConfigured(): boolean {
    return isPolygonConfigured();
  }

  /**
   * Get real-time snapshot for a ticker
   * @param ticker - Stock or index ticker
   * @returns Snapshot data with price, volume, and daily changes
   */
  async getSnapshot(ticker: string): Promise<PolygonTickerSnapshot | null> {
    if (!this.isConfigured()) {
      console.warn("Polygon API not configured. Using cached/mock data.");
      return null;
    }

    // Check cache first
    const cacheKey = cacheKeys.indexQuote(ticker);
    const cached = cache.get<PolygonTickerSnapshot>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check rate limit
    const allowed = await rateLimiter.checkLimit(
      "polygon",
      rateLimitConfigs.polygon
    );
    if (!allowed) {
      console.warn("Polygon rate limit exceeded. Using cached data.");
      return null;
    }

    // For indices, use the previous day bar endpoint (more reliable)
    if (ticker.startsWith("^")) {
      return this.getSnapshotFromPrevDay(ticker);
    }

    // For stocks, use the snapshot endpoint
    try {
      const url = buildUrl(
        `${this.baseUrl}/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}`,
        { apiKey: this.apiKey }
      );

      interface SnapshotResponse {
        status: string;
        ticker: PolygonTickerSnapshot;
      }

      const response = await fetchWithRetry<SnapshotResponse>(url, {
        timeout: 5000,
        retries: 2,
      });

      if (response.status === "OK" && response.ticker) {
        // Cache for 30 seconds
        cache.set(cacheKey, response.ticker, 30);
        return response.ticker;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching Polygon snapshot for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Get snapshot data from previous day bar (used for indices)
   * @param ticker - Index ticker (e.g., ^GSPC)
   * @returns Snapshot-like data from previous day bar
   */
  private async getSnapshotFromPrevDay(
    ticker: string
  ): Promise<PolygonTickerSnapshot | null> {
    const polygonTicker = INDEX_SYMBOL_MAP[ticker] || ticker;

    try {
      const url = buildUrl(
        `${this.baseUrl}/v2/aggs/ticker/${polygonTicker}/prev`,
        {
          adjusted: true,
          apiKey: this.apiKey,
        }
      );

      interface AggregateResponse {
        status: string;
        ticker: string;
        results?: Array<{
          T: string;
          v: number;
          o: number;
          c: number;
          h: number;
          l: number;
          t: number;
        }>;
      }

      const response = await fetchWithRetry<AggregateResponse>(url, {
        timeout: 5000,
        retries: 2,
      });

      if (
        response.status === "OK" &&
        response.results &&
        response.results.length > 0
      ) {
        const bar = response.results[0];
        const change = bar.c - bar.o;
        const changePerc = (change / bar.o) * 100;

        // Convert to snapshot format
        const snapshot: PolygonTickerSnapshot = {
          ticker: ticker,
          todaysChangePerc: changePerc,
          todaysChange: change,
          updated: bar.t,
          day: {
            o: bar.o,
            h: bar.h,
            l: bar.l,
            c: bar.c,
            v: bar.v,
            vw: bar.c, // Use close as volume weighted
          },
          min: {
            c: bar.c,
            h: bar.h,
            l: bar.l,
            v: bar.v,
          },
          prevDay: {
            o: bar.o,
            h: bar.h,
            l: bar.l,
            c: bar.c,
            v: bar.v,
          },
        };

        // Cache for 30 seconds
        const cacheKey = cacheKeys.indexQuote(ticker);
        cache.set(cacheKey, snapshot, 30);

        return snapshot;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching previous day bar for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Get snapshots for multiple tickers
   * @param tickers - Array of ticker symbols
   * @returns Array of snapshots
   */
  async getSnapshots(
    tickers: string[]
  ): Promise<Map<string, PolygonTickerSnapshot>> {
    const results = new Map<string, PolygonTickerSnapshot>();

    // Fetch all tickers in parallel (with rate limiting)
    const promises = tickers.map(async (ticker) => {
      const snapshot = await this.getSnapshot(ticker);
      if (snapshot) {
        results.set(ticker, snapshot);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Get previous day's aggregate bar (OHLCV data)
   * @param ticker - Stock or index ticker
   * @returns Previous day's bar data
   */
  async getPreviousDayBar(ticker: string): Promise<PolygonAggregateBar | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const polygonTicker = INDEX_SYMBOL_MAP[ticker] || ticker;

    try {
      const url = buildUrl(
        `${this.baseUrl}/v2/aggs/ticker/${polygonTicker}/prev`,
        {
          adjusted: true,
          apiKey: this.apiKey,
        }
      );

      interface AggregateResponse {
        status: string;
        results?: PolygonAggregateBar[];
      }

      const response = await fetchWithRetry<AggregateResponse>(url, {
        timeout: 5000,
        retries: 2,
      });

      if (
        response.status === "OK" &&
        response.results &&
        response.results.length > 0
      ) {
        return response.results[0];
      }

      return null;
    } catch (error) {
      console.error(`Error fetching previous day bar for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Get aggregate bars for a time range
   * @param ticker - Stock or index ticker
   * @param from - Start date (YYYY-MM-DD)
   * @param to - End date (YYYY-MM-DD)
   * @param timespan - Timespan (minute, hour, day, week, month)
   * @returns Array of aggregate bars
   */
  async getAggregateBars(
    ticker: string,
    from: string,
    to: string,
    timespan: "minute" | "hour" | "day" | "week" | "month" = "day"
  ): Promise<PolygonAggregateBar[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const polygonTicker = INDEX_SYMBOL_MAP[ticker] || ticker;

    try {
      const url = buildUrl(
        `${this.baseUrl}/v2/aggs/ticker/${polygonTicker}/range/1/${timespan}/${from}/${to}`,
        {
          adjusted: true,
          sort: "asc",
          apiKey: this.apiKey,
        }
      );

      interface AggregatesResponse {
        status: string;
        results?: PolygonAggregateBar[];
        resultsCount?: number;
      }

      const response = await fetchWithRetry<AggregatesResponse>(url, {
        timeout: 10000,
        retries: 2,
      });

      if (response.status === "OK" && response.results) {
        return response.results;
      }

      return [];
    } catch (error) {
      console.error(`Error fetching aggregate bars for ${ticker}:`, error);
      return [];
    }
  }
}

// Singleton instance
export const polygonClient = new PolygonClient();
