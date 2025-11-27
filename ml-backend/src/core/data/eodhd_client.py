"""
EODHD API Client
Fetches news sentiment and options data
"""

import os
import requests
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import pandas as pd


class EODHDClient:
    """
    Client for EODHD API
    https://eodhd.com/financial-apis/
    
    Features:
    - News sentiment scores
    - Options data (put/call ratio, volume, open interest, Greeks)
    """
    
    BASE_URL = "https://eodhd.com/api"
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("EODHD_API_KEY")
        if not self.api_key:
            raise ValueError("EODHD_API_KEY not found in environment")
        self.api_key = self.api_key.strip()
    
    def _request(self, endpoint: str, params: Dict = None) -> Dict:
        """Make API request"""
        params = params or {}
        params["api_token"] = self.api_key
        params["fmt"] = "json"
        
        url = f"{self.BASE_URL}/{endpoint}"
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"EODHD API error: {e}")
            return {}
    
    # =========================================================================
    # NEWS SENTIMENT
    # =========================================================================
    
    def get_sentiment(self, ticker: str, from_date: str = None, to_date: str = None) -> pd.DataFrame:
        """
        Get sentiment data for a ticker
        
        Args:
            ticker: Stock symbol (e.g., 'AAPL.US')
            from_date: Start date (YYYY-MM-DD)
            to_date: End date (YYYY-MM-DD)
        
        Returns:
            DataFrame with sentiment scores
        """
        # Ensure ticker has exchange suffix
        if "." not in ticker:
            ticker = f"{ticker}.US"
        
        params = {"s": ticker}
        if from_date:
            params["from"] = from_date
        if to_date:
            params["to"] = to_date
        
        data = self._request("sentiments", params)
        
        if not data or ticker not in data:
            return pd.DataFrame()
        
        sentiment_data = data[ticker]
        if not sentiment_data:
            return pd.DataFrame()
        
        df = pd.DataFrame(sentiment_data)
        if "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"])
            df = df.set_index("date")
        
        return df
    
    # =========================================================================
    # OPTIONS DATA
    # =========================================================================
    
    def get_options(self, ticker: str) -> Dict:
        """
        Get options data for a ticker
        
        Args:
            ticker: Stock symbol (e.g., 'AAPL')
        
        Returns:
            Dict with options chains data
        """
        if "." not in ticker:
            ticker = f"{ticker}.US"
        
        data = self._request(f"options/{ticker}")
        
        return data if data else {}
    
    def get_options_summary(self, ticker: str) -> Dict:
        """
        Get summarized options metrics (put/call ratio, volume, open interest)
        
        Args:
            ticker: Stock symbol
        
        Returns:
            Dict with options summary metrics
        """
        data = self.get_options(ticker)
        
        if not data or "data" not in data:
            return {
                "put_call_ratio": 1.0,
                "put_call_volume_ratio": 1.0,
                "put_call_oi_ratio": 1.0,
                "total_call_volume": 0,
                "total_put_volume": 0,
                "total_call_oi": 0,
                "total_put_oi": 0,
                "avg_call_iv": 0,
                "avg_put_iv": 0,
                "has_data": False
            }
        
        total_call_volume = 0
        total_put_volume = 0
        total_call_oi = 0
        total_put_oi = 0
        call_iv_sum = 0
        put_iv_sum = 0
        call_count = 0
        put_count = 0
        
        # Aggregate across all expirations (focus on near-term)
        for i, expiration in enumerate(data["data"][:5]):  # First 5 expirations
            options = expiration.get("options", {})
            
            # Process calls
            for call in options.get("CALL", []):
                vol = call.get("volume", 0) or 0
                oi = call.get("openInterest", 0) or 0
                iv = call.get("impliedVolatility", 0) or 0
                
                total_call_volume += vol
                total_call_oi += oi
                if iv > 0:
                    call_iv_sum += iv
                    call_count += 1
            
            # Process puts
            for put in options.get("PUT", []):
                vol = put.get("volume", 0) or 0
                oi = put.get("openInterest", 0) or 0
                iv = put.get("impliedVolatility", 0) or 0
                
                total_put_volume += vol
                total_put_oi += oi
                if iv > 0:
                    put_iv_sum += iv
                    put_count += 1
        
        # Calculate ratios
        # Put/Call ratio > 1 = bearish sentiment, < 1 = bullish
        put_call_volume_ratio = total_put_volume / total_call_volume if total_call_volume > 0 else 1.0
        put_call_oi_ratio = total_put_oi / total_call_oi if total_call_oi > 0 else 1.0
        
        # Average the two ratios
        put_call_ratio = (put_call_volume_ratio + put_call_oi_ratio) / 2
        
        # Average implied volatility
        avg_call_iv = call_iv_sum / call_count if call_count > 0 else 0
        avg_put_iv = put_iv_sum / put_count if put_count > 0 else 0
        
        return {
            "put_call_ratio": put_call_ratio,
            "put_call_volume_ratio": put_call_volume_ratio,
            "put_call_oi_ratio": put_call_oi_ratio,
            "total_call_volume": total_call_volume,
            "total_put_volume": total_put_volume,
            "total_call_oi": total_call_oi,
            "total_put_oi": total_put_oi,
            "avg_call_iv": avg_call_iv,
            "avg_put_iv": avg_put_iv,
            "iv_skew": avg_put_iv - avg_call_iv,  # Positive = fear, negative = greed
            "has_data": True
        }
    
    # =========================================================================
    # FEATURE BUILDING
    # =========================================================================
    
    def build_sentiment_features(self, ticker: str, days: int = 60) -> Dict:
        """
        Build sentiment-based features for ML model
        
        Returns:
            Dict with sentiment features ready for model
        """
        from_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        # Get sentiment data
        sentiment_df = self.get_sentiment(ticker, from_date=from_date)
        
        features = {}
        
        if not sentiment_df.empty:
            # Latest sentiment
            if "normalized" in sentiment_df.columns:
                features["sentiment_score"] = sentiment_df["normalized"].iloc[-1]
                features["sentiment_ma_5"] = sentiment_df["normalized"].rolling(5).mean().iloc[-1]
                features["sentiment_ma_20"] = sentiment_df["normalized"].rolling(20).mean().iloc[-1]
                features["sentiment_std"] = sentiment_df["normalized"].rolling(20).std().iloc[-1]
                features["sentiment_zscore"] = (
                    (features["sentiment_score"] - features["sentiment_ma_20"]) / 
                    (features["sentiment_std"] + 1e-10)
                )
                features["sentiment_change_1d"] = sentiment_df["normalized"].diff().iloc[-1]
                features["sentiment_change_5d"] = sentiment_df["normalized"].diff(5).iloc[-1]
            
            # News count (activity)
            if "count" in sentiment_df.columns:
                features["news_count"] = sentiment_df["count"].iloc[-1]
                features["news_count_ma"] = sentiment_df["count"].rolling(5).mean().iloc[-1]
        
        return features
    
    def build_options_features(self, ticker: str) -> Dict:
        """
        Build options-based features for ML model
        
        Put/Call ratio interpretation:
        - > 1.0 = More puts than calls = Bearish sentiment / Fear
        - < 1.0 = More calls than puts = Bullish sentiment / Greed
        - Extreme values (>1.5 or <0.5) often signal reversals
        
        Returns:
            Dict with options features ready for model
        """
        summary = self.get_options_summary(ticker)
        
        if not summary["has_data"]:
            return {}
        
        pc_ratio = summary["put_call_ratio"]
        
        return {
            "options_put_call_ratio": pc_ratio,
            "options_put_call_volume": summary["put_call_volume_ratio"],
            "options_put_call_oi": summary["put_call_oi_ratio"],
            "options_iv_skew": summary["iv_skew"],
            "options_avg_iv": (summary["avg_call_iv"] + summary["avg_put_iv"]) / 2,
            # Sentiment signals
            "options_extreme_fear": 1 if pc_ratio > 1.5 else 0,
            "options_fear": 1 if pc_ratio > 1.0 else 0,
            "options_greed": 1 if pc_ratio < 0.7 else 0,
            "options_extreme_greed": 1 if pc_ratio < 0.5 else 0,
        }


