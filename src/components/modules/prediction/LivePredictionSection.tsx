"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, TrendingUp, TrendingDown, AlertCircle, Minus } from "lucide-react";
import { GlassCard } from "@/components/design-system/atoms/GlassCard";
import { Button } from "@/components/design-system/atoms/Button";
import { cn } from "@/lib/utils";

interface PredictionData {
  direction: "bullish" | "bearish" | "neutral";
  confidence: number;
  expected_move_percent: number;
  overall_score: number;
  key_factors: Array<{
    factor: string;
    impact: string;
    sentiment: string;
  }>;
  risks: Array<{
    risk: string;
    probability: string;
  }>;
  sentiment_breakdown: {
    news: number;
    social: number;
  };
  symbol: string;
  timeframe: string;
  timestamp: string;
}

async function fetchPrediction(): Promise<PredictionData> {
  const response = await fetch("http://localhost:8000/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol: "SPY", timeframe: "1h" }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch prediction");
  }

  const data = await response.json();
  return data.data;
}

export function LivePredictionSection() {
  const [showExplain, setShowExplain] = useState(false);

  const { data: prediction, isLoading, error } = useQuery({
    queryKey: ["ml-prediction"],
    queryFn: fetchPrediction,
    refetchInterval: 60000, // Update every minute
    retry: 2,
  });

  if (isLoading) {
    return (
      <GlassCard className="p-6 border-2 border-primary/30">
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Analyzing market...</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6 border-2 border-destructive/30">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-semibold">Prediction Unavailable</p>
            <p className="text-sm text-muted-foreground">
              ML backend is not running. Start it with: <code>cd ml-backend && uvicorn app:app</code>
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!prediction) return null;

  const directionConfig = {
    bullish: {
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      label: "Bullish",
    },
    bearish: {
      icon: TrendingDown,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      label: "Bearish",
    },
    neutral: {
      icon: Minus,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      label: "Neutral",
    },
  };

  const config = directionConfig[prediction.direction];
  const Icon = config.icon;

  return (
    <GlassCard className={cn("p-6 border-2", config.borderColor)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", config.bgColor)}>
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">AI Market Prediction</h3>
            <p className="text-xs text-muted-foreground">
              Updated {new Date(prediction.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      {/* Main Prediction */}
      <div className={cn("p-4 rounded-lg mb-6", config.bgColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={cn("h-8 w-8", config.color)} />
            <div>
              <p className="text-sm text-muted-foreground">Market Direction</p>
              <p className={cn("text-2xl font-bold", config.color)}>{config.label}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted-foreground">Confidence</p>
            <p className="text-2xl font-bold">{(prediction.confidence * 100).toFixed(0)}%</p>
          </div>
        </div>

        {prediction.expected_move_percent !== 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-sm text-muted-foreground">Expected Move</p>
            <p className="text-lg font-semibold">
              {prediction.expected_move_percent > 0 ? "+" : ""}
              {prediction.expected_move_percent.toFixed(2)}%
            </p>
          </div>
        )}
      </div>

      {/* Sentiment Breakdown */}
      {(prediction.sentiment_breakdown.news !== 0 || prediction.sentiment_breakdown.social !== 0) && (
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3">Sentiment Analysis</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">News Sentiment</p>
              <p
                className={cn(
                  "text-lg font-semibold",
                  prediction.sentiment_breakdown.news > 0
                    ? "text-green-500"
                    : prediction.sentiment_breakdown.news < 0
                    ? "text-red-500"
                    : "text-yellow-500"
                )}
              >
                {prediction.sentiment_breakdown.news > 0 ? "+" : ""}
                {prediction.sentiment_breakdown.news.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Social Sentiment</p>
              <p
                className={cn(
                  "text-lg font-semibold",
                  prediction.sentiment_breakdown.social > 0
                    ? "text-green-500"
                    : prediction.sentiment_breakdown.social < 0
                    ? "text-red-500"
                    : "text-yellow-500"
                )}
              >
                {prediction.sentiment_breakdown.social > 0 ? "+" : ""}
                {prediction.sentiment_breakdown.social.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Factors */}
      {prediction.key_factors && prediction.key_factors.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3">Key Factors</p>
          <div className="space-y-2">
            {prediction.key_factors.slice(0, 5).map((factor, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <div
                  className={cn(
                    "mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0",
                    factor.sentiment === "positive"
                      ? "bg-green-500"
                      : factor.sentiment === "negative"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  )}
                />
                <p className="text-muted-foreground">{factor.factor}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risks */}
      {prediction.risks && prediction.risks.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3">Risk Factors</p>
          <div className="space-y-2">
            {prediction.risks.slice(0, 3).map((risk, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                <p className="text-muted-foreground">{risk.risk}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      <Button onClick={() => setShowExplain(!showExplain)} className="w-full" variant="outline">
        <Brain className="h-4 w-4 mr-2" />
        Ask AI to Explain
      </Button>

      {showExplain && (
        <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            Interactive explanation feature coming soon. You can ask questions like:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
            <li>Why is the market bullish right now?</li>
            <li>What news is impacting this prediction?</li>
            <li>How confident should I be in this prediction?</li>
          </ul>
        </div>
      )}
    </GlassCard>
  );
}

