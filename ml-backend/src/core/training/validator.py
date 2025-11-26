"""
Walk-Forward Validation
Time-series cross-validation for preventing look-ahead bias
Ported from multi_factor_model/scripts/train_backtest.py
"""

from typing import List, Tuple
from datetime import timedelta

import numpy as np
import pandas as pd


def create_walk_forward_folds(
    dates: pd.DatetimeIndex,
    interval: str,
    train_window: int,
    test_window: int,
    step_size: int = None
) -> List[Tuple[pd.Timestamp, pd.Timestamp, pd.Timestamp]]:
    """
    Create time-series CV folds for walk-forward validation.
    
    Args:
        dates: DatetimeIndex of all available dates
        interval: Bar interval ("5min", "1h", "1d")
        train_window: Training window size (days for daily, bars for intraday)
        test_window: Test window size (days for daily, bars for intraday)
        step_size: Step size between folds (default: test_window)
    
    Returns:
        List of (train_start, train_end, test_end) tuples
    
    Example (daily data, 5 years train, 6 months test):
    - Fold 1: Train 2020-01-01 → 2025-01-01, Test 2025-01-01 → 2025-07-01
    - Fold 2: Train 2020-07-01 → 2025-07-01, Test 2025-07-01 → 2026-01-01
    - Fold 3: Train 2021-01-01 → 2026-01-01, Test 2026-01-01 → 2026-07-01
    
    Example (5min intraday, 5000 bars train, 1000 bars test):
    - Fold 1: Train bar[0:5000], Test bar[5000:6000]
    - Fold 2: Train bar[1000:6000], Test bar[6000:7000]
    - Fold 3: Train bar[2000:7000], Test bar[7000:8000]
    """
    if step_size is None:
        step_size = test_window
    
    dates = pd.DatetimeIndex(sorted(set(dates)))
    
    if len(dates) < train_window + test_window:
        raise ValueError(
            f"Insufficient data: {len(dates)} bars available, "
            f"need at least {train_window + test_window}"
        )
    
    folds = []
    
    # For daily or intraday data, work with bar indices
    if interval in ["1d", "1day", "daily"]:
        # Use day-based windows
        for i in range(0, len(dates) - train_window - test_window + 1, step_size):
            train_start = dates[i]
            train_end = dates[i + train_window - 1]
            test_end = dates[min(i + train_window + test_window - 1, len(dates) - 1)]
            
            folds.append((train_start, train_end, test_end))
    else:
        # Use bar-based windows for intraday
        for i in range(0, len(dates) - train_window - test_window + 1, step_size):
            train_start_idx = i
            train_end_idx = i + train_window - 1
            test_end_idx = min(i + train_window + test_window - 1, len(dates) - 1)
            
            train_start = dates[train_start_idx]
            train_end = dates[train_end_idx]
            test_end = dates[test_end_idx]
            
            folds.append((train_start, train_end, test_end))
    
    return folds


class WalkForwardSplitter:
    """
    Scikit-learn compatible walk-forward splitter.
    """
    
    def __init__(
        self,
        interval: str = "1d",
        train_window: int = 1825,  # ~5 years for daily
        test_window: int = 180,  # ~6 months for daily
        step_size: int = None
    ):
        """
        Initialize walk-forward splitter.
        
        Args:
            interval: Bar interval
            train_window: Training window size
            test_window: Test window size
            step_size: Step size between folds (default: test_window)
        """
        self.interval = interval
        self.train_window = train_window
        self.test_window = test_window
        self.step_size = step_size or test_window
    
    def split(self, X: pd.DataFrame, y=None, groups=None):
        """
        Generate train/test indices for walk-forward validation.
        
        Args:
            X: Feature DataFrame with DatetimeIndex
            y: Target (optional)
            groups: Not used
        
        Yields:
            (train_indices, test_indices) tuples
        """
        dates = pd.DatetimeIndex(X.index.get_level_values("date") if isinstance(X.index, pd.MultiIndex) else X.index)
        
        folds = create_walk_forward_folds(
            dates=dates,
            interval=self.interval,
            train_window=self.train_window,
            test_window=self.test_window,
            step_size=self.step_size
        )
        
        for train_start, train_end, test_end in folds:
            # Get train indices
            if isinstance(X.index, pd.MultiIndex):
                train_mask = (dates >= train_start) & (dates <= train_end)
                test_mask = (dates > train_end) & (dates <= test_end)
            else:
                train_mask = (X.index >= train_start) & (X.index <= train_end)
                test_mask = (X.index > train_end) & (X.index <= test_end)
            
            train_indices = np.where(train_mask)[0]
            test_indices = np.where(test_mask)[0]
            
            yield train_indices, test_indices
    
    def get_n_splits(self, X=None, y=None, groups=None):
        """Get number of splits."""
        if X is None:
            return 0
        
        dates = pd.DatetimeIndex(X.index.get_level_values("date") if isinstance(X.index, pd.MultiIndex) else X.index)
        
        folds = create_walk_forward_folds(
            dates=dates,
            interval=self.interval,
            train_window=self.train_window,
            test_window=self.test_window,
            step_size=self.step_size
        )
        
        return len(folds)


def slice_between(df: pd.DataFrame, start: pd.Timestamp, end: pd.Timestamp) -> pd.DataFrame:
    """
    Slice DataFrame between two timestamps.
    
    Handles both simple DatetimeIndex and MultiIndex with date level.
    """
    if isinstance(df.index, pd.MultiIndex):
        dates = df.index.get_level_values("date")
        mask = (dates >= start) & (dates <= end)
        return df[mask]
    else:
        return df.loc[start:end]

