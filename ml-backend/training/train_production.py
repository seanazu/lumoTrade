#!/usr/bin/env python3
"""
Production Model Training Script

This script trains the production model with full optimization.
Can be run manually or triggered by Cloud Scheduler.

Usage:
    python training/train_production.py [--trials 100]
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
        default=100,
        help='Number of Optuna optimization trials (default: 100)'
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
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("PRODUCTION MODEL TRAINING")
    print("=" * 70)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Optimization trials: {args.trials if not args.no_optimize else 0}")
    print("=" * 70)
    
    # Initialize model
    model = ProductionModel()
    
    # Train
    optimize_trials = 0 if args.no_optimize else args.trials
    results = model.train(optimize_trials=optimize_trials)
    
    # Save
    model.save(args.save_path)
    
    # Save to Supabase
    model.save_to_supabase()
    
    # Print results
    print()
    print("=" * 70)
    print("TRAINING COMPLETE")
    print("=" * 70)
    print(f"Accuracy: {results['accuracy']:.1%}")
    print(f"Threshold: {results['threshold']:.2f}")
    print(f"Weights: LGB={results['weights'][0]:.2f}, CAT={results['weights'][1]:.2f}, XGB={results['weights'][2]:.2f}")
    print(f"Features: {results['features']}")
    print(f"Train samples: {results['train_samples']}")
    print(f"Test samples: {results['test_samples']}")
    
    print()
    print("High Confidence Performance:")
    for conf, data in results.get('high_confidence', {}).items():
        print(f"  {conf}+ confidence: {data['accuracy']:.1%} ({data['trades']} trades)")
    
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
    print("=" * 70)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

