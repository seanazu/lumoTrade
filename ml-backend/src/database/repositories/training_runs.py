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
            record = training_run.to_dict()
            result = await self.db.tx.training_runs[training_run.id].update(record)
            return result
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
            updates = {"status": status, **kwargs}
            result = await self.db.tx.training_runs[run_id].update(updates)
            return result
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
            updates = {
                "status": "completed",
                "total_samples": total_samples,
                "total_features": total_features,
                "metrics": metrics,
                "model_paths": model_paths,
                "completed_at": datetime.now().isoformat()
            }
            result = await self.db.tx.training_runs[run_id].update(updates)
            return result
        except Exception as e:
            print(f"Error completing training run: {e}")
            return {}
    
    async def fail(self, run_id: str, error: str) -> Dict:
        """Mark training run as failed"""
        from datetime import datetime
        
        try:
            updates = {
                "status": "failed",
                "error": error,
                "completed_at": datetime.now().isoformat()
            }
            result = await self.db.tx.training_runs[run_id].update(updates)
            return result
        except Exception as e:
            print(f"Error failing training run: {e}")
            return {}
    
    async def get_by_id(self, run_id: str) -> Optional[Dict]:
        """Get training run by ID"""
        try:
            result = await self.db.query({
                "training_runs": {
                    "$": {
                        "where": {"id": run_id}
                    }
                }
            })
            runs = result.get("training_runs", [])
            return runs[0] if runs else None
        except Exception as e:
            print(f"Error getting training run: {e}")
            return None
    
    async def get_recent(self, limit: int = 10) -> List[Dict]:
        """Get recent training runs"""
        try:
            result = await self.db.query({
                "training_runs": {
                    "$": {
                        "limit": limit,
                        "order": {
                            "started_at": "desc"
                        }
                    }
                }
            })
            return result.get("training_runs", [])
        except Exception as e:
            print(f"Error getting recent training runs: {e}")
            return []
    
    async def get_by_status(self, status: str) -> List[Dict]:
        """Get training runs by status"""
        try:
            result = await self.db.query({
                "training_runs": {
                    "$": {
                        "where": {"status": status},
                        "order": {
                            "started_at": "desc"
                        }
                    }
                }
            })
            return result.get("training_runs", [])
        except Exception as e:
            print(f"Error getting training runs by status: {e}")
            return []
    
    async def get_successful_runs(self, limit: int = 10) -> List[Dict]:
        """Get successful training runs"""
        return await self.get_by_status("completed")[:limit]


# Singleton instance
training_runs_repo = TrainingRunsRepository()

