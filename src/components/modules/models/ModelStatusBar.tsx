"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Database, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { Card } from "@/components/design-system/atoms/Card";
import { statusPulse, fadeInUp, staggerChildren } from "@/lib/animations/variants";

interface ModelStatus {
  status: "online" | "training" | "error" | "no_models";
  message: string;
  models_count: number;
  last_trained: string | null;
  total_samples: number;
  universes: string[];
}

export function ModelStatusBar() {
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    // Poll status every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch("http://localhost:8001/api/model/status");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setStatus({
        status: "error",
        message: "Failed to connect to ML backend",
        models_count: 0,
        last_trained: null,
        total_samples: 0,
        universes: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
            <div className="flex gap-4">
              <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
              <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
              <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (status?.status) {
      case "online":
        return "bg-green-500";
      case "training":
        return "bg-amber-500";
      case "error":
      case "no_models":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    switch (status?.status) {
      case "online":
        return "System Online";
      case "training":
        return "Training in Progress";
      case "no_models":
        return "No Models Trained";
      case "error":
        return "Connection Error";
      default:
        return "Unknown Status";
    }
  };

  const formatLastTrained = (timestamp: string | null) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-16 z-20">
      <div className="container mx-auto px-6 py-4">
        <motion.div
          className="flex flex-wrap items-center justify-between gap-4"
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
        >
          {/* Status Indicator */}
          <motion.div
            className="flex items-center gap-3 bg-secondary border border-border rounded-lg px-4 py-2"
            variants={fadeInUp}
          >
            <motion.div
              className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`}
              animate={
                status?.status === "online" || status?.status === "training"
                  ? statusPulse[status.status]
                  : {}
              }
            />
            <span className="text-sm font-medium text-foreground">
              {getStatusText()}
            </span>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            className="flex flex-wrap items-center gap-2 sm:gap-4"
            variants={staggerChildren}
          >
            {/* Active Models */}
            <motion.div
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg"
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
            >
              <Activity className="w-4 h-4 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Models</span>
                <span className="text-sm font-bold text-foreground">
                  {status?.models_count || 0}
                </span>
              </div>
            </motion.div>

            {/* Training Samples */}
            <motion.div
              className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg"
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
            >
              <Database className="w-4 h-4 text-green-400" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Samples</span>
                <span className="text-sm font-bold text-foreground">
                  {status?.total_samples.toLocaleString() || "0"}
                </span>
              </div>
            </motion.div>

            {/* Last Trained */}
            <motion.div
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg"
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
            >
              <Clock className="w-4 h-4 text-purple-400" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Last Trained</span>
                <span className="text-sm font-bold text-foreground">
                  {formatLastTrained(status?.last_trained || null)}
                </span>
              </div>
            </motion.div>

            {/* Tickers */}
            <motion.div
              className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-lg"
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
            >
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Tickers</span>
                <span className="text-sm font-bold text-foreground">
                  {status?.universes?.length || 0}
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Error Message (if any) */}
          {(status?.status === "error" || status?.status === "no_models") && (
            <motion.div
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{status?.message}</span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

