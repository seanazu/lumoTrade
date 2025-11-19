"use client";

import { type FC } from "react";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { Badge } from "@/components/design-system/atoms/Badge";
import { MarketPrediction } from "@/resources/mock-data/indexes";
import { formatPrice } from "@/utils/formatting/numbers";

interface AIPredictionSectionProps {
  prediction: MarketPrediction;
}

export const AIPredictionSection: FC<AIPredictionSectionProps> = ({
  prediction,
}) => {
  return (
    <GlassCard className="p-6 border-2 border-primary/30">
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <motion.div
          className="p-3 rounded-lg bg-primary/20"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Brain className="h-8 w-8 text-primary" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold">AI Market Prediction</h2>
          <p className="text-sm text-muted-foreground">
            Based on multiple data sources and indicators
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-sm text-muted-foreground mb-2">Direction</p>
          <Badge
            variant={prediction.direction === "bullish" ? "bullish" : "bearish"}
            className="text-lg px-4 py-2"
          >
            {prediction.direction.toUpperCase()}
          </Badge>
        </motion.div>
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm text-muted-foreground mb-2">Confidence</p>
          <p className="text-3xl font-bold text-primary">
            {prediction.confidence}%
          </p>
        </motion.div>
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-sm text-muted-foreground mb-2">Timeframe</p>
          <p className="text-lg font-semibold">{prediction.timeframe}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h4 className="font-semibold mb-3 text-green-400">
            Key Supporting Factors
          </h4>
          <ul className="space-y-2">
            {prediction.keyFactors.map((factor, i) => (
              <motion.li
                key={i}
                className="text-sm flex items-start gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <span className="text-green-400">✓</span>
                <span>{factor}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h4 className="font-semibold mb-3 text-red-400">Risk Factors</h4>
          <ul className="space-y-2">
            {prediction.risks.map((risk, i) => (
              <motion.li
                key={i}
                className="text-sm flex items-start gap-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <span className="text-red-400">⚠</span>
                <span>{risk}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      <motion.div
        className="mt-6 pt-6 border-t border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <h4 className="font-semibold mb-3">Price Targets</h4>
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            className="p-3 rounded-lg bg-card text-center hover:bg-primary/5 transition-colors cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <p className="text-xs text-muted-foreground mb-1">NASDAQ</p>
            <p className="text-xl font-bold text-primary">
              {formatPrice(prediction.targets.nasdaq)}
            </p>
          </motion.div>
          <motion.div
            className="p-3 rounded-lg bg-card text-center hover:bg-primary/5 transition-colors cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <p className="text-xs text-muted-foreground mb-1">S&P 500</p>
            <p className="text-xl font-bold text-primary">
              {formatPrice(prediction.targets.sp500)}
            </p>
          </motion.div>
          <motion.div
            className="p-3 rounded-lg bg-card text-center hover:bg-primary/5 transition-colors cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <p className="text-xs text-muted-foreground mb-1">DOW</p>
            <p className="text-xl font-bold text-primary">
              {formatPrice(prediction.targets.dow)}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </GlassCard>
  );
};

