"""
Market Breadth Features Module
20+ features from market internals
"""

import numpy as np
import pandas as pd


def build_breadth_features(breadth_df: pd.DataFrame) -> pd.DataFrame:
    """
    Build breadth features from market internals.
    
    Args:
        breadth_df: Output from compute_breadth_indicators
    
    Returns:
        DataFrame with 20 breadth features
    """
    if breadth_df.empty:
        return pd.DataFrame()
    
    out = breadth_df.copy()
    
    # Add momentum and trend features
    if "breadth_pct_above_50" in out.columns:
        pct50 = out["breadth_pct_above_50"]
        
        # Rate of change
        out["breadth_pct_above_50_chg5"] = pct50.diff(5)
        out["breadth_pct_above_50_chg10"] = pct50.diff(10)
        out["breadth_pct_above_50_chg20"] = pct50.diff(20)
        
        # Threshold indicators
        out["breadth_strong"] = (pct50 > 0.70).astype(float)
        out["breadth_weak"] = (pct50 < 0.30).astype(float)
    
    if "breadth_pct_above_200" in out.columns:
        pct200 = out["breadth_pct_above_200"]
        
        # Rate of change
        out["breadth_pct_above_200_chg10"] = pct200.diff(10)
        out["breadth_pct_above_200_chg20"] = pct200.diff(20)
        
        # Long-term health
        out["breadth_bullish"] = (pct200 > 0.60).astype(float)
        out["breadth_bearish"] = (pct200 < 0.40).astype(float)
    
    if "breadth_ad_ratio" in out.columns:
        ad = out["breadth_ad_ratio"]
        
        # AD momentum
        out["breadth_ad_ema10"] = ad.ewm(span=10).mean()
        out["breadth_ad_ema20"] = ad.ewm(span=20).mean()
        
        # Cumulative AD line
        ad_signal = ad.apply(lambda x: 1 if x > 1.0 else (-1 if x < 1.0 else 0))
        out["breadth_ad_cumsum"] = ad_signal.cumsum()
    
    if "breadth_nh_minus_nl" in out.columns:
        nh_nl = out["breadth_nh_minus_nl"]
        
        # Smoothed
        out["breadth_nh_nl_ema20"] = nh_nl.ewm(span=20).mean()
        
        # Extreme readings
        out["breadth_new_highs_surge"] = (nh_nl > nh_nl.rolling(60).quantile(0.90)).astype(float)
        out["breadth_new_lows_surge"] = (nh_nl < nh_nl.rolling(60).quantile(0.10)).astype(float)
    
    return out

