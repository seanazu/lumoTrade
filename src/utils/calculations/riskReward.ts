/**
 * Calculate risk/reward ratio
 */
export function calculateRiskReward(
  entry: number,
  target: number,
  stop: number
): number {
  const risk = Math.abs(entry - stop);
  const reward = Math.abs(target - entry);
  return reward / risk;
}

/**
 * Calculate risk amount
 */
export function calculateRisk(entry: number, stop: number, shares: number): number {
  return Math.abs(entry - stop) * shares;
}

/**
 * Calculate reward amount
 */
export function calculateReward(
  entry: number,
  target: number,
  shares: number
): number {
  return Math.abs(target - entry) * shares;
}

/**
 * Calculate position size based on account risk
 */
export function calculatePositionSize(
  accountSize: number,
  riskPercent: number,
  entry: number,
  stop: number
): number {
  const riskAmount = accountSize * (riskPercent / 100);
  const riskPerShare = Math.abs(entry - stop);
  return Math.floor(riskAmount / riskPerShare);
}

