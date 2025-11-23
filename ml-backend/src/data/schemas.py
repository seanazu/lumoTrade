"""
Data Schemas for Hybrid ML System
Pydantic models for type safety and validation
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal
from datetime import datetime


class NewsArticle(BaseModel):
    """Normalized news article schema across all providers"""
    id: str
    provider: Literal["fmp", "marketaux", "polygon"]
    headline: str
    summary: Optional[str] = None
    body: Optional[str] = None
    source_name: str
    source_url: str
    published_at: datetime
    tickers: List[str] = Field(default_factory=list)
    entities: List[Dict] = Field(default_factory=list)  # {symbol, type, sentiment, match_score}
    sentiment_raw: Optional[float] = None
    sentiment_std: float  # Standardized sentiment (-1 to +1)
    index_tags: List[str] = Field(default_factory=list)  # ["SPX", "NDX", "RUT"]
    is_macro: bool = False


class SentimentEvent(BaseModel):
    """Clustered news event with aggregated sentiment"""
    event_id: str
    indices: List[str]  # Which indices this event affects
    start_time: datetime
    end_time: datetime
    articles: List[NewsArticle]
    main_headline: str
    sentiment_event: float  # Event-level sentiment (-1 to +1)
    importance: float  # 0 to 1
    is_macro_event: bool
    source_tier_avg: float  # Average source quality (0 to 1)


class IntraDayBar(BaseModel):
    """Intraday OHLCV bar"""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    symbol: str


class DailyBar(BaseModel):
    """Daily OHLCV bar"""
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    symbol: str


class FeatureRow(BaseModel):
    """Complete feature vector for one timestamp"""
    timestamp: datetime
    index: str  # SPX, NDX, or RUT
    
    # Price features
    price_features: Dict[str, float] = Field(default_factory=dict)
    
    # News features (high priority)
    news_features: Dict[str, float] = Field(default_factory=dict)
    
    # Macro features
    macro_features: Dict[str, float] = Field(default_factory=dict)
    
    # Breadth features
    breadth_features: Dict[str, float] = Field(default_factory=dict)
    
    # Calendar features
    calendar_features: Dict[str, float] = Field(default_factory=dict)
    
    def to_flat_dict(self) -> Dict[str, float]:
        """Flatten all feature groups into single dict"""
        flat = {}
        flat.update(self.price_features)
        flat.update(self.news_features)
        flat.update(self.macro_features)
        flat.update(self.breadth_features)
        flat.update(self.calendar_features)
        return flat


class PredictionTarget(BaseModel):
    """6-horizon prediction targets"""
    timestamp: datetime
    index: str
    
    # Log returns for each horizon
    r_1h: Optional[float] = None   # 1-hour return
    r_4h: Optional[float] = None   # 4-hour return
    r_10h: Optional[float] = None  # 10-hour return
    r_1d: Optional[float] = None   # 1-day return
    r_3d: Optional[float] = None   # 3-day return
    r_5d: Optional[float] = None   # 5-day return
    
    def to_array(self) -> List[Optional[float]]:
        """Convert to array format for ML"""
        return [self.r_1h, self.r_4h, self.r_10h, self.r_1d, self.r_3d, self.r_5d]


class HorizonPrediction(BaseModel):
    """Prediction for a single horizon"""
    horizon: str  # "1h", "4h", "10h", "1d", "3d", "5d"
    mean: float  # Expected return
    p10: float   # 10th percentile
    p90: float   # 90th percentile
    direction: Literal["up", "down", "neutral"]
    confidence: float  # 0 to 1


class MultiHorizonPrediction(BaseModel):
    """Complete prediction across all horizons"""
    index: str
    timestamp: datetime
    
    # Predictions per horizon
    horizons: Dict[str, HorizonPrediction]
    
    # Key factors
    key_factors: List[Dict] = Field(default_factory=list)
    qualitative_risks: List[str] = Field(default_factory=list)
    
    # Model metadata
    model_version: str
    base_ml_weight: float
    llm_adjustment_weight: float
    
    # Feature importance (top 10)
    top_features: List[Dict] = Field(default_factory=list)  # [{name, importance, value}]


class SocialSentimentResult(BaseModel):
    """ChatGPT-5 web search social sentiment result"""
    social_sentiment_score: float = Field(..., ge=-1, le=1)
    confidence: float = Field(..., ge=0, le=1)
    volume_trend: Literal["increasing", "stable", "decreasing"]
    key_themes: List[str] = Field(default_factory=list)
    notes: str
    sources_searched: List[str] = Field(default_factory=list)  # ["twitter", "reddit", "stocktwits"]
    timestamp: datetime


class MacroData(BaseModel):
    """Cross-asset and macro indicators"""
    timestamp: datetime
    
    # VIX
    vix_level: float
    vix_1d_return: float
    vix_5d_return: float
    vix_zscore: float
    
    # Treasury yields
    yield_2y: Optional[float] = None
    yield_10y: Optional[float] = None
    yield_curve_slope: Optional[float] = None  # 10y - 2y
    
    # Dollar index
    dxy_level: Optional[float] = None
    dxy_1d_return: Optional[float] = None
    
    # Commodities
    gold_level: Optional[float] = None
    oil_level: Optional[float] = None


class BreadthData(BaseModel):
    """Market breadth indicators"""
    timestamp: datetime
    index: str
    
    # Constituent analysis
    pct_constituents_up: Optional[float] = None
    pct_above_50d_ma: Optional[float] = None
    pct_above_200d_ma: Optional[float] = None
    new_52w_highs: Optional[int] = None
    new_52w_lows: Optional[int] = None
    
    # Equal-weight vs cap-weight
    equal_weight_return: Optional[float] = None
    cap_weight_return: Optional[float] = None


class CalendarEvent(BaseModel):
    """Macro calendar event"""
    date: datetime
    event_type: Literal["FOMC", "CPI", "PPI", "NFP", "GDP", "EARNINGS"]
    importance: Literal["high", "medium", "low"]
    description: str

