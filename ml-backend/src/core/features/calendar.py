"""
Calendar Features Module
10+ seasonality and event features
"""

import pandas as pd
import numpy as np


def build_calendar_features(idx: pd.DatetimeIndex) -> pd.DataFrame:
    """
    Build calendar-based features.
    
    Args:
        idx: DatetimeIndex
    
    Returns:
        DataFrame with 10 calendar features
    """
    idx_dt = pd.DatetimeIndex(pd.to_datetime(idx)).tz_localize(None)
    out = pd.DataFrame(index=idx_dt)
    
    # Basic time features
    out["cal_month"] = idx_dt.month
    out["cal_quarter"] = idx_dt.quarter
    out["cal_day_of_week"] = idx_dt.dayofweek  # 0=Monday, 4=Friday
    out["cal_day_of_month"] = idx_dt.day
    
    # Month-end effect
    # Check if within last 3 trading days of month
    out["cal_is_month_end"] = (idx_dt.day >= 28).astype(float)
    
    # Earnings season (roughly Jan, Apr, Jul, Oct)
    out["cal_is_earnings_season"] = idx_dt.month.isin([1, 4, 7, 10]).astype(float)
    
    # Holiday proximity (US markets)
    # Major holidays: New Year, MLK, Presidents, Memorial, Independence, Labor, Thanksgiving, Christmas
    # Simplified: month indicators for holiday-heavy months
    out["cal_holiday_month"] = idx_dt.month.isin([1, 7, 11, 12]).astype(float)
    
    # Day of week effects
    out["cal_is_monday"] = (idx_dt.dayofweek == 0).astype(float)
    out["cal_is_friday"] = (idx_dt.dayofweek == 4).astype(float)
    
    # FOMC meeting months (typically 8 meetings per year)
    # Jan, Mar, May, Jun, Jul, Sep, Nov, Dec
    out["cal_fomc_month"] = idx_dt.month.isin([1, 3, 5, 6, 7, 9, 11, 12]).astype(float)
    
    return out

