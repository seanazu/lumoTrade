"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/design-system/atoms/Card";
import { useState } from "react";
import type { ProgressStep, SSEProgress } from "@/hooks/useSSEProgress";

interface ProgressPanelProps {
  progress: SSEProgress;
  title?: string;
  showData?: boolean;
}

export function ProgressPanel({ progress, title = "Operation Progress", showData = true }: ProgressPanelProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  // Show connecting state if no steps yet
  const isConnecting = progress.steps.length === 0 && !progress.isComplete && !progress.error;

  const formatDuration = (ms?: number) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (ms?: number) => {
    if (!ms) return "—";
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <div className="flex items-center gap-3">
            {progress.elapsed_time_ms && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatTime(progress.elapsed_time_ms)}</span>
              </div>
            )}
            <div className="text-sm font-semibold text-primary">
              {progress.progress}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress.progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Estimated Time */}
        {progress.estimated_time_ms && !progress.isComplete && (
          <p className="text-sm text-muted-foreground">
            Estimated time remaining: {formatTime(progress.estimated_time_ms)}
          </p>
        )}

        {/* Connecting State */}
        {isConnecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/30 rounded-lg"
          >
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <div>
              <p className="font-medium text-foreground">Connecting to server...</p>
              <p className="text-sm text-muted-foreground">Initializing operation</p>
            </div>
          </motion.div>
        )}

        {/* Steps */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {progress.steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <StepItem
                  step={step}
                  isExpanded={expandedSteps.has(step.id)}
                  onToggle={() => toggleStep(step.id)}
                  showData={showData}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Error */}
        {progress.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-500">Operation Failed</p>
                <p className="text-sm text-red-400 mt-1">{progress.error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Success */}
        {progress.isComplete && !progress.error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="font-semibold text-green-500">Operation Completed Successfully</p>
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  );
}

function StepItem({
  step,
  isExpanded,
  onToggle,
  showData,
}: {
  step: ProgressStep;
  isExpanded: boolean;
  onToggle: () => void;
  showData: boolean;
}) {
  const hasData = step.data && Object.keys(step.data).length > 0;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors"
      >
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {step.status === "pending" && (
            <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
          )}
          {step.status === "running" && (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          )}
          {step.status === "completed" && (
            <CheckCircle className="w-6 h-6 text-green-500" />
          )}
          {step.status === "error" && (
            <XCircle className="w-6 h-6 text-red-500" />
          )}
        </div>

        {/* Step Info */}
        <div className="flex-1 text-left">
          <p className="font-medium text-foreground">{step.name}</p>
          {step.duration_ms && (
            <p className="text-sm text-muted-foreground">
              Duration: {step.duration_ms < 1000 ? `${step.duration_ms}ms` : `${(step.duration_ms / 1000).toFixed(1)}s`}
            </p>
          )}
        </div>

        {/* Expand Icon */}
        {hasData && showData && (
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        )}
      </button>

      {/* Expanded Data */}
      <AnimatePresence>
        {isExpanded && hasData && showData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 bg-secondary/30 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Step Data:
              </p>
              <pre className="text-xs text-foreground overflow-x-auto">
                {JSON.stringify(step.data, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {step.error && (
        <div className="px-4 py-3 bg-red-500/10 border-t border-red-500/20">
          <p className="text-sm text-red-500">{step.error}</p>
        </div>
      )}
    </div>
  );
}

