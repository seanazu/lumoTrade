# 🚀 LumoTrade Quick Start Guide

## ✅ What's Been Set Up

All prediction model code has been successfully restored and configured:

### Backend Components
- ✅ FastAPI server (`ml-backend/app.py`)
- ✅ LSTM model with attention (`src/models/lstm_predictor.py`)
- ✅ Feature engineering with 100+ indicators (`src/data/feature_engineering.py`)
- ✅ ChatGPT-5.1 market analyst (`src/llm/market_analyst.py`)
- ✅ News sentiment analyzer (`src/sentiment/news_sentiment.py`)
- ✅ Social sentiment tracker (`src/sentiment/social_sentiment.py`)
- ✅ Prediction fusion engine (`src/inference/prediction_engine.py`)
- ✅ Backtesting system (`src/backtesting/backtest_engine.py`)
- ✅ Accuracy tracking (`src/monitoring/accuracy_tracker.py`)

### Frontend Components
- ✅ Live prediction UI (`src/components/modules/prediction/LivePredictionSection.tsx`)
- ✅ Backtest dashboard (`src/components/modules/prediction/BacktestDashboard.tsx`)
- ✅ Main page integration (`src/app/page.tsx`)

### Dependencies
- ✅ All Python packages installed (using `ta` library for indicators)
- ✅ PyTorch, FastAPI, OpenAI SDK, and all required libraries

## 🎯 Next Steps

### 1. Configure API Keys

Edit `ml-backend/.env` (or create it from `config.example.env`):

```bash
# Required
OPENAI_API_KEY=sk-your-openai-key-here

# At least one data provider (you already have these)
FMP_API_KEY=your-fmp-key
POLYGON_API_KEY=your-polygon-key
MARKETAUX_API_KEY=your-marketaux-key
```

### 2. Start the ML Backend

```bash
cd ml-backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The server will start at `http://localhost:8000`

### 3. Test the API

Open your browser to `http://localhost:8000` - you should see:
```json
{
  "service": "LumoTrade ML Backend",
  "status": "running",
  "version": "1.0.0"
}
```

### 4. Start the Frontend

In a new terminal:

```bash
npm run dev
```

Visit `http://localhost:3000` - you'll see the live prediction section!

## 📊 How It Works

### Prediction Model Architecture

The model uses a **sentiment-first approach**:

```
┌─────────────────────────────────────────┐
│     Data Sources                        │
├─────────────────────────────────────────┤
│  • Market Data (FMP/Polygon)            │
│  • News (Marketaux)                     │
│  • Social Media (Twitter/Reddit)        │
│  • Technical Indicators (100+)          │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│     Prediction Components               │
├─────────────────────────────────────────┤
│  • News Sentiment: 35%                  │
│  • Social Sentiment: 25%                │
│  • ChatGPT-5.1 Analysis: 25%            │
│  • LSTM Technical: 15%                  │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│     Fusion Layer                        │
├─────────────────────────────────────────┤
│  Weighted combination with confidence   │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│     Final Prediction                    │
├─────────────────────────────────────────┤
│  • Direction (bullish/bearish/neutral)  │
│  • Confidence (0-1)                     │
│  • Expected Move (%)                    │
│  • Key Factors                          │
│  • Risks                                │
└─────────────────────────────────────────┘
```

## 🧪 Testing the Prediction API

### Generate a Prediction

```bash
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"symbol": "SPY", "timeframe": "1h"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "direction": "bullish",
    "confidence": 0.75,
    "expected_move_percent": 1.2,
    "key_factors": [...],
    "sentiment_breakdown": {
      "news": 0.6,
      "social": 0.4
    }
  }
}
```

### Run a Backtest

```bash
curl -X POST http://localhost:8000/api/backtest \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "SPY",
    "start_date": "2023-01-01",
    "end_date": "2024-01-01",
    "initial_capital": 10000,
    "strategy": "follow_prediction"
  }'
```

## 🎓 Training the Model (Optional)

The model can work without training (using only ChatGPT-5.1 and sentiment), but for best results:

```bash
cd ml-backend
python -m src.training.train
```

This will:
1. Download 2 years of SPY historical data
2. Calculate 100+ technical indicators
3. Train LSTM model with attention
4. Save to `models/best_model.pth`

Training takes ~30-60 minutes.

## 🔧 Troubleshooting

### ML Backend Not Starting

**Error**: `ModuleNotFoundError: No module named 'ta'`
**Fix**: Run `pip install -r requirements.txt` in `ml-backend/`

**Error**: `OPENAI_API_KEY not set`
**Fix**: Add your OpenAI API key to `ml-backend/.env`

### Frontend Not Showing Predictions

**Error**: "ML backend is not running"
**Fix**: Make sure the ML backend is running on port 8000

**Error**: "Failed to fetch prediction"
**Fix**: Check CORS settings in `ml-backend/app.py` - should allow `http://localhost:3000`

### Predictions Are Low Quality

**Solution 1**: Train the LSTM model with recent data
```bash
python -m src.training.train
```

**Solution 2**: Adjust sentiment weights in `.env`:
```bash
NEWS_SENTIMENT_WEIGHT=0.40  # Increase news weight
SOCIAL_SENTIMENT_WEIGHT=0.20
GPT_WEIGHT=0.30
LSTM_WEIGHT=0.10
```

**Solution 3**: Ensure API keys are configured for news data

## 📚 Documentation

- **Full Setup Guide**: `ML_BACKEND_SETUP.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **Sentiment Update**: `SENTIMENT_FIRST_UPDATE.md`
- **ML Backend README**: `ml-backend/README.md`

## 🎯 Key Features

✅ **Real-time Predictions**: Updates every 60 seconds  
✅ **Sentiment-First**: Prioritizes news and social sentiment  
✅ **ChatGPT-5.1**: Advanced LLM reasoning  
✅ **100+ Indicators**: RSI, MACD, Bollinger Bands, and more  
✅ **Backtesting**: Test strategies on historical data  
✅ **Accuracy Tracking**: Monitor model performance  
✅ **Interactive UI**: Beautiful React components  

## 💡 Usage Tips

1. **Start with news-heavy markets**: The model performs best when there's significant news flow
2. **Monitor confidence scores**: Higher confidence = more reliable predictions
3. **Use backtesting**: Validate strategies before relying on them
4. **Track accuracy**: Check `/api/accuracy` regularly to see model performance
5. **Adjust weights**: Tune sentiment weights based on market conditions

## 🆘 Need Help?

- Check the logs: `ml-backend/logs/ml-backend.log`
- Review API documentation: `http://localhost:8000/docs` (FastAPI auto-docs)
- Read the implementation summary: `IMPLEMENTATION_SUMMARY.md`

---

**You're all set!** 🎉

Start the ML backend, start the frontend, and watch the AI predictions in action!
