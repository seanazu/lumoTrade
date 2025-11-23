"use client";

import { useState } from "react";
import { useQuery, QueryClientProvider } from "@tanstack/react-query";
import {
  Brain,
  TrendingUp,
  Database,
  Zap,
  Activity,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Newspaper,
  MessageSquare,
  Globe,
  Target,
  Layers,
  Sparkles,
  LineChart,
} from "lucide-react";
import { GlassCard } from "@/components/design-system/atoms/GlassCard";
import { Button } from "@/components/design-system/atoms/Button";
import { AppShell } from "@/components/design-system/organisms/AppShell";
import { queryClient } from "@/lib/tanstack-query/queryClient";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Updated interface for hybrid prediction model
interface HybridPrediction {
  success: boolean;
  data: {
    index: string;
    symbol: string;
    timestamp: string;
    model_version: string;
    horizons: {
      [key: string]: {
        mean: number;
        p10: number;
        p90: number;
        direction: string;
        confidence: number;
      };
    };
    key_factors: Array<{
      factor: string;
      impact: string;
      sentiment: string;
    }>;
    qualitative_risks: string[];
    confidence_summary: {
      overall: number;
      by_horizon: { [key: string]: number };
    };
    debug?: {
      stages: Array<{
        name: string;
        duration_ms: number;
        status: string;
      }>;
      detailed_steps: Array<{
        timestamp: string;
        step: string;
        details: string;
        data?: any;
      }>;
      data_sources: {
        market_data?: any;
        technical_indicators?: any;
        market_direction?: any;
        social_sentiment?: any;
        macro_data?: any;
      };
      feature_values?: any;
      base_ml_predictions?: any;
      llm_adjustments?: any;
      fusion_details?: any;
    };
  };
}

async function fetchPredictionWithDebug(): Promise<HybridPrediction> {
  const response = await fetch("http://localhost:8000/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol: "SPY", debug: true }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch prediction");
  }

  return response.json();
}

