# LumoTrade ML Backend

AI-powered market prediction engine combining LSTM neural networks with ChatGPT-5.1 analysis.

## 🎯 Features

- **Multi-Model Prediction**: Combines LSTM, ChatGPT-5.1, and sentiment analysis
- **Sentiment-First Approach**: Prioritizes news and social sentiment (60% weight)
- **Real-time Updates**: Predictions update every minute
- **Backtesting**: Test strategies on historical data
- **Accuracy Tracking**: Monitor model performance over time
- **100+ Technical Indicators**: Using pandas-ta (pure Python)

## 📋 Prerequisites

- Python 3.9 or higher
- pip package manager
- OpenAI API key (for ChatGPT-5.1)
- Market data API keys (Polygon, FMP, or Marketaux)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd ml-backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp config.example.env .env
# Edit .env and add your API keys
```

Required API keys:
- `OPENAI_API_KEY`: Get from https://platform.openai.com
- `FMP_API_KEY` or `POLYGON_API_KEY`: For market data
- `MARKETAUX_API_KEY`: For news sentiment

### 3. Train the Model (Optional)

```bash
python -m src.training.train
```

This will:
- Download 2 years of SPY data
- Calculate 100+ technical indicators
- Train LSTM model with attention
- Save to `models/best_model.pth`

Training takes ~30-60 minutes depending on hardware.

### 4. Start the API Server

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Server will be available at `http://localhost:8000`

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

### Generate Prediction
```bash
POST /api/predict
{
  "symbol": "SPY",
  "timeframe": "1h"
}
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
    "risks": [...],
    "sentiment_breakdown": {
      "news": 0.6,
      "social": 0.4
    }
  }
}
```

### Explain Prediction
```bash
POST /api/explain
{
  "symbol": "SPY",
  "question": "Why is the market bullish?"
}
```

### Run Backtest
```bash
POST /api/backtest
{
  "symbol": "SPY",
  "start_date": "2023-01-01",
  "end_date": "2024-01-01",
  "initial_capital": 10000,
  "strategy": "follow_prediction"
}
```

### Get Accuracy Metrics
```bash
GET /api/accuracy
```

## 🧠 Model Architecture

### Sentiment-First Weighting

The prediction engine uses a weighted fusion approach:

- **News Sentiment**: 35% (Marketaux API + keyword analysis)
- **Social Sentiment**: 25% (Twitter/Reddit mentions)
- **ChatGPT-5.1 Analysis**: 25% (LLM reasoning)
- **LSTM Technical**: 15% (Chart patterns + indicators)

### LSTM Model

- **Architecture**: 3-layer LSTM with attention
- **Input**: 60-step lookback window
- **Features**: 100+ technical indicators (RSI, MACD, Bollinger Bands, etc.)
- **Output**: Direction + magnitude + confidence

### ChatGPT-5.1 Integration

- **Model**: `chatgpt-5.1`
- **Role**: Analyze news impact, market context, and macro trends
- **Output**: Structured JSON with reasoning

## 📊 Technical Indicators

Using `pandas-ta` for pure Python indicator calculations:

**Momentum**: RSI (9, 14, 21, 30), MACD, Stochastic, Williams %R, CCI, ROC, MFI

**Trend**: SMA/EMA (20, 50, 200), ADX, DI+/DI-, Parabolic SAR

**Volatility**: Bollinger Bands, ATR, Historical Volatility

**Volume**: OBV, Accumulation/Distribution, Chaikin Oscillator

**Patterns**: Hammer, Inverted Hammer, Engulfing, Doji, Morning/Evening Star, Three White Soldiers/Black Crows

## 🎮 Usage Example

### Python

```python
from src.inference.prediction_engine import prediction_engine

# Generate prediction
prediction = await prediction_engine.generate_prediction(
    symbol="SPY",
    timeframe="1h"
)

print(f"Direction: {prediction['direction']}")
print(f"Confidence: {prediction['confidence']:.2%}")
print(f"Expected Move: {prediction['expected_move_percent']:.2f}%")
```

### Frontend (React)

```typescript
const { data } = useQuery({
  queryKey: ['prediction'],
  queryFn: async () => {
    const res = await fetch('http://localhost:8000/api/predict', {
      method: 'POST',
      body: JSON.stringify({ symbol: 'SPY', timeframe: '1h' })
    });
    return res.json();
  },
  refetchInterval: 60000 // Update every minute
});
```

## 🧪 Testing

### Run All Tests
```bash
pytest tests/
```

### Test Specific Component
```bash
pytest tests/test_prediction_engine.py -v
```

## 📈 Monitoring

### View Accuracy Metrics

```bash
curl http://localhost:8000/api/accuracy
```

### Logs

Logs are saved to `logs/ml-backend.log`

## 🐳 Docker Deployment

```bash
docker build -t lumotrade-ml .
docker run -p 8000:8000 --env-file .env lumotrade-ml
```

## ⚙️ Configuration

Edit `.env` to customize:

```bash
# Sentiment weights (must sum to 1.0)
NEWS_SENTIMENT_WEIGHT=0.35
SOCIAL_SENTIMENT_WEIGHT=0.25
GPT_WEIGHT=0.25
LSTM_WEIGHT=0.15

# Update intervals
PREDICTION_UPDATE_INTERVAL=60  # seconds
CACHE_TTL=300  # seconds

# Model paths
MODEL_PATH=models/best_model.pth
SCALER_PATH=models/scaler.pkl
```

## 🔧 Troubleshooting

### Model not loading
- Ensure you've run training: `python -m src.training.train`
- Check model files exist: `ls models/`

### API errors
- Verify API keys in `.env`
- Check API rate limits
- Review logs: `tail -f logs/ml-backend.log`

### Poor predictions
- Retrain model with more recent data
- Adjust sentiment weights in `.env`
- Increase news data sources

## 📚 Documentation

- [Full Setup Guide](../ML_BACKEND_SETUP.md)
- [Implementation Summary](../IMPLEMENTATION_SUMMARY.md)
- [Sentiment Update Details](../SENTIMENT_FIRST_UPDATE.md)

## 💡 Tips

1. **Run training weekly** to keep model fresh with recent patterns
2. **Monitor accuracy metrics** to detect drift
3. **Adjust sentiment weights** based on market conditions
4. **Use backtesting** to validate strategy before live trading

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues or questions:
- Open a GitHub issue
- Check documentation
- Review logs for error messages

---

Built with ❤️ using Python, PyTorch, FastAPI, and ChatGPT-5.1

