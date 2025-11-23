# LumoTrade - Complete Guide

## 🚀 Quick Start

### 1. Start the ML Backend

```bash
cd ml-backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start the Frontend

```bash
npm run dev
```

### 3. Open the App

- Main Page: http://localhost:3000
- Stock Analyzer: http://localhost:3000/analyzer
- Model Monitor: http://localhost:3000/model-monitor

---

## 📊 Model Monitor Dashboard

### What You Can See

**Live Data Sources:**

- 💵 **Market Data**: Current price, volume, change %
- ⚠️ **VIX (Fear Index)**: Current level with visual bar
- 📰 **News Sentiment**: Articles analyzed with sentiment scores
- 💬 **Social Sentiment**: Mentions and trending status (requires API setup)
- 📈 **Technical Indicators**: RSI, MACD, Bollinger Bands, etc.

**Model Insights:**

- 🔄 **Step-by-Step Log**: Every operation with timestamps
- ⏱️ **Pipeline Performance**: Duration of each stage
- 🧮 **Prediction Calculation**: How the model combines signals
- 📋 **Raw API Data**: Complete responses from all sources

### How the Model Works

The model combines multiple signals with these weights:

- **News Sentiment**: 35%
- **Social Sentiment**: 25%
- **GPT-4 Analysis**: 25%
- **LSTM Technical**: 15%

**Example Calculation:**

```
News:   0.65 × 0.35 = 0.228
Social: 0.45 × 0.25 = 0.113
GPT-4:  0.75 × 0.25 = 0.188
LSTM:   N/A  × 0.15 = 0.000
─────────────────────────────
Final:  0.529 = 52.9% confidence, BULLISH
```

---

## 🔧 Configuration

### Required API Keys (in `ml-backend/.env`)

```bash
# OpenAI (for GPT-4 analysis)
OPENAI_API_KEY=your_key_here

# Market Data
POLYGON_API_KEY=your_key_here
FMP_API_KEY=your_key_here

# News Sentiment (working)
MARKETAUX_API_KEY=your_key_here
```

### Optional API Keys (for social sentiment)

```bash
# Twitter API (paid, $100/month)
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_BEARER_TOKEN=your_token

# OR Reddit API (free)
REDDIT_CLIENT_ID=your_id
REDDIT_CLIENT_SECRET=your_secret
REDDIT_USER_AGENT=LumoTrade/1.0
```

---

## 📰 News Sentiment

### Status: ✅ Working

**Two Sentiment Systems:**

1. **Basic News Sentiment** (for individual stocks)
   - Fetches articles from Marketaux API
   - Analyzes sentiment using keyword matching
   - Weights by importance and time decay
   - Returns score from -1 (bearish) to +1 (bullish)

2. **Market-Direction Sentiment** (NEW! for indices)
   - Multi-source aggregation (FMP + Marketaux + Polygon)
   - Event clustering and de-duplication
   - Importance scoring (source tier, macro relevance, recency)
   - 11 sentiment features for ML models
   - Supports SPX, NDX, RUT
   - See `ml-backend/MARKET_DIRECTION_SENTIMENT.md` for details

### Troubleshooting

If news shows 0 articles:

1. **Check API Key**:

```bash
cat ml-backend/.env | grep MARKETAUX
```

2. **Test API**:

```bash
python3 test_news_api.py
```

3. **Check Rate Limits**:

- Free tier: 100 requests/day
- If exceeded, wait 24 hours or upgrade

4. **Watch Terminal Logs**:
   Look for:

```
📰 Fetching news from Marketaux for SPY...
📰 Marketaux response status: 200
📰 Found 15 articles
```

---

## 💬 Social Sentiment

### Status: ⚠️ Simulated (Requires Setup)

Currently returns default values because:

- Twitter API requires paid tier ($100/month)
- Reddit API requires OAuth setup

### To Enable:

**Option 1: Twitter API**

1. Sign up at https://developer.twitter.com
2. Subscribe to Pro tier ($100/month)
3. Add credentials to `.env`

**Option 2: Reddit API**

1. Create app at https://www.reddit.com/prefs/apps
2. Add credentials to `.env`
3. Update `social_sentiment.py` to use real API

**Option 3: Alternative APIs**

- LunarCrush (crypto/stock social) - $50/month
- Santiment (crypto social) - Free tier
- StockTwits (stock social) - Free API

---

## 🧠 Training the LSTM Model

### Status: ⏳ Not Trained Yet

The LSTM model (15% weight) is currently skipped. To train it:

```bash
cd ml-backend
python src/training/train.py --symbol SPY --epochs 100
```

This will:

- Download historical data
- Calculate technical indicators
- Train LSTM neural network
- Save model to `models/best_model.pth`

After training, the model will automatically be used in predictions.

---

## 🎨 Dashboard Interpretation

### VIX (Fear Index)

- **< 15**: Low fear, calm market (bullish)
- **15-25**: Moderate fear, normal volatility
- **> 25**: High fear, stressed market (bearish)
- **Decreasing**: Fear subsiding (bullish signal)
- **Increasing**: Fear rising (bearish signal)

### News Sentiment

- **> 0.5**: Strong bullish sentiment
- **0 to 0.5**: Mild bullish
- **-0.5 to 0**: Mild bearish
- **< -0.5**: Strong bearish
- **15+ articles**: Reliable signal
- **< 5 articles**: Less reliable

### Technical Indicators

- **RSI > 70**: Overbought (potential reversal down)
- **RSI < 30**: Oversold (potential reversal up)
- **MACD > 0**: Bullish momentum
- **MACD < 0**: Bearish momentum

---

## 🐛 Troubleshooting

### Backend Not Starting

```bash
# Kill existing process
pkill -f "uvicorn app:app"