function ModelMonitorContent() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    horizons: true,
    dataViz: true,
    factors: true,
    pipeline: false,
    rawData: false,
  });

  const [selectedHorizon, setSelectedHorizon] = useState<string>("1d");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["hybrid-prediction-debug"],
    queryFn: fetchPredictionWithDebug,
    refetchInterval: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const horizonLabels: { [key: string]: string } = {
    "1h": "1 Hour",
    "4h": "4 Hours",
    "10h": "10 Hours",
    "1d": "1 Day",
    "3d": "3 Days",
    "5d": "5 Days",
  };

  return (
    <AppShell
      topBarContent={
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Market
          </Link>
          <Link
            href="/analyzer"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Stock Analyzer
          </Link>
          <Link
            href="/model-monitor"
            className="text-sm font-semibold text-primary border-b-2 border-primary pb-0.5"
          >
            Model Monitor
          </Link>
        </nav>
      }
      sidebarContent={null}
      alertCount={0}
      userEmail="user@example.com"
    >
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <Brain className="h-10 w-10 text-primary" />
                <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Hybrid ML Monitor</h1>
                <p className="text-sm text-muted-foreground">
                  LightGBM + Market Sentiment + ChatGPT-5
                </p>
              </div>
            </div>
            <p className="text-muted-foreground">
              Real-time insights into the AI prediction engine's multi-horizon forecasts
            </p>
          </div>
          <Button onClick={() => refetch()} disabled={isLoading} size="lg" className="gap-2">
            <Zap className="h-4 w-4" />
            {isLoading ? "Analyzing..." : "Generate Prediction"}
          </Button>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <GlassCard className="p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <Brain className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-lg font-semibold">Running hybrid prediction pipeline...</p>
              <p className="text-sm text-muted-foreground">
                Fetching data, calculating features, and generating multi-horizon forecasts
              </p>
            </div>
          </GlassCard>
        )}

        {/* Error State */}
        {error && (
          <GlassCard className="p-6 border-2 border-destructive/30">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-semibold">Failed to generate prediction</p>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : "Unknown error"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Make sure the ML backend is running: <code className="bg-muted px-2 py-1 rounded">cd ml-backend && uvicorn app:app</code>
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Prediction Result */}
        {data && (
          <>
            {/* Multi-Horizon Predictions */}
            <GlassCard className="p-6 border-2 border-primary/30">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Target className="h-6 w-6 text-primary" />
                  Multi-Horizon Predictions
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {new Date(data.data.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Horizon Selector */}
              <div className="flex flex-wrap gap-2 mb-6">
                {Object.keys(data.data.horizons).map((horizon) => (
                  <button
                    key={horizon}
                    onClick={() => setSelectedHorizon(horizon)}
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium transition-all",
                      selectedHorizon === horizon
                        ? "bg-primary text-primary-foreground shadow-lg scale-105"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {horizonLabels[horizon] || horizon}
                  </button>
                ))}
              </div>

              {/* Selected Horizon Details */}
              <AnimatePresence mode="wait">
                {data.data.horizons[selectedHorizon] && (
                  <motion.div
                    key={selectedHorizon}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4"
                  >
                    <div className="p-4 bg-background/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Direction</p>
                      <div className="flex items-center gap-2">
                        {data.data.horizons[selectedHorizon].direction === "up" ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                        <p
                          className={cn(
                            "text-2xl font-bold capitalize",
                            data.data.horizons[selectedHorizon].direction === "up"
                              ? "text-green-500"
                              : "text-red-500"
                          )}
                        >
                          {data.data.horizons[selectedHorizon].direction}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-background/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Expected Return</p>
                      <p className="text-2xl font-bold">
                        {data.data.horizons[selectedHorizon].mean > 0 ? "+" : ""}
                        {(data.data.horizons[selectedHorizon].mean * 100).toFixed(2)}%
                      </p>
                    </div>

                    <div className="p-4 bg-background/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">
                          {(data.data.horizons[selectedHorizon].confidence * 100).toFixed(0)}%
                        </p>
                        <div className="flex-1">
                          <div className="h-2 bg-background rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${data.data.horizons[selectedHorizon].confidence * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-background/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Range (10th-90th)</p>
                      <p className="text-sm font-medium">
                        {(data.data.horizons[selectedHorizon].p10 * 100).toFixed(2)}% to{" "}
                        {(data.data.horizons[selectedHorizon].p90 * 100).toFixed(2)}%
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* All Horizons Overview */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(data.data.horizons).map(([horizon, pred]) => (
                  <div
                    key={horizon}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all cursor-pointer",
                      selectedHorizon === horizon
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-background/30 hover:border-muted"
                    )}
                    onClick={() => setSelectedHorizon(horizon)}
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      {horizonLabels[horizon] || horizon}
                    </p>
                    <p
                      className={cn(
                        "text-lg font-bold",
                        pred.direction === "up" ? "text-green-500" : "text-red-500"
                      )}
                    >
                      {pred.mean > 0 ? "+" : ""}
                      {(pred.mean * 100).toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(pred.confidence * 100).toFixed(0)}% conf
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Live Data Sources Visualization */}
            <GlassCard>
              <button
                onClick={() => toggleSection("dataViz")}
                className="w-full p-6 flex items-center justify-between hover:bg-background/50 transition-colors"
              >
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Live Data Sources & Features
                </h3>
                {expandedSections.dataViz ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>

              {expandedSections.dataViz && (
                <div className="px-6 pb-6 space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Real-time data the hybrid model uses to generate predictions
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Market Data */}
                    {data.data.debug?.data_sources?.market_data && (
                      <div className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent rounded-lg border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-4">
                          <DollarSign className="h-5 w-5 text-blue-500" />
                          <h4 className="font-semibold">Market Data</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Current Price</span>
                            <span className="text-lg font-bold">
                              ${data.data.debug.data_sources.market_data.price?.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Change</span>
                            <span
                              className={cn(
                                "text-lg font-bold",
                                data.data.debug.data_sources.market_data.change_percent > 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              )}
                            >
                              {data.data.debug.data_sources.market_data.change_percent > 0
                                ? "+"
                                : ""}
                              {data.data.debug.data_sources.market_data.change_percent?.toFixed(
                                2
                              )}
                              %
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Volume</span>
                            <span className="text-sm font-medium">
                              {(
                                data.data.debug.data_sources.market_data.volume / 1000000
                              ).toFixed(1)}
                              M
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VIX / Fear Index */}
                    {data.data.debug?.data_sources?.macro_data && (
                      <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-lg border border-yellow-500/20">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          <h4 className="font-semibold">VIX (Fear Index)</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Current Level</span>
                            <span className="text-2xl font-bold">
                              {data.data.debug.data_sources.macro_data.vix?.toFixed(2)}
                            </span>
                          </div>
                          <div className="mt-2">
                            <div className="h-2 bg-background rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full transition-all",
                                  data.data.debug.data_sources.macro_data.vix < 15
                                    ? "bg-green-500"
                                    : data.data.debug.data_sources.macro_data.vix < 25
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                )}
                                style={{
                                  width: `${Math.min(
                                    (data.data.debug.data_sources.macro_data.vix / 50) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Low Fear</span>
                              <span>High Fear</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Market Direction Sentiment */}
                    {data.data.debug?.data_sources?.market_direction && (
                      <div className="p-4 bg-gradient-to-br from-purple-500/10 to-transparent rounded-lg border border-purple-500/20 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                          <Globe className="h-5 w-5 text-purple-500" />
                          <h4 className="font-semibold">
                            Market Direction Sentiment (Multi-Source News)
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Weighted Mean</p>
                            <p
                              className={cn(
                                "text-lg font-bold",
                                data.data.debug.data_sources.market_direction
                                  .sentiment_weighted_mean > 0
                                  ? "text-green-500"
                                  : data.data.debug.data_sources.market_direction
                                      .sentiment_weighted_mean < 0
                                  ? "text-red-500"
                                  : "text-gray-500"
                              )}
                            >
                              {data.data.debug.data_sources.market_direction.sentiment_weighted_mean?.toFixed(
                                3
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Events</p>
                            <p className="text-lg font-bold">
                              {data.data.debug.data_sources.market_direction.event_count}
                              <span className="text-xs text-muted-foreground ml-1">
                                (
                                {
                                  data.data.debug.data_sources.market_direction
                                    .hi_imp_event_count
                                }{" "}
                                hi-imp)
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Macro Events</p>
                            <p className="text-lg font-bold">
                              {data.data.debug.data_sources.market_direction.macro_event_count}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                            <p className="text-lg font-bold">
                              {(
                                data.data.debug.data_sources.market_direction.confidence * 100
                              ).toFixed(0)}
                              %
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Social Sentiment (ChatGPT-5) */}
                    {data.data.debug?.data_sources?.social_sentiment && (
                      <div className="p-4 bg-gradient-to-br from-green-500/10 to-transparent rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-2 mb-4">
                          <MessageSquare className="h-5 w-5 text-green-500" />
                          <h4 className="font-semibold">Social Sentiment (GPT-5)</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Score</span>
                            <span
                              className={cn(
                                "text-lg font-bold",
                                data.data.debug.data_sources.social_sentiment
                                  .social_sentiment_score > 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              )}
                            >
                              {data.data.debug.data_sources.social_sentiment.social_sentiment_score?.toFixed(
                                2
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Confidence</span>
                            <span className="text-sm font-medium">
                              {(
                                data.data.debug.data_sources.social_sentiment.confidence * 100
                              ).toFixed(0)}
                              %
                            </span>
                          </div>
                          {data.data.debug.data_sources.social_sentiment.notes && (
                            <p className="text-xs text-muted-foreground italic">
                              {data.data.debug.data_sources.social_sentiment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Technical Indicators */}
                    {data.data.debug?.data_sources?.technical_indicators &&
                      Object.keys(data.data.debug.data_sources.technical_indicators).length >
                        0 && (
                        <div className="p-4 bg-gradient-to-br from-orange-500/10 to-transparent rounded-lg border border-orange-500/20">
                          <div className="flex items-center gap-2 mb-4">
                            <LineChart className="h-5 w-5 text-orange-500" />
                            <h4 className="font-semibold">Technical Indicators</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(data.data.debug.data_sources.technical_indicators)
                              .filter(([_, value]) => value !== null && value !== undefined)
                              .slice(0, 6)
                              .map(([key, value]: [string, any]) => (
                                <div key={key}>
                                  <p className="text-xs text-muted-foreground uppercase">
                                    {key.replace(/_/g, " ")}
                                  </p>
                                  <p className="text-sm font-bold">
                                    {typeof value === "number" ? value.toFixed(2) : value}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Key Factors */}
            {data.data.key_factors && data.data.key_factors.length > 0 && (
              <GlassCard>
                <button
                  onClick={() => toggleSection("factors")}
                  className="w-full p-6 flex items-center justify-between hover:bg-background/50 transition-colors"
                >
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Key Factors ({data.data.key_factors.length})
                  </h3>
                  {expandedSections.factors ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>

                {expandedSections.factors && (
                  <div className="px-6 pb-6 space-y-3">
                    {data.data.key_factors.map((factor, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 bg-background/50 rounded-lg flex items-start gap-3"
                      >
                        <div
                          className={cn(
                            "mt-1 h-2 w-2 rounded-full flex-shrink-0",
                            factor.sentiment === "positive"
                              ? "bg-green-500"
                              : factor.sentiment === "negative"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          )}
                        />
                        <div className="flex-1">
                          <p className="text-sm">{factor.factor}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                factor.impact === "high"
                                  ? "bg-red-500/20 text-red-500"
                                  : factor.impact === "medium"
                                  ? "bg-yellow-500/20 text-yellow-500"
                                  : "bg-blue-500/20 text-blue-500"
                              )}
                            >
                              {factor.impact} impact
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {factor.sentiment}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {/* Pipeline Performance */}
            {data.data.debug?.stages && data.data.debug.stages.length > 0 && (
              <GlassCard>
                <button
                  onClick={() => toggleSection("pipeline")}
                  className="w-full p-6 flex items-center justify-between hover:bg-background/50 transition-colors"
                >
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Pipeline Performance
                  </h3>
                  {expandedSections.pipeline ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>

                {expandedSections.pipeline && (
                  <div className="px-6 pb-6 space-y-3">
                    {data.data.debug.stages.map((stage: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {stage.status === "complete" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : stage.status === "skipped" ? (
                            <XCircle className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-blue-500 animate-spin" />
                          )}
                          <span className="font-medium">{stage.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{stage.duration_ms}ms</span>
                          <span
                            className={cn(
                              "text-xs px-2 py-1 rounded",
                              stage.status === "complete"
                                ? "bg-green-500/10 text-green-500"
                                : stage.status === "skipped"
                                ? "bg-yellow-500/10 text-yellow-500"
                                : "bg-gray-500/10 text-gray-500"
                            )}
                          >
                            {stage.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Total Processing Time</span>
                        <span className="font-bold text-primary">
                          {data.data.debug.stages.reduce(
                            (sum: number, s: any) => sum + s.duration_ms,
                            0
                          )}
                          ms
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>
            )}

            {/* Raw Data */}
            <GlassCard>
              <button
                onClick={() => toggleSection("rawData")}
                className="w-full p-6 flex items-center justify-between hover:bg-background/50 transition-colors"
              >
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Raw API Responses & Debug Data
                </h3>
                {expandedSections.rawData ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>

              {expandedSections.rawData && (
                <div className="px-6 pb-6 space-y-4">
                  {data.data.debug?.data_sources && (
                    <>
                      {Object.entries(data.data.debug.data_sources).map(([key, value]) => (
                        <div key={key}>
                          <h4 className="font-semibold mb-2 flex items-center gap-2 capitalize">
                            📊 {key.replace(/_/g, " ")}
                          </h4>
                          <pre className="p-4 bg-background rounded-lg overflow-x-auto text-xs">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </>
                  )}

                  {data.data.debug?.fusion_details && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        🔗 Fusion Details
                      </h4>
                      <pre className="p-4 bg-background rounded-lg overflow-x-auto text-xs">
                        {JSON.stringify(data.data.debug.fusion_details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function ModelMonitor() {
  return (
    <QueryClientProvider client={queryClient}>
      <ModelMonitorContent />
    </QueryClientProvider>
  );
}
