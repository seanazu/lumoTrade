"""
Model Accuracy Tracking and Performance Monitoring
"""
import json
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from pathlib import Path
import numpy as np

class AccuracyTracker:
    def __init__(self, storage_path: str = "data/accuracy_logs.json"):
        self.storage_path = Path(storage_path)
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Load existing logs
        self.predictions = self._load_logs()

    def _load_logs(self) -> List[Dict]:
        """Load prediction logs from disk"""
        if self.storage_path.exists():
            try:
                with open(self.storage_path, "r") as f:
                    return json.load(f)
            except:
                return []
        return []

    def _save_logs(self):
        """Save prediction logs to disk"""
        with open(self.storage_path, "w") as f:
            json.dump(self.predictions, f, indent=2)

    def log_prediction(
        self,
        symbol: str,
        timeframe: str,
        prediction: Dict,
        current_price: float
    ):
        """
        Log a prediction for later accuracy verification
        
        Args:
            symbol: Symbol predicted
            timeframe: Timeframe (1h, 4h, 1d)
            prediction: Prediction dict
            current_price: Price at time of prediction
        """
        log_entry = {
            "id": f"{symbol}_{datetime.now().isoformat()}",
            "symbol": symbol,
            "timeframe": timeframe,
            "timestamp": datetime.now().isoformat(),
            "prediction": {
                "direction": prediction.get("direction"),
                "confidence": prediction.get("confidence"),
                "expected_move_percent": prediction.get("expected_move_percent", 0)
            },
            "current_price": current_price,
            "future_price": None,  # To be filled later
            "actual_move_percent": None,
            "correct": None,
            "verified": False
        }
        
        self.predictions.append(log_entry)
        self._save_logs()
        
        print(f"📝 Logged prediction: {symbol} {prediction['direction']} (conf: {prediction['confidence']:.2f})")

    async def verify_predictions(self, data_loader):
        """
        Verify past predictions against actual outcomes
        
        Args:
            data_loader: DataLoader instance to fetch actual prices
        """
        print("\n🔍 Verifying past predictions...")
        
        verified_count = 0
        
        for prediction in self.predictions:
            if prediction["verified"]:
                continue
            
            # Check if enough time has passed
            pred_time = datetime.fromisoformat(prediction["timestamp"])
            timeframe = prediction["timeframe"]
            
            hours_to_wait = {"1h": 1, "4h": 4, "1d": 24}.get(timeframe, 1)
            required_time = pred_time + timedelta(hours=hours_to_wait)
            
            if datetime.now() < required_time:
                continue
            
            # Fetch actual price
            try:
                symbol = prediction["symbol"]
                actual_data = await data_loader.fetch_realtime_data(symbol)
                future_price = actual_data["price"]
                
                # Calculate actual move
                current_price = prediction["current_price"]
                actual_move = ((future_price - current_price) / current_price) * 100
                
                # Check if prediction was correct
                predicted_direction = prediction["prediction"]["direction"]
                actual_direction = "bullish" if actual_move > 0 else "bearish"
                
                correct = (
                    (predicted_direction == "bullish" and actual_move > 0) or
                    (predicted_direction == "bearish" and actual_move < 0) or
                    (predicted_direction == "neutral" and abs(actual_move) < 0.5)
                )
                
                # Update prediction
                prediction["future_price"] = future_price
                prediction["actual_move_percent"] = actual_move
                prediction["correct"] = correct
                prediction["verified"] = True
                prediction["verified_at"] = datetime.now().isoformat()
                
                verified_count += 1
            
            except Exception as e:
                print(f"Error verifying prediction {prediction['id']}: {e}")
        
        if verified_count > 0:
            self._save_logs()
            print(f"✅ Verified {verified_count} predictions")
        else:
            print("No predictions ready for verification")

    async def get_metrics(self) -> Dict:
        """
        Calculate accuracy metrics
        
        Returns:
            Dict with accuracy statistics
        """
        verified = [p for p in self.predictions if p.get("verified")]
        
        if not verified:
            return {
                "total_predictions": len(self.predictions),
                "verified_predictions": 0,
                "accuracy_percent": 0,
                "avg_confidence": 0,
                "confidence_calibration": {},
                "by_timeframe": {}
            }
        
        # Overall accuracy
        correct_count = sum(1 for p in verified if p["correct"])
        accuracy = (correct_count / len(verified)) * 100
        
        # Average confidence
        avg_confidence = np.mean([p["prediction"]["confidence"] for p in verified])
        
        # Confidence calibration
        confidence_calibration = self._calculate_confidence_calibration(verified)
        
        # Accuracy by timeframe
        by_timeframe = {}
        for tf in ["1h", "4h", "1d"]:
            tf_preds = [p for p in verified if p["timeframe"] == tf]
            if tf_preds:
                tf_correct = sum(1 for p in tf_preds if p["correct"])
                by_timeframe[tf] = {
                    "total": len(tf_preds),
                    "accuracy_percent": round((tf_correct / len(tf_preds)) * 100, 2)
                }
        
        return {
            "total_predictions": len(self.predictions),
            "verified_predictions": len(verified),
            "pending_verification": len(self.predictions) - len(verified),
            "accuracy_percent": round(accuracy, 2),
            "correct_predictions": correct_count,
            "incorrect_predictions": len(verified) - correct_count,
            "avg_confidence": round(avg_confidence, 2),
            "confidence_calibration": confidence_calibration,
            "by_timeframe": by_timeframe
        }

    def _calculate_confidence_calibration(self, verified: List[Dict]) -> Dict:
        """
        Check if confidence scores match actual accuracy
        
        For example: Are 70% confident predictions actually correct 70% of the time?
        """
        calibration = {}
        
        # Group by confidence buckets
        buckets = {
            "50-60%": (0.5, 0.6),
            "60-70%": (0.6, 0.7),
            "70-80%": (0.7, 0.8),
            "80-90%": (0.8, 0.9),
            "90-100%": (0.9, 1.0)
        }
        
        for bucket_name, (min_conf, max_conf) in buckets.items():
            bucket_preds = [
                p for p in verified 
                if min_conf <= p["prediction"]["confidence"] < max_conf
            ]
            
            if bucket_preds:
                correct = sum(1 for p in bucket_preds if p["correct"])
                actual_accuracy = (correct / len(bucket_preds)) * 100
                
                calibration[bucket_name] = {
                    "count": len(bucket_preds),
                    "actual_accuracy": round(actual_accuracy, 2),
                    "expected_accuracy": round((min_conf + max_conf) / 2 * 100, 2)
                }
        
        return calibration

    def get_recent_performance(self, days: int = 7) -> Dict:
        """Get performance metrics for recent predictions"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        recent = [
            p for p in self.predictions 
            if p.get("verified") and datetime.fromisoformat(p["timestamp"]) > cutoff_date
        ]
        
        if not recent:
            return {"message": "No recent verified predictions"}
        
        correct = sum(1 for p in recent if p["correct"])
        accuracy = (correct / len(recent)) * 100
        
        return {
            "period_days": days,
            "predictions": len(recent),
            "accuracy_percent": round(accuracy, 2),
            "correct": correct,
            "incorrect": len(recent) - correct
        }

# Singleton instance
accuracy_tracker = AccuracyTracker()

