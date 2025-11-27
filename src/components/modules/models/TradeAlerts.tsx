"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from "lucide-react";
import { Card } from "@/components/design-system/atoms/Card";

interface TradeSignal {
  date: string;
  ticker: string;
  action: string;
  direction: string;
  confidence: number;
  signal_strength: string;
  position_size: number;
  stop_loss_pct: number;
  take_profit_pct: number;
}

interface Alert {
  has_alert: boolean;
  signal: TradeSignal | null;
  recommendation: string;
}

export function TradeAlerts() {
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlert();
    // Poll every 30 seconds
    const interval = setInterval(fetchAlert, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlert = async () => {
    try {
      const response = await fetch("http://localhost:8000/alerts/today");
      if (!response.ok) throw new Error("Failed to fetch alert");
      const data = await response.json();
      setAlert(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch alert");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="w-6 h-6 text-muted-foreground" />
          </motion.div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-500/30">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  if (!alert) return null;

  const signal = alert.signal;
  const hasAlert = alert.has_alert && signal;

  const getSignalStyles = () => {
    if (!signal) return { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-400" };
    
    switch (signal.signal_strength) {
      case "STRONG":
        return { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" };
      case "MODERATE":
        return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" };
      case "WEAK":
        return { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" };
      default:
        return { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-400" };
    }
  };

  const styles = getSignalStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`p-6 ${styles.border} ${styles.bg}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              animate={hasAlert ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: hasAlert ? Infinity : 0 }}
            >
              <Bell className={`w-6 h-6 ${hasAlert ? styles.text : "text-muted-foreground"}`} />
            </motion.div>
            <h3 className="text-lg font-semibold text-foreground">Today's Alert</h3>
          </div>
          <button
            onClick={fetchAlert}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {hasAlert && signal ? (
            <motion.div
              key="alert"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              {/* Signal Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {signal.direction === "UP" ? (
                    <TrendingUp className="w-8 h-8 text-green-400" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-red-400" />
                  )}
                  <div>
                    <p className={`text-xl font-bold ${styles.text}`}>
                      {signal.action} {signal.ticker}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {signal.signal_strength} Signal
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full ${styles.bg} ${styles.border} border ${styles.text} text-sm font-medium`}>
                  {(signal.confidence * 100).toFixed(0)}% Confident
                </span>
              </div>

              {/* Signal Details */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Position</p>
                  <p className="text-lg font-bold text-foreground">
                    {(signal.position_size * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Stop Loss</p>
                  <p className="text-lg font-bold text-red-400">
                    {(Math.abs(signal.stop_loss_pct) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Take Profit</p>
                  <p className="text-lg font-bold text-green-400">
                    {(signal.take_profit_pct * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="no-alert"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No trade signal for today</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Confidence below threshold
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

