#!/usr/bin/env python3
"""
Production Model Training Script v2.1

This script trains the production model with full optimization.
Can be run manually or triggered by Cloud Scheduler.

Features:
- 200+ Optuna optimization trials for best hyperparameters
- Regime-aware training (High VIX, Normal, Low VIX)
- SKEW index and VIX term structure features
- Sentiment integration from EODHD

Usage:
    python training/train_production.py [--trials 200]
    python training/train_production.py --no-optimize  # Quick run
    python training/train_production.py --quick        # 50 trials
"""

import os
import sys
import argparse
import json
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from src.core.prediction.production_model import ProductionModel


def main():
    parser = argparse.ArgumentParser(description='Train production model')
    parser.add_argument(
        '--trials', 
        type=int, 
        default=150,
        help='Number of Optuna optimization trials (default: 150)'
    )
    parser.add_argument(
        '--quick',
        action='store_true',
        help='Quick training with 50 trials'
    )
    parser.add_argument(
        '--no-optimize',
        action='store_true',
        help='Skip optimization, use default hyperparameters'
    )
    parser.add_argument(
        '--save-path',
        type=str,
        default='models/production',
        help='Path to save model (default: models/production)'
    )
    parser.add_argument(
        '--test-split',
        type=str,
        default='2024-01-01',
        help='Date to split train/test (default: 2024-01-01)'
    )
    
    args = parser.parse_args()
    
    # Determine trials
    if args.no_optimize:
        optimize_trials = 0
    elif args.quick:
        optimize_trials = 50
    else:
        optimize_trials = args.trials
    
    print("=" * 70)
    print("PRODUCTION MODEL TRAINING v2.1")
    print("=" * 70)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Optimization trials: {optimize_trials}")
    print(f"Test split date: {args.test_split}")
    print("=" * 70)
    print()
    
    # Initialize model
    model = ProductionModel()
    
    # Train
    results = model.train(
        optimize_trials=optimize_trials,
        test_split=args.test_split
    )
    
    # Save
    model.save(args.save_path)
    
    # Save to Supabase
    model.save_to_supabase()
    
    # Print results
    print()
    print("=" * 70)
    print("TRAINING COMPLETE")
    print("=" * 70)
    print(f"Overall Accuracy: {results['accuracy']:.1%}")
    print(f"Threshold: {results['threshold']:.2f}")
    print(f"Weights: LGB={results['weights'][0]:.2f}, CAT={results['weights'][1]:.2f}, XGB={results['weights'][2]:.2f}, GB={results['weights'][3]:.2f}")
    print(f"Features: {results['features']}")
    print(f"Train samples: {results['train_samples']}")
    print(f"Test samples: {results['test_samples']}")
    
    print()
    print("High Confidence Performance:")
    for conf, data in results.get('high_confidence', {}).items():
        print(f"  {conf}+ confidence: {data['accuracy']:.1%} ({data['trades']} trades)")
    
    print()
    print("Regime Performance:")
    for regime, data in results.get('regime_accuracy', {}).items():
        print(f"  {regime}: {data['accuracy']:.1%} ({data['days']} days)")
    
    print()
    print(f"Expected Annual Return: {results['annual_return']:.1f}%")
    print()
    print(f"Model saved to: {args.save_path}/")
    print("=" * 70)
    
    # Save results to JSON
    results_path = f"{args.save_path}/training_results.json"
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    print(f"Results saved to: {results_path}")
    
    # Make a prediction to verify
    print()
    print("Verifying model with prediction...")
    prediction = model.predict()
    print(f"  Direction: {prediction['direction']}")
    print(f"  Confidence: {prediction['confidence']:.1%}")
    print(f"  Signal: {prediction['trade_signal']}")
    print(f"  Position Size: {prediction['position_size']:.0%}")
    print(f"  Regime: {prediction['regime']['type']} (VIX: {prediction['regime']['vix']:.1f})")
    print("=" * 70)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

