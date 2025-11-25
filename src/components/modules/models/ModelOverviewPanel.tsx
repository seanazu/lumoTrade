"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Network,
  Database,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Layers,
  Box,
} from "lucide-react";
import { Card } from "@/components/design-system/atoms/Card";
import {
  cardVariants,
  staggerChildren,
  fadeInUp,
  scaleIn,
} from "@/lib/animations/variants";

interface ModelInfo {
  architecture: {
    model_type: string;
    quantiles: number[];
    horizons: number[];
    total_models: number;
    params: Record<string, any>;
  };
  config: {
    universe: string[];
    total_samples: number;
    total_features: number;
    interval: string;
    train_window: number;
    test_window: number;
    date_range: {
      start: string;
      end: string;
    };
  };
  performance: {
    mae: {
      fold1: number;
      fold2: number;
      average: number;
    };
    coverage: number;
    direction_accuracy: number;
    training_duration: string;
  };
  feature_counts: Record<string, number>;
  last_trained: string;
  status: string;
}

interface ModelOverviewPanelProps {
  ticker?: string;
}

export function ModelOverviewPanel({ ticker }: ModelOverviewPanelProps) {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  useEffect(() => {
    fetchModelInfo();
  }, []);

  const fetchModelInfo = async () => {
    try {
      const response = await fetch("http://localhost:8001/api/model/info");
      const data = await response.json();
      setModelInfo(data);
    } catch (error) {
      console.error("Failed to fetch model info:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-4">
              <div className="h-8 bg-muted animate-pulse rounded" />
              <div className="h-32 bg-muted animate-pulse rounded" />
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!modelInfo) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Failed to load model information</p>
        </div>
      </Card>
    );
  }

  const getHorizonColor = (horizon: number) => {
    if (horizon === 1) return "blue";
    if (horizon === 5) return "green";
    if (horizon === 20) return "purple";
    return "gray";
  };

  const getHorizonClass = (color: string) => {
    const classes = {
      blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
      green: "bg-green-500/10 border-green-500/30 text-green-400",
      purple: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    };
    return classes[color as keyof typeof classes] || "bg-gray-500/10 border-gray-500/30 text-gray-400";
  };

  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
    >
      {/* Column 1: Model Architecture */}
      <motion.div variants={cardVariants}>
        <Card className="p-6 h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Network className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Architecture</h3>
              <p className="text-sm text-muted-foreground">Model Structure</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Model Type */}
            <div className="p-4 bg-secondary rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Type</span>
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <p className="font-mono text-sm text-foreground font-semibold">
                {modelInfo.architecture.model_type}
              </p>
            </div>

            {/* Horizons & Quantiles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Horizons</span>
                <span className="font-semibold text-foreground">
                  {modelInfo.architecture.horizons.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {modelInfo.architecture.horizons.map((h) => {
                  const color = getHorizonColor(h);
                  return (
                    <motion.div
                      key={h}
                      className={`px-3 py-1.5 rounded-lg border ${getHorizonClass(color)}`}
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="text-sm font-semibold">{h}h</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quantiles</span>
                <span className="font-semibold text-foreground">
                  {modelInfo.architecture.quantiles.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {modelInfo.architecture.quantiles.map((q) => (
                  <div
                    key={q}
                    className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg"
                  >
                    <span className="text-sm font-semibold text-purple-400">
                      P{(q * 100).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Tree Diagram */}
            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground mb-3">
                Model Structure
              </div>
              <div className="space-y-2">
                {modelInfo.architecture.horizons.map((h) => (
                  <motion.div
                    key={h}
                    className="space-y-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: h * 0.1 }}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full bg-${getHorizonColor(h)}-400`} />
                      <span className="font-semibold text-foreground">{h}h →</span>
                    </div>
                    <div className="ml-4 flex gap-1">
                      {modelInfo.architecture.quantiles.map((q) => (
                        <div
                          key={`${h}-${q}`}
                          className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground"
                        >
                          P{(q * 100).toFixed(0)}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border text-center">
                <span className="text-sm font-bold text-foreground">
                  {modelInfo.architecture.total_models} Models
                </span>
              </div>
            </div>

            {/* Key Parameters */}
            <details className="group">
              <summary className="flex items-center justify-between p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors">
                <span className="text-sm font-semibold text-foreground">
                  Hyperparameters
                </span>
                <Box className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-2 p-3 bg-secondary/50 rounded-lg border border-border text-xs space-y-1">
                {Object.entries(modelInfo.architecture.params).slice(0, 8).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground font-mono">{key}:</span>
                    <span className="text-foreground font-mono">{String(value)}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </Card>
      </motion.div>

      {/* Column 2: Training Configuration */}
      <motion.div variants={cardVariants}>
        <Card className="p-6 h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Database className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Configuration</h3>
              <p className="text-sm text-muted-foreground">Training Setup</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Universe */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Universe</span>
                <span className="text-xs font-semibold text-foreground">
                  {modelInfo.config.universe.length} Tickers
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {modelInfo.config.universe.map((ticker) => (
                  <motion.div
                    key={ticker}
                    className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="text-sm font-bold text-blue-400">{ticker}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Data Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">Samples</div>
                <div className="text-2xl font-bold text-foreground">
                  {modelInfo.config.total_samples.toLocaleString()}
                </div>
                <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-green-400 h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((modelInfo.config.total_samples / 40000) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Target: 40,000
                </div>
              </div>

              <div className="p-3 bg-secondary rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">Features</div>
                <div className="text-2xl font-bold text-foreground">
                  {modelInfo.config.total_features}
                </div>
                <div className="text-xs text-green-400 mt-2">
                  ✓ Production Ready
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-4 bg-secondary rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-foreground">
                  Data Coverage
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Start</span>
                  <span className="font-mono text-foreground">
                    {modelInfo.config.date_range.start}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">End</span>
                  <span className="font-mono text-foreground">
                    {modelInfo.config.date_range.end}
                  </span>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="text-foreground font-semibold">
                      {(() => {
                        const start = new Date(modelInfo.config.date_range.start);
                        const end = new Date(modelInfo.config.date_range.end);
                        const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
                        return `${years.toFixed(1)} years`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Training Windows */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="text-xs text-blue-400 mb-1">Train Window</div>
                <div className="text-lg font-bold text-foreground">
                  {modelInfo.config.train_window}
                </div>
                <div className="text-xs text-muted-foreground">bars</div>
              </div>
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="text-xs text-purple-400 mb-1">Test Window</div>
                <div className="text-lg font-bold text-foreground">
                  {modelInfo.config.test_window}
                </div>
                <div className="text-xs text-muted-foreground">bars</div>
              </div>
            </div>

            {/* Interval */}
            <div className="p-3 bg-secondary rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Data Interval</span>
                <span className="text-lg font-bold text-foreground">
                  {modelInfo.config.interval}
                </span>
              </div>
            </div>

            {/* Feature Breakdown */}
            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
              <div className="text-sm font-semibold text-foreground mb-3">
                Feature Categories
              </div>
              <div className="space-y-2">
                {Object.entries(modelInfo.feature_counts).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{category}</span>
                    <span className="font-mono font-semibold text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Column 3: Performance Metrics */}
      <motion.div variants={cardVariants}>
        <Card className="p-6 h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Performance</h3>
              <p className="text-sm text-muted-foreground">Model Metrics</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* MAE Metrics */}
            <div className="p-4 bg-secondary rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">
                  Mean Absolute Error
                </span>
                <span className="text-xs text-muted-foreground">Lower is better</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Fold 1</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">
                      {modelInfo.performance.mae.fold1.toFixed(2)}%
                    </span>
                    {modelInfo.performance.mae.fold1 < 1.5 ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Fold 2</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">
                      {modelInfo.performance.mae.fold2.toFixed(2)}%
                    </span>
                    {modelInfo.performance.mae.fold2 < 1.5 ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-foreground">Average</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-foreground">
                        {modelInfo.performance.mae.average.toFixed(2)}%
                      </span>
                      {modelInfo.performance.mae.average < 1.5 ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coverage */}
            <div className="p-4 bg-secondary rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">P10-P90 Coverage</span>
                {modelInfo.performance.coverage >= 0.75 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">
                {(modelInfo.performance.coverage * 100).toFixed(0)}%
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${
                    modelInfo.performance.coverage >= 0.75 ? "bg-green-400" : "bg-amber-400"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${modelInfo.performance.coverage * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Target: ≥ 75%
              </div>
            </div>

            {/* Direction Accuracy */}
            <div className="p-4 bg-secondary rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Direction Accuracy</span>
                {modelInfo.performance.direction_accuracy >= 0.55 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">
                {(modelInfo.performance.direction_accuracy * 100).toFixed(0)}%
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${
                    modelInfo.performance.direction_accuracy >= 0.55 ? "bg-green-400" : "bg-amber-400"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${modelInfo.performance.direction_accuracy * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Target: ≥ 55%
              </div>
            </div>

            {/* Training Duration */}
            <div className="p-4 bg-secondary rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-muted-foreground">Training Duration</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {modelInfo.performance.training_duration}
              </div>
            </div>

            {/* Last Trained */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="text-xs text-purple-400 mb-1">Last Trained</div>
              <div className="text-sm font-mono text-foreground">
                {new Date(modelInfo.last_trained).toLocaleString()}
              </div>
            </div>

            {/* Overall Status */}
            <motion.div
              className={`p-4 rounded-lg border-2 ${
                modelInfo.performance.mae.average < 1.5 &&
                modelInfo.performance.coverage >= 0.75 &&
                modelInfo.performance.direction_accuracy >= 0.55
                  ? "bg-green-500/10 border-green-500/50"
                  : "bg-amber-500/10 border-amber-500/50"
              }`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2">
                {modelInfo.performance.mae.average < 1.5 &&
                modelInfo.performance.coverage >= 0.75 &&
                modelInfo.performance.direction_accuracy >= 0.55 ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-green-400">Model Performing Well</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-amber-400" />
                    <span className="font-semibold text-amber-400">Needs Improvement</span>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

