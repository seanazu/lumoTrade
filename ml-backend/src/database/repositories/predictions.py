"""
Predictions repository
CRUD operations for prediction records
"""
from typing import List, Optional, Dict
from datetime import datetime, timedelta

from src.database.instantdb import get_instant_client
from src.database.models import PredictionRecord


class PredictionsRepository:
    """Repository for prediction records"""
    
    def __init__(self):
        self.db = get_instant_client()
        self.namespace = "predictions"
    
    async def create(self, prediction: PredictionRecord) -> Dict:
        """
        Create a new prediction record
        
        Args:
            prediction: PredictionRecord instance
        
        Returns:
            Created record
        """
        try:
            record = prediction.to_dict()
            result = await self.db.tx.predictions[prediction.id].update(record)
            return result
        except Exception as e:
            print(f"Error creating prediction: {e}")
            return {}
    
    async def get_by_id(self, prediction_id: str) -> Optional[Dict]:
        """
        Get prediction by ID
        
        Args:
            prediction_id: Prediction ID
        
        Returns:
            Prediction record or None
        """
        try:
            result = await self.db.query({
                "predictions": {
                    "$": {
                        "where": {"id": prediction_id}
                    }
                }
            })
            predictions = result.get("predictions", [])
            return predictions[0] if predictions else None
        except Exception as e:
            print(f"Error getting prediction: {e}")
            return None
    
    async def get_by_ticker(self, ticker: str, limit: int = 100) -> List[Dict]:
        """
        Get predictions for a ticker
        
        Args:
            ticker: Ticker symbol
            limit: Maximum number of records
        
        Returns:
            List of prediction records
        """
        try:
            result = await self.db.query({
                "predictions": {
                    "$": {
                        "where": {"ticker": ticker},
                        "limit": limit,
                        "order": {
                            "serverCreatedAt": "desc"
                        }
                    }
                }
            })
            return result.get("predictions", [])
        except Exception as e:
            print(f"Error getting predictions for {ticker}: {e}")
            return []
    
    async def get_recent(self, hours: int = 24, limit: int = 100) -> List[Dict]:
        """
        Get recent predictions
        
        Args:
            hours: Number of hours to look back
            limit: Maximum number of records
        
        Returns:
            List of recent prediction records
        """
        try:
            cutoff_time = (datetime.now() - timedelta(hours=hours)).isoformat()
            
            result = await self.db.query({
                "predictions": {
                    "$": {
                        "where": {
                            "created_at": {"$gte": cutoff_time}
                        },
                        "limit": limit,
                        "order": {
                            "serverCreatedAt": "desc"
                        }
                    }
                }
            })
            return result.get("predictions", [])
        except Exception as e:
            print(f"Error getting recent predictions: {e}")
            return []
    
    async def get_by_date_range(
        self,
        ticker: str,
        start_date: str,
        end_date: str
    ) -> List[Dict]:
        """
        Get predictions within date range
        
        Args:
            ticker: Ticker symbol
            start_date: Start date (ISO format)
            end_date: End date (ISO format)
        
        Returns:
            List of prediction records
        """
        try:
            result = await self.db.query({
                "predictions": {
                    "$": {
                        "where": {
                            "ticker": ticker,
                            "timestamp": {
                                "$gte": start_date,
                                "$lte": end_date
                            }
                        },
                        "order": {
                            "timestamp": "asc"
                        }
                    }
                }
            })
            return result.get("predictions", [])
        except Exception as e:
            print(f"Error getting predictions for date range: {e}")
            return []
    
    async def delete(self, prediction_id: str) -> bool:
        """
        Delete a prediction record
        
        Args:
            prediction_id: Prediction ID
        
        Returns:
            Success status
        """
        try:
            await self.db.tx.predictions[prediction_id].delete()
            return True
        except Exception as e:
            print(f"Error deleting prediction: {e}")
            return False
    
    async def count_by_ticker(self, ticker: str) -> int:
        """
        Count predictions for a ticker
        
        Args:
            ticker: Ticker symbol
        
        Returns:
            Count of predictions
        """
        try:
            result = await self.db.query({
                "predictions": {
                    "$": {
                        "where": {"ticker": ticker}
                    }
                }
            })
            return len(result.get("predictions", []))
        except Exception as e:
            print(f"Error counting predictions: {e}")
            return 0


# Singleton instance
predictions_repo = PredictionsRepository()

