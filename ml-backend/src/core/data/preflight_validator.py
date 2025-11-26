"""
Pre-flight Data Validation
Checks if required data is available before training starts
"""
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
import pandas as pd

from src.core.data.loaders import data_loader


class PreflightValidator:
    """Validates data availability before training"""
    
    # Known limitations by interval
    DATA_LIMITS = {
        "1min": {"days": 60, "provider": "FMP"},
        "5min": {"days": 90, "provider": "FMP"},
        "15min": {"days": 90, "provider": "FMP"},
        "30min": {"days": 90, "provider": "FMP"},
        "1hour": {"days": 90, "provider": "FMP"},
        "4hour": {"days": 180, "provider": "FMP"},
        "1day": {"days": 3650, "provider": "Yahoo Finance"},  # 10 years
    }
    
    async def validate_data_availability(
        self,
        tickers: List[str],
        start_date: str,
        end_date: str,
        interval: str,
        min_bars_required: int = 500
    ) -> Dict:
        """
        Validate that sufficient data exists before training.
        
        Args:
            tickers: List of tickers to validate
            start_date: Requested start date
            end_date: Requested end date
            interval: Time interval
            min_bars_required: Minimum bars needed for training
        
        Returns:
            Dict with validation results:
            {
                "valid": bool,
                "warnings": List[str],
                "errors": List[str],
                "actual_coverage": Dict,
                "recommendations": List[str]
            }
        """
        result = {
            "valid": True,
            "warnings": [],
            "errors": [],
            "actual_coverage": {},
            "recommendations": []
        }
        
        # Check if requested period exceeds known limits
        limit = self.DATA_LIMITS.get(interval)
        if limit:
            requested_days = (datetime.strptime(end_date, "%Y-%m-%d") - 
                            datetime.strptime(start_date, "%Y-%m-%d")).days
            
            if requested_days > limit["days"]:
                result["warnings"].append(
                    f"⚠️ Requested {requested_days} days but {limit['provider']} typically "
                    f"provides only {limit['days']} days for {interval} data. "
                    f"Training will use available data."
                )
                result["recommendations"].append(
                    f"Consider using lookback period of {limit['days']} days or less for {interval}"
                )
        
        # Test fetch data for each ticker
        print("\n[Pre-flight Check] Validating data availability...")
        
        failed_tickers = []
        bars_per_ticker = {}
        
        for ticker in tickers:
            try:
                print(f"  Checking {ticker}...")
                
                # Try to fetch a small sample to verify availability
                df = await data_loader.load_historical_data(
                    symbol=ticker,
                    start_date=start_date,
                    end_date=end_date,
                    interval=interval
                )
                
                if df.empty:
                    failed_tickers.append(ticker)
                    result["errors"].append(f"❌ No data available for {ticker}")
                    continue
                
                num_bars = len(df)
                bars_per_ticker[ticker] = num_bars
                
                # Get actual date range
                actual_start = df['timestamp'].min()
                actual_end = df['timestamp'].max()
                result["actual_coverage"][ticker] = {
                    "bars": num_bars,
                    "start": str(actual_start),
                    "end": str(actual_end),
                    "days": (actual_end - actual_start).days
                }
                
                if num_bars < min_bars_required:
                    result["warnings"].append(
                        f"⚠️ {ticker}: Only {num_bars} bars available (need {min_bars_required})"
                    )
                else:
                    print(f"    ✅ {ticker}: {num_bars} bars available")
                
            except Exception as e:
                failed_tickers.append(ticker)
                result["errors"].append(f"❌ Failed to fetch {ticker}: {str(e)}")
        
        # Overall validation
        if failed_tickers:
            result["valid"] = False
            result["errors"].append(
                f"Cannot proceed: {len(failed_tickers)} tickers failed data fetch: {failed_tickers}"
            )
        
        if bars_per_ticker:
            total_bars = sum(bars_per_ticker.values())
            avg_bars = total_bars / len(bars_per_ticker)
            
            result["actual_coverage"]["summary"] = {
                "total_bars": total_bars,
                "avg_bars_per_ticker": int(avg_bars),
                "successful_tickers": len(bars_per_ticker),
                "failed_tickers": len(failed_tickers)
            }
            
            if avg_bars < min_bars_required:
                result["valid"] = False
                result["errors"].append(
                    f"Insufficient data: Average {int(avg_bars)} bars per ticker, "
                    f"need at least {min_bars_required}"
                )
                result["recommendations"].append(
                    "Try: 1) Reduce lookback days, 2) Use larger interval (1day instead of 1hour), "
                    "or 3) Use fewer tickers"
                )
        
        return result
    
    def get_recommended_lookback(self, interval: str) -> Dict:
        """
        Get recommended lookback period for an interval.
        
        Returns:
            Dict with recommendation details
        """
        limit = self.DATA_LIMITS.get(interval, {"days": 90, "provider": "Unknown"})
        
        # Conservative recommendations (use 80% of limit)
        safe_days = int(limit["days"] * 0.8)
        
        return {
            "max_days": limit["days"],
            "recommended_days": safe_days,
            "provider": limit["provider"],
            "message": f"For {interval} data, recommend {safe_days} days (max {limit['days']} days)"
        }


# Singleton instance
preflight_validator = PreflightValidator()

