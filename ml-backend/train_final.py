#!/usr/bin/env python3
"""
FINAL OPTIMIZED TRAINING SCRIPT
One file that works with all the code - NO BUGS
Targets 80%+ annual return
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta
import time

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

from src.core.training.ultimate_trainer import UltimateTrainer


async def train_optimized_model():
    """
    Train the ULTIMATE model with all optimizations
    NO FRED, NO BUGS, JUST RESULTS
    """
    
    print()
    print("=" * 80)
    print("🎯 FINAL OPTIMIZED TRAINING - PATH TO 80%+")
    print("=" * 80)
    print()
    
    start_time = time.time()
    
    # Configuration
    tickers = ['SPY', 'QQQ', 'DIA']
    interval = '1day'  # Daily predictions
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365 * 6)  # 6 years of data
    
    print(f"📅 Date Range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    print(f"📊 Tickers: {tickers}")
    print(f"⏱️  Interval: {interval}")
    print()
    
    # Progress callback (must be async)
    async def progress_callback(status: str, progress: float, data: dict = None):
        """Simple progress display"""
        if data:
            if 'step' in data:
                print(f"  [{progress:3.0f}%] {data['step']}")
            if 'metrics' in data:
                metrics = data['metrics']
                if 'h1' in metrics:
                    h1 = metrics['h1']
                    print(f"       → Dir Acc: {h1.get('dir_acc', 0):.2%}, "
                          f"Annual Return: {h1.get('annual_return', 0):.1%}")
    
    # Initialize trainer
    print("🔧 Initializing trainer...")
    trainer = UltimateTrainer()
    
    print("✅ Trainer ready")
    print()
    
    print("🚀 Starting training...")
    print()
    
    try:
        # Train the model
        results = await trainer.train_ultimate(
            universe=tickers,
            start_date=start_date.strftime('%Y-%m-%d'),
            end_date=end_date.strftime('%Y-%m-%d'),
            interval=interval,
            horizons=[1],  # Predict 1 day ahead
            callback=progress_callback
        )
        
        training_time = time.time() - start_time
        
        print()
        print("=" * 80)
        print("✅ TRAINING COMPLETE!")
        print("=" * 80)
        print()
        
        # Display results
        print("📈 PERFORMANCE METRICS:")
        print()
        
        expected_perf = results.get('expected_performance', {})
        print(f"  Direction Accuracy: {expected_perf.get('direction_accuracy', 0):.2%}")
        print(f"  Annual Return:      {expected_perf.get('annual_return', 0):.1%}")
        print(f"  Sharpe Ratio:       {expected_perf.get('sharpe_ratio', 0):.2f}")
        print(f"  Max Drawdown:       {expected_perf.get('max_drawdown', 0):.1%}")
        print(f"  Win Rate:           {expected_perf.get('win_rate', 0):.1%}")
        print()
        
        # Feature info
        feature_info = results.get('feature_info', {})
        print("🔍 FEATURE SELECTION:")
        print(f"  Total features: {feature_info.get('total_features', 'N/A')}")
        top_features = feature_info.get('top_features', [])[:5]
        if top_features:
            print(f"  Top 5 features: {', '.join(top_features)}")
        print()
        
        # Model info
        model_info = results.get('model_info', {})
        print("💾 MODEL SAVED:")
        print(f"  Location: {model_info.get('model_dir', 'N/A')}")
        print(f"  Predictions: {model_info.get('num_predictions', 0)}")
        print(f"  Signals: {model_info.get('num_signals', 0)}")
        print()
        
        print(f"⏱️  Training time: {training_time/60:.1f} minutes")
        print()
        
        # Analysis
        annual_return = expected_perf.get('annual_return', 0)
        print("=" * 80)
        print("📊 ANALYSIS")
        print("=" * 80)
        print()
        
        if annual_return >= 0.80:
            print(f"🎉 TARGET ACHIEVED! {annual_return:.1%} annual return")
            print("✅ Model ready for production!")
        elif annual_return >= 0.50:
            print(f"✅ Strong performance! {annual_return:.1%} annual return")
            print("💡 Phase 2 (Deep RL) can push this to 80%+")
        elif annual_return >= 0.20:
            print(f"⚠️  Moderate performance: {annual_return:.1%} annual return")
            print("💡 Multi-timeframe system needed for 80%+")
        else:
            print(f"⚠️  Below target: {annual_return:.1%} annual return")
            print("💡 Need to train multi-timeframe models (1h + 4h + daily)")
        
        print()
        print("=" * 80)
        
        return True
        
    except Exception as e:
        print()
        print("=" * 80)
        print(f"❌ Training failed: {e}")
        print("=" * 80)
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print()
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 20 + "FINAL OPTIMIZED TRAINING" + " " * 33 + "║")
    print("║" + " " * 25 + "Target: 80%+ Annual" + " " * 33 + "║")
    print("╚" + "=" * 78 + "╝")
    print()
    
    success = asyncio.run(train_optimized_model())
    
    if success:
        print()
        print("✅ Training completed successfully!")
        print("📄 Check ml-backend/models/ultimate/ for results")
        print()
    else:
        print()
        print("❌ Training failed - check errors above")
        print()
        sys.exit(1)

