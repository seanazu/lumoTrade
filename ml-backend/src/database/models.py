"""
Data models for InstantDB storage
"""
from dataclasses import dataclass, asdict
from typing import Optional, Dict, List
from datetime import datetime
import uuid


@dataclass
class PredictionRecord:
    """Prediction record for storage"""
    id: str
    ticker: str
    index: str
    timestamp: str
    predictions: Dict  # {horizon: {p10, p50, p90, prob_up}}
    features_used: Optional[int] = None
    model_version: Optional[str] = None
    confidence: Optional[float] = None
    created_at: Optional[str] = None
    
    @classmethod
    def create(cls, ticker: str, index: str, predictions: Dict, **kwargs):
        """Create new prediction record"""
        return cls(
            id=str(uuid.uuid4()),
            ticker=ticker,
            index=index,
            timestamp=datetime.now().isoformat(),
            predictions=predictions,
            created_at=datetime.now().isoformat(),
            **kwargs
        )
    
    def to_dict(self):
        """Convert to dictionary"""
        return asdict(self)


@dataclass
class TrainingRun:
    """Training run metadata"""
    id: str
    run_type: str  # "panel", "single", "backtest"
    status: str  # "running", "completed", "failed"
    universe: List[str]
    start_date: str
    end_date: str
    interval: str
    horizons: List[int]
    total_samples: Optional[int] = None
    total_features: Optional[int] = None
    metrics: Optional[Dict] = None  # MAE, coverage, direction_acc by horizon
    model_paths: Optional[Dict] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error: Optional[str] = None
    
    @classmethod
    def create(cls, run_type: str, universe: List[str], start_date: str, 
               end_date: str, interval: str, horizons: List[int]):
        """Create new training run"""
        return cls(
            id=str(uuid.uuid4()),
            run_type=run_type,
            status="running",
            universe=universe,
            start_date=start_date,
            end_date=end_date,
            interval=interval,
            horizons=horizons,
            started_at=datetime.now().isoformat()
        )
    
    def to_dict(self):
        """Convert to dictionary"""
        return asdict(self)


@dataclass
class BacktestResult:
    """Backtest result"""
    id: str
    symbol: str
    strategy: str
    start_date: str
    end_date: str
    initial_capital: float
    final_value: float
    total_return: float
    metrics: Dict  # cagr, sharpe, max_dd, win_rate, etc.
    equity_curve: Optional[List[Dict]] = None
    trades: Optional[List[Dict]] = None
    created_at: Optional[str] = None
    
    @classmethod
    def create(cls, symbol: str, strategy: str, start_date: str, end_date: str,
               initial_capital: float, final_value: float, metrics: Dict, **kwargs):
        """Create new backtest result"""
        return cls(
            id=str(uuid.uuid4()),
            symbol=symbol,
            strategy=strategy,
            start_date=start_date,
            end_date=end_date,
            initial_capital=initial_capital,
            final_value=final_value,
            total_return=((final_value - initial_capital) / initial_capital) * 100,
            metrics=metrics,
            created_at=datetime.now().isoformat(),
            **kwargs
        )
    
    def to_dict(self):
        """Convert to dictionary"""
        return asdict(self)


@dataclass
class ModelMetadata:
    """Model metadata"""
    id: str
    model_type: str  # "quantile", "classifier"
    version: str
    horizon: Optional[int] = None
    quantile: Optional[float] = None
    training_run_id: Optional[str] = None
    file_path: Optional[str] = None
    feature_count: Optional[int] = None
    feature_importance: Optional[Dict] = None
    performance_metrics: Optional[Dict] = None
    created_at: Optional[str] = None
    
    @classmethod
    def create(cls, model_type: str, version: str, **kwargs):
        """Create new model metadata"""
        return cls(
            id=str(uuid.uuid4()),
            model_type=model_type,
            version=version,
            created_at=datetime.now().isoformat(),
            **kwargs
        )
    
    def to_dict(self):
        """Convert to dictionary"""
        return asdict(self)


@dataclass
class MarketSnapshot:
    """Market data snapshot"""
    id: str
    ticker: str
    timestamp: str
    price: float
    volume: Optional[int] = None
    features: Optional[Dict] = None  # Technical indicators, sentiment, etc.
    news_count: Optional[int] = None
    sentiment_score: Optional[float] = None
    
    @classmethod
    def create(cls, ticker: str, price: float, **kwargs):
        """Create new market snapshot"""
        return cls(
            id=str(uuid.uuid4()),
            ticker=ticker,
            timestamp=datetime.now().isoformat(),
            price=price,
            **kwargs
        )
    
    def to_dict(self):
        """Convert to dictionary"""
        return asdict(self)


@dataclass
class AccuracyMetric:
    """Accuracy tracking metric"""
    id: str
    prediction_id: str
    ticker: str
    horizon: int
    predicted_value: float
    actual_value: Optional[float] = None
    error: Optional[float] = None
    prediction_time: str = None
    actual_time: Optional[str] = None
    evaluated: bool = False
    
    @classmethod
    def create(cls, prediction_id: str, ticker: str, horizon: int, 
               predicted_value: float):
        """Create new accuracy metric"""
        return cls(
            id=str(uuid.uuid4()),
            prediction_id=prediction_id,
            ticker=ticker,
            horizon=horizon,
            predicted_value=predicted_value,
            prediction_time=datetime.now().isoformat(),
            evaluated=False
        )
    
    def to_dict(self):
        """Convert to dictionary"""
        return asdict(self)

