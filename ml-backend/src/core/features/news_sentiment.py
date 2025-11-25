"""
News Sentiment Features Module  
Sophisticated 50+ feature module
Ported from multi_factor_model/multifactor/features/news.py

Creates 4 feature blocks:
1. Market-wide (all topics): 12 features
2. Market-wide (macro only): 12 features  
3. Per-ticker (all topics): 12 features
4. Per-ticker (macro only): 12 features
Plus advanced risk flags: 2 features
Total: 50 features
"""

import re
import numpy as np
import pandas as pd
from typing import Dict, Optional


# Macro category keywords
MACRO_CAT_NAMES = {"economy", "economic", "macro", "central bank", "monetary policy"}
EARNINGS_CAT_NAMES = {"earnings", "results"}

# Regex patterns for topic classification
RX_MACRO = re.compile(
    r"\b("
    r"cpi|pce|inflation|deflation|gdp|growth|recession|"
    r"unemployment|jobless|claims|payroll|labor|labour|"
    r"manufacturing|services|pmi|ism|industrial production|durable goods|"
    r"retail sales|consumer confidence|sentiment|housing|home sales|"
    r"fed|fomc|central bank|rate|rates|hike|cut|quantitative tightening|"
    r"yield|treasury|bond|credit|spread"
    r")\b",
    re.I
)

RX_EARN = re.compile(
    r"\b(earnings|eps|revenue|guidance|forecast|profit|results)\b", re.I
)


def build_news_features(
    idx: pd.DatetimeIndex,
    news_mkt_df: pd.DataFrame,
    news_by_ticker: Dict[str, pd.DataFrame],
    ticker: str
) -> pd.DataFrame:
    """
    Build comprehensive news features.
    
    Args:
        idx: Target DatetimeIndex to align features to
        news_mkt_df: Market-wide news DataFrame
        news_by_ticker: Dict mapping ticker to news DataFrame
        ticker: Current ticker
    
    Returns:
        DataFrame with 50 news features aligned to idx
    """
    idx_dt = pd.DatetimeIndex(pd.to_datetime(idx)).tz_localize(None).normalize()
    
    # Parse news DataFrames
    mkt_parsed = _parse_news_df(news_mkt_df)
    
    # Build 4 feature blocks
    mkt_all = _build_block(mkt_parsed, prefix="news_mkt")
    mkt_macro = _build_block(mkt_parsed[mkt_parsed["is_macro"]], prefix="news_mkt_macro")
    
    # Per-ticker news
    tk_df = None
    if isinstance(news_by_ticker, dict) and ticker:
        for key in (str(ticker), str(ticker).upper(), str(ticker).lower()):
            cand = news_by_ticker.get(key)
            if cand is not None and len(cand) > 0:
                tk_df = cand
                break
    
    tk_parsed = _parse_news_df(tk_df)
    if len(tk_parsed):
        # Filter for this ticker
        tk_parsed = tk_parsed[(tk_parsed["symbol"].isna()) | (tk_parsed["symbol"] == str(ticker).upper())]
    
    tk_all = _build_block(tk_parsed, prefix="news_tk")
    tk_macro = _build_block(tk_parsed[tk_parsed["is_macro"]], prefix="news_tk_macro")
    
    # Combine blocks
    feat = pd.concat([mkt_all, mkt_macro, tk_all, tk_macro], axis=1).reindex(idx_dt)
    
    if feat.empty:
        return pd.DataFrame(index=idx_dt)
    
    # Fill missing values appropriately
    for c in feat.columns:
        if ("count_" in c) or ("burst" in c) or ("shock" in c):
            feat[c] = pd.to_numeric(feat[c], errors="coerce").fillna(0.0)
        elif ("sent_mean_" in c):
            feat[c] = pd.to_numeric(feat[c], errors="coerce").ffill()
        elif ("neg_share_" in c):
            feat[c] = pd.to_numeric(feat[c], errors="coerce").fillna(0.0)
    
    # Add advanced risk flags
    feat = _add_risk_flags(feat)
    
    return feat


