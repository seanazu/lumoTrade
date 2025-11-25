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
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Training parameters
  const [tickers, setTickers] = useState<string[]>(["SPY", "QQQ", "DIA", "IWM", "XLK"]);
  const [interval, setInterval] = useState("1hour");
  const [horizons, setHorizons] = useState<number[]>([1, 5, 20]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const startTraining = async () => {
    setIsTraining(true);
    setCompleted(false);
    setError(null);
    setProgress({
      phase: "initializing",
      progress: 0,
      currentStep: "Initializing training...",
    });
    setLogs([
      {
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Starting training session...",
      },
    ]);

    try {
      const url = new URL("http://localhost:8001/api/training/panel");
      url.searchParams.append("universe", JSON.stringify(tickers));
      url.searchParams.append("interval", interval);
      url.searchParams.append("horizons", JSON.stringify(horizons));

      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "start") {
            addLog("info", `Training started (Operation ID: ${data.operation_id})`);
          } else if (data.type === "progress") {
            setProgress({
              phase: data.step || "processing",
              progress: data.progress || 0,
              currentStep: data.step || "",
              metrics: data.data,
            });
            addLog("info", data.step);
          } else if (data.type === "complete") {
            setProgress({
              phase: "complete",
              progress: 100,
              currentStep: "Training completed!",
            });
            addLog("success", "Training completed successfully!");
            addLog(
              "info",
              `Total samples: ${data.result?.total_samples || 0}, Features: ${data.result?.total_features || 0}`
            );
            setCompleted(true);
            setIsTraining(false);
            eventSource.close();
          } else if (data.type === "error") {
            addLog("error", `Training failed: ${data.error}`);
            setError(data.error);
            setIsTraining(false);
            eventSource.close();
          }
        } catch (err) {
          console.error("Failed to parse SSE message:", err);
        }
      };

      eventSource.onerror = () => {
        addLog("error", "Connection to training stream lost");
        setError("Connection error");
        setIsTraining(false);
        eventSource.close();
      };
    } catch (err) {
      addLog("error", `Failed to start training: ${err}`);
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
    addLog("warning", "Training stopped by user");
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

  return (
    <motion.div
      className="space-y-6"
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
    >
      {/* Training Controls */}
      <motion.div variants={fadeInUp}>
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">
                Training Configuration
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure and start model training
              </p>
            </div>
            <Button
              onClick={isTraining ? stopTraining : startTraining}
              disabled={completed && !error}
              className={isTraining ? "bg-red-500 hover:bg-red-600" : ""}
            >
              {isTraining ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Training
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Training
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tickers */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Tickers
              </label>
              <div className="flex flex-wrap gap-2">
                {tickers.map((ticker) => (
                  <div
                    key={ticker}
                    className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm font-semibold text-blue-400"
                  >
                    {ticker}
                  </div>
                ))}
              </div>
            </div>

            {/* Interval */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Interval
              </label>
              <div className="px-3 py-2 bg-secondary border border-border rounded-lg text-foreground font-medium">
                {interval}
              </div>
            </div>

            {/* Horizons */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Horizons
              </label>
              <div className="flex gap-2">
                {horizons.map((h) => (
                  <div
                    key={h}
                    className="px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-sm font-semibold text-purple-400"
                  >
                    {h}h
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Progress Visualization */}
      {isTraining || completed && (
        <motion.div variants={fadeInUp}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                className={`p-2 bg-${phaseColor}-500/10 rounded-lg`}
                animate={isTraining ? { rotate: 360 } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <PhaseIcon className={`w-6 h-6 text-${phaseColor}-400`} />
              </motion.div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">
                  {progress.currentStep}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Phase: {progress.phase.replace("_", " ")}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">
                  {progress.progress.toFixed(0)}%
                </div>
                {progress.eta && (
                  <div className="text-xs text-muted-foreground">
                    ETA: {progress.eta}
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full bg-muted rounded-full h-3 overflow-hidden mb-6">
              <motion.div
                className={`absolute top-0 left-0 h-full bg-gradient-to-r from-${phaseColor}-400 to-${phaseColor}-500`}
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {/* Metrics */}
            {progress.metrics && (
              <div className="grid grid-cols-3 gap-4">
                {progress.metrics.samplesProcessed !== undefined && (
                  <div className="p-3 bg-secondary rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground mb-1">
                      Samples
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {progress.metrics.samplesProcessed.toLocaleString()}
                    </div>
                  </div>
                )}
                {progress.metrics.featuresBuilt !== undefined && (
                  <div className="p-3 bg-secondary rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground mb-1">
                      Features
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {progress.metrics.featuresBuilt}
                    </div>
                  </div>
                )}
                {progress.metrics.modelsCompleted !== undefined && (
                  <div className="p-3 bg-secondary rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground mb-1">
                      Models
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {progress.metrics.modelsCompleted} / 9
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Completion Animation */}
            <AnimatePresence>
              {completed && (
                <motion.div
                  className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3"
                  variants={successBurst}
                  initial="hidden"
                  animate="visible"
                >
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  <div>
                    <div className="font-semibold text-green-400">
                      Training Completed Successfully!
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Models are ready for predictions
                    </div>
                  </div>
                </motion.div>
              )}
              {error && (
                <motion.div
                  className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <div>
                    <div className="font-semibold text-red-400">
                      Training Failed
                    </div>
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
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Training Logs</h3>
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Auto-scroll: {autoScroll ? "ON" : "OFF"}
              </button>
            </div>
            <div className="bg-black/50 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <motion.div
                  key={index}
                  className="mb-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.01 }}
                >
                  <span className="text-gray-500">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>{" "}
                  <span className={getLogColor(log.level)}>{log.message}</span>
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

