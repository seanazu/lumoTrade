"""
Supabase Client for Continuous Learning
Cloud-based PostgreSQL database with Python SDK
"""

import os
from typing import Dict, List, Optional
from datetime import datetime
from supabase import create_client, Client

class SupabaseClient:
    """
    Client for interacting with Supabase (PostgreSQL)
    Used for storing and retrieving continuous learning data
    """
    
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        
        if not self.url or not self.key:
            print("⚠️  Warning: SUPABASE_URL or SUPABASE_KEY not set")
            print("   Continuous learning will use local storage only")
            self.enabled = False
            self.client = None
        else:
            try:
                self.client: Client = create_client(self.url, self.key)
                self.enabled = True
                print("✅ Supabase connected for continuous learning")
            except Exception as e:
                print(f"⚠️  Failed to connect to Supabase: {e}")
                self.enabled = False
                self.client = None
    
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
            session_type: "ultimate", "initial", "incremental"
            index: Index trained (SPY, QQQ, DIA)
            lookback_days: Days of data used
            samples: Number of training samples
            metrics: Training metrics dict
        
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False
        
        try:
            data = {
                "session_type": session_type,
                "index": index,
                "lookback_days": lookback_days,
                "samples": samples,
                "annual_return": metrics.get("annual_return"),
                "sharpe_ratio": metrics.get("sharpe_ratio"),
                "max_drawdown": metrics.get("max_drawdown"),
                "win_rate": metrics.get("win_rate"),
                "total_trades": metrics.get("total_trades"),
                "avg_profit_per_trade": metrics.get("avg_profit_per_trade"),
                "direction_accuracy": metrics.get("direction_accuracy"),
                "metrics_json": metrics,  # Store full metrics as JSON
                "created_at": datetime.now().isoformat()
            }
            
            result = self.client.table("training_sessions").insert(data).execute()
            return True
        
        except Exception as e:
            print(f"❌ Supabase store_training_session error: {e}")
            return False
    
    def get_training_history(self, limit: int = 50) -> List[Dict]:
        """Get recent training sessions"""
        if not self.enabled:
            return []
        
        try:
            result = self.client.table("training_sessions")\
                .select("*")\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data if result.data else []
        
        except Exception as e:
            print(f"❌ Supabase get_training_history error: {e}")
            return []
    
    def get_last_training_session(self, index: str = None) -> Optional[Dict]:
        """Get the most recent training session"""
        if not self.enabled:
            return None
        
        try:
            query = self.client.table("training_sessions").select("*")
            
            if index:
                query = query.eq("index", index)
            
            result = query.order("created_at", desc=True).limit(1).execute()
            
            return result.data[0] if result.data else None
        
        except Exception as e:
            print(f"❌ Supabase get_last_training_session error: {e}")
            return None
    
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
        Store a prediction
        
        Args:
            prediction_id: Unique prediction ID
            symbol: Stock symbol (SPY, QQQ, DIA)
            horizon: Prediction horizon (1h, 4h, 1d)
            predicted_direction: "up" or "down"
            predicted_return: Predicted return value
            confidence: Confidence score (0-1)
            timestamp: Prediction timestamp
        
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False
        
        try:
            data = {
                "prediction_id": prediction_id,
                "symbol": symbol,
                "horizon": horizon,
                "predicted_direction": predicted_direction,
                "predicted_return": predicted_return,
                "confidence": confidence,
                "timestamp": timestamp.isoformat(),
                "created_at": datetime.now().isoformat()
            }
            
            result = self.client.table("predictions").insert(data).execute()
            return True
        
        except Exception as e:
            print(f"❌ Supabase store_prediction error: {e}")
            return False
    
    def get_predictions(
        self,
        symbol: Optional[str] = None,
        horizon: Optional[str] = None,
        limit: int = 1000
    ) -> List[Dict]:
        """Get predictions with optional filters"""
        if not self.enabled:
            return []
        
        try:
            query = self.client.table("predictions").select("*")
            
            if symbol:
                query = query.eq("symbol", symbol)
            if horizon:
                query = query.eq("horizon", horizon)
            
            result = query.order("timestamp", desc=True).limit(limit).execute()
            
            return result.data if result.data else []
        
        except Exception as e:
            print(f"❌ Supabase get_predictions error: {e}")
            return []
    
    # ==================== Performance Snapshots ====================
    
    def store_performance_snapshot(
        self,
        overall_accuracy: float,
        by_horizon: Dict[str, float],
        by_symbol: Dict[str, float],
        total_predictions: int,
        correct_predictions: int
    ) -> bool:
        """Store a performance snapshot"""
        if not self.enabled:
            return False
        
        try:
            data = {
                "overall_accuracy": overall_accuracy,
                "by_horizon": by_horizon,
                "by_symbol": by_symbol,
                "total_predictions": total_predictions,
                "correct_predictions": correct_predictions,
                "created_at": datetime.now().isoformat()
            }
            
            result = self.client.table("performance_snapshots").insert(data).execute()
            return True
        
        except Exception as e:
            print(f"❌ Supabase store_performance_snapshot error: {e}")
            return False
    
    def get_performance_history(self, days: int = 30) -> List[Dict]:
        """Get performance snapshots for the last N days"""
        if not self.enabled:
            return []
        
        try:
            cutoff = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            cutoff = cutoff.replace(day=cutoff.day - days)
            
            result = self.client.table("performance_snapshots")\
                .select("*")\
                .gte("created_at", cutoff.isoformat())\
                .order("created_at", desc=True)\
                .execute()
            
            return result.data if result.data else []
        
        except Exception as e:
            print(f"❌ Supabase get_performance_history error: {e}")
            return []
    
    # ==================== Statistics ====================
    
    def get_statistics(self) -> Dict:
        """Get overall statistics"""
        if not self.enabled:
            return {
                "enabled": False,
                "total_predictions": 0,
                "total_sessions": 0,
                "overall_accuracy": 0.0
            }
        
        try:
            # Get prediction count
            pred_result = self.client.table("predictions").select("*", count="exact").execute()
            total_predictions = pred_result.count if pred_result.count else 0
            
            # Get session count
            session_result = self.client.table("training_sessions").select("*", count="exact").execute()
            total_sessions = session_result.count if session_result.count else 0
            
            # Get latest performance
            perf_result = self.client.table("performance_snapshots")\
                .select("overall_accuracy")\
                .order("created_at", desc=True)\
                .limit(1)\
                .execute()
            
            overall_accuracy = perf_result.data[0]["overall_accuracy"] if perf_result.data else 0.0
            
            return {
                "enabled": True,
                "total_predictions": total_predictions,
                "total_sessions": total_sessions,
                "overall_accuracy": overall_accuracy,
                "last_session": self.get_last_training_session()
            }
        
        except Exception as e:
            print(f"❌ Supabase get_statistics error: {e}")
            return {
                "enabled": True,
                "error": str(e)
            }


# Singleton instance
_supabase_client = None

def get_supabase_client() -> SupabaseClient:
    """Get the singleton Supabase client instance"""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = SupabaseClient()
    return _supabase_client

