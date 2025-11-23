/**
 * Simple In-Memory Cache with TTL
 * Production-ready caching utility for API responses
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class Cache {
  private store = new Map<string, CacheEntry<unknown>>();

  /**
   * Set a value in cache with TTL
   * @param key - Cache key
   * @param value - Data to cache
   * @param ttlSeconds - Time to live in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: now,
      expiresAt: now + ttlSeconds * 1000,
    };
    this.store.set(key, entry);
  }

  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Cached data or null if expired/not found
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    const now = Date.now();

    // Check if expired
    if (now > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if cache has valid entry for key
   * @param key - Cache key
   * @returns true if valid cached data exists
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a cache entry
   * @param key - Cache key
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton instance
export const cache = new Cache();

// Auto-cleanup every 5 minutes
if (typeof window === "undefined") {
  // Only run on server
  setInterval(
    () => {
      cache.cleanup();
    },
    5 * 60 * 1000
  );
}

/**
 * Cache key generator utility
 */
export const cacheKeys = {
  indexes: () => "market:indexes",
  indexQuote: (symbol: string) => `market:index:${symbol}`,
  indexIntraday: (symbol: string, interval: string) =>
    `market:index:${symbol}:intraday:${interval}`,
  marketNews: (limit: number) => `market:news:${limit}`,
  stockQuote: (symbol: string) => `stock:quote:${symbol}`,
  stockAnalysis: (symbol: string) => `stock:analysis:${symbol}`,
};
