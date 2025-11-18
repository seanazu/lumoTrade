import { round } from "lodash";

/**
 * Format a number as currency
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return `$${value.toFixed(decimals)}`;
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with abbreviations (K, M, B, T)
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `${round(value / 1_000_000_000_000, 2)}T`;
  }
  if (value >= 1_000_000_000) {
    return `${round(value / 1_000_000_000, 2)}B`;
  }
  if (value >= 1_000_000) {
    return `${round(value / 1_000_000, 2)}M`;
  }
  if (value >= 1_000) {
    return `${round(value / 1_000, 2)}K`;
  }
  return value.toString();
}

/**
 * Format price with appropriate decimal places
 */
export function formatPrice(value: number): string {
  if (value < 1) {
    return value.toFixed(4);
  }
  if (value < 10) {
    return value.toFixed(3);
  }
  return value.toFixed(2);
}

/**
 * Format volume with abbreviations
 */
export function formatVolume(value: number): string {
  return formatLargeNumber(value);
}

