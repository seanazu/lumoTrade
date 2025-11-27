"""
Production Feature Builder

Builds the optimized feature set for the production model.
Features are based on extensive backtesting and optimization.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import yfinance as yf

from src.core.data.eodhd_client import EODHDClient


class ProductionFeatureBuilder:
    """
    Builds features for the production ML model.
    
    Feature categories:
    1. Sentiment features (from EODHD)
    2. VIX/fear-greed features
    3. Technical indicators (RSI, volatility)
    4. Cross-asset features (TLT, GLD, sectors)
    5. Lagged returns
    """
    
    # Tickers needed for feature building
    REQUIRED_TICKERS = [
        'QQQ', 'SPY', '^VIX', '^VIX3M', 
        'TLT', 'GLD', 'HYG', 'LQD',
        'XLK', 'XLF', 'XLE', 'IWM', 'EEM'
    ]
    
    def __init__(self):
        self.eodhd_client = None
        try:
            self.eodhd_client = EODHDClient()
        except ValueError:
            print("Warning: EODHD API key not set. Sentiment features disabled.")
    
    def build_features(
        self, 
        price_data: pd.DataFrame,
        sentiment_df: Optional[pd.DataFrame] = None,
        include_target: bool = True
    ) -> pd.DataFrame:
        """
        Build all features from price and sentiment data.
        
        Args:
            price_data: DataFrame with price data for all tickers
            sentiment_df: Optional DataFrame with sentiment data
            include_target: Whether to include target column
        
        Returns:
            DataFrame with all features
        """
        df = pd.DataFrame(index=price_data.index)
        df['close'] = price_data['QQQ']
        df['return_1d'] = price_data['QQQ'].pct_change()
        
        if include_target:
            df['target'] = (df['return_1d'].shift(-1) > 0).astype(int)
        
        # Add TQQQ return for backtesting
        if 'TQQQ' in price_data.columns:
            df['tqqq_return'] = price_data['TQQQ'].pct_change()
        else:
            df['tqqq_return'] = df['return_1d'] * 3
        
        # Build feature categories
        df = self._add_sentiment_features(df, sentiment_df)
        df = self._add_vix_features(df, price_data)
        df = self._add_technical_features(df, price_data)
        df = self._add_cross_asset_features(df, price_data)
        df = self._add_lagged_returns(df, price_data)
        
        return df
    
    def _add_sentiment_features(
        self, 
        df: pd.DataFrame, 
        sentiment_df: Optional[pd.DataFrame]
    ) -> pd.DataFrame:
        """Add sentiment-based features"""
        if sentiment_df is None or sentiment_df.empty:
            return df
        
        # Join sentiment data
        if 'sentiment_raw' not in sentiment_df.columns:
            if 'normalized' in sentiment_df.columns:
                sentiment_df = sentiment_df.rename(columns={'normalized': 'sentiment_raw'})
            else:
                return df
        
        df = df.join(sentiment_df[['sentiment_raw']], how='left')
        
        if 'news_count' in sentiment_df.columns:
            df = df.join(sentiment_df[['news_count']], how='left')
        else:
            df['news_count'] = 0
        
        df['sentiment_raw'] = df['sentiment_raw'].ffill().bfill().fillna(0.5)
        df['news_count'] = df['news_count'].ffill().bfill().fillna(0)
        
        # Lagged sentiment (sentiment leads price by 1-3 days)
        for lag in [1, 2, 3, 5]:
            df[f'sentiment_lag{lag}'] = df['sentiment_raw'].shift(lag)
        
        # Sentiment momentum
        df['sentiment_change_1d'] = df['sentiment_raw'].diff()
        df['sentiment_change_3d'] = df['sentiment_raw'].diff(3)
        df['sentiment_change_5d'] = df['sentiment_raw'].diff(5)
        
        # Sentiment moving averages
        df['sentiment_ma3'] = df['sentiment_raw'].rolling(3).mean()
        df['sentiment_ma5'] = df['sentiment_raw'].rolling(5).mean()
        df['sentiment_ma10'] = df['sentiment_raw'].rolling(10).mean()
        
        # Sentiment deviation from mean
        df['sentiment_vs_ma5'] = df['sentiment_raw'] - df['sentiment_ma5']
        df['sentiment_vs_ma10'] = df['sentiment_raw'] - df['sentiment_ma10']
        
        # Sentiment z-score
        df['sentiment_zscore'] = (
            (df['sentiment_raw'] - df['sentiment_raw'].rolling(20).mean()) / 
            df['sentiment_raw'].rolling(20).std()
        )
        
        # Contrarian signals (extreme sentiment = reversal)
        df['sentiment_extreme_high'] = (df['sentiment_zscore'] > 1.5).astype(int)
        df['sentiment_extreme_low'] = (df['sentiment_zscore'] < -1.5).astype(int)
        
        # News volume z-score
        df['news_zscore'] = (
            (df['news_count'] - df['news_count'].rolling(20).mean()) / 
            df['news_count'].rolling(20).std()
        )
        df['news_spike'] = (df['news_zscore'] > 2).astype(int)
        
        return df
    
    def _add_vix_features(
        self, 
        df: pd.DataFrame, 
        price_data: pd.DataFrame
    ) -> pd.DataFrame:
        """Add VIX-based fear/greed features"""
        if '^VIX' not in price_data.columns:
            return df
        
        df['vix'] = price_data['^VIX']
        df['vix_change_1d'] = price_data['^VIX'].pct_change()
        df['vix_change_5d'] = price_data['^VIX'].pct_change(5)
        df['vix_ma_ratio'] = price_data['^VIX'] / price_data['^VIX'].rolling(20).mean()
        
        # VIX z-score
        df['vix_zscore'] = (
            (df['vix'] - df['vix'].rolling(60).mean()) / 
            df['vix'].rolling(60).std()
        )
        
        # VIX percentile
        df['vix_percentile'] = df['vix'].rolling(252).apply(
            lambda x: pd.Series(x).rank(pct=True).iloc[-1]
        )
        
        # VIX term structure (backwardation = fear)
        if '^VIX3M' in price_data.columns:
            df['vix_term'] = price_data['^VIX'] / price_data['^VIX3M']
            df['vix_term_change'] = df['vix_term'].pct_change(5)
            df['vix_term_zscore'] = (
                (df['vix_term'] - df['vix_term'].rolling(60).mean()) / 
                df['vix_term'].rolling(60).std()
            )
        
        # Fear/greed composite (if sentiment available)
        if 'sentiment_raw' in df.columns:
            df['fear_greed'] = (
                (1 - df['sentiment_raw']) * 0.5 + 
                (df['vix_zscore'].clip(-2, 2) / 4 + 0.5) * 0.5
            )
            df['fear_greed_zscore'] = (
                (df['fear_greed'] - df['fear_greed'].rolling(20).mean()) / 
                df['fear_greed'].rolling(20).std()
            )
        
        return df
    
    def _add_technical_features(
        self, 
        df: pd.DataFrame, 
        price_data: pd.DataFrame
    ) -> pd.DataFrame:
        """Add technical indicator features"""
        # RSI at multiple timeframes
        for period in [5, 7, 14, 21]:
            gain = df['return_1d'].clip(lower=0).rolling(period).mean()
            loss = (-df['return_1d'].clip(upper=0)).rolling(period).mean().replace(0, 0.0001)
            df[f'rsi_{period}'] = 100 - 100 / (1 + gain / loss)
        
        # Volatility
        for w in [5, 10, 20, 60]:
            df[f'volatility_{w}d'] = df['return_1d'].rolling(w).std() * np.sqrt(252)
        
        df['volatility_ratio'] = df['volatility_5d'] / df['volatility_20d']
        df['volatility_change'] = df['volatility_10d'].pct_change(5)
        df['volatility_zscore'] = (
            (df['volatility_10d'] - df['volatility_10d'].rolling(60).mean()) / 
            df['volatility_10d'].rolling(60).std()
        )
        
        # Moving average ratios
        for ma in [10, 20, 50]:
            df[f'sma_ratio_{ma}'] = price_data['QQQ'] / price_data['QQQ'].rolling(ma).mean()
        
        # Distance from high/low
        df['dist_from_high_20d'] = price_data['QQQ'] / price_data['QQQ'].rolling(20).max()
        df['dist_from_low_20d'] = price_data['QQQ'] / price_data['QQQ'].rolling(20).min()
        
        # Momentum
        df['momentum_5d'] = price_data['QQQ'] - price_data['QQQ'].shift(5)
        df['momentum_10d'] = price_data['QQQ'] - price_data['QQQ'].shift(10)
        df['momentum_20d'] = price_data['QQQ'] - price_data['QQQ'].shift(20)
        df['acceleration'] = df['momentum_10d'] - df['momentum_10d'].shift(5)
        
        return df
    
    def _add_cross_asset_features(
        self, 
        df: pd.DataFrame, 
        price_data: pd.DataFrame
    ) -> pd.DataFrame:
        """Add cross-asset correlation features"""
        # Returns for each asset
        for ticker in ['TLT', 'GLD', 'XLF', 'XLE', 'XLK', 'IWM', 'EEM']:
            if ticker in price_data.columns:
                df[f'{ticker.lower()}_return_1d'] = price_data[ticker].pct_change()
                df[f'{ticker.lower()}_return_5d'] = price_data[ticker].pct_change(5)
                df[f'{ticker.lower()}_return_20d'] = price_data[ticker].pct_change(20)
        
        # Credit spread (LQD/HYG ratio)
        if 'LQD' in price_data.columns and 'HYG' in price_data.columns:
            df['credit_spread'] = price_data['LQD'] / price_data['HYG']
            df['credit_change'] = df['credit_spread'].pct_change(5)
            df['credit_zscore'] = (
                (df['credit_spread'] - df['credit_spread'].rolling(60).mean()) / 
                df['credit_spread'].rolling(60).std()
            )
        
        # Market breadth (small cap vs large cap)
        if 'IWM' in price_data.columns and 'SPY' in price_data.columns:
            df['small_vs_large'] = price_data['IWM'] / price_data['SPY']
            df['small_vs_large_change'] = df['small_vs_large'].pct_change(5)
        
        return df
    
    def _add_lagged_returns(
        self, 
        df: pd.DataFrame, 
        price_data: pd.DataFrame
    ) -> pd.DataFrame:
        """Add lagged return features"""
        for d in [1, 2, 3, 5, 10, 20]:
            df[f'return_{d}d'] = price_data['QQQ'].pct_change(d)
            df[f'return_{d}d_lag1'] = df[f'return_{d}d'].shift(1)
            df[f'return_{d}d_lag2'] = df[f'return_{d}d'].shift(2)
            df[f'return_{d}d_lag3'] = df[f'return_{d}d'].shift(3)
        
        # Sentiment-price divergence (if sentiment available)
        if 'sentiment_change_3d' in df.columns:
            df['sentiment_price_div'] = (
                df['sentiment_change_3d'] - price_data['QQQ'].pct_change(3) * 10
            )
        
        return df
    
    def get_feature_columns(self, df: pd.DataFrame) -> List[str]:
        """Get list of feature columns (excluding target and utility columns)"""
        exclude_cols = ['close', 'return_1d', 'target', 'tqqq_return']
        return [c for c in df.columns if c not in exclude_cols]
    
    def fetch_latest_features(self, days: int = 365) -> pd.DataFrame:
        """
        Fetch latest data and build features.
        
        Args:
            days: Number of days of historical data
        
        Returns:
            DataFrame with features
        """
        # Fetch price data
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')
        
        price_data = yf.download(
            self.REQUIRED_TICKERS,
            start=start_date,
            end=end_date,
            progress=False,
            auto_adjust=False
        )['Adj Close']
        
        price_data = price_data.ffill().dropna()
        
        # Fetch sentiment data
        sentiment_df = None
        if self.eodhd_client:
            try:
                sentiment_df = self.eodhd_client.get_sentiment('QQQ', from_date=start_date)
                if not sentiment_df.empty and 'normalized' in sentiment_df.columns:
                    sentiment_df = sentiment_df.rename(columns={'normalized': 'sentiment_raw'})
            except Exception as e:
                print(f"Warning: Could not fetch sentiment: {e}")
        
        # Build features
        df = self.build_features(price_data, sentiment_df, include_target=False)
        
        return df.dropna()


# Singleton instance
_feature_builder = None

def get_feature_builder() -> ProductionFeatureBuilder:
    """Get the singleton feature builder instance"""
    global _feature_builder
    if _feature_builder is None:
        _feature_builder = ProductionFeatureBuilder()
    return _feature_builder

