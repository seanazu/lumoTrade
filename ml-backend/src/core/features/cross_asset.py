"""
Cross-Asset Features Module
25+ features from VIX, DXY, commodities, bonds
Ported from multi_factor_model/multifactor/features/cross_asset.py
"""

import numpy as np
import pandas as pd
from typing import Dict


def build_cross_asset_features(
    idx: pd.DatetimeIndex,
    cross_data: Dict[str, pd.DataFrame]
) -> pd.DataFrame:
    """
    Build cross-asset features.
    
    Args:
        idx: Target DatetimeIndex
        cross_data: Dict mapping asset name to OHLCV DataFrame
            Keys: "vix", "vix3m", "dxy", "gold", "oil", "ust10y", "hy_bonds", "treasuries"
    
    Returns:
        DataFrame with 25+ cross-asset features
    """
    def get_close_price(df: pd.DataFrame, idx_dt: pd.DatetimeIndex) -> pd.Series:
        """Get close price, handling both 'Close' and 'close' column names, and reindex with timezone normalization."""
        if "Close" in df.columns:
            series = df["Close"]
        elif "close" in df.columns:
            series = df["close"]
        else:
            raise KeyError(f"No close price column found. Available columns: {df.columns.tolist()}")
        
        # Remove timezone if present to match idx_dt
        if isinstance(series.index, pd.DatetimeIndex) and series.index.tz is not None:
            series.index = series.index.tz_localize(None)
        
        return series.reindex(idx_dt, method="ffill")
    
    idx_dt = pd.DatetimeIndex(pd.to_datetime(idx)).tz_localize(None).normalize()
    out = pd.DataFrame(index=idx_dt)
    
    # === VIX Features (8) ===
    if "vix" in cross_data and not cross_data["vix"].empty:
        vix_df = cross_data["vix"]
        vix = get_close_price(vix_df, idx_dt)
        
        out["vix"] = vix
        out["vix_chg10"] = vix.pct_change(10) * 100
        out["vix_z_20d"] = (vix - vix.rolling(20).mean()) / (vix.rolling(20).std() + 1e-8)
        
        # VIX term structure
        if "vix3m" in cross_data and not cross_data["vix3m"].empty:
            vix3m = get_close_price(cross_data["vix3m"], idx_dt)
            vix_term = (vix3m / vix - 1.0).replace([np.inf, -np.inf], np.nan)
            out["vix_term"] = vix_term
            out["vix_term_z"] = (vix_term - vix_term.rolling(60).mean()) / (vix_term.rolling(60).std() + 1e-8)
        
        # VIX thresholds (regime indicators)
        out["vix_high"] = (vix > 20).astype(float)
        out["vix_extreme"] = (vix > 30).astype(float)
        out["vix_low"] = (vix < 15).astype(float)
    
    # === Dollar Index (4) ===
    if "dxy" in cross_data and not cross_data["dxy"].empty:
        dxy = get_close_price(cross_data["dxy"], idx_dt)
        
        out["dxy"] = dxy
        out["dxy_ret10"] = dxy.pct_change(10) * 100
        out["dxy_ret20"] = dxy.pct_change(20) * 100
        out["dxy_ma50"] = dxy.rolling(50).mean()
    
    # === Gold (4) ===
    if "gold" in cross_data and not cross_data["gold"].empty:
        gold = get_close_price(cross_data["gold"], idx_dt)
        
        out["gold"] = gold
        out["gold_ret10"] = gold.pct_change(10) * 100
        out["gold_ret20"] = gold.pct_change(20) * 100
        out["gold_ma50"] = gold.rolling(50).mean()
    
    # === Oil (4) ===
    if "oil" in cross_data and not cross_data["oil"].empty:
        oil = get_close_price(cross_data["oil"], idx_dt)
        
        out["oil"] = oil
        out["oil_ret10"] = oil.pct_change(10) * 100
        out["oil_ret20"] = oil.pct_change(20) * 100
        out["oil_volatility"] = oil.pct_change().rolling(20).std() * np.sqrt(252) * 100
    
    # === Treasuries (3) ===
    if "treasuries" in cross_data and not cross_data["treasuries"].empty:
        tlt = get_close_price(cross_data["treasuries"], idx_dt)
        
        out["treasury_ret10"] = tlt.pct_change(10) * 100
        out["treasury_ret20"] = tlt.pct_change(20) * 100
        out["treasury_trend"] = (tlt > tlt.rolling(50).mean()).astype(float)
    
    # === High Yield Bonds (2) ===
    if "hy_bonds" in cross_data and not cross_data["hy_bonds"].empty:
        hyg = get_close_price(cross_data["hy_bonds"], idx_dt)
        
        out["hy_ret10"] = hyg.pct_change(10) * 100
        out["hy_ret20"] = hyg.pct_change(20) * 100
    
    return out

