"""
Hybrid Prediction Engine
Combines LightGBM, Market Direction Sentiment, and ChatGPT-5 for multi-horizon predictions
"""
import os
import json
import time
import numpy as np
from typing import Dict, Optional, List
from datetime import datetime
from pathlib import Path

from src.models.lightgbm_predictor import LightGBMPredictor
from src.data.data_loader import data_loader
from src.data.feature_engineering import FeatureEngineer
from src.llm.market_analyst import market_analyst
from src.sentiment.market_direction_sentiment import market_direction_sentiment
from src.training.continuous_learner import continuous_learner
from config import MODEL_CONFIG, PREDICTION_CONFIG


class HybridPredictionEngine:
    """
    Hybrid prediction engine combining:
    1. LightGBM for base ML predictions
    2. Market Direction Sentiment for news features
    3. ChatGPT-5 for social sentiment and LLM adjustments
    """
    
    def __init__(
        self,
        model_dir: str = "models",
        horizons: List[str] = None
    ):
        self.horizons = horizons or MODEL_CONFIG["horizons"]
        self.feature_engineer = FeatureEngineer()
        
        # Load LightGBM models
        self.lgbm_predictor = LightGBMPredictor(horizons=self.horizons)
        model_path = Path(model_dir)
        
        if model_path.exists() and (model_path / "metadata.json").exists():
            try:
                self.lgbm_predictor.load(model_dir)
                print("✅ LightGBM models loaded successfully")
            except Exception as e:
                print(f"⚠️  Could not load LightGBM models: {e}")
                print("   Will use LLM-only predictions")
        else:
            print("⚠️  No trained LightGBM models found")
            print(f"   Run training: python -m src.training.train_lightgbm")
            print("   Will use LLM-only predictions")
        
        # Fusion weights
        self.base_ml_weight = MODEL_CONFIG["fusion_weights"]["base_ml"]
        self.llm_weight = MODEL_CONFIG["fusion_weights"]["llm_adjustment"]
    
    async def generate_prediction(
        self,
        symbol: str = "SPY",
        timeframe: str = "1d",
        debug: bool = None
    ) -> Dict:
        """
        Generate comprehensive multi-horizon prediction
        
        Args:
            symbol: Stock symbol (SPY, QQQ, IWM)
            timeframe: Primary timeframe for display (1h, 4h, 1d)
            debug: Include detailed debug information
        
        Returns:
            Complete prediction dict with multi-horizon forecasts
        """
        if debug is None:
            debug = PREDICTION_CONFIG["default_debug"]
        
        debug_info = {
            "stages": [],
            "data_sources": {},
            "detailed_steps": [],
            "feature_values": {},
            "base_ml_predictions": {},
            "llm_adjustments": {},
            "fusion_details": {}
        } if debug else None
        
        def log_debug(step_name: str, details: str, data: any = None):
            """Log detailed step information"""
            if debug:
                debug_info["detailed_steps"].append({
                    "timestamp": datetime.now().isoformat(),
                    "step": step_name,
                    "details": details,
                    "data": data
                })
        
        print(f"\n🔮 Generating Hybrid Prediction for {symbol}...")
        log_debug("Initialization", f"Starting hybrid prediction for {symbol}", {
            "symbol": symbol,
            "timeframe": timeframe,
            "model_version": MODEL_CONFIG["model_version"]
        })
        
        # Map ETF to index
        index_map = {"SPY": "SPX", "QQQ": "NDX", "IWM": "RUT"}
        index = index_map.get(symbol, "SPX")
        
        # STEP 1: Fetch current market data
        print("📊 Step 1: Fetching market data...")
        start_time = time.time() if debug else 0
        current_prices = await self._fetch_current_prices(symbol)
        if debug:
            duration = int((time.time() - start_time) * 1000)
            debug_info["stages"].append({
                "name": "Fetch Market Data",
                "duration_ms": duration,
                "status": "complete"
            })
            debug_info["data_sources"]["market_data"] = current_prices
            log_debug("Market Data", f"Fetched in {duration}ms", current_prices)
        
        # STEP 2: Calculate technical indicators
        print("📈 Step 2: Calculating technical indicators...")
        start_time = time.time() if debug else 0
        technical_indicators = await self._calculate_indicators(symbol)
        if debug:
            duration = int((time.time() - start_time) * 1000)
            debug_info["stages"].append({
                "name": "Calculate Technical Indicators",
                "duration_ms": duration,
                "status": "complete"
            })
            debug_info["data_sources"]["technical_indicators"] = technical_indicators
            log_debug("Technical Indicators", f"Calculated in {duration}ms", technical_indicators)
        
        # STEP 3: Get Market Direction Sentiment (primary news engine)
        print("📰 Step 3: Analyzing Market Direction Sentiment...")
        start_time = time.time() if debug else 0
        market_direction = await market_direction_sentiment.analyze_market_direction(
            index=index,
            horizon="T+1",
            cutoff_minutes=30
        )
        if debug:
            duration = int((time.time() - start_time) * 1000)
            debug_info["stages"].append({
                "name": "Market Direction Sentiment",
                "duration_ms": duration,
                "status": "complete"
            })
            debug_info["data_sources"]["market_direction"] = market_direction
            log_debug("Market Direction", f"Analyzed in {duration}ms", {
                "sentiment_mean": market_direction.get("sentiment_weighted_mean"),
                "event_count": market_direction.get("event_count"),
                "confidence": market_direction.get("confidence")
            })
        
        # STEP 4: Get ChatGPT-5 social sentiment (web search)
        print("🗣️  Step 4: Searching social sentiment (ChatGPT-5)...")
        start_time = time.time() if debug else 0
        social_sentiment = await market_analyst.search_social_sentiment(index)
        if debug:
            duration = int((time.time() - start_time) * 1000)
            debug_info["stages"].append({
                "name": "Social Sentiment Search",
                "duration_ms": duration,
                "status": "complete"
            })
            debug_info["data_sources"]["social_sentiment"] = social_sentiment
            log_debug("Social Sentiment", f"Searched in {duration}ms", social_sentiment)
        
        # STEP 5: Fetch macro data
        print("🌍 Step 5: Fetching macro data...")
        start_time = time.time() if debug else 0
        macro_data = await self._fetch_macro_data()
        if debug:
            duration = int((time.time() - start_time) * 1000)
            debug_info["stages"].append({
                "name": "Fetch Macro Data",
                "duration_ms": duration,
                "status": "complete"
            })
            debug_info["data_sources"]["macro_data"] = macro_data
            log_debug("Macro Data", f"Fetched in {duration}ms", macro_data)
        
        # STEP 6: Build feature vector
        print("🔧 Step 6: Building feature vector...")
        start_time = time.time() if debug else 0
        feature_vector = self._build_feature_vector(
            current_prices,
            technical_indicators,
            market_direction,
            social_sentiment,
            macro_data
        )
        if debug:
            duration = int((time.time() - start_time) * 1000)
            debug_info["stages"].append({
                "name": "Build Feature Vector",
                "duration_ms": duration,
                "status": "complete"
            })
            debug_info["feature_values"] = feature_vector
            log_debug("Feature Vector", f"Built in {duration}ms", {
                "num_features": len(feature_vector),
                "sample_features": dict(list(feature_vector.items())[:10])
            })
        
        # STEP 7: Run LightGBM predictions
        print("🤖 Step 7: Running LightGBM predictions...")
        start_time = time.time() if debug else 0
        base_ml_predictions = self._run_lgbm_predictions(feature_vector)
        if debug:
            duration = int((time.time() - start_time) * 1000)
            debug_info["stages"].append({
                "name": "LightGBM Predictions",
                "duration_ms": duration,
                "status": "complete"
            })
            debug_info["base_ml_predictions"] = base_ml_predictions
            log_debug("LightGBM", f"Predicted in {duration}ms", base_ml_predictions)
        
        # STEP 8: Get LLM adjustments (ChatGPT-5)
        print("🧠 Step 8: Getting LLM adjustments...")
        start_time = time.time() if debug else 0
        llm_adjustments = await self._get_llm_adjustments(
            index,
            feature_vector,
            base_ml_predictions,
            market_direction,
            social_sentiment,
            macro_data
        )
        if debug:
            duration = int((time.time() - start_time) * 1000)
            debug_info["stages"].append({
                "name": "LLM Adjustments",
                "duration_ms": duration,
                "status": "complete"
            })
            debug_info["llm_adjustments"] = llm_adjustments
            log_debug("LLM Adjustments", f"Generated in {duration}ms", llm_adjustments)
        
        # STEP 9: Fuse predictions
        print("🔗 Step 9: Fusing predictions...")
        start_time = time.time() if debug else 0
        final_predictions = self._fuse_predictions(
            base_ml_predictions,
            llm_adjustments
        )
        if debug:
            duration = int((time.time() - start_time) * 1000)
            debug_info["stages"].append({
                "name": "Fuse Predictions",
                "duration_ms": duration,
                "status": "complete"
            })
            debug_info["fusion_details"] = {
                "base_ml_weight": self.base_ml_weight,
                "llm_weight": self.llm_weight,
                "final_predictions": final_predictions
            }
            log_debug("Fusion", f"Completed in {duration}ms", final_predictions)
        
        # Record predictions for continuous learning
        current_time = datetime.now()
        for horizon, pred in final_predictions.items():
            await continuous_learner.record_prediction(
                symbol=symbol,
                horizon=horizon,
                predicted_return=pred["mean"],
                predicted_direction=pred["direction"],
                confidence=pred["confidence"],
                timestamp=current_time
            )
        
        # Build response
        response = {
            "success": True,
            "data": {
                "index": index,
                "symbol": symbol,
                "timestamp": current_time.isoformat(),
                "model_version": MODEL_CONFIG["model_version"],
                "horizons": final_predictions,
                "key_factors": self._extract_key_factors(market_direction, social_sentiment, macro_data),
                "qualitative_risks": llm_adjustments.get("qualitative_risks", []),
                "confidence_summary": self._calculate_confidence_summary(final_predictions)
            }
        }
        
        if debug:
            response["data"]["debug"] = debug_info
        
        print(f"✅ Hybrid prediction complete!\n")
        
        return response
    
    async def _fetch_current_prices(self, symbol: str) -> Dict:
        """Fetch current price data"""
        try:
            quote = await data_loader.fetch_realtime_data(symbol)
            return quote
        except:
            return {"symbol": symbol, "price": 0.0, "volume": 0, "change": 0.0, "change_percent": 0.0}
    
    async def _calculate_indicators(self, symbol: str) -> Dict:
        """Calculate technical indicators"""
        try:
            from datetime import timedelta
            end_date = datetime.now().strftime("%Y-%m-%d")
            start_date = (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d")
            
            df = await data_loader.load_historical_data(
                symbol=symbol,
                start_date=start_date,
                end_date=end_date,
                interval="1min"
            )
            
            df_features = self.feature_engineer.engineer_features(df)
            latest = df_features.iloc[-1]
            
            return {
                "rsi_14": float(latest.get("rsi_14", 50)),
                "macd": float(latest.get("macd", 0)),
                "macd_signal": float(latest.get("macd_signal", 0)),
                "bb_upper": float(latest.get("bb_upper_20", 0)),
                "bb_lower": float(latest.get("bb_lower_20", 0)),
                "volume_ratio": float(latest.get("volume_ratio", 1)),
                "price": float(latest.get("close", 0))
            }
        except Exception as e:
            print(f"Error calculating indicators: {e}")
            return {}
    
    async def _fetch_macro_data(self) -> Dict:
        """Fetch macro indicators"""
        try:
            vix_data = await data_loader.fetch_realtime_data("^VIX")
            return {
                "vix": vix_data.get("price", 20.0),
                "vix_change": vix_data.get("change_percent", 0.0)
            }
        except:
            return {"vix": 20.0, "vix_change": 0.0}
    
    def _build_feature_vector(
        self,
        prices: Dict,
        indicators: Dict,
        market_direction: Dict,
        social_sentiment: Dict,
        macro: Dict
    ) -> Dict:
        """Build complete feature vector"""
        features = {}
        
        # Price features
        features["price_current"] = prices.get("price", 0)
        features["price_change_pct"] = prices.get("change_percent", 0)
        
        # Technical indicators
        features.update({f"price_{k}": v for k, v in indicators.items()})
        
        # News features (from Market Direction Sentiment)
        features["news_sentiment_mean"] = market_direction.get("sentiment_weighted_mean", 0)
        features["news_event_count"] = market_direction.get("event_count", 0)
        features["news_macro_event_count"] = market_direction.get("macro_event_count", 0)
        features["news_confidence"] = market_direction.get("confidence", 0)
        features["news_neg_extreme_share"] = market_direction.get("neg_extreme_share", 0)
        features["news_pos_extreme_share"] = market_direction.get("pos_extreme_share", 0)
        
        # Social features
        features["social_sentiment_score"] = social_sentiment.get("social_sentiment_score", 0)
        features["social_confidence"] = social_sentiment.get("confidence", 0)
        
        # Macro features
        features["macro_vix"] = macro.get("vix", 20)
        features["macro_vix_change"] = macro.get("vix_change", 0)
        
        return features
    
    def _run_lgbm_predictions(self, feature_vector: Dict) -> Dict:
        """Run LightGBM predictions for all horizons"""
        if not self.lgbm_predictor.models:
            return {}
        
        try:
            import pandas as pd
            X = pd.DataFrame([feature_vector])
            predictions = self.lgbm_predictor.predict(X, return_percentiles=True)
            return predictions
        except Exception as e:
            print(f"Error running LightGBM: {e}")
            return {}
    
    async def _get_llm_adjustments(
        self,
        index: str,
        features: Dict,
        base_predictions: Dict,
        market_direction: Dict,
        social_sentiment: Dict,
        macro: Dict
    ) -> Dict:
        """Get LLM adjustments from ChatGPT-5"""
        # Build structured payload
        payload = {
            "index": index,
            "timestamp": datetime.now().isoformat(),
            "horizons": list(base_predictions.keys()),
            "features": {
                "news": {
                    "sentiment_weighted_mean": market_direction.get("sentiment_weighted_mean", 0),
                    "event_count": market_direction.get("event_count", 0),
                    "macro_event_count": market_direction.get("macro_event_count", 0),
                    "confidence": market_direction.get("confidence", 0)
                },
                "social": {
                    "sentiment_score": social_sentiment.get("social_sentiment_score", 0),
                    "confidence": social_sentiment.get("confidence", 0),
                    "key_themes": social_sentiment.get("key_themes", [])
                },
                "macro": macro
            },
            "base_ml_predictions": {
                h: {"mean": float(p["mean"][0]) if isinstance(p["mean"], np.ndarray) else float(p["mean"])}
                for h, p in base_predictions.items()
            }
        }
        
        # For now, return a simple structure
        # In production, this would call ChatGPT-5 with the payload
        return {
            "adjusted_predictions": base_predictions,  # No adjustment for now
            "qualitative_risks": [],
            "notes": "LLM adjustments placeholder"
        }
    
    def _fuse_predictions(
        self,
        base_ml: Dict,
        llm_adj: Dict
    ) -> Dict:
        """Fuse base ML and LLM predictions"""
        fused = {}
        
        for horizon in self.horizons:
            if horizon not in base_ml:
                continue
            
            ml_pred = base_ml[horizon]
            
            # Simple fusion: weighted average
            # In production, LLM would provide adjustments
            fused[horizon] = {
                "mean": float(ml_pred["mean"][0]) if isinstance(ml_pred["mean"], np.ndarray) else float(ml_pred["mean"]),
                "p10": float(ml_pred["p10"][0]) if isinstance(ml_pred["p10"], np.ndarray) else float(ml_pred["p10"]),
                "p90": float(ml_pred["p90"][0]) if isinstance(ml_pred["p90"], np.ndarray) else float(ml_pred["p90"]),
                "direction": ml_pred["direction"][0] if isinstance(ml_pred["direction"], np.ndarray) else ml_pred["direction"],
                "confidence": float(ml_pred["confidence"][0]) if isinstance(ml_pred["confidence"], np.ndarray) else float(ml_pred["confidence"])
            }
        
        return fused
    
    def _extract_key_factors(
        self,
        market_direction: Dict,
        social_sentiment: Dict,
        macro: Dict
    ) -> List[Dict]:
        """Extract key factors driving prediction"""
        factors = []
        
        # News sentiment factor
        sentiment_mean = market_direction.get("sentiment_weighted_mean", 0)
        if abs(sentiment_mean) > 0.05:
            sentiment_desc = "strongly positive" if sentiment_mean > 0.3 else \
                           "positive" if sentiment_mean > 0 else \
                           "strongly negative" if sentiment_mean < -0.3 else "negative"
            factors.append({
                "factor": f"News sentiment is {sentiment_desc} ({sentiment_mean:.2f})",
                "impact": "high" if abs(sentiment_mean) > 0.3 else "medium",
                "sentiment": "positive" if sentiment_mean > 0 else "negative"
            })
        
        # Macro events
        macro_count = market_direction.get("macro_event_count", 0)
        if macro_count > 0:
            factors.append({
                "factor": f"{macro_count} major macro events detected (Fed, CPI, earnings, etc.)",
                "impact": "high",
                "sentiment": "neutral"
            })
        
        # High importance events
        hi_imp_count = market_direction.get("hi_imp_event_count", 0)
        if hi_imp_count > 0:
            factors.append({
                "factor": f"{hi_imp_count} high-importance news events",
                "impact": "high",
                "sentiment": "neutral"
            })
        
        # Event volume
        event_count = market_direction.get("event_count", 0)
        if event_count > 50:
            factors.append({
                "factor": f"High news volume: {event_count} events in last 30 minutes",
                "impact": "medium",
                "sentiment": "neutral"
            })
        elif event_count < 10:
            factors.append({
                "factor": f"Low news volume: {event_count} events (quiet market)",
                "impact": "low",
                "sentiment": "neutral"
            })
        
        # Extreme sentiment
        neg_extreme = market_direction.get("neg_extreme_share", 0)
        if neg_extreme > 0.3:
            factors.append({
                "factor": f"{int(neg_extreme * 100)}% of news events are extremely negative",
                "impact": "high",
                "sentiment": "negative"
            })
        
        pos_extreme = market_direction.get("pos_extreme_share", 0)
        if pos_extreme > 0.3:
            factors.append({
                "factor": f"{int(pos_extreme * 100)}% of news events are extremely positive",
                "impact": "high",
                "sentiment": "positive"
            })
        
        # VIX factor
        vix = macro.get("vix", 20)
        if vix > 30:
            factors.append({
                "factor": f"VIX extremely elevated at {vix:.1f} (high market fear)",
                "impact": "high",
                "sentiment": "negative"
            })
        elif vix > 25:
            factors.append({
                "factor": f"VIX elevated at {vix:.1f} (increased volatility)",
                "impact": "medium",
                "sentiment": "negative"
            })
        elif vix < 15:
            factors.append({
                "factor": f"VIX low at {vix:.1f} (calm market conditions)",
                "impact": "medium",
                "sentiment": "positive"
            })
        
        # VIX change
        vix_change = macro.get("vix_change", 0)
        if abs(vix_change) > 10:
            factors.append({
                "factor": f"VIX changed {vix_change:+.1f}% (volatility spike)",
                "impact": "high",
                "sentiment": "negative" if vix_change > 0 else "positive"
            })
        
        # Social sentiment (if available)
        social_score = social_sentiment.get("social_sentiment_score", 0)
        social_conf = social_sentiment.get("confidence", 0)
        if social_conf > 0.5 and abs(social_score) > 0.2:
            factors.append({
                "factor": f"Social media sentiment: {social_score:+.2f}",
                "impact": "medium",
                "sentiment": "positive" if social_score > 0 else "negative"
            })
        
        # Sentiment confidence
        confidence = market_direction.get("confidence", 0)
        if confidence > 0.8:
            factors.append({
                "factor": f"High confidence in sentiment analysis ({confidence:.0%})",
                "impact": "low",
                "sentiment": "neutral"
            })
        elif confidence < 0.5:
            factors.append({
                "factor": f"Low confidence in sentiment analysis ({confidence:.0%})",
                "impact": "low",
                "sentiment": "neutral"
            })
        
        # Limit to top 10 most important factors
        return factors[:10]
    
    def _calculate_confidence_summary(self, predictions: Dict) -> Dict:
        """Calculate overall confidence summary"""
        if not predictions:
            return {"overall": 0.0, "by_horizon": {}}
        
        confidences = [p["confidence"] for p in predictions.values()]
        return {
            "overall": float(np.mean(confidences)),
            "by_horizon": {h: p["confidence"] for h, p in predictions.items()}
        }


# Singleton instance
hybrid_prediction_engine = HybridPredictionEngine()

