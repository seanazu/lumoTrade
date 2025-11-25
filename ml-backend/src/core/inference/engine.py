"""
Panel-Based Prediction Engine
Real-time predictions using panel-trained models
"""

import warnings
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

from src.core.models import QuantileRegressorBundle, DirectionClassifier
from src.core.features import (
    build_technical_features,
    build_news_features,
    build_macro_features,
    build_cross_asset_features,
    build_breadth_features,
    build_calendar_features,
    build_interaction_features,
    apply_feature_boosting
)
from src.core.data.api_clients.fmp_client import FMPClient
from src.core.data.api_clients.fred_client import FREDClient
from src.core.data.api_clients.yahoo_extended import YahooExtendedClient
from src.core.data.api_clients.breadth_calculator import compute_breadth_indicators, SECTOR_ETFS
from src.core.backtesting import size_position_vol_targeted, size_position_gate_mode


class PanelPredictionEngine:
    """
    Real-time predictions using panel-trained models.
    
    Features:
    - On-demand feature building
    - Quantile predictions (P10, P50, P90)
    - Direction probability
    - Position recommendations
    - Key driver identification
    """
    
    def __init__(self, model_dir: str = "ml-backend/models/v2"):
        """
        Initialize prediction engine.
        
        Args:
            model_dir: Directory containing trained models
        """
        self.model_dir = Path(model_dir)
        
        # Initialize API clients
        self.fmp_client = FMPClient()
        self.fred_client = FREDClient()
        self.yahoo_client = YahooExtendedClient()
        
        # Models (loaded on demand)
        self.quantile_models: Optional[QuantileRegressorBundle] = None
        self.direction_classifier: Optional[DirectionClassifier] = None
        
        # Cached data (refreshed periodically)
        self._news_cache = None
        self._macro_cache = None
        self._cross_asset_cache = None
        self._breadth_cache = None
        self._cache_timestamp = None
        self._cache_ttl = timedelta(hours=1)  # Refresh every hour
    
    def load_models(self):
        """Load trained models from disk."""
        if not self.model_dir.exists():
            raise FileNotFoundError(f"Model directory not found: {self.model_dir}")
        
        # Load quantile models
        quantile_dir = self.model_dir / "quantile_models"
        if quantile_dir.exists():
            self.quantile_models = QuantileRegressorBundle()
            self.quantile_models.load(str(quantile_dir))
        else:
            warnings.warn("Quantile models not found. Using mock predictions.")
        
        # Load classifier (optional)
        classifier_path = self.model_dir / "direction_classifier.pkl"
        if classifier_path.exists():
            self.direction_classifier = DirectionClassifier()
            self.direction_classifier.load(str(classifier_path))
    
    async def _refresh_shared_data(self, lookback_days: int = 365):
        """Refresh cached shared data sources."""
        now = datetime.now()
        
        # Check if cache is still valid
        if self._cache_timestamp and (now - self._cache_timestamp) < self._cache_ttl:
            return
        
        end_date = now.strftime("%Y-%m-%d")
        start_date = (now - timedelta(days=lookback_days)).strftime("%Y-%m-%d")
        
        # Fetch news (cached by FMP client)
        news_mkt, news_by_ticker = await self.fmp_client.fetch_historical_news(
            tickers=["SPY", "QQQ"],  # Sample tickers for market news
            start_date=start_date,
            end_date=end_date,
            pages_per_batch=3,
            verbose=False
        )
        
        # Fetch macro data
        fred_series = self.fred_client.fetch_all_core_series(
            start_date=start_date,
            end_date=end_date,
            verbose=False
        )
        
        macro_surprises = self.fmp_client.fetch_macro_surprises(
            start_date=start_date,
            end_date=end_date
        )
        
        # Fetch cross-asset data
        cross_asset_data = await self.yahoo_client.download_cross_asset_data(
            start=start_date,
            end=end_date,
            interval="1d"  # Daily for caching
        )
        
        # Fetch breadth data
        breadth_close, breadth_volume = await self.yahoo_client.download_panel_data(
            universe=SECTOR_ETFS,
            start=start_date,
            end=end_date,
            interval="1d"
        )
        breadth_indicators = compute_breadth_indicators(breadth_close, breadth_volume)
        
        # Update cache
        self._news_cache = {"market": news_mkt, "by_ticker": news_by_ticker}
        self._macro_cache = {"fred": fred_series, "surprises": macro_surprises}
        self._cross_asset_cache = cross_asset_data
        self._breadth_cache = breadth_indicators
        self._cache_timestamp = now
    
    async def generate_prediction(
        self,
        ticker: str,
        index: str,
        horizons: List[int] = None,
        mode: str = "vol_targeted"
    ) -> Dict:
        """
        Generate real-time prediction.
        
        Args:
            ticker: Ticker symbol (e.g., "SPY")
            index: Index name (e.g., "SPX")
            horizons: Prediction horizons (default: [1, 5, 20])
            mode: Position sizing mode ("vol_targeted" or "gate")
        
        Returns:
            Dict with predictions, position recommendation, and reasoning
        """
        if horizons is None:
            horizons = [1, 5, 20]
        
        # Load models if not already loaded
        if self.quantile_models is None:
            self.load_models()
        
        # Refresh shared data if needed
        await self._refresh_shared_data()
        
        # Step 1: Fetch latest OHLCV (last 200 bars for indicators)
        from src.core.data.loaders import data_loader
        
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
        
        ohlcv = await data_loader.load_historical_data(
            symbol=ticker,
            start_date=start_date,
            end_date=end_date,
            interval="1d"
        )
        
        if ohlcv.empty:
            raise ValueError(f"No data available for {ticker}")
        
        idx = ohlcv.index
        
        # Ensure index is a DatetimeIndex
        if not isinstance(idx, pd.DatetimeIndex):
            if "timestamp" in ohlcv.columns:
                ohlcv["timestamp"] = pd.to_datetime(ohlcv["timestamp"])
                ohlcv = ohlcv.set_index("timestamp")
            else:
                ohlcv.index = pd.to_datetime(ohlcv.index)
            idx = ohlcv.index
        
        # Ensure index is unique (remove duplicates)
        if idx.duplicated().any():
            ohlcv = ohlcv[~idx.duplicated(keep='last')]
            idx = ohlcv.index
        
        latest_date = idx[-1]
        
        # Step 2: Build features
        tech_feat = build_technical_features(ohlcv, interval="1d")
        news_feat = build_news_features(idx, self._news_cache["market"], self._news_cache["by_ticker"], ticker)
        macro_feat = build_macro_features(idx, self._macro_cache["fred"], self._macro_cache["surprises"])
        cross_feat = build_cross_asset_features(idx, self._cross_asset_cache)
        breadth_feat = build_breadth_features(self._breadth_cache.reindex(idx))
        cal_feat = build_calendar_features(idx)
        
        # Check for duplicates in each feature DataFrame
        for name, feat in [("tech", tech_feat), ("news", news_feat), ("macro", macro_feat), 
                           ("cross", cross_feat), ("breadth", breadth_feat), ("cal", cal_feat)]:
            if feat.index.duplicated().any():
                print(f"⚠️  {name}_feat has {feat.index.duplicated().sum()} duplicate indices")
                # Remove duplicates
                feat = feat[~feat.index.duplicated(keep='last')]
                # Update the variable
                if name == "tech":
                    tech_feat = feat
                elif name == "news":
                    news_feat = feat
                elif name == "macro":
                    macro_feat = feat
                elif name == "cross":
                    cross_feat = feat
                elif name == "breadth":
                    breadth_feat = feat
                elif name == "cal":
                    cal_feat = feat
        
        # Combine base features
        base_features = pd.concat([tech_feat, news_feat, macro_feat, cross_feat, breadth_feat, cal_feat], axis=1)
        
        # Build interactions
        interact_feat = build_interaction_features(base_features)
        
        # Combine all
        all_features = pd.concat([base_features, interact_feat], axis=1)
        
        # Fill missing
        all_features = all_features.ffill().bfill().fillna(0)
        
        # Apply feature boosting
        all_features_boosted = apply_feature_boosting(all_features)
        
        # Add ticker dummies (must match training)
        # The model was trained with: tk_SPY, tk_QQQ, tk_DIA, tk_IWM, tk_XLK
        for tk in ["SPY", "QQQ", "DIA", "IWM", "XLK"]:
            all_features_boosted[f"tk_{tk}"] = 1 if tk == ticker else 0
        
        # Ensure feature order matches training
        if self.quantile_models and hasattr(self.quantile_models, 'feature_names'):
            expected_features = self.quantile_models.feature_names
            # Reorder and select only the expected features
            all_features_boosted = all_features_boosted[expected_features]
        
        # Get latest features
        latest_features = all_features_boosted.iloc[[-1]]
        
        # Step 3: Generate predictions
        predictions = {}
        
        if self.quantile_models:
            quantile_preds = self.quantile_models.predict(latest_features, horizons=horizons)
            
            for horizon, pred_df in quantile_preds.items():
                pred_dict = {
                    "p10": float(pred_df["p10"].iloc[0]) if "p10" in pred_df.columns else np.nan,
                    "p50": float(pred_df["p50"].iloc[0]) if "p50" in pred_df.columns else np.nan,
                    "p90": float(pred_df["p90"].iloc[0]) if "p90" in pred_df.columns else np.nan,
                }
                
                # Direction probability
                if self.direction_classifier:
                    prob_up = self.direction_classifier.predict_proba(latest_features).iloc[0]
                    pred_dict["prob_up"] = float(prob_up)
                else:
                    # Estimate from P50
                    pred_dict["prob_up"] = 0.5 + 0.5 * np.tanh(pred_dict["p50"] / 2.0)
                
                predictions[f"{horizon}h"] = pred_dict
        
        # Step 4: Calculate position recommendation
        if predictions and "1h" in predictions:
            pred_1h = predictions["1h"]
            
            # Calculate realized volatility
            returns = ohlcv["close"].pct_change().dropna()
            realized_vol = returns.std() * np.sqrt(252)
            
            if mode == "vol_targeted":
                position = size_position_vol_targeted(
                    pred_p10=pred_1h["p10"],
                    pred_p50=pred_1h["p50"],
                    pred_p90=pred_1h["p90"],
                    realized_vol=realized_vol
                )
            elif mode == "gate":
                position = size_position_gate_mode(
                    pred_p50=pred_1h["p50"],
                    prob_up=pred_1h["prob_up"]
                )
            else:
                position = 0.0
        else:
            position = 0.0
        
        # Step 5: Identify key drivers
        key_drivers = []
        if self.quantile_models:
            feature_importance = self.quantile_models.get_feature_importance(horizon=horizons[0])
            top_features = feature_importance.head(5)
            
            for _, row in top_features.iterrows():
                feat_name = row["feature"]
                if feat_name in latest_features.columns:
                    feat_val = latest_features[feat_name].iloc[0]
                    key_drivers.append(f"{feat_name}: {feat_val:.3f}")
        
        # Confidence assessment
        if "1h" in predictions:
            spread = predictions["1h"]["p90"] - predictions["1h"]["p10"]
            if spread < 1.0:
                confidence = "high"
            elif spread < 2.0:
                confidence = "medium"
            else:
                confidence = "low"
        else:
            confidence = "unknown"
        
        # Build response
        response = {
            "ticker": ticker,
            "timestamp": latest_date.isoformat(),
            "predictions": predictions,
            "position_recommended": float(position),
            "reasoning": {
                "confidence": confidence,
                "key_drivers": key_drivers,
                "mode": mode
            }
        }
        
        return response

