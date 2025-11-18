/**
 * Calculate shares based on dollar amount
 */
export function calculateShares(dollarAmount: number, pricePerShare: number): number {
  return Math.floor(dollarAmount / pricePerShare);
}

/**
 * Calculate dollar amount from shares
 */
export function calculateDollarAmount(shares: number, pricePerShare: number): number {
  return shares * pricePerShare;
}

/**
 * Calculate Kelly criterion position size
 */
export function calculateKellyCriterion(
  winRate: number,
  avgWin: number,
  avgLoss: number
): number {
  const b = avgWin / avgLoss;
  const p = winRate;
  const q = 1 - p;
  return (b * p - q) / b;
}

