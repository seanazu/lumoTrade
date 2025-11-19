"use client";

import { type FC } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Button } from "@/components/design-system/atoms/Button";
import { useWatchlistStore } from "@/lib/zustand/watchlistStore";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface AddToWatchlistButtonProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export const AddToWatchlistButton: FC<AddToWatchlistButtonProps> = ({
  symbol,
  name,
  price,
  change,
  changePercent,
}) => {
  const { folders, addStockToFolder } = useWatchlistStore();

  // Check if stock is already in any folder
  const isInWatchlist = folders.some((folder) =>
    folder.stocks.some((stock) => stock.symbol === symbol)
  );

  const handleAddToFolder = (folderId: string) => {
    addStockToFolder(folderId, {
      symbol,
      name,
      price,
      change,
      changePercent,
      colorFlag: "none",
    });
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          size="lg"
          variant={isInWatchlist ? "default" : "outline"}
          className="gap-2"
        >
          <motion.div
            animate={
              isInWatchlist
                ? {
                    rotate: [0, -15, 15, -15, 0],
                    scale: [1, 1.2, 1],
                  }
                : {}
            }
            transition={{ duration: 0.5 }}
          >
            <Star
              className="h-5 w-5"
              fill={isInWatchlist ? "currentColor" : "none"}
            />
          </motion.div>
          {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[200px] bg-card rounded-lg border border-border p-2 shadow-lg z-50"
          sideOffset={5}
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Add to folder
          </div>
          {folders.map((folder) => {
            const alreadyInFolder = folder.stocks.some(
              (stock) => stock.symbol === symbol
            );
            return (
              <DropdownMenu.Item
                key={folder.id}
                className="px-3 py-2 text-sm hover:bg-primary/10 rounded cursor-pointer outline-none flex items-center justify-between"
                onSelect={() => !alreadyInFolder && handleAddToFolder(folder.id)}
                disabled={alreadyInFolder}
              >
                <span>{folder.name}</span>
                {alreadyInFolder && (
                  <Star className="h-3 w-3 text-primary" fill="currentColor" />
                )}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

