# LumoTrade ML Backend - Complete Setup Guide

## 🎯 Overview

The ML Backend is a production-grade Python service that provides:

- **Advanced LSTM predictions** using PyTorch with attention mechanism
- **ChatGPT-5.1 market analysis** for enhanced reasoning
- **Real-time predictions** updated every minute
- **Comprehensive backtesting** with strategy optimization
- **Model performance tracking** with accuracy metrics

---

## 📦 Architecture

```
ml-backend/
├── app.py                         # FastAPI server
├── requirements.txt              # Python dependencies
├── Dockerfile                    # Container configuration
├── src/
│   ├── data/
│   │   ├── data_loader.py       # Fetches market data from APIs
│   │   └── feature_engineering.py  # 100+ technical indicators
│   ├── models/
│   │   └── lstm_predictor.py    # PyTorch LSTM with attention
│   ├── training/
│   │   └── train.py             # Model training script
│   ├── inference/
│   │   └── prediction_engine.py # Real-time prediction engine
│   ├── llm/
│   │   └── market_analyst.py    # ChatGPT-5.1 integration
│   ├── backtesting/
│   │   └── backtest_engine.py   # Strategy testing
│   └── monitoring/
│       └── accuracy_tracker.py   # Performance tracking
└── models/                       # Trained model weights
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd ml-backend
pip install -r requirements.txt
```

**Note**: All indicators now use `pandas-ta`, so no native TA-Lib installation is required.

### 2. Configure Environment

Create `.env` file in `ml-backend/` directory:

```bash
# Copy the example
cp config.example.env .env
```

Edit `.env` and add your API keys:

```env
# API Keys (required)
FMP_API_KEY=your_fmp_key_here
POLYGON_API_KEY=your_polygon_key_here
MARKETAUX_API_KEY=your_marketaux_key_here
OPENAI_API_KEY=your_openai_key_here

# Database (optional - not required for basic operation)
DATABASE_URL=postgresql://user:password@localhost:5432/lumotrade
REDIS_URL=redis://localhost:6379

# MLflow (optional - for experiment tracking)
MLFLOW_TRACKING_URI=http://localhost:5000

# Server
PORT=8000
ENVIRONMENT=development
```

### 3. Start the ML Backend

```bash
# Development mode
python app.py
```

The server will start on `http://localhost:8000`

### 4. Update Next.js Configuration

Add the ML backend URL to your Next.js `.env.local`:

```env
NEXT_PUBLIC_ML_BACKEND_URL=http://localhost:8000
```

### 5. Verify Connection

Visit the following in your browser:

- **Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs (FastAPI auto-generated)

---

## 🎓 Training the Model

### Option 1: Use Pre-trained Model (Recommended for Testing)

The system will work without a trained model by using ChatGPT-5.1 predictions only.

### Option 2: Train Your Own Model

```bash
cd ml-backend
python src/training/train.py
```

**Training Configuration:**

- Symbol: SPY (S&P 500 ETF)
- Training period: 2022-2024 (configurable)
- Data: 1-minute intraday bars
- Features: 100+ technical indicators
- Architecture: 3-layer LSTM (256→128→64) with attention
- Training time: 2-4 hours on CPU, 30-60 min on GPU

**Output:**

- `best_model.pth` - Trained model weights
- `scaler.pkl` - Feature scaler
- MLflow logs in `mlruns/` directory

### Move Trained Model to Production

```bash
mkdir -p ml-backend/models
mv best_model.pth ml-backend/models/
mv scaler.pkl ml-backend/models/
```

Update `prediction_engine.py` if needed:

```python
PredictionEngine(
    model_path="models/best_model.pth",
    scaler_path="models/scaler.pkl",
    num_features=100  # Match your training features
)
```

---

## 📊 API Endpoints

### 1. Get Current Prediction

```bash
GET http://localhost:8000/predict/current
```

**Response:**

```json
{
  "timestamp": "2024-11-23T10:30:00",
  "predictions": {
    "sp500": {
      "direction": "bullish",
      "confidence": 0.72,
      "expected_move": 0.45,
      "price_target": 465.0
    },
    "nasdaq": {...},
    "dow": {...}
  },
  "model_version": "v1.0.0",
  "model_accuracy": 0.68
}
```

### 2. Run Backtest

```bash
POST http://localhost:8000/backtest
Content-Type: application/json

{
  "start_date": "2024-01-01",
  "end_date": "2024-11-23",
  "initial_capital": 100000,
  "strategy": {
    "position_size": 0.10,
    "min_confidence": 0.65,
    "stop_loss": 0.02,
    "take_profit": 0.04
  }
}
```

### 3. Get Model Accuracy

```bash
GET http://localhost:8000/performance/accuracy
```

### 4. Optimize Strategy

```bash
POST http://localhost:8000/strategy/optimize
Content-Type: application/json

{
  "min_sharpe": 1.5,
  "max_drawdown": 0.15,
  "min_win_rate": 0.55
}
```

---

## 🐳 Docker Deployment

### Build Image

