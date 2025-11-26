"""
Advanced Predictive Features for Market Direction
High-impact features based on market research and proven strategies
"""

import pandas as pd
import numpy as np
from typing import Dict


def add_order_flow_features(df: pd.DataFrame, close_col: str = 'close', volume_col: str = 'volume', 
                            high_col: str = 'high', low_col: str = 'low') -> pd.DataFrame:
    """
    Add order flow imbalance features
    These capture buying vs selling pressure
    """
    # Price * Volume = Money flow
    df['money_flow'] = df[close_col] * df[volume_col]
    
    # Positive vs Negative money flow
    typical_price = (df[high_col] + df[low_col] + df[close_col]) / 3
    df['raw_money_flow'] = typical_price * df[volume_col]
    
    # Money Flow Index (MFI) - like RSI but with volume
    positive_flow = df['raw_money_flow'].where(df[close_col] > df[close_col].shift(1), 0)
    negative_flow = df['raw_money_flow'].where(df[close_col] < df[close_col].shift(1), 0)
    
    money_ratio = positive_flow.rolling(14).sum() / (negative_flow.rolling(14).sum() + 1e-10)
    df['mfi'] = 100 - (100 / (1 + money_ratio))
    
    # Order flow imbalance (buying pressure)
    df['buy_pressure'] = positive_flow.rolling(14).sum() / (df['raw_money_flow'].rolling(14).sum() + 1e-10)
    
    # Volume-weighted price momentum
    df['vwap_momentum'] = (df[close_col] - df['money_flow'].rolling(20).sum() / df[volume_col].rolling(20).sum()) / df[close_col]
    
    return df


def add_gamma_exposure_features(df: pd.DataFrame, close_col: str = 'close') -> pd.DataFrame:
    """
    Proxy features for options gamma exposure
    Market makers hedge gamma which can drive price action
    """
    # Gamma is highest near major strikes - use round numbers
    df['dist_to_round_10'] = (df[close_col] % 10) / 10  # Distance to nearest $10
    df['dist_to_round_5'] = (df[close_col] % 5) / 5    # Distance to nearest $5
    
    # Volatility clustering (high vol = high gamma)
    returns = df[close_col].pct_change()
    df['vol_5d'] = returns.rolling(5).std()
    df['vol_20d'] = returns.rolling(20).std()
    df['vol_ratio'] = df['vol_5d'] / (df['vol_20d'] + 1e-10)  # Clustering indicator
    
    # Intraday range (proxy for gamma scalping)
    if 'high' in df.columns and 'low' in df.columns:
        df['intraday_range_pct'] = (df['high'] - df['low']) / df[close_col]
        df['range_expansion'] = df['intraday_range_pct'] / df['intraday_range_pct'].rolling(20).mean()
    
    return df


def add_market_maker_positioning(df: pd.DataFrame, close_col: str = 'close', 
                                 volume_col: str = 'volume') -> pd.DataFrame:
    """
    Features that indicate market maker positioning and hedging
    """
    # VWAP deviation (MM hedging reference)
    typical_price = df[close_col]
    cumsum_vol = df[volume_col].rolling(20).sum()
    cumsum_price_vol = (typical_price * df[volume_col]).rolling(20).sum()
    vwap = cumsum_price_vol / (cumsum_vol + 1e-10)
    df['vwap_deviation'] = (df[close_col] - vwap) / vwap
    
    # Volume acceleration (sudden MM hedging)
    df['volume_accel'] = df[volume_col].pct_change(5)
    df['volume_surge'] = (df[volume_col] > df[volume_col].rolling(20).mean() * 1.5).astype(int)
    
    # Price pinning (options expiry effect)
    df['price_stability'] = df[close_col].rolling(5).std() / (df[close_col].rolling(20).std() + 1e-10)
    
    return df


def add_momentum_divergence(df: pd.DataFrame, close_col: str = 'close', 
                            volume_col: str = 'volume') -> pd.DataFrame:
    """
    Momentum and divergence features
    """
    returns = df[close_col].pct_change()
    
    # Momentum strength
    df['momentum_3d'] = returns.rolling(3).sum()
    df['momentum_7d'] = returns.rolling(7).sum()
    df['momentum_strength'] = df['momentum_3d'] / (df['momentum_7d'].abs() + 1e-10)
    
    # Price-volume divergence (strong signal)
    df['price_chg'] = df[close_col].pct_change(5)
    df['volume_chg'] = df[volume_col].pct_change(5)
    df['pv_divergence'] = np.sign(df['price_chg']) * np.sign(df['volume_chg'])  # -1 = divergence
    
    # Trend strength
    df['trend_strength'] = (df[close_col] - df[close_col].rolling(20).mean()) / df[close_col].rolling(20).std()
    
    # Acceleration
    df['momentum_accel'] = df['momentum_7d'] - df['momentum_7d'].shift(7)
    
    return df


