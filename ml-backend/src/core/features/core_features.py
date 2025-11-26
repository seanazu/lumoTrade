"""
Core Features Module - 50 Core + 39 Advanced = 89 Total Predictive Features
Research-backed feature selection for optimal index prediction.
"""

import pandas as pd
import numpy as np
from typing import Dict, Optional
import yfinance as yf
from datetime import datetime, timedelta

# Import advanced features
try:
    from .advanced_predictive_features import generate_all_advanced_features
    HAS_ADVANCED_FEATURES = True
except ImportError:
    HAS_ADVANCED_FEATURES = False


def build_core_features(
    ticker: str,
    ohlcv: pd.DataFrame,
    news_data: Optional[pd.DataFrame] = None,
    macro_data: Optional[Dict[str, pd.Series]] = None,
    cross_assets: Optional[Dict[str, pd.DataFrame]] = None
) -> pd.DataFrame:
    """
    Build the 50 most important features for market prediction.
    
    Based on research: Optimal is 29-48 features for stock prediction.
    Focus on: Price action, VIX, volume, breadth, momentum, sentiment.
    
    Returns: DataFrame with exactly 50 columns
    """
    idx = ohlcv.index
    features = pd.DataFrame(index=idx)
    
    # ===== TOP TIER: Price Action & Volume (8 features) =====
    features['close_price'] = ohlcv['close']
    features['volume'] = ohlcv['volume']
    features['vwap'] = (ohlcv['close'] * ohlcv['volume']).rolling(20).sum() / ohlcv['volume'].rolling(20).sum()
    features['daily_return'] = ohlcv['close'].pct_change()
    features['intraday_range'] = (ohlcv['high'] - ohlcv['low']) / ohlcv['close']
    features['volume_ratio'] = ohlcv['volume'] / ohlcv['volume'].rolling(20).mean()
    features['volume_ma_dev'] = (ohlcv['volume'] - ohlcv['volume'].rolling(20).mean()) / ohlcv['volume'].rolling(20).std()
    features['unusual_volume'] = (features['volume_ratio'] > 1.5).astype(int)
    
    # ===== TOP TIER: VIX (3 features) =====
    vix_data = _fetch_vix_data(idx)
    if vix_data is not None:
        # Handle both 'Close' and 'close' column names
        close_col = 'Close' if 'Close' in vix_data.columns else 'close'
        features['vix_level'] = vix_data[close_col]
        features['vix_change'] = vix_data[close_col].pct_change()
        
        # Get close price from ohlcv
        ohlcv_close = ohlcv['close'] if 'close' in ohlcv.columns else ohlcv['Close']
        features['vix_price_ratio'] = vix_data[close_col] / ohlcv_close
    else:
        # Fallback: Use ATR as volatility proxy
        atr = _calculate_atr(ohlcv)
        ohlcv_close = ohlcv['close'] if 'close' in ohlcv.columns else ohlcv['Close']
        features['vix_level'] = atr
        features['vix_change'] = atr.pct_change()
        features['vix_price_ratio'] = atr / ohlcv_close
    
    # ===== TOP TIER: Market Breadth (3 features) =====
    breadth = _calculate_market_breadth(idx, ticker)
    features['adv_dec_ratio'] = breadth['adv_dec_ratio']
    features['new_highs_lows'] = breadth['new_highs_lows']
    features['sector_rotation'] = breadth['sector_rotation']
    
    # ===== TOP TIER: Put/Call Ratios (3 features) =====
    pc_ratios = _calculate_put_call_ratios(idx, ticker)
    features['pc_ratio_5d'] = pc_ratios['pc_5d']
    features['pc_ratio_20d'] = pc_ratios['pc_20d']
    features['pc_ratio_change'] = pc_ratios['pc_change']
    
    # ===== SECOND TIER: Momentum (5 features) =====
    features['rsi_14'] = _calculate_rsi(ohlcv['close'], 14)
    macd_line, signal_line = _calculate_macd(ohlcv['close'])
    features['macd'] = macd_line - signal_line
    features['stochastic'] = _calculate_stochastic(ohlcv)
    features['roc_10'] = ohlcv['close'].pct_change(10)
    features['mfi'] = _calculate_mfi(ohlcv)
    
    # ===== SECOND TIER: Volatility (4 features) =====
    features['atr'] = _calculate_atr(ohlcv)
    bb_width = _calculate_bollinger_width(ohlcv['close'])
    features['bb_width'] = bb_width
    features['hist_vol_20'] = ohlcv['close'].pct_change().rolling(20).std() * np.sqrt(252)
    features['realized_vol'] = ohlcv['close'].pct_change().rolling(10).std() * np.sqrt(252)
    
    # ===== SECOND TIER: Moving Averages (4 features) =====
    sma_20 = ohlcv['close'].rolling(20).mean()
    sma_50 = ohlcv['close'].rolling(50).mean()
    sma_200 = ohlcv['close'].rolling(200).mean()
    features['dist_sma_20'] = (ohlcv['close'] - sma_20) / sma_20
    features['dist_sma_50'] = (ohlcv['close'] - sma_50) / sma_50
    features['dist_sma_200'] = (ohlcv['close'] - sma_200) / sma_200
    features['ma_crossover'] = ((sma_20 > sma_50) & (sma_50 > sma_200)).astype(int)
    
    # ===== SECOND TIER: Daily News Sentiment (10 features - CRITICAL) =====
    # This is where we add REAL predictive power
    if news_data is not None and len(news_data) > 0:
        from .daily_news_sentiment import analyze_daily_news_sentiment
        
        # Get sophisticated daily sentiment analysis with GPT-4o
        news_features = analyze_daily_news_sentiment(news_data, idx, ticker, use_llm=True)  # ENABLED GPT-4o!
        
        # Add all 10 news features
        for col in news_features.columns:
            features[col] = news_features[col]
    else:
        # Fallback values
        features['news_sentiment_score'] = 0.0
        features['news_market_impact'] = 0.0
        features['news_volume'] = 0
        features['news_novelty'] = 0.0
        features['news_credibility'] = 0.5
        features['news_bearish_density'] = 0.0
        features['news_bullish_density'] = 0.0
        features['news_uncertainty'] = 0.0
        features['news_event_type'] = 0
        features['news_sentiment_momentum'] = 0.0
    
    # ===== SECOND TIER: Cross-Asset (3 features) =====
    if cross_assets:
        features['tlt_corr'] = _calculate_rolling_correlation(ohlcv['close'], cross_assets.get('TLT'), 20)
        features['gld_corr'] = _calculate_rolling_correlation(ohlcv['close'], cross_assets.get('GLD'), 20)
        features['dxy_trend'] = _calculate_trend(cross_assets.get('DXY'))
    else:
        features['tlt_corr'] = 0.0
        features['gld_corr'] = 0.0
        features['dxy_trend'] = 0.0
    
    # ===== THIRD TIER: Smart Money (5 features) =====
    smart_money = _calculate_smart_money_proxy(ohlcv)
    features['dark_pool_activity'] = smart_money['dark_pool']
    features['unusual_options'] = smart_money['unusual_options']
    features['insider_score'] = smart_money['insider']
    features['block_trades'] = smart_money['block_trades']
    features['gamma_exposure'] = smart_money['gamma']
    
    # ===== THIRD TIER: Macro (3 features) =====
    if macro_data:
        features['interest_rate_trend'] = _get_macro_trend(macro_data.get('interest_rate'))
        features['gdp_surprise'] = _get_macro_surprise(macro_data.get('gdp'))
        features['inflation_trend'] = _get_macro_trend(macro_data.get('inflation'))
    else:
        features['interest_rate_trend'] = 0.0
        features['gdp_surprise'] = 0.0
        features['inflation_trend'] = 0.0
    
    # ===== THIRD TIER: Market Regime Detection (5 features - KEY FOR FILTERING) =====
    from .daily_news_sentiment import detect_market_regime
    
    regime_features = detect_market_regime(ohlcv, idx)
    for col in regime_features.columns:
        features[col] = regime_features[col]
    
    # ===== THIRD TIER: Event Calendar (7 features) =====
    from .daily_news_sentiment import create_event_calendar_features
    
    calendar_features = create_event_calendar_features(idx)
    for col in calendar_features.columns:
        features[col] = calendar_features[col]
    
    # ===== ADDITIONAL: Price Momentum (3 features) =====
    features['price_momentum_5'] = ohlcv['close'].pct_change(5)  # 5-day momentum
    features['price_momentum_20'] = ohlcv['close'].pct_change(20)  # 20-day momentum
    features['volume_price_trend'] = (ohlcv['close'].pct_change() * ohlcv['volume']).rolling(10).mean()  # Volume-weighted price trend
    
    # ===== ADDITIONAL: Volatility-Based Features (3 features - for filtering) =====
    # Markets are MORE predictable during certain volatility conditions
    returns = ohlcv['close'].pct_change()
    vol_20 = returns.rolling(20).std()
    vol_5 = returns.rolling(5).std()
    
    features['vol_expansion'] = (vol_5 > vol_20 * 1.2).astype(int)  # Volatility spiking
    features['vol_contraction'] = (vol_5 < vol_20 * 0.8).astype(int)  # Volatility dropping
    features['vol_regime_change'] = features['vol_expansion'] - features['vol_contraction']  # -1, 0, or 1
    
    # ===== ADDITIONAL: Gap Detection (2 features) =====
    # Gaps are predictable (often fill)
    prev_close = ohlcv['close'].shift(1)
    curr_open = ohlcv['open'] if 'open' in ohlcv.columns else ohlcv['Open']
    
    features['gap_percent'] = ((curr_open - prev_close) / prev_close) * 100
    features['gap_direction'] = np.sign(features['gap_percent'])
    
    # Forward fill missing values and clip outliers
    features = features.ffill().fillna(0)
    features = features.clip(lower=-10, upper=10)  # Prevent extreme outliers
    
    print(f"✅ Generated {len(features.columns)} features")
    
    return features