```bash
cd ml-backend
docker build -t lumotrade-ml:latest .
```

### Run Container

```bash
docker run -d \
  --name lumotrade-ml \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/models:/app/models \
  lumotrade-ml:latest
```

### Docker Compose (with Next.js)

Create `docker-compose.yml` in project root:

```yaml
version: "3.8"

services:
  ml-backend:
    build: ./ml-backend
    ports:
      - "8000:8000"
    env_file:
      - ./ml-backend/.env
    volumes:
      - ./ml-backend/models:/app/models
    restart: unless-stopped

  nextjs:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_ML_BACKEND_URL=http://ml-backend:8000
    depends_on:
      - ml-backend
    restart: unless-stopped
```

Run:

```bash
docker-compose up -d
```

---

## ⚙️ Configuration & Optimization

### Prediction Update Frequency

Edit `src/inference/prediction_engine.py`:

```python
async def _update_loop(self):
    while self.is_running:
        await asyncio.sleep(60)  # Update every 60 seconds (default)
        # Change to 30 for faster updates, 300 for slower
```

### ChatGPT-5.1 Analysis Frequency

Edit `_should_run_llm_analysis()` in `prediction_engine.py`:

```python
return (datetime.now() - self._last_llm_time).total_seconds() >= 300
# Default: 300 seconds (5 minutes)
# Reduce to save costs, increase for fresher analysis
```

### Model Fusion Weights

Edit `_fuse_predictions()` in `prediction_engine.py`:

```python
# Current weights:
# - LSTM: 60%
# - ChatGPT-5.1: 40%

# Adjust based on your model's accuracy:
predictions[index]['confidence'] = ml_confidence * 0.6  # LSTM weight
predictions[index]['confidence'] += llm_confidence * 0.4  # ChatGPT-5.1 weight
```

---

## 📈 Model Retraining

### Setup Daily Retraining

Create a cron job (Linux/Mac):

```bash
crontab -e
```

Add:

```
0 4 * * 1-5 cd /path/to/ml-backend && python src/training/train.py
```

This retrains the model every weekday at 4 AM.

### Manual Retraining

```bash
python src/training/train.py
```

The system will:

1. Fetch latest market data
2. Train model with new data
3. Save improved weights
4. Log metrics to MLflow

---

## 🔍 Monitoring & Debugging

### Check Logs

```bash
# Docker logs
docker logs lumotrade-ml -f

# Local logs
# Logs print to console during development
```

### Monitor Performance

```bash
# Check model accuracy
curl http://localhost:8000/performance/accuracy

# Health check
curl http://localhost:8000/health
```

### MLflow UI (Optional)

If using MLflow for experiment tracking:

```bash
mlflow ui
# Visit http://localhost:5000
```

---

## 🚨 Troubleshooting

### Issue: "Module not found" errors

**Solution**: Ensure all dependencies are installed:

```bash
pip install -r requirements.txt
```

### Issue: "Cannot load model"

**Solution**: The system works without a trained model using ChatGPT-5.1 only. To train:

```bash
python src/training/train.py
```

### Issue: Predictions not updating

**Solution**: Check if prediction engine started:

```bash
# Look for: "✓ Prediction Engine initialized" in logs
# If not, check API keys are configured
```

### Issue: Out of memory during training

**Solution**: Reduce batch size in `train.py`:

```python
batch_size = 32  # Default: 64
```

---

## 💰 Cost Estimates

### API Costs (Monthly)

Assuming market hours operation (6.5 hours/day, 20 trading days):

- **FMP**: Free tier (250 requests/day) is sufficient
- **Polygon**: Free tier works, Pro ($200/month) for real-time
- **Marketaux**: Free tier (100 articles/day) is sufficient
- **OpenAI ChatGPT-5.1**: ~$50-100/month (estimate per OpenAI pricing)
  - 1 call every 5 minutes = 156 calls/day
  - ~$0.01-0.03 per call = $30-90/month

**Total**: $50-400/month depending on tier choices

### Compute Costs

- **Local/Self-hosted**: $0 (use your machine)
- **AWS EC2 (t3.medium)**: ~$30/month
- **Google Cloud Run**: ~$20-40/month (pay per use)

---

## 🎯 Next Steps

1. ✅ **Backend is running** - Test with http://localhost:8000/health
2. ✅ **Frontend integrated** - LivePredictionSection should display predictions
3. 📊 **Optional: Train model** - Run `python src/training/train.py`
4. 🚀 **Deploy to cloud** - Use Docker for easy deployment
5. 📈 **Monitor performance** - Track accuracy metrics over time

---

## 📚 Additional Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **PyTorch**: https://pytorch.org/docs
- **pandas-ta**: https://github.com/twopirllc/pandas-ta
- **MLflow**: https://mlflow.org/docs/latest/index.html

---

## 🤝 Support

For issues or questions:

1. Check the logs for error messages
2. Verify all API keys are configured
3. Ensure Python 3.11+ is installed
4. Check that ports 8000 is not in use

**Happy Trading! 🚀📈**