# Restart
cd ml-backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run dev
```

### No Data in Dashboard

1. Check ML backend is running (port 8000)
2. Check browser console for errors
3. Verify API keys in `ml-backend/.env`
4. Check terminal logs for API errors

### CORS Errors

Already configured in `ml-backend/app.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📁 Project Structure

```
LumoTrade/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── page.tsx           # Main market overview
│   │   ├── analyzer/          # Stock analyzer
│   │   └── model-monitor/     # ML dashboard
│   ├── components/            # React components
│   └── lib/                   # Utilities
├── ml-backend/
│   ├── app.py                 # FastAPI server
│   ├── src/
│   │   ├── data/              # Data loading & features
│   │   ├── models/            # LSTM model
│   │   ├── sentiment/         # News & social sentiment
│   │   ├── llm/               # GPT-4 integration
│   │   └── inference/         # Prediction engine
│   └── .env                   # API keys (not in git)
└── GUIDE.md                   # This file
```

---

## 🎯 Current Status

### ✅ Working

- Frontend dashboard
- ML backend API
- Market data fetching (Polygon, FMP)
- News sentiment analysis (Marketaux)
- GPT-4 market analysis
- Model monitoring dashboard
- Real-time data visualization

### ⚠️ Needs Setup

- Social sentiment (requires Twitter/Reddit API)
- LSTM model (needs training)

### 📊 Model Accuracy

Without social sentiment and LSTM:

- News: 35% ✅
- Social: 25% ⚠️ (simulated)
- GPT-4: 25% ✅
- LSTM: 15% ⚠️ (not trained)

**Current effective weights**: News 58%, GPT-4 42%

---

## 🚀 Next Steps

1. ✅ News sentiment is working
2. ⏳ (Optional) Set up social sentiment APIs
3. ⏳ (Optional) Train LSTM model
4. ⏳ (Optional) Set up backtesting
5. ⏳ (Optional) Deploy to production

---

## 📞 Support

If you encounter issues:

1. Check terminal logs for errors
2. Verify API keys in `.env`
3. Test APIs individually with test scripts
4. Check rate limits on API providers

---

**The dashboard now shows complete transparency into your AI trading model!** 🎉
