# Dashboard Quick Start Guide

## 🚀 Getting Started

### 1. Start the Backend

The ml-backend should already be running on port 8000. If not, start it:

```bash
cd ml-backend
uvicorn app:app --reload
```

Verify it's running:
```bash
curl http://localhost:8000/health
```

### 2. Start the Frontend

```bash
# From project root
npm run dev
```

The frontend will be available at: http://localhost:3000

### 3. Navigate to Model Monitor

Open your browser and go to:
```
http://localhost:3000/model-monitor
```

---

## 🎯 Testing Each Feature

### ✅ Tomorrow's Prediction

1. **Select an Index:**
   - Click on "SPY S&P 500", "QQQ Nasdaq 100", or "DIA Dow Jones" tabs

2. **Generate Prediction:**
   - Click the "Generate New Prediction" button
   - Wait for the prediction to load (shows spinner)
   
3. **What to Look For:**
   - ✓ Direction indicator (Bullish/Bearish/Neutral) with large icon
   - ✓ Circular confidence meter showing percentage
   - ✓ Expected move percentage (large number)
   - ✓ Probability distribution bell curve
   - ✓ Key factors list with importance bars
   - ✓ Warning if confidence is below 60%

---

### ✅ Backtesting

1. **Navigate to Backtesting Tab:**
   - Click "Backtesting" in the navigation

2. **Configure Backtest:**
   - Set start date (e.g., 3 months ago)
   - Set end date (today)
   - Adjust confidence threshold slider (50-90%)
   - Adjust Kelly fraction slider (10-50%)

3. **Run Backtest:**
   - Click "Run Backtest" button
   - Wait for simulation to complete

4. **What to Look For:**
   - ✓ Two equity curve charts (blue and green)
   - ✓ Metrics cards showing returns, win rate, Sharpe ratio, etc.
   - ✓ Comparative analysis showing which strategy performed better
   - ✓ Trade log tables (click "Show Trade Log")
   
5. **Expected Results:**
   - Charts should show portfolio growth over time
   - Metrics should be calculated (may show mock data initially)
   - Better strategy highlighted in blue or green

---

### ✅ Model Training

1. **Navigate to Model Training Tab:**
   - Click "Model Training" in the navigation

2. **Check Model Status:**
   - View 6 horizon cards (1h, 4h, 10h, 1d, 3d, 5d)
   - Green checkmark = model exists
   - Red X = model not trained yet

3. **Trigger Training (Optional):**
   - Select index (SPX/NDX/DJI)
   - Adjust lookback period slider
   - Click "Start Training"
   
4. **Monitor Progress:**
   - Watch progress bar fill up
   - See estimated time remaining
   - Status changes: Starting → Running → Completed
   
5. **What to Look For:**
   - ✓ Model status cards with file sizes and dates
   - ✓ Real-time progress updates every 2-3 seconds
   - ✓ Training history showing past runs
   
**Note:** Training can take several minutes depending on data size.

---

### ✅ Accuracy Analytics

1. **Navigate to Accuracy Analytics Tab:**
   - Click "Accuracy Analytics" in the navigation

2. **What to Look For:**
   - ✓ Summary cards (Total Predictions, Overall Accuracy, Period)
   - ✓ Accuracy trend line chart over time
   - ✓ Accuracy by horizon cards (color-coded green/yellow/red)
   - ✓ Confidence calibration chart (expected vs actual)
   - ✓ Prediction vs actual scatter plot
   - ✓ Error analysis metrics
   
3. **Expected Results:**
   - If no predictions logged yet, will show "No data available"
   - After generating predictions, accuracy data accumulates over time
   - Charts become more meaningful with more data points

---

## 🎨 Visual Features to Verify

### Index Selector
- [x] Three tabs at top: SPY, QQQ, DIA
- [x] Active tab has colored background and border
- [x] Smooth animation when switching tabs
- [x] Each index has different color theme

### Navigation Tabs
- [x] Four tabs: Tomorrow's Prediction, Backtesting, Model Training, Accuracy Analytics
- [x] Active tab has colored underline
- [x] Icons next to each label
- [x] Smooth transitions between sections

### Color Themes
- [x] **Blue** - S&P 500 (SPX)
- [x] **Green** - Nasdaq 100 (NDX)
- [x] **Purple** - Dow Jones (DJI)
- [x] Consistent color usage throughout dashboard

