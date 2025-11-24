"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EquityCurveChart } from '@/components/design-system/charts';
import { Button } from '@/components/design-system/atoms/Button';
import { Card } from '@/components/design-system/atoms/Card';

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

export function BacktestComparison({ symbol = "SPY", index = "SPX" }: BacktestComparisonProps) {
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [kellyFraction, setKellyFraction] = useState(25);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [showTrades, setShowTrades] = useState<'confidence' | 'kelly' | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['backtest-comparison', index, dateRange, confidenceThreshold, kellyFraction],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/backtest/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          index,
          start_date: dateRange.start,
          end_date: dateRange.end,
          initial_capital: 10000,
          confidence_threshold: confidenceThreshold / 100,
          kelly_fraction: kellyFraction / 100
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch backtest results');
      return response.json();
    },
    enabled: false // Don't auto-run, wait for user to click "Run Backtest"
  });

  const confidenceResults: BacktestResults | null = data?.data?.confidence_threshold?.results;
  const kellyResults: BacktestResults | null = data?.data?.kelly_criterion?.results;
  const comparison = data?.data?.comparison;

  const MetricCard = ({ label, value, suffix = '', better }: any) => {
    const isPositive = typeof value === 'number' && value > 0;
    const colorClass = better === 'confidence_threshold' 
      ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      : better === 'kelly_criterion'
      ? 'text-green-400 bg-green-500/10 border-green-500/20'
      : isPositive
      ? 'text-green-400'
      : 'text-red-400';

    return (
      <div className={`p-3 rounded-lg border ${better ? colorClass : 'border-gray-700'}`}>
        <div className="text-xs text-gray-400 mb-1">{label}</div>
        <div className={`text-lg font-bold ${better ? '' : colorClass}`}>
          {typeof value === 'number' ? value.toFixed(2) : value}{suffix}
        </div>
      </div>
    );
  };

  const TradesTable = ({ trades, strategy }: { trades: any[], strategy: string }) => (
    <div className="mt-4 max-h-64 overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-800">
          <tr className="border-b border-gray-700">
            <th className="text-left p-2 text-gray-400">Time</th>
            <th className="text-left p-2 text-gray-400">Type</th>
            <th className="text-right p-2 text-gray-400">Price</th>
            <th className="text-right p-2 text-gray-400">Shares</th>
            <th className="text-right p-2 text-gray-400">Total</th>
            <th className="text-right p-2 text-gray-400">Conf</th>
          </tr>
        </thead>
        <tbody>
          {trades.slice(0, 50).map((trade, idx) => (
            <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="p-2 text-gray-300">{new Date(trade.timestamp).toLocaleDateString()}</td>
              <td className="p-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {trade.type}
                </span>
              </td>
              <td className="p-2 text-right text-gray-300">${trade.price.toFixed(2)}</td>
              <td className="p-2 text-right text-gray-300">{trade.shares}</td>
              <td className="p-2 text-right text-gray-300">${trade.total.toFixed(2)}</td>
              <td className="p-2 text-right text-gray-300">{(trade.confidence * 100).toFixed(0)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-6 bg-gray-900/50 border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4">Backtest Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Confidence Threshold: {confidenceThreshold}%
            </label>
            <input
              type="range"
              min="50"
              max="90"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Kelly Fraction: {kellyFraction}%
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={kellyFraction}
              onChange={(e) => setKellyFraction(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        <Button
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-full"
        >
          {isFetching ? 'Running Backtest...' : 'Run Backtest'}
        </Button>
      </Card>

      {isLoading || isFetching ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-400 mt-4">Running backtest simulation...</p>
        </div>
      ) : data?.success && confidenceResults && kellyResults ? (
        <>
          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confidence Threshold Strategy */}
            <Card className="p-6 bg-gray-900/50 border-blue-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-blue-400">Confidence Threshold</h3>
                <span className="text-xs text-gray-400">{confidenceThreshold}% threshold</span>
              </div>
              
              <div className="h-64 mb-4">
                <EquityCurveChart
                  data={confidenceResults.equity_curve}
                  initialCapital={confidenceResults.initial_capital}
                  color="#3b82f6"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Total Return"
                  value={confidenceResults.metrics.total_return_percent}
                  suffix="%"
                />
                <MetricCard
                  label="Win Rate"
                  value={confidenceResults.metrics.win_rate_percent}
                  suffix="%"
                />
                <MetricCard
                  label="Sharpe Ratio"
                  value={confidenceResults.metrics.sharpe_ratio}
                />
                <MetricCard
                  label="Max Drawdown"
                  value={confidenceResults.metrics.max_drawdown_percent}
                  suffix="%"
                />
                <MetricCard
                  label="Profit Factor"
                  value={confidenceResults.metrics.profit_factor}
                />
                <MetricCard
                  label="Trades"
                  value={confidenceResults.metrics.num_trades}
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowTrades(showTrades === 'confidence' ? null : 'confidence')}
                className="w-full mt-4"
              >
                {showTrades === 'confidence' ? 'Hide' : 'Show'} Trade Log
              </Button>
              
              {showTrades === 'confidence' && (
                <TradesTable trades={confidenceResults.trades} strategy="confidence" />
              )}
            </Card>

            {/* Kelly Criterion Strategy */}
            <Card className="p-6 bg-gray-900/50 border-green-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-green-400">Kelly Criterion</h3>
                <span className="text-xs text-gray-400">{kellyFraction}% Kelly</span>
              </div>
              
              <div className="h-64 mb-4">
                <EquityCurveChart
                  data={kellyResults.equity_curve}
                  initialCapital={kellyResults.initial_capital}
                  color="#10b981"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Total Return"
                  value={kellyResults.metrics.total_return_percent}
                  suffix="%"
                />
                <MetricCard
                  label="Win Rate"
                  value={kellyResults.metrics.win_rate_percent}
                  suffix="%"
                />
                <MetricCard
                  label="Sharpe Ratio"
                  value={kellyResults.metrics.sharpe_ratio}
                />
                <MetricCard
                  label="Max Drawdown"
                  value={kellyResults.metrics.max_drawdown_percent}
                  suffix="%"
                />
                <MetricCard
                  label="Profit Factor"
                  value={kellyResults.metrics.profit_factor}
                />
                <MetricCard
                  label="Trades"
                  value={kellyResults.metrics.num_trades}
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowTrades(showTrades === 'kelly' ? null : 'kelly')}
                className="w-full mt-4"
              >
                {showTrades === 'kelly' ? 'Hide' : 'Show'} Trade Log
              </Button>
              
              {showTrades === 'kelly' && (
                <TradesTable trades={kellyResults.trades} strategy="kelly" />
              )}
            </Card>
          </div>

          {/* Comparative Analysis */}
          {comparison && (
            <Card className="p-6 bg-gray-900/50 border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">Comparative Analysis</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(comparison).map(([metric, data]: [string, any]) => {
                  if (typeof data !== 'object' || !data.better_strategy) return null;
                  
                  const betterStrategy = data.better_strategy;
                  const diff = data.difference;
                  
                  return (
                    <MetricCard
                      key={metric}
                      label={metric.replace(/_/g, ' ').replace(/percent|ratio/gi, '').trim()}
                      value={Math.abs(diff)}
                      suffix={metric.includes('percent') ? '%' : ''}
                      better={betterStrategy}
                    />
                  );
                })}
              </div>
              
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400">
                  <span className="text-blue-400 font-semibold">Blue</span> indicates Confidence Threshold performed better. {' '}
                  <span className="text-green-400 font-semibold">Green</span> indicates Kelly Criterion performed better.
                </p>
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-12 text-center bg-gray-900/50 border-gray-800">
          <p className="text-gray-400">Click "Run Backtest" to compare strategies</p>
        </Card>
      )}
    </div>
  );
}

