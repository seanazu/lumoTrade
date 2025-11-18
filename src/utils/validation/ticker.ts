/**
 * Validate ticker symbol format
 */
export function isValidTicker(ticker: string): boolean {
  // Ticker should be 1-5 uppercase letters
  return /^[A-Z]{1,5}$/.test(ticker);
}

/**
 * Sanitize ticker input
 */
export function sanitizeTicker(ticker: string): string {
  return ticker.toUpperCase().trim();
}

/**
 * Validate price
 */
export function isValidPrice(price: number): boolean {
  return price > 0 && isFinite(price);
}

/**
 * Validate percentage
 */
export function isValidPercentage(percent: number): boolean {
  return percent >= -100 && percent <= 1000 && isFinite(percent);
}

