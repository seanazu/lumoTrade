"""
Interaction Features Module
20+ non-linear feature combinations
These are HIGHLY PREDICTIVE according to multi-factor model insights
"""

import numpy as np
import pandas as pd


def build_interaction_features(base_features: pd.DataFrame) -> pd.DataFrame:
    """
    Build interaction features from base feature set.
    
    Args:
        base_features: DataFrame with all base features
    
    Returns:
        DataFrame with 20+ interaction features
    
    Key Insights from Multi-Factor Model:
    - vix_x_newsneg: High VIX + negative news = crash risk
    - vix_x_term: VIX level × term structure = regime
    - macro_risk: Credit stress + negative macro news
    """
    out = pd.DataFrame(index=base_features.index)
    
    # === 1. VIX × News Interactions (5) ===
    
    # Crash risk indicator
    if "vix" in base_features.columns and "news_mkt_sent_mean_20d" in base_features.columns:
        vix = base_features["vix"]
        news_neg = -base_features["news_mkt_sent_mean_20d"]  # Flip to make negative values positive
        out["vix_x_newsneg"] = vix * news_neg
    
    # VIX × News shock
    if "vix" in base_features.columns and "news_mkt_macro_shock" in base_features.columns:
        out["vix_x_newsshock"] = base_features["vix"] * base_features["news_mkt_macro_shock"].abs()
    
    # VIX × Term structure
    if "vix" in base_features.columns and "vix_term" in base_features.columns:
        out["vix_x_term"] = base_features["vix"] * base_features["vix_term"]
    
    # VIX × Negative share
    if "vix" in base_features.columns and "news_mkt_macro_neg_share_10d" in base_features.columns:
        out["vix_x_negnews"] = base_features["vix"] * base_features["news_mkt_macro_neg_share_10d"]
    
    # VIX level × VIX change
    if "vix" in base_features.columns and "vix_chg10" in base_features.columns:
        out["vix_x_vixchg"] = base_features["vix"] * base_features["vix_chg10"]
    
    # === 2. Macro × News Interactions (4) ===
    
    # Credit stress × Negative macro news
    if "hy_oas_z" in base_features.columns and "news_mkt_macro_neg_share_10d" in base_features.columns:
        out["macro_risk"] = base_features["hy_oas_z"] * base_features["news_mkt_macro_neg_share_10d"]
    
    # Yield curve × News sentiment
    if "term10_2" in base_features.columns and "news_mkt_sent_mean_20d" in base_features.columns:
        out["yc_x_news"] = base_features["term10_2"] * base_features["news_mkt_sent_mean_20d"]
    
    # Inverted curve × VIX
    if "yc_inverted" in base_features.columns and "vix" in base_features.columns:
        out["inversion_stress"] = base_features["yc_inverted"] * base_features["vix"]
    
    # Claims trend × Sentiment
    if "claims_trend8w" in base_features.columns and "news_mkt_sent_mean_20d" in base_features.columns:
        out["labor_x_sentiment"] = base_features["claims_trend8w"] * base_features["news_mkt_sent_mean_20d"]
    
    # === 3. Breadth × Sentiment Interactions (3) ===
    
    # Breadth momentum × News sentiment
    if "breadth_pct_above_50" in base_features.columns and "news_mkt_sent_mean_20d" in base_features.columns:
        breadth_momentum = base_features["breadth_pct_above_50"].diff(10)
        out["breadth_mom_x_news"] = breadth_momentum * base_features["news_mkt_sent_mean_20d"]
    
    # AD ratio × VIX
    if "breadth_ad_ratio" in base_features.columns and "vix" in base_features.columns:
        out["ad_x_vix"] = base_features["breadth_ad_ratio"] * base_features["vix"]
    
    # New highs-lows × Sentiment
    if "breadth_nh_minus_nl" in base_features.columns and "news_mkt_sent_mean_20d" in base_features.columns:
        out["nh_nl_x_news"] = base_features["breadth_nh_minus_nl"] * base_features["news_mkt_sent_mean_20d"]
    
    # === 4. Technical × Macro Interactions (4) ===
    
    # RSI × VIX (oversold in stress)
    if "rsi14" in base_features.columns and "vix" in base_features.columns:
        rsi_oversold = (30 - base_features["rsi14"]).clip(lower=0)
        out["rsi_oversold_x_vix"] = rsi_oversold * base_features["vix"]
    
    # Price vs EMA50 × Yield curve
    if "price_vs_ema50" in base_features.columns and "term10_2" in base_features.columns:
        out["trend_x_yc"] = base_features["price_vs_ema50"] * base_features["term10_2"]
    
    # ATR × VIX (volatility regime)
    if "atr_norm" in base_features.columns and "vix" in base_features.columns:
        out["atr_x_vix"] = base_features["atr_norm"] * base_features["vix"]
    
    # Bollinger width × Credit spreads
    if "bb_width" in base_features.columns and "hy_oas_z" in base_features.columns:
        out["bb_x_credit"] = base_features["bb_width"] * base_features["hy_oas_z"]
    
    # === 5. Cross-Asset Interactions (4) ===
    
    # Dollar × Oil (inverse relationship)
    if "dxy_ret10" in base_features.columns and "oil_ret10" in base_features.columns:
        out["dxy_x_oil"] = base_features["dxy_ret10"] * base_features["oil_ret10"]
    
    # Gold × VIX (safe haven)
    if "gold_ret10" in base_features.columns and "vix" in base_features.columns:
        out["gold_x_vix"] = base_features["gold_ret10"] * base_features["vix"]
    
    # Dollar × Treasury (flight to quality)
    if "dxy_ret10" in base_features.columns and "treasury_ret10" in base_features.columns:
        out["dxy_x_treasury"] = base_features["dxy_ret10"] * base_features["treasury_ret10"]
    
    # HY bonds × VIX (risk-off indicator)
    if "hy_ret10" in base_features.columns and "vix_chg10" in base_features.columns:
        out["hy_x_vixchg"] = base_features["hy_ret10"] * base_features["vix_chg10"]
    
    # Replace inf/nan
    out = out.replace([np.inf, -np.inf], np.nan)
    
    return out

