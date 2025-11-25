"""
InstantDB Client for Continuous Learning
Stores predictions, outcomes, and learning history in InstantDB
"""
import os
import requests
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json


class InstantDBClient:
    """
    Client for interacting with InstantDB
    Used for storing and retrieving continuous learning data
    """
    
    def __init__(self):
        self.app_id = os.getenv("INSTANT_APP_ID")
        self.admin_token = os.getenv("INSTANT_ADMIN_TOKEN")
        
        if not self.app_id or not self.admin_token:
            print("⚠️  Warning: INSTANT_APP_ID or INSTANT_ADMIN_TOKEN not set")
            print("   Continuous learning will use local storage only")
            self.enabled = False
        else:
            self.enabled = True
            print("✅ InstantDB connected for continuous learning")
        
        self.base_url = "https://api.instantdb.com"
        self.headers = {
            "Authorization": f"Bearer {self.admin_token}",
            "Content-Type": "application/json"
        }
    
    def _make_request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Make request to InstantDB API"""
        if not self.enabled:
            return {"success": False, "error": "InstantDB not configured"}
        
        url = f"{self.base_url}/admin/v1/apps/{self.app_id}/{endpoint}"
        
        try:
            if method == "GET":
                response = requests.get(url, headers=self.headers, timeout=10)
            elif method == "POST":
                response = requests.post(url, headers=self.headers, json=data, timeout=10)
            elif method == "PUT":
                response = requests.put(url, headers=self.headers, json=data, timeout=10)
            elif method == "DELETE":
                response = requests.delete(url, headers=self.headers, timeout=10)
            else:
                return {"success": False, "error": f"Invalid method: {method}"}
            
            response.raise_for_status()
            return {"success": True, "data": response.json()}
        
        except requests.exceptions.RequestException as e:
            print(f"❌ InstantDB request error: {e}")
            return {"success": False, "error": str(e)}
    
    # ==================== Predictions ====================
    
    def store_prediction(
        self,
        prediction_id: str,
        symbol: str,
        horizon: str,
        predicted_direction: str,
        predicted_return: float,
        confidence: float,
        timestamp: datetime
    ) -> bool:
        """
        Store a prediction in InstantDB
        
        Args:
            prediction_id: Unique prediction ID
            symbol: Stock symbol (SPY, QQQ, IWM)
            horizon: Prediction horizon (1h, 4h, 1d, etc.)
            predicted_direction: "up", "down", or "neutral"
            predicted_return: Predicted log return
            confidence: Confidence score (0-1)
            timestamp: Prediction timestamp
        
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False
        
        data = {
            "predictions": {
                prediction_id: {
                    "id": prediction_id,
                    "symbol": symbol,
                    "horizon": horizon,
                    "predicted_direction": predicted_direction,
                    "predicted_return": predicted_return,
                    "confidence": confidence,
                    "timestamp": timestamp.isoformat(),
                    "actual_return": None,
                    "actual_direction": None,
                    "correct": None,
                    "error": None,
                    "validated_at": None,
                    "created_at": datetime.now().isoformat()
                }
            }
        }
        
        result = self._make_request("POST", "data", data)
        return result.get("success", False)
    
    def update_prediction_outcome(
        self,
        prediction_id: str,
        actual_return: float,
        actual_direction: str,
        correct: bool,
        error: float
    ) -> bool:
        """
        Update a prediction with actual outcome
        
        Args:
            prediction_id: Prediction ID to update
            actual_return: Actual log return
            actual_direction: Actual direction
            correct: Whether prediction was correct
            error: Prediction error (abs difference)
        
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False
        
        data = {
            "predictions": {
                prediction_id: {
                    "actual_return": actual_return,
                    "actual_direction": actual_direction,
                    "correct": correct,
                    "error": error,
                    "validated_at": datetime.now().isoformat()
                }
            }
        }
        
        result = self._make_request("PUT", "data", data)
        return result.get("success", False)
    
    def get_predictions(
        self,
        symbol: Optional[str] = None,
        horizon: Optional[str] = None,
        validated_only: bool = False,
        limit: int = 1000
    ) -> List[Dict]:
        """
        Get predictions from InstantDB
        
        Args:
            symbol: Filter by symbol (optional)
            horizon: Filter by horizon (optional)
            validated_only: Only return validated predictions
            limit: Max number of predictions to return
        
        Returns:
            List of prediction dictionaries
        """
        if not self.enabled:
            return []
        
        # Build query
        query = {"predictions": {}}
        
        if symbol:
            query["predictions"]["symbol"] = symbol
        if horizon:
            query["predictions"]["horizon"] = horizon
        if validated_only:
            query["predictions"]["validated_at"] = {"$ne": None}
        
        result = self._make_request("GET", f"data?query={json.dumps(query)}&limit={limit}")
        
        if result.get("success"):
            return result.get("data", {}).get("predictions", [])
        return []
    
    def get_pending_predictions(self, limit: int = 100) -> List[Dict]:
        """Get predictions that haven't been validated yet"""
        return self.get_predictions(validated_only=False, limit=limit)
    
    # ==================== Performance Metrics ====================
    
    def store_performance_snapshot(
        self,
        overall_accuracy: float,
        by_horizon: Dict[str, float],
        by_symbol: Dict[str, float],
        total_predictions: int,
        correct_predictions: int
    ) -> bool:
        """
        Store a performance snapshot
        
        Args:
            overall_accuracy: Overall accuracy (0-1)
            by_horizon: Accuracy by horizon
            by_symbol: Accuracy by symbol
            total_predictions: Total predictions made
            correct_predictions: Total correct predictions
        
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False
        
        snapshot_id = f"perf_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        data = {
            "performance_snapshots": {
                snapshot_id: {
                    "id": snapshot_id,
                    "timestamp": datetime.now().isoformat(),
                    "overall_accuracy": overall_accuracy,
                    "by_horizon": by_horizon,
                    "by_symbol": by_symbol,
                    "total_predictions": total_predictions,
                    "correct_predictions": correct_predictions
                }
            }
        }
        
        result = self._make_request("POST", "data", data)
        return result.get("success", False)
    
    def get_performance_history(self, days: int = 30) -> List[Dict]:
        """Get performance snapshots for the last N days"""
        if not self.enabled:
            return []
        
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        
        query = {
            "performance_snapshots": {
                "timestamp": {"$gte": cutoff}
            }
        }
        
        result = self._make_request("GET", f"data?query={json.dumps(query)}")
        
        if result.get("success"):
            return result.get("data", {}).get("performance_snapshots", [])
        return []
    
    # ==================== Training Sessions ====================
    
    def store_training_session(
        self,
        session_type: str,
        index: str,
        lookback_days: int,
        samples: int,
        metrics: Dict
    ) -> bool:
        """
        Store a training session record
        
        Args:
            session_type: "initial", "incremental", or "auto"
            index: Index trained (SPX, NDX, RUT)
            lookback_days: Days of data used
            samples: Number of training samples
            metrics: Training metrics (accuracy, loss, etc.)
        
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False
        
        session_id = f"train_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        data = {
            "training_sessions": {
                session_id: {
                    "id": session_id,
                    "timestamp": datetime.now().isoformat(),
                    "type": session_type,
                    "index": index,
                    "lookback_days": lookback_days,
                    "samples": samples,
                    "metrics": metrics
                }
            }
        }
        
        result = self._make_request("POST", "data", data)
        return result.get("success", False)
    
    def get_training_history(self, limit: int = 50) -> List[Dict]:
        """Get recent training sessions"""
        if not self.enabled:
            return []
        
        result = self._make_request("GET", f"data?collection=training_sessions&limit={limit}")
        
        if result.get("success"):
            return result.get("data", {}).get("training_sessions", [])
        return []
    
    def get_last_training_session(self, index: str = None) -> Optional[Dict]:
        """Get the most recent training session"""
        sessions = self.get_training_history(limit=10)
        
        if index:
            sessions = [s for s in sessions if s.get("index") == index]
        
        if sessions:
            return max(sessions, key=lambda s: s.get("timestamp", ""))
        return None
    
    # ==================== Model Versions ====================
    
    def store_model_version(
        self,
        version: str,
        index: str,
        horizons: List[str],
        feature_count: int,
        performance: Dict
    ) -> bool:
        """
        Store a model version record
        
        Args:
            version: Model version string
            index: Index this model is for
            horizons: Horizons this model predicts
            feature_count: Number of features
            performance: Performance metrics
        
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False
        
        version_id = f"model_{version}_{index}"
        
        data = {
            "model_versions": {
                version_id: {
                    "id": version_id,
                    "version": version,
                    "index": index,
                    "horizons": horizons,
                    "feature_count": feature_count,
                    "performance": performance,
                    "created_at": datetime.now().isoformat()
                }
            }
        }
        
        result = self._make_request("POST", "data", data)
        return result.get("success", False)
    
    # ==================== User Settings ====================
    
    def store_user_settings(
        self,
        user_id: str,
        settings: Dict
    ) -> bool:
        """
        Store user settings
        
        Args:
            user_id: User ID
            settings: Settings dictionary (theme, preferences, etc.)
        
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False
        
        data = {
            "user_settings": {
                user_id: {
                    "user_id": user_id,
                    "settings": settings,
                    "updated_at": datetime.now().isoformat()
                }
            }
        }
        
        result = self._make_request("PUT", "data", data)
        return result.get("success", False)
    
    def get_user_settings(self, user_id: str) -> Optional[Dict]:
        """Get user settings"""
        if not self.enabled:
            return None
        
        query = {
            "user_settings": {
                "user_id": user_id
            }
        }
        
        result = self._make_request("GET", f"data?query={json.dumps(query)}")
        
        if result.get("success"):
            settings_list = result.get("data", {}).get("user_settings", [])
            if settings_list:
                return settings_list[0].get("settings")
        return None
    
    # ==================== Learning Outcomes ====================
    
    def store_learning_outcome(
        self,
        outcome_id: str,
        prediction_id: str,
        symbol: str,
        horizon: str,
        predicted_value: float,
        actual_value: float,
        features: Dict,
        timestamp: datetime
    ) -> bool:
        """
        Store a learning outcome for continuous improvement
        
        Args:
            outcome_id: Unique outcome ID
            prediction_id: Associated prediction ID
            symbol: Stock symbol
            horizon: Prediction horizon
            predicted_value: Predicted value
            actual_value: Actual value
            features: Feature values used for prediction
            timestamp: Outcome timestamp
        
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False
        
        error = abs(predicted_value - actual_value)
        correct = (predicted_value > 0 and actual_value > 0) or (predicted_value < 0 and actual_value < 0)
        
        data = {
            "learning_outcomes": {
                outcome_id: {
                    "id": outcome_id,
                    "prediction_id": prediction_id,
                    "symbol": symbol,
                    "horizon": horizon,
                    "predicted_value": predicted_value,
                    "actual_value": actual_value,
                    "error": error,
                    "correct": correct,
                    "features": features,
                    "timestamp": timestamp.isoformat(),
                    "created_at": datetime.now().isoformat()
                }
            }
        }
        
        result = self._make_request("POST", "data", data)
        return result.get("success", False)
    
    def get_learning_outcomes(
        self,
        symbol: Optional[str] = None,
        horizon: Optional[str] = None,
        limit: int = 1000
    ) -> List[Dict]:
        """Get learning outcomes for continuous improvement"""
        if not self.enabled:
            return []
        
        query = {"learning_outcomes": {}}
        
        if symbol:
            query["learning_outcomes"]["symbol"] = symbol
        if horizon:
            query["learning_outcomes"]["horizon"] = horizon
        
        result = self._make_request("GET", f"data?query={json.dumps(query)}&limit={limit}")
        
        if result.get("success"):
            return result.get("data", {}).get("learning_outcomes", [])
        return []
    
    # ==================== Utility Methods ====================
    
    def calculate_accuracy(
        self,
        symbol: Optional[str] = None,
        horizon: Optional[str] = None
    ) -> float:
        """
        Calculate current accuracy from stored predictions
        
        Args:
            symbol: Filter by symbol (optional)
            horizon: Filter by horizon (optional)
        
        Returns:
            Accuracy as float (0-1)
        """
        predictions = self.get_predictions(
            symbol=symbol,
            horizon=horizon,
            validated_only=True
        )
        
        if not predictions:
            return 0.0
        
        correct = sum(1 for p in predictions if p.get("correct"))
        return correct / len(predictions)
    
    def get_statistics(self) -> Dict:
        """Get overall statistics"""
        if not self.enabled:
            return {
                "enabled": False,
                "total_predictions": 0,
                "validated_predictions": 0,
                "pending_predictions": 0,
                "overall_accuracy": 0.0
            }
        
        all_predictions = self.get_predictions(limit=10000)
        validated = [p for p in all_predictions if p.get("validated_at")]
        pending = [p for p in all_predictions if not p.get("validated_at")]
        
        overall_accuracy = 0.0
        if validated:
            correct = sum(1 for p in validated if p.get("correct"))
            overall_accuracy = correct / len(validated)
        
        return {
            "enabled": True,
            "total_predictions": len(all_predictions),
            "validated_predictions": len(validated),
            "pending_predictions": len(pending),
            "overall_accuracy": overall_accuracy,
            "last_prediction": all_predictions[0].get("timestamp") if all_predictions else None,
            "last_training": self.get_last_training_session()
        }


# Singleton instance
instantdb_client = InstantDBClient()


def get_instant_client() -> InstantDBClient:
    """Get the singleton InstantDB client instance"""
    return instantdb_client

