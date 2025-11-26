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
  Sparkles,
  Zap,
} from "lucide-react";

// Import components
import { ModelStatusBar } from "@/components/modules/models/ModelStatusBar";
import { ModelOverviewPanel } from "@/components/modules/models/ModelOverviewPanel";
import { LiveTrainingProgress } from "@/components/modules/training/LiveTrainingProgress";
import { InvestmentSimulator } from "@/components/modules/backtest/InvestmentSimulator";
import { DataPipelineFlow } from "@/components/modules/models/DataPipelineFlow";
import { FeatureExplorer } from "@/components/modules/models/FeatureExplorer";
import { TomorrowPrediction } from "@/components/modules/prediction/TomorrowPrediction";
import { BacktestComparison } from "@/components/modules/backtest/BacktestComparison";
import { AccuracyCharts } from "@/components/modules/accuracy/AccuracyCharts";

// Ticker configuration
const TICKERS = [
  { symbol: "SPY", name: "S&P 500", color: "from-blue-400 to-blue-600" },
  { symbol: "QQQ", name: "Nasdaq 100", color: "from-green-400 to-emerald-600" },
  { symbol: "DIA", name: "Dow Jones", color: "from-purple-400 to-purple-600" },
  { symbol: "IWM", name: "Russell 2000", color: "from-orange-400 to-orange-600" },
  { symbol: "XLK", name: "Technology", color: "from-cyan-400 to-cyan-600" },
];

type TabKey = "overview" | "training" | "simulator" | "data" | "predictions" | "backtest" | "accuracy";

function ModelMonitorContent() {
  const [selectedTicker, setSelectedTicker] = useState("SPY");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const tabs = [
    { key: "overview" as TabKey, label: "Model Overview", icon: Network, description: "Architecture & metrics" },
    { key: "training" as TabKey, label: "Live Training", icon: Activity, description: "Train new models" },
    { key: "simulator" as TabKey, label: "Investment Simulator", icon: DollarSign, description: "Compare strategies" },
    { key: "data" as TabKey, label: "Data Explorer", icon: Database, description: "Browse features" },
    { key: "predictions" as TabKey, label: "Predictions", icon: Target, description: "Tomorrow's forecast" },
    { key: "backtest" as TabKey, label: "Backtesting", icon: BarChart3, description: "Historical performance" },
    { key: "accuracy" as TabKey, label: "Accuracy", icon: TrendingUp, description: "Track accuracy" },
  ];

  const selectedTickerData = TICKERS.find((t) => t.symbol === selectedTicker) || TICKERS[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-950/10">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Page Header with Glassmorphism */}
      <div className="border-b border-white/10 bg-gradient-to-r from-card/50 via-card/30 to-card/50 backdrop-blur-xl sticky top-0 z-10 shadow-2xl">
        <div className="container mx-auto px-6 py-6">
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-blue-400" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Model Monitor Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Comprehensive ML model analytics, training, and performance monitoring with real-time insights
            </p>
          </motion.div>

          {/* Enhanced Ticker Selector */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-blue-500/50 scrollbar-track-transparent">
            {TICKERS.map((ticker) => {
              const isSelected = selectedTicker === ticker.symbol;
              return (
                <motion.button
                  key={ticker.symbol}
                  onClick={() => setSelectedTicker(ticker.symbol)}
                  className={`relative group px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap overflow-hidden ${
                    isSelected
                      ? "text-white shadow-2xl"
                      : "bg-secondary/50 backdrop-blur-sm border border-white/10 text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-white/30"
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeTicker"
                      className={`absolute inset-0 bg-gradient-to-r ${ticker.color} rounded-xl`}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3">
                    <span className="font-mono font-bold text-lg">{ticker.symbol}</span>
                    <span className="hidden sm:inline text-sm opacity-90">{ticker.name}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Enhanced Tab Navigation with Descriptions */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative group p-3 rounded-lg transition-all overflow-hidden ${
                    isActive
                      ? "text-white shadow-lg"
                      : "bg-secondary/30 backdrop-blur-sm border border-white/5 text-muted-foreground hover:text-foreground hover:border-white/20"
                  }`}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="relative z-10">
                    <div className="flex items-center justify-center mb-1">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-medium text-center mb-0.5">{tab.label}</div>
                    <div className="text-[10px] text-center opacity-60">{tab.description}</div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Enhanced Model Status Bar */}
      <ModelStatusBar />

      {/* Main Content with Enhanced Animations */}
      <div className="container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
            >
              <ModelOverviewPanel ticker={selectedTicker} />
            </motion.div>
          )}

          {activeTab === "training" && (
            <motion.div
              key="training"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
            >
              <LiveTrainingProgress />
            </motion.div>
          )}

          {activeTab === "simulator" && (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
            >
              <InvestmentSimulator ticker={selectedTicker} />
            </motion.div>
          )}

          {activeTab === "data" && (
            <motion.div
              key="data"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-8"
            >
              <DataPipelineFlow />
              <FeatureExplorer />
            </motion.div>
          )}

          {activeTab === "predictions" && (
            <motion.div
              key="predictions"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
            >
              <TomorrowPrediction
                index={selectedTicker === "SPY" ? "SPX" : selectedTicker === "QQQ" ? "NDX" : "DJI"}
              />
            </motion.div>
          )}

          {activeTab === "backtest" && (
            <motion.div
              key="backtest"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                <h2 className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Strategy Backtesting
                </h2>
                <p className="text-muted-foreground">
                  Compare confidence threshold vs Kelly criterion strategies with real-time performance metrics
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="mb-6 p-6 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                <h2 className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Accuracy Analytics
                </h2>
                <p className="text-muted-foreground">
                  Track historical performance, calibration, and prediction accuracy with detailed metrics
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
