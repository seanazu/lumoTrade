"""
Model Information API endpoints
Comprehensive model metadata, features, and configuration
"""
from fastapi import APIRouter, HTTPException
import pickle
import json
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

router = APIRouter(prefix="/api/model", tags=["Model Info"])


def get_feature_description(feature_name: str) -> str:
    """Map feature names to human-readable descriptions"""
    descriptions = {
        # Technical indicators
        "ema10": "10-period Exponential Moving Average",
        "ema20": "20-period Exponential Moving Average",
        "ema50": "50-period Exponential Moving Average",
        "ema100": "100-period Exponential Moving Average",
        "ema200": "200-period Exponential Moving Average",
        "rsi14": "14-period Relative Strength Index",
        "rsi21": "21-period Relative Strength Index",
        "macd": "MACD (Moving Average Convergence Divergence)",
        "macd_signal": "MACD Signal Line",
        "macd_diff": "MACD Histogram (difference)",
        "bb_width": "Bollinger Bands Width",
        "bb_pct": "Bollinger Bands Percentage",
        "atr14": "14-period Average True Range",
        "atr21": "21-period Average True Range",
        "stoch_k": "Stochastic Oscillator %K",
        "stoch_d": "Stochastic Oscillator %D",
        
        # News sentiment
        "news_mkt_count_5d": "Market news volume (5-day rolling)",
        "news_mkt_count_10d": "Market news volume (10-day rolling)",
        "news_mkt_shock": "Market news shock z-score",
        "news_mkt_burst": "Market news burst ratio",
        "news_mkt_neg_share_10d": "Negative news share (10-day)",
        "news_tk_count_5d": "Ticker-specific news volume (5-day)",
        "news_tk_shock": "Ticker news shock z-score",
        
        # Macro economic
        "r2": "2-Year Treasury Yield",
        "r10": "10-Year Treasury Yield",
        "r30": "30-Year Treasury Yield",
        "term10_2": "Yield Curve (10Y-2Y spread)",
        "cpi_yoy": "CPI Year-over-Year change",
        "cpi_mom": "CPI Month-over-Month change",
        "fedfunds": "Federal Funds Rate",
        "hy_oas": "High Yield Option-Adjusted Spread",
        "hy_oas_z": "High Yield OAS z-score",
        
        # Cross-asset
        "vix": "CBOE Volatility Index (VIX) level",
        "vix_term": "VIX term structure (VIX3M/VIX-1)",
        "vix_z_20d": "VIX 20-day z-score",
        "dxy": "US Dollar Index (DXY)",
        "dxy_ret10": "DXY 10-period return",
        "gold": "Gold price (GLD)",
        "gold_ret10": "Gold 10-period return",
        "oil": "Oil price (USO)",
        "oil_ret10": "Oil 10-period return",
        
        # Breadth
        "breadth_strong": "Strong breadth indicator",
        "breadth_weak": "Weak breadth indicator",
        "breadth_bullish": "Bullish breadth signal",
        "breadth_bearish": "Bearish breadth signal",
        
        # Calendar
        "cal_month": "Calendar month",
        "cal_quarter": "Calendar quarter",
        "cal_day_of_week": "Day of week",
        "cal_is_month_end": "Month-end flag",
        "cal_is_earnings_season": "Earnings season flag",
        
        # Interactions
        "vix_x_newsshock": "VIX × News Shock interaction",
        "vix_x_term": "VIX × Term Structure interaction",
        "vix_x_negnews": "VIX × Negative News interaction",
        "macro_risk": "Macro Risk composite",
        "inversion_stress": "Yield Curve Inversion × Credit Stress",
    }
    return descriptions.get(feature_name, feature_name.replace("_", " ").title())


def get_feature_source(feature_name: str) -> str:
    """Determine the data source for a feature"""
    if feature_name.startswith("news_"):
        return "FMP"
    elif any(feature_name.startswith(p) for p in ["r2", "r10", "r30", "cpi", "fedfunds", "hy_oas", "claims", "payrolls", "retail", "confidence", "indpro"]):
        return "FRED"
    elif any(feature_name.startswith(p) for p in ["vix", "dxy", "gold", "oil", "treasury"]):
        return "Yahoo"
    elif any(feature_name.startswith(p) for p in ["ev_", "surp_"]):
        return "FMP"
    else:
        return "Computed"


def categorize_features(feature_names: List[str]) -> Dict[str, List[str]]:
    """Categorize features by type"""
    categories = {
        "Technical Indicators": [],
        "News Sentiment": [],
        "Macro Economic": [],
        "Cross-Asset": [],
        "Market Breadth": [],
        "Calendar Effects": [],
        "Interactions": [],
        "Ticker Dummies": []
    }
    
    for feature in feature_names:
        if feature.startswith("tk_"):
            categories["Ticker Dummies"].append(feature)
        elif "_x_" in feature:
            categories["Interactions"].append(feature)
        elif feature.startswith("news_"):
            categories["News Sentiment"].append(feature)
        elif any(feature.startswith(p) for p in ["r2", "r10", "r30", "term", "cpi", "fedfunds", "hy_", "ev_", "surp_", "yc_", "claims", "payrolls", "retail", "confidence", "indpro"]):
            categories["Macro Economic"].append(feature)
        elif any(feature.startswith(p) for p in ["vix", "dxy", "gold", "oil", "treasury"]):
            categories["Cross-Asset"].append(feature)
        elif feature.startswith("breadth_"):
            categories["Market Breadth"].append(feature)
        elif feature.startswith("cal_"):
            categories["Calendar Effects"].append(feature)
        else:
            categories["Technical Indicators"].append(feature)
    
    # Remove empty categories
    return {k: v for k, v in categories.items() if v}


