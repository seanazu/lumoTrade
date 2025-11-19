export type ColorFlag = 
  | "red" 
  | "orange" 
  | "yellow" 
  | "green" 
  | "blue" 
  | "purple" 
  | "pink" 
  | "none";

export interface WatchlistStock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  colorFlag: ColorFlag;
  addedAt: number;
  notes?: string;
}

export interface WatchlistFolder {
  id: string;
  name: string;
  stocks: WatchlistStock[];
  createdAt: number;
  order: number;
}

export interface Watchlist {
  folders: WatchlistFolder[];
}

