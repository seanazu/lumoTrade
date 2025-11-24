"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "@/components/design-system/organisms/AppShell";
import { queryClient } from "@/lib/tanstack-query/queryClient";
import { Card } from "@/components/design-system/atoms/Card";
import { TomorrowPrediction } from "@/components/modules/prediction/TomorrowPrediction";
import { BacktestComparison } from "@/components/modules/backtest/BacktestComparison";
import { TrainingPanel } from "@/components/modules/training/TrainingPanel";
import { AccuracyCharts } from "@/components/modules/accuracy/AccuracyCharts";
import { Activity, TrendingUp, BarChart3, Brain, Target } from "lucide-react";
import { motion } from "framer-motion";

// Index configuration with colors
const INDICES = [
  { id: "SPX", name: "S&P 500", symbol: "SPY", color: "blue" },
  { id: "NDX", name: "Nasdaq 100", symbol: "QQQ", color: "green" },
  { id: "DJI", name: "Dow Jones", symbol: "DIA", color: "purple" },
];

const COLOR_CLASSES = {
  blue: {
    border: "border-blue-500/50",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    hover: "hover:bg-blue-500/20",
  },
  green: {
    border: "border-green-500/50",
    bg: "bg-green-500/10",
    text: "text-green-400",
    hover: "hover:bg-green-500/20",
  },
  purple: {
    border: "border-purple-500/50",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    hover: "hover:bg-purple-500/20",
  },
};

function ModelMonitorContent() {
  const [selectedIndex, setSelectedIndex] = useState("SPX");
  const [activeTab, setActiveTab] = useState<
    "prediction" | "backtest" | "training" | "accuracy"
  >("prediction");

  const selectedIndexData =
    INDICES.find((i) => i.id === selectedIndex) || INDICES[0];
  const colorClass =
    COLOR_CLASSES[selectedIndexData.color as keyof typeof COLOR_CLASSES];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header Section */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Model Monitor Dashboard
              </h1>
              <p className="text-gray-400">
                Professional-grade trading intelligence powered by AI
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-3 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm text-gray-300">System Online</span>
            </div>
          </div>

          {/* Index Selector Tabs */}
          <div className="flex gap-2">
            {INDICES.map((index) => {
              const isSelected = selectedIndex === index.id;
              const colors =
                COLOR_CLASSES[index.color as keyof typeof COLOR_CLASSES];

              return (
                <button
                  key={index.id}
                  onClick={() => setSelectedIndex(index.id)}
                  className={`
                    relative px-6 py-3 rounded-lg font-semibold transition-all
                    ${
                      isSelected
                        ? `${colors.bg} ${colors.border} border ${colors.text}`
                        : "bg-gray-800/30 border border-gray-700 text-gray-400 hover:bg-gray-800/50"
                    }
                  `}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute inset-0 ${colors.bg} ${colors.border} border rounded-lg`}
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="text-xs font-mono">{index.symbol}</span>
                    <span className="hidden sm:inline">{index.name}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 flex gap-2 border-b border-gray-800">
            {[
              {
                id: "prediction",
                label: "Tomorrow's Prediction",
                icon: Target,
              },
              { id: "backtest", label: "Backtesting", icon: BarChart3 },
              { id: "training", label: "Model Training", icon: Brain },
              { id: "accuracy", label: "Accuracy Analytics", icon: TrendingUp },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    relative px-4 py-3 font-medium transition-all
                    ${
                      isActive
                        ? `${colorClass.text}`
                        : "text-gray-400 hover:text-gray-300"
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      className={`absolute bottom-0 left-0 right-0 h-0.5 ${colorClass.bg.replace("/10", "")}`}
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "prediction" && (
            <div>
              <TomorrowPrediction index={selectedIndex} />
            </div>
          )}

          {activeTab === "backtest" && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Strategy Backtesting
                </h2>
                <p className="text-gray-400">
                  Compare confidence threshold vs Kelly criterion strategies to
                  optimize trading performance
                </p>
              </div>
              <BacktestComparison
                index={selectedIndex}
                symbol={selectedIndexData.symbol}
              />
            </div>
          )}

          {activeTab === "training" && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Model Training
                </h2>
                <p className="text-gray-400">
                  Monitor model status and trigger retraining with custom
                  parameters
                </p>
              </div>
              <TrainingPanel />
            </div>
          )}

          {activeTab === "accuracy" && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Accuracy Analytics
                </h2>
                <p className="text-gray-400">
                  Track historical performance, calibration, and prediction
                  accuracy over time
                </p>
              </div>
              <AccuracyCharts days={30} />
            </div>
          )}
        </motion.div>

        {/* Quick Stats Footer */}
        <Card className="mt-8 p-6 bg-gray-900/30 border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Active Models</span>
              </div>
              <p className="text-2xl font-bold text-white">6</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">Horizons</span>
              </div>
              <p className="text-2xl font-bold text-white">1h - 5d</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">Model Type</span>
              </div>
              <p className="text-lg font-bold text-white">Hybrid AI</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-gray-400">Indices</span>
              </div>
              <p className="text-2xl font-bold text-white">3</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function ModelMonitorPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <ModelMonitorContent />
      </AppShell>
    </QueryClientProvider>
  );
}
