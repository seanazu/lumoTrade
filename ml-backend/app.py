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
from datetime import datetime, timedelta

from src.inference.prediction_engine_hybrid import hybrid_prediction_engine
from src.backtesting.backtest_engine import BacktestEngine
from src.sentiment.market_direction_sentiment import market_direction_sentiment
from src.training.continuous_learner import continuous_learner
from src.training.train_lightgbm import train_models as train_lightgbm_models
from config import MODEL_CONFIG, API_CONFIG
import json
from pathlib import Path
import asyncio

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

# Index to Symbol Mapping
INDEX_SYMBOL_MAP = {
    "SPX": "SPY",
    "NDX": "QQQ",
    "DJI": "DIA"
}

# Request/Response Models
class PredictionRequest(BaseModel):
    symbol: Optional[str] = None  # Direct symbol (legacy support)
    index: Optional[str] = "SPX"  # Index: SPX, NDX, or DJI
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

class BacktestCompareRequest(BaseModel):
    symbol: Optional[str] = None
    index: Optional[str] = "SPX"
    start_date: str
    end_date: str
    initial_capital: float = 10000.0
    confidence_threshold: float = 0.70
    kelly_fraction: float = 0.25

class TrainingTriggerRequest(BaseModel):
    index: str = "SPX"  # SPX, NDX, or DJI
    horizons: Optional[List[str]] = None  # Specific horizons or all
    lookback_days: int = 730  # 2 years default

# Global training jobs tracker
training_jobs = {}

class TrainingTriggerRequest(BaseModel):
    index: str = "SPX"  # SPX, NDX, or DJI
    horizons: Optional[List[str]] = None  # Specific horizons or all
    lookback_days: int = 730  # 2 years default

