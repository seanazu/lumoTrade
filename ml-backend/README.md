# LumoTrade ML Backend

AI-powered market prediction engine combining LightGBM, ChatGPT-5 social sentiment, and multi-source news analysis.

## 🎯 Features

- **Hybrid Prediction**: LightGBM + ChatGPT-5 + Multi-source news sentiment
- **Multi-Horizon Forecasts**: 1h, 4h, 10h, 1d, 3d, 5d predictions
- **Real-time Social Sentiment**: ChatGPT-5 web search for X/Twitter, Reddit, StockTwits
- **Multi-Source News**: FMP, Marketaux, Polygon (100-150 articles per analysis)
- **Continuous Learning**: Models improve over time, never reset
- **150+ Technical Indicators**: RSI, MACD, Bollinger Bands, etc.

## 📋 Prerequisites

- Python 3.9+
- OpenAI API key (ChatGPT-5)
- Polygon, FMP, Marketaux API keys

## 🚀 Quick Start

### 1. Install
```bash
cd ml-backend
pip install -r requirements.txt
```

### 2. Configure
```bash
cp config.example.env .env
# Add your API keys to .env
```

### 3. Start
```bash
uvicorn app:app --reload
```

Server runs at `http://localhost:8000`

## 📡 API Endpoints

### Generate Prediction
```bash
POST /api/predict
{
  "symbol": "SPY",
  "debug": true,
  "horizons": ["1h", "4h", "1d", "3d", "5d"]
}
```

Response includes:
- 6 horizon predictions (direction, return, confidence, range)
- Key factors driving prediction
- News sentiment (100-150 articles)
- Social sentiment (ChatGPT-5 web search)
- Technical indicators
- VIX and macro data

### Continuous Learning
```bash
GET /api/learning/performance      # Get accuracy metrics
POST /api/learning/record-outcome  # Record actual outcome
POST /api/learning/retrain         # Trigger retraining
POST /api/learning/auto-retrain    # Check if retrain needed
```

### Market Direction Sentiment
```bash
POST /api/market-direction
{
  "index": "SPX",
  "horizon": "T+1",
  "cutoff_minutes": 30
}
```

## 🧠 How It Works

### 1. Data Collection
- **Market Data**: Real-time prices from Polygon/FMP
- **News**: 100-150 articles from FMP, Marketaux, Polygon
- **Social**: ChatGPT-5 searches X/Twitter, Reddit, StockTwits
- **Technical**: 150+ indicators (RSI, MACD, etc.)
- **Macro**: VIX, treasury yields

### 2. Feature Engineering
- **News Features**: Sentiment, importance, macro events (high weight)
- **Price Features**: Returns, volatility, momentum
- **Cross-Asset**: VIX, yields, DXY, gold, oil
- **Breadth**: Constituent analysis
- **Macro Calendar**: FOMC, CPI, NFP

### 3. Prediction
- **LightGBM**: Tabular ML on 150+ features
- **ChatGPT-5**: Social sentiment + qualitative analysis
- **Fusion**: Weighted combination of all signals

### 4. Continuous Learning
- **Auto-record**: Every prediction saved
- **Validation**: Outcomes checked hourly
- **Tracking**: Accuracy by horizon/symbol
- **Auto-retrain**: When accuracy drops or 7 days pass

## 🎮 Usage Example

### Python
```python
from src.inference.prediction_engine_hybrid import PredictionEngineHybrid

engine = PredictionEngineHybrid()
prediction = await engine.generate_prediction(
    symbol="SPY",
    horizons=["1h", "1d", "5d"],
    debug=True
)

print(f"1h: {prediction['horizons']['1h']['direction']} ({prediction['horizons']['1h']['confidence']:.0%})")
print(f"1d: {prediction['horizons']['1d']['direction']} ({prediction['horizons']['1d']['confidence']:.0%})")
```

### Frontend (React)
```typescript
const { data } = useQuery({
  queryKey: ['prediction'],
  queryFn: async () => {
    const res = await fetch('http://localhost:8000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: 'SPY', debug: true })
    });
    return res.json();
  },
  refetchInterval: 60000 // Update every minute
});
```

## 🔧 Configuration

Edit `.env`:

```bash
# API Keys
OPENAI_API_KEY=sk-...
POLYGON_API_KEY=...
FMP_API_KEY=...
MARKETAUX_API_KEY=...

# Optional: InstantDB for persistent learning
INSTANT_APP_ID=...
INSTANT_ADMIN_TOKEN=...

# Model Settings
LIGHTGBM_LEARNING_RATE=0.05
LIGHTGBM_NUM_LEAVES=31
LIGHTGBM_MAX_DEPTH=6
```

## 📊 Continuous Learning

### How It Works
1. **Auto-Record**: Every prediction is saved with timestamp
2. **Hourly Validation**: System checks if predictions can be validated
3. **Accuracy Tracking**: Monitors performance by horizon/symbol
4. **Auto-Retrain**: Triggers when:
   - Accuracy < 50%
   - 7 days since last retrain
   - 100+ new validated predictions

### Setup Cron Jobs (Optional)
```bash
# Hourly outcome validation
0 * * * * cd /path/to/ml-backend && python scripts/continuous_learning_cron.py --validate-outcomes

# Daily auto-retrain check
0 2 * * * cd /path/to/ml-backend && python scripts/continuous_learning_cron.py --auto-retrain
```

### Storage
- **Local**: `data/learning_history/` (default)
- **InstantDB**: Cloud storage (optional, set `INSTANT_APP_ID`)

## 🧪 Training Models

### Train LightGBM
```bash
python -m src.training.train_lightgbm
```

This will:
- Fetch 2 years of data for SPY, QQQ, IWM
- Calculate features
- Train models for each index and horizon
- Save to `models/lightgbm/`

Training takes ~30-60 minutes.

### Note on Mock Predictions
If no trained models exist, the system uses **feature-based predictions** (not random). These are derived from:
- News sentiment
- Price momentum
- VIX levels
- Technical indicators

For best accuracy, train models first!

## 🐛 Troubleshooting

### No predictions showing
- Check API keys in `.env`
- Restart backend: `uvicorn app:app --reload`
- Check logs for errors

### News sources failing
- Verify API keys are valid
- Check rate limits on provider dashboards
- Ensure timezone handling is correct

### ChatGPT-5 not working
- Verify `OPENAI_API_KEY` is set
- Check OpenAI API status
- Review logs for error messages

### Poor accuracy
- Train LightGBM models
- Wait for continuous learning to accumulate data
- Check if market conditions changed significantly

## 📚 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Prediction Engine                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Data       │  │  Feature     │  │  LightGBM    │     │
│  │   Loader     │→ │  Engineering │→ │  Predictor   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                              ↓              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Market     │  │   ChatGPT-5  │  │   Fusion     │     │
│  │   Direction  │→ │   Social     │→ │   Layer      │     │
│  │   Sentiment  │  │   Sentiment  │  └──────────────┘     │
│  └──────────────┘  └──────────────┘         ↓              │
│                                       ┌──────────────┐      │
│                                       │  Continuous  │      │
│                                       │  Learner     │      │
│                                       └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 💡 Tips

1. **Train models weekly** for best accuracy
2. **Monitor learning metrics** via `/api/learning/performance`
3. **Use InstantDB** for multi-server deployments
4. **Enable debug mode** to see full pipeline details
5. **Check news sources** if predictions seem off

## 🆘 Support

- Check `logs/` for error messages
- Review API responses with `debug: true`
- Ensure all API keys are valid
- Verify Python dependencies are installed

---

Built with ❤️ using Python, LightGBM, FastAPI, and ChatGPT-5
