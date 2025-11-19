"use client";

import { type FC } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { Badge } from "@/components/design-system/atoms/Badge";
import { IndexData } from "@/resources/mock-data/indexes";
import { formatPrice, formatPercentage } from "@/utils/formatting/numbers";
import { fadeInScale } from "@/utils/animations/variants";
import { AnimatedCounter } from "./AnimatedCounter";

interface IndexCardProps {
  index: IndexData;
}

export const IndexCard: FC<IndexCardProps> = ({ index }) => {
  const isPositive = index.change >= 0;

  return (
    <motion.div 
      variants={fadeInScale}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <GlassCard hover className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">
              {index.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums">
                $<AnimatedCounter value={index.price} decimals={2} />
              </span>
              <Badge variant={isPositive ? "bullish" : "bearish"}>
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
              </Badge>
            </div>
            <div
              className={`text-sm font-semibold ${
                isPositive ? "text-green-500" : "text-red-500"
              }`}
            >
              {isPositive && "+"}
              {formatPrice(index.change)} ({formatPercentage(index.changePercent)})
            </div>
          </div>

          {/* P0, P50, P90 */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">P0</span>
              <span className="font-semibold">{formatPrice(index.p0)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">P50</span>
              <span className="font-semibold">{formatPrice(index.p50)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">P90</span>
              <span className="font-semibold">{formatPrice(index.p90)}</span>
            </div>
          </div>

          {/* Range indicator */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${((index.price - index.p0) / (index.p90 - index.p0)) * 100}%`,
              }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

