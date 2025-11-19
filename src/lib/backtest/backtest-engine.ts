export interface OHLCVData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Strategy {
  name: string;
  entryConditions: (data: OHLCVData[], index: number) => boolean;
  exitConditions: (data: OHLCVData[], index: number, entryPrice: number) => boolean;
  stopLoss?: number; // Percentage
  takeProfit?: number; // Percentage
  positionSize?: number; // Default: 1 (100% of capital)
}

export interface Trade {
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  profitLoss: number;
  profitLossPercent: number;
  type: 'win' | 'loss';
}

export interface BacktestResults {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalReturn: number;
  totalReturnPercent: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  trades: Trade[];
  equityCurve: Array<{ time: number; equity: number }>;
}

export class BacktestEngine {
  private data: OHLCVData[];
  private initialCapital: number;

  constructor(data: OHLCVData[], initialCapital: number = 10000) {
    this.data = data;
    this.initialCapital = initialCapital;
  }

  runBacktest(strategy: Strategy): BacktestResults {
    const trades: Trade[] = [];
    let currentEquity = this.initialCapital;
    const equityCurve: Array<{ time: number; equity: number }> = [
      { time: this.data[0].time, equity: this.initialCapital },
    ];

    let inPosition = false;
    let entryPrice = 0;
    let entryTime = 0;
    let positionSize = strategy.positionSize || 1;

    // Iterate through price data
    for (let i = 1; i < this.data.length; i++) {
      const currentBar = this.data[i];

      if (!inPosition) {
        // Check entry conditions
        if (strategy.entryConditions(this.data, i)) {
          inPosition = true;
          entryPrice = currentBar.close;
          entryTime = currentBar.time;
        }
      } else {
        // Check stop loss
        if (strategy.stopLoss) {
          const stopPrice = entryPrice * (1 - strategy.stopLoss / 100);
          if (currentBar.low <= stopPrice) {
            // Stop loss hit
            const exitPrice = stopPrice;
            const pnl = (exitPrice - entryPrice) / entryPrice;
            const pnlAmount = currentEquity * positionSize * pnl;

            trades.push({
              entryTime,
              exitTime: currentBar.time,
              entryPrice,
              exitPrice,
              profitLoss: pnlAmount,
              profitLossPercent: pnl * 100,
              type: pnl >= 0 ? 'win' : 'loss',
            });

            currentEquity += pnlAmount;
            inPosition = false;
            continue;
          }
        }

        // Check take profit
        if (strategy.takeProfit) {
          const targetPrice = entryPrice * (1 + strategy.takeProfit / 100);
          if (currentBar.high >= targetPrice) {
            // Take profit hit
            const exitPrice = targetPrice;
            const pnl = (exitPrice - entryPrice) / entryPrice;
            const pnlAmount = currentEquity * positionSize * pnl;

            trades.push({
              entryTime,
              exitTime: currentBar.time,
              entryPrice,
              exitPrice,
              profitLoss: pnlAmount,
              profitLossPercent: pnl * 100,
              type: 'win',
            });

            currentEquity += pnlAmount;
            inPosition = false;
            continue;
          }
        }

        // Check exit conditions
        if (strategy.exitConditions(this.data, i, entryPrice)) {
          const exitPrice = currentBar.close;
          const pnl = (exitPrice - entryPrice) / entryPrice;
          const pnlAmount = currentEquity * positionSize * pnl;

          trades.push({
            entryTime,
            exitTime: currentBar.time,
            entryPrice,
            exitPrice,
            profitLoss: pnlAmount,
            profitLossPercent: pnl * 100,
            type: pnl >= 0 ? 'win' : 'loss',
          });

          currentEquity += pnlAmount;
          inPosition = false;
        }
      }

      equityCurve.push({ time: currentBar.time, equity: currentEquity });
    }

    return this.calculateMetrics(trades, equityCurve);
  }

  private calculateMetrics(trades: Trade[], equityCurve: Array<{ time: number; equity: number }>): BacktestResults {
    const winningTrades = trades.filter((t) => t.type === 'win');
    const losingTrades = trades.filter((t) => t.type === 'loss');

    const totalProfit = winningTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLoss, 0));

    const finalEquity = equityCurve[equityCurve.length - 1].equity;
    const totalReturn = finalEquity - this.initialCapital;
    const totalReturnPercent = (totalReturn / this.initialCapital) * 100;

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = this.initialCapital;
    for (const point of equityCurve) {
      if (point.equity > peak) peak = point.equity;
      const drawdown = ((peak - point.equity) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Calculate Sharpe ratio (simplified)
    const returns = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const returnPct =
        (equityCurve[i].equity - equityCurve[i - 1].equity) / equityCurve[i - 1].equity;
      returns.push(returnPct);
    }
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      totalReturn,
      totalReturnPercent,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0,
      maxDrawdown,
      sharpeRatio,
      avgWin: winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map((t) => t.profitLoss)) : 0,
      largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map((t) => t.profitLoss)) : 0,
      trades,
      equityCurve,
    };
  }
}

// Example strategies
export const EXAMPLE_STRATEGIES = {
  rsiStrategy: {
    name: 'RSI Mean Reversion',
    entryConditions: (data: OHLCVData[], index: number) => {
      // Simplified RSI calculation
      if (index < 14) return false;
      const gains = [];
      const losses = [];
      for (let i = index - 13; i <= index; i++) {
        const change = data[i].close - data[i - 1].close;
        if (change > 0) gains.push(change);
        else losses.push(Math.abs(change));
      }
      const avgGain = gains.reduce((a, b) => a + b, 0) / 14;
      const avgLoss = losses.reduce((a, b) => a + b, 0) / 14;
      const rs = avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);
      return rsi < 30; // Oversold
    },
    exitConditions: (data: OHLCVData[], index: number, entryPrice: number) => {
      const currentPrice = data[index].close;
      const gain = ((currentPrice - entryPrice) / entryPrice) * 100;
      return gain > 5; // Exit at 5% profit
    },
    stopLoss: 3,
    takeProfit: 8,
  },
};

