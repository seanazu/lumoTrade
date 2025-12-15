"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, TrendingUp, TrendingDown, Clock, Target, AlertTriangle, CheckCircle2 } from "lucide-react";

interface MorningSignal {
  ticker: string;
  direction: "UP" | "DOWN";
  confidence: number;
  target_price: number;
  current_price: number;
  recommendation: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  position_size: number;
}

export function MorningStrategy() {
  const [signals, setSignals] = useState<MorningSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketStatus, setMarketStatus] = useState<'pre-market' | 'open' | 'closed'>('closed');
  const [timeUntilOpen, setTimeUntilOpen] = useState('');

  useEffect(() => {
    fetchMorningSignals();
    updateMarketStatus();
    
    const interval = setInterval(() => {
      updateMarketStatus();
      if (marketStatus === 'pre-market') {
        fetchMorningSignals();
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const updateMarketStatus = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;
    
    const marketOpen = 9 * 60 + 30; // 9:30 AM
    const marketClose = 16 * 60; // 4:00 PM
    const preMarket = 9 * 60; // 9:00 AM
    
    if (currentTime >= marketOpen && currentTime < marketClose) {
      setMarketStatus('open');
      setTimeUntilOpen('Market is open');
    } else if (currentTime >= preMarket && currentTime < marketOpen) {
      setMarketStatus('pre-market');
      const minutesUntilOpen = marketOpen - currentTime;
      setTimeUntilOpen(`${minutesUntilOpen} minutes until market opens`);
    } else {
      setMarketStatus('closed');
      const minutesUntilPreMarket = preMarket - currentTime + (currentTime > preMarket ? 24 * 60 : 0);
      setTimeUntilOpen(`Strategy available in ${Math.floor(minutesUntilPreMarket / 60)}h ${minutesUntilPreMarket % 60}m`);
    }
  };

  const fetchMorningSignals = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/legendary/morning-strategy');
      const data = await response.json();
      setSignals(data.signals || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching morning signals:', error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-400" />
            <div>
              <h2 className="text-3xl font-bold">Pre-Market Strategy</h2>
              <p className="text-muted-foreground">AI-generated signals for today's trading</p>
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-lg border-2 ${
            marketStatus === 'open' 
              ? 'bg-green-500/20 border-green-500/50 text-green-400' 
              : marketStatus === 'pre-market'
              ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
              : 'bg-gray-500/20 border-gray-500/50 text-gray-400'
          }`}>
            <Clock className="w-4 h-4 inline mr-2" />
            <span className="font-semibold">{timeUntilOpen}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-card/50 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Strategy Generation</div>
            <div className="text-lg font-bold text-blue-400">9:00 AM ET</div>
          </div>
          <div className="bg-card/50 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Market Opens</div>
            <div className="text-lg font-bold text-green-400">9:30 AM ET</div>
          </div>
          <div className="bg-card/50 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Signals Today</div>
            <div className="text-lg font-bold">{signals.length}</div>
          </div>
        </div>
      </div>

      {/* Trading Signals */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-xl font-bold mb-6">Today's Trading Signals</h3>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : signals.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">No signals available</p>
            <p className="text-sm text-muted-foreground">
              {marketStatus === 'closed' 
                ? 'Signals will be generated at 9:00 AM ET on trading days'
                : 'Model did not generate any high-confidence signals for today'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {signals.map((signal, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-secondary/50 to-secondary/30 border border-border rounded-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {/* Ticker & Direction */}
                    <div>
                      <div className="text-2xl font-bold mb-1">{signal.ticker}</div>
                      <div className={`inline-flex items-center px-3 py-1 rounded-lg font-semibold ${
                        signal.direction === 'UP'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {signal.direction === 'UP' ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {signal.direction}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-16 w-px bg-border"></div>

                    {/* Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-6">
                        <div>
                          <div className="text-xs text-muted-foreground">Confidence</div>
                          <div className="text-lg font-bold text-blue-400">
                            {(signal.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Current Price</div>
                          <div className="text-lg font-semibold">${signal.current_price.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Target</div>
                          <div className="text-lg font-semibold text-purple-400">
                            ${signal.target_price.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Position Size</div>
                          <div className="text-lg font-semibold">
                            {(signal.position_size * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Risk Level */}
                  <div className={`px-4 py-2 rounded-lg ${
                    signal.risk_level === 'LOW'
                      ? 'bg-green-500/20 text-green-400'
                      : signal.risk_level === 'MEDIUM'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    <div className="text-xs font-medium mb-1">Risk</div>
                    <div className="font-bold">{signal.risk_level}</div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold mb-1">Recommendation:</div>
                      <div className="text-sm text-muted-foreground">{signal.recommendation}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-yellow-400 mb-1">Important Disclaimer</div>
            <p className="text-muted-foreground">
              These are AI-generated signals based on historical data. Past performance does not guarantee future results.
              Always conduct your own research and consider your risk tolerance before trading.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

