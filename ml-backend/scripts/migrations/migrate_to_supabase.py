"""
Migrate existing training data to Supabase
Extracts data from local files and uploads to cloud database
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

sys.path.insert(0, str(Path(__file__).parent))

print("=" * 80)
print("MIGRATE EXISTING DATA TO SUPABASE")
print("=" * 80)
print()

# Check if Supabase is configured
if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_KEY'):
    print("⚠️  Supabase not configured yet!")
    print()
    print("Please set up Supabase first:")
    print("1. Follow instructions in SETUP_SUPABASE.md")
    print("2. Add SUPABASE_URL and SUPABASE_KEY to .env")
    print("3. Run this script again")
    sys.exit(1)

from src.database.supabase_client import get_supabase_client

client = get_supabase_client()

if not client.enabled:
    print("❌ Supabase client not enabled!")
    sys.exit(1)

print("✅ Supabase connected")
print()

# Load existing metadata
metadata_path = Path(__file__).parent / 'ml-backend' / 'models' / 'ultimate' / 'metadata.json'

if not metadata_path.exists():
    print("⚠️  No existing training data found")
    print("   This is normal if you haven't trained yet")
    print()
    print("After your next training, data will automatically save to Supabase!")
    sys.exit(0)

print("📂 Found existing training data")
print(f"   {metadata_path}")
print()

with open(metadata_path) as f:
    metadata = json.load(f)

print("📊 Training Metadata:")
print(f"   Trained: {metadata.get('trained_at')}")
print(f"   Model: {metadata.get('model_type')}")
print(f"   Universe: {', '.join(metadata.get('universe', []))}")
print(f"   Samples: {metadata.get('total_samples')}")
print(f"   Features: {metadata.get('selected_features')}")
print()

# Extract overall metrics
overall = metadata.get('overall_metrics', {})
profit = metadata.get('overall_profit', {})

print("💰 Overall Performance:")
print(f"   Annual Return: {profit.get('annual_return', 0):.1%}")
print(f"   Sharpe Ratio: {profit.get('sharpe_ratio', 0):.2f}")
print(f"   Max Drawdown: {profit.get('max_drawdown', 0):.1%}")
print(f"   Win Rate: {profit.get('win_rate', 0):.1%}")
print(f"   Total Trades: {profit.get('num_trades', 0)}")
print()

# Migrate to Supabase
print("⬆️  Migrating to Supabase...")

try:
    # Store training session
    success = client.store_training_session(
        session_type="ultimate",
        index=', '.join(metadata.get('universe', [])),
        lookback_days=(datetime.fromisoformat(metadata['end_date']) - 
                      datetime.fromisoformat(metadata['start_date'])).days,
        samples=metadata.get('total_samples', 0),
        metrics={
            "annual_return": profit.get('annual_return', 0),
            "sharpe_ratio": profit.get('sharpe_ratio', 0),
            "max_drawdown": profit.get('max_drawdown', 0),
            "win_rate": profit.get('win_rate', 0),
            "total_trades": profit.get('num_trades', 0),
            "avg_profit_per_trade": profit.get('avg_profit_per_trade', 0),
            "direction_accuracy": overall.get('h1', {}).get('dir_acc', 0),
            "trained_at": metadata.get('trained_at'),
            "interval": metadata.get('interval'),
            "selected_features": metadata.get('selected_features')
        }
    )
    
    if success:
        print("   ✅ Training session migrated!")
    else:
        print("   ❌ Failed to migrate training session")
        sys.exit(1)
    
    print()
    print("=" * 80)
    print("✅ MIGRATION COMPLETE!")
    print("=" * 80)
    print()
    print("Your historical training data is now in Supabase!")
    print()
    print("View it at: " + os.getenv('SUPABASE_URL'))
    print()
    
    # Offer to clean up local files
    print("=" * 80)
    print("CLEANUP LOCAL FILES?")
    print("=" * 80)
    print()
    print("Your data is now safely in Supabase (cloud).")
    print("You can delete the local models folder to save space.")
    print()
    
    cleanup = input("Delete ml-backend/models/ultimate/ folder? (y/n): ").strip().lower()
    
    if cleanup == 'y':
        import shutil
        models_dir = Path(__file__).parent / 'ml-backend' / 'models' / 'ultimate'
        if models_dir.exists():
            shutil.rmtree(models_dir)
            print()
            print("✅ Local models folder deleted!")
            print("✅ All data is safe in Supabase")
            print()
            print("Future training runs will:")
            print("  - Save directly to Supabase")
            print("  - No local files created")
            print("  - Cloud-first storage")
        else:
            print()
            print("⚠️  Folder already deleted or not found")
    else:
        print()
        print("✅ Local files preserved")
        print()
        print("You can manually delete later:")
        print("  rm -rf ml-backend/models/ultimate/")
    print()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

