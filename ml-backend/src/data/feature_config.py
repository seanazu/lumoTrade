"""
Feature Configuration
Defines feature groups and their importance weights
"""
from typing import Dict, List

# Feature group configuration with weights
FEATURE_GROUPS = {
    "news": {
        "weight": 0.40,  # Highest weight - news is most important
        "prefix": "news_",
        "description": "Market Direction Sentiment features"
    },
    "price": {
        "weight": 0.20,
        "prefix": "price_",
        "description": "Technical indicators and price features"
    },
    "macro": {
        "weight": 0.15,
        "prefix": "macro_",
        "description": "Cross-asset and risk regime features"
    },
    "breadth": {
        "weight": 0.15,
        "prefix": "breadth_",
        "description": "Market breadth and internal structure"
    },
    "calendar": {
        "weight": 0.10,
        "prefix": "cal_",
        "description": "Macro calendar events"
    }
}

# News feature definitions (from Market Direction Sentiment)
NEWS_FEATURES = {
    # Lookback windows
    "windows": ["30min", "1h", "4h", "1day"],
    
    # Features per window
    "features": [
        "sentiment_weighted_mean",
        "sentiment_weighted_median",
        "sentiment_std",
        "neg_extreme_share",
        "pos_extreme_share",
        "sentiment_skew",
        "event_count",
        "hi_imp_event_count",
        "macro_event_count",
        "sentiment_shock",
        "neg_shock_flag",
        "pos_shock_flag"
    ]
}

# Price feature definitions
PRICE_FEATURES = {
    # Past returns
    "returns": ["5m", "15m", "1h", "4h", "1d", "3d", "5d"],
    
    # Realized volatility
    "volatility": {
        "intraday": ["1h", "4h", "1d"],
        "daily": ["5d", "10d", "20d"]
    },
    
    # Moving averages
    "ma_periods": [20, 50, 200],
    
    # Technical indicators
    "indicators": [
        "rsi_14", "rsi_21",
        "macd", "macd_signal", "macd_hist",
        "bb_upper_20", "bb_lower_20", "bb_width_20",
        "atr_14",
        "adx", "adx_pos", "adx_neg",
        "volume_ratio"
    ]
}

# Macro feature definitions
MACRO_FEATURES = {
    "vix": ["level", "1d_return", "5d_return", "zscore"],
    "yields": ["2y", "10y", "curve_slope"],
    "dxy": ["level", "1d_return", "5d_return", "zscore"],
    "gold": ["level", "1d_return", "5d_return", "zscore"],
    "oil": ["level", "1d_return", "5d_return", "zscore"]
}

# Breadth feature definitions
BREADTH_FEATURES = [
    "pct_constituents_up",
    "pct_above_50d_ma",
    "pct_above_200d_ma",
    "new_52w_highs",
    "new_52w_lows",
    "advance_decline_ratio",
    "equal_weight_return",
    "cap_weight_return",
    "ew_vs_cw_spread"
]

# Calendar feature definitions
CALENDAR_FEATURES = {
    "fomc": ["is_fomc_day", "days_to_next_fomc", "days_since_last_fomc"],
    "cpi": ["is_cpi_day", "days_to_next_cpi", "days_since_last_cpi"],
    "nfp": ["is_nfp_day", "days_to_next_nfp", "days_since_last_nfp"],
    "earnings": ["is_earnings_week", "earnings_count_this_week"]
}

# Horizons for prediction
HORIZONS = ["1h", "4h", "10h", "1d", "3d", "5d"]

# Index configuration
INDICES = {
    "SPX": {
        "etf": "SPY",
        "name": "S&P 500",
        "top_components": ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK.B", "UNH", "JNJ"]
    },
    "NDX": {
        "etf": "QQQ",
        "name": "NASDAQ 100",
        "top_components": ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "AVGO", "COST", "ADBE"]
    },
    "RUT": {
        "etf": "IWM",
        "name": "Russell 2000",
        "top_components": []  # Small caps, less focused
    }
}

def get_all_feature_names() -> List[str]:
    """Generate list of all feature names"""
    features = []
    
    # News features
    for window in NEWS_FEATURES["windows"]:
        for feat in NEWS_FEATURES["features"]:
            features.append(f"news_{window}_{feat}")
    
    # Price features - returns
    for period in PRICE_FEATURES["returns"]:
        features.append(f"price_return_{period}")
    
    # Price features - volatility
    for period in PRICE_FEATURES["volatility"]["intraday"]:
        features.append(f"price_vol_intraday_{period}")
    for period in PRICE_FEATURES["volatility"]["daily"]:
        features.append(f"price_vol_daily_{period}")
    
    # Price features - MA distance
    for period in PRICE_FEATURES["ma_periods"]:
        features.append(f"price_dist_to_sma_{period}")
        features.append(f"price_dist_to_ema_{period}")
    
    # Price features - indicators
    for indicator in PRICE_FEATURES["indicators"]:
        features.append(f"price_{indicator}")
    
    # Macro features
    for asset, metrics in MACRO_FEATURES.items():
        for metric in metrics:
            features.append(f"macro_{asset}_{metric}")
    
    # Breadth features
    for feat in BREADTH_FEATURES:
        features.append(f"breadth_{feat}")
    
    # Calendar features
    for event_type, feats in CALENDAR_FEATURES.items():
        for feat in feats:
            features.append(f"cal_{event_type}_{feat}")
    
    return features


def get_feature_group(feature_name: str) -> str:
    """Determine which group a feature belongs to"""
    for group_name, group_config in FEATURE_GROUPS.items():
        if feature_name.startswith(group_config["prefix"]):
            return group_name
    return "unknown"


def get_feature_importance_weight(feature_name: str) -> float:
    """Get the importance weight for a feature based on its group"""
    group = get_feature_group(feature_name)
    return FEATURE_GROUPS.get(group, {}).get("weight", 0.0)

