"""
Training API endpoints
Panel model training with walk-forward validation
"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import Optional, AsyncGenerator
import asyncio
import json
from datetime import datetime

from src.api.models import TrainingTriggerRequest, TrainingStatus
from src.core.training.trainer import train_panel_models
from src.database.models import TrainingRun
from src.database.repositories.training_runs import training_runs_repo

router = APIRouter(prefix="/api/training", tags=["Training"])

# Store active training jobs
training_jobs = {}


async def training_progress_stream(
    operation_id: str,
    universe: list,
    start_date: str,
    end_date: str,
    interval: str,
    horizons: list
) -> AsyncGenerator[str, None]:
    """Stream training progress via SSE"""
    
    # Create training run record
    training_run = TrainingRun.create(
        run_type="panel",
        universe=universe,
        start_date=start_date or "auto",
        end_date=end_date or "auto",
        interval=interval,
        horizons=horizons
    )
    await training_runs_repo.create(training_run)
    
    async def progress_callback(step: str, progress: float, data: dict = None):
        """Callback to send progress updates"""
        event = {
            "type": "progress",
            "step": step,
            "progress": progress,
            "data": data or {},
            "timestamp": datetime.now().isoformat()
        }
        training_jobs[operation_id]["progress"] = progress
        training_jobs[operation_id]["step"] = step
        
        # Update training run status in database
        await training_runs_repo.update_status(training_run.id, "running", progress=progress)
        
        return event
    
    try:
        # Send start event
        yield f"data: {json.dumps({'type': 'start', 'operation_id': operation_id, 'run_id': training_run.id})}\n\n"
        
        # Run training with progress callback
        result = await train_panel_models(
            universe=universe,
            start_date=start_date,
            end_date=end_date,
            interval=interval,
            horizons=horizons,
            callback=progress_callback,
            verbose=True
        )
        
        # Mark as completed in database
        await training_runs_repo.complete(
            training_run.id,
            total_samples=result.get("total_samples", 0),
            total_features=result.get("total_features", 0),
            metrics=result.get("metrics_by_horizon", {}),
            model_paths=result.get("model_paths", {})
        )
        
        # Send completion event
        training_jobs[operation_id]["status"] = "completed"
        training_jobs[operation_id]["result"] = result
        training_jobs[operation_id]["run_id"] = training_run.id
        
        yield f"data: {json.dumps({'type': 'complete', 'result': result, 'run_id': training_run.id})}\n\n"
        
    except Exception as e:
        # Mark as failed in database
        await training_runs_repo.fail(training_run.id, str(e))
        
        # Send error event
        training_jobs[operation_id]["status"] = "failed"
        training_jobs[operation_id]["error"] = str(e)
        
        yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"


@router.post("/panel")
async def train_panel(
    request: Request,
    universe: Optional[list] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    interval: str = "5min",
    horizons: Optional[list] = None
):
    """
    Train panel models with walk-forward validation
    
    Args:
        universe: List of tickers (default: ["SPY", "QQQ", "DIA", "XLK", "XLF", "XLV", "IWM"])
        start_date: Start date (default: 3 years ago)
        end_date: End date (default: today)
        interval: Data interval (5min, 1hour, 1day)
        horizons: Prediction horizons in bars (default: [1, 5, 20])
    
    Returns:
        Training results with metrics
    """
    # Generate operation ID
    operation_id = f"train_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Store job info
    training_jobs[operation_id] = {
        "status": "running",
        "started_at": datetime.now().isoformat(),
        "progress": 0,
        "step": "Initializing..."
    }
    
    # Return SSE stream
    return StreamingResponse(
        training_progress_stream(
            operation_id,
            universe or ["SPY", "QQQ", "DIA", "XLK", "XLF", "XLV", "IWM"],
            start_date,
            end_date,
            interval,
            horizons or [1, 5, 20]
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/status/{operation_id}")
async def get_training_status(operation_id: str):
    """Get status of a training operation"""
    if operation_id not in training_jobs:
        raise HTTPException(status_code=404, detail="Training job not found")
    
    return training_jobs[operation_id]


@router.get("/jobs")
async def list_training_jobs():
    """List all training jobs"""
    return {
        "jobs": [
            {
                "operation_id": op_id,
                **job_info
            }
            for op_id, job_info in training_jobs.items()
        ],
        "total": len(training_jobs)
    }

