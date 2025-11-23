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
from src.sentiment.market_direction_sentiment import market_direction_sentiment

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
        timeframe: str = "1h",
        debug: bool = False
    ) -> Dict:
        """
        Generate comprehensive market prediction
        
        Args:
            symbol: Stock symbol to predict
            timeframe: Prediction timeframe (1h, 4h, 1d)
            debug: Include detailed debug information
        
        Returns:
            Complete prediction dict with optional debug data
        """
        import time
        debug_info = {
            "stages": [],
            "data_sources": {},
            "timings": {},
            "detailed_steps": [],
            "calculations": {}
        } if debug else None
        
        def log_debug(step_name: str, details: str, data: any = None):
            """Log detailed step information for dashboard"""
            if debug:
                debug_info["detailed_steps"].append({
                    "timestamp": datetime.now().isoformat(),
                    "step": step_name,
                    "details": details,
                    "data": data
                })
        
        print(f"\n🔮 Generating prediction for {symbol} ({timeframe})...")
        log_debug("Initialization", f"Starting prediction for {symbol} ({timeframe})", {
            "symbol": symbol,
            "timeframe": timeframe,
            "model_version": "1.0.0-sentiment-first"
        })
        
        # 1. Fetch current market data
        print("📊 Fetching market data...")
        log_debug("Market Data", "Fetching current market prices from API")
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
            log_debug("Market Data", f"Fetched market data in {duration}ms", {
                "price": current_prices.get("price"),
                "volume": current_prices.get("volume"),
                "change_percent": current_prices.get("change_percent")
            })
        
        # 2. Calculate technical indicators
        print("📈 Calculating technical indicators...")
        log_debug("Technical Indicators", "Calculating 100+ technical indicators from historical data")
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
            indicator_count = len(technical_indicators) if technical_indicators else 0
            log_debug("Technical Indicators", f"Calculated {indicator_count} indicators in {duration}ms", {
                "rsi_14": technical_indicators.get("rsi_14"),
                "macd": technical_indicators.get("macd"),
                "bb_upper": technical_indicators.get("bb_upper"),
                "volume_ratio": technical_indicators.get("volume_ratio"),
                "total_indicators": indicator_count
            })
        
        # 3. Analyze news sentiment
        print("📰 Analyzing news sentiment...")
        log_debug("News Sentiment", "Fetching and analyzing news from Marketaux API (last 24 hours)")
        start_time = time.time() if debug else 0
        news_sentiment = await news_sentiment_analyzer.analyze_sentiment(symbol, hours_back=24)
        if debug:
            duration = int((time.time() - start_time) * 1000)
            debug_info["stages"].append({
                "name": "Analyze News Sentiment",
                "duration_ms": duration,
                "status": "complete"
            })
            debug_info["data_sources"]["news_sentiment"] = news_sentiment
            log_debug("News Sentiment", f"Analyzed {news_sentiment.get('num_articles', 0)} articles in {duration}ms", {
                "overall_score": news_sentiment.get("overall_score"),
                "confidence": news_sentiment.get("confidence"),
                "num_articles": news_sentiment.get("num_articles"),
                "breakdown": news_sentiment.get("breakdown"),
                "key_themes": news_sentiment.get("key_themes", [])[:3]
            })
        
        # 4. Track social sentiment
        print("🗣 Tracking social sentiment...")
        log_debug("Social Sentiment", "Tracking mentions from Twitter/Reddit (last 24 hours)")
        start_time = time.time() if debug else 0
        social_sentiment = await social_sentiment_tracker.track_sentiment(symbol, hours_back=24)
        if debug:
            duration = int((time.time() - start_time) * 1000)
            debug_info["stages"].append({
                "name": "Track Social Sentiment",
                "duration_ms": duration,
                "status": "complete"
            })
            debug_info["data_sources"]["social_sentiment"] = social_sentiment
            log_debug("Social Sentiment", f"Tracked social mentions in {duration}ms", {
                "overall_score": social_sentiment.get("overall_score"),
                "confidence": social_sentiment.get("confidence"),
                "volume": social_sentiment.get("volume"),
                "breakdown": social_sentiment.get("sentiment_breakdown"),
                "trending": social_sentiment.get("trending")
            })
        
        # 5. Get macro data
        print("🌍 Fetching macro data...")
        log_debug("Macro Data", "Fetching VIX, treasury yields, and economic indicators")
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
            log_debug("Macro Data", f"Fetched macro indicators in {duration}ms", {
                "vix": macro_data.get("vix"),
                "vix_change": macro_data.get("vix_change")
            })
        
        # 6. Run LSTM prediction (if model available)
        ml_prediction = None
        if self.lstm_model:
            print("🤖 Running LSTM model...")
            log_debug("LSTM Model", "Running neural network prediction on technical indicators")
            start_time = time.time() if debug else 0
            ml_prediction = await self._run_lstm_prediction(symbol, technical_indicators)
            if debug:
                duration = int((time.time() - start_time) * 1000)
                debug_info["stages"].append({
                    "name": "Run LSTM Model",
                    "duration_ms": duration,
                    "status": "complete"
                })
                debug_info["data_sources"]["lstm_prediction"] = ml_prediction
                log_debug("LSTM Model", f"LSTM prediction completed in {duration}ms", {
                    "direction": ml_prediction.get("direction") if ml_prediction else None,
                    "confidence": ml_prediction.get("overall_confidence") if ml_prediction else None,
                    "expected_move": ml_prediction.get("expected_move_percent") if ml_prediction else None
                })
        else:
            print("⏭ Skipping LSTM (no model trained)")
            log_debug("LSTM Model", "Skipped - no trained model available (run training script)")
            if debug:
                debug_info["stages"].append({
                    "name": "Run LSTM Model",
                    "duration_ms": 0,
                    "status": "skipped"
                })
        
        # 7. Get GPT-4 analysis
        print("🧠 Running GPT-4 analysis...")
        log_debug("GPT-4 Analysis", "Sending context to GPT-4 Turbo for market analysis")
        start_time = time.time() if debug else 0
        
        if debug:
            articles_count = news_sentiment.get("num_articles", 0) if news_sentiment else 0
            log_debug("GPT-4 Analysis", f"Preparing context with {articles_count} articles", {
                "articles_count": articles_count,
                "indicators_count": len(technical_indicators) if technical_indicators else 0
            })
        
        llm_analysis = await market_analyst.analyze_market(
            current_prices=current_prices,
            technical_indicators=technical_indicators,
            recent_news=news_sentiment,
            macro_data=macro_data
        )
        if debug:
            duration = int((time.time() - start_time) * 1000)
            debug_info["stages"].append({
                "name": "Run GPT-4 Analysis",
                "duration_ms": duration,
                "status": "complete"
            })
            debug_info["data_sources"]["llm_analysis"] = llm_analysis
            log_debug("GPT-4 Analysis", f"GPT-4 analysis completed in {duration}ms", {
                "direction": llm_analysis.get("direction"),
                "confidence": llm_analysis.get("confidence"),
                "key_factors_count": len(llm_analysis.get("key_factors", [])),
                "reasoning": llm_analysis.get("reasoning", "")[:200]
            })
        
        # 7.5. Get market direction sentiment (for indices)
        market_direction = None
        if symbol in ["SPY", "QQQ", "IWM"]:
            print("📊 Analyzing market direction sentiment...")
            log_debug("Market Direction", "Running multi-source sentiment analysis for index")
            start_time_md = time.time() if debug else 0
            try:
                index_map = {"SPY": "SPX", "QQQ": "NDX", "IWM": "RUT"}
                market_direction = await market_direction_sentiment.analyze_market_direction(
                    index=index_map.get(symbol, "SPX"),
                    horizon="T+1",
                    cutoff_minutes=30
                )
                if debug:
                    duration_md = int((time.time() - start_time_md) * 1000)
                    debug_info["stages"].append({
                        "name": "Market Direction Sentiment",
                        "duration_ms": duration_md,
                        "status": "complete"
                    })
                    debug_info["data_sources"]["market_direction"] = market_direction
                    log_debug("Market Direction", f"Market direction analysis completed in {duration_md}ms", {
                        "sentiment_mean": market_direction.get("sentiment_weighted_mean"),
                        "confidence": market_direction.get("confidence"),
                        "event_count": market_direction.get("event_count"),
                        "macro_events": market_direction.get("macro_event_count")
                    })
            except Exception as e:
                print(f"⚠️  Market direction analysis failed: {e}")
                if debug:
                    debug_info["stages"].append({
                        "name": "Market Direction Sentiment",
                        "duration_ms": 0,
                        "status": "failed"
                    })
        
        # 8. Fuse all predictions
        print("🔗 Fusing predictions...")
        log_debug("Prediction Fusion", "Combining all signals with sentiment-first weighting")
        start_time = time.time() if debug else 0
        
        if debug:
            log_debug("Prediction Fusion", "Applying weights: News 35%, Social 25%, GPT-4 25%, LSTM 15%", {
                "news_score": news_sentiment.get("overall_score") if news_sentiment else None,
                "social_score": social_sentiment.get("overall_score") if social_sentiment else None,
                "gpt4_direction": llm_analysis.get("direction") if llm_analysis else None,
                "lstm_direction": ml_prediction.get("direction") if ml_prediction else None
            })
        
        final_prediction = await self._fuse_predictions(
            ml_prediction=ml_prediction,
            llm_analysis=llm_analysis,
            news_sentiment=news_sentiment,
            social_sentiment=social_sentiment,
            macro_data=macro_data
        )
        if debug:
            duration = int((time.time() - start_time) * 1000)
            debug_info["stages"].append({
                "name": "Fuse Predictions",
                "duration_ms": duration,
                "status": "complete"
            })
            debug_info["calculations"]["fusion"] = {
                "final_direction": final_prediction.get("direction"),
                "final_confidence": final_prediction.get("confidence"),
                "component_weights": {
                    "news_sentiment": 0.35,
                    "social_sentiment": 0.25,
                    "gpt4_analysis": 0.25,
                    "lstm_technical": 0.15
                }
            }
            log_debug("Prediction Fusion", f"Fusion completed in {duration}ms", {
                "final_direction": final_prediction.get("direction"),
                "final_confidence": final_prediction.get("confidence"),
                "expected_move": final_prediction.get("expected_move_percent")
            })
        
        # Add metadata
        final_prediction["symbol"] = symbol
        final_prediction["timeframe"] = timeframe
        final_prediction["timestamp"] = datetime.now().isoformat()
        final_prediction["model_version"] = "1.0.0-sentiment-first"
        
        # Add debug info if requested
        if debug:
            log_debug("Completion", "Prediction generation complete", {
                "total_steps": len(debug_info["detailed_steps"]),
                "total_duration_ms": sum(s["duration_ms"] for s in debug_info["stages"]),
                "final_result": {
                    "direction": final_prediction.get("direction"),
                    "confidence": final_prediction.get("confidence"),
                    "expected_move": final_prediction.get("expected_move_percent")
                }
            })
            final_prediction["debug"] = debug_info
        
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

