"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";
import { GlassCard } from "@/components/design-system/atoms/GlassCard";
import { Button } from "@/components/design-system/atoms/Button";
import { cn } from "@/lib/utils";

interface BacktestRequest {
  symbol: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  strategy: string;
}

interface BacktestResults {
  symbol: string;
  period: { start: string; end: string };
  initial_capital: number;
  final_equity: number;
  metrics: {
    total_return_percent: number;
    num_trades: number;
    win_rate_percent: number;
    max_drawdown_percent: number;
    sharpe_ratio: number;
    final_equity: number;
  };
  equity_curve: Array<{
    timestamp: string;
    equity: number;
  }>;
  trades: Array<{
    timestamp: string;
    type: string;
    shares: number;
    price: number;
    total: number;
    confidence: number;
  }>;
}

async function runBacktest(request: BacktestRequest): Promise<BacktestResults> {
  const response = await fetch("http://localhost:8000/api/backtest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Failed to run backtest");
  }

  const data = await response.json();
  return data.data;
}

export function BacktestDashboard() {
  const [config, setConfig] = useState({
    symbol: "SPY",
    start_date: "2023-01-01",
    end_date: "2024-01-01",
    initial_capital: 10000,
    strategy: "follow_prediction",
  });

  const mutation = useMutation({
    mutationFn: runBacktest,
  });

  const handleRunBacktest = () => {
    mutation.mutate(config);
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Backtest Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Symbol</label>
            <input
              type="text"
              value={config.symbol}
              onChange={(e) => setConfig({ ...config, symbol: e.target.value })}
              className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={config.start_date}
              onChange={(e) => setConfig({ ...config, start_date: e.target.value })}
              className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              value={config.end_date}
              onChange={(e) => setConfig({ ...config, end_date: e.target.value })}
              className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Initial Capital</label>
            <input
              type="number"
              value={config.initial_capital}
              onChange={(e) => setConfig({ ...config, initial_capital: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Strategy</label>
            <select
              value={config.strategy}
              onChange={(e) => setConfig({ ...config, strategy: e.target.value })}
              className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg"
            >
              <option value="follow_prediction">Follow Prediction</option>
              <option value="contrarian">Contrarian</option>
            </select>
          </div>
        </div>

        <Button onClick={handleRunBacktest} disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? "Running Backtest..." : "Run Backtest"}
        </Button>
      </GlassCard>

      {/* Results */}
      {mutation.isSuccess && mutation.data && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Total Return</p>
              </div>
              <p
                className={cn(
                  "text-2xl font-bold",
                  mutation.data.metrics.total_return_percent > 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {mutation.data.metrics.total_return_percent > 0 ? "+" : ""}
                {mutation.data.metrics.total_return_percent.toFixed(2)}%
              </p>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Trades</p>
              </div>
              <p className="text-2xl font-bold">{mutation.data.metrics.num_trades}</p>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </div>
              <p className="text-2xl font-bold">{mutation.data.metrics.win_rate_percent.toFixed(1)}%</p>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
              </div>
              <p className="text-2xl font-bold">{mutation.data.metrics.sharpe_ratio.toFixed(2)}</p>
            </GlassCard>
          </div>

          {/* Equity Curve */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Equity Curve</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mutation.data.equity_curve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "0.5rem",
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Equity"]}
                  />
                  <Line type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Trade History */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Trade History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Time</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Shares</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Price</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Total</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {mutation.data.trades.slice(0, 20).map((trade, idx) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-2 px-3 text-sm">
                        {new Date(trade.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            trade.type === "BUY" ? "text-green-500" : "text-red-500"
                          )}
                        >
                          {trade.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-sm text-right">{trade.shares}</td>
                      <td className="py-2 px-3 text-sm text-right">${trade.price.toFixed(2)}</td>
                      <td className="py-2 px-3 text-sm text-right">${trade.total.toFixed(2)}</td>
                      <td className="py-2 px-3 text-sm text-right">
                        {(trade.confidence * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}

      {/* Error State */}
      {mutation.isError && (
        <GlassCard className="p-6 border-2 border-destructive/30">
          <p className="text-destructive">
            Failed to run backtest. Make sure the ML backend is running.
          </p>
        </GlassCard>
      )}
    </div>
  );
}

