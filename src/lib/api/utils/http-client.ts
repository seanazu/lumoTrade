/**
 * HTTP Client Utility
 * Wrapper around fetch with retry logic, timeout, and error handling
 */

import { ApiError } from '../types';

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Enhanced fetch with timeout, retry, and error handling
 */
export async function fetchWithRetry<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    timeout = 10000,
    retries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new Error(
          `HTTP ${response.status}: ${errorData.message || response.statusText}`
        );
      }

      // Parse and return JSON response
      const data = await response.json();
      return data as T;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on abort (timeout) or certain status codes
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw createApiError(
            'TIMEOUT',
            `Request timeout after ${timeout}ms`,
            { url, timeout }
          );
        }

        // Check for non-retryable errors
        if (error.message.includes('HTTP 401') || error.message.includes('HTTP 403')) {
          throw createApiError(
            'AUTH_ERROR',
            'Authentication failed. Check your API keys.',
            { url, error: error.message }
          );
        }

        if (error.message.includes('HTTP 429')) {
          throw createApiError(
            'RATE_LIMIT',
            'Rate limit exceeded. Please try again later.',
            { url, error: error.message }
          );
        }
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries - 1) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  throw createApiError(
    'FETCH_ERROR',
    `Failed to fetch after ${retries} attempts: ${lastError?.message}`,
    { url, error: lastError }
  );
}

/**
 * Create a standardized API error
 */
export function createApiError(
  code: string,
  message: string,
  details?: unknown
): ApiError {
  return {
    code,
    message,
    details,
  };
}

/**
 * Build URL with query parameters
 */
export function buildUrl(baseUrl: string, params: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });

  return url.toString();
}

