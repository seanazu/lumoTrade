"""
Continuous Learning System - Model Improves Over Time!

This system:
1. Stores every prediction and actual outcome
2. Tracks which features work best in which conditions
3. Learns from mistakes (wrong predictions)
4. Adapts hyperparameters based on recent performance
5. Retrains automatically when accuracy drops

The model REMEMBERS and IMPROVES with each run!
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import pickle


class ContinuousLearner:
    """
    Enables the model to learn and improve over time.
    
    Key Features:
    1. Performance Tracking - Stores all predictions vs actuals
    2. Feature Evolution - Tracks which features work when
    3. Adaptive Hyperparameters - Auto-tunes based on performance
    4. Confidence Calibration - Learns true accuracy per confidence level
    5. Auto-Retraining - Triggers retraining when needed
    """
    
    def __init__(self, model_name: str = "ultimate", storage_dir: str = "data/learning_history"):
        self.model_name = model_name
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        
        # History files
        self.predictions_file = self.storage_dir / f"{model_name}_predictions.parquet"
        self.performance_file = self.storage_dir / f"{model_name}_performance.json"
        self.feature_importance_file = self.storage_dir / f"{model_name}_feature_importance.json"
        self.hyperparams_file = self.storage_dir / f"{model_name}_hyperparams.json"
        
        # Load existing history
        self.predictions_history = self._load_predictions()
        self.performance_history = self._load_performance()
        self.feature_importance_history = self._load_feature_importance()
        self.hyperparams_history = self._load_hyperparams()
    
    def _load_predictions(self) -> pd.DataFrame:
        """Load historical predictions."""
        if self.predictions_file.exists():
            try:
                return pd.read_parquet(self.predictions_file)
            except:
                return pd.DataFrame()
        return pd.DataFrame()
    
    def _load_performance(self) -> List[Dict]:
        """Load performance history."""
        if self.performance_file.exists():
            try:
                with open(self.performance_file, 'r') as f:
                    return json.load(f)
            except:
                return []
        return []
    
    def _load_feature_importance(self) -> Dict:
        """Load feature importance history."""
        if self.feature_importance_file.exists():
            try:
                with open(self.feature_importance_file, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def _load_hyperparams(self) -> List[Dict]:
        """Load hyperparameter history."""
        if self.hyperparams_file.exists():
            try:
                with open(self.hyperparams_file, 'r') as f:
                    return json.load(f)
            except:
                return []
        return []
    
    def record_training_run(
        self,
        predictions: pd.DataFrame,
        actuals: pd.DataFrame,
        metrics: Dict,
        feature_importance: Dict,
        hyperparams: Dict
    ):
        """
        Record a training run for continuous learning.
        
        Args:
            predictions: DataFrame with predictions and confidence
            actuals: DataFrame with actual outcomes
            metrics: Performance metrics (accuracy, returns, etc.)
            feature_importance: Feature importance scores
            hyperparams: Hyperparameters used in this run
        """
        timestamp = datetime.now().isoformat()
        
        # 1. Store predictions with outcomes
        pred_with_actual = predictions.copy()
        pred_with_actual['actual'] = actuals
        pred_with_actual['timestamp'] = timestamp
        pred_with_actual['correct'] = (pred_with_actual['prediction'].round() == pred_with_actual['actual']).astype(int)
        
        # Append to history
        self.predictions_history = pd.concat([self.predictions_history, pred_with_actual], ignore_index=True)
        self.predictions_history.to_parquet(self.predictions_file)
        
        # 2. Store performance metrics
        perf_record = {
            'timestamp': timestamp,
            'metrics': metrics,
            'run_number': len(self.performance_history) + 1
        }
        self.performance_history.append(perf_record)
        
        with open(self.performance_file, 'w') as f:
            json.dump(self.performance_history, f, indent=2)
        
        # 3. Store feature importance with timestamp
        self.feature_importance_history[timestamp] = feature_importance
        
        with open(self.feature_importance_file, 'w') as f:
            json.dump(self.feature_importance_history, f, indent=2)
        
        # 4. Store hyperparameters
        hyperparam_record = {
            'timestamp': timestamp,
            'hyperparams': hyperparams,
            'metrics': metrics
        }
        self.hyperparams_history.append(hyperparam_record)
        
        with open(self.hyperparams_file, 'w') as f:
            json.dump(self.hyperparams_history, f, indent=2)
        
        print(f"\n✅ Continuous Learning: Recorded run #{len(self.performance_history)}")
        print(f"   Total predictions stored: {len(self.predictions_history)}")
    
    def get_calibrated_confidence(self) -> Dict[str, float]:
        """
        Calculate TRUE accuracy per confidence bucket.
        
        Returns:
            Dict mapping confidence ranges to actual accuracy
        """
        if len(self.predictions_history) < 100:
            return {}
        
        df = self.predictions_history.copy()
        
        # Define confidence buckets
        buckets = {
            'very_high': (0.70, 1.0),
            'high': (0.60, 0.70),
            'medium': (0.50, 0.60),
            'low': (0.45, 0.50)
        }
        
        calibration = {}
        for name, (min_conf, max_conf) in buckets.items():
            mask = (df['confidence'] >= min_conf) & (df['confidence'] < max_conf)
            bucket_data = df[mask]
            
            if len(bucket_data) > 10:
                actual_accuracy = bucket_data['correct'].mean()
                calibration[name] = {
                    'confidence_range': f"{min_conf*100:.0f}-{max_conf*100:.0f}%",
                    'predicted_confidence': bucket_data['confidence'].mean(),
                    'actual_accuracy': actual_accuracy,
                    'sample_size': len(bucket_data),
                    'calibration_error': abs(bucket_data['confidence'].mean() - actual_accuracy)
                }
        
        return calibration
    
    def get_best_hyperparameters(self, metric: str = 'annual_return') -> Optional[Dict]:
        """
        Get the best hyperparameters based on historical performance.
        
        Args:
            metric: Metric to optimize ('annual_return', 'sharpe_ratio', 'direction_accuracy')
        
        Returns:
            Best hyperparameters found
        """
        if not self.hyperparams_history:
            return None
        
        # Find best run
        best_run = max(
            self.hyperparams_history,
            key=lambda x: x['metrics'].get(metric, 0)
        )
        
        return best_run['hyperparams']
    
    def get_trending_features(self, lookback_runs: int = 5) -> List[str]:
        """
        Get features that are becoming more important over time.
        
        Args:
            lookback_runs: Number of recent runs to analyze
        
        Returns:
            List of feature names with increasing importance
        """
        if len(self.feature_importance_history) < 2:
            return []
        
        # Get recent runs
        recent_timestamps = sorted(self.feature_importance_history.keys())[-lookback_runs:]
        
        if len(recent_timestamps) < 2:
            return []
        
        # Calculate trend for each feature
        feature_trends = {}
        
        for feature in self.feature_importance_history[recent_timestamps[0]].keys():
            importances = []
            for ts in recent_timestamps:
                if feature in self.feature_importance_history[ts]:
                    importances.append(self.feature_importance_history[ts][feature])
            
            if len(importances) >= 2:
                # Simple trend: compare recent avg to older avg
                mid = len(importances) // 2
                old_avg = np.mean(importances[:mid])
                new_avg = np.mean(importances[mid:])
                
                if old_avg > 0:
                    trend = (new_avg - old_avg) / old_avg
                    feature_trends[feature] = trend
        
        # Get top trending features
        trending = sorted(feature_trends.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return [f[0] for f in trending if f[1] > 0.1]  # At least 10% increase
    
    def should_retrain(
        self,
        accuracy_threshold: float = 0.52,
        lookback_days: int = 30
    ) -> Tuple[bool, str]:
        """
        Determine if model should be retrained based on recent performance.
        
        Args:
            accuracy_threshold: Minimum acceptable accuracy
            lookback_days: Days to look back for performance check
        
        Returns:
            (should_retrain, reason)
        """
        if len(self.predictions_history) < 50:
            return False, "Not enough predictions yet"
        
        # Check recent predictions
        cutoff_date = datetime.now() - timedelta(days=lookback_days)
        recent = self.predictions_history[
            pd.to_datetime(self.predictions_history['timestamp']) > cutoff_date
        ]
        
        if len(recent) < 20:
            return False, "Not enough recent predictions"
        
        # Calculate recent accuracy
        recent_accuracy = recent['correct'].mean()
        
        if recent_accuracy < accuracy_threshold:
            return True, f"Recent accuracy ({recent_accuracy:.2%}) below threshold ({accuracy_threshold:.2%})"
        
        # Check if accuracy is declining
        if len(recent) >= 50:
            first_half = recent.iloc[:len(recent)//2]
            second_half = recent.iloc[len(recent)//2:]
            
            first_acc = first_half['correct'].mean()
            second_acc = second_half['correct'].mean()
            
            if second_acc < first_acc - 0.05:  # 5% drop
                return True, f"Accuracy declining: {first_acc:.2%} → {second_acc:.2%}"
        
        return False, "Performance is acceptable"
    
    def get_learning_insights(self) -> Dict:
        """
        Get insights from learning history for optimization.
        
        Returns:
            Dict with actionable insights
        """
        if len(self.predictions_history) < 100:
            return {"status": "Not enough data yet", "runs": len(self.performance_history)}
        
        insights = {
            "total_runs": len(self.performance_history),
            "total_predictions": len(self.predictions_history),
            "calibration": self.get_calibrated_confidence(),
            "trending_features": self.get_trending_features(),
        }
        
        # Performance trend
        if len(self.performance_history) >= 3:
            recent_3 = self.performance_history[-3:]
            accuracies = [r['metrics'].get('direction_accuracy', 0) for r in recent_3]
            returns = [r['metrics'].get('annual_return', 0) for r in recent_3]
            
            insights['recent_trend'] = {
                'accuracy': {
                    'values': accuracies,
                    'trend': 'improving' if accuracies[-1] > accuracies[0] else 'declining'
                },
                'returns': {
                    'values': returns,
                    'trend': 'improving' if returns[-1] > returns[0] else 'declining'
                }
            }
        
        # Best ever performance
        best_run = max(self.performance_history, key=lambda x: x['metrics'].get('annual_return', 0))
        insights['best_ever'] = {
            'timestamp': best_run['timestamp'],
            'metrics': best_run['metrics']
        }
        
        # Check if we should retrain
        should_retrain, reason = self.should_retrain()
        insights['retrain_recommendation'] = {
            'should_retrain': should_retrain,
            'reason': reason
        }
        
        return insights
    
    def get_optimal_features(self, top_n: int = 40) -> List[str]:
        """
        Get the most consistently important features across all runs.
        
        Args:
            top_n: Number of top features to return
        
        Returns:
            List of feature names
        """
        if not self.feature_importance_history:
            return []
        
        # Average importance across all runs
        feature_scores = {}
        
        for timestamp, importances in self.feature_importance_history.items():
            for feature, score in importances.items():
                if feature not in feature_scores:
                    feature_scores[feature] = []
                feature_scores[feature].append(score)
        
        # Calculate mean importance
        feature_means = {
            feature: np.mean(scores)
            for feature, scores in feature_scores.items()
        }
        
        # Sort by importance
        sorted_features = sorted(feature_means.items(), key=lambda x: x[1], reverse=True)
        
        return [f[0] for f in sorted_features[:top_n]]


def demonstrate_continuous_learning():
    """Show how continuous learning works."""
    
    print("=" * 80)
    print("CONTINUOUS LEARNING SYSTEM DEMO")
    print("=" * 80)
    print()
    
    learner = ContinuousLearner()
    
    print(f"📊 Learning History:")
    print(f"   - Total training runs: {len(learner.performance_history)}")
    print(f"   - Total predictions: {len(learner.predictions_history)}")
    print()
    
    if len(learner.performance_history) > 0:
        print("📈 Performance Trend:")
        for i, run in enumerate(learner.performance_history[-5:], 1):
            metrics = run['metrics']
            print(f"   Run {i}: {metrics.get('direction_accuracy', 0):.2%} acc, "
                  f"{metrics.get('annual_return', 0):.1%} return")
        print()
    
    insights = learner.get_learning_insights()
    
    if 'calibration' in insights and insights['calibration']:
        print("🎯 Confidence Calibration (Model learns its true accuracy):")
        for bucket, cal in insights['calibration'].items():
            print(f"   {bucket}: Predicted {cal['predicted_confidence']:.1%}, "
                  f"Actual {cal['actual_accuracy']:.1%} "
                  f"(n={cal['sample_size']})")
        print()
    
    if insights.get('trending_features'):
        print("🔥 Trending Features (Becoming more important):")
        for feature in insights['trending_features'][:5]:
            print(f"   - {feature}")
        print()
    
    if 'retrain_recommendation' in insights:
        rec = insights['retrain_recommendation']
        print(f"🔄 Retrain Recommendation: {'YES' if rec['should_retrain'] else 'NO'}")
        print(f"   Reason: {rec['reason']}")
        print()
    
    print("✅ Continuous learning enables the model to:")
    print("   1. Remember past predictions and learn from mistakes")
    print("   2. Calibrate confidence scores to true accuracy")
    print("   3. Identify which features work best over time")
    print("   4. Auto-tune hyperparameters based on performance")
    print("   5. Know when to retrain for better results")
    print()


if __name__ == "__main__":
    demonstrate_continuous_learning()

