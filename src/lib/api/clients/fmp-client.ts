/**
 * Financial Modeling Prep (FMP) API Client
 * Financial statements, ratios, and advanced market data
 * Documentation: https://site.financialmodelingprep.com/developer/docs
 */

import { apiConfig, isFMPConfigured } from "../config";
import { FMPIntradayBar, FMPQuote } from "../types";
import { fetchWithRetry, buildUrl } from "../utils/http-client";
import { rateLimiter, rateLimitConfigs } from "../utils/rate-limiter";
import { cache, cacheKeys } from "../utils/cache";

class FMPClient {
  private baseUrl = apiConfig.fmp.baseUrl;
  private apiKey = apiConfig.fmp.apiKey;

  /**
   * Check if client is configured
   */
  isConfigured(): boolean {
    return isFMPConfigured();
  }

  /**
   * Get real-time quote for a symbol
   * @param symbol - Stock symbol
   * @returns Quote data
   */
  async getQuote(symbol: string): Promise<FMPQuote | null> {
    if (!this.isConfigured()) {
      console.warn("FMP API not configured.");
      return null;
    }

    // Check cache first
    const cacheKey = cacheKeys.stockQuote(symbol);
    const cached = cache.get<FMPQuote>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check rate limit
    const allowed = await rateLimiter.checkLimit("fmp", rateLimitConfigs.fmp);
    if (!allowed) {
      console.warn("FMP rate limit exceeded. Using cached data.");
      return cached;
    }

    try {
      const url = buildUrl(`${this.baseUrl}/quote/${symbol}`, {
        apikey: this.apiKey,
      });

      const response = await fetchWithRetry<FMPQuote[]>(url, {
        timeout: 5000,
        retries: 2,
      });

      if (response && response.length > 0) {
        const quote = response[0];
        // Cache for 30 seconds
        cache.set(cacheKey, quote, 30);
        return quote;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching FMP quote for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get quotes for multiple symbols
   * @param symbols - Array of stock symbols
   * @returns Map of symbol to quote
   */
  async getQuotes(symbols: string[]): Promise<Map<string, FMPQuote>> {
    if (!this.isConfigured()) {
      return new Map();
    }

    // Check rate limit
    const allowed = await rateLimiter.checkLimit("fmp", rateLimitConfigs.fmp);
    if (!allowed) {
      console.warn("FMP rate limit exceeded.");
      return new Map();
    }

    try {
      const symbolsParam = symbols.join(",");
      const url = buildUrl(`${this.baseUrl}/quote/${symbolsParam}`, {
        apikey: this.apiKey,
      });

      const response = await fetchWithRetry<FMPQuote[]>(url, {
        timeout: 8000,
        retries: 2,
      });

      const results = new Map<string, FMPQuote>();

      if (response && Array.isArray(response)) {
        response.forEach((quote) => {
          results.set(quote.symbol, quote);
          // Cache each quote
          const cacheKey = cacheKeys.stockQuote(quote.symbol);
          cache.set(cacheKey, quote, 30);
        });
      }

      return results;
    } catch (error) {
      console.error("Error fetching FMP quotes:", error);
      return new Map();
    }
  }

  /**
   * Get company profile
   * @param symbol - Stock symbol
   * @returns Company profile data
   */
  async getCompanyProfile(symbol: string): Promise<unknown | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const url = buildUrl(`${this.baseUrl}/profile/${symbol}`, {
        apikey: this.apiKey,
      });

      const response = await fetchWithRetry<unknown[]>(url, {
        timeout: 5000,
        retries: 2,
      });

      if (response && Array.isArray(response) && response.length > 0) {
        return response[0];
      }

      return null;
    } catch (error) {
      console.error(`Error fetching company profile for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get intraday chart data for a symbol
   * @param symbol - Index or stock symbol (e.g. ^GSPC)
   * @param interval - Chart interval (1min, 5min, 15min, etc.)
   * @param limit - Number of records to fetch
   */
  async getIntradayChart(
    symbol: string,
    interval: "1min" | "5min" | "15min" | "30min" | "1hour" = "1min",
    limit = 1300
  ): Promise<FMPIntradayBar[]> {
    if (!this.isConfigured()) {
      console.warn("FMP API not configured.");
      return [];
    }

    const cacheKey = cacheKeys.indexIntraday(symbol, interval);
    const cached = cache.get<FMPIntradayBar[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const allowed = await rateLimiter.checkLimit("fmp", rateLimitConfigs.fmp);
    if (!allowed) {
      console.warn("FMP rate limit exceeded for intraday chart.");
      return cached || [];
    }

    try {
      const encodedSymbol = encodeURIComponent(symbol);
      const url = buildUrl(
        `${this.baseUrl}/historical-chart/${interval}/${encodedSymbol}`,
        {
          apikey: this.apiKey,
          limit: limit.toString(),
          serietype: "all",
        }
      );

      const response = await fetchWithRetry<FMPIntradayBar[]>(url, {
        timeout: 8000,
        retries: 2,
      });

      if (response && Array.isArray(response)) {
        // Cache intraday chart briefly (10 seconds) to avoid hitting limits
        cache.set(cacheKey, response, 10);
        return response;
      }

      return [];
    } catch (error) {
      console.error(`Error fetching FMP intraday chart for ${symbol}:`, error);
      return [];
    }
  }
}

// Singleton instance
export const fmpClient = new FMPClient();