### Animations
- [x] Tab switching fades in/out
- [x] Progress bars animate smoothly
- [x] Confidence meter animates on load
- [x] Charts render with transitions

---

## 🔍 Troubleshooting

### Backend Not Responding
```bash
# Check if backend is running
curl http://localhost:8000/health

# Restart backend
cd ml-backend
lsof -ti:8000 | xargs kill -9
uvicorn app:app --reload
```

### Frontend Not Loading
```bash
# Check if frontend is running
curl http://localhost:3000

# Restart frontend
# Ctrl+C to stop, then:
npm run dev
```

### Predictions Not Generating
1. Check backend logs for errors
2. Verify models are trained (Model Training tab)
3. Check API endpoint: `http://localhost:8000/api/predict`
4. Look for errors in browser console (F12)

### Charts Not Displaying
1. Check browser console for errors
2. Verify recharts is installed: `npm list recharts`
3. Clear browser cache and refresh
4. Check if data is being fetched (Network tab in DevTools)

---

## 📊 Test Sequence

Run through this complete test sequence to verify everything works:

1. **[2 min] Index Selector Test:**
   - Switch between all 3 indices
   - Verify color theme changes
   - Verify smooth animations

2. **[5 min] Prediction Test:**
   - Generate predictions for all 3 indices
   - Verify direction, confidence, and expected move
   - Check probability distribution chart
   - Review key factors

3. **[10 min] Backtest Test:**
   - Run backtest with default parameters
   - Compare both strategies
   - View trade logs
   - Adjust parameters and rerun

4. **[3 min] Training Status Test:**
   - Check model status for all horizons
   - View training history
   - (Optional) Trigger new training

5. **[5 min] Accuracy Test:**
   - Review all charts and metrics
   - Check if data is available
   - Verify calculations make sense

**Total Test Time: ~25 minutes**

---

## 💡 Pro Tips

1. **Best Performance:**
   - Use Chrome or Edge for best chart rendering
   - Close other tabs to free up memory
   - Enable hardware acceleration in browser

2. **Data Generation:**
   - Generate predictions regularly to build accuracy history
   - Run backtests with different parameters to compare
   - Train models on different date ranges

3. **Interpretation:**
   - High confidence (>70%) predictions are more reliable
   - Kelly Criterion often outperforms fixed thresholds
   - Watch for confidence calibration accuracy
   - Sharpe ratio > 1.0 is good, > 2.0 is excellent

4. **Customization:**
   - Backtest date ranges can be adjusted
   - Training lookback can be 30 days to 5 years
   - Accuracy charts support 30 or 90 day views

---

## 🎯 Success Criteria

You'll know the dashboard is working perfectly when:

- ✅ All 3 indices can be selected and generate predictions
- ✅ Charts render smoothly without lag
- ✅ Backtests complete and show meaningful results
- ✅ Training status shows accurate model information
- ✅ No errors in browser console or backend logs
- ✅ Colors are consistent and professional-looking
- ✅ Loading states appear during data fetching
- ✅ Error messages are clear if something fails

---

## 🎉 Next Steps

Once you've verified everything works:

1. **Generate Real Predictions:**
   - Use the dashboard daily to make predictions
   - Build up accuracy history over time

2. **Backtest Strategies:**
   - Test different confidence thresholds
   - Optimize Kelly fraction
   - Compare performance across indices

3. **Train Models:**
   - Retrain periodically with new data
   - Experiment with different lookback periods
   - Monitor training progress

4. **Track Accuracy:**
   - Log predictions and verify outcomes
   - Analyze which horizons perform best
   - Check if confidence scores are calibrated

5. **Make Trading Decisions:**
   - Use high-confidence predictions for entries
   - Consider backtest results for position sizing
   - Monitor accuracy trends before trusting new predictions

---

## 📞 Need Help?

If you encounter issues:

1. Check `DASHBOARD_IMPLEMENTATION_SUMMARY.md` for technical details
2. Review backend logs: `ml-backend/logs/`
3. Check browser console (F12 → Console tab)
4. Verify all dependencies are installed
5. Make sure backend and frontend are both running

---

**Happy Trading! 🚀📈**

*Remember: This is a powerful tool, but always do your own research and risk management before making real trades.*

