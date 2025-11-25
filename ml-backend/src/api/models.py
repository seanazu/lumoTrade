"""
Pydantic models for API requests and responses
"""
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime


# ============================================================================
# Prediction Models
# ============================================================================

class PredictionRequest(BaseModel):
    symbol: str
    index: str = "SPX"
    horizons: Optional[List[int]] = [1, 5, 20]


class PredictionResponse(BaseModel):
    symbol: str
    timestamp: str
    predictions: Dict
    reasoning: Optional[Dict] = None


class ExplainRequest(BaseModel):
    symbol: str
    index: str = "SPX"


# ============================================================================
# Training Models
# ============================================================================

class TrainingTriggerRequest(BaseModel):
    index: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    force: bool = False


class TrainingStatus(BaseModel):
    is_training: bool
    job_id: Optional[str] = None
    progress: Optional[float] = None
    status: Optional[str] = None


# ============================================================================
# Backtest Models
# ============================================================================

class BacktestRequest(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    initial_capital: float = 100000
    strategy: str = "ml_prediction"


class BacktestCompareRequest(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    initial_capital: float = 100000
    strategies: List[str] = ["ml_prediction", "buy_hold"]


class BacktestResponse(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    initial_capital: float
    final_value: float
    total_return: float
    metrics: Dict


# ============================================================================
# Learning Models
# ============================================================================

class RetrainRequest(BaseModel):
    index: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class UpdateOutcomesResponse(BaseModel):
    updated_count: int
    accuracy: float
    message: str


# ============================================================================
# Market Analysis Models
# ============================================================================

class MarketDirectionRequest(BaseModel):
    symbol: str
    lookback_days: int = 30


class MarketDirectionResponse(BaseModel):
    symbol: str
    sentiment: float
    direction: str
    confidence: float
    analysis: Dict


# ============================================================================
# Data Management Models
# ============================================================================

class BackfillRequest(BaseModel):
    start_date: str
    end_date: str
    indices: Optional[List[str]] = None


class BackfillStatus(BaseModel):
    job_id: str
    status: str
    progress: Optional[float] = None
    message: Optional[str] = None


# ============================================================================
# Streaming Models
# ============================================================================

class StreamEvent(BaseModel):
    type: str  # "progress", "data", "complete", "error"
    data: Dict
    timestamp: str = None

    def __init__(self, **data):
        if data.get("timestamp") is None:
            data["timestamp"] = datetime.now().isoformat()
        super().__init__(**data)

