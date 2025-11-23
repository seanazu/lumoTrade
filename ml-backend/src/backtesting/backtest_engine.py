"""
Backtesting Engine for Prediction Model
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta

from src.data.data_loader import data_loader

class BacktestEngine:
    def __init__(self):
        self.results = []

    async def run_backtest(
        self,
        symbol: str,
        start_date: str,
        end_date: str,
        initial_capital: float,
        strategy: str,
        prediction_engine
    ) -> Dict:
        """
        Run backtest simulation
        
        Args:
            symbol: Symbol to test
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            initial_capital: Starting capital
            strategy: Strategy type ("follow_prediction", "contrarian", etc.)
            prediction_engine: PredictionEngine instance
        
        Returns:
            Backtest results with equity curve, trades, metrics
        """
        print(f"\n🔄 Running backtest for {symbol}...")
        print(f"   Period: {start_date} to {end_date}")
        print(f"   Initial capital: ${initial_capital:,.2f}")
        
        # Load historical data
        df = await data_loader.load_historical_data(
            symbol=symbol,
            start_date=start_date,
            end_date=end_date,
            interval="1hour"  # Hourly for faster backtesting
        )
        
        print(f"   Loaded {len(df)} bars")
        
        # Initialize portfolio
        portfolio = {
            "cash": initial_capital,
            "position": 0,  # Number of shares
            "equity": initial_capital,
            "trades": []
        }
        
        equity_curve = []
        trades = []
        
        # Simulate trading
        for i in range(60, len(df)):  # Start after warmup period
            current_bar = df.iloc[i]
            timestamp = current_bar["timestamp"]
            price = current_bar["close"]
            
            # Generate prediction
            # Note: In real backtest, would use only data available at that time
            # For simplicity, we'll use a simplified version
            
            # Placeholder: Random prediction (replace with actual model)
            prediction = self._mock_prediction()
            
            # Execute strategy
            if strategy == "follow_prediction":
                trade = self._follow_prediction_strategy(
                    portfolio=portfolio,
                    prediction=prediction,
                    price=price,
                    timestamp=timestamp
                )
                if trade:
                    trades.append(trade)
            
            # Update equity
            portfolio["equity"] = portfolio["cash"] + (portfolio["position"] * price)
            equity_curve.append({
                "timestamp": timestamp,
                "equity": portfolio["equity"]
            })
        
        # Calculate metrics
        metrics = self._calculate_metrics(
            initial_capital=initial_capital,
            final_equity=portfolio["equity"],
            equity_curve=equity_curve,
            trades=trades
        )
        
        return {
            "success": True,
            "symbol": symbol,
            "period": {"start": start_date, "end": end_date},
            "initial_capital": initial_capital,
            "final_equity": portfolio["equity"],
            "metrics": metrics,
            "equity_curve": equity_curve,
            "trades": trades
        }

    def _mock_prediction(self) -> Dict:
        """Mock prediction for testing (replace with real model)"""
        direction = np.random.choice(["bullish", "bearish", "neutral"])
        return {
            "direction": direction,
            "confidence": np.random.uniform(0.4, 0.9),
            "expected_move_percent": np.random.uniform(-2, 2)
        }

    def _follow_prediction_strategy(
        self,
        portfolio: Dict,
        prediction: Dict,
        price: float,
        timestamp: datetime
    ) -> Optional[Dict]:
        """
        Execute trades following the prediction
        
        Buy when bullish (confidence > 0.6)
        Sell when bearish (confidence > 0.6)
        """
        direction = prediction["direction"]
        confidence = prediction["confidence"]
        
        # Entry threshold
        if confidence < 0.6:
            return None
        
        # Buy signal
        if direction == "bullish" and portfolio["position"] == 0:
            # Buy with 90% of cash
            cash_to_invest = portfolio["cash"] * 0.9
            shares = int(cash_to_invest / price)
            
            if shares > 0:
                cost = shares * price
                portfolio["cash"] -= cost
                portfolio["position"] = shares
                
                return {
                    "timestamp": timestamp,
                    "type": "BUY",
                    "shares": shares,
                    "price": price,
                    "total": cost,
                    "confidence": confidence
                }
        
        # Sell signal
        elif direction == "bearish" and portfolio["position"] > 0:
            shares = portfolio["position"]
            proceeds = shares * price
            portfolio["cash"] += proceeds
            portfolio["position"] = 0
            
            return {
                "timestamp": timestamp,
                "type": "SELL",
                "shares": shares,
                "price": price,
                "total": proceeds,
                "confidence": confidence
            }
        
        return None

    def _calculate_metrics(
        self,
        initial_capital: float,
        final_equity: float,
        equity_curve: List[Dict],
        trades: List[Dict]
    ) -> Dict:
        """Calculate performance metrics"""
        # Total return
        total_return = ((final_equity - initial_capital) / initial_capital) * 100
        
        # Number of trades
        num_trades = len(trades)
        
        # Win rate
        if num_trades > 0:
            winning_trades = sum(1 for i in range(0, len(trades), 2) 
                               if i+1 < len(trades) and trades[i+1]["total"] > trades[i]["total"])
            win_rate = (winning_trades / (num_trades / 2)) * 100 if num_trades >= 2 else 0
        else:
            win_rate = 0
        
        # Max drawdown
        equity_values = [e["equity"] for e in equity_curve]
        peak = equity_values[0]
        max_drawdown = 0
        
        for equity in equity_values:
            if equity > peak:
                peak = equity
            drawdown = ((peak - equity) / peak) * 100
            if drawdown > max_drawdown:
                max_drawdown = drawdown
        
        # Sharpe ratio (simplified)
        returns = np.diff(equity_values) / equity_values[:-1]
        if len(returns) > 0 and np.std(returns) > 0:
            sharpe_ratio = (np.mean(returns) / np.std(returns)) * np.sqrt(252)  # Annualized
        else:
            sharpe_ratio = 0
        
        return {
            "total_return_percent": round(total_return, 2),
            "num_trades": num_trades,
            "win_rate_percent": round(win_rate, 2),
            "max_drawdown_percent": round(max_drawdown, 2),
            "sharpe_ratio": round(sharpe_ratio, 2),
            "final_equity": round(final_equity, 2)
        }

# Singleton instance
backtest_engine = BacktestEngine()

