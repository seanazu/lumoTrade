"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle } from "lucide-react";
import { Card } from "@/components/design-system/atoms/Card";
import { LineChart, Line, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { fadeInUp, staggerChildren, counterVariant } from "@/lib/animations/variants";

interface InvestmentSimulatorProps {
  ticker: string;
}

type Timeframe = "1y" | "5y" | "10y";

interface SimulationResults {
  ticker: string;
  timeframe: string;
  initial_capital: number;
  ml_model: {
    final_value: number;
    total_return: number;
    cagr: number;
    sharpe?: number;
    sharpe_ratio?: number;
    max_drawdown: number;
    win_rate?: number;
    equity_curve: Array<{ date: string; value: number }>;
  };
  buy_hold: {
    final_value: number;
    total_return: number;
    cagr: number;
    sharpe?: number;
    sharpe_ratio?: number;
    max_drawdown: number;
    equity_curve: Array<{ date: string; value: number }>;
  };
  comparison?: {
    outperformance?: number;
    sharpe_improvement?: number;
    drawdown_reduction?: number;
  };
}

export function InvestmentSimulator({ ticker }: InvestmentSimulatorProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1y");
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSimulation();
  }, [ticker, timeframe]);

  const fetchSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/backtest/simulate/${ticker}/${timeframe}`
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Failed to fetch simulation:", error);
    } finally {
      setLoading(false);
    }
  };

  const timeframes: Array<{ key: Timeframe; label: string; desc: string }> = [
    { key: "1y", label: "1 Year", desc: "Recent performance" },
    { key: "5y", label: "5 Years", desc: "Medium-term" },
    { key: "10y", label: "10 Years", desc: "Long-term" },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "N/A";
    }
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading simulation...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Failed to load simulation data</p>
        </div>
      </Card>
    );
  }

  // Normalize sharpe field (backend returns sharpe_ratio, frontend expects sharpe)
  const mlSharpe = results.ml_model.sharpe ?? results.ml_model.sharpe_ratio ?? 0;
  const bhSharpe = results.buy_hold.sharpe ?? results.buy_hold.sharpe_ratio ?? 0;

  // Combine equity curves for comparison chart
  const chartData = results.ml_model.equity_curve.map((mlPoint, index) => ({
    date: mlPoint.date,
    mlModel: mlPoint.value,
    buyHold: results.buy_hold.equity_curve[index]?.value || 0,
  }));

  return (
    <motion.div
      className="space-y-6"
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
    >
      {/* Timeframe Selector */}
      <motion.div variants={fadeInUp}>
        <div className="flex gap-3">
          {timeframes.map((tf) => (
            <motion.button
              key={tf.key}
              onClick={() => setTimeframe(tf.key)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                timeframe === tf.key
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-border bg-secondary hover:border-blue-500/50"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <div className={`text-lg font-bold mb-1 ${
                  timeframe === tf.key ? "text-blue-400" : "text-foreground"
                }`}>
                  {tf.label}
                </div>
                <div className="text-xs text-muted-foreground">{tf.desc}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Comparison Highlights */}
      {results.comparison && (
        <motion.div variants={fadeInUp}>
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">Outperformance</div>
                <motion.div
                  className={`text-3xl font-bold ${
                    (results.comparison.outperformance ?? 0) >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                  variants={counterVariant}
                >
                  {formatPercent(results.comparison.outperformance)}
                </motion.div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">Sharpe Improvement</div>
                <motion.div
                  className={`text-3xl font-bold ${
                    (results.comparison.sharpe_improvement ?? 0) >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                  variants={counterVariant}
                >
                  {formatPercent(results.comparison.sharpe_improvement)}
                </motion.div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">Drawdown Reduction</div>
                <motion.div
                  className={`text-3xl font-bold ${
                    (results.comparison.drawdown_reduction ?? 0) >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                  variants={counterVariant}
                >
                  {formatPercent(results.comparison.drawdown_reduction)}
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Equity Curve Comparison */}
      <motion.div variants={fadeInUp}>
        <Card className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-6">Equity Curve Comparison</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="mlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="bhGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  tick={{ fill: "#999" }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis
                  stroke="#666"
                  tick={{ fill: "#999" }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value: number) => [formatCurrency(value), ""]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="mlModel"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#mlGradient)"
                  name="ML Model"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="buyHold"
                  stroke="#a855f7"
                  fillOpacity={1}
                  fill="url(#bhGradient)"
                  name="Buy & Hold"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Side-by-Side Comparison */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={staggerChildren}
      >
        {/* ML Model Results */}
        <motion.div variants={fadeInUp}>
          <Card className="p-6 border-blue-500/30 bg-blue-500/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">ML Model Strategy</h3>
                <p className="text-sm text-muted-foreground">AI-powered trading</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                <div className="text-sm text-muted-foreground mb-2">Final Value</div>
                <div className="text-3xl font-bold text-foreground">
                  {formatCurrency(results.ml_model.final_value)}
                </div>
                <div className={`text-sm mt-1 ${
                  results.ml_model.total_return >= 0 ? "text-green-400" : "text-red-400"
                }`}>
                  {formatPercent(results.ml_model.total_return)} return
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="CAGR"
                  value={formatPercent(results.ml_model.cagr)}
                  target={60}
                  actual={results.ml_model.cagr}
                />
                <MetricCard
                  label="Sharpe"
                  value={mlSharpe ? mlSharpe.toFixed(2) : "N/A"}
                  target={2.0}
                  actual={mlSharpe}
                />
                <MetricCard
                  label="Max DD"
                  value={formatPercent(results.ml_model.max_drawdown)}
                  target={-20}
                  actual={results.ml_model.max_drawdown}
                  inverse
                />
                {results.ml_model.win_rate && (
                  <MetricCard
                    label="Win Rate"
                    value={formatPercent(results.ml_model.win_rate * 100)}
                    target={55}
                    actual={results.ml_model.win_rate * 100}
                  />
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Buy & Hold Results */}
        <motion.div variants={fadeInUp}>
          <Card className="p-6 border-purple-500/30 bg-purple-500/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Buy & Hold</h3>
                <p className="text-sm text-muted-foreground">Traditional investing</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                <div className="text-sm text-muted-foreground mb-2">Final Value</div>
                <div className="text-3xl font-bold text-foreground">
                  {formatCurrency(results.buy_hold.final_value)}
                </div>
                <div className={`text-sm mt-1 ${
                  results.buy_hold.total_return >= 0 ? "text-green-400" : "text-red-400"
                }`}>
                  {formatPercent(results.buy_hold.total_return)} return
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="CAGR"
                  value={formatPercent(results.buy_hold.cagr)}
                  target={60}
                  actual={results.buy_hold.cagr}
                />
                <MetricCard
                  label="Sharpe"
                  value={bhSharpe ? bhSharpe.toFixed(2) : "N/A"}
                  target={2.0}
                  actual={bhSharpe}
                />
                <MetricCard
                  label="Max DD"
                  value={formatPercent(results.buy_hold.max_drawdown)}
                  target={-20}
                  actual={results.buy_hold.max_drawdown}
                  inverse
                />
                <div className="p-3 bg-secondary/50 rounded-lg border border-border opacity-50">
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                  <div className="text-sm text-foreground">N/A</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function MetricCard({
  label,
  value,
  target,
  actual,
  inverse = false,
}: {
  label: string;
  value: string;
  target: number;
  actual: number;
  inverse?: boolean;
}) {
  const isGood = inverse
    ? actual > target // For drawdown, higher (less negative) is better
    : actual >= target;

  return (
    <div className={`p-3 rounded-lg border ${
      isGood ? "bg-green-500/10 border-green-500/30" : "bg-amber-500/10 border-amber-500/30"
    }`}>
      <div className="text-xs text-muted-foreground flex items-center justify-between mb-1">
        <span>{label}</span>
        {isGood ? (
          <TrendingUp className="w-3 h-3 text-green-400" />
        ) : (
          <TrendingDown className="w-3 h-3 text-amber-400" />
        )}
      </div>
      <div className={`text-lg font-bold ${
        isGood ? "text-green-400" : "text-amber-400"
      }`}>
        {value}
      </div>
    </div>
  );
}

