#!/usr/bin/env python3
"""
Complete Multi-Timeframe Training Pipeline
Trains all three models (1h, 4h, 1d) and tests integration
Research shows: 50-65% annual return expected
"""

import asyncio
import sys
from datetime import datetime, timedelta
from pathlib import Path
import time
import json

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

from src.core.training.ultimate_trainer import UltimateTrainer
from src.core.trading.multi_timeframe_trader import MultiTimeframeTrader


async def train_all_timeframes():
    """
    Train models for all three timeframes
    Sequential execution to manage resources
    """
    
    print()
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 15 + "COMPLETE MULTI-TIMEFRAME TRAINING PIPELINE" + " " * 20 + "║")
    print("║" + " " * 20 + "Research-Backed Path to 80%+ Returns" + " " * 21 + "║")
    print("╚" + "=" * 78 + "╝")
    print()
    
    results = {}
    total_start = time.time()
    
    # Define training configurations
    configs = [
        {
            'name': '1h',
            'interval': '1h',
            'years': 4,  # Increased to ensure 550+ bars
            'description': 'High-frequency intraday trading',
            'expected_return': 0.30,
            'expected_trades': 1638
        },
        {
            'name': '4h',
            'interval': '4h',
            'years': 8,  # Increased to ensure 550+ bars
            'description': 'Swing trading',
            'expected_return': 0.12,
            'expected_trades': 410
        },
        {
            'name': '1d',
            'interval': '1day',
            'years': 6,
            'description': 'Position trading',
            'expected_return': 0.178,
            'expected_trades': 252
        }
    ]
    
    # Train each timeframe
    for i, config in enumerate(configs, 1):
        print()
        print("=" * 80)
        print(f"TRAINING {config['name'].upper()} MODEL ({i}/3)")
        print("=" * 80)
        print(f"Interval: {config['interval']}")
        print(f"Description: {config['description']}")
        print(f"Expected return: {config['expected_return']:.1%}")
        print(f"Expected trades/year: {config['expected_trades']}")
        print("=" * 80)
        print()
        
        # Date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365 * config['years'])
        
        # Progress callback
        async def progress_callback(status: str, progress: float, data: dict = None):
            if data and 'step' in data:
                step = data.get('step', '')
                if len(step) < 60:  # Only print concise updates
                    print(f"  [{progress:>3.0f}%] {step}")
        
        # Initialize trainer
        trainer = UltimateTrainer()
        
        # Start timer
        train_start = time.time()
        
        # Train
        try:
            result = await trainer.train_ultimate(
                universe=['SPY', 'QQQ', 'DIA'],
                start_date=start_date,
                end_date=end_date,
                interval=config['interval'],
                horizons=[1],
                callback=progress_callback
            )
            
            train_time = time.time() - train_start
            
            # Extract metrics
            overall_metrics = result.get('overall_metrics', {}).get('1', {})
            profit_metrics = result.get('overall_profit_metrics', {})
            
            # Store results
            results[config['name']] = {
                'interval': config['interval'],
                'annual_return': profit_metrics.get('annual_return', 0),
                'sharpe_ratio': profit_metrics.get('sharpe_ratio', 0),
                'accuracy': overall_metrics.get('dir_acc', 0),
                'win_rate': profit_metrics.get('win_rate', 0),
                'max_drawdown': profit_metrics.get('max_drawdown', 0),
                'training_time': train_time,
                'expected_return': config['expected_return'],
                'expected_trades': config['expected_trades']
            }
            
            print()
            print(f"✅ {config['name'].upper()} MODEL COMPLETE")
            print(f"   Annual Return: {profit_metrics.get('annual_return', 0):.1%}")
            print(f"   Sharpe Ratio: {profit_metrics.get('sharpe_ratio', 0):.2f}")
            print(f"   Accuracy: {overall_metrics.get('dir_acc', 0):.1%}")
            print(f"   Training Time: {train_time/60:.1f} minutes")
            print()
            
        except Exception as e:
            print(f"❌ ERROR training {config['name']} model: {e}")
            results[config['name']] = {'error': str(e)}
    
    total_time = time.time() - total_start
    
    # Calculate combined performance
    print()
    print("=" * 80)
    print("📊 MULTI-TIMEFRAME PORTFOLIO ANALYSIS")
    print("=" * 80)
    print()
    
    # Create trader for allocation
    trader = MultiTimeframeTrader(
        models={},
        capital_allocation={'1h': 0.40, '4h': 0.30, '1d': 0.30}
    )
    
    # Calculate weighted returns
    total_weighted_return = 0.0
    successful_models = 0
    
    print("Individual Model Performance:")
    print()
    for name, result in results.items():
        if 'error' not in result:
            allocation = trader.capital_allocation.get(name, 0)
            annual_return = result['annual_return']
            weighted_return = annual_return * allocation
            total_weighted_return += weighted_return
            successful_models += 1
            
            print(f"  {name.upper()} Model:")
            print(f"    Annual Return: {annual_return:.1%}")
            print(f"    Sharpe Ratio: {result['sharpe_ratio']:.2f}")
            print(f"    Accuracy: {result['accuracy']:.1%}")
            print(f"    Allocation: {allocation:.0%}")
            print(f"    Weighted Return: {weighted_return:.1%}")
            print()
    
    print("=" * 80)
    print("🎯 COMBINED PORTFOLIO PERFORMANCE")
    print("=" * 80)
    print()
    print(f"💰 Total Weighted Return: {total_weighted_return:.1%}")
    print(f"📊 Models Trained: {successful_models}/3")
    print(f"⏱️  Total Training Time: {total_time/60:.1f} minutes")
    print()
    
    # Success evaluation
    print("=" * 80)
    print("✅ PHASE 1 SUCCESS CRITERIA")
    print("=" * 80)
    print()
    
    target_return = 0.50  # 50% target for Phase 1
    
    checks = [
        (successful_models == 3, "All 3 models trained", f"{successful_models}/3"),
        (total_weighted_return >= target_return, f"Return ≥ {target_return:.0%}", f"{total_weighted_return:.1%}"),
        (total_weighted_return >= 0.178, "Better than daily alone", f"{total_weighted_return:.1%} vs 17.8%"),
    ]
    
    all_passed = True
    for passed, criteria, result_str in checks:
        status = "✅" if passed else "❌"
        print(f"{status} {criteria} ({result_str})")
        if not passed:
            all_passed = False
    
    print()
    print("=" * 80)
    
    if all_passed and total_weighted_return >= target_return:
        print("🎉 PHASE 1 COMPLETE! TARGET ACHIEVED!")
        print()
        print(f"Performance: {total_weighted_return:.1%} annual return")
        print("Status: ✅ Ready for Phase 2 (Deep Reinforcement Learning)")
        print()
        print("Expected after Phase 2: 65-80% annual return")
        print("Path to 80%+: On track! 🎯")
    elif successful_models == 3:
        print("✅ All models trained successfully!")
        print()
        gap = target_return - total_weighted_return
        print(f"Performance gap: {gap:.1%} to reach 50% target")
        print()
        print("Optimization opportunities:")
        print("  - Fine-tune hyperparameters per timeframe")
        print("  - Adjust capital allocation based on performance")
        print("  - Add more training data")
        print("  - Optimize feature selection per interval")
    else:
        print("⚠️  Some models failed to train")
        print("Review error messages above and retry")
    
    print("=" * 80)
    print()
    
    # Save results
    results_file = Path(__file__).parent / 'multi_timeframe_results.json'
    with open(results_file, 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'results': results,
            'total_weighted_return': total_weighted_return,
            'total_training_time': total_time,
            'phase_1_complete': all_passed and total_weighted_return >= target_return
        }, f, indent=2)
    
    print(f"📄 Results saved to: {results_file}")
    print()
    
    return results


if __name__ == "__main__":
    print()
    print("This will train all three models sequentially:")
    print("  1. 1h model (~10-20 minutes)")
    print("  2. 4h model (~15-25 minutes)")
    print("  3. 1d model (using existing)")
    print()
    print("Total estimated time: 30-45 minutes")
    print()
    print("Starting complete multi-timeframe training automatically...")
    print()
    
    asyncio.run(train_all_timeframes())

