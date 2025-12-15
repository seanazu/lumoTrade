"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Gauge, 
  AlertTriangle,
  RefreshCw,
  Clock
} from "lucide-react";
import { Card } from "@/components/design-system/atoms/Card";

interface Prediction {
  date: string;
  direction: "UP" | "DOWN";
  confidence: number;
  magnitude: number;
  trade_signal: string;
  signal_strength: string;
  position_size: number;
  model_accuracy: number;
  recommendation: string;
}

export function DailyPrediction() {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrediction();
  }, []);

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8000/predict/today");
      if (!response.ok) {
        throw new Error("Failed to fetch prediction");
      }
      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prediction");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
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

  if (error) {
    return (
      <Card className="p-8 border-red-500/30 bg-red-500/5">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertTriangle className="w-12 h-12 text-red-400" />
          <p className="text-red-400 text-center">{error}</p>
          <button
            onClick={fetchPrediction}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  if (!prediction) {
    return null;
  }

  const isUp = prediction.direction === "UP";
  const directionColor = isUp ? "text-green-400" : "text-red-400";
  const directionBg = isUp ? "bg-green-500/10" : "bg-red-500/10";
  const directionBorder = isUp ? "border-green-500/30" : "border-red-500/30";

  const getSignalColor = () => {
    switch (prediction.signal_strength) {
      case "STRONG":
        return "text-green-400 bg-green-500/20 border-green-500/40";
      case "MODERATE":
        return "text-amber-400 bg-amber-500/20 border-amber-500/40";
      case "WEAK":
        return "text-orange-400 bg-orange-500/20 border-orange-500/40";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/40";
    }
  };

  const getConfidenceColor = () => {
    if (prediction.confidence >= 0.7) return "text-green-400";
    if (prediction.confidence >= 0.6) return "text-amber-400";
    if (prediction.confidence >= 0.55) return "text-orange-400";
    return "text-gray-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`p-8 ${directionBorder} ${directionBg}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground">{prediction.date}</span>
          </div>
          <button
            onClick={fetchPrediction}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Main Prediction */}
        <div className="flex flex-col items-center justify-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className={`w-32 h-32 rounded-full ${directionBg} ${directionBorder} border-2 flex items-center justify-center mb-4`}
          >
            {isUp ? (
              <TrendingUp className={`w-16 h-16 ${directionColor}`} />
            ) : (
              <TrendingDown className={`w-16 h-16 ${directionColor}`} />
            )}
          </motion.div>
          
          <h2 className={`text-4xl font-bold ${directionColor} mb-2`}>
            {prediction.direction}
          </h2>
          
          <span className={`px-4 py-1 rounded-full border ${getSignalColor()} text-sm font-medium`}>
            {prediction.signal_strength} SIGNAL
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Confidence */}
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <Gauge className={`w-6 h-6 mx-auto mb-2 ${getConfidenceColor()}`} />
            <p className="text-xs text-muted-foreground mb-1">Confidence</p>
            <p className={`text-2xl font-bold ${getConfidenceColor()}`}>
              {(prediction.confidence * 100).toFixed(1)}%
            </p>
          </div>

          {/* Expected Move */}
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <p className="text-xs text-muted-foreground mb-1">Expected Move</p>
            <p className="text-2xl font-bold text-blue-400">
              {prediction.magnitude.toFixed(1)}%
            </p>
          </div>

          {/* Position Size */}
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <div className="w-6 h-6 mx-auto mb-2 text-purple-400 font-bold text-lg">%</div>
            <p className="text-xs text-muted-foreground mb-1">Position Size</p>
            <p className="text-2xl font-bold text-purple-400">
              {(prediction.position_size * 100).toFixed(0)}%
            </p>
          </div>

          {/* Model Accuracy */}
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
            <p className="text-xs text-muted-foreground mb-1">Model Accuracy</p>
            <p className="text-2xl font-bold text-cyan-400">
              {(prediction.model_accuracy * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Trade Signal */}
        <div className={`p-4 rounded-lg ${directionBg} ${directionBorder} border text-center`}>
          <p className="text-sm text-muted-foreground mb-2">Trade Signal</p>
          <p className={`text-2xl font-bold ${directionColor}`}>
            {prediction.trade_signal}
          </p>
        </div>

        {/* Recommendation */}
        <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
          <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-mono">
            {prediction.recommendation}
          </pre>
        </div>
      </Card>
    </motion.div>
  );
}

