"""
FastAPI Server for AI Market Prediction Engine
"""
import os
from dotenv import load_dotenv

# Load environment variables FIRST before importing anything else
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
import uvicorn
from datetime import datetime

from src.inference.prediction_engine_hybrid import hybrid_prediction_engine
from src.backtesting.backtest_engine import BacktestEngine
from src.sentiment.market_direction_sentiment import market_direction_sentiment
from src.training.continuous_learner import continuous_learner
from config import MODEL_CONFIG, API_CONFIG

app = FastAPI(
    title="LumoTrade Hybrid ML Backend",
    version=MODEL_CONFIG["model_version"]
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=API_CONFIG["cors_origins"],
    allow_credentials=API_CONFIG["cors_credentials"],
    allow_methods=API_CONFIG["cors_methods"],
    allow_headers=API_CONFIG["cors_headers"],
    expose_headers=["*"],
    max_age=3600,
)

# Initialize backtest engine
backtest_engine = BacktestEngine()

# Request/Response Models
class PredictionRequest(BaseModel):
    symbol: str = "SPY"
    timeframe: str = "1d"  # Primary display timeframe
    horizons: Optional[List[str]] = None  # Specific horizons to predict (default: all 6)
    debug: bool = True  # Include detailed debug information

class ExplainRequest(BaseModel):
    symbol: str
    question: str

class BacktestRequest(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    initial_capital: float = 10000.0
    strategy: str = "follow_prediction"

@app.get("/")
async def root():
    return {
        "service": "LumoTrade ML Backend",
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": len(hybrid_prediction_engine.lgbm_predictor.models) > 0,
        "num_models": len(hybrid_prediction_engine.lgbm_predictor.models),
        "horizons": hybrid_prediction_engine.horizons,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/predict")
async def predict(request: PredictionRequest):
    """
    Generate multi-horizon market prediction using hybrid system
    
    Returns predictions for all horizons: 1h, 4h, 10h, 1d, 3d, 5d
    """
    try:
        # Override horizons if specified
        if request.horizons:
            original_horizons = hybrid_prediction_engine.horizons
            hybrid_prediction_engine.horizons = request.horizons
        
        prediction = await hybrid_prediction_engine.generate_prediction(
            symbol=request.symbol,
            timeframe=request.timeframe,
            debug=request.debug
        )
        
        # Restore original horizons
        if request.horizons:
            hybrid_prediction_engine.horizons = original_horizons
        
        return prediction
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/explain")
async def explain_prediction(request: ExplainRequest):
    """
    Get natural language explanation for a prediction
    """
    try:
        # Get current prediction
        prediction = await prediction_engine.generate_prediction(
            symbol=request.symbol,
            timeframe="1h"
        )
        
        # Generate explanation using LLM
        from src.llm.market_analyst import market_analyst
        explanation = await market_analyst.explain_prediction(
            prediction=prediction,
            user_question=request.question
        )
        
        return {
            "success": True,
            "explanation": explanation,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/backtest")
async def run_backtest(request: BacktestRequest):
    """
    Run backtest simulation
    """
    try:
        results = await backtest_engine.run_backtest(
            symbol=request.symbol,
            start_date=request.start_date,
            end_date=request.end_date,
            initial_capital=request.initial_capital,
            strategy=request.strategy,
            prediction_engine=prediction_engine
        )
        
        return {
            "success": True,
            "data": results,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/accuracy")
async def get_accuracy_metrics():
    """
    Get model accuracy metrics
    """
    try:
        from src.monitoring.accuracy_tracker import accuracy_tracker
        metrics = await accuracy_tracker.get_metrics()
        
        return {
            "success": True,
            "data": metrics,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/market-direction")
async def analyze_market_direction(
    index: str = "SPX",
    horizon: str = "T+1",
    cutoff_minutes: int = 30
):
    """
    Analyze market direction sentiment using multi-source pipeline
    
    Args:
        index: SPX, NDX, or RUT
        horizon: T+1 (next day), T+3 (3-day), T+5 (5-day)
        cutoff_minutes: minutes before market close for cutoff
    """
    try:
        result = await market_direction_sentiment.analyze_market_direction(
            index=index,
            horizon=horizon,
            cutoff_minutes=cutoff_minutes
        )
        
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/learning/performance")
async def get_learning_performance():
    """
    Get continuous learning performance metrics
    
    Returns accuracy, prediction history, and retraining status
    """
    try:
        summary = continuous_learner.get_performance_summary()
        should_retrain, reason = continuous_learner.should_retrain()
        
        return {
            "success": True,
            "data": {
                **summary,
                "should_retrain": should_retrain,
                "retrain_reason": reason
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/learning/update-outcomes")
async def update_outcomes():
    """
    Update predictions with actual outcomes
    
    This checks all pending predictions and validates them against
    actual market movements. Should be run periodically (e.g., hourly).
    """
    try:
        await continuous_learner.update_actual_outcomes()
        
        summary = continuous_learner.get_performance_summary()
        
        return {
            "success": True,
            "data": {
                "message": "Outcomes updated successfully",
                "performance": summary
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class RetrainRequest(BaseModel):
    index: str = "SPX"
    lookback_days: int = 90
    force: bool = False  # Force retrain even if not needed

@app.post("/api/learning/retrain")
async def retrain_models(request: RetrainRequest):
    """
    Trigger incremental retraining
    
    Args:
        index: Index to retrain (SPX, NDX, RUT)
        lookback_days: How many days of recent data to use
        force: Force retrain even if conditions aren't met
    """
    try:
        if not request.force:
            should_retrain, reason = continuous_learner.should_retrain()
            if not should_retrain:
                return {
                    "success": False,
                    "message": f"Retraining not needed: {reason}",
                    "timestamp": datetime.utcnow().isoformat()
                }
        
        # Perform incremental retraining
        await continuous_learner.incremental_retrain(
            index=request.index,
            lookback_days=request.lookback_days
        )
        
        return {
            "success": True,
            "data": {
                "message": "Retraining completed successfully",
                "index": request.index,
                "lookback_days": request.lookback_days
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/learning/auto-retrain")
async def auto_retrain():
    """
    Automatically retrain if conditions are met
    
    This endpoint should be called by a cron job daily
    """
    try:
        await continuous_learner.auto_retrain_if_needed()
        
        summary = continuous_learner.get_performance_summary()
        
        return {
            "success": True,
            "data": {
                "message": "Auto-retrain check completed",
                "performance": summary
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )

