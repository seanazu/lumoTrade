"""
Advanced Backtest Engine
Production-grade backtesting with realistic constraints
Ported from multi_factor_model/multifactor/backtest.py
"""

from typing import Dict, Optional
from pathlib import Path

import numpy as np
import pandas as pd

from .position_sizer import size_position_vol_targeted, size_position_gate_mode


class AdvancedBacktestEngine:
    """
    Production-grade backtesting with realistic constraints.
    
    Features:
    - Transaction costs (realistic bid-ask + slippage)
    - Emergency stops (ATR-based)
    - Rebalancing logic
    - Equity curve tracking
    - Comprehensive metrics
    """
    
    def __init__(
        self,
        tc_bps: float = 2.0,
        vol_target_annual: float = 0.15,
        rebalance_every: int = 5,
        wmax: float = 1.0,
        emergency_stop_atr_mult: float = 2.5
    ):
        """
        Initialize backtest engine.
        
        Args:
            tc_bps: Transaction cost in basis points (default: 2.0 = 0.02%)
            vol_target_annual: Target annual volatility (default: 0.15 = 15%)
            rebalance_every: Rebalance frequency in bars (default: 5)
            wmax: Maximum leverage (default: 1.0 = no leverage)
            emergency_stop_atr_mult: ATR multiplier for emergency stops (default: 2.5)
        """
        self.tc_bps = tc_bps
        self.vol_target_annual = vol_target_annual
        self.rebalance_every = rebalance_every
        self.wmax = wmax
        self.emergency_stop_atr_mult = emergency_stop_atr_mult
    
    def run_backtest(
        self,
        predictions: pd.DataFrame,
        prices: pd.DataFrame,
        mode: str = "vol_targeted",
        verbose: bool = True
    ) -> pd.DataFrame:
        """
        Run backtest simulation.
        
        Args:
            predictions: DataFrame with columns [date, p10, p50, p90, prob_up]
            prices: Historical OHLCV DataFrame
            mode: Position sizing mode ("vol_targeted" or "gate")
            verbose: Print progress
        
        Returns:
            DataFrame with columns [date, position, daily_ret_%, pnl, turnover, tc, equity]
        """
        if verbose:
            print(f"[Backtest] Starting simulation...")
            print(f"  Mode: {mode}")
            print(f"  Transaction cost: {self.tc_bps} bps")
            print(f"  Rebalance frequency: {self.rebalance_every} bars")
        
        # Align predictions with prices
        preds = predictions.copy()
        if not isinstance(preds.index, pd.DatetimeIndex):
            if "date" in preds.columns:
                preds = preds.set_index("date")
        
        preds.index = pd.to_datetime(preds.index)
        prices.index = pd.to_datetime(prices.index)
        
        # Get common dates
        common_dates = preds.index.intersection(prices.index)
        preds = preds.loc[common_dates].sort_index()
        prices = prices.loc[common_dates].sort_index()
        
        if len(preds) == 0:
            raise ValueError("No overlapping dates between predictions and prices")
        
        # Calculate returns
        close = prices["Close"]
        daily_returns = close.pct_change()
        
        # Calculate ATR for stops
        high = prices["High"]
        low = prices["Low"]
        tr1 = high - low
        tr2 = (high - close.shift(1)).abs()
        tr3 = (low - close.shift(1)).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.rolling(14).mean()
        atr_norm = atr / close
        
        # Calculate realized volatility (20-day rolling)
        realized_vol = daily_returns.rolling(20).std() * np.sqrt(252)
        realized_vol = realized_vol.fillna(realized_vol.mean())
        
        # Initialize tracking arrays
        positions = []
        pnls = []
        turnovers = []
        tcs = []
        equities = [1.0]
        
        current_position = 0.0
        bar_count = 0
        
        for i, date in enumerate(preds.index):
            bar_count += 1
            
            # Get prediction for this date
            pred_row = preds.loc[date]
            p10 = pred_row.get("p10", np.nan)
            p50 = pred_row.get("p50", np.nan)
            p90 = pred_row.get("p90", np.nan)
            prob_up = pred_row.get("prob_up", 0.5)
            
            # Check for emergency stop
            if i > 0:
                ret = daily_returns.iloc[i]
                atr_val = atr_norm.iloc[i]
                
                if not np.isnan(atr_val):
                    # Long position: stop if return < -2.5 × ATR
                    if current_position > 0 and ret < -self.emergency_stop_atr_mult * atr_val:
                        if verbose and i < 10:
                            print(f"  Emergency stop (long): {date.date()}, ret={ret:.3%}, threshold={-self.emergency_stop_atr_mult * atr_val:.3%}")
                        current_position = 0.0
                    
                    # Short position: stop if return > +2.5 × ATR
                    elif current_position < 0 and ret > self.emergency_stop_atr_mult * atr_val:
                        if verbose and i < 10:
                            print(f"  Emergency stop (short): {date.date()}, ret={ret:.3%}, threshold={self.emergency_stop_atr_mult * atr_val:.3%}")
                        current_position = 0.0
            
            # Rebalance check
            if bar_count % self.rebalance_every == 0:
                # Calculate new position
                if mode == "vol_targeted" and not (np.isnan(p10) or np.isnan(p50) or np.isnan(p90)):
                    new_position = size_position_vol_targeted(
                        pred_p10=p10,
                        pred_p50=p50,
                        pred_p90=p90,
                        realized_vol=realized_vol.iloc[i],
                        vol_target_annual=self.vol_target_annual,
                        wmax=self.wmax
                    )
                elif mode == "gate" and not np.isnan(p50):
                    new_position = size_position_gate_mode(
                        pred_p50=p50,
                        prob_up=prob_up
                    )
                else:
                    new_position = 0.0
                
                # Calculate turnover
                turnover = abs(new_position - current_position)
                
                # Calculate transaction cost
                tc = turnover * (self.tc_bps / 10000.0)
                
                current_position = new_position
            else:
                turnover = 0.0
                tc = 0.0
            
            # Calculate P&L
            if i > 0:
                ret = daily_returns.iloc[i]
                pnl = current_position * ret - tc
            else:
                ret = 0.0
                pnl = -tc  # Only cost on first bar if rebalancing
            
            # Update equity
            new_equity = equities[-1] * (1 + pnl)
            equities.append(new_equity)
            
            # Store
            positions.append(current_position)
            pnls.append(pnl)
            turnovers.append(turnover)
            tcs.append(tc)
        
        # Create results DataFrame
        results = pd.DataFrame({
            "date": preds.index,
            "position": positions,
            "daily_ret_%": daily_returns.loc[preds.index].values * 100,
            "pnl": pnls,
            "turnover": turnovers,
            "tc": tcs,
            "equity": equities[1:]  # Skip initial 1.0
        }).set_index("date")
        
        if verbose:
            metrics = self.calculate_metrics(results)
            print(f"\n[Backtest] Complete:")
            print(f"  Total bars: {len(results)}")
            print(f"  Total trades: {sum(results['turnover'] > 0)}")
            print(f"  CAGR: {metrics['cagr']:.1%}")
            print(f"  Sharpe: {metrics['sharpe_ratio']:.2f}")
            print(f"  Max DD: {metrics['max_drawdown']:.1%}")
            print(f"  Win Rate: {metrics['win_rate']:.1%}")
        
        return results
    
    def calculate_metrics(self, equity_df: pd.DataFrame) -> Dict:
        """
        Calculate performance metrics.
        
        Args:
            equity_df: Backtest results DataFrame
        
        Returns:
            Dict with performance metrics
        """
        equity = equity_df["equity"]
        pnl = equity_df["pnl"]
        
        # Time period
        days = (equity_df.index[-1] - equity_df.index[0]).days
        years = days / 365.25
        
        # CAGR
        total_return = (equity.iloc[-1] / equity.iloc[0]) - 1
        cagr = (1 + total_return) ** (1 / years) - 1 if years > 0 else 0
        
        # Sharpe Ratio
        daily_rets = pnl
        sharpe = (daily_rets.mean() / daily_rets.std()) * np.sqrt(252) if daily_rets.std() > 0 else 0
        
        # Sortino Ratio (downside deviation)
        downside_rets = daily_rets[daily_rets < 0]
        sortino = (daily_rets.mean() / downside_rets.std()) * np.sqrt(252) if len(downside_rets) > 0 and downside_rets.std() > 0 else 0
        
        # Max Drawdown
        cummax = equity.cummax()
        drawdown = (equity - cummax) / cummax
        max_drawdown = drawdown.min()
        
        # Calmar Ratio
        calmar = cagr / abs(max_drawdown) if max_drawdown != 0 else 0
        
        # Win Rate
        winning_days = (pnl > 0).sum()
        total_days = len(pnl)
        win_rate = winning_days / total_days if total_days > 0 else 0
        
        # Profit Factor
        gross_profit = pnl[pnl > 0].sum()
        gross_loss = abs(pnl[pnl < 0].sum())
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0
        
        return {
            "cagr": cagr,
            "total_return": total_return,
            "sharpe_ratio": sharpe,
            "sortino_ratio": sortino,
            "max_drawdown": max_drawdown,
            "calmar_ratio": calmar,
            "win_rate": win_rate,
            "profit_factor": profit_factor,
            "total_trades": int((equity_df["turnover"] > 0).sum()),
            "avg_turnover": equity_df["turnover"].mean(),
            "total_tc": equity_df["tc"].sum(),
            "years": years
        }
    
    def save_results(self, results: pd.DataFrame, metrics: Dict, save_path: str):
        """Save backtest results and metrics."""
        save_dir = Path(save_path).parent
        save_dir.mkdir(parents=True, exist_ok=True)
        
        # Save equity curve
        results.to_parquet(f"{save_path}_equity.parquet")
        
        # Save metrics
        import json
        with open(f"{save_path}_metrics.json", "w") as f:
            json.dump(metrics, f, indent=2, default=str)

