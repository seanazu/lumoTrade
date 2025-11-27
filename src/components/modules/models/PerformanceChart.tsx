"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Target, 
  Percent, 
  Calendar,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { Card } from "@/components/design-system/atoms/Card";

interface ModelStatus {
  loaded: boolean;
  accuracy: number | null;
  threshold: number | null;
  version: string | null;
  trained_at: string | null;
  features: number | null;
}

interface AccuracyStats {
  accuracy: number;
  threshold: number;
  weights: {
    lightgbm: number;
    catboost: number;
    xgboost: number;
  };
  version: string;
  trained_at: string;
}

export function PerformanceChart() {
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [accuracy, setAccuracy] = useState<AccuracyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, accuracyRes] = await Promise.all([
        fetch("http://localhost:8000/model/status"),
        fetch("http://localhost:8000/model/accuracy")
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      }

      if (accuracyRes.ok) {
        const accuracyData = await accuracyRes.json();
        setAccuracy(accuracyData);
      }

      setError(null);
    } catch (err) {
      setError("Failed to fetch model data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="w-8 h-8 text-muted-foreground" />
          </motion.div>
        </div>
      </Card>
    );
  }

  if (error || !status?.loaded) {
    return (
      <Card className="p-6 border-amber-500/30">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="w-12 h-12 text-amber-400" />
          <p className="text-amber-400 text-center">
            {error || "Model not trained yet"}
          </p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-amber-400 transition-colors"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Model Performance</h3>
          <button
            onClick={fetchData}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Main Accuracy Display */}
        <div className="flex items-center justify-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative"
          >
            <svg className="w-48 h-48 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-secondary"
              />
              {/* Progress circle */}
              <motion.circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className="text-cyan-400"
                initial={{ strokeDasharray: "0 553" }}
                animate={{ 
                  strokeDasharray: `${(status.accuracy || 0) * 553} 553` 
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-foreground">
                {((status.accuracy || 0) * 100).toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">Accuracy</span>
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Threshold */}
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <Target className="w-5 h-5 mx-auto mb-2 text-purple-400" />
            <p className="text-xs text-muted-foreground mb-1">Threshold</p>
            <p className="text-lg font-bold text-purple-400">
              {((status.threshold || 0.5) * 100).toFixed(0)}%
            </p>
          </div>

          {/* Features */}
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-blue-400" />
            <p className="text-xs text-muted-foreground mb-1">Features</p>
            <p className="text-lg font-bold text-blue-400">
              {status.features || 0}
            </p>
          </div>

          {/* Version */}
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <Percent className="w-5 h-5 mx-auto mb-2 text-green-400" />
            <p className="text-xs text-muted-foreground mb-1">Version</p>
            <p className="text-lg font-bold text-green-400">
              {status.version || "1.0.0"}
            </p>
          </div>

          {/* Last Trained */}
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <Calendar className="w-5 h-5 mx-auto mb-2 text-amber-400" />
            <p className="text-xs text-muted-foreground mb-1">Last Trained</p>
            <p className="text-sm font-bold text-amber-400">
              {formatDate(status.trained_at)}
            </p>
          </div>
        </div>

        {/* Ensemble Weights */}
        {accuracy?.weights && (
          <div className="bg-secondary/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Ensemble Weights
            </h4>
            <div className="space-y-3">
              {/* LightGBM */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">LightGBM</span>
                  <span className="text-muted-foreground">
                    {(accuracy.weights.lightgbm * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${accuracy.weights.lightgbm * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* CatBoost */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">CatBoost</span>
                  <span className="text-muted-foreground">
                    {(accuracy.weights.catboost * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${accuracy.weights.catboost * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                  />
                </div>
              </div>

              {/* XGBoost */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">XGBoost</span>
                  <span className="text-muted-foreground">
                    {(accuracy.weights.xgboost * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${accuracy.weights.xgboost * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

