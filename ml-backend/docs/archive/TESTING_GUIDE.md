# LumoTrade ML Testing Guide

## Quick Environment Fix

If you're experiencing Python crashes (segfault/exit code 139), try:

```bash
# Reinstall numpy and pandas (binary incompatibility)
pip uninstall numpy pandas lightgbm -y
pip install numpy pandas lightgbm --no-cache-dir

# Or recreate virtual environment
deactivate
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Test Suite Overview

### Test 1: Validation (Quick - 30 seconds)
Tests module imports, dependencies, and basic functionality.

```bash
python tests/test_1_validation.py
```

**Expected Output:**
- ✓ All dependencies installed
- ✓ API keys checked
- ✓ All V2 modules import successfully  
- ✓ Basic feature generation works

### Test 2: Small Training Run (Medium - 5-10 minutes)
Trains on 2 tickers, 3 months, daily data.

```bash
python tests/test_2_small_training.py
```

**Expected Output:**
- ~180 training samples (2 tickers × 90 days)
- ~230 features generated
- 2-3 walk-forward folds
- MAE < 2.0% (rough predictions expected)
- Saves models to `data/models/test/`

### Test 3: Medium Training Run (Long - 30-60 minutes)
Trains on 3 tickers, 1 year, 5-minute data.

```bash
python tests/test_3_medium_training.py
```

**Expected Output:**
- ~30,000 training samples (3 tickers × 10K bars each)
- ~235 features
- 3-4 walk-forward folds
- MAE < 1.5%
- Direction accuracy > 52%

### Test 4: Full Production Run (Very Long - 4-6 hours)
Trains on 7 tickers, 3 years, 5-minute data.

```bash
python tests/test_4_full_training.py
```

**Expected Output:**
- ~200,000+ training samples
- ~235 features
- 4-6 walk-forward folds
- Target metrics:
  - MAE < 1.2%
  - Direction accuracy > 55%
  - Coverage (P10-P90) > 75%

### Test 5: Backtest Validation (Medium - 10-20 minutes)
Runs backtest on trained models.

```bash
python tests/test_5_backtest.py
```

**Expected Output:**
- Equity curve generated
- Metrics:
  - **Target CAGR: 60%+**
  - **Target Sharpe: 2.0+**
  - **Target Max DD: < 20%**
- Full report in `data/backtests/latest/`

### Test 6: Prediction API (Quick - 10 seconds)
Tests real-time prediction endpoint.

```bash
python tests/test_6_prediction_api.py
```

**Expected Output:**
```json
{
  "ticker": "SPY",
  "predictions": {
    "1h": {"p10": -0.3, "p50": 0.5, "p90": 1.2},
    "5h": {"p10": -0.8, "p50": 1.1, "p90": 2.9},
    "20h": {"p10": -2.1, "p50": 2.3, "p90": 6.5}
  },
  "position_recommended": 0.65,
  "confidence": "high"
}
```

## Performance Benchmarks

### Minimum Acceptable (Small Test)
- Training time: < 10 min
- MAE: < 2.5%
- Direction accuracy: > 50%

### Good Performance (Medium Test)
- Training time: < 60 min
- MAE: < 1.5%
- Direction accuracy: > 53%
- Sharpe: > 1.0

### Production Target (Full Test)
- Training time: < 6 hours
- MAE: < 1.2%
- Direction accuracy: > 55%
- **CAGR: 60%+**
- **Sharpe: 2.0+**
- **Max DD: < 20%**

## Troubleshooting

### Issue: "No API key" errors
**Solution:** Tests work with cached data. For full runs, set:
```bash
export FMP_API_KEY="your_key_here"
export FRED_API_KEY="your_key_here"
```

### Issue: Low performance (CAGR < 60%)
**Check:**
1. Feature importance: Are news/VIX features used?
2. Training data: Are you getting 100K+ samples?
3. Hyperparameters: Try adjusting in `src/models_v2/quantile_regressor.py`
4. Feature boosting: Adjust NEWS_BOOST, VIX_BOOST in `feature_utils.py`

### Issue: Overfitting (train metrics >> test metrics)
**Solutions:**
1. Increase `min_child_samples` in LightGBM
2. Reduce `num_leaves`
3. Add more walk-forward folds
4. Use more regularization (lambda_l1, lambda_l2)

### Issue: Training too slow
**Solutions:**
1. Reduce universe size (7 → 3 tickers)
2. Use daily data instead of 5-minute
3. Reduce training window (3 years → 1 year)
4. Use fewer quantiles (7 → 3)

## Next Steps After Testing

1. **If CAGR < 60%:**
   - Analyze feature importance
   - Add more interaction features
   - Tune hyperparameters
   - Collect more historical news data

2. **If CAGR 60-80%:**
   - Deploy to paper trading
   - Monitor live accuracy
   - Set up retraining schedule

3. **If CAGR > 80%:**
   - Double-check for overfitting
   - Run on different time periods
   - Add ChatGPT ensemble (Phase 6)

## Continuous Improvement

Monitor these metrics weekly:
- **Prediction accuracy** (vs actual returns)
- **Sharpe ratio degradation** (is model aging?)
- **Feature drift** (are features changing distribution?)
- **Trade execution** (slippage, fills)

Retrain when:
- Sharpe drops below 1.5
- Prediction MAE increases > 20%
- Major market regime change

## Support

For issues or questions:
1. Check `NEXT_STEPS.md` for API setup
2. Review `IMPLEMENTATION_COMPLETE.md` for architecture
3. Check logs in `logs/training/` and `logs/backtesting/`

