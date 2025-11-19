"use client";

import { type FC } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, MoreVertical, Flag, Trash2, StickyNote } from "lucide-react";
import { WatchlistStock, ColorFlag } from "@/types/watchlist";
import { useWatchlistStore } from "@/lib/zustand/watchlistStore";
import { formatPrice, formatPercentage } from "@/utils/formatting/numbers";
import { usePriceStream } from "@/hooks/usePriceStream";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";

interface WatchlistStockItemProps {
  stock: WatchlistStock;
  folderId: string;
}

const COLOR_FLAG_STYLES: Record<ColorFlag, string> = {
  red: "text-red-500",
  orange: "text-orange-500",
  yellow: "text-yellow-500",
  green: "text-green-500",
  blue: "text-blue-500",
  purple: "text-purple-500",
  pink: "text-pink-500",
  none: "text-muted-foreground",
};

export const WatchlistStockItem: FC<WatchlistStockItemProps> = ({
  stock,
  folderId,
}) => {
  const router = useRouter();
  const { removeStockFromFolder, updateStockFlag, folders } = useWatchlistStore();
  const { priceData, priceDirection } = usePriceStream(stock.symbol);
  
  // Use live data if available, otherwise use stock data
  const currentPrice = priceData?.price || stock.price;
  const currentChange = priceData?.changePercent || stock.changePercent;
  const isPositive = currentChange >= 0;

  const handleNavigateToStock = () => {
    router.push(`/analyzer?symbol=${stock.symbol}`);
  };

  const handleRemoveStock = (e: Event) => {
    e.preventDefault();
    removeStockFromFolder(folderId, stock.id);
  };

  const handleUpdateFlag = (flag: ColorFlag) => {
    updateStockFlag(folderId, stock.id, flag);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      whileHover={{ backgroundColor: "rgba(var(--primary-rgb, 132, 204, 22), 0.05)" }}
      className="flex items-center gap-2 p-3 border-l-2 cursor-pointer transition-colors"
      style={{
        borderLeftColor:
          stock.colorFlag !== "none"
            ? `var(--color-${stock.colorFlag}, currentColor)`
            : "transparent",
      }}
      onClick={handleNavigateToStock}
    >
      {/* Flag Icon */}
      <Flag
        className={`h-3 w-3 flex-shrink-0 ${COLOR_FLAG_STYLES[stock.colorFlag]}`}
        fill={stock.colorFlag !== "none" ? "currentColor" : "none"}
      />

      {/* Stock Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{stock.symbol}</span>
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <motion.span
            className="font-semibold tabular-nums"
            animate={
              priceDirection === "up"
                ? { backgroundColor: ["transparent", "rgba(34, 197, 94, 0.2)", "transparent"] }
                : priceDirection === "down"
                ? { backgroundColor: ["transparent", "rgba(239, 68, 68, 0.2)", "transparent"] }
                : {}
            }
            transition={{ duration: 0.6 }}
          >
            ${formatPrice(currentPrice)}
          </motion.span>
          <motion.span
            className={`tabular-nums ${
              isPositive ? "text-green-500" : "text-red-500"
            }`}
            animate={
              priceDirection === "up"
                ? { scale: [1, 1.1, 1] }
                : priceDirection === "down"
                ? { scale: [1, 1.1, 1] }
                : {}
            }
            transition={{ duration: 0.3 }}
          >
            {isPositive && "+"}
            {formatPercentage(currentChange)}
          </motion.span>
        </div>
      </div>

      {/* Options */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <motion.button
            onClick={(e) => e.stopPropagation()}
            className="p-1 hover:bg-primary/10 rounded transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreVertical className="h-3 w-3" />
          </motion.button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[180px] bg-card rounded-lg border border-border p-1 shadow-lg z-50"
            sideOffset={5}
          >
            {/* Color Flag Submenu */}
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 rounded cursor-pointer outline-none">
                <Flag className="h-3 w-3" />
                Color Flag
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className="min-w-[140px] bg-card rounded-lg border border-border p-1 shadow-lg z-50"
                  sideOffset={2}
                  alignOffset={-5}
                >
                  {(["red", "orange", "yellow", "green", "blue", "purple", "pink", "none"] as ColorFlag[]).map((flag) => (
                    <DropdownMenu.Item
                      key={flag}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 rounded cursor-pointer outline-none capitalize"
                      onSelect={() => handleUpdateFlag(flag)}
                    >
                      <Flag
                        className={`h-3 w-3 ${COLOR_FLAG_STYLES[flag]}`}
                        fill={flag !== "none" ? "currentColor" : "none"}
                      />
                      {flag}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>

            {/* Move to Folder Submenu */}
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 rounded cursor-pointer outline-none">
                Move to...
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className="min-w-[140px] bg-card rounded-lg border border-border p-1 shadow-lg z-50"
                  sideOffset={2}
                  alignOffset={-5}
                >
                  {folders
                    .filter((f) => f.id !== folderId)
                    .map((folder) => (
                      <DropdownMenu.Item
                        key={folder.id}
                        className="px-3 py-2 text-sm hover:bg-primary/10 rounded cursor-pointer outline-none"
                        onSelect={() => {
                          const { moveStock } = useWatchlistStore.getState();
                          moveStock(stock.id, folderId, folder.id);
                        }}
                      >
                        {folder.name}
                      </DropdownMenu.Item>
                    ))}
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>

            <DropdownMenu.Separator className="h-px bg-border my-1" />

            {/* Remove */}
            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive rounded cursor-pointer outline-none"
              onSelect={handleRemoveStock}
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </motion.div>
  );
};

