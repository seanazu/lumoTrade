"use client";

import { motion } from "framer-motion";
import { Database, Layers, Brain, Target, ArrowRight, Check } from "lucide-react";
import { Card } from "@/components/design-system/atoms/Card";
import { fadeInUp, staggerChildren, flowAnimation } from "@/lib/animations/variants";

export function DataPipelineFlow() {
  const stages = [
    {
      icon: Database,
      title: "Data Sources",
      color: "blue",
      items: [
        { name: "FMP API", detail: "OHLCV, News (50 pages/day), Macro" },
        { name: "FRED API", detail: "Economic indicators (13 series)" },
        { name: "Yahoo Finance", detail: "VIX, DXY, Commodities, Bonds" },
      ],
    },
    {
      icon: Layers,
      title: "Feature Engineering",
      color: "green",
      items: [
        { name: "Technical (60)", detail: "EMA, RSI, MACD, Bollinger Bands" },
        { name: "News (40)", detail: "Sentiment, shock detection, bursts" },
        { name: "Macro (45)", detail: "Yields, CPI, NFP, PMI events" },
        { name: "Cross-Asset (20)", detail: "VIX term, DXY, Gold, Oil" },
        { name: "Breadth (15)", detail: "Sector strength, A/D ratios" },
        { name: "Calendar (10)", detail: "Month, quarter, FOMC proximity" },
        { name: "Interactions (8)", detail: "VIX×News, Macro risk" },
      ],
    },
    {
      icon: Brain,
      title: "Model Training",
      color: "purple",
      items: [
        { name: "Walk-Forward", detail: "2 folds, 1500 train / 500 test" },
        { name: "Quantile Regression", detail: "P10, P50, P90 for each horizon" },
        { name: "9 Models", detail: "3 horizons × 3 quantiles" },
      ],
    },
    {
      icon: Target,
      title: "Predictions",
      color: "orange",
      items: [
        { name: "Real-time", detail: "P10-P90 uncertainty bands" },
        { name: "Position Sizing", detail: "Vol-targeted strategy" },
        { name: "Direction Prob", detail: "Calibrated confidence" },
      ],
    },
  ];

  const getColorClass = (color: string) => {
    const classes = {
      blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
      green: "bg-green-500/10 border-green-500/30 text-green-400",
      purple: "bg-purple-500/10 border-purple-500/30 text-purple-400",
      orange: "bg-orange-500/10 border-orange-500/30 text-orange-400",
    };
    return classes[color as keyof typeof classes];
  };

  return (
    <motion.div
      className="space-y-6"
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeInUp}>
        <h3 className="text-2xl font-bold text-foreground mb-2">Data Pipeline</h3>
        <p className="text-muted-foreground mb-6">
          End-to-end flow from raw data to predictions
        </p>
      </motion.div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <motion.div
              key={stage.title}
              variants={fadeInUp}
              className="relative"
            >
              <Card className={`p-4 border-2 ${getColorClass(stage.color)}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${getColorClass(stage.color)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-foreground">{stage.title}</h4>
                </div>
                <div className="space-y-2">
                  {stage.items.map((item, i) => (
                    <details key={i} className="group">
                      <summary className="cursor-pointer p-2 bg-secondary/50 rounded hover:bg-secondary transition-colors">
                        <div className="flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-400" />
                          <span className="text-sm font-semibold text-foreground">
                            {item.name}
                          </span>
                        </div>
                      </summary>
                      <div className="mt-2 p-2 text-xs text-muted-foreground bg-black/20 rounded">
                        {item.detail}
                      </div>
                    </details>
                  ))}
                </div>
              </Card>

              {/* Arrow between stages */}
              {index < stages.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-2 transform -translate-y-1/2 translate-x-full">
                  <motion.div animate={{ x: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                  </motion.div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <motion.div variants={fadeInUp}>
        <Card className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">3</div>
              <div className="text-sm text-muted-foreground">Data Sources</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">198</div>
              <div className="text-sm text-muted-foreground">Total Features</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">9</div>
              <div className="text-sm text-muted-foreground">Models Trained</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">3</div>
              <div className="text-sm text-muted-foreground">Horizons</div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

