"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "@/components/design-system/organisms/AppShell";
import { queryClient } from "@/lib/tanstack-query/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network,
  Activity,
  DollarSign,
  Database,
  Target,
  BarChart3,
  TrendingUp,
} from "lucide-react";

// Import new components
import { ModelStatusBar } from "@/components/modules/models/ModelStatusBar";
import { ModelOverviewPanel } from "@/components/modules/models/ModelOverviewPanel";
import { LiveTrainingProgress } from "@/components/modules/training/LiveTrainingProgress";
import { InvestmentSimulator } from "@/components/modules/backtest/InvestmentSimulator";
import { DataPipelineFlow } from "@/components/modules/models/DataPipelineFlow";
import { FeatureExplorer } from "@/components/modules/models/FeatureExplorer";

// Keep existing components
import { TomorrowPrediction } from "@/components/modules/prediction/TomorrowPrediction";
import { BacktestComparison } from "@/components/modules/backtest/BacktestComparison";
import { AccuracyCharts } from "@/components/modules/accuracy/AccuracyCharts";

// Ticker configuration
const TICKERS = [
  { symbol: "SPY", name: "S&P 500", color: "blue" },
  { symbol: "QQQ", name: "Nasdaq 100", color: "green" },
  { symbol: "DIA", name: "Dow Jones", color: "purple" },
  { symbol: "IWM", name: "Russell 2000", color: "orange" },
  { symbol: "XLK", name: "Technology", color: "cyan" },
];

type TabKey = "overview" | "training" | "simulator" | "data" | "predictions" | "backtest" | "accuracy";

function ModelMonitorContent() {
  const [selectedTicker, setSelectedTicker] = useState("SPY");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const tabs = [
    { key: "overview" as TabKey, label: "Model Overview", icon: Network },
    { key: "training" as TabKey, label: "Live Training", icon: Activity },
    { key: "simulator" as TabKey, label: "Investment Simulator", icon: DollarSign },
    { key: "data" as TabKey, label: "Data Explorer", icon: Database },
    { key: "predictions" as TabKey, label: "Predictions", icon: Target },
    { key: "backtest" as TabKey, label: "Backtesting", icon: BarChart3 },
    { key: "accuracy" as TabKey, label: "Accuracy", icon: TrendingUp },
  ];

  const selectedTickerData = TICKERS.find((t) => t.symbol === selectedTicker) || TICKERS[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Model Monitor Dashboard
            </h1>
            <p className="text-muted-foreground">
              Comprehensive ML model analytics, training, and performance monitoring
            </p>
          </div>

          {/* Ticker Selector */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {TICKERS.map((ticker) => {
              const isSelected = selectedTicker === ticker.symbol;
              return (
                <motion.button
                  key={ticker.symbol}
                  onClick={() => setSelectedTicker(ticker.symbol)}
                  className={`relative px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    isSelected
                      ? `bg-${ticker.color}-500/20 border-2 border-${ticker.color}-500 text-${ticker.color}-400`
                      : "bg-secondary border-2 border-border text-muted-foreground hover:border-${ticker.color}-500/50"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeTicker"
                      className="absolute inset-0 bg-blue-500/10 rounded-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="font-mono font-bold">{ticker.symbol}</span>
                    <span className="hidden sm:inline text-sm">{ticker.name}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-4 py-3 rounded-t-lg font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "text-blue-400 bg-secondary/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                  }`}
                  whileHover={{ y: -2 }}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Model Status Bar */}
      <ModelStatusBar />

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ModelOverviewPanel ticker={selectedTicker} />
            </motion.div>
          )}

          {activeTab === "training" && (
            <motion.div
              key="training"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <LiveTrainingProgress />
            </motion.div>
          )}

          {activeTab === "simulator" && (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <InvestmentSimulator ticker={selectedTicker} />
            </motion.div>
          )}

          {activeTab === "data" && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <DataPipelineFlow />
              <FeatureExplorer />
            </motion.div>
          )}

          {activeTab === "predictions" && (
            <motion.div
              key="predictions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TomorrowPrediction
                index={selectedTicker === "SPY" ? "SPX" : selectedTicker === "QQQ" ? "NDX" : "DJI"}
              />
            </motion.div>
          )}

          {activeTab === "backtest" && (
            <motion.div
              key="backtest"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Strategy Backtesting</h2>
                <p className="text-muted-foreground">
                  Compare confidence threshold vs Kelly criterion strategies
                </p>
              </div>
              <BacktestComparison
                index={selectedTicker === "SPY" ? "SPX" : selectedTicker === "QQQ" ? "NDX" : "DJI"}
                symbol={selectedTicker}
              />
            </motion.div>
          )}

          {activeTab === "accuracy" && (
            <motion.div
              key="accuracy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Accuracy Analytics</h2>
                <p className="text-muted-foreground">
                  Track historical performance, calibration, and prediction accuracy
                </p>
              </div>
              <AccuracyCharts days={30} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ModelMonitorPage() {
  return (
    <AppShell showGlobalSidebar={true}>
      <QueryClientProvider client={queryClient}>
        <ModelMonitorContent />
      </QueryClientProvider>
    </AppShell>
  );
}
