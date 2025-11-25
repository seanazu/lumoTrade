"""
Macro Economic Features Module
45+ features from FRED series and macro surprises
Ported from multi_factor_model/multifactor/features/macro.py
"""

import numpy as np
import pandas as pd
from typing import Dict, Optional


def build_macro_features(
    idx: pd.DatetimeIndex,
    fred_series: Dict[str, pd.Series],
    macro_surprises: Optional[pd.DataFrame] = None
) -> pd.DataFrame:
    """
    Build comprehensive macro feature set.
    
    Args:
        idx: Target DatetimeIndex to align features to
        fred_series: Dict of FRED series
        macro_surprises: Macro event surprises from FMP
    
    Returns:
        DataFrame with 45+ macro features
    """
    idx_dt = pd.DatetimeIndex(pd.to_datetime(idx)).tz_localize(None).normalize()
    
    # Remove duplicates from target index
    if idx_dt.duplicated().any():
        idx_dt = idx_dt[~idx_dt.duplicated(keep='first')]
    
    # 1. Level features (30)
    level_feat = _build_macro_level_features(idx_dt, fred_series)
    
    # 2. Event features (15)
    event_feat = build_macro_event_features(idx_dt, macro_surprises) if macro_surprises is not None else pd.DataFrame(index=idx_dt)
    
    # Combine
    result = pd.concat([level_feat, event_feat], axis=1)
    
    return result


def _build_macro_level_features(
    idx: pd.DatetimeIndex,
    fred_series: Dict[str, pd.Series]
) -> pd.DataFrame:
    """
    Build macro level and derived features (30 features).
    """
    out = pd.DataFrame(index=idx)
    
    # === Yields & Rates (8) ===
    r2 = _align_series(fred_series.get("DGS2"), idx, "r2")
    r10 = _align_series(fred_series.get("DGS10"), idx, "r10")
    r30 = _align_series(fred_series.get("DGS30"), idx, "r30")
    fedfunds = _align_series(fred_series.get("FEDFUNDS"), idx, "fedfunds")
    
    if r2 is not None:
        out["r2"] = r2
    if r10 is not None:
        out["r10"] = r10
    if r30 is not None:
        out["r30"] = r30
    
    # Yield curve
    if r10 is not None and r2 is not None:
        term10_2 = r10 - r2
        out["term10_2"] = term10_2
        out["term_chg20"] = term10_2.diff(20)
        out["yc_inverted"] = (term10_2 < 0).astype(float)
    
    if fedfunds is not None:
        out["fedfunds"] = fedfunds
        out["fedfunds_chg60"] = fedfunds.diff(60)
    
    # === Inflation (5) ===
    cpi = _align_series(fred_series.get("CPIAUCSL"), idx, "cpi")
    core_cpi = _align_series(fred_series.get("CPILFESL"), idx, "core_cpi")
    
    if cpi is not None:
        cpi_yoy = cpi.pct_change(252) * 100  # Annualized
        cpi_mom = cpi.pct_change(21) * 100  # Monthly
        out["cpi_yoy"] = cpi_yoy
        out["cpi_mom"] = cpi_mom
    
    if core_cpi is not None:
        out["core_cpi_yoy"] = core_cpi.pct_change(252) * 100
    
    # === Credit Spreads (4) ===
    hy_oas = _align_series(fred_series.get("BAMLH0A0HYM2"), idx, "hy_oas")
    bbb_oas = _align_series(fred_series.get("BAMLC0A4CBBB"), idx, "bbb_oas")
    
    if hy_oas is not None:
        out["hy_oas"] = hy_oas
        # Z-score (stress indicator)
        mean = hy_oas.rolling(252, min_periods=60).mean()
        std = hy_oas.rolling(252, min_periods=60).std()
        out["hy_oas_z"] = (hy_oas - mean) / (std + 1e-8)
    
    if bbb_oas is not None:
        out["bbb_oas"] = bbb_oas
    
    # === Labor Market (5) ===
    claims = _align_series(fred_series.get("ICSA"), idx, "claims")
    payrolls = _align_series(fred_series.get("PAYEMS"), idx, "payrolls")
    
    if claims is not None:
        claims_4w = claims.rolling(20, min_periods=15).mean()
        out["claims_4w"] = claims_4w
        out["claims_trend8w"] = claims_4w.diff(40)
    
    if payrolls is not None:
        out["payrolls_3mma"] = payrolls.rolling(63, min_periods=40).mean()
    
    # === Activity & Sentiment (8) ===
    retail = _align_series(fred_series.get("RSXFS"), idx, "retail")
    confidence = _align_series(fred_series.get("UMCSENT"), idx, "confidence")
    
    # PMI data (if available)
    # Note: FRED doesn't have ISM directly, would need from FMP or other source
    # For now, we'll use industrial production as proxy
    indpro = _align_series(fred_series.get("INDPRO"), idx, "indpro")
    
    if retail is not None:
        out["retail_mom"] = retail.pct_change(21) * 100
    
    if confidence is not None:
        out["confidence"] = confidence
        out["confidence_chg6m"] = confidence.diff(126)
    
    if indpro is not None:
        out["indpro_3m"] = indpro.pct_change(63) * 100
    
    return out


