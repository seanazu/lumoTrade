"use client";

import { type FC } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Pattern } from "@/lib/ai/pattern-detection/patterns";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { Badge } from "@/components/design-system/atoms/Badge";

interface PatternAlertProps {
  patterns: Pattern[];
}

export const PatternAlert: FC<PatternAlertProps> = ({ patterns }) => {
  if (patterns.length === 0) return null;

  const topPattern = patterns[0]; // Highest confidence pattern

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <GlassCard
        className={`p-4 border-2 ${
          topPattern.bullish ? "border-green-500/50" : "border-red-500/50"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg ${
              topPattern.bullish ? "bg-green-500/20" : "bg-red-500/20"
            }`}
          >
            {topPattern.bullish ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold">{topPattern.description}</h3>
              <Badge variant="violet">{topPattern.confidence}% confidence</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              AI detected {topPattern.bullish ? "bullish" : "bearish"} pattern
            </p>

            {topPattern.keyLevels && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {topPattern.keyLevels.resistance && (
                  <div>
                    <span className="text-muted-foreground">Resistance:</span>
                    <span className="ml-1 font-semibold">
                      ${topPattern.keyLevels.resistance.toFixed(2)}
                    </span>
                  </div>
                )}
                {topPattern.keyLevels.support && (
                  <div>
                    <span className="text-muted-foreground">Support:</span>
                    <span className="ml-1 font-semibold">
                      ${topPattern.keyLevels.support.toFixed(2)}
                    </span>
                  </div>
                )}
                {topPattern.keyLevels.target && (
                  <div>
                    <span className="text-muted-foreground">Target:</span>
                    <span className="ml-1 font-semibold text-primary">
                      ${topPattern.keyLevels.target.toFixed(2)}
                    </span>
                  </div>
                )}
                {topPattern.keyLevels.stopLoss && (
                  <div>
                    <span className="text-muted-foreground">Stop Loss:</span>
                    <span className="ml-1 font-semibold text-destructive">
                      ${topPattern.keyLevels.stopLoss.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {patterns.length > 1 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              +{patterns.length - 1} more pattern{patterns.length > 2 ? "s" : ""}{" "}
              detected
            </p>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};

