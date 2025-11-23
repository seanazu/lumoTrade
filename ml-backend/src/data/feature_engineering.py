"""
Feature Engineering Pipeline
Calculates 100+ technical indicators using ta library (pure Python)
"""

import pandas as pd
import numpy as np
from ta import momentum, trend, volatility, volume


class FeatureEngineer:
    def __init__(self):
        self.feature_names = []

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Main entry point for feature engineering.
        Takes OHLCV dataframe and returns dataframe with 100+ features.
        """
        df = df.copy()
        df = self.add_technical_indicators(df)
        return df

    def add_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add technical and statistical indicators to an OHLCV dataframe.
        """
        df = df.copy()
        df = self._add_price_features(df)
        df = self._add_momentum_indicators(df)
        df = self._add_trend_indicators(df)
        df = self._add_volatility_indicators(df)
        df = self._add_volume_indicators(df)
        df = self._add_pattern_features(df)
        df = self._add_statistical_features(df)
        df = df.fillna(method="ffill").fillna(0)
        return df

    def _add_price_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Basic price-based features"""
        df["returns"] = df["close"].pct_change()
        df["log_returns"] = np.log(df["close"] / df["close"].shift(1))
        df["range"] = df["high"] - df["low"]
        df["range_pct"] = df["range"] / df["close"]
        df["gap"] = df["open"] - df["close"].shift(1)
        df["gap_pct"] = df["gap"] / df["close"].shift(1)
        return df

    def _add_momentum_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Momentum indicators using ta library"""
        close = df["close"]
        high = df["high"]
        low = df["low"]

        # RSI for multiple periods
        for period in [9, 14, 21, 30]:
            df[f"rsi_{period}"] = momentum.RSIIndicator(close=close, window=period).rsi()

        # MACD
        macd_indicator = momentum.MACD(close=close)
        df["macd"] = macd_indicator.macd()
        df["macd_signal"] = macd_indicator.macd_signal()
        df["macd_hist"] = macd_indicator.macd_diff()

        # Stochastic Oscillator
        for period in [14, 21]:
            stoch = momentum.StochasticOscillator(high=high, low=low, close=close, window=period)
            df[f"stoch_k_{period}"] = stoch.stoch()
            df[f"stoch_d_{period}"] = stoch.stoch_signal()

        # Williams %R
        for period in [14, 21]:
            df[f"williams_r_{period}"] = momentum.WilliamsRIndicator(
                high=high, low=low, close=close, lbp=period
            ).williams_r()

        # ROC (Rate of Change)
        for period in [9, 14, 21]:
            df[f"roc_{period}"] = momentum.ROCIndicator(close=close, window=period).roc()

        return df

    def _add_trend_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Trend indicators using ta library"""
        close = df["close"]
        high = df["high"]
        low = df["low"]

        # Moving Averages
        for period in [10, 20, 50, 100, 200]:
            df[f"sma_{period}"] = trend.SMAIndicator(close=close, window=period).sma_indicator()
            df[f"ema_{period}"] = trend.EMAIndicator(close=close, window=period).ema_indicator()

        # ADX (Average Directional Index)
        adx_indicator = trend.ADXIndicator(high=high, low=low, close=close, window=14)
        df["adx"] = adx_indicator.adx()
        df["adx_pos"] = adx_indicator.adx_pos()
        df["adx_neg"] = adx_indicator.adx_neg()

        # Aroon Indicator
        aroon = trend.AroonIndicator(close=close, window=25)
        df["aroon_up"] = aroon.aroon_up()
        df["aroon_down"] = aroon.aroon_down()
        df["aroon_indicator"] = aroon.aroon_indicator()

        # TRIX
        df["trix"] = trend.TRIXIndicator(close=close, window=15).trix()

        # Mass Index
        df["mass_index"] = trend.MassIndex(high=high, low=low, window_fast=9, window_slow=25).mass_index()

        # CCI (Commodity Channel Index)
        df["cci"] = trend.CCIIndicator(high=high, low=low, close=close, window=20).cci()

        # DPO (Detrended Price Oscillator)
        df["dpo"] = trend.DPOIndicator(close=close, window=20).dpo()

        # KST (Know Sure Thing)
        kst = trend.KSTIndicator(close=close)
        df["kst"] = kst.kst()
        df["kst_signal"] = kst.kst_sig()

        return df

    def _add_volatility_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Volatility indicators using ta library"""
        close = df["close"]
        high = df["high"]
        low = df["low"]

        # Bollinger Bands
        for period in [20, 50]:
            bb = volatility.BollingerBands(close=close, window=period, window_dev=2)
            df[f"bb_upper_{period}"] = bb.bollinger_hband()
            df[f"bb_middle_{period}"] = bb.bollinger_mavg()
            df[f"bb_lower_{period}"] = bb.bollinger_lband()
            df[f"bb_width_{period}"] = bb.bollinger_wband()
            df[f"bb_pct_{period}"] = bb.bollinger_pband()

        # ATR (Average True Range)
        for period in [14, 21]:
            df[f"atr_{period}"] = volatility.AverageTrueRange(
                high=high, low=low, close=close, window=period
            ).average_true_range()

        # Keltner Channel
        keltner = volatility.KeltnerChannel(high=high, low=low, close=close, window=20)
        df["keltner_upper"] = keltner.keltner_channel_hband()
        df["keltner_middle"] = keltner.keltner_channel_mband()
        df["keltner_lower"] = keltner.keltner_channel_lband()

        # Donchian Channel
        donchian = volatility.DonchianChannel(high=high, low=low, close=close, window=20)
        df["donchian_upper"] = donchian.donchian_channel_hband()
        df["donchian_middle"] = donchian.donchian_channel_mband()
        df["donchian_lower"] = donchian.donchian_channel_lband()

        # Ulcer Index
        df["ulcer_index"] = volatility.UlcerIndex(close=close, window=14).ulcer_index()

        return df

    def _add_volume_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Volume indicators using ta library"""
        close = df["close"]
        high = df["high"]
        low = df["low"]
        vol = df["volume"]

        # Volume ratios
        df["volume_ratio"] = vol / vol.rolling(window=30).mean()

        # OBV (On-Balance Volume)
        df["obv"] = volume.OnBalanceVolumeIndicator(close=close, volume=vol).on_balance_volume()

        # Accumulation/Distribution
        df["ad"] = volume.AccDistIndexIndicator(high=high, low=low, close=close, volume=vol).acc_dist_index()

        # Chaikin Money Flow
        df["cmf"] = volume.ChaikinMoneyFlowIndicator(
            high=high, low=low, close=close, volume=vol, window=20
        ).chaikin_money_flow()

        # Force Index
        df["force_index"] = volume.ForceIndexIndicator(close=close, volume=vol, window=13).force_index()

        # Ease of Movement
        df["eom"] = volume.EaseOfMovementIndicator(
            high=high, low=low, volume=vol, window=14
        ).ease_of_movement()

        # Volume Price Trend
        df["vpt"] = volume.VolumePriceTrendIndicator(close=close, volume=vol).volume_price_trend()

        # Negative Volume Index
        df["nvi"] = volume.NegativeVolumeIndexIndicator(close=close, volume=vol).negative_volume_index()

        return df

    def _add_pattern_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Candlestick pattern features (custom implementation)"""
        open_ = df["open"]
        close = df["close"]
        high = df["high"]
        low = df["low"]

        body = close - open_
        abs_body = body.abs()
        range_total = (high - low).replace(0, np.nan)
        upper_shadow = high - pd.concat([open_, close], axis=1).max(axis=1)
        lower_shadow = pd.concat([open_, close], axis=1).min(axis=1) - low

        # Hammer
        df["pattern_hammer"] = (
            (body > 0) & (lower_shadow >= abs_body * 2) & (upper_shadow <= abs_body * 0.5)
        ).astype(int)

        # Inverted Hammer
        df["pattern_inverted_hammer"] = (
            (body > 0) & (upper_shadow >= abs_body * 2) & (lower_shadow <= abs_body * 0.5)
        ).astype(int)

        # Engulfing (simplified)
        prev_body = body.shift(1)
        df["pattern_engulfing"] = ((body > 0) & (prev_body < 0) & (abs_body > abs(prev_body))).astype(int)

        # Doji
        df["pattern_doji"] = (abs_body <= range_total * 0.1).astype(int)

        # Morning Star (simplified - 3-candle pattern)
        prev_body_2 = body.shift(2)
        df["pattern_morning_star"] = (
            (prev_body_2 < 0) & (abs(body.shift(1)) < abs(prev_body_2) * 0.5) & (body > 0)
        ).astype(int)

        # Evening Star (simplified)
        df["pattern_evening_star"] = (
            (prev_body_2 > 0) & (abs(body.shift(1)) < abs(prev_body_2) * 0.5) & (body < 0)
        ).astype(int)

        # Three White Soldiers
        df["pattern_three_white_soldiers"] = (
            (body > 0) & (body.shift(1) > 0) & (body.shift(2) > 0) & (close > close.shift(1)) & (close.shift(1) > close.shift(2))
        ).astype(int)

        # Three Black Crows
        df["pattern_three_black_crows"] = (
            (body < 0) & (body.shift(1) < 0) & (body.shift(2) < 0) & (close < close.shift(1)) & (close.shift(1) < close.shift(2))
        ).astype(int)

        return df

    def _add_statistical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Statistical features"""
        close = df["close"]

        # Rolling statistics
        for window in [10, 20, 50]:
            df[f"std_{window}"] = close.rolling(window=window).std()
            df[f"var_{window}"] = close.rolling(window=window).var()
            df[f"skew_{window}"] = close.rolling(window=window).skew()
            df[f"kurt_{window}"] = close.rolling(window=window).kurt()

        # Z-score
        for window in [20, 50]:
            mean = close.rolling(window=window).mean()
            std = close.rolling(window=window).std()
            df[f"zscore_{window}"] = (close - mean) / std

        return df
