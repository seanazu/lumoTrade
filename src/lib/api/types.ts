/**
 * Shared API Types and Interfaces
 * Type definitions for external API responses and internal data structures
 */

// ============================================================================
// Polygon.io Types
// ============================================================================

export interface PolygonTickerSnapshot {
  ticker: string;
  todaysChangePerc: number;
  todaysChange: number;
  updated: number;
  day: {
    o: number; // open
    h: number; // high
    l: number; // low
    c: number; // close
    v: number; // volume
    vw: number; // volume weighted
  };
  min: {
    c: number; // close
    h: number; // high
    l: number; // low
    v: number; // volume
  };
  prevDay: {
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
  };
}

export interface PolygonAggregateBar {
  T: string; // ticker
  v: number; // volume
  vw: number; // volume weighted average price
  o: number; // open
  c: number; // close
  h: number; // high
  l: number; // low
  t: number; // timestamp
  n: number; // number of transactions
}

export interface PolygonWebSocketMessage {
  ev: string; // event type (e.g., "Q" for quote, "A" for aggregate)
  sym: string; // symbol
  p?: number; // price
  s?: number; // size
  t?: number; // timestamp
  c?: number[]; // conditions
}

// ============================================================================
// Marketaux Types
// ============================================================================

export interface MarketauxArticle {
  uuid: string;
  title: string;
  description: string;
  url: string;
  published_at: string;
  source: string;
  snippet: string;
  entities: Array<{
    symbol: string;
    name: string;
    exchange: string | null;
    type: string;
  }>;
  sentiment: {
    score: number; // -1 to 1
    label: "positive" | "negative" | "neutral";
  };
  highlights: string[];
}

export interface MarketauxNewsResponse {
  meta: {
    found: number;
    returned: number;
    limit: number;
    page: number;
  };
  data: MarketauxArticle[];
}

// ============================================================================
// Financial Modeling Prep (FMP) Types
// ============================================================================

export interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  volume: number;
  avgVolume: number;
  exchange: string;
  open: number;
  previousClose: number;
  timestamp: number;
}

export interface FMPIntradayBar {
  date: string; // "2025-11-21 15:30:00"
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

export type MarketSession = "pre" | "regular" | "after";

export interface IndexIntradayPoint {
  timestamp: string; // ISO string
  price: number;
  session: MarketSession;
}

export interface IndexIntradaySeries {
  symbol: string;
  name: string;
  points: IndexIntradayPoint[];
  sessionStart: string;
  regularStart: string;
  regularEnd: string;
  sessionEnd: string;
}

// ============================================================================
// Internal API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: number;
  cached?: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
  details?: unknown;
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitState {
  requests: number[];
  resetTime: number;
}
