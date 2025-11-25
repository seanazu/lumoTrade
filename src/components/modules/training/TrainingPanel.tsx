"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/design-system/atoms/Card";
import { Button } from "@/components/design-system/atoms/Button";
import {
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Loader2,
  Brain,
  Database,
  TrendingUp,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useSSEProgress } from "@/hooks/useSSEProgress";
import { ProgressPanel } from "@/components/modules/progress/ProgressPanel";

interface ModelStatus {
  exists: boolean;
  size_mb: number;
  last_modified: string | null;
  path: string;
}

interface TrainingJob {
  job_id: string;
  status: "starting" | "running" | "completed" | "failed";
  index: string;
  start_date: string;
  end_date: string;
  horizons: string[];
  progress: number;
  started_at: string;
  estimated_remaining_seconds?: number;
  error?: string;
}

export function TrainingPanel() {
  const [selectedIndex, setSelectedIndex] = useState("SPX");
  const [lookbackDays, setLookbackDays] = useState(730);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const hasTriedConnectRef = useRef(false);

  // SSE Progress tracking
  const sseUrl = activeJobId
    ? `http://localhost:8000/api/stream/training?operation_id=${activeJobId}&index=${selectedIndex}&lookback_days=${lookbackDays}`
    : null;
  const { progress, isConnected, connect } = useSSEProgress(sseUrl);

  // Fetch training status
  const { data: statusData, refetch: refetchStatus } = useQuery({
    queryKey: ["training-status"],
    queryFn: async () => {
      const response = await fetch("http://localhost:8000/api/training/status");
      if (!response.ok) throw new Error("Failed to fetch training status");
      return response.json();
    },
    refetchInterval: isConnected ? 3000 : false, // Poll every 3s if training is active
  });

  // Fetch active job progress - DISABLED: Now using SSE for real-time progress
  const { data: progressData } = useQuery({
    queryKey: ["training-progress", activeJobId],
    queryFn: async () => {
      if (!activeJobId) return null;
      // This endpoint is deprecated - using SSE instead
      return null;
    },
    enabled: false, // Disabled - using SSE for progress tracking
    refetchInterval: false,
  });

  const modelStatus = statusData?.data?.model_status || {};
  const trainingHistory = statusData?.data?.training_history;
  const horizons = ["1h", "4h", "10h", "1d", "3d", "5d"];

  // Active job is now tracked via SSE progress, not REST API
  const activeJob: TrainingJob | null = null; // Deprecated - using SSE progress instead

  // Clear active job when SSE completes or on error
  useEffect(() => {
    if ((progress.isComplete || progress.error) && activeJobId) {
      const timer = setTimeout(() => {
        setActiveJobId(null);
        setShowProgress(false);
        hasTriedConnectRef.current = false;
        refetchStatus(); // Refresh model status to show newly trained models
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [progress.isComplete, progress.error, activeJobId, refetchStatus]);

  // Auto-connect when activeJobId changes (only once per operation)
  useEffect(() => {
    if (activeJobId && sseUrl && showProgress && !hasTriedConnectRef.current) {
      hasTriedConnectRef.current = true;

      const timer = setTimeout(() => {
        connect();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [activeJobId, sseUrl, showProgress, connect]);

  const handleStartTraining = async () => {
    try {
      // Generate unique operation ID for SSE (use timestamp-based ID)
      const newOpId = `train_${Date.now()}`;

      // Reset state and prepare for connection
      hasTriedConnectRef.current = false;
      setActiveJobId(newOpId);
      setShowProgress(true);

      // Note: The SSE endpoint will handle the training orchestration
      // No need to call the trigger API separately
    } catch (error) {
      setShowProgress(false);
      setActiveJobId(null);
      hasTriedConnectRef.current = false;
    }
  };

  const ModelStatusCard = ({
    horizon,
    status,
  }: {
    horizon: string;
    status: ModelStatus;
  }) => {
    const statusIcon = status.exists ? (
      <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
    );

    return (
      <div
        className={`${status.exists ? "bg-green-500/5 dark:bg-green-500/10 border-green-500/30" : "bg-secondary/50 border-border"} border rounded-lg p-4 transition-all hover:shadow-lg`}
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-foreground">{horizon}</h4>
          {statusIcon}
        </div>

        {status.exists ? (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Database className="w-3 h-3" />
              <span>{status.size_mb.toFixed(2)} MB</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>
                {status.last_modified
                  ? new Date(status.last_modified).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Not trained</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress Panel */}
      {showProgress && (
        <ProgressPanel
          progress={progress}
          title="Training Progress"
          showData={true}
        />
      )}

      {/* Model Status Overview */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Model Status
              </h3>
              <span className="text-sm text-muted-foreground">
                {statusData?.data?.total_models || 0} /{" "}
                {statusData?.data?.expected_models || 6} models trained
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-primary">
              Models Ready
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {horizons.map((horizon) => (
            <ModelStatusCard
              key={horizon}
              horizon={horizon}
              status={
                modelStatus[horizon] || {
                  exists: false,
                  size_mb: 0,
                  last_modified: null,
                  path: "",
                }
              }
            />
          ))}
        </div>
      </Card>

      {/* Training Control */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10 border-primary/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Train New Models
          </h3>
        </div>

        {isConnected || showProgress ? (
          // Show training progress - Now using SSE progress data
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-semibold text-lg">
                  Training {selectedIndex} Models
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  {isConnected && !progress.isComplete && !progress.error && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Training in progress...
                    </>
                  )}
                  {progress.isComplete && !progress.error && (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Training completed successfully!
                    </>
                  )}
                  {progress.error && (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      Training failed
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  {isConnected && !progress.isComplete && (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  )}
                  {progress.isComplete && !progress.error && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                  {progress.error && (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                  <span className="text-3xl font-bold text-foreground">
                    {progress.progress}%
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  6 horizons
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-4 bg-secondary rounded-full overflow-hidden border border-border">
              <div
                className={`h-full transition-all duration-500 ${
                  progress.isComplete && !progress.error
                    ? "bg-gradient-to-r from-green-500 to-green-400"
                    : progress.error
                      ? "bg-gradient-to-r from-red-500 to-red-400"
                      : "bg-gradient-to-r from-primary to-purple-500"
                }`}
                style={{ width: `${progress.progress}%` }}
              />
            </div>

            {progress.estimated_time_ms &&
              isConnected &&
              !progress.isComplete && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3 border border-border">
                  <Clock className="w-4 h-4" />
                  <span>
                    Estimated time remaining:{" "}
                    <span className="font-semibold text-foreground">
                      {Math.floor(progress.estimated_time_ms / 60000)} min{" "}
                      {Math.floor((progress.estimated_time_ms % 60000) / 1000)}{" "}
                      sec
                    </span>
                  </span>
                </div>
              )}

            {progress.error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-600 dark:text-red-400 text-sm font-semibold mb-1">
                      Training Error
                    </p>
                    <p className="text-red-600 dark:text-red-400 text-sm">
                      {progress.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeJobId && (
              <div className="pt-4 border-t border-border space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Database className="w-3 h-3" />
                  Operation ID:{" "}
                  <span className="font-mono text-foreground">
                    {activeJobId}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  Lookback: {lookbackDays} days (
                  {(lookbackDays / 365).toFixed(1)} years)
                </p>
              </div>
            )}
          </div>
        ) : (
          // Show training controls
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Index to Train
                </label>
                <select
                  value={selectedIndex}
                  onChange={(e) => setSelectedIndex(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="SPX">S&P 500 (SPX)</option>
                  <option value="NDX">Nasdaq 100 (NDX)</option>
                  <option value="DJI">Dow Jones (DJI)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  Lookback Period:{" "}
                  <span className="text-primary font-bold">
                    {lookbackDays} days
                  </span>{" "}
                  ({(lookbackDays / 365).toFixed(1)} years)
                </label>
                <input
                  type="range"
                  min="30"
                  max="1825"
                  step="30"
                  value={lookbackDays}
                  onChange={(e) => setLookbackDays(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>30 days</span>
                  <span className="text-primary font-semibold">
                    {lookbackDays} days
                  </span>
                  <span>5 years</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Training will include all 6 prediction horizons:
              </p>
              <div className="flex flex-wrap gap-2">
                {horizons.map((h) => (
                  <span
                    key={h}
                    className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold rounded-full"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-600 dark:text-blue-400">
                <p className="font-semibold mb-1">Training Recommendations</p>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  <li>Use at least 730 days (2 years) for optimal results</li>
                  <li>
                    Training may take 5-15 minutes depending on data volume
                  </li>
                  <li>Models will be saved automatically upon completion</li>
                </ul>
              </div>
            </div>

            <Button onClick={handleStartTraining} className="w-full" size="lg">
              <Play className="w-5 h-5 mr-2" />
              Start Training
            </Button>
          </div>
        )}
      </Card>

      {/* Training History */}
      {trainingHistory && Object.keys(trainingHistory).length > 0 && (
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Training History
              </h3>
              <span className="text-sm text-muted-foreground">
                Recent training sessions
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(trainingHistory)
              .slice(0, 5)
              .map(([timestamp, data]: [string, any]) => (
                <div
                  key={timestamp}
                  className="flex items-center justify-between p-4 bg-secondary/50 hover:bg-secondary rounded-lg border border-border transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="w-4 h-4 text-primary" />
                      <p className="text-foreground text-sm font-semibold">
                        {data.index || "Unknown"}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      {data.horizons?.length || 0} horizons
                    </p>
                    {data.duration && (
                      <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.floor(data.duration / 60)}m {data.duration % 60}s
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
