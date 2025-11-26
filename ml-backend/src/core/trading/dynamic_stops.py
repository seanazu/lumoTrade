"""
Dynamic ATR-Based Stop-Loss Module
Volatility-adjusted risk management for better returns
"""

import pandas as pd
import numpy as np
from typing import Tuple


def calculate_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    """
    Calculate Average True Range (ATR)
    
    Args:
        high: High prices
        low: Low prices
        close: Close prices
        period: ATR period (default 14)
    
    Returns:
        ATR series
    """
    # True Range components
    tr1 = high - low
    tr2 = abs(high - close.shift(1))
    tr3 = abs(low - close.shift(1))
    
    # True Range = max of the three
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    
    # ATR = EMA of True Range
    atr = tr.ewm(span=period, adjust=False).mean()
    
    return atr


def calculate_dynamic_stops(
    close: pd.Series,
    high: pd.Series,
    low: pd.Series,
    direction: pd.Series,  # 1 for long, -1 for short
    atr_multiplier: float = 2.0,
    min_stop_pct: float = 0.015,  # Minimum 1.5% stop
    max_stop_pct: float = 0.04,   # Maximum 4% stop
    atr_period: int = 14
) -> Tuple[pd.Series, pd.Series]:
    """
    Calculate dynamic ATR-based stop-loss and take-profit levels
    
    Args:
        close: Close prices
        high: High prices  
        low: Low prices
        direction: Trade direction (1=long, -1=short)
        atr_multiplier: ATR multiplier for stops (default 2.0)
        min_stop_pct: Minimum stop as % of price
        max_stop_pct: Maximum stop as % of price
        atr_period: ATR calculation period
    
    Returns:
        (stop_loss_pct, take_profit_pct) as Series
    """
    # Calculate ATR
    atr = calculate_atr(high, low, close, period=atr_period)
    
    # ATR as percentage of price
    atr_pct = atr / close
    
    # Dynamic stop = ATR * multiplier, capped between min and max
    stop_loss_pct = (atr_pct * atr_multiplier).clip(lower=min_stop_pct, upper=max_stop_pct)
    
    # Take profit = 3x stop loss (maintain 3:1 reward:risk minimum)
    # But increase to 6x for low volatility (tight stops deserve big targets)
    vol_regime = atr_pct / atr_pct.rolling(60).mean()  # Relative volatility
    risk_reward_ratio = np.where(
        vol_regime < 0.8,  # Low vol regime
        6.0,  # Aggressive 6:1 R:R
        np.where(
            vol_regime > 1.5,  # High vol regime
            3.0,  # Conservative 3:1 R:R
            4.5   # Normal regime 4.5:1 R:R
        )
    )
    
    take_profit_pct = stop_loss_pct * risk_reward_ratio
    
    # Cap take profit at reasonable levels
    take_profit_pct = take_profit_pct.clip(upper=0.25)  # Max 25% target
    
    return stop_loss_pct, take_profit_pct


def apply_trailing_stop(
    entry_price: float,
    current_price: float,
    highest_price: float,  # Highest price since entry
    direction: int,  # 1 for long, -1 for short
    trailing_pct: float = 0.05  # Trail by 5%
) -> float:
    """
    Apply trailing stop logic
    
    Args:
        entry_price: Entry price
        current_price: Current price
        highest_price: Highest price since entry (for longs) or lowest (for shorts)
        direction: 1 for long, -1 for short
        trailing_pct: Trailing percentage
    
    Returns:
        Stop loss price
    """
    if direction == 1:  # Long position
        # Profit since entry
        profit = (highest_price - entry_price) / entry_price
        
        if profit > trailing_pct:
            # Trail the stop below highest price
            trailing_stop = highest_price * (1 - trailing_pct)
            # But never below entry (protect against losses)
            return max(trailing_stop, entry_price * 1.01)  # At least 1% profit locked
        else:
            # Normal stop at entry level
            return entry_price * 0.98  # 2% below entry
    
    else:  # Short position
        # Profit since entry  
        profit = (entry_price - highest_price) / entry_price  # highest = lowest for shorts
        
        if profit > trailing_pct:
            # Trail the stop above lowest price
            trailing_stop = highest_price * (1 + trailing_pct)
            # But never above entry
            return min(trailing_stop, entry_price * 0.99)  # At least 1% profit locked
        else:
            # Normal stop at entry level
            return entry_price * 1.02  # 2% above entry
    
    return entry_price  # Fallback


def get_volatility_adjusted_position_size(
    base_position_size: float,
    current_volatility: float,
    average_volatility: float,
    min_position: float = 0.3,
    max_position: float = 0.9
) -> float:
    """
    Adjust position size based on volatility
    Lower vol = larger position, Higher vol = smaller position
    
    Args:
        base_position_size: Base position size (e.g., 0.6)
        current_volatility: Current market volatility
        average_volatility: Average historical volatility
        min_position: Minimum position size
        max_position: Maximum position size
    
    Returns:
        Adjusted position size
    """
    # Volatility ratio (1.0 = normal, >1 = high vol, <1 = low vol)
    vol_ratio = current_volatility / (average_volatility + 1e-10)
    
    # Inverse scaling: lower vol = bigger position
    if vol_ratio < 0.8:  # Low volatility
        adjusted_size = base_position_size * 1.3  # 30% larger
    elif vol_ratio > 1.5:  # High volatility
        adjusted_size = base_position_size * 0.7  # 30% smaller
    else:  # Normal volatility
        adjusted_size = base_position_size
    
    # Clip to min/max
    return np.clip(adjusted_size, min_position, max_position)

