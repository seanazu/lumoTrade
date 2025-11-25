"""
Feature Utilities
Feature boosting, z-scores, and preprocessing
"""

import numpy as np
import pandas as pd
from typing import List, Tuple


# Feature boosting multipliers (from multi-factor model)
NEWS_BOOST = 2.0
VIX_BOOST = 1.5
MACRO_BOOST = 1.2


def apply_feature_boosting(X: pd.DataFrame) -> pd.DataFrame:
    """
    Boost important features before training.
    
    Multi-factor model uses this to emphasize signals.
    
    Args:
        X: Feature DataFrame
    
    Returns:
        DataFrame with boosted features
    """
    X_boosted = X.copy()
    
    # Boost news features (2x)
    news_cols = [c for c in X.columns if c.startswith("news_")]
    for col in news_cols:
        X_boosted[col] = X[col] * NEWS_BOOST
    
    # Boost VIX features (1.5x)
    vix_cols = [c for c in X.columns if "vix" in c.lower()]
    for col in vix_cols:
        X_boosted[col] = X[col] * VIX_BOOST
    
    # Boost macro features (1.2x)
    macro_cols = [c for c in X.columns if any(x in c for x in ["cpi", "fedfunds", "hy_oas", "claims", "payrolls"])]
    for col in macro_cols:
        X_boosted[col] = X[col] * MACRO_BOOST
    
    return X_boosted


def add_risk_z_scores(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    risk_cols: List[str] = None
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Add z-scored versions of risk features.
    
    Z-scores help models learn relative positioning.
    
    Args:
        X_train: Training features
        X_test: Test features
        risk_cols: List of columns to z-score (default: auto-detect)
    
    Returns:
        (X_train_augmented, X_test_augmented)
    """
    if risk_cols is None:
        # Auto-detect risk columns
        risk_cols = []
        risk_patterns = ["vix", "hy_oas", "dxy", "breadth_ad", "news_neg", "term10_2"]
        for pattern in risk_patterns:
            risk_cols.extend([c for c in X_train.columns if pattern in c])
        
        # Deduplicate
        risk_cols = list(set(risk_cols))
    
    X_train_aug = X_train.copy()
    X_test_aug = X_test.copy()
    
    for col in risk_cols:
        if col not in X_train.columns:
            continue
        
        # Calculate z-score from training data
        mean = X_train[col].mean()
        std = X_train[col].std()
        
        if std > 1e-8:
            X_train_aug[f"{col}_z"] = (X_train[col] - mean) / std
            X_test_aug[f"{col}_z"] = (X_test[col] - mean) / std
    
    return X_train_aug, X_test_aug


def clip_outliers(X: pd.DataFrame, n_std: float = 5.0) -> pd.DataFrame:
    """
    Clip extreme outliers.
    
    Args:
        X: Feature DataFrame
        n_std: Number of standard deviations for clipping
    
    Returns:
        DataFrame with clipped values
    """
    X_clipped = X.copy()
    
    for col in X.columns:
        if X[col].dtype in [np.float64, np.float32]:
            mean = X[col].mean()
            std = X[col].std()
            
            if std > 1e-8:
                lower = mean - n_std * std
                upper = mean + n_std * std
                X_clipped[col] = X[col].clip(lower=lower, upper=upper)
    
    return X_clipped


def handle_missing_values(X: pd.DataFrame, method: str = "ffill") -> pd.DataFrame:
    """
    Handle missing values in features.
    
    Args:
        X: Feature DataFrame
        method: "ffill", "bfill", "median", or "zero"
    
    Returns:
        DataFrame with imputed values
    """
    X_filled = X.copy()
    
    if method == "ffill":
        X_filled = X_filled.ffill().bfill()
    elif method == "bfill":
        X_filled = X_filled.bfill().ffill()
    elif method == "median":
        X_filled = X_filled.fillna(X_filled.median())
    elif method == "zero":
        X_filled = X_filled.fillna(0)
    else:
        raise ValueError(f"Unknown method: {method}")
    
    return X_filled


def get_feature_groups(X: pd.DataFrame) -> dict:
    """
    Categorize features into groups.
    
    Args:
        X: Feature DataFrame
    
    Returns:
        Dict mapping group name to list of columns
    """
    groups = {
        "technical": [],
        "news": [],
        "macro": [],
        "cross_asset": [],
        "breadth": [],
        "calendar": [],
        "interactions": []
    }
    
    for col in X.columns:
        if col.startswith("news_"):
            groups["news"].append(col)
        elif any(x in col for x in ["ema", "rsi", "macd", "bb_", "atr", "stoch", "obv", "adx", "aroon", "cci"]):
            groups["technical"].append(col)
        elif any(x in col for x in ["cpi", "fedfunds", "hy_oas", "claims", "payrolls", "term", "yc_", "ev_", "surp_"]):
            groups["macro"].append(col)
        elif any(x in col for x in ["vix", "dxy", "gold", "oil", "treasury", "hy_ret"]):
            groups["cross_asset"].append(col)
        elif col.startswith("breadth_"):
            groups["breadth"].append(col)
        elif col.startswith("cal_"):
            groups["calendar"].append(col)
        elif "_x_" in col or col.endswith("_risk") or col.endswith("_stress"):
            groups["interactions"].append(col)
    
    return groups

