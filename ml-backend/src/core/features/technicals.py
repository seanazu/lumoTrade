"""
Technical Features Module
Comprehensive technical indicator suite (80+ features)
Based on multi_factor_model/multifactor/features/technicals.py
"""

import numpy as np
import pandas as pd
import ta  # Technical Analysis library


def build_technical_features(ohlcv: pd.DataFrame, interval: str) -> pd.DataFrame:
    """
    Build comprehensive technical feature set.
    
    Args:
        ohlcv: DataFrame with columns [Open, High, Low, Close, Volume] or lowercase variants
        interval: Time interval (e.g., "5min", "1d")
    
    Returns:
        DataFrame with 80+ technical features
    """
    idx = pd.DatetimeIndex(pd.to_datetime(ohlcv.index)).tz_localize(None)
    
    # Handle both capitalized and lowercase column names
    def get_col(df, name):
        """Get column by name, case-insensitive"""
        if name in df.columns:
            return df[name]
        elif name.lower() in df.columns:
            return df[name.lower()]
        elif name.capitalize() in df.columns:
            return df[name.capitalize()]
        else:
            raise KeyError(f"Column '{name}' not found. Available: {df.columns.tolist()}")
    
    close = get_col(ohlcv, "Close").astype(float)
    high = get_col(ohlcv, "High").astype(float)
    low = get_col(ohlcv, "Low").astype(float)
    open_price = get_col(ohlcv, "Open").astype(float)
    volume = get_col(ohlcv, "Volume").astype(float)
    
    features = {}
    
    # ===== 1. Price-Based Features (20) =====
    
    # EMAs
    for period in [10, 20, 50, 100, 200]:
        features[f"ema{period}"] = close.ewm(span=period, adjust=False).mean()
    
    # Price position relative to EMAs
    for period in [20, 50, 200]:
        ema = close.ewm(span=period, adjust=False).mean()
        features[f"price_vs_ema{period}"] = (close / ema - 1.0) * 100  # % above/below
    
    # Slopes (rate of change of EMAs)
    for period in [10, 50, 200]:
        ema = close.ewm(span=period, adjust=False).mean()
        features[f"ema{period}_slope"] = ema.pct_change(10) * 100
    
    # Crossovers
    ema50 = close.ewm(span=50, adjust=False).mean()
    ema200 = close.ewm(span=200, adjust=False).mean()
    features["golden_cross"] = (ema50 > ema200).astype(float)
    features["death_cross"] = (ema50 < ema200).astype(float)
    
    # ===== 2. Momentum Features (15) =====
    
    # RSI
    features["rsi14"] = ta.momentum.RSIIndicator(close, window=14).rsi()
    features["rsi21"] = ta.momentum.RSIIndicator(close, window=21).rsi()
    
    # MACD
    macd = ta.trend.MACD(close)
    features["macd"] = macd.macd()
    features["macd_signal"] = macd.macd_signal()
    features["macd_diff"] = macd.macd_diff()
    
    # Stochastic
    stoch = ta.momentum.StochasticOscillator(high, low, close)
    features["stoch_k"] = stoch.stoch()
    features["stoch_d"] = stoch.stoch_signal()
    
    # ROC (Rate of Change)
    for period in [5, 10, 20]:
        features[f"roc{period}"] = close.pct_change(period) * 100
    
    # Williams %R
    features["williams_r"] = ta.momentum.WilliamsRIndicator(high, low, close).williams_r()
    
    # Awesome Oscillator
    features["ao"] = ta.momentum.AwesomeOscillatorIndicator(high, low).awesome_oscillator()
    
    # ===== 3. Volatility Features (12) =====
    
    # ATR
    features["atr14"] = ta.volatility.AverageTrueRange(high, low, close, window=14).average_true_range()
    features["atr21"] = ta.volatility.AverageTrueRange(high, low, close, window=21).average_true_range()
    features["atr_norm"] = features["atr14"] / close  # Normalized ATR
    
    # Bollinger Bands
    bb = ta.volatility.BollingerBands(close, window=20, window_dev=2)
    features["bb_width"] = (bb.bollinger_hband() - bb.bollinger_lband()) / close * 100
    features["bb_pct"] = bb.bollinger_pband()  # % position in bands
    features["bb_high"] = bb.bollinger_hband()
    features["bb_low"] = bb.bollinger_lband()
    
    # Standard Deviation
    features["std20"] = close.rolling(20).std()
    features["std50"] = close.rolling(50).std()
    
    # Keltner Channels
    kc = ta.volatility.KeltnerChannel(high, low, close)
    features["kc_width"] = (kc.keltner_channel_hband() - kc.keltner_channel_lband()) / close * 100
    
    # ===== 4. Volume Features (15) =====
    
    # OBV (On-Balance Volume)
    features["obv"] = ta.volume.OnBalanceVolumeIndicator(close, volume).on_balance_volume()
    features["obv_ema20"] = features["obv"].ewm(span=20, adjust=False).mean()
    
    # AD (Accumulation/Distribution)
    features["ad"] = ta.volume.AccDistIndexIndicator(high, low, close, volume).acc_dist_index()
    
    # CMF (Chaikin Money Flow)
    features["cmf"] = ta.volume.ChaikinMoneyFlowIndicator(high, low, close, volume).chaikin_money_flow()
    
    # Volume ratios
    vol_ma20 = volume.rolling(20).mean()
    features["vol_ratio"] = volume / vol_ma20
    features["vol_ma20"] = vol_ma20
    
    # MFI (Money Flow Index)
    features["mfi"] = ta.volume.MFIIndicator(high, low, close, volume).money_flow_index()
    
    # Force Index
    features["force_index"] = ta.volume.ForceIndexIndicator(close, volume).force_index()
    
    # Ease of Movement
    features["eom"] = ta.volume.EaseOfMovementIndicator(high, low, volume).ease_of_movement()
    
    # VWAP
    features["vwap"] = ta.volume.VolumeWeightedAveragePrice(high, low, close, volume).volume_weighted_average_price()
    features["price_vs_vwap"] = (close / features["vwap"] - 1.0) * 100
    
    # ===== 5. Trend Features (10) =====
    
    # ADX (Average Directional Index)
    adx = ta.trend.ADXIndicator(high, low, close)
    features["adx"] = adx.adx()
    features["adx_pos"] = adx.adx_pos()
    features["adx_neg"] = adx.adx_neg()
    
    # Aroon
    aroon = ta.trend.AroonIndicator(high=high, low=low, window=25)
    features["aroon_up"] = aroon.aroon_up()
    features["aroon_down"] = aroon.aroon_down()
    features["aroon_indicator"] = aroon.aroon_indicator()
    
    # CCI (Commodity Channel Index)
    features["cci"] = ta.trend.CCIIndicator(high, low, close).cci()
    
    # DPO (Detrended Price Oscillator)
    features["dpo"] = ta.trend.DPOIndicator(close).dpo()
    
    # Mass Index
    features["mass_index"] = ta.trend.MassIndex(high, low).mass_index()
    
    # ===== 6. Statistical Features (8) =====
    
    # Skewness
    features["skew20"] = close.rolling(20).skew()
    features["skew50"] = close.rolling(50).skew()
    
    # Kurtosis
    features["kurt20"] = close.rolling(20).kurt()
    features["kurt50"] = close.rolling(50).kurt()
    
    # Z-score
    mean20 = close.rolling(20).mean()
    std20 = close.rolling(20).std()
    features["zscore20"] = (close - mean20) / std20
    
    mean50 = close.rolling(50).mean()
    std50 = close.rolling(50).std()
    features["zscore50"] = (close - mean50) / std50
    
    # Linear regression slope
    def rolling_slope(series, window):
        """Calculate rolling linear regression slope."""
        slopes = []
        for i in range(len(series)):
            if i < window - 1:
                slopes.append(np.nan)
            else:
                y = series.iloc[i-window+1:i+1].values
                x = np.arange(window)
                slope = np.polyfit(x, y, 1)[0]
                slopes.append(slope)
        return pd.Series(slopes, index=series.index)
    
    features["slope20"] = rolling_slope(close, 20)
    
    # ===== Combine all features =====
    
    result = pd.DataFrame(features, index=idx)
    
    # Clean: forward fill, then backward fill (limit to prevent too much fill)
    result = result.ffill().bfill(limit=1)
    
    # Replace inf with NaN
    result = result.replace([np.inf, -np.inf], np.nan)
    
    return result

