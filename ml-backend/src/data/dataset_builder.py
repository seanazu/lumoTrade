"""
Dataset Builder
Assembles complete feature matrix from multiple data sources
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from pathlib import Path

from src.data.target_generator import target_generator
from src.data.feature_config import HORIZONS, INDICES
from src.sentiment.market_direction_sentiment import market_direction_sentiment


class DatasetBuilder:
    """Build training datasets with features and targets"""
    
    def __init__(self, cache_dir: str = "data/datasets"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    async def build_intraday_dataset(
        self,
        index: str,
        start_date: str,
        end_date: str,
        interval: str = "5min"
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Build intraday dataset for 1h, 4h, 10h horizons
        
        Args:
            index: Index symbol (SPX, NDX, RUT)
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            interval: Bar interval (5min, 15min)
        
        Returns:
            Tuple of (X_features, y_targets)
        """
        print(f"\n{'='*80}")
        print(f"Building Intraday Dataset: {index}")
        print(f"Period: {start_date} to {end_date}")
        print(f"Interval: {interval}")
        print(f"{'='*80}\n")
        
        # 1. Load price bars
        print("📊 Step 1: Loading price bars...")
        from src.data.data_loader import data_loader
        
        config = INDICES[index]
        df_bars = await data_loader.load_historical_data(
            symbol=config["etf"],
            start_date=start_date,
            end_date=end_date,
            interval=interval
        )
        print(f"   ✅ Loaded {len(df_bars)} bars\n")
        
        # 2. Generate targets
        print("🎯 Step 2: Generating targets...")
        intraday_horizons = ["1h", "4h", "10h"]
        df_targets = target_generator.generate_targets(df_bars, intraday_horizons)
        print(f"   ✅ Generated targets for {len(df_targets)} timestamps\n")
        
        # 3. Build features
        print("🔧 Step 3: Building features...")
        df_features = await self._build_features(df_bars, index)
        print(f"   ✅ Built {len(df_features.columns)} features\n")
        
        # 4. Align features and targets
        print("🔗 Step 4: Aligning features and targets...")
        df_features_aligned, df_targets_aligned = target_generator.align_features_and_targets(
            df_features, df_targets
        )
        print(f"   ✅ Aligned {len(df_features_aligned)} samples\n")
        
        print(f"{'='*80}")
        print(f"✅ Dataset Complete")
        print(f"   Samples: {len(df_features_aligned)}")
        print(f"   Features: {len(df_features_aligned.columns) - 1}")  # -1 for timestamp
        print(f"   Targets: {len(df_targets_aligned.columns) - 1}")  # -1 for timestamp
        print(f"{'='*80}\n")
        
        return df_features_aligned, df_targets_aligned
    
    async def build_daily_dataset(
        self,
        index: str,
        start_date: str,
        end_date: str
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Build daily dataset for 1d, 3d, 5d horizons
        
        Args:
            index: Index symbol (SPX, NDX, RUT)
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
        
        Returns:
            Tuple of (X_features, y_targets)
        """
        print(f"\n{'='*80}")
        print(f"Building Daily Dataset: {index}")
        print(f"Period: {start_date} to {end_date}")
        print(f"{'='*80}\n")
        
        # 1. Load daily bars
        print("📊 Step 1: Loading daily bars...")
        from src.data.data_loader import data_loader
        
        config = INDICES[index]
        df_bars = await data_loader.load_historical_data(
            symbol=config["etf"],
            start_date=start_date,
            end_date=end_date,
            interval="1day"
        )
        print(f"   ✅ Loaded {len(df_bars)} bars\n")
        
        # 2. Generate targets
        print("🎯 Step 2: Generating targets...")
        daily_horizons = ["1d", "3d", "5d"]
        df_targets = target_generator.generate_targets(df_bars, daily_horizons)
        print(f"   ✅ Generated targets for {len(df_targets)} timestamps\n")
        
        # 3. Build features
        print("🔧 Step 3: Building features...")
        df_features = await self._build_features(df_bars, index)
        print(f"   ✅ Built {len(df_features.columns)} features\n")
        
        # 4. Align features and targets
        print("🔗 Step 4: Aligning features and targets...")
        df_features_aligned, df_targets_aligned = target_generator.align_features_and_targets(
            df_features, df_targets
        )
        print(f"   ✅ Aligned {len(df_features_aligned)} samples\n")
        
        print(f"{'='*80}")
        print(f"✅ Dataset Complete")
        print(f"   Samples: {len(df_features_aligned)}")
        print(f"   Features: {len(df_features_aligned.columns) - 1}")
        print(f"   Targets: {len(df_targets_aligned.columns) - 1}")
        print(f"{'='*80}\n")
        
        return df_features_aligned, df_targets_aligned
    
    async def _build_features(
        self,
        df_bars: pd.DataFrame,
        index: str
    ) -> pd.DataFrame:
        """
        Build complete feature matrix from price bars
        
        Args:
            df_bars: Price bars DataFrame
            index: Index symbol
        
        Returns:
            DataFrame with all features
        """
        from src.data.feature_engineering import FeatureEngineer
        
        # Initialize feature engineer
        engineer = FeatureEngineer()
        
        # 1. Calculate technical indicators (price features)
        print("   📈 Calculating technical indicators...")
        df_with_indicators = engineer.engineer_features(df_bars)
        
        # 2. Add news features (Market Direction Sentiment)
        print("   📰 Adding news features...")
        df_with_news = await self._add_news_features(df_with_indicators, index)
        
        # 3. Add macro features
        print("   🌍 Adding macro features...")
        df_with_macro = await self._add_macro_features(df_with_news)
        
        # 4. Add breadth features (if available)
        print("   📊 Adding breadth features...")
        df_with_breadth = await self._add_breadth_features(df_with_macro, index)
        
        # 5. Add calendar features
        print("   📅 Adding calendar features...")
        df_complete = self._add_calendar_features(df_with_breadth)
        
        return df_complete
    
    async def _add_news_features(
        self,
        df: pd.DataFrame,
        index: str
    ) -> pd.DataFrame:
        """Add Market Direction Sentiment features"""
        df = df.copy()
        
        # For each timestamp, get news sentiment
        # In production, this would query a database of pre-computed sentiment
        # For now, we'll add placeholder columns
        
        from src.data.feature_config import NEWS_FEATURES
        
        for window in NEWS_FEATURES["windows"]:
            for feat in NEWS_FEATURES["features"]:
                col_name = f"news_{window}_{feat}"
                # Placeholder: would be populated from Market Direction Sentiment
                df[col_name] = 0.0
        
        return df
    
    async def _add_macro_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add macro/cross-asset features"""
        df = df.copy()
        
        from src.data.feature_config import MACRO_FEATURES
        
        # Placeholder: would fetch VIX, yields, DXY, gold, oil
        for asset, metrics in MACRO_FEATURES.items():
            for metric in metrics:
                col_name = f"macro_{asset}_{metric}"
                df[col_name] = 0.0
        
        return df
    
    async def _add_breadth_features(
        self,
        df: pd.DataFrame,
        index: str
    ) -> pd.DataFrame:
        """Add market breadth features"""
        df = df.copy()
        
        from src.data.feature_config import BREADTH_FEATURES
        
        # Placeholder: would calculate from constituent data
        for feat in BREADTH_FEATURES:
            col_name = f"breadth_{feat}"
            df[col_name] = 0.0
        
        return df
    
    def _add_calendar_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add macro calendar features"""
        df = df.copy()
        
        from src.data.feature_config import CALENDAR_FEATURES
        
        # Placeholder: would check against calendar database
        for event_type, feats in CALENDAR_FEATURES.items():
            for feat in feats:
                col_name = f"cal_{event_type}_{feat}"
                df[col_name] = 0.0
        
        return df
    
    def export_to_parquet(
        self,
        X: pd.DataFrame,
        y: pd.DataFrame,
        filepath: str
    ):
        """
        Export dataset to Parquet for inspection
        
        Args:
            X: Features DataFrame
            y: Targets DataFrame
            filepath: Output file path
        """
        # Merge X and y
        df_combined = pd.merge(X, y, on='timestamp', how='inner')
        
        # Save to parquet
        output_path = self.cache_dir / filepath
        df_combined.to_parquet(output_path, index=False)
        
        print(f"📦 Dataset exported to: {output_path}")
        print(f"   Shape: {df_combined.shape}")
        print(f"   Size: {output_path.stat().st_size / 1024 / 1024:.2f} MB")


# Singleton instance
dataset_builder = DatasetBuilder()