def _parse_news_df(df: Optional[pd.DataFrame]) -> pd.DataFrame:
    """
    Normalize news DataFrame.
    
    Returns DataFrame with columns:
    - date: tz-naive midnight
    - sentiment: float
    - symbol: ticker or None
    - is_macro: bool
    - is_earn: bool
    - weight: relevance weight
    """
    if df is None or len(df) == 0:
        return pd.DataFrame(columns=["date", "sentiment", "symbol", "is_macro", "is_earn", "weight"])
    
    out = df.copy()
    
    # Parse date
    time_col = None
    for c in ("published_at", "published", "time", "timestamp", "date", "datetime"):
        if c in out.columns:
            time_col = c
            break
    
    if time_col is None:
        return pd.DataFrame(columns=["date", "sentiment", "symbol", "is_macro", "is_earn", "weight"])
    
    out["date"] = pd.to_datetime(out[time_col], errors="coerce").dt.tz_localize(None).dt.normalize()
    out = out.dropna(subset=["date"])
    
    # Parse symbol
    sym = None
    for c in ("symbol", "symbols", "ticker", "tickers"):
        if c in out.columns:
            sym_col = out[c]
            # Handle list/tuple/set
            if sym_col.apply(lambda x: isinstance(x, (list, tuple, set))).any():
                sym_col = sym_col.apply(lambda xs: list(xs)[0] if isinstance(xs, (list, tuple, set)) and len(xs) else None)
            sym = sym_col.astype(str).str.upper().str.split(",").str[0]
            break
    out["symbol"] = sym if sym is not None else None
    
    # Parse sentiment
    if "sentiment" in out.columns:
        s = pd.to_numeric(out["sentiment"], errors="coerce")
    elif {"sentiment_score_pos", "sentiment_score_neg"}.issubset(out.columns):
        pos = pd.to_numeric(out["sentiment_score_pos"], errors="coerce").fillna(0.0)
        neg = pd.to_numeric(out["sentiment_score_neg"], errors="coerce").fillna(0.0)
        s = pos - neg
    else:
        s = pd.Series(0.0, index=out.index)
    
    out["sentiment"] = s.astype(float).replace([np.inf, -np.inf], np.nan).fillna(0.0)
    
    # Parse relevance weight
    w = None
    for c in ("relevance", "relevance_score", "rank", "score"):
        if c in out.columns:
            w = pd.to_numeric(out[c], errors="coerce")
            break
    out["weight"] = (w.fillna(1.0).clip(lower=0.0, upper=10.0).astype(float) if w is not None 
                     else pd.Series(1.0, index=out.index))
    
    # Topic classification
    cats = None
    for c in ("category", "categories", "topic", "topics", "tags"):
        if c in out.columns:
            cats = out[c].astype(str).str.lower()
            break
    
    # Combine text fields
    text_cols = [out[c] for c in ["title", "headline", "description", "summary"] 
                 if c in out.columns]
    text_blob = ""
    if text_cols:
        text_blob = text_cols[0].astype(str)
        for col in text_cols[1:]:
            text_blob = text_blob.str.cat(col.astype(str), sep=" | ", na_rep="")
        text_blob = text_blob.str.lower()
    
    # Classify topics
    if cats is not None:
        is_macro = cats.apply(lambda x: any(t in x for t in MACRO_CAT_NAMES))
        is_earn = cats.apply(lambda x: any(t in x for t in EARNINGS_CAT_NAMES))
    else:
        is_macro = text_blob.str.contains(RX_MACRO, regex=True, na=False) if len(text_blob) else pd.Series(False, index=out.index)
        is_earn = text_blob.str.contains(RX_EARN, regex=True, na=False) if len(text_blob) else pd.Series(False, index=out.index)
    
    out["is_macro"] = is_macro.astype(bool)
    out["is_earn"] = is_earn.astype(bool)
    
    # Deduplicate
    if "title" in out.columns:
        out = out.sort_values("date").drop_duplicates(subset=["date", "title"], keep="last")
    
    return out[["date", "sentiment", "symbol", "is_macro", "is_earn", "weight"]]