# Test the client
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    
    client = EODHDClient()
    
    print("Testing EODHD API Client...")
    print("=" * 50)
    
    # Test sentiment
    print("\n1. Testing Sentiment API...")
    sentiment = client.get_sentiment("AAPL")
    print(f"   Sentiment data shape: {sentiment.shape if not sentiment.empty else 'Empty'}")
    
    # Test options
    print("\n2. Testing Options API...")
    options = client.get_options_summary("AAPL")
    print(f"   Put/Call Ratio: {options['put_call_ratio']:.2f}")
    print(f"   Volume Ratio: {options['put_call_volume_ratio']:.2f}")
    print(f"   OI Ratio: {options['put_call_oi_ratio']:.2f}")
    print(f"   IV Skew: {options['iv_skew']:.4f}")
    print(f"   Call Volume: {options['total_call_volume']:,}")
    print(f"   Put Volume: {options['total_put_volume']:,}")
    
    # Test feature building
    print("\n3. Testing Sentiment Features...")
    sent_features = client.build_sentiment_features("AAPL")
    print(f"   Features: {sent_features}")
    
    print("\n4. Testing Options Features...")
    opt_features = client.build_options_features("AAPL")
    print(f"   Features: {opt_features}")
    
    # Test for QQQ (ETF)
    print("\n5. Testing Options for QQQ...")
    qqq_options = client.get_options_summary("QQQ")
    print(f"   QQQ Put/Call Ratio: {qqq_options['put_call_ratio']:.2f}")
    print(f"   QQQ IV Skew: {qqq_options['iv_skew']:.4f}")
    
    print("\n" + "=" * 50)
    print("EODHD Client test complete!")
