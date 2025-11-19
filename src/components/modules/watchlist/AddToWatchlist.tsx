"use client";

import { type FC } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/design-system/atoms/Button";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cn } from "@/lib/utils";

interface AddToWatchlistProps {
  ticker: string;
  className?: string;
}

const AddToWatchlist: FC<AddToWatchlistProps> = ({
  ticker,
  className,
}) => {
  const { watchlist, addToWatchlist, removeFromWatchlist, isLoading } =
    useWatchlist();

  const watchlistItem = watchlist.find((item) => item.ticker === ticker);
  const isInWatchlist = !!watchlistItem;

  const handleToggle = async () => {
    if (isInWatchlist && watchlistItem) {
      await removeFromWatchlist(watchlistItem.id);
    } else {
      await addToWatchlist(ticker);
    }
  };

  return (
    <Button
      variant={isInWatchlist ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={cn("gap-2", className)}
    >
      <Star
        className={cn("h-4 w-4", isInWatchlist && "fill-current")}
      />
      {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
    </Button>
  );
};

export { AddToWatchlist };

