/**
 * Marketaux API Client
 * Financial news with sentiment analysis
 * Documentation: https://www.marketaux.com/documentation
 */

import { apiConfig, isMarketauxConfigured } from '../config';
import { MarketauxNewsResponse, MarketauxArticle } from '../types';
import { fetchWithRetry, buildUrl } from '../utils/http-client';
import { rateLimiter, rateLimitConfigs } from '../utils/rate-limiter';
import { cache, cacheKeys } from '../utils/cache';

interface GetNewsOptions {
  limit?: number;
  symbols?: string[];
  entities?: boolean;
  sentiment?: boolean;
  language?: string;
}

export class MarketauxClient {
  private baseUrl = apiConfig.marketaux.baseUrl;
  private apiKey = apiConfig.marketaux.apiKey;

  /**
   * Check if client is configured
   */
  isConfigured(): boolean {
    return isMarketauxConfigured();
  }

  /**
   * Get market news with sentiment analysis
   * @param options - Query options
   * @returns Array of news articles with sentiment
   */
  async getNews(options: GetNewsOptions = {}): Promise<MarketauxArticle[]> {
    if (!this.isConfigured()) {
      console.warn('Marketaux API not configured. Using mock news data.');
      return [];
    }

    const {
      limit = 10,
      symbols,
      entities = true,
      sentiment = true,
      language = 'en',
    } = options;

    // Check cache first (5 minute cache for news)
    const cacheKey = cacheKeys.marketNews(limit);
    const cached = cache.get<MarketauxArticle[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check rate limit
    const allowed = await rateLimiter.checkLimit('marketaux', rateLimitConfigs.marketaux);
    if (!allowed) {
      console.warn('Marketaux rate limit exceeded. Using cached data.');
      return cached || [];
    }

    try {
      const params: Record<string, string | number | boolean> = {
        api_token: this.apiKey,
        limit,
        language,
        filter_entities: entities,
      };

      // Add symbols if provided
      if (symbols && symbols.length > 0) {
        params.symbols = symbols.join(',');
      }

      const url = buildUrl(`${this.baseUrl}/v1/news/all`, params);

      const response = await fetchWithRetry<MarketauxNewsResponse>(url, {
        timeout: 8000,
        retries: 2,
      });

      if (response.data && response.data.length > 0) {
        // Cache for 5 minutes
        cache.set(cacheKey, response.data, 300);
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Error fetching news from Marketaux:', error);
      return cached || [];
    }
  }

  /**
   * Get news for specific stock symbols
   * @param symbols - Array of stock symbols
   * @param limit - Number of articles to return
   * @returns Array of news articles
   */
  async getNewsBySymbols(symbols: string[], limit: number = 5): Promise<MarketauxArticle[]> {
    return this.getNews({ symbols, limit });
  }

  /**
   * Get top market news (general market news)
   * @param limit - Number of articles to return
   * @returns Array of news articles
   */
  async getTopMarketNews(limit: number = 10): Promise<MarketauxArticle[]> {
    return this.getNews({ limit });
  }

  /**
   * Map Marketaux sentiment to our internal format
   * @param sentimentScore - Sentiment score from -1 to 1
   * @returns 'bullish' | 'bearish' | 'neutral'
   */
  static mapSentiment(sentimentScore: number): 'bullish' | 'bearish' | 'neutral' {
    if (sentimentScore > 0.2) return 'bullish';
    if (sentimentScore < -0.2) return 'bearish';
    return 'neutral';
  }

  /**
   * Map importance based on entities and highlights
   * @param article - Marketaux article
   * @returns 'high' | 'medium' | 'low'
   */
  static mapImportance(article: MarketauxArticle): 'high' | 'medium' | 'low' {
    const hasEntities = article.entities && article.entities.length > 0;
    const hasHighlights = article.highlights && article.highlights.length > 2;
    
    if (hasEntities && hasHighlights) return 'high';
    if (hasEntities || hasHighlights) return 'medium';
    return 'low';
  }
}

// Singleton instance
export const marketauxClient = new MarketauxClient();

