"""
Federal Reserve Economic Data (FRED) API Client
Fetches macro economic time series
"""

import os
import warnings
from pathlib import Path
from typing import Optional, Dict, List

import pandas as pd
import requests


class FREDClient:
    """
    FRED API client for macro economic data.
    
    Features:
    - Fetch economic time series (yields, inflation, labor, etc.)
    - Caching to Parquet files
    - Batch fetching for multiple series
    """
    
    FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations"
    
    # Core economic series
    CORE_SERIES = {
        # Yields & Rates
        "DGS2": "2-Year Treasury Yield",
        "DGS10": "10-Year Treasury Yield",
        "DGS30": "30-Year Treasury Yield",
        "FEDFUNDS": "Federal Funds Rate",
        "MORTGAGE30US": "30-Year Mortgage Rate",
        
        # Inflation
        "CPIAUCSL": "CPI All Items",
        "CPILFESL": "Core CPI (ex food & energy)",
        "PCEPI": "PCE Price Index",
        "PCEPILFE": "Core PCE",
        
        # Labor
        "UNRATE": "Unemployment Rate",
        "PAYEMS": "Total Nonfarm Payrolls",
        "ICSA": "Initial Jobless Claims",
        "CCSA": "Continued Jobless Claims",
        
        # Activity & Output
        "INDPRO": "Industrial Production Index",
        "RSXFS": "Retail Sales",
        "HOUST": "Housing Starts",
        "PERMIT": "Building Permits",
        "MANEMP": "Manufacturing Employment",
        
        # Sentiment & Leading
        "UMCSENT": "Consumer Sentiment (U of Michigan)",
        # "CBCONFID": "Consumer Confidence (Conference Board)",  # Not available on FRED
        
        # Credit & Risk
        "BAMLH0A0HYM2": "High Yield OAS",
        "BAMLC0A4CBBB": "BBB Corporate OAS",
        "T10Y2Y": "10Y-2Y Treasury Spread",
        "T10Y3M": "10Y-3M Treasury Spread",
        
        # Volatility
        "VIXCLS": "VIX Closing Price"
    }
    
    def __init__(self, api_key: str = None, cache_dir: str = "data/cache"):
        self.api_key = api_key or os.getenv("FRED_API_KEY")
        if not self.api_key:
            warnings.warn("FRED_API_KEY not set. Macro features will be unavailable.")
        
        self.cache_dir = Path(cache_dir) / "fred"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def fetch_series(
        self,
        series_id: str,
        start_date: str,
        end_date: str = None
    ) -> Optional[pd.Series]:
        """
        Fetch a single FRED series.
        
        Args:
            series_id: FRED series ID (e.g., "DGS10")
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (default: today)
        
        Returns:
            pd.Series with DatetimeIndex
        """
        if not self.api_key:
            return None
        
        # Check cache
        cache_path = self.cache_dir / f"{series_id}_{start_date}_{end_date or 'latest'}.parquet"
        if cache_path.exists():
            try:
                return pd.read_parquet(cache_path).iloc[:, 0]
            except Exception:
                pass
        
        # Fetch from API
        params = {
            "series_id": series_id,
            "api_key": self.api_key,
            "file_type": "json",
            "observation_start": start_date
        }
        
        if end_date:
            params["observation_end"] = end_date
        
        try:
            response = requests.get(self.FRED_BASE_URL, params=params, timeout=30)
            
            if response.status_code != 200:
                warnings.warn(f"FRED API error {response.status_code} for {series_id}")
                return None
            
            data = response.json()
            observations = data.get("observations", [])
            
            if not observations:
                warnings.warn(f"No data returned for {series_id}")
                return None
            
            # Parse to DataFrame
            records = []
            for obs in observations:
                date = pd.to_datetime(obs["date"])
                value = obs["value"]
                
                # Handle "." for missing values
                if value == ".":
                    value = None
                else:
                    try:
                        value = float(value)
                    except Exception:
                        value = None
                
                records.append({"date": date, "value": value})
            
            df = pd.DataFrame(records).set_index("date")
            series = df["value"].astype(float)
            series.name = series_id
            
            # Cache
            try:
                series.to_frame().to_parquet(cache_path)
            except Exception:
                pass
            
            return series
        
        except Exception as e:
            warnings.warn(f"Failed to fetch {series_id}: {e}")
            return None
    
    def fetch_multiple(
        self,
        series_ids: List[str],
        start_date: str,
        end_date: str = None,
        verbose: bool = False
    ) -> Dict[str, pd.Series]:
        """
        Fetch multiple FRED series.
        
        Args:
            series_ids: List of FRED series IDs
            start_date: Start date
            end_date: End date
            verbose: Print progress
        
        Returns:
            Dict mapping series_id to pd.Series
        """
        result = {}
        
        for series_id in series_ids:
            if verbose:
                print(f"[FRED] Fetching {series_id}...")
            
            series = self.fetch_series(series_id, start_date, end_date)
            
            if series is not None:
                result[series_id] = series
            else:
                result[series_id] = pd.Series(dtype=float, name=series_id)
        
        return result
    
    def fetch_all_core_series(
        self,
        start_date: str,
        end_date: str = None,
        verbose: bool = False
    ) -> Dict[str, pd.Series]:
        """
        Fetch all core economic series.
        
        Returns:
            Dict mapping series_id to pd.Series
        """
        series_ids = list(self.CORE_SERIES.keys())
        return self.fetch_multiple(series_ids, start_date, end_date, verbose)

