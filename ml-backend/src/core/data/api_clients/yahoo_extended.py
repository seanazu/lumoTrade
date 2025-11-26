"""
Yahoo Finance Extended Client
Builds on existing data_loader with panel data and cross-asset support
"""

import warnings
from pathlib import Path
from typing import List, Dict, Tuple, Optional

import pandas as pd
import yfinance as yf

from src.core.data.loaders import data_loader


class YahooExtendedClient:
    """
    Enhanced Yahoo Finance client for panel data and cross-assets.
    
    Features:
    - Panel downloads (multiple tickers efficiently)
    - Cross-asset data (VIX, DXY, commodities, bonds)
    - Parquet caching for fast reloads
    """
    
    # Cross-asset universe
    CROSS_ASSET_UNIVERSE = {
        # Volatility
        "^VIX": "CBOE Volatility Index",
        "^VIX3M": "CBOE 3-Month Volatility",
        
        # Currency
        "DX-Y.NYB": "US Dollar Index",
        "UUP": "Dollar ETF (fallback)",
        
        # Commodities
        "GC=F": "Gold Futures",
        "GLD": "Gold ETF",
        "CL=F": "Oil Futures",
        "USO": "Oil ETF",
        
        # Fixed Income
        "^TNX": "10-Year Treasury Yield",
        "TLT": "20+ Year Treasury ETF",
        "IEF": "7-10 Year Treasury ETF",
        "HYG": "High Yield Corp Bond ETF",
        "LQD": "Investment Grade Corp Bond ETF"
    }
    
    def __init__(self, cache_dir: str = "data/cache"):
        self.cache_dir = Path(cache_dir) / "yahoo"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    async def download_panel_data(
        self,
        universe: List[str],
        start: str,
        end: str,
        interval: str = "5min"
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Download panel of tickers efficiently.
        
        Args:
            universe: List of tickers (e.g., ["SPY", "QQQ", "DIA"])
            start: Start date (YYYY-MM-DD)
            end: End date (YYYY-MM-DD)
            interval: Bar interval (e.g., "5min", "1d")
        
        Returns:
            (close_wide, volume_wide)
            - close_wide: DataFrame with tickers as columns
            - volume_wide: DataFrame with tickers as columns
        """
        # Check cache
        cache_key = f"panel_{'_'.join(sorted(universe))}_{start}_{end}_{interval}"
        cache_path = self.cache_dir / f"{cache_key}.parquet"
        
        if cache_path.exists():
            try:
                df = pd.read_parquet(cache_path)
                close_cols = [c for c in df.columns if c.endswith("_close")]
                volume_cols = [c for c in df.columns if c.endswith("_volume")]
                
                close_wide = df[close_cols]
                close_wide.columns = [c.replace("_close", "") for c in close_cols]
                
                volume_wide = df[volume_cols]
                volume_wide.columns = [c.replace("_volume", "") for c in volume_cols]
                
                return close_wide, volume_wide
            except Exception:
                pass
        
        # Fetch data for each ticker
        close_series = []
        volume_series = []
        
        for ticker in universe:
            try:
                # Use existing data_loader
                df = await data_loader.load_historical_data(
                    symbol=ticker,
                    start_date=start,
                    end_date=end,
                    interval=interval
                )
                
                if not df.empty:
                    # Handle both "Close" and "close" column names
                    close_col = "Close" if "Close" in df.columns else "close" if "close" in df.columns else None
                    volume_col = "Volume" if "Volume" in df.columns else "volume" if "volume" in df.columns else None
                    
                    if close_col and volume_col:
                        close_series.append(df[close_col].rename(ticker))
                        volume_series.append(df[volume_col].rename(ticker))
                    else:
                        raise KeyError(f"Missing required columns. Available: {df.columns.tolist()}")
            
            except Exception as e:
                warnings.warn(f"Failed to fetch {ticker}: {e}")
        
        # Combine into wide DataFrames
        if close_series:
            close_wide = pd.concat(close_series, axis=1).sort_index()
            volume_wide = pd.concat(volume_series, axis=1).reindex(close_wide.index)
        else:
            close_wide = pd.DataFrame()
            volume_wide = pd.DataFrame()
        
        # Cache result
        if not close_wide.empty:
            try:
                # Combine for single file cache
                combined = close_wide.copy()
                combined.columns = [f"{c}_close" for c in combined.columns]
                
                for c in volume_wide.columns:
                    combined[f"{c}_volume"] = volume_wide[c]
                
                combined.to_parquet(cache_path)
            except Exception:
                pass
        
        return close_wide, volume_wide
    
    async def download_cross_asset_data(
        self,
        start: str,
        end: str,
        interval: str = "5min"
    ) -> Dict[str, pd.DataFrame]:
        """
        Fetch cross-asset data (VIX, DXY, commodities, bonds).
        
        Returns:
            Dict mapping asset name to OHLCV DataFrame
        """
        result = {}
        
        # Try primary symbols, fall back to alternatives
        fallbacks = {
            "vix": ["^VIX"],
            "vix3m": ["^VIX3M"],
            "dxy": ["DX-Y.NYB", "UUP"],
            "gold": ["GC=F", "GLD"],
            "oil": ["CL=F", "USO"],
            "ust10y": ["^TNX", "IEF"],
            "hy_bonds": ["HYG"],
            "ig_bonds": ["LQD"],
            "treasuries": ["TLT"]
        }
        
        for name, symbols in fallbacks.items():
            for symbol in symbols:
                try:
                    df = await data_loader.load_historical_data(
                        symbol=symbol,
                        start_date=start,
                        end_date=end,
                        interval=interval
                    )
                    
                    if not df.empty:
                        # Set timestamp as index if it's a column
                        if "timestamp" in df.columns and not isinstance(df.index, pd.DatetimeIndex):
                            df["timestamp"] = pd.to_datetime(df["timestamp"])
                            df = df.set_index("timestamp")
                        
                        result[name] = df
                        break
                
                except Exception:
                    continue
        
        return result
    
    def get_vix_term_structure(
        self,
        vix: pd.Series,
        vix3m: pd.Series
    ) -> pd.Series:
        """
        Calculate VIX term structure.
        
        vix_term = (VIX3M / VIX) - 1
        - Positive: Contango (normal)
        - Negative: Backwardation (stress)
        """
        import numpy as np
        
        vix_term = (vix3m / vix - 1.0).replace([np.inf, -np.inf], np.nan)
        return vix_term.rename("vix_term")

