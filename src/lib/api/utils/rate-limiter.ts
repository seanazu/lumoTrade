/**
 * Rate Limiter Utility
 * Prevents exceeding API rate limits
 */

import { RateLimitConfig, RateLimitState } from '../types';

class RateLimiter {
  private limits = new Map<string, RateLimitState>();

  /**
   * Check if request is allowed under rate limit
   * @param key - Unique key for the rate limit (e.g., 'polygon', 'marketaux')
   * @param config - Rate limit configuration
   * @returns true if request is allowed
   */
  async checkLimit(key: string, config: RateLimitConfig): Promise<boolean> {
    const now = Date.now();
    let state = this.limits.get(key);

    // Initialize state if not exists
    if (!state) {
      state = {
        requests: [],
        resetTime: now + config.windowMs,
      };
      this.limits.set(key, state);
    }

    // Reset if window has passed
    if (now >= state.resetTime) {
      state.requests = [];
      state.resetTime = now + config.windowMs;
    }

    // Remove old requests outside the window
    state.requests = state.requests.filter(
      (timestamp) => now - timestamp < config.windowMs
    );

    // Check if limit exceeded
    if (state.requests.length >= config.maxRequests) {
      const oldestRequest = state.requests[0];
      const waitTime = config.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        console.warn(
          `Rate limit exceeded for ${key}. Wait ${Math.ceil(waitTime / 1000)}s`
        );
        return false;
      }
    }

    // Add current request
    state.requests.push(now);
    return true;
  }

  /**
   * Wait until rate limit allows next request
   * @param key - Unique key for the rate limit
   * @param config - Rate limit configuration
   */
  async waitForLimit(key: string, config: RateLimitConfig): Promise<void> {
    const now = Date.now();
    const state = this.limits.get(key);

    if (!state || state.requests.length === 0) {
      return;
    }

    // Calculate wait time
    const oldestRequest = state.requests[0];
    const waitTime = config.windowMs - (now - oldestRequest);

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Get remaining requests in current window
   * @param key - Unique key for the rate limit
   * @param config - Rate limit configuration
   */
  getRemainingRequests(key: string, config: RateLimitConfig): number {
    const now = Date.now();
    const state = this.limits.get(key);

    if (!state) {
      return config.maxRequests;
    }

    // Clean up old requests
    state.requests = state.requests.filter(
      (timestamp) => now - timestamp < config.windowMs
    );

    return Math.max(0, config.maxRequests - state.requests.length);
  }

  /**
   * Reset rate limit for a key
   * @param key - Unique key for the rate limit
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.limits.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Rate limit configurations for different APIs
export const rateLimitConfigs = {
  // Polygon.io: 5 requests per minute for free tier
  polygon: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  // Marketaux: 100 requests per day for free tier
  marketaux: {
    maxRequests: 100,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  // FMP: 250 requests per day for free tier
  fmp: {
    maxRequests: 250,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
  },
};

