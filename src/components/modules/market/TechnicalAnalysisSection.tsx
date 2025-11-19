"use client";

import { type FC } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { Badge } from "@/components/design-system/atoms/Badge";
import { IndexData, IndexAnalysis } from "@/resources/mock-data/indexes";
import { formatPrice } from "@/utils/formatting/numbers";

interface TechnicalAnalysisSectionProps {
  indexes: IndexData[];
  analysis: Record<string, IndexAnalysis>;
}

export const TechnicalAnalysisSection: FC<
  TechnicalAnalysisSectionProps
> = ({ indexes, analysis }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Object.values(analysis).map((item, idx) => (
        <motion.div
          key={item.symbol}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <GlassCard hover className="p-6">
          <h3 className="text-xl font-bold mb-4">
            {indexes.find((i) => i.symbol === item.symbol)?.name} Analysis
          </h3>

          <div className="space-y-4">
            {/* Trend */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Trend</span>
              <Badge
                variant={
                  item.trend === "bullish"
                    ? "bullish"
                    : item.trend === "bearish"
                    ? "bearish"
                    : "neutral"
                }
              >
                {item.trend.toUpperCase()}
              </Badge>
            </div>

            {/* Support/Resistance */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Support Levels</p>
              <div className="flex gap-2">
                {item.support.map((level, i) => (
                  <div
                    key={i}
                    className="px-3 py-1 rounded bg-green-500/20 text-green-400 text-sm font-semibold"
                  >
                    {formatPrice(level)}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Resistance Levels
              </p>
              <div className="flex gap-2">
                {item.resistance.map((level, i) => (
                  <div
                    key={i}
                    className="px-3 py-1 rounded bg-red-500/20 text-red-400 text-sm font-semibold"
                  >
                    {formatPrice(level)}
                  </div>
                ))}
              </div>
            </div>

            {/* MACD & RSI */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground mb-1">MACD</p>
                <p className="text-xl font-bold">{item.macd.value.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  Signal: {item.macd.signal.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">RSI</p>
                <p className="text-xl font-bold">{item.rsi.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">
                  {item.rsi > 70
                    ? "Overbought"
                    : item.rsi < 30
                    ? "Oversold"
                    : "Neutral"}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
        </motion.div>
      ))}
    </div>
  );
};