def build_macro_event_features(
    idx: pd.DatetimeIndex,
    macro_surprises: pd.DataFrame
) -> pd.DataFrame:
    """
    Build macro event features (15 features).
    
    Creates event windows (T-1, T, T+1) and surprise magnitude for:
    - CPI
    - NFP (Nonfarm Payrolls)
    - PMI (Manufacturing & Services)
    - FOMC
    """
    out = pd.DataFrame(index=idx)
    
    if macro_surprises is None or macro_surprises.empty:
        event_cols = []
        for evt in ["cpi", "nfp", "pmi_mfg", "pmi_srv", "fomc"]:
            event_cols.extend([
                f"ev_{evt}_m1", f"ev_{evt}_0", f"ev_{evt}_p1",
                f"surp_{evt}"
            ])
        for col in event_cols:
            out[col] = 0.0
        return out
    
    # Align surprises to idx
    surp_df = macro_surprises.copy()
    if not isinstance(surp_df.index, pd.DatetimeIndex):
        surp_df.index = pd.to_datetime(surp_df.index)
    surp_df.index = surp_df.index.tz_localize(None).normalize()
    surp_df = surp_df.reindex(idx, fill_value=0.0)
    
    # For each event type, create T-1, T, T+1 dummies and surprise value
    events = {
        "cpi": "cpi_surprise",
        "nfp": "nfp_surprise",
        "pmi_mfg": "pmi_mfg_surprise",
        "pmi_srv": "pmi_srv_surprise"
    }
    
    for evt_name, surp_col in events.items():
        if surp_col in surp_df.columns:
            surp = surp_df[surp_col].fillna(0.0)
            
            # Event occurred (any surprise != 0)
            event_flag = (surp.abs() > 1e-6).astype(float)
            
            # T-1, T, T+1 dummies
            out[f"ev_{evt_name}_m1"] = event_flag.shift(1, fill_value=0.0)
            out[f"ev_{evt_name}_0"] = event_flag
            out[f"ev_{evt_name}_p1"] = event_flag.shift(-1, fill_value=0.0)
            
            # Surprise magnitude
            out[f"surp_{evt_name}"] = surp
    
    # FOMC is special (binary flag from macro_surprises)
    if "fomc_day" in surp_df.columns:
        fomc_flag = surp_df["fomc_day"].fillna(0.0).astype(float)
        out["ev_fomc_m1"] = fomc_flag.shift(1, fill_value=0.0)
        out["ev_fomc_0"] = fomc_flag
        out["ev_fomc_p1"] = fomc_flag.shift(-1, fill_value=0.0)
        
        # Rate surprise
        if "rate_surprise" in surp_df.columns:
            out["surp_fomc"] = surp_df["rate_surprise"].fillna(0.0)
        else:
            out["surp_fomc"] = 0.0
    else:
        for suffix in ["_m1", "_0", "_p1"]:
            out[f"ev_fomc{suffix}"] = 0.0
        out["surp_fomc"] = 0.0
    
    return out


def _align_series(
    series: Optional[pd.Series],
    idx: pd.DatetimeIndex,
    name: str
) -> Optional[pd.Series]:
    """Align FRED series to target index with forward fill."""
    if series is None or series.empty:
        return None
    
    s = series.copy()
    if not isinstance(s.index, pd.DatetimeIndex):
        s.index = pd.to_datetime(s.index)
    s.index = s.index.tz_localize(None).normalize()
    
    # Remove duplicates from series
    if s.index.duplicated().any():
        s = s[~s.index.duplicated(keep='last')]
    
    # Forward fill macro data (released with lag)
    s = s.reindex(idx.union(s.index)).sort_index().ffill()
    s = s.reindex(idx)
    s.name = name
    
    return s

