"""
Continuous Learning System
Allows models to learn and improve over time without resetting
Uses InstantDB for persistent storage across sessions
"""
import os
import json
import pickle
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from pathlib import Path
import lightgbm as lgb
import uuid

from src.models.lightgbm_predictor import LightGBMPredictor
from src.data.dataset_builder import dataset_builder
from src.data.target_generator import target_generator
from src.database.instantdb_client import instantdb_client
from config import MODEL_CONFIG, TRAINING_CONFIG


class ContinuousLearner:
    """
    Manages continuous learning and model improvement
    
    Features:
    - Incremental training with new data
    - Performance tracking and versioning
    - Online learning from prediction errors
    - Auto-retraining when accuracy drops
    """
    
    def __init__(
        self,
        model_dir: str = "models",
        history_dir: str = "data/learning_history"
    ):
        self.model_dir = Path(model_dir)
        self.history_dir = Path(history_dir)
        self.history_dir.mkdir(parents=True, exist_ok=True)
        
        # Load or initialize learning history
        self.history_file = self.history_dir / "learning_history.json"
        self.history = self._load_history()
        
        # Prediction cache for tracking accuracy
        self.predictions_file = self.history_dir / "predictions.parquet"
        self.predictions_cache = self._load_predictions_cache()
        
        # Performance thresholds
        self.min_accuracy = 0.50  # Retrain if accuracy drops below 50%
        self.retrain_interval_days = 7  # Retrain every 7 days minimum
        self.min_samples_for_retrain = 100  # Need at least 100 new samples
    
    def _load_history(self) -> Dict:
        """Load learning history"""
        if self.history_file.exists():
            with open(self.history_file, 'r') as f:
                return json.load(f)
        return {
            "model_versions": [],
            "training_sessions": [],
            "performance_metrics": {},
            "last_retrain": None,
            "total_predictions": 0,
            "correct_predictions": 0
        }
    
    def _save_history(self):
        """Save learning history"""
        with open(self.history_file, 'w') as f:
            json.dump(self.history, f, indent=2)
    
    def _load_predictions_cache(self) -> pd.DataFrame:
        """Load cached predictions for accuracy tracking"""
        if self.predictions_file.exists():
            return pd.read_parquet(self.predictions_file)
        return pd.DataFrame(columns=[
            'timestamp', 'symbol', 'horizon', 'predicted_direction',
            'predicted_return', 'actual_return', 'correct', 'error'
        ])
    
    def _save_predictions_cache(self):
        """Save predictions cache"""
        self.predictions_cache.to_parquet(self.predictions_file, index=False)
    
    async def record_prediction(
        self,
        symbol: str,
        horizon: str,
        predicted_return: float,
        predicted_direction: str,
        confidence: float = 0.5,
        timestamp: datetime = None
    ):
        """
        Record a prediction for later accuracy tracking
        
        Args:
            symbol: Stock symbol
            horizon: Prediction horizon (1h, 4h, 1d, etc.)
            predicted_return: Predicted log return
            predicted_direction: "up", "down", or "neutral"
            confidence: Confidence score (0-1)
            timestamp: Prediction timestamp
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        prediction_id = str(uuid.uuid4())
        
        # Store in InstantDB (primary storage)
        if instantdb_client.enabled:
            success = instantdb_client.store_prediction(
                prediction_id=prediction_id,
                symbol=symbol,
                horizon=horizon,
                predicted_direction=predicted_direction,
                predicted_return=predicted_return,
                confidence=confidence,
                timestamp=timestamp
            )
            
            if success:
                print(f"📝 Recorded prediction to InstantDB: {symbol} {horizon} → {predicted_direction} ({predicted_return:.4f})")
            else:
                print(f"⚠️  Failed to record to InstantDB, using local cache")
        
        # Also add to local cache (fallback)
        new_pred = pd.DataFrame([{
            'id': prediction_id,
            'timestamp': timestamp,
            'symbol': symbol,
            'horizon': horizon,
            'predicted_direction': predicted_direction,
            'predicted_return': predicted_return,
            'confidence': confidence,
            'actual_return': None,  # Will be filled later
            'correct': None,
            'error': None
        }])
        
        self.predictions_cache = pd.concat([self.predictions_cache, new_pred], ignore_index=True)
        self._save_predictions_cache()
    
    async def update_actual_outcomes(self):
        """
        Update predictions with actual outcomes for accuracy tracking
        
        This should be run periodically (e.g., hourly) to check if predictions
        can be validated against actual market movements
        """
        print("\n🔄 Updating actual outcomes...")
        
        # Get predictions that don't have actual outcomes yet
        pending = self.predictions_cache[self.predictions_cache['actual_return'].isna()].copy()
        
        if len(pending) == 0:
            print("   No pending predictions to update")
            return
        
        print(f"   Found {len(pending)} pending predictions")
        
        updated_count = 0
        
        for idx, row in pending.iterrows():
            # Check if enough time has passed for this horizon
            pred_time = pd.to_datetime(row['timestamp'])
            now = datetime.now()
            
            # Parse horizon to hours
            horizon_hours = self._parse_horizon_to_hours(row['horizon'])
            required_time = pred_time + timedelta(hours=horizon_hours)
            
            if now < required_time:
                continue  # Not enough time has passed
            
            # Fetch actual return
            try:
                actual_return = await self._fetch_actual_return(
                    row['symbol'],
                    pred_time,
                    row['horizon']
                )
                
                if actual_return is not None:
                    # Update the row
                    self.predictions_cache.at[idx, 'actual_return'] = actual_return
                    
                    # Check if direction was correct
                    actual_direction = "up" if actual_return > 0.001 else ("down" if actual_return < -0.001 else "neutral")
                    correct = (row['predicted_direction'] == actual_direction)
                    self.predictions_cache.at[idx, 'correct'] = correct
                    
                    # Calculate error
                    error = abs(row['predicted_return'] - actual_return)
                    self.predictions_cache.at[idx, 'error'] = error
                    
                    updated_count += 1
                    
                    # Update history
                    self.history['total_predictions'] += 1
                    if correct:
                        self.history['correct_predictions'] += 1
                    
            except Exception as e:
                print(f"   ⚠️  Error fetching actual return for {row['symbol']}: {e}")
                continue
        
        if updated_count > 0:
            self._save_predictions_cache()
            self._save_history()
            print(f"   ✅ Updated {updated_count} predictions with actual outcomes")
            
            # Calculate current accuracy
            accuracy = self.get_current_accuracy()
            print(f"   📊 Current accuracy: {accuracy:.2%}")
    
    async def _fetch_actual_return(
        self,
        symbol: str,
        start_time: datetime,
        horizon: str
    ) -> Optional[float]:
        """Fetch actual return for a given prediction"""
        from src.data.data_loader import data_loader
        
        try:
            # Calculate end time
            horizon_hours = self._parse_horizon_to_hours(horizon)
            end_time = start_time + timedelta(hours=horizon_hours + 1)
            
            # Fetch price data
            df = await data_loader.load_historical_data(
                symbol=symbol,
                start_date=start_time.strftime("%Y-%m-%d"),
                end_date=end_time.strftime("%Y-%m-%d"),
                interval="1min"
            )
            
            if len(df) < 2:
                return None
            
            # Find closest bars to start and end times
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            
            start_bar = df[df['timestamp'] >= start_time].iloc[0] if len(df[df['timestamp'] >= start_time]) > 0 else None
            end_bar = df[df['timestamp'] >= end_time].iloc[0] if len(df[df['timestamp'] >= end_time]) > 0 else None
            
            if start_bar is None or end_bar is None:
                return None
            
            # Calculate log return
            actual_return = np.log(end_bar['close'] / start_bar['close'])
            return float(actual_return)
            
        except Exception as e:
            print(f"   Error in _fetch_actual_return: {e}")
            return None
    
    def _parse_horizon_to_hours(self, horizon: str) -> float:
        """Convert horizon string to hours"""
        if horizon.endswith('h'):
            return float(horizon[:-1])
        elif horizon.endswith('d'):
            return float(horizon[:-1]) * 24
        return 24.0  # Default to 1 day
    
    def get_current_accuracy(self, horizon: Optional[str] = None, symbol: Optional[str] = None) -> float:
        """
        Get current prediction accuracy
        
        Args:
            horizon: Specific horizon to check (None = all horizons)
            symbol: Specific symbol to check (None = all symbols)
        
        Returns:
            Accuracy as a float (0 to 1)
        """
        # Try InstantDB first
        if instantdb_client.enabled:
            return instantdb_client.calculate_accuracy(symbol=symbol, horizon=horizon)
        
        # Fallback to local cache
        df = self.predictions_cache[self.predictions_cache['correct'].notna()].copy()
        
        if horizon:
            df = df[df['horizon'] == horizon]
        if symbol:
            df = df[df['symbol'] == symbol]
        
        if len(df) == 0:
            return 0.0
        
        return df['correct'].mean()
    
    def get_performance_summary(self) -> Dict:
        """Get comprehensive performance summary"""
        # Use InstantDB if available
        if instantdb_client.enabled:
            stats = instantdb_client.get_statistics()
            
            summary = {
                "overall_accuracy": stats.get("overall_accuracy", 0.0),
                "by_horizon": {},
                "by_symbol": {},
                "total_predictions": stats.get("validated_predictions", 0),
                "pending_predictions": stats.get("pending_predictions", 0),
                "last_retrain": self.history.get('last_retrain'),
                "model_versions": len(self.history.get('model_versions', [])),
                "storage": "instantdb"
            }
            
            # Accuracy by horizon
            for horizon in MODEL_CONFIG['horizons']:
                summary['by_horizon'][horizon] = self.get_current_accuracy(horizon=horizon)
            
            # Accuracy by symbol
            for symbol in ["SPY", "QQQ", "IWM"]:
                summary['by_symbol'][symbol] = self.get_current_accuracy(symbol=symbol)
            
            return summary
        
        # Fallback to local cache
        summary = {
            "overall_accuracy": self.get_current_accuracy(),
            "by_horizon": {},
            "by_symbol": {},
            "total_predictions": len(self.predictions_cache[self.predictions_cache['correct'].notna()]),
            "pending_predictions": len(self.predictions_cache[self.predictions_cache['correct'].isna()]),
            "last_retrain": self.history.get('last_retrain'),
            "model_versions": len(self.history.get('model_versions', [])),
            "storage": "local"
        }
        
        # Accuracy by horizon
        for horizon in MODEL_CONFIG['horizons']:
            summary['by_horizon'][horizon] = self.get_current_accuracy(horizon)
        
        # Accuracy by symbol
        df = self.predictions_cache[self.predictions_cache['correct'].notna()].copy()
        for symbol in df['symbol'].unique():
            summary['by_symbol'][symbol] = self.get_current_accuracy(symbol=symbol)
        
        return summary
    
    def should_retrain(self) -> Tuple[bool, str]:
        """
        Determine if model should be retrained
        
        Returns:
            (should_retrain, reason)
        """
        # Check 1: Has enough time passed since last retrain?
        last_retrain = self.history.get('last_retrain')
        if last_retrain:
            last_retrain_date = datetime.fromisoformat(last_retrain)
            days_since = (datetime.now() - last_retrain_date).days
            
            if days_since >= self.retrain_interval_days:
                return True, f"Scheduled retrain (last: {days_since} days ago)"
        else:
            return True, "No previous training found"
        
        # Check 2: Has accuracy dropped below threshold?
        accuracy = self.get_current_accuracy()
        if accuracy > 0 and accuracy < self.min_accuracy:
            return True, f"Low accuracy: {accuracy:.2%} < {self.min_accuracy:.2%}"
        
        # Check 3: Do we have enough new data?
        validated_preds = len(self.predictions_cache[self.predictions_cache['correct'].notna()])
        if last_retrain:
            last_retrain_date = datetime.fromisoformat(last_retrain)
            new_preds = self.predictions_cache[
                (self.predictions_cache['correct'].notna()) &
                (pd.to_datetime(self.predictions_cache['timestamp']) > last_retrain_date)
            ]
            
            if len(new_preds) >= self.min_samples_for_retrain:
                return True, f"Enough new data: {len(new_preds)} samples"
        
        return False, "No retrain needed"
    
    async def incremental_retrain(
        self,
        index: str = "SPX",
        use_recent_data_only: bool = True,
        lookback_days: int = 90
    ):
        """
        Perform incremental retraining with recent data
        
        Args:
            index: Index to retrain
            use_recent_data_only: If True, only use last N days
            lookback_days: How many days of recent data to use
        """
        print(f"\n{'='*80}")
        print(f"🔄 Incremental Retraining")
        print(f"{'='*80}")
        print(f"Index: {index}")
        print(f"Lookback: {lookback_days} days")
        print(f"{'='*80}\n")
        
        # Determine date range
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=lookback_days)).strftime("%Y-%m-%d")
        
        # Build dataset
        print("📊 Building dataset with recent data...")
        X_daily, y_daily = await dataset_builder.build_daily_dataset(
            index=index,
            start_date=start_date,
            end_date=end_date
        )
        
        # Load existing models
        predictor = LightGBMPredictor()
        model_path = self.model_dir
        
        if (model_path / "metadata.json").exists():
            print("📂 Loading existing models...")
            predictor.load(str(model_path))
            
            # Incremental training: continue from existing models
            print("🔧 Performing incremental training...")
            
            # Split data
            train_size = int(len(X_daily) * 0.9)
            X_train = X_daily.iloc[:train_size]
            y_train = y_daily.iloc[:train_size]
            X_val = X_daily.iloc[train_size:]
            y_val = y_daily.iloc[train_size:]
            
            # For each horizon, continue training
            for horizon in predictor.horizons:
                target_col = f'r_{horizon}'
                if target_col not in y_train.columns:
                    continue
                
                print(f"   📈 Updating {horizon} model...")
                
                # Get existing model
                if horizon in predictor.models:
                    model = predictor.models[horizon]
                    
                    # Continue training (warm start)
                    # Note: LightGBM doesn't support true incremental learning,
                    # but we can retrain with combined old + new data
                    # For true online learning, we'd need a different approach
                    
                    # For now, retrain with recent data
                    model.fit(
                        X_train[predictor.feature_names],
                        y_train[target_col],
                        eval_set=[(X_val[predictor.feature_names], y_val[target_col])],
                        callbacks=[lgb.early_stopping(stopping_rounds=30, verbose=False)]
                    )
                    
                    predictor.models[horizon] = model
            
            # Save updated models
            print("\n💾 Saving updated models...")
            predictor.save(str(model_path))
            
            # Update history
            self.history['last_retrain'] = datetime.now().isoformat()
            self.history['training_sessions'].append({
                'timestamp': datetime.now().isoformat(),
                'type': 'incremental',
                'index': index,
                'lookback_days': lookback_days,
                'samples': len(X_train)
            })
            self._save_history()
            
            print(f"\n{'='*80}")
            print(f"✅ Incremental Retraining Complete")
            print(f"{'='*80}\n")
            
        else:
            print("⚠️  No existing models found. Run full training first.")
            print("   Use: python -m src.training.train_lightgbm")
    
    async def auto_retrain_if_needed(self, index: str = "SPX"):
        """
        Automatically retrain if conditions are met
        
        This should be called periodically (e.g., daily via cron job)
        """
        should_retrain, reason = self.should_retrain()
        
        if should_retrain:
            print(f"🔄 Auto-retraining triggered: {reason}")
            await self.incremental_retrain(index=index)
        else:
            print(f"✅ No retraining needed: {reason}")


# Singleton instance
continuous_learner = ContinuousLearner()

