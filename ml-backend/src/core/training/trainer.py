"""
Panel Model Training Orchestrator
Complete training pipeline with walk-forward validation and progress tracking
"""

import asyncio
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

from src.core.data.dataset_builder import PanelDatasetBuilder
from src.core.models import QuantileRegressorBundle, DirectionClassifier
from src.core.training.validator import create_walk_forward_folds, slice_between
from src.core.features import apply_feature_boosting, add_risk_z_scores


class TrainingProgressCallback:
    """Callback for tracking training progress (SSE integration)."""
    
    def __init__(self):
        self.progress = 0
        self.status = "Initializing"
        self.current_step = ""
        self.metrics = {}
    
    def update(self, progress: int, status: str, details: Dict = None):
        """Update training progress."""
        self.progress = progress
        self.status = status
        if details:
            self.current_step = details.get("step", "")
            if "metrics" in details:
                self.metrics.update(details["metrics"])


async def train_panel_models(
    universe: List[str] = None,
    start_date: str = None,
    end_date: str = None,
    interval: str = "5min",
    horizons: List[int] = None,
    train_window: int = 1500,
    test_window: int = 500,
    callback: Optional[TrainingProgressCallback] = None,
    verbose: bool = True
) -> Dict:
    """
    Complete training pipeline with panel data and walk-forward validation.
    
    Args:
        universe: List of tickers (default: ["SPY", "QQQ", "DIA", "XLK", "XLF", "XLV", "IWM"])
        start_date: Start date (default: 3 years ago)
        end_date: End date (default: today)
        interval: Bar interval (default: "5min")
        horizons: Prediction horizons in bars (default: [1, 5, 20])
        train_window: Training window size in bars (default: 5000)
        test_window: Test window size in bars (default: 1000)
        callback: Progress callback for SSE
        verbose: Print progress
    
    Returns:
        Dict with training results, metrics, and model paths
    """
    
    # Defaults
    if universe is None:
        universe = ["SPY", "QQQ", "DIA", "XLK", "XLF", "XLV", "IWM"]
    
    if horizons is None:
        horizons = [1, 5, 20]
    
    if end_date is None:
        end_date = datetime.now().strftime("%Y-%m-%d")
    
    if start_date is None:
        # 3 years ago
        start_date = (datetime.now() - timedelta(days=1095)).strftime("%Y-%m-%d")
    
    def update_progress(status: str, progress: int, details: Dict = None):
        """Helper to update progress."""
        if callback:
            callback.update(progress, status, details)
        if verbose:
            print(f"[{progress}%] {status}")
            if details and "step" in details:
                print(f"  {details['step']}")
    
    # === STEP 1: Build Panel Dataset (0-30%) ===
    
    update_progress("Building panel dataset", 5, {"step": f"Fetching data for {len(universe)} tickers"})
    
    builder = PanelDatasetBuilder()
    
    X_all, y_all = await builder.build_panel_dataset(
        universe=universe,
        start_date=start_date,
        end_date=end_date,
        interval=interval,
        horizons=horizons,
        verbose=verbose
    )
    
    if len(X_all) < train_window + test_window:
        raise ValueError(
            f"Insufficient data: {len(X_all)} samples available, "
            f"need at least {train_window + test_window}"
        )
    
    update_progress(
        "Panel dataset ready",
        30,
        {
            "step": f"{len(X_all)} samples, {len(X_all.columns)} features",
            "metrics": {
                "total_samples": len(X_all),
                "total_features": len(X_all.columns),
                "tickers": universe
            }
        }
    )
    
    # === STEP 2: Create Walk-Forward Folds (30-35%) ===
    
    update_progress("Creating walk-forward folds", 32, {"step": "Setting up time-series CV"})
    
    dates = X_all.index.get_level_values("date").unique()
    folds = create_walk_forward_folds(
        dates=dates,
        interval=interval,
        train_window=train_window,
        test_window=test_window,
        step_size=test_window
    )
    
    if len(folds) < 2:
        raise ValueError(f"Need at least 2 folds for validation, got {len(folds)}")
    
    update_progress(
        f"Created {len(folds)} folds",
        35,
        {
            "step": f"Each fold: {train_window} train, {test_window} test bars",
            "metrics": {"folds": len(folds)}
        }
    )
    
    # === STEP 3: Train Models for Each Fold (35-90%) ===
    
    fold_results = []
    all_predictions = []
    
    progress_per_fold = 55 / len(folds)
    
    for fold_idx, (train_start, train_end, test_end) in enumerate(folds, 1):
        base_progress = 35 + int((fold_idx - 1) * progress_per_fold)
        
        update_progress(
            f"Training fold {fold_idx}/{len(folds)}",
            base_progress,
            {"step": f"Train: {train_start.date()} → {train_end.date()}"}
        )
        
        # Split data
        X_train = slice_between(X_all, train_start, train_end)
        X_test = slice_between(X_all, train_end, test_end)
        y_train = slice_between(y_all, train_start, train_end)
        y_test = slice_between(y_all, train_end, test_end)
        
        # Apply feature boosting
        X_train_boosted = apply_feature_boosting(X_train)
        X_test_boosted = apply_feature_boosting(X_test)
        
        # Add z-scored risk features
        X_train_final, X_test_final = add_risk_z_scores(X_train_boosted, X_test_boosted)
        
        # Train quantile models
        quantile_bundle = QuantileRegressorBundle()
        fold_metrics = quantile_bundle.fit(
            X_train_final,
            y_train,
            horizons=horizons,
            X_val=X_test_final,
            y_val=y_test,
            verbose=False
        )
        
        # Predict on test set
        predictions = quantile_bundle.predict(X_test_final, horizons=horizons)
        
        # Calculate metrics
        fold_result = {
            "fold": fold_idx,
            "train_start": train_start,
            "train_end": train_end,
            "test_start": train_end,
            "test_end": test_end,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "metrics": {}
        }
        
        for horizon in horizons:
            if horizon in predictions and f"ret_{horizon}h" in y_test.columns:
                y_true = y_test[f"ret_{horizon}h"].dropna()
                preds_df = predictions[horizon].reindex(y_true.index).dropna()
                
                if not preds_df.empty and "p50" in preds_df.columns:
                    mae = np.mean(np.abs(preds_df["p50"] - y_true.reindex(preds_df.index)))
                    
                    # Coverage (% of actuals within P10-P90)
                    if "p10" in preds_df.columns and "p90" in preds_df.columns:
                        coverage = np.mean(
                            (y_true.reindex(preds_df.index) >= preds_df["p10"]) &
                            (y_true.reindex(preds_df.index) <= preds_df["p90"])
                        )
                    else:
                        coverage = np.nan
                    
                    # Direction accuracy
                    dir_acc = np.mean(
                        np.sign(preds_df["p50"]) == np.sign(y_true.reindex(preds_df.index))
                    )
                    
                    fold_result["metrics"][f"h{horizon}"] = {
                        "mae": float(mae),
                        "coverage": float(coverage),
                        "dir_acc": float(dir_acc)
                    }
        
        fold_results.append(fold_result)
        
        # Store predictions
        for horizon, pred_df in predictions.items():
            pred_df["horizon"] = horizon
            pred_df["fold"] = fold_idx
            all_predictions.append(pred_df)
        
        update_progress(
            f"Fold {fold_idx} complete",
            base_progress + int(progress_per_fold * 0.9),
            {
                "step": f"Test MAE: {fold_result['metrics'].get('h1', {}).get('mae', 'N/A')}",
                "metrics": fold_result["metrics"]
            }
        )
    
    # === STEP 4: Aggregate Results (90-95%) ===
    
    update_progress("Aggregating results", 90, {"step": "Calculating overall metrics"})
    
    # Combine predictions
    if all_predictions:
        predictions_df = pd.concat(all_predictions, ignore_index=False)
    else:
        predictions_df = pd.DataFrame()
    
    # Overall metrics
    overall_metrics = {}
    for horizon in horizons:
        h_metrics = [fr["metrics"].get(f"h{horizon}", {}) for fr in fold_results]
        if h_metrics:
            overall_metrics[horizon] = {
                "mae_mean": np.mean([m.get("mae", np.nan) for m in h_metrics]),
                "coverage_mean": np.mean([m.get("coverage", np.nan) for m in h_metrics]),
                "dir_acc_mean": np.mean([m.get("dir_acc", np.nan) for m in h_metrics])
            }
    
    # === STEP 5: Train Final Models (95-98%) ===
    
    update_progress("Training final models", 95, {"step": "Training on full dataset"})
    
    # Train on all data for deployment
    X_all_boosted = apply_feature_boosting(X_all)
    
    final_quantile_bundle = QuantileRegressorBundle()
    final_quantile_bundle.fit(
        X_all_boosted,
        y_all,
        horizons=horizons,
        verbose=False
    )
    
    # Get feature importance
    feature_importance = final_quantile_bundle.get_feature_importance(horizon=horizons[0])
    top10_features = feature_importance.head(10).to_dict("records")
    
    # === STEP 6: Save Models (98-100%) ===
    
    update_progress("Saving models", 98, {"step": "Writing to disk"})
    
    save_dir = Path("ml-backend/models/v2")
    save_dir.mkdir(parents=True, exist_ok=True)
    
    final_quantile_bundle.save(str(save_dir / "quantile_models"))
    
    # Save predictions
    if not predictions_df.empty:
        predictions_df.to_parquet(save_dir / "validation_predictions.parquet")
    
    # Save metadata
    import json
    metadata = {
        "trained_at": datetime.now().isoformat(),
        "universe": universe,
        "start_date": start_date,
        "end_date": end_date,
        "interval": interval,
        "horizons": horizons,
        "total_samples": len(X_all),
        "total_features": len(X_all.columns),
        "folds": len(folds),
        "fold_results": fold_results,
        "overall_metrics": overall_metrics,
        "top10_features": top10_features
    }
    
    with open(save_dir / "training_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2, default=str)
    
    update_progress("Training complete", 100, {"step": "Models saved successfully"})
    
    return metadata


if __name__ == "__main__":
    # Test training
    asyncio.run(train_panel_models(
        universe=["SPY", "QQQ"],
        start_date="2023-01-01",
        end_date="2024-01-01",
        interval="1d",
        horizons=[1, 5],
        train_window=200,
        test_window=50,
        verbose=True
    ))

