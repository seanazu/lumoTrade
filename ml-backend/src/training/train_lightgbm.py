"""
LightGBM Training Script
Train multi-horizon models for indices
"""
import asyncio
import argparse
from datetime import datetime, timedelta

from src.models.lightgbm_predictor import LightGBMPredictor
from src.data.dataset_builder import dataset_builder
from src.data.target_generator import target_generator


async def train_models(
    index: str = "SPX",
    start_date: str = None,
    end_date: str = None,
    train_ratio: float = 0.8,
    val_ratio: float = 0.1,
    model_dir: str = "models"
):
    """
    Train LightGBM models for all horizons
    
    Args:
        index: Index to train on (SPX, NDX, RUT)
        start_date: Training start date (default: 2 years ago)
        end_date: Training end date (default: today)
        train_ratio: Ratio of data for training
        val_ratio: Ratio of data for validation
        model_dir: Directory to save models
    """
    # Default dates: last 2 years
    if end_date is None:
        end_date = datetime.now().strftime("%Y-%m-%d")
    if start_date is None:
        start_date = (datetime.now() - timedelta(days=730)).strftime("%Y-%m-%d")
    
    print(f"\n{'='*80}")
    print(f"LightGBM Training Pipeline")
    print(f"{'='*80}")
    print(f"Index: {index}")
    print(f"Period: {start_date} to {end_date}")
    print(f"Train/Val/Test Split: {train_ratio:.0%}/{val_ratio:.0%}/{1-train_ratio-val_ratio:.0%}")
    print(f"{'='*80}\n")
    
    # Step 1: Build dataset
    print("📊 Step 1: Building Dataset...")
    print("="*80)
    
    # Build both intraday and daily datasets
    X_intraday, y_intraday = await dataset_builder.build_intraday_dataset(
        index=index,
        start_date=start_date,
        end_date=end_date,
        interval="5min"
    )
    
    X_daily, y_daily = await dataset_builder.build_daily_dataset(
        index=index,
        start_date=start_date,
        end_date=end_date
    )
    
    # For simplicity, we'll use daily dataset for all horizons
    # In production, you'd use intraday for 1h/4h/10h and daily for 1d/3d/5d
    X = X_daily
    y = y_daily
    
    print(f"\n✅ Dataset built: {len(X)} samples, {len(X.columns)-1} features\n")
    
    # Step 2: Split data
    print("📊 Step 2: Splitting Data...")
    print("="*80)
    
    n_samples = len(X)
    train_idx = int(n_samples * train_ratio)
    val_idx = int(n_samples * (train_ratio + val_ratio))
    
    X_train = X.iloc[:train_idx]
    X_val = X.iloc[train_idx:val_idx]
    X_test = X.iloc[val_idx:]
    
    y_train = y.iloc[:train_idx]
    y_val = y.iloc[train_idx:val_idx]
    y_test = y.iloc[val_idx:]
    
    print(f"Train: {len(X_train)} samples")
    print(f"Val:   {len(X_val)} samples")
    print(f"Test:  {len(X_test)} samples\n")
    
    # Step 3: Train baseline (without news features)
    print("📊 Step 3: Training Baseline (No News Features)...")
    print("="*80)
    
    # Remove news features
    news_cols = [col for col in X_train.columns if col.startswith('news_')]
    X_train_baseline = X_train.drop(columns=news_cols)
    X_val_baseline = X_val.drop(columns=news_cols)
    X_test_baseline = X_test.drop(columns=news_cols)
    
    predictor_baseline = LightGBMPredictor()
    baseline_metrics = predictor_baseline.train(
        X_train_baseline, y_train,
        X_val_baseline, y_val
    )
    
    print("\n📊 Baseline Evaluation:")
    baseline_test_metrics = predictor_baseline.evaluate(X_test_baseline, y_test)
    
    # Step 4: Train with news features
    print("\n📊 Step 4: Training With News Features...")
    print("="*80)
    
    predictor_full = LightGBMPredictor()
    full_metrics = predictor_full.train(
        X_train, y_train,
        X_val, y_val
    )
    
    print("\n📊 Full Model Evaluation:")
    full_test_metrics = predictor_full.evaluate(X_test, y_test)
    
    # Step 5: Compare performance
    print("\n📊 Step 5: Performance Comparison...")
    print("="*80)
    print(f"\n{'Horizon':<10} {'Baseline Dir Acc':<20} {'Full Dir Acc':<20} {'Improvement':<15}")
    print("-" * 80)
    
    for horizon in predictor_full.horizons:
        if horizon in baseline_test_metrics and horizon in full_test_metrics:
            baseline_acc = baseline_test_metrics[horizon]['directional_accuracy']
            full_acc = full_test_metrics[horizon]['directional_accuracy']
            improvement = full_acc - baseline_acc
            
            print(f"{horizon:<10} {baseline_acc:<20.2%} {full_acc:<20.2%} {improvement:+.2%}")
    
    # Step 6: Show feature importance
    print("\n📊 Step 6: Feature Importance Analysis...")
    print("="*80)
    
    for horizon in ["1h", "1d"]:  # Show for 2 representative horizons
        if horizon in predictor_full.models:
            predictor_full.print_feature_importance(horizon, top_n=20)
    
    # Step 7: Save models
    print("\n📊 Step 7: Saving Models...")
    print("="*80)
    
    predictor_full.save(model_dir)
    
    # Export test set for backtesting
    dataset_builder.export_to_parquet(
        X_test, y_test,
        f"{index}_test_set.parquet"
    )
    
    print(f"\n{'='*80}")
    print(f"✅ Training Complete!")
    print(f"{'='*80}")
    print(f"Models saved to: {model_dir}")
    print(f"Test set exported for backtesting")
    print(f"{'='*80}\n")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Train LightGBM models")
    parser.add_argument("--index", type=str, default="SPX", help="Index to train on (SPX, NDX, RUT)")
    parser.add_argument("--start-date", type=str, default=None, help="Start date (YYYY-MM-DD)")
    parser.add_argument("--end-date", type=str, default=None, help="End date (YYYY-MM-DD)")
    parser.add_argument("--train-ratio", type=float, default=0.8, help="Training ratio")
    parser.add_argument("--val-ratio", type=float, default=0.1, help="Validation ratio")
    parser.add_argument("--model-dir", type=str, default="models", help="Model save directory")
    
    args = parser.parse_args()
    
    # Run training
    asyncio.run(train_models(
        index=args.index,
        start_date=args.start_date,
        end_date=args.end_date,
        train_ratio=args.train_ratio,
        val_ratio=args.val_ratio,
        model_dir=args.model_dir
    ))


if __name__ == "__main__":
    main()