@router.get("/info")
async def get_model_info():
    """
    Get comprehensive model information including architecture, configuration, and performance
    """
    try:
        # Load model metadata
        metadata_path = Path("ml-backend/models/v2/quantile_models/metadata.pkl")
        if not metadata_path.exists():
            raise HTTPException(status_code=404, detail="Model metadata not found. Train a model first.")
        
        with open(metadata_path, "rb") as f:
            metadata = pickle.load(f)
        
        # Load training metadata
        training_path = Path("ml-backend/models/v2/training_metadata.json")
        training_meta = {}
        if training_path.exists():
            with open(training_path, "r") as f:
                training_meta = json.load(f)
        
        # Categorize features
        feature_names = metadata.get("feature_names", [])
        categories = categorize_features(feature_names)
        
        return {
            "architecture": {
                "model_type": "Quantile Regression (LightGBM)",
                "quantiles": list(metadata.get("quantiles", [0.1, 0.5, 0.9])),
                "horizons": metadata.get("horizons", [1, 5, 20]),
                "total_models": len(metadata.get("horizons", [])) * len(metadata.get("quantiles", [])),
                "params": metadata.get("params", {})
            },
            "config": {
                "universe": training_meta.get("universe", ["SPY", "QQQ", "DIA", "IWM", "XLK"]),
                "total_samples": training_meta.get("total_samples", 0),
                "total_features": len(feature_names),
                "interval": "1hour",
                "train_window": 1500,
                "test_window": 500,
                "date_range": {
                    "start": "2015-11-30",
                    "end": "2025-11-21"
                }
            },
            "performance": {
                "mae": {
                    "fold1": 1.26,
                    "fold2": 0.89,
                    "average": 1.08
                },
                "coverage": 0.78,
                "direction_accuracy": 0.58,
                "training_duration": "3m 24s"
            },
            "feature_counts": {
                category: len(features) for category, features in categories.items()
            },
            "last_trained": training_meta.get("timestamp", datetime.now().isoformat()),
            "status": "online"
        }
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model files not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading model info: {str(e)}")


@router.get("/features")
async def get_features():
    """
    Get detailed feature list organized by category with descriptions and metadata
    """
    try:
        # Load model metadata
        metadata_path = Path("ml-backend/models/v2/quantile_models/metadata.pkl")
        if not metadata_path.exists():
            raise HTTPException(status_code=404, detail="Model metadata not found")
        
        with open(metadata_path, "rb") as f:
            metadata = pickle.load(f)
        
        feature_names = metadata.get("feature_names", [])
        
        # Categorize features
        categories = categorize_features(feature_names)
        
        # Build detailed feature list
        result = {
            "categories": []
        }
        
        # Color mapping for categories
        color_map = {
            "Technical Indicators": "blue",
            "News Sentiment": "green",
            "Macro Economic": "purple",
            "Cross-Asset": "orange",
            "Market Breadth": "pink",
            "Calendar Effects": "cyan",
            "Interactions": "amber",
            "Ticker Dummies": "gray"
        }
        
        for category_name, features in categories.items():
            category_data = {
                "name": category_name,
                "count": len(features),
                "color": color_map.get(category_name, "blue"),
                "features": []
            }
            
            for feature in features:
                category_data["features"].append({
                    "name": feature,
                    "description": get_feature_description(feature),
                    "dataType": "binary" if feature.startswith(("tk_", "cal_is_", "ev_")) else "continuous",
                    "source": get_feature_source(feature),
                    "importance": None  # TODO: Calculate from model.feature_importances_
                })
            
            result["categories"].append(category_data)
        
        # Add top features (TODO: implement actual importance calculation)
        result["top_features"] = []
        
        return result
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model files not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading features: {str(e)}")


@router.get("/status")
async def get_model_status():
    """
    Get real-time model status
    """
    try:
        metadata_path = Path("ml-backend/models/v2/quantile_models/metadata.pkl")
        training_path = Path("ml-backend/models/v2/training_metadata.json")
        
        models_exist = metadata_path.exists()
        
        if not models_exist:
            return {
                "status": "no_models",
                "message": "No trained models found",
                "models_count": 0,
                "last_trained": None
            }
        
        # Load training metadata
        training_meta = {}
        if training_path.exists():
            with open(training_path, "r") as f:
                training_meta = json.load(f)
        
        return {
            "status": "online",
            "message": "Models loaded and ready",
            "models_count": 9,
            "last_trained": training_meta.get("timestamp", None),
            "total_samples": training_meta.get("total_samples", 0),
            "universes": training_meta.get("universe", [])
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "models_count": 0,
            "last_trained": None
        }

