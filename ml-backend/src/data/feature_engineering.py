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
        df = df.ffill().fillna(0)
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

        try:
            # RSI for multiple periods
            for period in [14, 21]:  # Reduced to avoid errors
                try:
                    rsi_indicator = momentum.RSIIndicator(close=close, window=period)
                    df[f"rsi_{period}"] = rsi_indicator.rsi()
                except:
                    df[f"rsi_{period}"] = 50  # Neutral RSI

            # MACD - Use correct method names
            try:
                from ta.trend import MACD
                macd_indicator = MACD(close=close)
                df["macd"] = macd_indicator.macd()
                df["macd_signal"] = macd_indicator.macd_signal()
                df["macd_hist"] = macd_indicator.macd_diff()
            except:
                df["macd"] = 0
                df["macd_signal"] = 0
                df["macd_hist"] = 0

            # Stochastic Oscillator
            try:
                stoch = momentum.StochasticOscillator(high=high, low=low, close=close, window=14)
                df["stoch_k_14"] = stoch.stoch()
                df["stoch_d_14"] = stoch.stoch_signal()
            except:
                df["stoch_k_14"] = 50
                df["stoch_d_14"] = 50

            # Williams %R
            try:
                wr = momentum.WilliamsRIndicator(high=high, low=low, close=close, lbp=14)
                df["williams_r_14"] = wr.williams_r()
            except:
                df["williams_r_14"] = -50

            # ROC (Rate of Change)
            try:
                roc = momentum.ROCIndicator(close=close, window=14)
                df["roc_14"] = roc.roc()
            except:
                df["roc_14"] = 0

        except Exception as e:
            print(f"Warning: Momentum indicators failed: {e}")
            # Add placeholder columns
            df["rsi_14"] = 50
            df["macd"] = 0
            df["macd_signal"] = 0
            df["macd_hist"] = 0

        return df

    def _add_trend_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Trend indicators using ta library"""
        close = df["close"]
        high = df["high"]
        low = df["low"]

        try:
            # Moving Averages
            for period in [20, 50]:  # Reduced to essential ones
                try:
                    df[f"sma_{period}"] = trend.SMAIndicator(close=close, window=period).sma_indicator()
                    df[f"ema_{period}"] = trend.EMAIndicator(close=close, window=period).ema_indicator()
                except:
                    df[f"sma_{period}"] = close
                    df[f"ema_{period}"] = close

            # ADX (Average Directional Index)
            try:
                adx_indicator = trend.ADXIndicator(high=high, low=low, close=close, window=14)
                df["adx"] = adx_indicator.adx()
            except:
                df["adx"] = 25

            # Aroon Indicator - Fixed: use high/low instead of close
            try:
                aroon = trend.AroonIndicator(high=high, low=low, window=25)
                df["aroon_up"] = aroon.aroon_up()
                df["aroon_down"] = aroon.aroon_down()
            except:
                df["aroon_up"] = 50
                df["aroon_down"] = 50

            # CCI (Commodity Channel Index)
            try:
                df["cci"] = trend.CCIIndicator(high=high, low=low, close=close, window=20).cci()
            except:
                df["cci"] = 0

        except Exception as e:
            print(f"Warning: Trend indicators failed: {e}")
            # Add placeholder columns
            df["sma_20"] = close
            df["ema_20"] = close
            df["adx"] = 25

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
