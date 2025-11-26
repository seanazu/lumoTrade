"""
MAIN MODEL TRAINING FILE

This is THE ONLY file you need to train the model.

Usage:
    python3 train_model.py

Features:
- 6 years of optimal training data
- 35 core features (optimized)
- Continuous learning (improves over time)
- GPT-5 news analysis (when API keys set)
- Binary classification (predicts up/down)
- Ultra aggressive parameters (60% positions, 12% targets)

Expected Results:
- Direction Accuracy: 56%+
- Annual Return: 14%+
- Sharpe Ratio: 1.8+
- Win Rate: 55%+
"""

import asyncio
import sys
import os
import time
from pathlib import Path
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from src.core.training.ultimate_trainer import UltimateTrainer


async def test_optimized_model():
    """Test the optimized 50-feature model."""
    
    print("=" * 80)
    print("TRAINING MODEL - 6 Years Data + Continuous Learning")
    print("=" * 80)
    print()
    
    # Test configuration - OPTIMAL: 6 YEARS (sweet spot for relevance + volume)
    tickers = ["SPY", "QQQ", "DIA"]
    end_date = datetime.now()
    start_date = end_date - timedelta(days=2190)  # 6 YEARS - optimal balance of data volume and relevance!
    
    start_date_str = start_date.strftime("%Y-%m-%d")
    end_date_str = end_date.strftime("%Y-%m-%d")
    
    print(f"📅 Date Range: {start_date_str} to {end_date_str}")
    print(f"📊 Tickers: {tickers}")
    print(f"⏱️  Interval: 1day (daily predictions)")
    print()
    
    # Initialize trainer
    print("🔧 Initializing ULTIMATE Trainer with optimized hyperparameters...")
    trainer = UltimateTrainer()
    print(f"  ✅ Feature selection threshold: {trainer.feature_selection_threshold}")
    print(f"  ✅ Min samples per leaf: {trainer.min_samples_per_leaf}")
    print(f"  ✅ Early stopping patience: {trainer.early_stopping_patience}")
    print()
    
    # Progress callback (must be async)
    async def progress_callback(status: str, progress: float, details: dict = None):
        print(f"  [{int(progress*100):3d}%] {status}")
        if details:
            for key, value in details.items():
                if key not in ['type', 'message']:
                    print(f"       {key}: {value}")
    
    try:
        # Run training
        print("🚀 Starting training...")
        print()
        
        results = await trainer.train_ultimate(
            universe=tickers,
            start_date=start_date_str,
            end_date=end_date_str,
            interval="1day",
            horizons=[1],  # Just 1-day ahead prediction
            callback=progress_callback,
            verbose=True
        )
        
        print()
        print("=" * 80)
        print("TRAINING RESULTS")
        print("=" * 80)
        print()
        
        # Display results
        if 'error' in results:
            print(f"❌ Training failed: {results['error']}")
            return False
        
        # Expected performance
        expected_perf = results.get('expected_performance', {})
        print("📈 EXPECTED PERFORMANCE:")
        print(f"  Direction Accuracy: {expected_perf.get('direction_accuracy', 'N/A')}")
        print(f"  Sharpe Ratio: {expected_perf.get('sharpe_ratio', 'N/A')}")
        print(f"  Max Drawdown: {expected_perf.get('max_drawdown', 'N/A')}")
        print(f"  Win Rate: {expected_perf.get('win_rate', 'N/A')}")
        print()
        
        # Feature info
        feature_info = results.get('feature_info', {})
        print("🔍 FEATURE INFO:")
        print(f"  Total features after selection: {feature_info.get('total_features', 'N/A')}")
        print(f"  Top 10 features: {feature_info.get('top_features', [])[:10]}")
        print()
        
        # Training time
        training_time = results.get('training_time_seconds', 0)
        print(f"⏱️  Training time: {training_time:.1f} seconds ({training_time/60:.1f} minutes)")
        print()
        
        # Model paths
        model_dir = results.get('model_dir', 'N/A')
        print(f"💾 Model saved to: {model_dir}")
        print()
        
        # Success criteria
        print("=" * 80)
        print("SUCCESS CRITERIA CHECK")
        print("=" * 80)
        print()
        
        accuracy = expected_perf.get('direction_accuracy', 0)
        sharpe = expected_perf.get('sharpe_ratio', 0)
        num_features = feature_info.get('total_features', 0)
        
        checks = {
            "Training completed": True,
            f"Features ≤ 60 (got {num_features})": num_features <= 60 if num_features else False,
            f"Direction Accuracy ≥ 60% (got {accuracy})": accuracy >= 0.60 if isinstance(accuracy, (int, float)) else False,
            f"Sharpe Ratio ≥ 1.5 (got {sharpe})": sharpe >= 1.5 if isinstance(sharpe, (int, float)) else False,
            f"Training time < 15 min (got {training_time/60:.1f} min)": training_time < 900 if training_time else False,
        }
        
        for check, passed in checks.items():
            status = "✅" if passed else "❌"
            print(f"{status} {check}")
        
        print()
        
        all_passed = all(checks.values())
        if all_passed:
            print("🎉 ALL TESTS PASSED!")
        else:
            print("⚠️  Some tests failed, but training completed.")
        
        print()
        print("=" * 80)
        print("NEXT STEPS")
        print("=" * 80)
        print()
        print("1. Review the model's feature importance")
        print("2. Check the backtest results in the model metadata")
        print("3. Test predictions with the new model")
        print("4. Compare with previous 450-feature version")
        print()
        
        return all_passed
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_optimized_model())
    sys.exit(0 if success else 1)

