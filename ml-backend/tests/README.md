# ML Backend Test Suite

## Quick Start

```bash
# 1. Make sure you're in ml-backend directory
cd /Users/seanazulay/Desktop/StockBots/LumoTrade/ml-backend

# 2. Fix Python environment if needed (exit code 139 errors)
pip uninstall numpy pandas lightgbm -y
pip install numpy pandas lightgbm --no-cache-dir

# 3. Run validation test (30 seconds)
python tests/test_1_validation.py

# 4. Run small training test (5-10 minutes)
python tests/test_2_small_training.py
```

## Available Tests

### ✅ test_1_validation.py (30 seconds)
**Purpose:** Validate environment setup
**Checks:**
- Core dependencies (pandas, numpy, lightgbm, sklearn, yfinance, ta)
- API keys (FMP, FRED)
- All V2 module imports
- Model initialization

**Run:** `python tests/test_1_validation.py`

**Expected:** All green checkmarks, "VALIDATION PASSED"

---

### ✅ test_2_small_training.py (5-10 minutes)
**Purpose:** Quick end-to-end training test
**Configuration:**
- 2 tickers (SPY, QQQ)
- 3 months of data
- Daily interval
- 2 horizons (1d, 5d)

**Run:** `python tests/test_2_small_training.py`

**Expected Results:**
- ~180 training samples (2 tickers × 90 days)
- ~230 features
- MAE < 3.0%
- Direction Accuracy > 50%
- Coverage (P10-P90) > 60%

**Output:** `data/test_results/small_training_results.json`

---

### ⏳ test_3_medium_training.py (30-60 minutes) [To Be Created]
**Purpose:** Medium-scale training validation
**Configuration:**
- 3 tickers (SPY, QQQ, DIA)
- 1 year of data
- 5-minute interval
- 3 horizons (1h, 5h, 20h)

**Expected Results:**
- ~30,000 training samples
- ~235 features
- MAE < 1.5%
- Direction Accuracy > 53%

---

### ⏳ test_4_full_training.py (4-6 hours) [To Be Created]
**Purpose:** Production-scale training
**Configuration:**
- 7 tickers (SPY, QQQ, DIA, XLK, XLF, XLV, IWM)
- 3 years of data
- 5-minute interval
- 3 horizons (1h, 5h, 20h)

**Expected Results:**
- ~200,000+ training samples
- ~235 features
- MAE < 1.2%
- Direction Accuracy > 55%

**Target Metrics:**
- **CAGR: 60%+**
- **Sharpe: 2.0+**
- **Max DD: < 20%**

---

### ⏳ test_5_backtest.py (10-20 minutes) [To Be Created]
**Purpose:** Validate trading strategy
**Requires:** Trained models from test_2, test_3, or test_4

**Checks:**
- Equity curve generation
- Sharpe ratio, CAGR, Max DD
- Win rate, profit factor
- Transaction costs
- Position sizing

**Run:** `python tests/test_5_backtest.py`

---

### ⏳ test_6_prediction_api.py (10 seconds) [To Be Created]
**Purpose:** Test real-time prediction
**Checks:**
- Prediction latency < 200ms
- Quantile predictions (P10, P50, P90)
- Direction probability
- Position recommendation

**Run:** `python tests/test_6_prediction_api.py`

---

## Troubleshooting

### "Exit code 139" (Segmentation Fault)
**Cause:** Binary library incompatibility

**Fix:**
```bash
pip uninstall numpy pandas lightgbm -y
pip install numpy pandas lightgbm --no-cache-dir
```

Or recreate environment:
```bash
deactivate
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### "No module named 'src'"
**Fix:**
```bash
cd /Users/seanazulay/Desktop/StockBots/LumoTrade/ml-backend
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### "API key not set" warnings
**Note:** Tests work with cached data. API keys are optional for initial testing.

**To set keys:**
```bash
export FMP_API_KEY="your_key"
export FRED_API_KEY="your_key"
```

### Test fails with errors
1. Check error message carefully
2. Run test_1_validation.py first
3. Review logs in `logs/` directory
4. Consult `../TESTING_GUIDE.md`

### Poor model performance
1. Check `data/test_results/` for detailed metrics
2. Review feature importance
3. Try tuning hyperparameters (see `../CODE_REVIEW_AND_IMPROVEMENTS.md`)
4. Use more training data (test_3 or test_4)

---

## Test Results

Results are saved to:
- `data/test_results/small_training_results.json`
- `data/test_results/medium_training_results.json`
- `data/test_results/full_training_results.json`
- `data/backtests/latest/backtest_results.json`

View results:
```bash
cat data/test_results/small_training_results.json | python -m json.tool
```

---

## Success Criteria

### Test 1 (Validation)
- ✅ All modules import successfully
- ✅ No critical errors

### Test 2 (Small Training)
- ✅ Training completes without errors
- ✅ Generates 150+ samples
- ✅ MAE < 3.0%
- ✅ Direction accuracy > 50%

### Test 5 (Backtest)
- ✅ Equity curve generated
- ✅ Sharpe > 1.0 (for small test)
- 🎯 **Sharpe > 2.0 (for full test)**
- 🎯 **CAGR > 60% (production target)**

---

## Documentation

For more details, see:
- `../RUN_TESTS.md` - Quick start guide
- `../TESTING_GUIDE.md` - Comprehensive testing docs
- `../CODE_REVIEW_AND_IMPROVEMENTS.md` - Code improvements
- `../MODEL_TEST_RESULTS.md` - Performance predictions
- `../TEST_AND_REVIEW_SUMMARY.md` - Complete summary

