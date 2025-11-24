"""
Centralized Configuration for Hybrid ML System
"""
from typing import Dict, List

# Model Configuration
MODEL_CONFIG = {
    "horizons": ["1h", "4h", "10h", "1d", "3d", "5d"],
    "indices": ["SPX", "NDX", "RUT"],
    "lookback_sequence_length": 60,
    "model_version": "1.0.0-hybrid-lgbm",
    
    # Fusion weights (how to combine base ML with LLM)
    "fusion_weights": {
        "base_ml": 0.70,  # LightGBM predictions
        "llm_adjustment": 0.30  # ChatGPT-5 adjustments
    },
    
    # Feature group weights (used in LightGBM training)
    "feature_weights": {
        "news": 0.40,  # Highest - news is most important
        "price": 0.20,
        "macro": 0.15,
        "breadth": 0.15,
        "calendar": 0.10
    }
}

# Training Configuration
TRAINING_CONFIG = {
    "train_test_split": 0.8,
    "validation_split": 0.1,
    
    # LightGBM hyperparameters
    "lgbm_params": {
        "objective": "regression",
        "metric": "rmse",
        "boosting_type": "gbdt",
        "n_estimators": 500,
        "learning_rate": 0.05,
        "max_depth": 7,
        "num_leaves": 31,
        "min_child_samples": 20,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "reg_alpha": 0.1,
        "reg_lambda": 0.1,
        "random_state": 42,
        "verbose": -1
    },
    
    # Early stopping
    "early_stopping_rounds": 50,
    
    # Feature engineering
    "buffer_minutes": 15,  # Lookback buffer to prevent data leakage
}

# Data Configuration
DATA_CONFIG = {
    # Historical data for training
    "training_period_days": 730,  # 2 years
    
    # Intraday intervals
    "intraday_interval": "5min",  # For 1h, 4h, 10h horizons
    
    # Daily interval
    "daily_interval": "1day",  # For 1d, 3d, 5d horizons
    
    # Cache settings
    "cache_dir": "data/cache",
    "dataset_cache_dir": "data/datasets",
    "model_dir": "models",
    
    # API rate limits
    "api_rate_limit_per_minute": 60,
}

# Prediction Configuration
PREDICTION_CONFIG = {
    # Update frequency
    "update_interval_seconds": 60,  # Update predictions every 60 seconds
    
    # Confidence thresholds
    "min_confidence_threshold": 0.3,  # Below this, mark as "uncertain"
    "high_confidence_threshold": 0.7,  # Above this, mark as "high confidence"
    
    # Percentile estimation
    "return_percentiles": True,  # Return p10, p90 estimates
    
    # Debug mode
    "default_debug": True,  # Include debug info by default
}

# LLM Configuration
LLM_CONFIG = {
    "model": "gpt-5",  # gpt-5 supports Responses API + web_search
    "max_tokens": 2000,
    "temperature": 0.7,  # Note: may be deprecated, check OpenAI docs
    
    # Social sentiment search
    "social_sentiment_enabled": True,
    "social_sources": ["twitter", "reddit", "stocktwits"],
    
    # Caching
    "cache_llm_responses": True,
    "cache_ttl_seconds": 300,  # 5 minutes
}

# Monitoring Configuration
MONITORING_CONFIG = {
    # MLflow tracking
    "mlflow_enabled": False,
    "mlflow_tracking_uri": "http://localhost:5000",
    "mlflow_experiment_name": "hybrid-ml-prediction",
    
    # Accuracy tracking
    "track_accuracy": True,
    "accuracy_window_days": 30,
    
    # Alerts
    "alert_on_low_accuracy": True,
    "accuracy_alert_threshold": 0.45,  # Alert if directional accuracy < 45%
}

# API Configuration
API_CONFIG = {
    "host": "0.0.0.0",
    "port": 8000,
    "reload": False,  # Set to True for development
    
    # CORS
    "cors_origins": ["*"],
    "cors_credentials": False,
    "cors_methods": ["*"],
    "cors_headers": ["*"],
    
    # Rate limiting
    "rate_limit_enabled": False,
    "rate_limit_per_minute": 60,
}

# Index Configuration (detailed)
INDICES_CONFIG = {
    "SPX": {
        "etf": "SPY",
        "ticker": "^GSPC",
        "name": "S&P 500",
        "top_components": [
            "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA",
            "META", "TSLA", "BRK.B", "UNH", "JNJ"
        ],
        "sector_etfs": ["XLK", "XLF", "XLE", "XLV", "XLI", "XLC", "XLY", "XLP", "XLB", "XLRE", "XLU"]
    },
    "NDX": {
        "etf": "QQQ",
        "ticker": "^NDX",
        "name": "NASDAQ 100",
        "top_components": [
            "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA",
            "META", "TSLA", "AVGO", "COST", "ADBE"
        ],
        "sector_etfs": ["XLK", "XLC", "XLY"]
    },
    "RUT": {
        "etf": "IWM",
        "ticker": "^RUT",
        "name": "Russell 2000",
        "top_components": [],  # Small caps - less focused on individual names
        "sector_etfs": []
    }
}

# Macro Calendar (hard-coded key dates)
# In production, this would be loaded from a database or API
MACRO_CALENDAR = {
    "FOMC": [
        # 2025 FOMC meeting dates (example)
        "2025-01-29", "2025-03-19", "2025-05-07",
        "2025-06-18", "2025-07-30", "2025-09-17",
        "2025-11-05", "2025-12-17"
    ],
    "CPI": [
        # CPI release dates (typically 2nd week of month)
        # Would be populated dynamically
    ],
    "NFP": [
        # Non-Farm Payrolls (first Friday of month)
        # Would be populated dynamically
    ]
}


def get_config(section: str = None) -> Dict:
    """
    Get configuration section
    
    Args:
        section: Config section name (e.g., "MODEL", "TRAINING")
                If None, returns all config
    
    Returns:
        Configuration dictionary
    """
    all_config = {
        "MODEL": MODEL_CONFIG,
        "TRAINING": TRAINING_CONFIG,
        "DATA": DATA_CONFIG,
        "PREDICTION": PREDICTION_CONFIG,
        "LLM": LLM_CONFIG,
        "MONITORING": MONITORING_CONFIG,
        "API": API_CONFIG,
        "INDICES": INDICES_CONFIG,
        "MACRO_CALENDAR": MACRO_CALENDAR
    }
    
    if section:
        return all_config.get(section.upper(), {})
    return all_config


def update_config(section: str, key: str, value):
    """
    Update a configuration value
    
    Args:
        section: Config section (e.g., "MODEL")
        key: Config key
        value: New value
    """
    config_map = {
        "MODEL": MODEL_CONFIG,
        "TRAINING": TRAINING_CONFIG,
        "DATA": DATA_CONFIG,
        "PREDICTION": PREDICTION_CONFIG,
        "LLM": LLM_CONFIG,
        "MONITORING": MONITORING_CONFIG,
        "API": API_CONFIG
    }
    
    if section.upper() in config_map:
        config_map[section.upper()][key] = value
        print(f"✅ Updated {section}.{key} = {value}")
    else:
        print(f"⚠️  Unknown config section: {section}")