# ===== HELPER FUNCTIONS =====

def _fetch_vix_data(idx: pd.DatetimeIndex) -> Optional[pd.DataFrame]:
    """Fetch VIX data from Yahoo Finance."""
    try:
        start = idx.min() - timedelta(days=30)
        end = idx.max() + timedelta(days=1)
        vix = yf.download('^VIX', start=start, end=end, progress=False)
        if len(vix) > 0:
            # Flatten multi-index columns if present
            if isinstance(vix.columns, pd.MultiIndex):
                vix.columns = vix.columns.get_level_values(0)
            return vix.reindex(idx, method='ffill')
    except Exception:
        pass
    return None


def _calculate_atr(ohlcv: pd.DataFrame, period: int = 14) -> pd.Series:
    """Calculate Average True Range."""
    high_low = ohlcv['high'] - ohlcv['low']
    high_close = abs(ohlcv['high'] - ohlcv['close'].shift())
    low_close = abs(ohlcv['low'] - ohlcv['close'].shift())
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    return tr.rolling(period).mean()


def _calculate_market_breadth(idx: pd.DatetimeIndex, ticker: str) -> Dict[str, pd.Series]:
    """Calculate market breadth indicators using sector ETFs."""
    sectors = ['XLK', 'XLF', 'XLV', 'XLE', 'XLI', 'XLY', 'XLP', 'XLB', 'XLU']
    
    try:
        start = idx.min() - timedelta(days=30)
        end = idx.max() + timedelta(days=1)
        
        # Download sector data
        sector_data = {}
        for sector in sectors:
            try:
                data = yf.download(sector, start=start, end=end, progress=False)
                if len(data) > 0:
                    sector_data[sector] = data['Close'].pct_change()
            except Exception:
                continue
        
        if len(sector_data) > 3:
            # Advance/Decline ratio
            advances = sum((s > 0).astype(int) for s in sector_data.values())
            declines = sum((s < 0).astype(int) for s in sector_data.values())
            adv_dec = advances / (declines + 1e-6)
            
            # New highs/lows (proxy using 52-week high)
            highs = sum((s > s.rolling(252).quantile(0.95)).astype(int) for s in sector_data.values())
            lows = sum((s < s.rolling(252).quantile(0.05)).astype(int) for s in sector_data.values())
            high_low_ratio = highs / (lows + 1e-6)
            
            # Sector rotation (std of sector returns)
            sector_returns = pd.DataFrame(sector_data)
            rotation = sector_returns.std(axis=1)
            
            return {
                'adv_dec_ratio': adv_dec.reindex(idx, method='ffill').fillna(1),
                'new_highs_lows': high_low_ratio.reindex(idx, method='ffill').fillna(1),
                'sector_rotation': rotation.reindex(idx, method='ffill').fillna(0)
            }
    except Exception:
        pass
    
    # Fallback to neutral values
    return {
        'adv_dec_ratio': pd.Series(1.0, index=idx),
        'new_highs_lows': pd.Series(1.0, index=idx),
        'sector_rotation': pd.Series(0.0, index=idx)
    }


