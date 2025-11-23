"""
Target Generation for Multi-Horizon Predictions
Generates log returns for 6 horizons: 1h, 4h, 10h, 1d, 3d, 5d
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from datetime import datetime, timedelta
import pytz


class TargetGenerator:
    """Generate prediction targets for multiple horizons"""
    
    def __init__(self, buffer_minutes: int = 15):
        """
        Args:
            buffer_minutes: Lookback buffer to prevent data leakage (5-15 min)
        """
        self.buffer_minutes = buffer_minutes
        self.market_tz = pytz.timezone("America/New_York")
        
        # Trading hours (ET)
        self.market_open = "09:30"
        self.market_close = "16:00"
    
    def generate_targets(
        self,
        df_bars: pd.DataFrame,
        horizons: List[str] = ["1h", "4h", "10h", "1d", "3d", "5d"]
    ) -> pd.DataFrame:
        """
        Generate targets for all horizons
        
        Args:
            df_bars: DataFrame with columns [timestamp, open, high, low, close, volume]
            horizons: List of horizons to generate targets for
        
        Returns:
            DataFrame with columns [timestamp, r_1h, r_4h, r_10h, r_1d, r_3d, r_5d]
        """
        df = df_bars.copy()
        
        # Ensure timestamp is datetime
        if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Sort by timestamp
        df = df.sort_values('timestamp').reset_index(drop=True)
        
        # Generate targets for each horizon
        targets = pd.DataFrame({'timestamp': df['timestamp']})
        
        for horizon in horizons:
            targets[f'r_{horizon}'] = self._calculate_horizon_return(df, horizon)
        
        return targets
    
    def _calculate_horizon_return(self, df: pd.DataFrame, horizon: str) -> pd.Series:
        """
        Calculate log return for a specific horizon
        
        Args:
            df: DataFrame with timestamp and close columns
            horizon: Horizon string (e.g., "1h", "4h", "1d")
        
        Returns:
            Series of log returns
        """
        # Parse horizon
        if horizon.endswith('h'):
            hours = int(horizon[:-1])
            return self._calculate_intraday_return(df, hours)
        elif horizon.endswith('d'):
            days = int(horizon[:-1])
            return self._calculate_daily_return(df, days)
        else:
            raise ValueError(f"Invalid horizon format: {horizon}")
    
    def _calculate_intraday_return(self, df: pd.DataFrame, hours: int) -> pd.Series:
        """
        Calculate intraday return (for 1h, 4h, 10h)
        
        Uses trading hours only, skips weekends/holidays
        """
        returns = pd.Series(index=df.index, dtype=float)
        
        for i in range(len(df)):
            current_time = df.loc[i, 'timestamp']
            current_price = df.loc[i, 'close']
            
            # Calculate target time (current + hours, during trading hours)
            target_time = self._add_trading_hours(current_time, hours)
            
            # Find closest bar to target time
            future_bars = df[df['timestamp'] >= target_time]
            
            if len(future_bars) > 0:
                future_price = future_bars.iloc[0]['close']
                # Log return
                returns.iloc[i] = np.log(future_price / current_price)
            else:
                returns.iloc[i] = np.nan
        
        return returns
    
    def _calculate_daily_return(self, df: pd.DataFrame, days: int) -> pd.Series:
        """
        Calculate multi-day return (for 1d, 3d, 5d)
        
        Uses close-to-close returns, skips weekends
        """
        returns = pd.Series(index=df.index, dtype=float)
        
        # Group by date to get daily closes
        df['date'] = df['timestamp'].dt.date
        daily_closes = df.groupby('date')['close'].last()
        
        for i in range(len(df)):
            current_time = df.loc[i, 'timestamp']
            current_date = current_time.date()
            current_price = df.loc[i, 'close']
            
            # Find target date (N trading days ahead)
            target_date = self._add_trading_days(current_date, days)
            
            # Get close price on target date
            if target_date in daily_closes.index:
                future_price = daily_closes[target_date]
                # Log return
                returns.iloc[i] = np.log(future_price / current_price)
            else:
                returns.iloc[i] = np.nan
        
        return returns
    
    def _add_trading_hours(self, start_time: datetime, hours: int) -> datetime:
        """
        Add trading hours to a timestamp, skipping non-trading hours
        
        Args:
            start_time: Starting timestamp
            hours: Number of trading hours to add
        
        Returns:
            Target timestamp
        """
        current = start_time
        hours_added = 0
        
        while hours_added < hours:
            # Move forward 1 hour
            current = current + timedelta(hours=1)
            
            # Check if this hour is during trading hours
            if self._is_trading_hour(current):
                hours_added += 1
        
        return current
    
    def _add_trading_days(self, start_date, days: int):
        """
        Add trading days to a date, skipping weekends
        
        Args:
            start_date: Starting date
            days: Number of trading days to add
        
        Returns:
            Target date
        """
        current = start_date
        days_added = 0
        
        while days_added < days:
            # Move forward 1 day
            current = current + timedelta(days=1)
            
            # Check if this is a trading day (Monday-Friday)
            if current.weekday() < 5:  # 0=Monday, 4=Friday
                days_added += 1
        
        return current
    
    def _is_trading_hour(self, timestamp: datetime) -> bool:
        """
        Check if a timestamp is during regular trading hours
        
        Args:
            timestamp: Timestamp to check
        
        Returns:
            True if during trading hours (9:30 AM - 4:00 PM ET, Mon-Fri)
        """
        # Check if weekday
        if timestamp.weekday() >= 5:  # Saturday=5, Sunday=6
            return False
        
        # Check if during trading hours
        time_str = timestamp.strftime("%H:%M")
        return self.market_open <= time_str < self.market_close
    
    def align_features_and_targets(
        self,
        df_features: pd.DataFrame,
        df_targets: pd.DataFrame,
        buffer_minutes: int = None
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Align features and targets, ensuring no look-ahead bias
        
        Args:
            df_features: DataFrame with features
            df_targets: DataFrame with targets
            buffer_minutes: Lookback buffer (default: self.buffer_minutes)
        
        Returns:
            Tuple of (aligned_features, aligned_targets)
        """
        if buffer_minutes is None:
            buffer_minutes = self.buffer_minutes
        
        # Merge on timestamp
        df_merged = pd.merge(
            df_features,
            df_targets,
            on='timestamp',
            how='inner'
        )
        
        # Apply buffer: shift features back by buffer_minutes
        # This ensures at time t, we only use features from t - buffer
        df_merged['feature_timestamp'] = df_merged['timestamp'] - timedelta(minutes=buffer_minutes)
        
        # Drop rows where any target is NaN
        target_cols = [col for col in df_merged.columns if col.startswith('r_')]
        df_merged = df_merged.dropna(subset=target_cols)
        
        # Separate features and targets
        feature_cols = [col for col in df_merged.columns if not col.startswith('r_') and col not in ['timestamp', 'feature_timestamp']]
        
        df_features_aligned = df_merged[['timestamp'] + feature_cols]
        df_targets_aligned = df_merged[['timestamp'] + target_cols]
        
        return df_features_aligned, df_targets_aligned
    
    def split_train_test(
        self,
        df_features: pd.DataFrame,
        df_targets: pd.DataFrame,
        train_ratio: float = 0.8
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Split data into train and test sets (time-series split)
        
        Args:
            df_features: Features DataFrame
            df_targets: Targets DataFrame
            train_ratio: Ratio of data to use for training
        
        Returns:
            Tuple of (X_train, X_test, y_train, y_test)
        """
        split_idx = int(len(df_features) * train_ratio)
        
        X_train = df_features.iloc[:split_idx]
        X_test = df_features.iloc[split_idx:]
        
        y_train = df_targets.iloc[:split_idx]
        y_test = df_targets.iloc[split_idx:]
        
        return X_train, X_test, y_train, y_test


# Singleton instance
target_generator = TargetGenerator()

