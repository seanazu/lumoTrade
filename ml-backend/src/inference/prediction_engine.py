"""
Core Prediction Engine - Fuses LSTM, ChatGPT-5.1, and Sentiment Signals
"""
import os
import torch
import numpy as np
from typing import Dict, Optional
from datetime import datetime
from pathlib import Path

from src.models.lstm_predictor import load_model
from src.data.data_loader import data_loader
from src.data.feature_engineering import FeatureEngineer
from src.llm.market_analyst import market_analyst
from src.sentiment.news_sentiment import news_sentiment_analyzer
from src.sentiment.social_sentiment import social_sentiment_tracker

class PredictionEngine:
    def __init__(
        self,
        model_path: str = "models/best_model.pth",
        scaler_path: str = "models/scaler.pkl",
        num_features: int = 100
    ):
        self.num_features = num_features
        
        # Load LSTM model if available
        if Path(model_path).exists() and Path(scaler_path).exists():
            try:
                self.lstm_model, self.scaler = load_model(model_path, scaler_path)
                print("✅ LSTM model loaded successfully")
            except Exception as e:
                print(f"⚠ Warning: Could not load LSTM model: {e}")
                print("  Will use ChatGPT-5.1 only for predictions")
                self.lstm_model = None
                self.scaler = None
        else:
            print("⚠ No trained LSTM model found")
            print("  Run training script: python -m src.training.train")
            print("  Will use ChatGPT-5.1 only for predictions")
            self.lstm_model = None
            self.scaler = None
        
        self.feature_engineer = FeatureEngineer()
        
        # Sentiment-first weighting
        self.NEWS_WEIGHT = float(os.getenv("NEWS_SENTIMENT_WEIGHT", 0.35))
        self.SOCIAL_WEIGHT = float(os.getenv("SOCIAL_SENTIMENT_WEIGHT", 0.25))
        self.GPT_WEIGHT = float(os.getenv("GPT_WEIGHT", 0.25))
        self.LSTM_WEIGHT = float(os.getenv("LSTM_WEIGHT", 0.15))

    async def generate_prediction(
        self,
        symbol: str = "SPY",
        timeframe: str = "1h"
    ) -> Dict:
        """
        Generate comprehensive market prediction
        
        Args:
            symbol: Stock symbol to predict
            timeframe: Prediction timeframe (1h, 4h, 1d)
        
        Returns:
            Complete prediction dict
        """
        print(f"\n🔮 Generating prediction for {symbol} ({timeframe})...")
        
        # 1. Fetch current market data
        print("📊 Fetching market data...")
        current_prices = await self._fetch_current_prices(symbol)
        
        # 2. Calculate technical indicators
        print("📈 Calculating technical indicators...")
        technical_indicators = await self._calculate_indicators(symbol)
        
        # 3. Analyze news sentiment
        print("📰 Analyzing news sentiment...")
        news_sentiment = await news_sentiment_analyzer.analyze_sentiment(symbol, hours_back=24)
        
        # 4. Track social sentiment
        print("🗣 Tracking social sentiment...")
        social_sentiment = await social_sentiment_tracker.track_sentiment(symbol, hours_back=24)
        
        # 5. Get macro data
        print("🌍 Fetching macro data...")
        macro_data = await self._fetch_macro_data()
        
        # 6. Run LSTM prediction (if model available)
        ml_prediction = None
        if self.lstm_model:
            print("🤖 Running LSTM model...")
            ml_prediction = await self._run_lstm_prediction(symbol, technical_indicators)
        else:
            print("⏭ Skipping LSTM (no model trained)")
        
        # 7. Get ChatGPT-5.1 analysis
        print("🧠 Running ChatGPT-5.1 analysis...")
        llm_analysis = await market_analyst.analyze_market(
            current_prices=current_prices,
            technical_indicators=technical_indicators,
            recent_news=news_sentiment,
            macro_data=macro_data
        )
        
        # 8. Fuse all predictions
        print("🔗 Fusing predictions...")
        final_prediction = await self._fuse_predictions(
            ml_prediction=ml_prediction,
            llm_analysis=llm_analysis,
            news_sentiment=news_sentiment,
            social_sentiment=social_sentiment,
            macro_data=macro_data
        )
        
        # Add metadata
        final_prediction["symbol"] = symbol
        final_prediction["timeframe"] = timeframe
        final_prediction["timestamp"] = datetime.now().isoformat()
        final_prediction["model_version"] = "1.0.0-sentiment-first"
        
        print(f"✅ Prediction complete: {final_prediction['direction']} ({final_prediction['confidence']:.2f} confidence)")
        
        return final_prediction

    async def _fetch_current_prices(self, symbol: str) -> Dict:
        """Fetch current price data"""
        try:
            quote = await data_loader.fetch_realtime_data(symbol)
            return quote
        except:
            return {
                "symbol": symbol,
                "price": 0.0,
                "volume": 0,
                "change": 0.0,
                "change_percent": 0.0
            }

    async def _calculate_indicators(self, symbol: str) -> Dict:
        """Calculate technical indicators from recent data"""
        try:
            # Fetch last 5 days of 1-min data to calculate indicators
            from datetime import timedelta
            end_date = datetime.now().strftime("%Y-%m-%d")
            start_date = (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d")
            
            df = await data_loader.load_historical_data(
                symbol=symbol,
                start_date=start_date,
                end_date=end_date,
                interval="1min"
            )
            
            # Engineer features
            df_features = self.feature_engineer.engineer_features(df)
            
            # Extract latest values of key indicators
            latest = df_features.iloc[-1]
            
            return {
                "rsi_14": float(latest.get("rsi_14", 50)),
                "macd": float(latest.get("macd", 0)),
                "macd_signal": float(latest.get("macd_signal", 0)),
                "bb_upper": float(latest.get("bb_upper", 0)),
                "bb_lower": float(latest.get("bb_lower", 0)),
                "volume_ratio": float(latest.get("volume_ratio", 1)),
                "price": float(latest.get("close", 0))
            }
        except Exception as e:
            print(f"Error calculating indicators: {e}")
            return {}

    async def _fetch_macro_data(self) -> Dict:
        """Fetch macro indicators"""
        try:
            # Fetch VIX
            vix_data = await data_loader.fetch_realtime_data("^VIX")
            
            return {
                "vix": vix_data.get("price", 20.0),
                "vix_change": vix_data.get("change_percent", 0.0)
            }
        except:
            return {"vix": 20.0, "vix_change": 0.0}

    async def _run_lstm_prediction(self, symbol: str, indicators: Dict) -> Optional[Dict]:
        """Run LSTM model prediction"""
        if not self.lstm_model:
            return None
        
        try:
            # Prepare input sequence
            # This requires the last 60 timesteps of features
            # For simplicity, we'll use current indicators
            # In production, fetch proper sequence
            
            # Placeholder: Create dummy sequence
            # Real implementation needs actual time series
            dummy_sequence = np.random.randn(60, self.num_features)
            
            # Make prediction
            prediction = self.lstm_model.predict(dummy_sequence, self.scaler)
            
            return prediction
        except Exception as e:
            print(f"Error running LSTM: {e}")
            return None

    async def _fuse_predictions(
        self,
        ml_prediction: Optional[Dict],
        llm_analysis: Optional[Dict],
        news_sentiment: Optional[Dict],
        social_sentiment: Optional[Dict],
        macro_data: Dict
    ) -> Dict:
        """
        Fuse all prediction signals with sentiment-first weighting
        
        Weighting:
        - News Sentiment: 35%
        - Social Sentiment: 25%
        - ChatGPT-5.1: 25%
        - LSTM Technical: 15%
        """
        
        # Convert each signal to -1 to +1 score
        scores = []
        confidences = []
        
        # 1. News Sentiment (35%)
        if news_sentiment and news_sentiment.get("confidence", 0) > 0:
            news_score = news_sentiment.get("overall_score", 0)
            news_confidence = news_sentiment.get("confidence", 0)
            scores.append(news_score * self.NEWS_WEIGHT)
            confidences.append(news_confidence * self.NEWS_WEIGHT)
            print(f"   📰 News contribution: {news_score:.2f} (conf: {news_confidence:.2f})")
        
        # 2. Social Sentiment (25%)
        if social_sentiment and social_sentiment.get("confidence", 0) > 0:
            social_score = social_sentiment.get("overall_score", 0)
            social_confidence = social_sentiment.get("confidence", 0)
            scores.append(social_score * self.SOCIAL_WEIGHT)
            confidences.append(social_confidence * self.SOCIAL_WEIGHT)
            print(f"   🗣 Social contribution: {social_score:.2f} (conf: {social_confidence:.2f})")
        
        # 3. ChatGPT-5.1 Analysis (25%)
        if llm_analysis:
            llm_direction = llm_analysis.get("direction", "neutral")
            llm_confidence = llm_analysis.get("confidence", 0.5)
            llm_score = 1.0 if llm_direction == "bullish" else (-1.0 if llm_direction == "bearish" else 0.0)
            scores.append(llm_score * llm_confidence * self.GPT_WEIGHT)
            confidences.append(llm_confidence * self.GPT_WEIGHT)
            print(f"   🤖 ChatGPT-5.1 contribution: {llm_score:.2f} (conf: {llm_confidence:.2f})")
        
        # 4. LSTM Technical (15%)
        if ml_prediction:
            ml_direction = ml_prediction.get("direction", "neutral")
            ml_confidence = ml_prediction.get("overall_confidence", 0.5)
            ml_score = 1.0 if ml_direction == "bullish" else (-1.0 if ml_direction == "bearish" else 0.0)
            scores.append(ml_score * ml_confidence * self.LSTM_WEIGHT)
            confidences.append(ml_confidence * self.LSTM_WEIGHT)
            print(f"   📊 LSTM contribution: {ml_score:.2f} (conf: {ml_confidence:.2f})")
        
        # Calculate final prediction
        if scores:
            overall_score = sum(scores)
            overall_confidence = sum(confidences)
        else:
            overall_score = 0.0
            overall_confidence = 0.3
        
        # Determine direction
        if overall_score > 0.1:
            direction = "bullish"
        elif overall_score < -0.1:
            direction = "bearish"
        else:
            direction = "neutral"
        
        # Calculate expected move
        expected_move = abs(overall_score) * 2.0  # Scale to reasonable %
        
        # Build key factors
        key_factors = []
        
        if news_sentiment and news_sentiment.get("num_articles", 0) > 0:
            key_factors.append({
                "factor": f"News sentiment: {news_sentiment.get('num_articles')} articles analyzed",
                "impact": "high" if news_sentiment.get("confidence", 0) > 0.6 else "medium",
                "sentiment": "positive" if news_sentiment.get("overall_score", 0) > 0 else "negative"
            })
        
        if llm_analysis and llm_analysis.get("key_factors"):
            key_factors.extend(llm_analysis["key_factors"][:3])
        
        # Build risks
        risks = []
        if llm_analysis and llm_analysis.get("risks"):
            risks.extend(llm_analysis["risks"][:3])
        
        if macro_data.get("vix", 0) > 25:
            risks.append({
                "risk": f"Elevated VIX ({macro_data.get('vix', 0):.1f}) indicates market stress",
                "probability": "high"
            })
        
        return {
            "direction": direction,
            "confidence": min(overall_confidence, 1.0),
            "expected_move_percent": expected_move,
            "overall_score": overall_score,
            "key_factors": key_factors,
            "risks": risks,
            "sentiment_breakdown": {
                "news": news_sentiment.get("overall_score", 0) if news_sentiment else 0,
                "social": social_sentiment.get("overall_score", 0) if social_sentiment else 0
            },
            "model_components": {
                "news_weight": self.NEWS_WEIGHT,
                "social_weight": self.SOCIAL_WEIGHT,
                "gpt_weight": self.GPT_WEIGHT,
                "lstm_weight": self.LSTM_WEIGHT
            }
        }

# Singleton instance
prediction_engine = PredictionEngine()