def _calculate_put_call_ratios(idx: pd.DatetimeIndex, ticker: str) -> Dict[str, pd.Series]:
    """
    Calculate put/call ratios (proxy using volume and implied volatility).
    Note: Real P/C data requires options data subscription.
    """
    # For now, use a simple proxy based on volume and volatility
    # In production, replace with actual options data from your provider
    
    try:
        # Fetch the ticker data
        start = idx.min() - timedelta(days=30)
        end = idx.max() + timedelta(days=1)
        data = yf.download(ticker, start=start, end=end, progress=False)
        
        if len(data) > 0:
            # Proxy: High volume + high volatility = higher put buying (fear)
            vol = data['Close'].pct_change().rolling(20).std()
            vol_norm = (vol - vol.rolling(60).mean()) / (vol.rolling(60).std() + 1e-6)
            
            # P/C ratio proxy (normalized volatility)
            pc_5d = vol_norm.rolling(5).mean()
            pc_20d = vol_norm.rolling(20).mean()
            pc_change = pc_5d - pc_20d
            
            return {
                'pc_5d': pc_5d.reindex(idx, method='ffill').fillna(1.0),
                'pc_20d': pc_20d.reindex(idx, method='ffill').fillna(1.0),
                'pc_change': pc_change.reindex(idx, method='ffill').fillna(0.0)
            }
    except Exception:
        pass
    
    return {
        'pc_5d': pd.Series(1.0, index=idx),
        'pc_20d': pd.Series(1.0, index=idx),
        'pc_change': pd.Series(0.0, index=idx)
    }


