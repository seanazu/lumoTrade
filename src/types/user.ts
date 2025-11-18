export interface User {
  id: string;
  email: string;
  createdAt: number;
}

export interface UserPreferences {
  theme: string;
  defaultTimeframe: string;
  maxRiskPerTrade: number;
}

export interface WatchlistItem {
  id: string;
  ticker: string;
  addedAt: number;
  notes?: string;
}

export interface Alert {
  id: string;
  ticker: string;
  type: "price" | "catalyst" | "custom";
  condition: string;
  target: number;
  isActive: boolean;
  createdAt: number;
}

