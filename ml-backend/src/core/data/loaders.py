"""
Data Loading and Preprocessing Utilities
"""
import os
import pandas as pd
import numpy as np
from typing import Tuple, Optional, List, Dict
from datetime import datetime, timedelta
import requests
from pathlib import Path
import yfinance as yf
import asyncio

class DataLoader:
    def __init__(self):
        self.fmp_api_key = os.getenv("FMP_API_KEY")
        self.polygon_api_key = os.getenv("POLYGON_API_KEY")
        self.cache_dir = Path("data/cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    async def load_historical_data(
        self,
        symbol: str,
        start_date: str,
        end_date: str,
        interval: str = "1min"
    ) -> pd.DataFrame:
        """
        Load historical OHLCV data from FMP or Polygon
        
        Args:
            symbol: Stock symbol (e.g., 'SPY')
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            interval: Time interval (1min, 5min, 15min, 1hour, 1day)
        
        Returns:
            DataFrame with columns: timestamp, open, high, low, close, volume
        """
        # Check cache first
        cache_file = self.cache_dir / f"{symbol}_{start_date}_{end_date}_{interval}.parquet"
        if cache_file.exists():
            print(f"Loading {symbol} from cache...")
            df = pd.read_parquet(cache_file)
            # Handle duplicate timestamps
            if "timestamp" in df.columns and df["timestamp"].duplicated().any():
                df = df.drop_duplicates(subset=["timestamp"], keep="last")
            return df
        
        # Fetch from API (prioritize FMP)
        print(f"Fetching {symbol} data from {start_date} to {end_date}...")
        
        if self.fmp_api_key:
            df = await self._fetch_from_fmp(symbol, start_date, end_date, interval)
        elif self.polygon_api_key:
            df = await self._fetch_from_polygon(symbol, start_date, end_date, interval)
        else:
            # Fallback to yfinance (free, no API key required)
            df = await self._fetch_from_yfinance(symbol, start_date, end_date, interval)
        
        # Save to cache
        if not df.empty:
            df.to_parquet(cache_file)
            print(f"Cached {len(df)} records")
        else:
            print(f"Warning: No data returned for {symbol}")
        
        return df

    async def _fetch_from_polygon(
        self,
        symbol: str,
        start_date: str,
        end_date: str,
        interval: str
    ) -> pd.DataFrame:
        """Fetch data from Polygon.io"""
        # Convert interval to Polygon format
        multiplier, timespan = self._parse_interval(interval)
        
        url = f"https://api.polygon.io/v2/aggs/ticker/{symbol}/range/{multiplier}/{timespan}/{start_date}/{end_date}"
        params = {
            "apiKey": self.polygon_api_key,
            "adjusted": "true",
            "sort": "asc",
            "limit": 50000
        }
        
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if "results" not in data:
            raise ValueError(f"No data returned from Polygon for {symbol}")
        
        df = pd.DataFrame(data["results"])
        df = df.rename(columns={
            "t": "timestamp",
            "o": "open",
            "h": "high",
            "l": "low",
            "c": "close",
            "v": "volume"
        })
        
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
        df = df[["timestamp", "open", "high", "low", "close", "volume"]]
        df = df.sort_values("timestamp").reset_index(drop=True)
        
        return df

    async def _fetch_from_fmp(
        self,
        symbol: str,
        start_date: str,
        end_date: str,
        interval: str
    ) -> pd.DataFrame:
        """
        Fetch data from Financial Modeling Prep.
        FMP supports: 1min, 5min, 15min, 30min, 1hour, 4hour (intraday)
        For daily data, uses /historical-price-full endpoint
        """
        # Convert interval format to FMP format
        interval_map = {
            "1m": "1min",
            "5m": "5min",
            "15m": "15min",
            "30m": "30min",
            "1h": "1hour",
            "4h": "4hour",
            "1d": "daily",
            "1day": "daily",
            "1min": "1min",
            "5min": "5min",
            "15min": "15min",
            "30min": "30min",
            "1hour": "1hour",
            "4hour": "4hour"
        }
        
        fmp_interval = interval_map.get(interval, "5min")
        
        # For daily data, use different endpoint
        if fmp_interval == "daily":
            url = f"https://financialmodelingprep.com/api/v3/historical-price-full/{symbol}"
            params = {
                "apikey": self.fmp_api_key,
                "from": start_date,
                "to": end_date
            }
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if not data or "historical" not in data:
                raise ValueError(f"No data returned from FMP for {symbol}")
            
            df = pd.DataFrame(data["historical"])
            df = df.rename(columns={"date": "timestamp"})
        else:
            # Intraday data
            url = f"https://financialmodelingprep.com/api/v3/historical-chart/{fmp_interval}/{symbol}"
            params = {
                "apikey": self.fmp_api_key,
                "from": start_date,
                "to": end_date
            }
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if not data:
                raise ValueError(f"No data returned from FMP for {symbol}")
            
            df = pd.DataFrame(data)
            df = df.rename(columns={"date": "timestamp"})
        
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df = df[["timestamp", "open", "high", "low", "close", "volume"]]
        df = df.sort_values("timestamp").reset_index(drop=True)
        
        print(f"Fetched {len(df)} bars from FMP for {symbol} ({fmp_interval})")
        
        return df

    def _parse_interval(self, interval: str) -> Tuple[int, str]:
        """Convert interval string to Polygon format (multiplier, timespan)"""
        mapping = {
            "1min": (1, "minute"),
            "5min": (5, "minute"),
            "15min": (15, "minute"),
            "30min": (30, "minute"),
            "1hour": (1, "hour"),
            "4hour": (4, "hour"),
            "1day": (1, "day")
        }
        return mapping.get(interval, (1, "minute"))

    def prepare_sequences(
        self,
        df: pd.DataFrame,
        sequence_length: int = 60,
        features: Optional[List[str]] = None
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare time series sequences for LSTM training
        
        Args:
            df: DataFrame with features
            sequence_length: Number of timesteps to look back
            features: List of feature column names to use
        
        Returns:
            X: Input sequences (num_samples, sequence_length, num_features)
            y: Target values (num_samples,) - 1 for up, 0 for down
        """
        if features is None:
            # Use all numeric columns except timestamp
            features = [col for col in df.columns if col != "timestamp" and df[col].dtype in [np.float64, np.int64]]
        
        # Extract feature matrix
        feature_data = df[features].values
        
        # Create sequences
        X, y = [], []
        for i in range(sequence_length, len(feature_data)):
            X.append(feature_data[i - sequence_length:i])
            
            # Target: 1 if next close > current close, else 0
            if i < len(feature_data):
                current_close = df.iloc[i - 1]["close"]
                next_close = df.iloc[i]["close"]
                y.append(1 if next_close > current_close else 0)
        
        return np.array(X), np.array(y)

    async def fetch_realtime_data(self, symbol: str) -> Dict:
        """
        Fetch latest market data for a symbol
        
        Returns dict with: last_price, volume, timestamp, etc.
        """
        if self.fmp_api_key:
            url = f"https://financialmodelingprep.com/api/v3/quote/{symbol}"
            params = {"apikey": self.fmp_api_key}
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data:
                quote = data[0]
                return {
                    "symbol": quote["symbol"],
                    "price": quote["price"],
                    "volume": quote["volume"],
                    "change": quote["change"],
                    "change_percent": quote["changesPercentage"],
                    "timestamp": datetime.now().isoformat()
                }
        
        raise ValueError("Real-time data not available")
    
    async def _fetch_from_yfinance(
        self,
        symbol: str,
        start_date: str,
        end_date: str,
        interval: str
    ) -> pd.DataFrame:
        """
        Fetch data from Yahoo Finance (free, no API key required).
        Fallback option when no premium API keys are configured.
        """
        # Convert interval to yfinance format
        yf_interval_map = {
            "1d": "1d",
            "1h": "1h",
            "30m": "30m",
            "15m": "15m",
            "5m": "5m",
            "1m": "1m"
        }
        
        yf_interval = yf_interval_map.get(interval, "1d")
        
        try:
            # Run yfinance download in thread pool (it's blocking)
            loop = asyncio.get_event_loop()
            ticker = yf.Ticker(symbol)
            
            df = await loop.run_in_executor(
                None,
                lambda: ticker.history(start=start_date, end=end_date, interval=yf_interval)
            )
            
            if df.empty:
                print(f"Warning: No data returned from yfinance for {symbol}")
                return pd.DataFrame()
            
            # Standardize column names
            df = df.rename(columns={
                "Open": "open",
                "High": "high",
                "Low": "low",
                "Close": "close",
                "Volume": "volume"
            })
            
            # Reset index to have timestamp as column
            df = df.reset_index()
            if "Date" in df.columns:
                df = df.rename(columns={"Date": "timestamp"})
            elif "Datetime" in df.columns:
                df = df.rename(columns={"Datetime": "timestamp"})
            
            # Ensure we have the required columns
            required_cols = ["timestamp", "open", "high", "low", "close", "volume"]
            for col in required_cols:
                if col not in df.columns:
                    if col == "timestamp":
                        df["timestamp"] = df.index
                    else:
                        print(f"Warning: Missing column {col} for {symbol}")
            
            return df[required_cols] if all(c in df.columns for c in required_cols) else df
            
        except Exception as e:
            print(f"Error fetching {symbol} from yfinance: {e}")
            return pd.DataFrame()

# Singleton instance
data_loader = DataLoader()

