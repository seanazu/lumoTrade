/**
 * Calculate percentage change
 */
export function calculatePercentChange(oldValue: number, newValue: number): number {
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Calculate price change
 */
export function calculatePriceChange(oldPrice: number, newPrice: number): number {
  return newPrice - oldPrice;
}

/**
 * Calculate target price from percentage
 */
export function calculateTargetPrice(
  currentPrice: number,
  percentGain: number
): number {
  return currentPrice * (1 + percentGain / 100);
}

/**
 * Calculate stop price from percentage
 */
export function calculateStopPrice(
  entryPrice: number,
  percentLoss: number
): number {
  return entryPrice * (1 - percentLoss / 100);
}

