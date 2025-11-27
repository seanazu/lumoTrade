"""
Trading API Endpoints

Provides endpoints for:
- Getting daily predictions
- Triggering model training
- Managing trades
- Getting alerts
"""

import os
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from src.core.prediction.production_model import get_production_model, ProductionModel
from src.core.trading.adaptive_strategy import get_strategy
from src.database.supabase_client import get_supabase_client


# ============================================================================
# Router
# ============================================================================

router = APIRouter(tags=["trading"])


# ============================================================================
# Request/Response Models
# ============================================================================

class PredictionResponse(BaseModel):
    date: str
    direction: str
    confidence: float
    magnitude: float
    trade_signal: str
    signal_strength: str
    position_size: float
    model_accuracy: float
    recommendation: str


class TrainRequest(BaseModel):
    optimize_trials: int = 50


class TrainResponse(BaseModel):
    status: str
    message: str
    task_id: Optional[str] = None


class TrainStatusResponse(BaseModel):
    status: str
    accuracy: Optional[float] = None
    trained_at: Optional[str] = None
    version: Optional[str] = None


class TradeSignal(BaseModel):
    date: str
    ticker: str
    action: str
    direction: str
    confidence: float
    signal_strength: str
    position_size: float
    stop_loss_pct: float
    take_profit_pct: float


class AlertResponse(BaseModel):
    has_alert: bool
    signal: Optional[TradeSignal] = None
    recommendation: str


class ModelStatusResponse(BaseModel):
    loaded: bool
    accuracy: Optional[float] = None
    threshold: Optional[float] = None
    version: Optional[str] = None
    trained_at: Optional[str] = None
    features: Optional[int] = None


# ============================================================================
# Global State
# ============================================================================

# Training state
_training_in_progress = False
_last_training_result = None


# ============================================================================
# Prediction Endpoints
# ============================================================================