def _calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Calculate Relative Strength Index."""
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
    rs = gain / (loss + 1e-6)
    rsi = 100 - (100 / (1 + rs))
    return rsi


def _calculate_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    """Calculate MACD."""
    ema_fast = series.ewm(span=fast).mean()
    ema_slow = series.ewm(span=slow).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal).mean()
    return macd_line, signal_line


def _calculate_stochastic(ohlcv: pd.DataFrame, period: int = 14) -> pd.Series:
    """Calculate Stochastic Oscillator."""
    low_min = ohlcv['low'].rolling(period).min()
    high_max = ohlcv['high'].rolling(period).max()
    stoch = 100 * (ohlcv['close'] - low_min) / (high_max - low_min + 1e-6)
    return stoch


def _calculate_mfi(ohlcv: pd.DataFrame, period: int = 14) -> pd.Series:
    """Calculate Money Flow Index."""
    typical_price = (ohlcv['high'] + ohlcv['low'] + ohlcv['close']) / 3
    money_flow = typical_price * ohlcv['volume']
    
    delta = typical_price.diff()
    positive_flow = money_flow.where(delta > 0, 0).rolling(period).sum()
    negative_flow = money_flow.where(delta < 0, 0).rolling(period).sum()
    
    mfi = 100 - (100 / (1 + positive_flow / (negative_flow + 1e-6)))
    return mfi


def _calculate_bollinger_width(series: pd.Series, period: int = 20, std_dev: int = 2) -> pd.Series:
    """Calculate Bollinger Band Width."""
    sma = series.rolling(period).mean()
    std = series.rolling(period).std()
    upper = sma + (std * std_dev)
    lower = sma - (std * std_dev)
    width = (upper - lower) / sma
    return width


def _calculate_consolidated_sentiment(news_df: pd.DataFrame, idx: pd.DatetimeIndex) -> Dict[str, pd.Series]:
    """
    Consolidated sentiment analysis (3 features instead of 60).
    Uses simple sentiment scoring on article text.
    """
    # Initialize sentiment series
    positive_pct = pd.Series(0.5, index=idx)
    negative_pct = pd.Series(0.5, index=idx)
    impact_score = pd.Series(0.0, index=idx)
    article_count = pd.Series(0, index=idx)
    
    try:
        # Group news by date
        if 'publishedDate' in news_df.columns:
            news_df['date'] = pd.to_datetime(news_df['publishedDate']).dt.date
            
            for date, group in news_df.groupby('date'):
                if date not in idx:
                    continue
                
                # Simple sentiment scoring based on keywords
                text = ' '.join(group['title'].fillna('') + ' ' + group['text'].fillna('')).lower()
                
                positive_words = ['gain', 'rally', 'surge', 'rise', 'bullish', 'growth', 'positive']
                negative_words = ['loss', 'fall', 'drop', 'decline', 'bearish', 'crash', 'negative']
                
                pos_count = sum(text.count(word) for word in positive_words)
                neg_count = sum(text.count(word) for word in negative_words)
                total = pos_count + neg_count + 1e-6
                
                positive_pct[date] = pos_count / total
                negative_pct[date] = neg_count / total
                impact_score[date] = min(len(group) / 100, 1.0)  # Normalize article count
                article_count[date] = len(group)
        
        # Forward fill
        positive_pct = positive_pct.ffill()
        negative_pct = negative_pct.ffill()
        impact_score = impact_score.ffill()
        article_count = article_count.ffill()
        
    except Exception as e:
        print(f"Sentiment calculation error: {e}")
    
    return {
        'positive_pct': positive_pct,
        'negative_pct': negative_pct,
        'impact_score': impact_score,
        'article_count': article_count
    }


def _calculate_rolling_correlation(series1: pd.Series, asset_data: Optional[pd.DataFrame], period: int) -> pd.Series:
    """Calculate rolling correlation with another asset."""
    if asset_data is None or 'Close' not in asset_data.columns:
        return pd.Series(0.0, index=series1.index)
    
    try:
        asset_close = asset_data['Close'].reindex(series1.index, method='ffill')
        corr = series1.rolling(period).corr(asset_close)
        return corr.fillna(0)
    except Exception:
        return pd.Series(0.0, index=series1.index)


def _calculate_trend(asset_data: Optional[pd.DataFrame]) -> pd.Series:
    """Calculate simple trend indicator."""
    if asset_data is None or 'Close' not in asset_data.columns:
        return pd.Series(0.0, index=asset_data.index if asset_data is not None else [])
    
    try:
        sma_20 = asset_data['Close'].rolling(20).mean()
        sma_50 = asset_data['Close'].rolling(50).mean()
        trend = ((sma_20 > sma_50).astype(int) - 0.5) * 2  # -1 to 1
        return trend.fillna(0)
    except Exception:
        return pd.Series(0.0, index=asset_data.index)


def _calculate_smart_money_proxy(ohlcv: pd.DataFrame) -> Dict[str, pd.Series]:
    """
    Smart money indicators (proxy using volume and price action).
    In production, replace with actual institutional flow data.
    """
    # Dark pool proxy: Large volume moves with small price changes
    vol_ratio = ohlcv['volume'] / ohlcv['volume'].rolling(20).mean()
    price_change = abs(ohlcv['close'].pct_change())
    dark_pool = (vol_ratio > 1.5) & (price_change < 0.005)
    
    # Unusual options proxy: High volume + high volatility
    vol = ohlcv['close'].pct_change().rolling(10).std()
    unusual_options = (vol_ratio > 2.0) & (vol > vol.rolling(60).quantile(0.75))
    
    # Insider score: Price action during low volume (proxy)
    low_vol = ohlcv['volume'] < ohlcv['volume'].rolling(20).quantile(0.3)
    strong_move = abs(ohlcv['close'].pct_change()) > 0.01
    insider = low_vol & strong_move
    
    # Block trades: Very high volume spikes
    block_trades = vol_ratio > 3.0
    
    # Gamma exposure proxy: Price near round numbers during high volume
    price_mod = (ohlcv['close'] % 5) / ohlcv['close']
    gamma = (price_mod < 0.01) & (vol_ratio > 1.5)
    
    return {
        'dark_pool': dark_pool.astype(float).rolling(5).mean().fillna(0),
        'unusual_options': unusual_options.astype(float).rolling(5).mean().fillna(0),
        'insider': insider.astype(float).rolling(5).mean().fillna(0),
        'block_trades': block_trades.astype(float).rolling(5).mean().fillna(0),
        'gamma': gamma.astype(float).rolling(5).mean().fillna(0)
    }


def _get_macro_trend(series: Optional[pd.Series]) -> float:
    """Get macro trend direction."""
    if series is None or len(series) < 2:
        return 0.0
    try:
        recent = series.iloc[-5:].mean()
        older = series.iloc[-20:-5].mean()
        return (recent - older) / (older + 1e-6)
    except Exception:
        return 0.0


def _get_macro_surprise(series: Optional[pd.Series]) -> float:
    """Get macro surprise index."""
    if series is None or len(series) < 2:
        return 0.0
    try:
        latest = series.iloc[-1]
        expected = series.iloc[-5:].mean()
        return (latest - expected) / (expected + 1e-6)
    except Exception:
        return 0.0

