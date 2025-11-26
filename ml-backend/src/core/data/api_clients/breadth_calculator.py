"""
Market Breadth Calculator
Computes market internals from sector ETFs
Ported from multi_factor_model/multifactor/features/breadth.py
"""

import numpy as np
import pandas as pd


# Sector ETFs for breadth calculation
SECTOR_ETFS = [
    "XLB",   # Materials
    "XLC",   # Communication Services
    "XLE",   # Energy
    "XLF",   # Financials
    "XLI",   # Industrials
    "XLK",   # Technology
    "XLP",   # Consumer Staples
    "XLRE",  # Real Estate
    "XLU",   # Utilities
    "XLV",   # Health Care
    "XLY"    # Consumer Discretionary
]

# Additional indices for broader breadth
ADDITIONAL_INDICES = ["SPY", "QQQ", "IWM", "DIA"]


def safe_div(a: pd.Series, b: pd.Series) -> pd.Series:
    """Safe division handling zeros and NaN."""
    with np.errstate(divide='ignore', invalid='ignore'):
        result = a / b
    return result.replace([np.inf, -np.inf], np.nan)


def compute_breadth_indicators(
    close_wide: pd.DataFrame,
    volume_wide: pd.DataFrame
) -> pd.DataFrame:
    """
    Compute market breadth indicators from panel data.
    
    Args:
        close_wide: DataFrame with tickers as columns
        volume_wide: DataFrame with tickers as columns (aligned)
    
    Returns:
        DataFrame with breadth features:
        - breadth_pct_above_50: % tickers above 50-day MA
        - breadth_pct_above_200: % tickers above 200-day MA
        - breadth_ad_ratio: Advance/Decline ratio
        - breadth_udv_ratio: Up volume / Down volume ratio
        - breadth_nh_minus_nl: New highs - New lows
        - breadth_52w_high_pct: % at 52-week high
        - breadth_52w_low_pct: % at 52-week low
    """
    if close_wide.empty or volume_wide.empty:
        return pd.DataFrame()
    
    # Moving averages
    ma50 = close_wide.rolling(50).mean()
    ma200 = close_wide.rolling(200).mean()
    
    # Participation metrics
    pct_above_50 = (close_wide > ma50).mean(axis=1).rename("breadth_pct_above_50")
    pct_above_200 = (close_wide > ma200).mean(axis=1).rename("breadth_pct_above_200")
    
    # Advance/Decline
    daily_returns = close_wide.pct_change()
    advancing = (daily_returns > 0).sum(axis=1)
    declining = (daily_returns <= 0).sum(axis=1)
    ad_ratio = safe_div(advancing, declining).rename("breadth_ad_ratio")
    
    # Up/Down Volume
    up_volume = volume_wide.where(daily_returns > 0).sum(axis=1)
    down_volume = volume_wide.where(daily_returns <= 0).sum(axis=1)
    udv_ratio = safe_div(up_volume, down_volume).rename("breadth_udv_ratio")
    
    # New Highs/Lows (52-week)
    rolling_252_max = close_wide.rolling(252).max()
    rolling_252_min = close_wide.rolling(252).min()
    
    new_highs = (close_wide >= rolling_252_max).sum(axis=1)
    new_lows = (close_wide <= rolling_252_min).sum(axis=1)
    
    nh_minus_nl = (new_highs - new_lows).rename("breadth_nh_minus_nl")
    pct_52w_high = (new_highs / len(close_wide.columns)).rename("breadth_52w_high_pct")
    pct_52w_low = (new_lows / len(close_wide.columns)).rename("breadth_52w_low_pct")
    
    # Combine all features
    breadth_df = pd.concat([
        pct_above_50,
        pct_above_200,
        ad_ratio,
        udv_ratio,
        nh_minus_nl,
        pct_52w_high,
        pct_52w_low
    ], axis=1)
    
    return breadth_df


def compute_breadth_momentum(breadth_df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute momentum features from breadth indicators.
    
    Args:
        breadth_df: Output from compute_breadth_indicators
    
    Returns:
        DataFrame with additional momentum features
    """
    if breadth_df.empty:
        return pd.DataFrame()
    
    result = breadth_df.copy()
    
    # Rate of change in participation
    if "breadth_pct_above_50" in breadth_df.columns:
        result["breadth_pct_above_50_chg10"] = breadth_df["breadth_pct_above_50"].diff(10)
        result["breadth_pct_above_50_chg20"] = breadth_df["breadth_pct_above_50"].diff(20)
    
    # AD line (cumulative sum)
    if "breadth_ad_ratio" in breadth_df.columns:
        # Create an AD line: +1 if more advancers, -1 if more decliners
        ad_signal = breadth_df["breadth_ad_ratio"].apply(lambda x: 1 if x > 1 else (-1 if x < 1 else 0))
        result["breadth_ad_cumsum"] = ad_signal.cumsum()
    
    # Breadth momentum (how fast breadth is improving/deteriorating)
    if "breadth_pct_above_50" in breadth_df.columns and "breadth_pct_above_200" in breadth_df.columns:
        breadth_avg = (breadth_df["breadth_pct_above_50"] + breadth_df["breadth_pct_above_200"]) / 2
        result["breadth_momentum"] = breadth_avg.diff(10)
    
    return result


class BreadthCalculator:
    """
    Class wrapper for breadth calculation functions.
    Provides consistent interface with other API clients.
    """
    
    def __init__(self):
        self.sector_etfs = SECTOR_ETFS
        self.additional_indices = ADDITIONAL_INDICES
    
    def compute(
        self,
        close_wide: pd.DataFrame,
        volume_wide: pd.DataFrame,
        include_momentum: bool = True
    ) -> pd.DataFrame:
        """
        Compute breadth indicators from panel data.
        
        Args:
            close_wide: DataFrame with tickers as columns
            volume_wide: DataFrame with tickers as columns
            include_momentum: Whether to include momentum features
        
        Returns:
            DataFrame with breadth features
        """
        breadth_df = compute_breadth_indicators(close_wide, volume_wide)
        
        if include_momentum and not breadth_df.empty:
            breadth_df = compute_breadth_momentum(breadth_df)
        
        return breadth_df