@router.get("/predict/today", response_model=PredictionResponse)
async def get_today_prediction():
    """
    Get prediction for today/next trading day.
    
    Returns:
        Prediction with direction, confidence, and trade signal
    """
    model = get_production_model()
    strategy = get_strategy()
    
    # Check if model is trained
    if model.lgb_model is None:
        # Try to load from disk
        try:
            model.load()
        except Exception:
            raise HTTPException(
                status_code=503,
                detail="Model not trained. Please train the model first."
            )
    
    try:
        # Get prediction
        prediction = model.predict()
        
        # Generate trade signal
        signal = strategy.generate_signal(prediction)
        
        # Get recommendation text
        recommendation = strategy.get_daily_recommendation(prediction)
        
        # Save prediction to database
        supabase = get_supabase_client()
        if supabase.enabled:
            prediction_id = str(uuid.uuid4())
            supabase.store_prediction(
                prediction_id=prediction_id,
                symbol="QQQ",
                horizon="1d",
                predicted_direction=prediction['direction'].lower(),
                predicted_return=prediction['magnitude'],
                confidence=prediction['confidence'],
                timestamp=datetime.now()
            )
        
        return PredictionResponse(
            date=prediction['date'],
            direction=prediction['direction'],
            confidence=prediction['confidence'],
            magnitude=prediction['magnitude'],
            trade_signal=prediction['trade_signal'],
            signal_strength=signal['signal_strength'],
            position_size=signal['position_size'],
            model_accuracy=prediction['model_accuracy'],
            recommendation=recommendation
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predict/history")
async def get_prediction_history(limit: int = 30):
    """
    Get historical predictions.
    
    Args:
        limit: Maximum number of predictions to return
    
    Returns:
        List of past predictions
    """
    supabase = get_supabase_client()
    
    if not supabase.enabled:
        return {"predictions": [], "message": "Database not connected"}
    
    predictions = supabase.get_predictions(symbol="QQQ", limit=limit)
    
    return {"predictions": predictions}


# ============================================================================
# Training Endpoints
# ============================================================================

def _run_training(optimize_trials: int):
    """Background task to run training"""
    global _training_in_progress, _last_training_result
    
    try:
        model = get_production_model()
        results = model.train(optimize_trials=optimize_trials)
        
        # Save model
        model.save()
        model.save_to_supabase()
        
        _last_training_result = {
            "status": "completed",
            "accuracy": results['accuracy'],
            "trained_at": results['trained_at'],
            "results": results
        }
        
    except Exception as e:
        _last_training_result = {
            "status": "failed",
            "error": str(e)
        }
    
    finally:
        _training_in_progress = False


@router.post("/train/trigger", response_model=TrainResponse)
async def trigger_training(
    request: TrainRequest,
    background_tasks: BackgroundTasks
):
    """
    Trigger model training.
    
    Args:
        request: Training parameters
    
    Returns:
        Status message
    """
    global _training_in_progress
    
    if _training_in_progress:
        return TrainResponse(
            status="in_progress",
            message="Training already in progress"
        )
    
    _training_in_progress = True
    task_id = str(uuid.uuid4())
    
    # Run training in background
    background_tasks.add_task(_run_training, request.optimize_trials)
    
    return TrainResponse(
        status="started",
        message=f"Training started with {request.optimize_trials} optimization trials",
        task_id=task_id
    )


@router.get("/train/status", response_model=TrainStatusResponse)
async def get_training_status():
    """
    Get training status.
    
    Returns:
        Current training status and model info
    """
    global _training_in_progress, _last_training_result
    
    if _training_in_progress:
        return TrainStatusResponse(status="in_progress")
    
    model = get_production_model()
    
    if model.lgb_model is None:
        try:
            model.load()
        except Exception:
            return TrainStatusResponse(status="not_trained")
    
    return TrainStatusResponse(
        status="trained",
        accuracy=model.accuracy,
        trained_at=model.trained_at.isoformat() if model.trained_at else None,
        version=model.version
    )


# ============================================================================
# Trade Endpoints
# ============================================================================

@router.get("/trades/active")
async def get_active_trades():
    """
    Get currently active trades.
    
    Returns:
        List of active trades
    """
    # For now, return empty list - would need trade tracking
    return {"trades": [], "message": "Trade tracking not yet implemented"}


@router.get("/trades/history")
async def get_trade_history(limit: int = 50):
    """
    Get trade history.
    
    Returns:
        List of past trades
    """
    supabase = get_supabase_client()
    
    if not supabase.enabled:
        return {"trades": [], "message": "Database not connected"}
    
    # Get predictions as proxy for trades
    predictions = supabase.get_predictions(limit=limit)
    
    return {"trades": predictions}


# ============================================================================
# Alert Endpoints
# ============================================================================

@router.get("/alerts/today", response_model=AlertResponse)
async def get_today_alert():
    """
    Get today's trading alert.
    
    Returns:
        Alert with trade signal if applicable
    """
    model = get_production_model()
    strategy = get_strategy()
    
    # Check if model is loaded
    if model.lgb_model is None:
        try:
            model.load()
        except Exception:
            return AlertResponse(
                has_alert=False,
                recommendation="Model not trained. Please train the model first."
            )
    
    try:
        # Get prediction
        prediction = model.predict()
        
        # Generate signal
        signal = strategy.generate_signal(prediction)
        
        # Check if we have a trade signal
        has_alert = signal['position_size'] > 0
        
        recommendation = strategy.get_daily_recommendation(prediction)
        
        trade_signal = None
        if has_alert:
            trade_signal = TradeSignal(
                date=signal['date'],
                ticker=signal['ticker'],
                action=signal['action'],
                direction=signal['direction'],
                confidence=signal['confidence'],
                signal_strength=signal['signal_strength'],
                position_size=signal['position_size'],
                stop_loss_pct=signal['stop_loss_pct'],
                take_profit_pct=signal['take_profit_pct']
            )
        
        return AlertResponse(
            has_alert=has_alert,
            signal=trade_signal,
            recommendation=recommendation
        )
        
    except Exception as e:
        return AlertResponse(
            has_alert=False,
            recommendation=f"Error generating alert: {str(e)}"
        )


# ============================================================================
# Model Endpoints
# ============================================================================

@router.get("/model/status", response_model=ModelStatusResponse)
async def get_model_status():
    """
    Get model status and metadata.
    
    Returns:
        Model status information
    """
    model = get_production_model()
    
    if model.lgb_model is None:
        try:
            model.load()
        except Exception:
            return ModelStatusResponse(loaded=False)
    
    return ModelStatusResponse(
        loaded=True,
        accuracy=model.accuracy,
        threshold=model.best_threshold,
        version=model.version,
        trained_at=model.trained_at.isoformat() if model.trained_at else None,
        features=len(model.feature_cols) if model.feature_cols else None
    )


@router.get("/model/accuracy")
async def get_model_accuracy():
    """
    Get detailed model accuracy stats.
    
    Returns:
        Accuracy breakdown
    """
    model = get_production_model()
    
    if model.lgb_model is None:
        try:
            model.load()
        except Exception:
            raise HTTPException(
                status_code=503,
                detail="Model not trained"
            )
    
    return {
        "accuracy": model.accuracy,
        "threshold": model.best_threshold,
        "weights": {
            "lightgbm": model.best_weights[0],
            "catboost": model.best_weights[1],
            "xgboost": model.best_weights[2]
        },
        "version": model.version,
        "trained_at": model.trained_at.isoformat() if model.trained_at else None
    }


@router.get("/model/features")
async def get_model_features():
    """
    Get feature importance.
    
    Returns:
        Top features by importance
    """
    model = get_production_model()
    
    if model.lgb_model is None:
        try:
            model.load()
        except Exception:
            raise HTTPException(
                status_code=503,
                detail="Model not trained"
            )
    
    importance = model.get_feature_importance(top_n=30)
    
    return {
        "features": importance.to_dict(orient='records'),
        "total_features": len(model.feature_cols)
    }

