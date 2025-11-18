export interface Ticker {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  float: number;
  shortInterest?: number;
}

export interface TickerSearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