# Global training jobs tracker
training_jobs = {}

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
    
    Supports multi-index predictions: SPX (S&P 500), NDX (Nasdaq 100), DJI (Dow Jones)
    Returns predictions for all horizons: 1h, 4h, 10h, 1d, 3d, 5d
    """
    try:
        # Determine symbol from index or use direct symbol
        if request.index:
            symbol = INDEX_SYMBOL_MAP.get(request.index, "SPY")
            index = request.index
        else:
            symbol = request.symbol or "SPY"
            # Reverse lookup index from symbol
            index = next((k for k, v in INDEX_SYMBOL_MAP.items() if v == symbol), "SPX")
        
        # Override horizons if specified
        if request.horizons:
            original_horizons = hybrid_prediction_engine.horizons
            hybrid_prediction_engine.horizons = request.horizons
        
        prediction = await hybrid_prediction_engine.generate_prediction(
            symbol=symbol,
            timeframe=request.timeframe,
            debug=request.debug
        )
        
        # Add index information to response
        if isinstance(prediction, dict) and "data" in prediction:
            prediction["data"]["index"] = index
            prediction["data"]["symbol"] = symbol
        
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
            prediction_engine=None  # Mock prediction for now
        )
        
        return {
            "success": True,
            "data": results,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/backtest/compare")
async def compare_backtest_strategies(request: BacktestCompareRequest):
    """
    Compare confidence threshold and Kelly criterion strategies
    
    Runs both strategies and returns side-by-side comparison
    """
    try:
        # Determine symbol from index or use direct symbol
        if request.index:
            symbol = INDEX_SYMBOL_MAP.get(request.index, "SPY")
        else:
            symbol = request.symbol or "SPY"
        
        results = await backtest_engine.compare_strategies(
            symbol=symbol,
            start_date=request.start_date,
            end_date=request.end_date,
            initial_capital=request.initial_capital,
            confidence_threshold=request.confidence_threshold,
            kelly_fraction=request.kelly_fraction,
            prediction_engine=hybrid_prediction_engine
        )
        
        return {
            "success": True,
            "data": results,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/training/status")
async def get_training_status():
    """
    Get current training status for all models
    
    Returns model count, last trained date, file sizes, and horizon-specific status
    """
    try:
        models_dir = Path("models")
        models_dir.mkdir(exist_ok=True)
        
        model_status = {}
        horizons = ["1h", "4h", "10h", "1d", "3d", "5d"]
        
        for horizon in horizons:
            model_file = models_dir / f"lgbm_{horizon}.pkl"
            if model_file.exists():
                stat = model_file.stat()
                model_status[horizon] = {
                    "exists": True,
                    "size_mb": round(stat.st_size / (1024 * 1024), 2),
                    "last_modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "path": str(model_file)
                }
            else:
                model_status[horizon] = {
                    "exists": False,
                    "size_mb": 0,
                    "last_modified": None,
                    "path": str(model_file)
                }
        
        # Check for training history
        history_file = models_dir / "training_history.json"
        training_history = None
        if history_file.exists():
            with open(history_file, 'r') as f:
                training_history = json.load(f)
        
        return {
            "success": True,
            "data": {
                "model_status": model_status,
                "total_models": sum(1 for s in model_status.values() if s["exists"]),
                "expected_models": len(horizons),
                "training_history": training_history,
                "active_jobs": len(training_jobs)
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/training/trigger")
async def trigger_training(request: TrainingTriggerRequest):
    """
    Trigger model training for specified index
    
    Starts an async training job and returns job ID for tracking
    """
    try:
        # Generate job ID
        job_id = f"train_{request.index}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Calculate date range
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=request.lookback_days)).strftime("%Y-%m-%d")
        
        # Initialize job status
        training_jobs[job_id] = {
            "job_id": job_id,
            "status": "starting",
            "index": request.index,
            "start_date": start_date,
            "end_date": end_date,
            "horizons": request.horizons or ["1h", "4h", "10h", "1d", "3d", "5d"],
            "progress": 0,
            "started_at": datetime.utcnow().isoformat(),
            "estimated_completion": None,
            "error": None
        }
        
        # Start training in background
        symbol = INDEX_SYMBOL_MAP.get(request.index, "SPY")
        
        # Create background task
        async def run_training():
            try:
                training_jobs[job_id]["status"] = "running"
                training_jobs[job_id]["progress"] = 10
                
                # Run training
                await train_lightgbm_models(
                    index=request.index,
                    start_date=start_date,
                    end_date=end_date
                )
                
                training_jobs[job_id]["status"] = "completed"
                training_jobs[job_id]["progress"] = 100
                training_jobs[job_id]["completed_at"] = datetime.utcnow().isoformat()
                
                # Reload models
                await hybrid_prediction_engine.lgbm_predictor.load()
                
            except Exception as e:
                training_jobs[job_id]["status"] = "failed"
                training_jobs[job_id]["error"] = str(e)
                print(f"Training job {job_id} failed: {e}")
        
        # Start the background task
        asyncio.create_task(run_training())
        
        return {
            "success": True,
            "data": {
                "job_id": job_id,
                "status": "starting",
                "message": f"Training job started for {request.index}"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/training/progress/{job_id}")
async def get_training_progress(job_id: str):
    """
    Get training progress for a specific job
    
    Returns progress percentage, current metrics, and estimated time remaining
    """
    try:
        if job_id not in training_jobs:
            raise HTTPException(status_code=404, detail=f"Training job {job_id} not found")
        
        job = training_jobs[job_id]
        
        # Calculate estimated time remaining
        if job["status"] == "running" and job["progress"] > 0:
            started_at = datetime.fromisoformat(job["started_at"])
            elapsed = (datetime.utcnow() - started_at).total_seconds()
            estimated_total = elapsed / (job["progress"] / 100)
            estimated_remaining = estimated_total - elapsed
            job["estimated_remaining_seconds"] = int(estimated_remaining)
        else:
            job["estimated_remaining_seconds"] = None
        
        return {
            "success": True,
            "data": job,
            "timestamp": datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
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

@app.get("/api/accuracy/history")
async def get_accuracy_history(days: int = 30):
    """
    Get historical accuracy trends over time
    
    Args:
        days: Number of days to look back (default 30, max 90)
    
    Returns:
        Time series accuracy data, accuracy by horizon, confidence calibration,
        and prediction vs actual overlays
    """
    try:
        from src.monitoring.accuracy_tracker import accuracy_tracker
        
        # Clamp days to reasonable range
        days = max(1, min(days, 90))
        
        history = accuracy_tracker.get_historical_accuracy(days=days)
        
        return {
            "success": True,
            "data": history,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
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

