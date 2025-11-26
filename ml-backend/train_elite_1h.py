#!/usr/bin/env python3
"""
ELITE 1H TRAINING - High-frequency opportunities
Target: 50-70% additional annual return
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta
import time
import numpy as np
import pandas as pd
import json

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

from src.core.data.elite_dataset_builder import EliteDatasetBuilder
from sklearn.model_selection import TimeSeriesSplit

try:
    import lightgbm as lgb
    HAS_LGBM = True
except ImportError:
    HAS_LGBM = False


async def train_elite_1h():
    """Train elite model on 1-hour data"""
    
    print()
    print("=" * 80)
    print("ELITE 1H MODEL TRAINING")
    print("High-frequency trading opportunities")
    print("=" * 80)
    print()
    
    if not HAS_LGBM:
        print("❌ LightGBM not installed")
        return None
    
    start_time = time.time()
    
    # Config
    tickers = ['SPY', 'QQQ', 'DIA']
    interval = '1h'
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365 * 2)  # 2 years for 1h
    
    print(f"📅 Date Range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    print(f"📊 Tickers: {tickers}")
    print(f"⏱️  Interval: {interval}")
    print()
    
    # Build dataset
    print("Building 1h dataset...")
    builder = EliteDatasetBuilder()
    
    X, y = await builder.build_panel_dataset(
        universe=tickers,
        start_date=start_date.strftime('%Y-%m-%d'),
        end_date=end_date.strftime('%Y-%m-%d'),
        interval=interval,
        horizons=[1],
        verbose=False
    )
    
    # Remove ticker column
    if 'ticker' in X.columns:
        X = X.drop('ticker', axis=1)
    
    target_col = 'dir_1h'
    mask = ~(X.isna().any(axis=1) | y[target_col].isna())
    X_clean = X[mask].copy()
    y_clean = y[mask][target_col].copy()
    
    print(f"✅ Dataset: {len(X_clean)} samples, {len(X_clean.columns)} features")
    print()
    
    # Train with 3-fold validation
    print("Training with 3-fold validation...")
    tscv = TimeSeriesSplit(n_splits=3)
    fold_results = []
    
    for fold_idx, (train_idx, test_idx) in enumerate(tscv.split(X_clean), 1):
        print(f"  Fold {fold_idx}/3: Train={len(train_idx)}, Test={len(test_idx)}", end='')
        
        X_train, X_test = X_clean.iloc[train_idx], X_clean.iloc[test_idx]
        y_train, y_test = y_clean.iloc[train_idx], y_clean.iloc[test_idx]
        
        train_data = lgb.Dataset(X_train, label=y_train)
        
        params = {
            'objective': 'binary',
            'metric': 'binary_logloss',
            'learning_rate': 0.03,
            'num_leaves': 31,
            'max_depth': 8,
            'verbose': -1,
            'force_col_wise': True
        }
        
        model = lgb.train(params, train_data, num_boost_round=150, callbacks=[lgb.log_evaluation(0)])
        
        y_pred_proba = model.predict(X_test)
        y_pred = (y_pred_proba > 0.5).astype(int)
        accuracy = (y_pred == y_test).mean()
        
        returns = []
        for i in range(len(y_test)):
            ret = 0.005 if (y_pred[i] == 1 and y_test.iloc[i] == 1) or (y_pred[i] == 0 and y_test.iloc[i] == 0) else -0.005
            returns.append(ret)
        
        cumulative_return = (1 + pd.Series(returns)).prod() - 1
        # Annualize: 252 trading days * 6.5 hours = 1638 trading hours
        annual_return = cumulative_return * (1638 / len(returns))
        
        print(f" → Acc: {accuracy:.2%}, Annual: {annual_return:.1%}")
        
        fold_results.append({
            'fold': fold_idx,
            'accuracy': accuracy,
            'annual_return': annual_return,
            'feature_importance': dict(zip(X_clean.columns, model.feature_importance()))
        })
    
    # Summary
    print()
    avg_accuracy = np.mean([r['accuracy'] for r in fold_results])
    avg_annual = np.mean([r['annual_return'] for r in fold_results])
    
    print(f"📊 Average Accuracy: {avg_accuracy:.2%}")
    print(f"📈 Average Annual:   {avg_annual:.1%}")
    print()
    
    # Train final model
    print("Training final 1h model...")
    final_train_data = lgb.Dataset(X_clean, label=y_clean)
    final_model = lgb.train(params, final_train_data, num_boost_round=200)
    
    # Save
    model_dir = Path('models/elite_1h')
    model_dir.mkdir(parents=True, exist_ok=True)
    final_model.save_model(str(model_dir / 'model.txt'))
    
    # Save metadata
    metadata = {
        'interval': '1h',
        'tickers': tickers,
        'features': list(X_clean.columns),
        'avg_accuracy': float(avg_accuracy),
        'avg_annual_return': float(avg_annual),
        'training_date': datetime.now().isoformat(),
        'training_time_seconds': time.time() - start_time,
        'fold_results': [
            {
                'fold': r['fold'],
                'accuracy': float(r['accuracy']),
                'annual_return': float(r['annual_return'])
            }
            for r in fold_results
        ]
    }
    
    with open(model_dir / 'metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✅ Model saved to {model_dir}/")
    print(f"⏱️  Training time: {(time.time() - start_time)/60:.1f} minutes")
    print()
    
    return metadata


if __name__ == "__main__":
    result = asyncio.run(train_elite_1h())
    if result:
        print(f"🎯 1H Model Complete: {result['avg_annual_return']:.1%} annual return")
    sys.exit(0 if result else 1)


