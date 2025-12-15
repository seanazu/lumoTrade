"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, DollarSign, Target, AlertCircle } from "lucide-react";

interface Trade {
  id: string;
  ticker: string;
  direction: "UP" | "DOWN";
  confidence: number;
  entry_price: number;
  current_price?: number;
  position_size: number;
  status: "open" | "closed";
  pnl?: number;
  entry_time: string;
}

export function TodaysTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPnL, setTotalPnL] = useState(0);

  useEffect(() => {
    fetchTodaysTrades();
    const interval = setInterval(fetchTodaysTrades, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchTodaysTrades = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/legendary/trades/today');
      const data = await response.json();
      setTrades(data.trades || []);
      setTotalPnL(data.total_pnl || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trades:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-muted-foreground">Active Trades</span>
          </div>
          <div className="text-3xl font-bold">{trades.filter(t => t.status === 'open').length}</div>
        </div>

        <div className={`bg-gradient-to-br ${totalPnL >= 0 ? 'from-green-500/10 to-green-500/5 border-green-500/20' : 'from-red-500/10 to-red-500/5 border-red-500/20'} border rounded-xl p-6`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={`w-5 h-5 ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-sm text-muted-foreground">Today's P&L</span>
          </div>
          <div className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-muted-foreground">Total Trades</span>
          </div>
          <div className="text-3xl font-bold">{trades.length}</div>
        </div>
      </div>

      {/* Trades List */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-6">Today's Trades</h2>
        
        {trades.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No trades for today</p>
            <p className="text-sm text-muted-foreground">
              Trades will appear here when the model generates signals
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trades.map((trade) => (
              <motion.div
                key={trade.id}
                className="bg-secondary/30 border border-border rounded-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-lg font-semibold ${
                      trade.direction === 'UP' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {trade.direction === 'UP' ? (
                        <TrendingUp className="w-4 h-4 inline mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 inline mr-1" />
                      )}
                      {trade.ticker}
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-muted-foreground">Entry:</span>{' '}
                      <span className="font-semibold">${trade.entry_price.toFixed(2)}</span>
                    </div>

                    {trade.current_price && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Current:</span>{' '}
                        <span className="font-semibold">${trade.current_price.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="text-sm">
                      <span className="text-muted-foreground">Confidence:</span>{' '}
                      <span className="font-semibold">{(trade.confidence * 100).toFixed(1)}%</span>
                    </div>

                    <div className="text-sm">
                      <span className="text-muted-foreground">Size:</span>{' '}
                      <span className="font-semibold">{(trade.position_size * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {trade.pnl !== undefined && (
                      <div className={`text-lg font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}%
                      </div>
                    )}
                    
                    <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      trade.status === 'open'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {trade.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

