import { create } from "zustand";
import { Timeframe } from "@/types/trade";

interface TickerState {
  currentTicker: string;
  timeframe: Timeframe;
  recentTickers: string[];
  setCurrentTicker: (ticker: string) => void;
  setTimeframe: (timeframe: Timeframe) => void;
  addRecentTicker: (ticker: string) => void;
}

export const useTickerStore = create<TickerState>((set) => ({
  currentTicker: "AAPL",
  timeframe: "swing",
  recentTickers: ["AAPL", "TSLA", "NVDA"],

  setCurrentTicker: (ticker) => set({ currentTicker: ticker }),

  setTimeframe: (timeframe) => set({ timeframe }),

  addRecentTicker: (ticker) =>
    set((state) => {
      const filtered = state.recentTickers.filter((t) => t !== ticker);
      return {
        recentTickers: [ticker, ...filtered].slice(0, 10),
      };
    }),
}));