def add_volatility_regime_features(df: pd.DataFrame, close_col: str = 'close') -> pd.DataFrame:
    """
    Volatility regime features (crucial for risk management)
    """
    returns = df[close_col].pct_change()
    
    # Multiple vol horizons
    df['realized_vol_5'] = returns.rolling(5).std() * np.sqrt(252)
    df['realized_vol_20'] = returns.rolling(20).std() * np.sqrt(252)
    df['realized_vol_60'] = returns.rolling(60).std() * np.sqrt(252)
    
    # Vol regime changes
    df['vol_regime_change'] = (df['realized_vol_5'] > df['realized_vol_20']).astype(int)
    df['vol_expanding'] = (df['realized_vol_20'] > df['realized_vol_60']).astype(int)
    
    # Parkinson's volatility (high-low range based)
    if 'high' in df.columns and 'low' in df.columns:
        df['parkinson_vol'] = np.sqrt((np.log(df['high'] / df['low']) ** 2) / (4 * np.log(2)))
        df['parkinson_vol_ma'] = df['parkinson_vol'].rolling(20).mean()
    
    return df


def add_relative_strength_features(df: pd.DataFrame, close_col: str = 'close') -> pd.DataFrame:
    """
    Relative strength and rank features
    """
    returns = df[close_col].pct_change()
    
    # Rate of change at multiple horizons
    df['roc_3'] = df[close_col].pct_change(3)
    df['roc_7'] = df[close_col].pct_change(7)
    df['roc_14'] = df[close_col].pct_change(14)
    df['roc_30'] = df[close_col].pct_change(30)
    
    # Percentile rank (where is price vs recent history)
    df['price_rank_20'] = df[close_col].rolling(20).apply(lambda x: (x.iloc[-1] > x).sum() / len(x))
    df['price_rank_60'] = df[close_col].rolling(60).apply(lambda x: (x.iloc[-1] > x).sum() / len(x))
    
    # Consecutive up/down days
    df['consecutive_up'] = (returns > 0).astype(int).groupby((returns <= 0).cumsum()).cumsum()
    df['consecutive_down'] = (returns < 0).astype(int).groupby((returns >= 0).cumsum()).cumsum()
    
    return df


def add_advanced_technical_features(df: pd.DataFrame, close_col: str = 'close', 
                                   high_col: str = 'high', low_col: str = 'low') -> pd.DataFrame:
    """
    Advanced technical indicators
    """
    # Donchian Channel (breakout indicator)
    df['donchian_high'] = df[high_col].rolling(20).max()
    df['donchian_low'] = df[low_col].rolling(20).min()
    df['donchian_position'] = (df[close_col] - df['donchian_low']) / (df['donchian_high'] - df['donchian_low'] + 1e-10)
    
    # Keltner Channel
    typical_price = (df[high_col] + df[low_col] + df[close_col]) / 3
    atr = (df[high_col] - df[low_col]).rolling(20).mean()
    ema_20 = df[close_col].ewm(span=20).mean()
    df['keltner_upper'] = ema_20 + 2 * atr
    df['keltner_lower'] = ema_20 - 2 * atr
    df['keltner_position'] = (df[close_col] - df['keltner_lower']) / (df['keltner_upper'] - df['keltner_lower'] + 1e-10)
    
    # Commodity Channel Index (CCI)
    tp = typical_price
    tp_ma = tp.rolling(20).mean()
    mean_deviation = (tp - tp_ma).abs().rolling(20).mean()
    df['cci'] = (tp - tp_ma) / (0.015 * mean_deviation + 1e-10)
    
    return df


def generate_all_advanced_features(df: pd.DataFrame, 
                                   close_col: str = 'close',
                                   high_col: str = 'high', 
                                   low_col: str = 'low',
                                   volume_col: str = 'volume') -> pd.DataFrame:
    """
    Generate all advanced predictive features
    
    Returns:
        DataFrame with ~30 new powerful features added
    """
    df = df.copy()
    
    # Add all feature sets
    df = add_order_flow_features(df, close_col, volume_col, high_col, low_col)
    df = add_gamma_exposure_features(df, close_col)
    df = add_market_maker_positioning(df, close_col, volume_col)
    df = add_momentum_divergence(df, close_col, volume_col)
    df = add_volatility_regime_features(df, close_col)
    df = add_relative_strength_features(df, close_col)
    df = add_advanced_technical_features(df, close_col, high_col, low_col)
    
    # Fill NaNs
    df = df.ffill().bfill()
    
    return df


def get_advanced_feature_names() -> list:
    """
    Get list of advanced feature names
    """
    return [
        # Order flow (5)
        'mfi', 'buy_pressure', 'vwap_momentum', 'money_flow', 'raw_money_flow',
        
        # Gamma exposure (5)
        'dist_to_round_10', 'dist_to_round_5', 'vol_ratio', 'intraday_range_pct', 'range_expansion',
        
        # Market maker (4)
        'vwap_deviation', 'volume_accel', 'volume_surge', 'price_stability',
        
        # Momentum divergence (5)
        'momentum_3d', 'momentum_7d', 'momentum_strength', 'pv_divergence', 'momentum_accel',
        
        # Volatility regime (6)
        'realized_vol_5', 'realized_vol_20', 'realized_vol_60', 'vol_regime_change', 
        'vol_expanding', 'parkinson_vol_ma',
        
        # Relative strength (7)
        'roc_3', 'roc_7', 'roc_14', 'roc_30', 'price_rank_20', 'price_rank_60', 
        'consecutive_up', 'consecutive_down',
        
        # Advanced technical (6)
        'donchian_position', 'keltner_position', 'cci', 'donchian_high', 'donchian_low',
        'keltner_upper', 'keltner_lower'
    ]

