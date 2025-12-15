"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Settings,
  Loader2
} from "lucide-react";
import { Card } from "@/components/design-system/atoms/Card";

interface TrainStatus {
  status: "not_trained" | "trained" | "in_progress";
  accuracy?: number;
  trained_at?: string;
  version?: string;
}

export function TrainingPanel() {
  const [status, setStatus] = useState<TrainStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [trials, setTrials] = useState(50);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
    // Poll status while training
    const interval = setInterval(() => {
      if (training) fetchStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [training]);

  const fetchStatus = async () => {
    try {
      const response = await fetch("http://localhost:8000/train/status");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        
        // Check if training completed
        if (data.status === "trained" && training) {
          setTraining(false);
        }
      }
    } catch (err) {
      setError("Failed to fetch status");
    } finally {
      setLoading(false);
    }
  };

  const startTraining = async () => {
    setTraining(true);
    setError(null);
    
    try {
      const response = await fetch("http://localhost:8000/train/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optimize_trials: trials })
      });
      
      if (!response.ok) {
        throw new Error("Failed to start training");
      }
      
      // Update status
      setStatus({ status: "in_progress" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Training failed");
      setTraining(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      </Card>
    );
  }

  const isTraining = training || status?.status === "in_progress";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-cyan-400" />
            <h3 className="text-lg font-semibold text-foreground">Model Training</h3>
          </div>
          <div className="flex items-center gap-2">
            {status?.status === "trained" && (
              <span className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                Trained
              </span>
            )}
            {isTraining && (
              <span className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Training
              </span>
            )}
          </div>
        </div>

        {/* Current Model Info */}
        {status?.status === "trained" && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
              <p className="text-lg font-bold text-cyan-400">
                {((status.accuracy || 0) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Version</p>
              <p className="text-lg font-bold text-purple-400">
                {status.version || "1.0.0"}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Last Trained</p>
              <p className="text-sm font-bold text-amber-400">
                {formatDate(status.trained_at)}
              </p>
            </div>
          </div>
        )}

        {/* Training Controls */}
        <div className="space-y-4">
          {/* Trials Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-muted-foreground">
                Optimization Trials
              </label>
              <span className="text-sm font-medium text-foreground">{trials}</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={trials}
              onChange={(e) => setTrials(parseInt(e.target.value))}
              disabled={isTraining}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Fast (10)</span>
              <span>Balanced (100)</span>
              <span>Thorough (200)</span>
            </div>
          </div>

          {/* Start Button */}
          <motion.button
            onClick={startTraining}
            disabled={isTraining}
            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              isTraining
                ? "bg-amber-500/20 text-amber-400 cursor-not-allowed"
                : "bg-cyan-500 hover:bg-cyan-600 text-white"
            }`}
            whileHover={!isTraining ? { scale: 1.02 } : {}}
            whileTap={!isTraining ? { scale: 0.98 } : {}}
          >
            <AnimatePresence mode="wait">
              {isTraining ? (
                <motion.div
                  key="training"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Training in Progress...
                </motion.div>
              ) : (
                <motion.div
                  key="start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  {status?.status === "trained" ? "Retrain Model" : "Train Model"}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info */}
          <p className="text-xs text-muted-foreground text-center">
            Training uses {trials} Optuna trials for hyperparameter optimization.
            More trials = better accuracy but longer training time.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

