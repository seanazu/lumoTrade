"use client";

import { type FC } from "react";
import { WatchlistItem } from "./WatchlistItem";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Skeleton } from "@/components/design-system/atoms/Skeleton";

const WatchlistPanel: FC = () => {
  const { watchlist, isLoading, removeFromWatchlist } = useWatchlist();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No tickers in watchlist</p>
        <p className="text-xs mt-1">Search and add tickers to track them</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {watchlist.map((item) => (
        <WatchlistItem
          key={item.id}
          ticker={item.ticker}
          notes={item.notes}
          onRemove={() => removeFromWatchlist(item.id)}
        />
      ))}
    </div>
  );
};

export { WatchlistPanel };

