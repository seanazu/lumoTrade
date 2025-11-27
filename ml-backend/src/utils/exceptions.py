"""
Custom exceptions for LumoTrade

Provides structured error handling with specific exception types
for different failure scenarios.
"""


class LumoTradeException(Exception):
    """Base exception for all LumoTrade errors"""
    pass


class DataFetchError(LumoTradeException):
    """Raised when data fetching fails"""
    pass


class ModelNotFoundError(LumoTradeException):
    """Raised when a trained model cannot be found"""
    pass


class TrainingError(LumoTradeException):
    """Raised when model training fails"""
    pass


class PredictionError(LumoTradeException):
    """Raised when prediction generation fails"""
    pass


class DatabaseError(LumoTradeException):
    """Raised when database operations fail"""
    pass


class StorageError(LumoTradeException):
    """Raised when storage operations (GCS/local) fail"""
    pass


class ConfigurationError(LumoTradeException):
    """Raised when configuration is invalid or missing"""
    pass


class FeatureEngineeringError(LumoTradeException):
    """Raised when feature engineering fails"""
    pass


class ValidationError(LumoTradeException):
    """Raised when validation fails"""
    pass


class PaperTradingError(LumoTradeException):
    """Raised when paper trading operations fail"""
    pass

