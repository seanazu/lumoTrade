# Quick Test Instructions

## Fix Python Environment First

If you're seeing crashes (exit code 139), fix the environment:

```bash
cd /Users/seanazulay/Desktop/StockBots/LumoTrade/ml-backend

# Option 1: Reinstall problematic packages
pip uninstall numpy pandas lightgbm -y
pip install numpy pandas lightgbm --no-cache-dir

# Option 2: Recreate entire environment (safer)
deactivate
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## Run Tests in Order

### 1. Validation Test (30 seconds)
```bash
python tests/test_1_validation.py
```

**Expected:** All green checkmarks, no errors

**If it fails:** Check requirements.txt and reinstall dependencies

### 2. Small Training Test (5-10 minutes)
```bash
python tests/test_2_small_training.py
```

**Expected:**
- ~180 training samples (2 tickers × 90 days)
- ~230 features
- MAE < 3.0%
- Direction accuracy > 50%

**If results are poor:**
- Check data quality (are you getting real data?)
- Review `data/test_results/small_training_results.json`
- Try adjusting hyperparameters in `src/models_v2/quantile_regressor.py`

### 3. Backtest Test (10-20 minutes)
```bash
# First, make sure you've run test_2
python tests/test_5_backtest.py
```

**Expected:**
- Equity curve generated
- Sharpe ratio > 1.0 (for small test)
- CAGR calculated

**Target for full model:**
- **CAGR: 60%+**
- **Sharpe: 2.0+**
- **Max Drawdown: < 20%**

## Quick Commands

```bash
# Run all tests
python tests/test_1_validation.py && \
python tests/test_2_small_training.py && \
python tests/test_5_backtest.py

# Check if backend is running
curl http://localhost:8000/health

# Start backend if not running
python -m uvicorn app:app --reload --port 8000

# View latest training results
cat data/test_results/small_training_results.json | python -m json.tool
```

## Troubleshooting

### "No module named 'src'"
```bash
# Make sure you're in ml-backend directory
cd /Users/seanazulay/Desktop/StockBots/LumoTrade/ml-backend
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### "API key not set" warnings
```bash
# Optional: Set API keys for real data
export FMP_API_KEY="your_key"
export FRED_API_KEY="your_key"

# Tests work with cached data, so this is optional for initial testing
```

### Tests are too slow
```bash
# Use even smaller parameters
# Edit tests/test_2_small_training.py:
# Change: universe = ["SPY", "QQQ"] → universe = ["SPY"]
# Change: days=90 → days=60
```

### Model performance is bad
1. Check feature importance: are the right features being used?
2. Check data: are you getting enough samples?
3. Try tuning hyperparameters (see CODE_REVIEW_AND_IMPROVEMENTS.md)
4. Run with more data: test_3_medium_training.py

## Success Criteria

✅ **Test 1:** All modules import successfully
✅ **Test 2:** Training completes without errors, generates 150+ samples
✅ **Test 5:** Backtest runs and produces equity curve

🎯 **Production Goal:** Backtest achieves 60%+ CAGR, 2.0+ Sharpe

## Next Steps After Testing

If tests pass:
1. Review `CODE_REVIEW_AND_IMPROVEMENTS.md` for optimization tips
2. Run larger test: `python tests/test_3_medium_training.py`
3. Deploy to paper trading
4. Monitor live performance

If tests fail:
1. Check error messages carefully
2. Review logs in `logs/` directory
3. Consult `TESTING_GUIDE.md` for detailed troubleshooting
4. Check `CODE_REVIEW_AND_IMPROVEMENTS.md` for common issues

