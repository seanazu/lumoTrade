"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, TrendingUp, TrendingDown, Filter, Download } from "lucide-react";

interface HistoricalTrade {
  id: string;
  date: string;
  ticker: string;
  direction: "UP" | "DOWN";
  confidence: number;
  entry_price: number;
  exit_price: number;
  position_size: number;
  pnl: number;
  pnl_percent: number;
  was_correct: boolean;
}

export function TradeHistory() {
  const [trades, setTrades] = useState<HistoricalTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all');
  const [stats, setStats] = useState({
    total_trades: 0,
    win_rate: 0,
    total_pnl: 0,
    avg_win: 0,
    avg_loss: 0
  });

  useEffect(() => {
    fetchTradeHistory();
  }, []);

  const fetchTradeHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/legendary/trades/history');
      const data = await response.json();
      setTrades(data.trades || []);
      setStats(data.stats || stats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trade history:', error);
      setLoading(false);
    }
  };

  const filteredTrades = trades.filter(trade => {
    if (filter === 'wins') return trade.pnl > 0;
    if (filter === 'losses') return trade.pnl <= 0;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Trades</div>
          <div className="text-2xl font-bold">{stats.total_trades}</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-green-400">{(stats.win_rate * 100).toFixed(1)}%</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-1">Total P&L</div>
          <div className={`text-2xl font-bold ${stats.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.total_pnl >= 0 ? '+' : ''}{stats.total_pnl.toFixed(2)}%
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-1">Avg Win</div>
          <div className="text-2xl font-bold text-green-400">+{stats.avg_win.toFixed(2)}%</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-1">Avg Loss</div>
          <div className="text-2xl font-bold text-red-400">{stats.avg_loss.toFixed(2)}%</div>
        </div>
      </div>

      {/* Trade History Table */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Trade History</h2>
          
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-secondary rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === 'all' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('wins')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === 'wins' ? 'bg-card text-green-400' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Wins
              </button>
              <button
                onClick={() => setFilter('losses')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === 'losses' ? 'bg-card text-red-400' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Losses
              </button>
            </div>

            <button className="px-3 py-1 bg-secondary rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
              <Download className="w-4 h-4 inline mr-1" />
              Export
            </button>
          </div>
        </div>

        {filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No trade history yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start paper trading to build your history
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ticker</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Direction</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Entry</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Exit</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Size</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">P&L</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Result</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade) => (
                  <motion.tr
                    key={trade.id}
                    className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td className="py-3 px-4 text-sm">{new Date(trade.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-sm font-semibold">{trade.ticker}</td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        trade.direction === 'UP'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.direction === 'UP' ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {trade.direction}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-right">${trade.entry_price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-right">${trade.exit_price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-right">{(trade.position_size * 100).toFixed(1)}%</td>
                    <td className={`py-3 px-4 text-sm text-right font-bold ${
                      trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {trade.pnl >= 0 ? '+' : ''}{trade.pnl_percent.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                        trade.was_correct
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.was_correct ? 'WIN' : 'LOSS'}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

