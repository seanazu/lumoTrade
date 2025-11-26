"""
Quantile Regression Models
Multiple LightGBM models for uncertainty estimation
Ported from multi_factor_model/multifactor/model/quantile.py
"""

import pickle
from pathlib import Path
from typing import Dict, Tuple, List, Optional

import numpy as np
import pandas as pd
from lightgbm import LGBMRegressor


class QuantileRegressorBundle:
    """
    Bundle of quantile regression models for multi-horizon predictions.
    
    For each (horizon, quantile) pair, trains separate LightGBM model.
    Example: 3 horizons × 3 quantiles = 9 models
    
    Quantiles provide uncertainty estimates:
    - P10: Pessimistic (10th percentile)
    - P50: Median (50th percentile)
    - P90: Optimistic (90th percentile)
    
    Spread (P90 - P10) = confidence interval width
    """
    
    DEFAULT_QUANTILES = (0.10, 0.50, 0.90)
    
    def __init__(
        self,
        quantiles: Tuple[float, ...] = DEFAULT_QUANTILES,
        params: Optional[Dict] = None
    ):
        """
        Initialize bundle.
        
        Args:
            quantiles: Tuple of quantiles to predict (e.g., (0.10, 0.50, 0.90))
            params: LightGBM parameters (optional)
        """
        self.quantiles = quantiles
        self.models: Dict[Tuple[int, float], LGBMRegressor] = {}
        self.feature_names: List[str] = []
        self.horizons: List[int] = []
        
        # Default LightGBM parameters optimized for financial data
        self.params = params or {
            "n_estimators": 200,
            "learning_rate": 0.05,
            "max_depth": 7,
            "num_leaves": 63,
            "min_child_samples": 50,
            "subsample": 0.8,
            "subsample_freq": 1,
            "colsample_bytree": 0.8,
            "random_state": 42,
            "n_jobs": -1,
            "verbose": -1
        }
    
    def fit(
        self,
        X_train: pd.DataFrame,
        y_train: pd.DataFrame,
        horizons: List[int],
        X_val: Optional[pd.DataFrame] = None,
        y_val: Optional[pd.DataFrame] = None,
        verbose: bool = True
    ) -> Dict[Tuple[int, float], float]:
        """
        Train quantile models for all horizon-quantile pairs.
        
        Args:
            X_train: Training features
            y_train: Training targets (columns: ret_1h, ret_5h, ret_20h)
            horizons: List of horizons to train (e.g., [1, 5, 20])
            X_val: Validation features (optional)
            y_val: Validation targets (optional)
            verbose: Print progress
        
        Returns:
            Dict mapping (horizon, quantile) to validation MAE
        """
        self.horizons = horizons
        self.feature_names = list(X_train.columns)
        
        metrics = {}
        total_models = len(horizons) * len(self.quantiles)
        model_num = 0
        
        for horizon in horizons:
            target_col = f"ret_{horizon}h"
            
            if target_col not in y_train.columns:
                if verbose:
                    print(f"  ⚠️ Target {target_col} not found, skipping")
                continue
            
            y_h = y_train[target_col].dropna()
            X_h = X_train.loc[y_h.index]
            
            for quantile in self.quantiles:
                model_num += 1
                
                if verbose:
                    print(f"  [{model_num}/{total_models}] Training H={horizon}, Q={quantile:.2f}...", end=" ")
                
                # Create model with quantile objective
                model_params = self.params.copy()
                model_params.update({
                    "objective": "quantile",
                    "alpha": quantile
                })
                
                model = LGBMRegressor(**model_params)
                
                # Train
                if X_val is not None and y_val is not None:
                    y_val_h = y_val[target_col].dropna()
                    X_val_h = X_val.loc[y_val_h.index]
                    
                    model.fit(
                        X_h, y_h,
                        eval_set=[(X_val_h, y_val_h)],
                        eval_metric="mae",
                        callbacks=[
                            # Early stopping removed for consistency
                        ]
                    )
                    
                    # Validation MAE
                    y_pred = model.predict(X_val_h)
                    mae = np.mean(np.abs(y_pred - y_val_h))
                    metrics[(horizon, quantile)] = mae
                    
                    if verbose:
                        print(f"Val MAE: {mae:.3f}")
                else:
                    model.fit(X_h, y_h)
                    
                    if verbose:
                        print("✓")
                
                # Store model
                self.models[(horizon, quantile)] = model
        
        return metrics
    
    def predict(
        self,
        X_test: pd.DataFrame,
        horizons: Optional[List[int]] = None
    ) -> Dict[int, pd.DataFrame]:
        """
        Predict with trained quantile models.
        
        Args:
            X_test: Test features
            horizons: List of horizons to predict (default: all trained)
        
        Returns:
            Dict mapping horizon to DataFrame with columns [p10, p50, p90]
        """
        if horizons is None:
            horizons = self.horizons
        
        results = {}
        
        for horizon in horizons:
            preds = {}
            
            for quantile in self.quantiles:
                key = (horizon, quantile)
                
                if key not in self.models:
                    continue
                
                model = self.models[key]
                preds[f"p{int(quantile*100)}"] = model.predict(X_test)
            
            if preds:
                results[horizon] = pd.DataFrame(preds, index=X_test.index)
        
        return results
    
    def get_feature_importance(self, horizon: int = None, quantile: float = 0.50) -> pd.DataFrame:
        """
        Get feature importance for a specific model.
        
        Args:
            horizon: Horizon (default: first trained)
            quantile: Quantile (default: 0.50 median)
        
        Returns:
            DataFrame with columns [feature, importance]
        """
        if horizon is None:
            horizon = self.horizons[0]
        
        key = (horizon, quantile)
        
        if key not in self.models:
            return pd.DataFrame(columns=["feature", "importance"])
        
        model = self.models[key]
        importance = model.feature_importances_
        
        df = pd.DataFrame({
            "feature": self.feature_names,
            "importance": importance
        }).sort_values("importance", ascending=False)
        
        return df
    
    def save(self, save_dir: str):
        """
        Save all models and metadata.
        
        Args:
            save_dir: Directory to save models
        """
        save_path = Path(save_dir)
        save_path.mkdir(parents=True, exist_ok=True)
        
        # Save each model
        for (horizon, quantile), model in self.models.items():
            filename = f"h{horizon}_q{int(quantile*100)}.pkl"
            with open(save_path / filename, "wb") as f:
                pickle.dump(model, f)
        
        # Save metadata
        metadata = {
            "quantiles": self.quantiles,
            "horizons": self.horizons,
            "feature_names": self.feature_names,
            "params": self.params
        }
        
        with open(save_path / "metadata.pkl", "wb") as f:
            pickle.dump(metadata, f)
    
    def load(self, save_dir: str):
        """
        Load all models and metadata.
        
        Args:
            save_dir: Directory containing saved models
        """
        save_path = Path(save_dir)
        
        if not save_path.exists():
            raise FileNotFoundError(f"Model directory not found: {save_dir}")
        
        # Load metadata
        with open(save_path / "metadata.pkl", "rb") as f:
            metadata = pickle.load(f)
        
        self.quantiles = metadata["quantiles"]
        self.horizons = metadata["horizons"]
        self.feature_names = metadata["feature_names"]
        self.params = metadata["params"]
        
        # Load models
        self.models = {}
        for horizon in self.horizons:
            for quantile in self.quantiles:
                filename = f"h{horizon}_q{int(quantile*100)}.pkl"
                filepath = save_path / filename
                
                if filepath.exists():
                    with open(filepath, "rb") as f:
                        self.models[(horizon, quantile)] = pickle.load(f)

