"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Ticker } from "@/types/ticker";
import { Sentiment } from "@/types/trade";
import { SentimentChip } from "@/components/design-system/molecules/SentimentChip";
import { formatPrice, formatPercentage } from "@/utils/formatting/numbers";
import { fadeInScale } from "@/utils/animations/variants";
import { smoothTransition } from "@/utils/animations/transitions";
import { cn } from "@/lib/utils";

interface TickerHeaderProps {
  ticker: Ticker;
  sentiment: Sentiment;
  className?: string;
}

const TickerHeader: React.FC<TickerHeaderProps> = ({
  ticker,
  sentiment,
  className,
}) => {
  const isPositive = ticker.change >= 0;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInScale}
      transition={smoothTransition}
      className={cn("space-y-2", className)}
    >
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {ticker.symbol}
            </h1>
            <SentimentChip sentiment={sentiment} />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{ticker.name}</span>
            <span>•</span>
            <span>{ticker.exchange}</span>
            <span>•</span>
            <span>{ticker.sector}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold tabular-nums">
              {formatPrice(ticker.price)}
            </span>
            <div
              className={cn(
                "text-sm font-semibold tabular-nums",
                isPositive ? "text-green-400" : "text-red-400"
              )}
            >
              <div>{isPositive && "+"}{formatPrice(ticker.change)}</div>
              <div>{formatPercentage(ticker.changePercent)}</div>
            </div>
          </div>
          {ticker.volume && (
            <div className="text-sm text-muted-foreground mt-1">
              Vol: {(ticker.volume / 1_000_000).toFixed(2)}M
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export { TickerHeader };

