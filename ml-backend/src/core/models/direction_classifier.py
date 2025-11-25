"""
Direction Classifier
Binary classifier for directional predictions
Ported from multi_factor_model/multifactor/model/classifier.py
"""

import pickle
from pathlib import Path
from typing import Optional, Dict, Literal

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.calibration import CalibratedClassifierCV


Kind = Literal["logreg", "rf"]
CalibMethod = Literal["isotonic", "sigmoid"]


class DirectionClassifier:
    """
    Binary classifier for directional predictions.
    
    Returns calibrated probabilities: P(price goes up) ∈ [0, 1]
    
    Use cases:
    - Blend with quantile signals
    - Filter trades (only if prob > threshold)
    """
    
    def __init__(
        self,
        kind: Kind = "logreg",
        calibrate: bool = True,
        calibration_method: CalibMethod = "isotonic"
    ):
        """
        Initialize classifier.
        
        Args:
            kind: "logreg" (Logistic Regression) or "rf" (Random Forest)
            calibrate: Apply probability calibration
            calibration_method: "isotonic" or "sigmoid"
        """
        self.kind = kind
        self.calibrate = calibrate
        self.calibration_method = calibration_method
        
        self.scaler = StandardScaler()
        self.model = None
        self.feature_names = []
    
    def fit(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        calibration_cv: int = 5
    ):
        """
        Train classifier.
        
        Args:
            X_train: Training features
            y_train: Binary labels (0=down, 1=up)
            calibration_cv: CV folds for calibration
        """
        self.feature_names = list(X_train.columns)
        
        # Standardize features
        X_scaled = self.scaler.fit_transform(X_train)
        
        # Create base classifier
        if self.kind == "logreg":
            base_clf = LogisticRegression(
                C=1.0,
                max_iter=200,
                random_state=42,
                n_jobs=-1
            )
        elif self.kind == "rf":
            base_clf = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_leaf=50,
                random_state=42,
                n_jobs=-1
            )
        else:
            raise ValueError(f"Unknown kind: {self.kind}")
        
        # Apply calibration if requested
        if self.calibrate:
            self.model = CalibratedClassifierCV(
                base_clf,
                method=self.calibration_method,
                cv=calibration_cv,
                n_jobs=-1
            )
        else:
            self.model = base_clf
        
        # Fit
        self.model.fit(X_scaled, y_train)
    
    def predict_proba(self, X_test: pd.DataFrame) -> pd.Series:
        """
        Predict probability of upward movement.
        
        Args:
            X_test: Test features
        
        Returns:
            Series of probabilities [0, 1]
        """
        if self.model is None:
            raise ValueError("Model not fitted. Call fit() first.")
        
        X_scaled = self.scaler.transform(X_test)
        proba = self.model.predict_proba(X_scaled)[:, 1]
        
        return pd.Series(proba, index=X_test.index, name="prob_up")
    
    def predict(self, X_test: pd.DataFrame, threshold: float = 0.5) -> pd.Series:
        """
        Predict direction with threshold.
        
        Args:
            X_test: Test features
            threshold: Probability threshold (default: 0.5)
        
        Returns:
            Series of binary predictions (0=down, 1=up)
        """
        proba = self.predict_proba(X_test)
        return (proba >= threshold).astype(int)
    
    def save(self, save_path: str):
        """Save classifier and scaler."""
        save_dir = Path(save_path).parent
        save_dir.mkdir(parents=True, exist_ok=True)
        
        with open(save_path, "wb") as f:
            pickle.dump({
                "model": self.model,
                "scaler": self.scaler,
                "feature_names": self.feature_names,
                "kind": self.kind,
                "calibrate": self.calibrate,
                "calibration_method": self.calibration_method
            }, f)
    
    def load(self, save_path: str):
        """Load classifier and scaler."""
        with open(save_path, "rb") as f:
            data = pickle.load(f)
        
        self.model = data["model"]
        self.scaler = data["scaler"]
        self.feature_names = data["feature_names"]
        self.kind = data["kind"]
        self.calibrate = data["calibrate"]
        self.calibration_method = data["calibration_method"]

