"""
FastAPI Server for AI Market Prediction Engine
"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
import uvicorn
from datetime import datetime

from src.inference.prediction_engine import PredictionEngine
from src.backtesting.backtest_engine import BacktestEngine

app = FastAPI(title="LumoTrade ML Backend", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize prediction engine
prediction_engine = PredictionEngine(
    model_path="models/best_model.pth",
    scaler_path="models/scaler.pkl"
)

# Initialize backtest engine
backtest_engine = BacktestEngine()

# Request/Response Models
class PredictionRequest(BaseModel):
    symbol: str = "SPY"
    timeframe: str = "1h"  # 1h, 4h, 1d

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
        "model_loaded": prediction_engine.lstm_model is not None,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/predict")
async def predict(request: PredictionRequest):
    """
    Generate market prediction for given symbol
    """
    try:
        prediction = await prediction_engine.generate_prediction(
            symbol=request.symbol,
            timeframe=request.timeframe
        )
        return {
            "success": True,
            "data": prediction,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
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

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )

