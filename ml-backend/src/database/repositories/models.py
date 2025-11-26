"""
Model Storage Repository
Stores trained models, predictions, and metadata in InstantDB instead of local files
"""

import json
import pickle
import base64
from typing import Dict, List, Optional, Any
from datetime import datetime

try:
    from src.database.instantdb_client import instant_db
    INSTANTDB_AVAILABLE = True
except ImportError:
    INSTANTDB_AVAILABLE = False
    instant_db = None


def get_instantdb_client():
    """Get InstantDB client"""
    return instant_db


class ModelRepository:
    """Store and retrieve trained models from InstantDB"""
    
    def __init__(self):
        self.db = get_instantdb_client()
    
    async def save_model(
        self,
        model_id: str,
        model_data: bytes,
        metadata: Dict[str, Any]
    ) -> str:
        """
        Save a trained model to InstantDB.
        
        Args:
            model_id: Unique model identifier
            model_data: Pickled model bytes
            metadata: Model training metadata
        
        Returns:
            Model ID
        """
        try:
            # Encode model data as base64 for JSON storage
            model_b64 = base64.b64encode(model_data).decode('utf-8')
            
            # Create model record
            model_record = {
                "id": model_id,
                "model_data": model_b64,
                "metadata": json.dumps(metadata),
                "trained_at": metadata.get("trained_at", datetime.now().isoformat()),
                "universe": json.dumps(metadata.get("universe", [])),
                "total_samples": metadata.get("total_samples", 0),
                "total_features": metadata.get("total_features", 0),
                "overall_metrics": json.dumps(metadata.get("overall_metrics", {})),
                "version": "2.0"
            }
            
            # Store in InstantDB
            if hasattr(self.db, 'tx'):
                self.db.tx.trained_models[model_id].update(model_record)
                print(f"✅ Model {model_id} saved to InstantDB")
            else:
                print(f"⚠️  InstantDB not configured, model would be saved: {model_id}")
            
            return model_id
            
        except Exception as e:
            print(f"❌ Failed to save model to InstantDB: {e}")
            raise
    
    async def load_model(self, model_id: str = "latest") -> Optional[Dict[str, Any]]:
        """
        Load a trained model from InstantDB.
        
        Args:
            model_id: Model ID to load, or "latest" for most recent
        
        Returns:
            Dictionary with model_data (bytes) and metadata
        """
        try:
            if not hasattr(self.db, 'tx'):
                print("⚠️  InstantDB not configured")
                return None
            
            # Query models
            if model_id == "latest":
                # Get most recent model
                result = self.db.tx.trained_models.order("trained_at", "desc").limit(1).get()
            else:
                # Get specific model
                result = self.db.tx.trained_models[model_id].get()
            
            if not result or (isinstance(result, list) and len(result) == 0):
                print(f"⚠️  No model found with ID: {model_id}")
                return None
            
            # Extract model record
            model_record = result[0] if isinstance(result, list) else result
            
            # Decode model data
            model_b64 = model_record.get("model_data", "")
            model_data = base64.b64decode(model_b64)
            
            # Parse metadata
            metadata = json.loads(model_record.get("metadata", "{}"))
            
            return {
                "model_data": model_data,
                "metadata": metadata,
                "model_id": model_record.get("id")
            }
            
        except Exception as e:
            print(f"❌ Failed to load model from InstantDB: {e}")
            return None
    
    async def list_models(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        List available trained models.
        
        Args:
            limit: Maximum number of models to return
        
        Returns:
            List of model metadata
        """
        try:
            if not hasattr(self.db, 'tx'):
                return []
            
            result = self.db.tx.trained_models.order("trained_at", "desc").limit(limit).get()
            
            models = []
            for record in result:
                models.append({
                    "model_id": record.get("id"),
                    "trained_at": record.get("trained_at"),
                    "universe": json.loads(record.get("universe", "[]")),
                    "total_samples": record.get("total_samples", 0),
                    "total_features": record.get("total_features", 0),
                    "overall_metrics": json.loads(record.get("overall_metrics", "{}")),
                })
            
            return models
            
        except Exception as e:
            print(f"❌ Failed to list models: {e}")
            return []


class PredictionRepository:
    """Store and retrieve predictions from InstantDB"""
    
    def __init__(self):
        self.db = get_instantdb_client()
    
    async def save_predictions(
        self,
        run_id: str,
        predictions_data: List[Dict[str, Any]]
    ) -> str:
        """
        Save model predictions to InstantDB.
        
        Args:
            run_id: Training run ID
            predictions_data: List of prediction records
        
        Returns:
            Run ID
        """
        try:
            if not hasattr(self.db, 'tx'):
                print("⚠️  InstantDB not configured")
                return run_id
            
            # Store each prediction
            for i, pred in enumerate(predictions_data):
                pred_id = f"{run_id}_pred_{i}"
                pred_record = {
                    "id": pred_id,
                    "run_id": run_id,
                    "ticker": pred.get("ticker", ""),
                    "date": pred.get("date", ""),
                    "horizon": pred.get("horizon", 1),
                    "fold": pred.get("fold", 1),
                    "p10": pred.get("p10", 0.0),
                    "p50": pred.get("p50", 0.0),
                    "p90": pred.get("p90", 0.0),
                    "created_at": datetime.now().isoformat()
                }
                
                self.db.tx.model_predictions[pred_id].update(pred_record)
            
            print(f"✅ Saved {len(predictions_data)} predictions to InstantDB")
            return run_id
            
        except Exception as e:
            print(f"❌ Failed to save predictions: {e}")
            raise
    
    async def load_predictions(
        self,
        run_id: Optional[str] = None,
        ticker: Optional[str] = None,
        horizon: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Load predictions from InstantDB.
        
        Args:
            run_id: Filter by training run ID (None = latest)
            ticker: Filter by ticker
            horizon: Filter by horizon
        
        Returns:
            List of prediction records
        """
        try:
            if not hasattr(self.db, 'tx'):
                return []
            
            # Query predictions
            query = self.db.tx.model_predictions
            
            if run_id:
                query = query.where("run_id", "==", run_id)
            
            if ticker:
                query = query.where("ticker", "==", ticker.upper())
            
            if horizon:
                query = query.where("horizon", "==", horizon)
            
            # Get most recent if no run_id specified
            if not run_id:
                query = query.order("created_at", "desc").limit(10000)
            
            result = query.get()
            
            predictions = []
            for record in result:
                predictions.append({
                    "ticker": record.get("ticker"),
                    "date": record.get("date"),
                    "horizon": record.get("horizon"),
                    "fold": record.get("fold"),
                    "p10": record.get("p10"),
                    "p50": record.get("p50"),
                    "p90": record.get("p90"),
                })
            
            return predictions
            
        except Exception as e:
            print(f"❌ Failed to load predictions: {e}")
            return []


# Singleton instances
model_repo = ModelRepository()
prediction_repo = PredictionRepository()

