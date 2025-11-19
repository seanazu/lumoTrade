"use client";

import { type FC } from "react";
import { X } from "lucide-react";
import { useTickerStore } from "@/lib/zustand/tickerStore";

interface WatchlistItemProps {
  ticker: string;
  notes?: string;
  onRemove: () => void;
}

const WatchlistItem: FC<WatchlistItemProps> = ({
  ticker,
  notes,
  onRemove,
}) => {
  const { setCurrentTicker } = useTickerStore();

  return (
    <div
      className="group p-3 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors cursor-pointer relative"
      onClick={() => setCurrentTicker(ticker)}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{ticker}</p>
          {notes && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
              {notes}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
        >
          <X className="h-4 w-4 text-red-400" />
        </button>
      </div>
    </div>
  );
};

export { WatchlistItem };

