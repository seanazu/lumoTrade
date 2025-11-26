"""
Prediction API endpoints
Real-time predictions using panel-trained models
"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator
import json
from datetime import datetime

from src.api.models import PredictionRequest, PredictionResponse
from src.core.inference.engine import PanelPredictionEngine
from src.database.models import PredictionRecord
from src.database.repositories.predictions import predictions_repo

router = APIRouter(prefix="/api/predict", tags=["Prediction"])

# Initialize prediction engine
prediction_engine = PanelPredictionEngine()


@router.post("/", response_model=PredictionResponse)
async def generate_prediction(request: PredictionRequest):
    """
    Generate prediction for a ticker
    
    Args:
        symbol: Ticker symbol (e.g., "SPY")
        index: Index name (default: "SPX")
        horizons: Prediction horizons (default: [1, 5, 20])
    
    Returns:
        Predictions with P10, P50, P90 for each horizon
    """
    try:
        # Generate prediction
        result = await prediction_engine.generate_prediction(
            ticker=request.symbol,
            index=request.index,
            horizons=request.horizons
        )
        
        # Store prediction in InstantDB
        prediction_record = PredictionRecord.create(
            ticker=request.symbol,
            index=request.index,
            predictions=result.get("predictions", {}),
            confidence=result.get("reasoning", {}).get("confidence"),
            model_version="2.0.0"
        )
        
        # Save to database (async)
        await predictions_repo.create(prediction_record)
        
        return PredictionResponse(
            symbol=request.symbol,
            timestamp=datetime.now().isoformat(),
            predictions=result.get("predictions", {}),
            reasoning=result.get("reasoning", {})
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


@router.get("/stream/{operation_id}")
async def stream_prediction(
    request: Request,
    operation_id: str,
    ticker: str,
    index: str = "SPX"
):
    """
    Stream prediction generation progress
    
    Args:
        operation_id: Unique operation ID
        ticker: Ticker symbol
        index: Index name
    
    Returns:
        SSE stream of prediction progress
    """
    async def prediction_stream() -> AsyncGenerator[str, None]:
        try:
            # Send start event
            yield f"data: {json.dumps({'type': 'start', 'ticker': ticker})}\n\n"
            
            # Generate prediction
            result = await prediction_engine.generate_prediction(
                ticker=ticker,
                index=index,
                horizons=[1, 5, 20]
            )
            
            # Send result
            yield f"data: {json.dumps({'type': 'complete', 'result': result})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
    
    return StreamingResponse(
        prediction_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )


@router.get("/health")
async def prediction_health():
    """Check prediction engine health"""
    return {
        "status": "operational",
        "models_loaded": prediction_engine.quantile_models is not None,
        "timestamp": datetime.now().isoformat()
    }

