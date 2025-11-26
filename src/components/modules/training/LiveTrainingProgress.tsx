"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
  Brain,
  Save,
  Loader2,
  TrendingUp,
  Settings,
  Plus,
  Minus,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { Card } from "@/components/design-system/atoms/Card";
import { Button } from "@/components/design-system/atoms/Button";
import {
  fadeInUp,
  staggerChildren,
  progressBar,
  successBurst,
} from "@/lib/animations/variants";

interface TrainingProgress {
  phase: string;
  progress: number;
  currentStep: string;
  eta?: string;
  metrics?: {
    samplesProcessed?: number;
    featuresBuilt?: number;
    modelsCompleted?: number;
  };
}

interface TrainingLog {
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
}

const AVAILABLE_TICKERS = ["SPY", "QQQ", "DIA", "IWM", "XLK", "XLF", "XLV", "XLE", "XLI", "XLP", "XLY", "XLU", "XLB", "XLRE"];
const INTERVAL_OPTIONS = ["1min", "5min", "15min", "30min", "1hour", "4hour", "1day"];
const HORIZON_OPTIONS = [1, 2, 3, 5, 10, 20, 30, 50];

export function LiveTrainingProgress() {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState<TrainingProgress>({
    phase: "idle",
    progress: 0,
    currentStep: "Ready to train",
  });
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Training Parameters
  const [tickers, setTickers] = useState<string[]>(["SPY", "QQQ", "DIA", "IWM", "XLK"]);
  const [interval, setInterval] = useState("5min");
  const [horizons, setHorizons] = useState<number[]>([1, 5, 20]);
  const [lookbackDays, setLookbackDays] = useState(90); // Days of historical data to use
  
  // Get recommended max lookback based on interval
  const getMaxLookback = () => {
    const intradayIntervals = ["1min", "5min", "15min", "30min", "1hour", "4hour"];
    if (intradayIntervals.includes(interval)) {
      return 90; // FMP typically has ~60-90 days of intraday data
    }
    return 3650; // Daily data can go back 10 years (Yahoo Finance)
  };
  
  // Get realistic lookback info
  const getLookbackInfo = () => {
    const intradayIntervals = ["1min", "5min", "15min", "30min", "1hour", "4hour"];
    if (intradayIntervals.includes(interval)) {
      return {
        max: 90,
        recommended: "30-60 days",
        warning: "⚠️ FMP provides only 60-90 days of intraday data",
        provider: "FMP"
      };
    }
    return {
      max: 3650,
      recommended: "365-1825 days (1-5 years)",
      warning: null,
      provider: "Yahoo Finance"
    };
  };
  
  // Calculate dynamic parameters based on lookback days and interval
  const calculateTrainingParams = () => {
    // Approximate bars per day based on interval
    const barsPerDay: Record<string, number> = {
      "1min": 390,
      "5min": 78,
      "15min": 26,
      "30min": 13,
      "1hour": 6.5,
      "4hour": 1.625,
      "1day": 1,
    };
    
    const barsPerDayCount = barsPerDay[interval] || 78;
    const totalBars = Math.floor(lookbackDays * barsPerDayCount);
    
    // Dynamic train/test split (80/20 rule)
    const trainWindow = Math.floor(totalBars * 0.8);
    const testWindow = Math.floor(totalBars * 0.2);
    
    // Max samples and batch size scale with data size
    const maxSamples = Math.min(totalBars * tickers.length, 200000);
    const batchSize = Math.min(Math.floor(maxSamples / 5), 50000);
    
    return { trainWindow, testWindow, maxSamples, batchSize };
  };

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const startTraining = async () => {
    const { trainWindow, testWindow, maxSamples, batchSize } = calculateTrainingParams();
    
    setIsTraining(true);
    setCompleted(false);
    setError(null);
    setProgress({
      phase: "initializing",
      progress: 0,
      currentStep: "Initializing training pipeline...",
    });
    // Calculate date range for display
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);
    
    setLogs([
      {
        timestamp: new Date().toISOString(),
        level: "info",
        message: `🚀 Starting training session with ${tickers.length} tickers...`,
      },
      {
        timestamp: new Date().toISOString(),
        level: "info",
        message: `📊 Lookback: ${lookbackDays} days (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`,
      },
      {
        timestamp: new Date().toISOString(),
        level: "info",
        message: `⚙️ Interval: ${interval} | Train/Test Windows: ${trainWindow}/${testWindow} bars`,
      },
    ]);

    try {
      const url = new URL("http://localhost:8000/api/training/panel");
      url.searchParams.append("universe", JSON.stringify(tickers));
      url.searchParams.append("start_date", startDate.toISOString().split('T')[0]);
      url.searchParams.append("end_date", endDate.toISOString().split('T')[0]);
      url.searchParams.append("interval", interval);
      url.searchParams.append("horizons", JSON.stringify(horizons));
      url.searchParams.append("train_window", String(trainWindow));
      url.searchParams.append("test_window", String(testWindow));
      url.searchParams.append("max_samples", String(maxSamples));
      url.searchParams.append("batch_size", String(batchSize));

      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "start") {
            addLog("info", `✅ Training started (ID: ${data.operation_id})`);
          } else if (data.type === "progress") {
            const progressPercent = Math.round((data.progress || 0) * 100);
            setProgress({
              phase: data.step || "processing",
              progress: data.progress || 0,
              currentStep: data.step || "",
              metrics: data.data,
            });
            
            // Log progress with percentage and details
            let logMessage = `[${progressPercent}%] ${data.step}`;
            
            // Add additional details if available
            if (data.data?.step) {
              logMessage += ` - ${data.data.step}`;
            }
            
            // Add metrics if available
            if (data.data?.metrics) {
              const metrics = data.data.metrics;
              if (metrics.total_samples) {
                logMessage += ` | Samples: ${metrics.total_samples.toLocaleString()}`;
              }
              if (metrics.total_features) {
                logMessage += ` | Features: ${metrics.total_features}`;
              }
              if (metrics.folds) {
                logMessage += ` | Folds: ${metrics.folds}`;
              }
            }
            
            addLog("info", logMessage);
          } else if (data.type === "heartbeat") {
            // Heartbeat to keep connection alive - no need to log
            console.log("Training heartbeat received");
          } else if (data.type === "complete") {
            setProgress({
              phase: "complete",
              progress: 100,
              currentStep: "Training completed successfully!",
            });
            addLog("success", "🎉 Training completed successfully!");
            addLog(
              "info",
              `📈 Total samples: ${data.result?.total_samples?.toLocaleString() || 0}, Features: ${data.result?.total_features || 0}`
            );
            setCompleted(true);
            setIsTraining(false);
            eventSource.close();
          } else if (data.type === "error") {
            addLog("error", `❌ Training failed: ${data.error}`);
            setError(data.error);
            setIsTraining(false);
            eventSource.close();
          }
        } catch (err) {
          console.error("Failed to parse SSE message:", err);
        }
      };

      eventSource.onerror = () => {
        addLog("error", "⚠️ Connection to training stream lost");
        setError("Connection error");
        setIsTraining(false);
        eventSource.close();
      };
    } catch (err) {
      addLog("error", `❌ Failed to start training: ${err}`);
      setError(String(err));
      setIsTraining(false);
    }
  };

  const stopTraining = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsTraining(false);
    addLog("warning", "⏸️ Training stopped by user");
  };

  const resetTraining = () => {
    setCompleted(false);
    setError(null);
    setProgress({
      phase: "idle",
      progress: 0,
      currentStep: "Ready to train",
    });
    setLogs([]);
  };

  const addLog = (
    level: "info" | "success" | "warning" | "error",
    message: string
  ) => {
    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        level,
        message,
      },
    ]);
  };

  const toggleTicker = (ticker: string) => {
    setTickers((prev) =>
      prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker]
    );
  };

  const toggleHorizon = (horizon: number) => {
    setHorizons((prev) =>
      prev.includes(horizon) ? prev.filter((h) => h !== horizon) : [...prev, horizon].sort((a, b) => a - b)
    );
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case "fetching_data":
        return Database;
      case "building_features":
        return Layers;
      case "training_models":
        return Brain;
      case "saving":
        return Save;
      case "complete":
        return CheckCircle2;
      default:
        return Loader2;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "fetching_data":
        return "blue";
      case "building_features":
        return "green";
      case "training_models":
        return "purple";
      case "saving":
        return "amber";
      case "complete":
        return "emerald";
      default:
        return "gray";
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case "success":
        return "text-green-400";
      case "warning":
        return "text-amber-400";
      case "error":
        return "text-red-400";
      default:
        return "text-blue-400";
    }
  };

  const PhaseIcon = getPhaseIcon(progress.phase);
  const phaseColor = getPhaseColor(progress.phase);

  // Calculate estimated samples for display
  const { maxSamples } = calculateTrainingParams();
  const estimatedSamples = Math.min(maxSamples, 200000);

  return (
    <motion.div
      className="space-y-6"
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
    >
      {/* Training Controls */}
      <motion.div variants={fadeInUp}>
        <Card className="p-6 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border-white/10 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Brain className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Training Configuration
                </h3>
                <p className="text-sm text-muted-foreground">
                  Configure and train models on tens of thousands of samples
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {completed && (
                <Button
                  onClick={resetTraining}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </Button>
              )}
              <Button
                onClick={() => setShowConfig(!showConfig)}
                variant="outline"
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                {showConfig ? "Hide" : "Show"} Config
              </Button>
              <Button
                onClick={isTraining ? stopTraining : startTraining}
                disabled={tickers.length === 0 || horizons.length === 0 || (completed && !error)}
                className={`gap-2 ${
                  isTraining
                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                    : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600"
                }`}
              >
                {isTraining ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Stop Training
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Training
                  </>
                )}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showConfig && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6"
              >
                {/* Tickers Selection */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    Select Tickers ({tickers.length} selected)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TICKERS.map((ticker) => {
                      const isSelected = tickers.includes(ticker);
                      return (
                        <motion.button
                          key={ticker}
                          onClick={() => toggleTicker(ticker)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            isSelected
                              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50"
                              : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {ticker}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Data Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lookback Days */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-400" />
                      Lookback Period (Days)
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLookbackDays(Math.max(7, lookbackDays - 30))}
                        className="px-3 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={lookbackDays}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 90;
                          setLookbackDays(Math.min(value, getMaxLookback()));
                        }}
                        max={getMaxLookback()}
                        className="flex-1 px-4 py-2 bg-secondary border border-white/10 rounded-lg text-foreground text-center font-mono font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => setLookbackDays(Math.min(getMaxLookback(), lookbackDays + 30))}
                        className="px-3 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {interval === "1day" 
                        ? `✅ Daily data: Up to 10 years available (${getLookbackInfo().provider}). Recommended: ${getLookbackInfo().recommended}.`
                        : `⚠️ Intraday (${interval}): ${getLookbackInfo().provider} provides only ${getLookbackInfo().max} days. Recommended: ${getLookbackInfo().recommended}.`}
                    </p>
                    {lookbackDays > getLookbackInfo().max && (
                      <p className="text-xs text-amber-400 mt-1 font-medium flex items-center gap-1">
                        <span>⚠️</span>
                        <span>Lookback exceeds {getLookbackInfo().provider} limits (~{getLookbackInfo().max} days). Pre-flight check will validate actual availability.</span>
                      </p>
                    )}
                  </div>

                  {/* Interval */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">
                      Data Interval
                    </label>
                    <select
                      value={interval}
                      onChange={(e) => setInterval(e.target.value)}
                      className="w-full px-4 py-2 bg-secondary border border-white/10 rounded-lg text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {INTERVAL_OPTIONS.map((int) => (
                        <option key={int} value={int}>
                          {int}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-2">
                      Smaller intervals = more samples but longer training time.
                    </p>
                  </div>
                </div>

                {/* Horizons Selection */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    Prediction Horizons ({horizons.length} selected)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {HORIZON_OPTIONS.map((h) => {
                      const isSelected = horizons.includes(h);
                      return (
                        <motion.button
                          key={h}
                          onClick={() => toggleHorizon(h)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            isSelected
                              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50"
                              : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {h}h
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Training Summary */}
                <div className="p-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl border border-white/10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-foreground">{tickers.length}</div>
                      <div className="text-xs text-muted-foreground">Tickers</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{lookbackDays}</div>
                      <div className="text-xs text-muted-foreground">Days Lookback</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{horizons.length * 3}</div>
                      <div className="text-xs text-muted-foreground">Models</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{interval}</div>
                      <div className="text-xs text-muted-foreground">Interval</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Progress Visualization */}
      {(isTraining || completed) && (
        <motion.div variants={fadeInUp}>
          <Card className="p-6 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                className={`p-3 bg-gradient-to-r from-${phaseColor}-400 to-${phaseColor}-600 rounded-xl shadow-lg`}
                animate={isTraining ? { rotate: [0, 360] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <PhaseIcon className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  {progress.currentStep}
                  {isTraining && <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Phase: {progress.phase.replace("_", " ")} • Progress: {progress.progress.toFixed(0)}%
                </p>
              </div>
              {progress.eta && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">ETA</div>
                  <div className="text-lg font-bold text-foreground">{progress.eta}</div>
                </div>
              )}
            </div>

            {/* Enhanced Progress Bar */}
            <div className="relative w-full bg-secondary/30 rounded-full h-4 overflow-hidden mb-6 border border-white/5">
              <motion.div
                className={`absolute top-0 left-0 h-full bg-gradient-to-r from-${phaseColor}-400 to-${phaseColor}-600 shadow-lg`}
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-white/40 to-transparent"
                animate={{
                  x: ["-100%", "300%"],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white drop-shadow-lg">
                  {progress.progress.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Metrics */}
            {progress.metrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {progress.metrics.samplesProcessed !== undefined && (
                  <motion.div
                    className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="w-4 h-4 text-blue-400" />
                      <div className="text-xs text-blue-400 font-semibold">Samples</div>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {progress.metrics.samplesProcessed.toLocaleString()}
                    </div>
                  </motion.div>
                )}
                {progress.metrics.featuresBuilt !== undefined && (
                  <motion.div
                    className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="w-4 h-4 text-green-400" />
                      <div className="text-xs text-green-400 font-semibold">Features</div>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {progress.metrics.featuresBuilt}
                    </div>
                  </motion.div>
                )}
                {progress.metrics.modelsCompleted !== undefined && (
                  <motion.div
                    className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <div className="text-xs text-purple-400 font-semibold">Models</div>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {progress.metrics.modelsCompleted} / {horizons.length * 3}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Completion/Error Messages */}
            <AnimatePresence>
              {completed && (
                <motion.div
                  className="mt-6 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl flex items-center gap-4"
                  variants={successBurst}
                  initial="hidden"
                  animate="visible"
                >
                  <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xl font-bold text-green-400 mb-1">
                      🎉 Training Completed Successfully!
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Models are ready for predictions. Check the Model Overview tab for detailed metrics.
                    </div>
                  </div>
                  <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
                </motion.div>
              )}
              {error && (
                <motion.div
                  className="mt-6 p-6 bg-gradient-to-r from-red-500/20 to-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
                  <div>
                    <div className="text-xl font-bold text-red-400 mb-1">Training Failed</div>
                    <div className="text-sm text-muted-foreground">{error}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      )}

      {/* Real-Time Logs */}
      {logs.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Card className="p-6 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-foreground">Training Logs</h3>
                <span className="px-2 py-1 bg-blue-500/20 rounded-lg text-xs text-blue-400 font-semibold">
                  {logs.length} entries
                </span>
              </div>
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`text-sm px-3 py-1.5 rounded-lg transition-all ${
                  autoScroll
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Auto-scroll: {autoScroll ? "ON" : "OFF"}
              </button>
            </div>
            <div className="bg-black/70 rounded-xl p-4 h-80 overflow-y-auto font-mono text-sm border border-white/5 scrollbar-thin scrollbar-thumb-blue-500/50 scrollbar-track-transparent">
              {logs.map((log, index) => (
                <motion.div
                  key={index}
                  className="mb-1.5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.01 }}
                >
                  <span className="text-gray-500 text-xs">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>{" "}
                  <span className={`${getLogColor(log.level)} font-medium`}>{log.message}</span>
                </motion.div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
