"""
Training runs repository
CRUD operations for training run records
"""
from typing import List, Optional, Dict

from src.database.instantdb import get_instant_client
from src.database.models import TrainingRun


class TrainingRunsRepository:
    """Repository for training run records"""
    
    def __init__(self):
        self.db = get_instant_client()
    
    async def create(self, training_run: TrainingRun) -> Dict:
        """Create a new training run record"""
        try:
            # TODO: Implement proper InstantDB integration
            # For now, just return success to not break training
            print(f"📝 Training run created: {training_run.id}")
            return {"id": training_run.id}
        except Exception as e:
            print(f"Error creating training run: {e}")
            return {}
    
    async def update_status(
        self,
        run_id: str,
        status: str,
        **kwargs
    ) -> Dict:
        """Update training run status"""
        try:
            # TODO: Implement proper InstantDB integration
            # For now, just log to console
            # print(f"📊 Training run {run_id}: {status} - {kwargs}")
            return {"id": run_id, "status": status}
        except Exception as e:
            print(f"Error updating training run: {e}")
            return {}
    
    async def complete(
        self,
        run_id: str,
        total_samples: int,
        total_features: int,
        metrics: Dict,
        model_paths: Dict
    ) -> Dict:
        """Mark training run as completed"""
        from datetime import datetime
        
        try:
            # TODO: Implement proper InstantDB integration
            print(f"✅ Training run {run_id} completed: {total_samples} samples, {total_features} features")
            return {"id": run_id, "status": "completed"}
        except Exception as e:
            print(f"Error completing training run: {e}")
            return {}
    
    async def fail(self, run_id: str, error: str) -> Dict:
        """Mark training run as failed"""
        from datetime import datetime
        
        try:
            # TODO: Implement proper InstantDB integration
            print(f"❌ Training run {run_id} failed: {error}")
            return {"id": run_id, "status": "failed"}
        except Exception as e:
            print(f"Error failing training run: {e}")
            return {}
    
    async def get_by_id(self, run_id: str) -> Optional[Dict]:
        """Get training run by ID"""
        try:
            # TODO: Implement proper InstantDB integration
            return None
        except Exception as e:
            print(f"Error getting training run: {e}")
            return None
    
    async def get_recent(self, limit: int = 10) -> List[Dict]:
        """Get recent training runs"""
        try:
            # TODO: Implement proper InstantDB integration
            return []
        except Exception as e:
            print(f"Error getting recent training runs: {e}")
            return []
    
    async def get_by_status(self, status: str) -> List[Dict]:
        """Get training runs by status"""
        try:
            # TODO: Implement proper InstantDB integration
            return []
        except Exception as e:
            print(f"Error getting training runs by status: {e}")
            return []
    
    async def get_successful_runs(self, limit: int = 10) -> List[Dict]:
        """Get successful training runs"""
        return await self.get_by_status("completed")[:limit]


# Singleton instance
training_runs_repo = TrainingRunsRepository()

