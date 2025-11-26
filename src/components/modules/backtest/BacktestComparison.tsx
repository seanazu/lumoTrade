"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { EquityCurveChart } from "@/components/design-system/charts";
import { Button } from "@/components/design-system/atoms/Button";
import { Card } from "@/components/design-system/atoms/Card";
import { useSSEProgress } from "@/hooks/useSSEProgress";
import { ProgressPanel } from "@/components/modules/progress/ProgressPanel";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Target,
  AlertCircle,
  Activity,
} from "lucide-react";

interface BacktestResults {
  symbol: string;
  strategy: string;
  initial_capital: number;
  final_equity: number;
  metrics: {
    total_return_percent: number;
    annualized_return_percent: number;
    win_rate_percent: number;
    profit_factor: number;
    sharpe_ratio: number;
    sortino_ratio: number;
    max_drawdown_percent: number;
    num_trades: number;
    avg_trade_duration_hours: number;
  };
  equity_curve: Array<{ timestamp: string; equity: number }>;
  trades: any[];
}

interface BacktestComparisonProps {
  symbol?: string;
  index?: string;
}

export function BacktestComparison({
  symbol = "SPY",
  index = "SPX",
}: BacktestComparisonProps) {
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [kellyFraction, setKellyFraction] = useState(25);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [showTrades, setShowTrades] = useState<"confidence" | "kelly" | null>(
    null
  );
  const [operationId, setOperationId] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const hasTriedConnectRef = useRef(false);

  // SSE Progress tracking
  const sseUrl = operationId
    ? `http://localhost:8000/api/stream/backtest?operation_id=${operationId}&index=${index}&start_date=${dateRange.start}&end_date=${dateRange.end}&confidence_threshold=${confidenceThreshold / 100}&kelly_fraction=${kellyFraction / 100}`
    : null;
  const { progress, isConnected, connect } = useSSEProgress(sseUrl);

  // Clear state when backtest completes
  useEffect(() => {
    if ((progress.isComplete || progress.error) && operationId) {
      const timer = setTimeout(() => {
        setOperationId(null);
        setShowProgress(false);
        hasTriedConnectRef.current = false;
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [progress.isComplete, progress.error, operationId]);

  // Auto-connect when operationId changes (only once per operation)
  useEffect(() => {
    if (operationId && sseUrl && showProgress && !hasTriedConnectRef.current) {
      hasTriedConnectRef.current = true;

      const timer = setTimeout(() => {
        connect();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [operationId, sseUrl, showProgress, connect]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: [
      "backtest-comparison",
      index,
      dateRange,
      confidenceThreshold,
      kellyFraction,
    ],
    queryFn: async () => {
      const response = await fetch(
        "http://localhost:8000/api/backtest/compare",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            index,
            start_date: dateRange.start,
            end_date: dateRange.end,
            initial_capital: 10000,
            confidence_threshold: confidenceThreshold / 100,
            kelly_fraction: kellyFraction / 100,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to fetch backtest results");
      return response.json();
    },
    enabled: false, // Don't auto-run, wait for user to click "Run Backtest"
  });

  const handleRunBacktest = () => {
    // Generate unique operation ID
    const newOpId = `backtest_${Date.now()}`;

    // Reset state and prepare for connection
    hasTriedConnectRef.current = false;
    setOperationId(newOpId);
    setShowProgress(true);
  };

  // Use result from SSE if available, otherwise fallback to query data
  const backtestData = progress.result || data?.data;

  const confidenceResults: BacktestResults | null =
    backtestData?.confidence_threshold?.results;
  const kellyResults: BacktestResults | null =
    backtestData?.kelly_criterion?.results;
  const comparison = backtestData?.comparison;

  const MetricCard = ({
    label,
    value,
    suffix = "",
    better,
    icon: Icon,
  }: any) => {
    const isPositive = typeof value === "number" && value > 0;
    const colorClass =
      better === "confidence_threshold"
        ? "text-blue-500 bg-blue-500/10 border-blue-500/30 dark:text-blue-400 dark:bg-blue-500/20 dark:border-blue-500/30"
        : better === "kelly_criterion"
          ? "text-green-500 bg-green-500/10 border-green-500/30 dark:text-green-400 dark:bg-green-500/20 dark:border-green-500/30"
          : isPositive
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400";

    return (
      <div
        className={`p-4 rounded-lg border transition-colors ${better ? colorClass : "border-border bg-card"}`}
      >
        {Icon && (
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-4 h-4 text-muted-foreground" />
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </div>
          </div>
        )}
        {!Icon && (
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {label}
          </div>
        )}
        <div className={`text-2xl font-bold ${better ? "" : colorClass}`}>
          {typeof value === "number" ? value.toFixed(2) : value}
          {suffix}
        </div>
      </div>
    );
  };

  const TradesTable = ({
    trades,
    strategy,
  }: {
    trades: any[];
    strategy: string;
  }) => (
    <div className="mt-4 max-h-96 overflow-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-secondary border-b border-border">
          <tr>
            <th className="text-left p-3 text-muted-foreground font-semibold">
              Time
            </th>
            <th className="text-left p-3 text-muted-foreground font-semibold">
              Type
            </th>
            <th className="text-right p-3 text-muted-foreground font-semibold">
              Price
            </th>
            <th className="text-right p-3 text-muted-foreground font-semibold">
              Shares
            </th>
            <th className="text-right p-3 text-muted-foreground font-semibold">
              Total
            </th>
            <th className="text-right p-3 text-muted-foreground font-semibold">
              Conf
            </th>
          </tr>
        </thead>
        <tbody>
          {trades.slice(0, 100).map((trade, idx) => (
            <tr
              key={idx}
              className="border-b border-border hover:bg-secondary/50 transition-colors"
            >
              <td className="p-3 text-foreground">
                {new Date(trade.timestamp).toLocaleDateString()}
              </td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    trade.type === "BUY"
                      ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30"
                      : "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                  }`}
                >
                  {trade.type}
                </span>
              </td>
              <td className="p-3 text-right text-foreground font-mono">
                ${trade.price.toFixed(2)}
              </td>
              <td className="p-3 text-right text-foreground font-mono">
                {trade.shares}
              </td>
              <td className="p-3 text-right text-foreground font-mono">
                ${trade.total.toFixed(2)}
              </td>
              <td className="p-3 text-right">
                <span className="text-xs font-semibold text-muted-foreground">
                  {(trade.confidence * 100).toFixed(0)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const isButtonDisabled = isFetching || isConnected;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-bold text-foreground">
            Backtest Configuration
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Confidence Threshold:{" "}
              <span className="text-primary font-bold">
                {confidenceThreshold}%
              </span>
            </label>
            <input
              type="range"
              min="50"
              max="90"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Kelly Fraction:{" "}
              <span className="text-primary font-bold">{kellyFraction}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={kellyFraction}
              onChange={(e) => setKellyFraction(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-600 dark:text-amber-400">
            <p className="font-semibold mb-1">Realistic Expectations</p>
            <p className="text-xs">
              Professional quantitative funds typically achieve 15-30% annual
              returns. Exceptional performance is 40-60% annually. Expect
              realistic returns of 10-25% with proper risk management.
            </p>
          </div>
        </div>

        <Button
          onClick={handleRunBacktest}
          disabled={isButtonDisabled}
          className="w-full"
        >
          {isButtonDisabled ? (
            <>
              <Activity className="w-4 h-4 animate-pulse mr-2" />
              Running Backtest...
            </>
          ) : (
            <>
              <Target className="w-4 h-4 mr-2" />
              Run Backtest
            </>
          )}
        </Button>
      </Card>

      {/* Progress Panel */}
      {showProgress && (
        <ProgressPanel
          progress={progress}
          title="Backtest Progress"
          showData={true}
        />
      )}

      {isLoading || isFetching || isConnected ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-muted-foreground text-lg">
            {isConnected
              ? "Running backtest simulation..."
              : "Preparing backtest..."}
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            This may take 30-60 seconds
          </p>
        </div>
      ) : (progress.isComplete || data?.success) &&
        confidenceResults &&
        kellyResults ? (
        <>
          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confidence Threshold Strategy */}
            <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-blue-500/10 dark:from-blue-500/10 dark:to-blue-500/5 border-blue-500/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Target className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Confidence Threshold
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      Minimum {confidenceThreshold}% confidence
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-64 mb-6 bg-background/50 rounded-lg p-4 border border-border">
                <EquityCurveChart
                  data={confidenceResults.equity_curve}
                  initialCapital={confidenceResults.initial_capital}
                  color="#3b82f6"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <MetricCard
                  icon={DollarSign}
                  label="Total Return"
                  value={confidenceResults.metrics.total_return_percent}
                  suffix="%"
                />
                <MetricCard
                  icon={TrendingUp}
                  label="Win Rate"
                  value={confidenceResults.metrics.win_rate_percent}
                  suffix="%"
                />
                <MetricCard
                  icon={Activity}
                  label="Sharpe Ratio"
                  value={confidenceResults.metrics.sharpe_ratio}
                />
                <MetricCard
                  icon={TrendingDown}
                  label="Max Drawdown"
                  value={confidenceResults.metrics.max_drawdown_percent}
                  suffix="%"
                />
                <MetricCard
                  label="Profit Factor"
                  value={confidenceResults.metrics.profit_factor}
                />
                <MetricCard
                  icon={BarChart3}
                  label="Trades"
                  value={confidenceResults.metrics.num_trades}
                />
              </div>

              <Button
                variant="outline"
                onClick={() =>
                  setShowTrades(
                    showTrades === "confidence" ? null : "confidence"
                  )
                }
                className="w-full"
              >
                {showTrades === "confidence" ? "Hide" : "Show"} Trade Log (
                {confidenceResults.trades.length})
              </Button>

              {showTrades === "confidence" && (
                <TradesTable
                  trades={confidenceResults.trades}
                  strategy="confidence"
                />
              )}
            </Card>

            {/* Kelly Criterion Strategy */}
            <Card className="p-6 bg-gradient-to-br from-green-500/5 to-green-500/10 dark:from-green-500/10 dark:to-green-500/5 border-green-500/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Kelly Criterion
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {kellyFraction}% Kelly fraction
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-64 mb-6 bg-background/50 rounded-lg p-4 border border-border">
                <EquityCurveChart
                  data={kellyResults.equity_curve}
                  initialCapital={kellyResults.initial_capital}
                  color="#10b981"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <MetricCard
                  icon={DollarSign}
                  label="Total Return"
                  value={kellyResults.metrics.total_return_percent}
                  suffix="%"
                />
                <MetricCard
                  icon={TrendingUp}
                  label="Win Rate"
                  value={kellyResults.metrics.win_rate_percent}
                  suffix="%"
                />
                <MetricCard
                  icon={Activity}
                  label="Sharpe Ratio"
                  value={kellyResults.metrics.sharpe_ratio}
                />
                <MetricCard
                  icon={TrendingDown}
                  label="Max Drawdown"
                  value={kellyResults.metrics.max_drawdown_percent}
                  suffix="%"
                />
                <MetricCard
                  label="Profit Factor"
                  value={kellyResults.metrics.profit_factor}
                />
                <MetricCard
                  icon={BarChart3}
                  label="Trades"
                  value={kellyResults.metrics.num_trades}
                />
              </div>

              <Button
                variant="outline"
                onClick={() =>
                  setShowTrades(showTrades === "kelly" ? null : "kelly")
                }
                className="w-full"
              >
                {showTrades === "kelly" ? "Hide" : "Show"} Trade Log (
                {kellyResults.trades.length})
              </Button>

              {showTrades === "kelly" && (
                <TradesTable trades={kellyResults.trades} strategy="kelly" />
              )}
            </Card>
          </div>

          {/* Comparative Analysis */}
          {comparison && (
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-bold text-foreground">
                  Comparative Analysis
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(comparison).map(
                  ([metric, data]: [string, any]) => {
                    if (typeof data !== "object" || !data.better_strategy)
                      return null;

                    const betterStrategy = data.better_strategy;
                    const diff = data.difference;

                    return (
                      <MetricCard
                        key={metric}
                        label={metric
                          .replace(/_/g, " ")
                          .replace(/percent|ratio/gi, "")
                          .trim()}
                        value={Math.abs(diff)}
                        suffix={metric.includes("percent") ? "%" : ""}
                        better={betterStrategy}
                      />
                    );
                  }
                )}
              </div>

              <div className="mt-6 p-4 bg-secondary/50 rounded-lg border border-border">
                <div className="flex items-start gap-3">
                  <div className="flex gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500/20 border-2 border-blue-500/50"></div>
                      <span className="text-sm text-muted-foreground">
                        <span className="font-semibold text-blue-500">
                          Blue
                        </span>{" "}
                        - Confidence Threshold performs better
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500/20 border-2 border-green-500/50"></div>
                      <span className="text-sm text-muted-foreground">
                        <span className="font-semibold text-green-500">
                          Green
                        </span>{" "}
                        - Kelly Criterion performs better
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-16 text-center bg-card border-border border-dashed">
          <BarChart3 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg font-medium">
            No backtest results yet
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Configure parameters and click &quot;Run Backtest&quot; to start
          </p>
        </Card>
      )}
    </div>
  );
}