def _daily_agg(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate news to daily level.
    
    Returns:
    - count: number of articles
    - pos: positive count (weighted)
    - neg: negative count (weighted)
    - neg_share: % negative
    - sent_mean: weighted average sentiment
    """
    if df is None or len(df) == 0:
        idx = pd.DatetimeIndex([], name="date")
        return pd.DataFrame({
            "count": pd.Series(dtype=float, index=idx),
            "pos": pd.Series(dtype=float, index=idx),
            "neg": pd.Series(dtype=float, index=idx),
            "neg_share": pd.Series(dtype=float, index=idx),
            "sent_mean": pd.Series(dtype=float, index=idx)
        })
    
    g = df.groupby("date")
    wsum = g["weight"].sum().rename("w")
    sent_wsum = (df["sentiment"] * df["weight"]).groupby(df["date"]).sum().reindex(wsum.index).fillna(0.0)
    sent_mean = (sent_wsum / wsum.replace(0, np.nan)).fillna(0.0)
    
    pos = ((df["sentiment"] > 0).astype(float) * df["weight"]).groupby(df["date"]).sum().reindex(wsum.index).fillna(0.0)
    neg = ((df["sentiment"] < 0).astype(float) * df["weight"]).groupby(df["date"]).sum().reindex(wsum.index).fillna(0.0)
    
    daily = pd.DataFrame({
        "count": g.size().astype(float),
        "pos": pos,
        "neg": neg,
        "neg_share": (neg / (pos + neg + 1e-8)).astype(float),
        "sent_mean": sent_mean.astype(float)
    })
    
    if not isinstance(daily.index, pd.DatetimeIndex):
        daily.index = pd.to_datetime(daily.index)
    daily.index = daily.index.tz_localize(None)
    
    return daily.sort_index()


def _rolling_features(daily: pd.DataFrame, prefix: str, windows=(3, 5, 10, 20)) -> pd.DataFrame:
    """
    Compute rolling features from daily aggregates.
    
    Returns 12 features per block:
    - count_{3,5,10,20}d: Rolling article counts
    - sent_mean_{3,5,10,20}d: Rolling average sentiment
    - shock: 60-day z-score of count (spike detection)
    - burst: 5-day count / 60-day mean (acceleration)
    - neg_share_{10,20}d: Rolling % negative
    """
    out = pd.DataFrame(index=daily.index)
    
    if daily is None or len(daily) == 0:
        cols = (
            [f"{prefix}_count_{w}d" for w in windows] +
            [f"{prefix}_sent_mean_{w}d" for w in windows] +
            [f"{prefix}_shock", f"{prefix}_burst", 
             f"{prefix}_neg_share_10d", f"{prefix}_neg_share_20d"]
        )
        return pd.DataFrame(columns=cols, index=pd.DatetimeIndex([]))
    
    # Rolling counts and sentiment
    for w in windows:
        out[f"{prefix}_count_{w}d"] = daily["count"].rolling(w, min_periods=1).sum()
        out[f"{prefix}_sent_mean_{w}d"] = daily["sent_mean"].rolling(w, min_periods=1).mean()
    
    # Shock: 60-day z-score of count
    mean60 = daily["count"].rolling(60, min_periods=20).mean()
    std60 = daily["count"].rolling(60, min_periods=20).std()
    out[f"{prefix}_shock"] = (daily["count"] - mean60) / (std60.replace(0, np.nan) + 1e-8)
    
    # Burst: acceleration ratio
    count_5d = daily["count"].rolling(5, min_periods=1).sum()
    out[f"{prefix}_burst"] = count_5d / (mean60.replace(0, np.nan) + 1e-8)
    
    # Negative share
    out[f"{prefix}_neg_share_10d"] = daily["neg_share"].rolling(10, min_periods=3).mean()
    out[f"{prefix}_neg_share_20d"] = daily["neg_share"].rolling(20, min_periods=5).mean()
    
    return out


def _build_block(df: pd.DataFrame, prefix: str) -> pd.DataFrame:
    """Build 12 features for a news block."""
    daily = _daily_agg(df)
    return _rolling_features(daily, prefix=prefix)


def _add_risk_flags(feat: pd.DataFrame) -> pd.DataFrame:
    """
    Add advanced risk flags.
    
    - news_macro_risk_flag: High macro shock + negative sentiment
    - news_burst_risk_flag: News volume acceleration
    """
    # Macro risk: big shock + high negativity
    if "news_mkt_macro_shock" in feat.columns and "news_mkt_macro_neg_share_10d" in feat.columns:
        macro_shock = feat["news_mkt_macro_shock"].abs()
        macro_neg = feat["news_mkt_macro_neg_share_10d"]
        feat["news_macro_risk_flag"] = ((macro_shock > 2.5) & (macro_neg > 0.55)).astype(float)
    
    # Burst risk: rapid acceleration
    if "news_mkt_burst" in feat.columns:
        feat["news_burst_risk_flag"] = (feat["news_mkt_burst"] > 2.0).astype(float)
    
    return feat

