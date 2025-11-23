# LumoTrade - Complete Setup & Run Guide

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd ml-backend
pip install -r requirements.txt
```

### 2. Set Up Environment Variables
```bash
cd ml-backend
cp config.example.env .env
# Edit .env and add your API keys:
# - OPENAI_API_KEY (for ChatGPT-5)
# - POLYGON_API_KEY (for market data)
# - FMP_API_KEY (for financial data)
# - MARKETAUX_API_KEY (for news)
# - INSTANT_APP_ID (optional, for continuous learning)
# - INSTANT_ADMIN_TOKEN (optional)
```

### 3. Start the System
```bash
# Terminal 1: Start ML Backend
cd ml-backend
uvicorn app:app --reload

# Terminal 2: Start Frontend
npm run dev
```

### 4. Open the App
- **Main Page**: http://localhost:3000
- **Model Monitor**: http://localhost:3000/model-monitor
- **Stock Analyzer**: http://localhost:3000/analyzer

---

## 📊 How It Works

### Architecture
```
Frontend (Next.js) → API Routes → ML Backend (FastAPI)
                                      ↓
                    ┌─────────────────┴─────────────────┐
                    ↓                 ↓                  ↓
            Data Sources      LightGBM Models    ChatGPT-5
            (Polygon/FMP)     (Predictions)      (Analysis)
```

### Prediction Flow
1. **Fetch Data**: Market prices, news, technical indicators
2. **Feature Engineering**: Calculate 150+ features
3. **LightGBM Prediction**: Generate 6-horizon forecasts
4. **ChatGPT-5 Analysis**: Social sentiment + qualitative insights
5. **Fusion**: Combine ML + AI predictions
6. **Continuous Learning**: Store predictions, validate outcomes

---

## 🎯 Key Features

### Multi-Horizon Predictions
- **1h, 4h, 10h**: Intraday forecasts
- **1d, 3d, 5d**: Multi-day forecasts
- Each with direction, return %, confidence, and range

### Data Sources
- **Market Data**: Real-time prices from Polygon/FMP
- **News**: 100-150 articles from FMP, Marketaux, Polygon
- **Social Sentiment**: ChatGPT-5 web search
- **Technical Indicators**: RSI, MACD, Bollinger Bands, etc.
- **Macro Data**: VIX, treasury yields

### Continuous Learning
- Automatically records all predictions
- Validates outcomes when time passes
- Tracks accuracy by horizon and symbol
- Auto-retrains when accuracy drops
- Stores in InstantDB (optional) or local files

---

## 🔧 Configuration

### API Keys Required
1. **OpenAI** (ChatGPT-5): https://platform.openai.com
2. **Polygon**: https://polygon.io
3. **FMP**: https://financialmodelingprep.com
4. **Marketaux**: https://marketaux.com

### Optional: InstantDB
For persistent continuous learning:
1. Create account: https://instantdb.com
2. Create app and get credentials
3. Add to `.env`:
   ```
   INSTANT_APP_ID=your-app-id
   INSTANT_ADMIN_TOKEN=your-admin-token
   ```

---

## 🧪 Testing

### Test Backend
```bash
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"symbol": "SPY", "debug": true}'
```

### Test Frontend
1. Open http://localhost:3000/model-monitor
2. Click "Generate Prediction"
3. Verify all sections display data

---

## 🐛 Troubleshooting

### Backend won't start
```bash
cd ml-backend
pip install --upgrade -r requirements.txt
```

### No predictions showing
- Check API keys in `.env`
- Restart backend
- Check browser console for errors

### News sources failing
- Verify API keys are valid
- Check rate limits on API dashboards

---

## 📚 API Endpoints

### Predictions
- `POST /api/predict` - Generate prediction
  ```json
  {
    "symbol": "SPY",
    "debug": true,
    "horizons": ["1h", "1d", "5d"]
  }
  ```

### Continuous Learning
- `GET /api/learning/performance` - Get accuracy metrics
- `POST /api/learning/record-outcome` - Record actual outcome
- `POST /api/learning/retrain` - Trigger retraining

---

## 🎊 You're Ready!

The system is now fully functional with:
- ✅ Real-time data from multiple sources
- ✅ 6-horizon predictions
- ✅ ChatGPT-5 social sentiment
- ✅ Continuous learning
- ✅ Beautiful UI

**Start predicting!** 🚀

