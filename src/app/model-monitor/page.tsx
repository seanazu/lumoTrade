"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  TrendingUp,
  History,
  Calendar,
  Zap,
  Target,
  Bell,
} from "lucide-react";

// Import new production model components
import { DailyPrediction } from "@/components/modules/models/DailyPrediction";
import { TradeAlerts } from "@/components/modules/models/TradeAlerts";
import { PerformanceChart } from "@/components/modules/models/PerformanceChart";
import { TrainingPanel } from "@/components/modules/models/TrainingPanel";

// Import existing trading components
import { TodaysTrades } from "@/components/modules/trading/TodaysTrades";
import { TradeHistory } from "@/components/modules/trading/TradeHistory";
import { MorningStrategy } from "@/components/modules/trading/MorningStrategy";

type TabKey = "prediction" | "training" | "today" | "history" | "strategy";

export default function ModelMonitorPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("prediction");

  const tabs = [
    {
      key: "prediction" as TabKey,
      label: "Today's Prediction",
      icon: Target,
      description: "AI forecast",
    },
    {
      key: "training" as TabKey,
      label: "Train Model",
      icon: Play,
      description: "Optimize model",
    },
    {
      key: "today" as TabKey,
      label: "Today's Trades",
      icon: Calendar,
      description: "Live positions",
    },
    {
      key: "history" as TabKey,
      label: "Trade History",
      icon: History,
      description: "Past trades",
    },
    {
      key: "strategy" as TabKey,
      label: "Morning Strategy",
      icon: Zap,
      description: "Pre-market",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-950/10">
      {/* Page Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-card/50 via-card/30 to-card/50 backdrop-blur-xl sticky top-0 z-10 shadow-2xl">
        <div className="container mx-auto px-6 py-6">
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-8 h-8 text-blue-400" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Model Monitor
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Production ML Model • 64% Accuracy • 80.8% High-Confidence •
              Adaptive Trading
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
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
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <div className="relative z-10">
                    <div className="flex items-center justify-center mb-1">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-medium text-center mb-0.5">
                      {tab.label}
                    </div>
                    <div className="text-[10px] text-center opacity-60">
                      {tab.description}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "prediction" && (
            <motion.div
              key="prediction"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Main Prediction */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <DailyPrediction />
                </div>
                <div className="space-y-6">
                  <TradeAlerts />
                  <PerformanceChart />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "training" && (
            <motion.div
              key="training"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <TrainingPanel />
              <PerformanceChart />
            </motion.div>
          )}

          {activeTab === "today" && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TodaysTrades />
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TradeHistory />
            </motion.div>
          )}

          {activeTab === "strategy" && (
            <motion.div
              key="strategy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MorningStrategy />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
