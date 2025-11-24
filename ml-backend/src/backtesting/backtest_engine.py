"""
Backtesting Engine for Prediction Model with Advanced Strategies
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
        prediction_engine,
        confidence_threshold: float = 0.70,
        kelly_fraction: float = 0.25
    ) -> Dict:
        """
        Run backtest simulation with specified strategy
        
        Args:
            symbol: Symbol to test
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            initial_capital: Starting capital
            strategy: Strategy type ("confidence_threshold", "kelly_criterion")
            prediction_engine: PredictionEngine instance
            confidence_threshold: Minimum confidence to enter trade (default 70%)
            kelly_fraction: Fraction of Kelly to use (default 25%)
        
        Returns:
            Backtest results with equity curve, trades, metrics
        """
        print(f"\n🔄 Running backtest for {symbol}...")
        print(f"   Strategy: {strategy}")
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
            prediction = self._mock_prediction()
            
            # Execute strategy
            if strategy == "confidence_threshold":
                trade = self._confidence_threshold_strategy(
                    portfolio=portfolio,
                    prediction=prediction,
                    price=price,
                    timestamp=timestamp,
                    threshold=confidence_threshold
                )
                if trade:
                    trades.append(trade)
            elif strategy == "kelly_criterion":
                trade = self._kelly_criterion_strategy(
                    portfolio=portfolio,
                    prediction=prediction,
                    price=price,
                    timestamp=timestamp,
                    kelly_fraction=kelly_fraction,
                    trades_history=trades
                )
                if trade:
                    trades.append(trade)
            
            # Update equity
            portfolio["equity"] = portfolio["cash"] + (portfolio["position"] * price)
            equity_curve.append({
                "timestamp": timestamp.isoformat() if hasattr(timestamp, 'isoformat') else str(timestamp),
                "equity": portfolio["equity"]
            })
        
        # Calculate metrics
        metrics = self._calculate_metrics(
            initial_capital=initial_capital,
            final_equity=portfolio["equity"],
            equity_curve=equity_curve,
            trades=trades,
            start_date=start_date,
            end_date=end_date
        )
        
        return {
            "success": True,
            "symbol": symbol,
            "strategy": strategy,
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
            "confidence": np.random.uniform(0.4, 0.95),
            "expected_move_percent": np.random.uniform(-2, 2)
        }

    def _confidence_threshold_strategy(
        self,
        portfolio: Dict,
        prediction: Dict,
        price: float,
        timestamp: datetime,
        threshold: float = 0.70
    ) -> Optional[Dict]:
        """
        Execute trades only when confidence exceeds threshold
        
        Strategy:
        - Only enter trades when confidence > threshold
        - Position size: 90% of available capital
        - Exit when confidence drops or direction changes
        """
        direction = prediction["direction"]
        confidence = prediction["confidence"]
        
        # Entry threshold check
        if confidence < threshold:
            # Exit existing position if confidence drops
            if portfolio["position"] > 0:
                shares = portfolio["position"]
                proceeds = shares * price
                portfolio["cash"] += proceeds
                portfolio["position"] = 0
                
                return {
                    "timestamp": timestamp.isoformat() if hasattr(timestamp, 'isoformat') else str(timestamp),
                    "type": "SELL",
                    "reason": "confidence_drop",
                    "shares": shares,
                    "price": price,
                    "total": proceeds,
                    "confidence": confidence
                }
            return None
        
        # Buy signal
        if direction == "bullish" and portfolio["position"] == 0 and portfolio["cash"] > 0:
            # Use 90% of cash
            cash_to_invest = portfolio["cash"] * 0.9
            shares = int(cash_to_invest / price)
            
            if shares > 0:
                cost = shares * price
                portfolio["cash"] -= cost
                portfolio["position"] = shares
                
                return {
                    "timestamp": timestamp.isoformat() if hasattr(timestamp, 'isoformat') else str(timestamp),
                    "type": "BUY",
                    "reason": "high_confidence",
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
                "timestamp": timestamp.isoformat() if hasattr(timestamp, 'isoformat') else str(timestamp),
                "type": "SELL",
                "reason": "bearish_signal",
                "shares": shares,
                "price": price,
                "total": proceeds,
                "confidence": confidence
            }
        
        return None

    def _kelly_criterion_strategy(
        self,
        portfolio: Dict,
        prediction: Dict,
        price: float,
        timestamp: datetime,
        kelly_fraction: float = 0.25,
        trades_history: List[Dict] = None
    ) -> Optional[Dict]:
        """
        Execute trades using Kelly Criterion for position sizing
        
        Kelly formula: f = (p * b - q) / b
        where:
        - p = win probability (from confidence)
        - q = 1 - p (loss probability)
        - b = win/loss ratio (from historical trades)
        
        Use fractional Kelly (e.g., 25%) for safety
        """
        direction = prediction["direction"]
        confidence = prediction["confidence"]
        
        # Calculate win/loss ratio from historical trades
        if trades_history and len(trades_history) >= 4:
            wins = []
            losses = []
            
            # Pair buy/sell trades
            for i in range(0, len(trades_history) - 1, 2):
                if i + 1 < len(trades_history):
                    buy_trade = trades_history[i] if trades_history[i]["type"] == "BUY" else trades_history[i+1]
                    sell_trade = trades_history[i+1] if trades_history[i+1]["type"] == "SELL" else trades_history[i]
                    
                    if buy_trade and sell_trade:
                        pnl = sell_trade["total"] - buy_trade["total"]
                        if pnl > 0:
                            wins.append(pnl)
                        else:
                            losses.append(abs(pnl))
            
            avg_win = np.mean(wins) if wins else 1.0
            avg_loss = np.mean(losses) if losses else 1.0
            win_loss_ratio = avg_win / avg_loss if avg_loss > 0 else 1.0
        else:
            # Default assumption
            win_loss_ratio = 1.5  # Assume 1.5:1 win/loss ratio
        
        # Kelly calculation
        p = confidence  # Win probability from model confidence
        q = 1 - p
        b = win_loss_ratio
        
        kelly_percentage = (p * b - q) / b if b > 0 else 0
        kelly_percentage = max(0, min(kelly_percentage, 1.0))  # Clamp between 0 and 1
        
        # Apply fractional Kelly for safety
        position_size = kelly_percentage * kelly_fraction
        
        # Don't trade if position size is too small
        if position_size < 0.05:  # Less than 5% position
            return None
        
        # Buy signal
        if direction == "bullish" and portfolio["position"] == 0 and portfolio["cash"] > 0:
            cash_to_invest = portfolio["cash"] * position_size
            shares = int(cash_to_invest / price)
            
            if shares > 0:
                cost = shares * price
                portfolio["cash"] -= cost
                portfolio["position"] = shares
                
                return {
                    "timestamp": timestamp.isoformat() if hasattr(timestamp, 'isoformat') else str(timestamp),
                    "type": "BUY",
                    "reason": "kelly_criterion",
                    "shares": shares,
                    "price": price,
                    "total": cost,
                    "confidence": confidence,
                    "kelly_percentage": round(kelly_percentage * 100, 2),
                    "position_size": round(position_size * 100, 2)
                }
        
        # Sell signal
        elif direction == "bearish" and portfolio["position"] > 0:
            shares = portfolio["position"]
            proceeds = shares * price
            portfolio["cash"] += proceeds
            portfolio["position"] = 0
            
            return {
                "timestamp": timestamp.isoformat() if hasattr(timestamp, 'isoformat') else str(timestamp),
                "type": "SELL",
                "reason": "bearish_signal",
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
        trades: List[Dict],
        start_date: str,
        end_date: str
    ) -> Dict:
        """Calculate comprehensive performance metrics"""
        # Total return
        total_return = ((final_equity - initial_capital) / initial_capital) * 100
        
        # Calculate number of days for annualized metrics
        try:
            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date)
            days = (end - start).days
            years = days / 365.25
        except:
            years = 1.0
        
        # Annualized return
        annualized_return = (((final_equity / initial_capital) ** (1 / years)) - 1) * 100 if years > 0 else 0
        
        # Number of trades
        num_trades = len(trades)
        buy_trades = [t for t in trades if t["type"] == "BUY"]
        sell_trades = [t for t in trades if t["type"] == "SELL"]
        
        # Win rate and profit factor
        if len(buy_trades) > 0 and len(sell_trades) > 0:
            wins = []
            losses = []
            
            for i, buy in enumerate(buy_trades):
                if i < len(sell_trades):
                    sell = sell_trades[i]
                    pnl = sell["total"] - buy["total"]
                    if pnl > 0:
                        wins.append(pnl)
                    else:
                        losses.append(abs(pnl))
            
            win_rate = (len(wins) / len(buy_trades)) * 100 if buy_trades else 0
            total_wins = sum(wins)
            total_losses = sum(losses)
            profit_factor = total_wins / total_losses if total_losses > 0 else 0
            avg_win = np.mean(wins) if wins else 0
            avg_loss = np.mean(losses) if losses else 0
        else:
            win_rate = 0
            profit_factor = 0
            avg_win = 0
            avg_loss = 0
        
        # Max drawdown and recovery
        equity_values = [e["equity"] for e in equity_curve]
        peak = equity_values[0]
        max_drawdown = 0
        drawdown_start = 0
        drawdown_end = 0
        in_drawdown = False
        
        for idx, equity in enumerate(equity_values):
            if equity > peak:
                peak = equity
                if in_drawdown:
                    drawdown_end = idx
                    in_drawdown = False
            drawdown = ((peak - equity) / peak) * 100
            if drawdown > max_drawdown:
                max_drawdown = drawdown
                if not in_drawdown:
                    drawdown_start = idx
                    in_drawdown = True
        
        recovery_time = drawdown_end - drawdown_start if drawdown_end > drawdown_start else 0
        
        # Sharpe ratio
        returns = np.diff(equity_values) / equity_values[:-1]
        if len(returns) > 0 and np.std(returns) > 0:
            sharpe_ratio = (np.mean(returns) / np.std(returns)) * np.sqrt(252 * 24)  # Hourly data
        else:
            sharpe_ratio = 0
        
        # Sortino ratio (uses only downside deviation)
        downside_returns = returns[returns < 0]
        if len(downside_returns) > 0 and np.std(downside_returns) > 0:
            sortino_ratio = (np.mean(returns) / np.std(downside_returns)) * np.sqrt(252 * 24)
        else:
            sortino_ratio = 0
        
        # Average trade duration
        if len(buy_trades) > 0 and len(sell_trades) > 0:
            durations = []
            for i, buy in enumerate(buy_trades):
                if i < len(sell_trades):
                    sell = sell_trades[i]
                    try:
                        buy_time = datetime.fromisoformat(buy["timestamp"]) if isinstance(buy["timestamp"], str) else buy["timestamp"]
                        sell_time = datetime.fromisoformat(sell["timestamp"]) if isinstance(sell["timestamp"], str) else sell["timestamp"]
                        duration = (sell_time - buy_time).total_seconds() / 3600  # hours
                        durations.append(duration)
                    except:
                        pass
            avg_trade_duration = np.mean(durations) if durations else 0
        else:
            avg_trade_duration = 0
        
        return {
            "total_return_percent": round(total_return, 2),
            "annualized_return_percent": round(annualized_return, 2),
            "num_trades": num_trades,
            "win_rate_percent": round(win_rate, 2),
            "profit_factor": round(profit_factor, 2),
            "avg_win": round(avg_win, 2),
            "avg_loss": round(avg_loss, 2),
            "max_drawdown_percent": round(max_drawdown, 2),
            "recovery_time_bars": recovery_time,
            "sharpe_ratio": round(sharpe_ratio, 2),
            "sortino_ratio": round(sortino_ratio, 2),
            "avg_trade_duration_hours": round(avg_trade_duration, 2),
            "final_equity": round(final_equity, 2)
        }

    async def compare_strategies(
        self,
        symbol: str,
        start_date: str,
        end_date: str,
        initial_capital: float,
        confidence_threshold: float = 0.70,
        kelly_fraction: float = 0.25,
        prediction_engine = None
    ) -> Dict:
        """
        Run both strategies and compare results
        
        Returns:
            Comparison of both strategies with detailed metrics
        """
        # Run confidence threshold strategy
        confidence_results = await self.run_backtest(
            symbol=symbol,
            start_date=start_date,
            end_date=end_date,
            initial_capital=initial_capital,
            strategy="confidence_threshold",
            prediction_engine=prediction_engine,
            confidence_threshold=confidence_threshold
        )
        
        # Run Kelly criterion strategy
        kelly_results = await self.run_backtest(
            symbol=symbol,
            start_date=start_date,
            end_date=end_date,
            initial_capital=initial_capital,
            strategy="kelly_criterion",
            prediction_engine=prediction_engine,
            kelly_fraction=kelly_fraction
        )
        
        return {
            "success": True,
            "symbol": symbol,
            "period": {"start": start_date, "end": end_date},
            "initial_capital": initial_capital,
            "confidence_threshold": {
                "strategy": "confidence_threshold",
                "parameters": {"threshold": confidence_threshold},
                "results": confidence_results
            },
            "kelly_criterion": {
                "strategy": "kelly_criterion",
                "parameters": {"kelly_fraction": kelly_fraction},
                "results": kelly_results
            },
            "comparison": self._compare_metrics(
                confidence_results["metrics"],
                kelly_results["metrics"]
            )
        }

    def _compare_metrics(self, metrics1: Dict, metrics2: Dict) -> Dict:
        """Compare metrics between two strategies"""
        comparison = {}
        for key in metrics1.keys():
            if isinstance(metrics1[key], (int, float)) and isinstance(metrics2[key], (int, float)):
                diff = metrics2[key] - metrics1[key]
                comparison[key] = {
                    "confidence_threshold": metrics1[key],
                    "kelly_criterion": metrics2[key],
                    "difference": round(diff, 2),
                    "better_strategy": "kelly_criterion" if diff > 0 else "confidence_threshold"
                }
        return comparison

# Singleton instance
backtest_engine = BacktestEngine()
