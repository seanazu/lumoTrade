"""
Continuous Learning Cron Job
Run this script periodically to maintain model performance

Recommended schedule:
- Every hour: Update actual outcomes
- Every day: Check if retraining is needed
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.training.continuous_learner import continuous_learner


async def hourly_task():
    """Run every hour: Update predictions with actual outcomes"""
    print("\n" + "="*80)
    print("⏰ HOURLY TASK: Updating Actual Outcomes")
    print("="*80 + "\n")
    
    await continuous_learner.update_actual_outcomes()
    
    # Show performance summary
    summary = continuous_learner.get_performance_summary()
    print(f"\n📊 Performance Summary:")
    print(f"   Overall Accuracy: {summary['overall_accuracy']:.2%}")
    print(f"   Total Predictions: {summary['total_predictions']}")
    print(f"   Pending: {summary['pending_predictions']}")
    
    print("\n" + "="*80)
    print("✅ Hourly task complete")
    print("="*80 + "\n")


async def daily_task():
    """Run every day: Check if retraining is needed and retrain if necessary"""
    print("\n" + "="*80)
    print("📅 DAILY TASK: Auto-Retrain Check")
    print("="*80 + "\n")
    
    # First update outcomes
    await continuous_learner.update_actual_outcomes()
    
    # Check if retraining is needed
    should_retrain, reason = continuous_learner.should_retrain()
    
    print(f"🔍 Retrain Check: {reason}")
    
    if should_retrain:
        print("🔄 Retraining triggered...")
        
        # Retrain for all indices
        for index in ["SPX", "NDX", "RUT"]:
            print(f"\n📊 Retraining {index}...")
            try:
                await continuous_learner.incremental_retrain(
                    index=index,
                    lookback_days=90
                )
            except Exception as e:
                print(f"❌ Error retraining {index}: {e}")
                continue
    else:
        print("✅ No retraining needed")
    
    # Show final performance
    summary = continuous_learner.get_performance_summary()
    print(f"\n📊 Final Performance Summary:")
    print(f"   Overall Accuracy: {summary['overall_accuracy']:.2%}")
    print(f"   By Horizon:")
    for horizon, acc in summary['by_horizon'].items():
        print(f"      {horizon}: {acc:.2%}")
    
    print("\n" + "="*80)
    print("✅ Daily task complete")
    print("="*80 + "\n")


async def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Continuous Learning Cron Job")
    parser.add_argument("--task", choices=["hourly", "daily", "both"], default="both",
                       help="Which task to run")
    
    args = parser.parse_args()
    
    if args.task in ["hourly", "both"]:
        await hourly_task()
    
    if args.task in ["daily", "both"]:
        await daily_task()


if __name__ == "__main__":
    asyncio.run(main())

