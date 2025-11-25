# LumoTrade ML Backend Documentation

## 📚 Documentation Index

- **[Quick Start Guide](QUICK_START.md)** - Get up and running in 5 minutes
- **[API Reference](API.md)** - Complete API endpoint documentation
- **[Development Guide](DEVELOPMENT.md)** - Testing, contributing, and development workflow
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions

---

## 🎯 What is LumoTrade ML Backend?

LumoTrade is a production-grade machine learning system for quantitative trading that uses:
- **230+ features** from 7 data sources (technical, news, macro, cross-asset, breadth, calendar, interactions)
- **Quantile regression** (P10, P50, P90) for uncertainty quantification
- **Panel data training** (multi-ticker) for robust model learning
- **Walk-forward validation** to prevent overfitting
- **Vol-targeted position sizing** for risk management
- **Real-time prediction engine** with InstantDB persistence

---

## 🏗️ Architecture

```
ml-backend/
├── src/
│   ├── api/              # FastAPI route handlers
│   ├── core/            # Core business logic
│   │   ├── data/        # Data loading & API clients (FMP, FRED, Yahoo)
│   │   ├── features/    # Feature engineering (230+ features)
│   │   ├── models/      # ML models (quantile regression, classifier)
│   │   ├── training/    # Training pipeline (walk-forward validation)
│   │   ├── inference/   # Prediction engine
│   │   └── backtesting/ # Backtesting engine
│   ├── database/        # InstantDB integration
│   ├── llm/            # LLM integration (ChatGPT)
│   └── utils/          # Utilities
├── tests/              # Test suite
├── data/              # Data storage (cache, models)
└── docs/              # Documentation
```

---

## ⚡ Quick Start

```bash
# 1. Set up environment
cd ml-backend
source load_env.sh

# 2. Run validation
python tests/test_1_validation.py

# 3. Start API server
python app.py

# 4. Access API docs
open http://localhost:8000/docs
```

See [Quick Start Guide](QUICK_START.md) for detailed instructions.

---

## 🔑 Key Features

### Data Layer
- **FMP API**: Historical news, macro surprises, intraday data
- **FRED API**: 24 macro economic series
- **Yahoo Finance**: Cross-asset data (VIX, DXY, commodities, bonds)
- **Automatic caching**: All data cached to Parquet for fast reloads

### Feature Engineering (230+ Features)
- **Technical (62)**: EMAs, RSI, MACD, Bollinger Bands, ATR, ADX, etc.
- **News Sentiment (40)**: Market-wide + ticker-specific sentiment, shocks, burst ratios
- **Macro (45)**: Yields, inflation, labor market, sentiment, credit spreads
- **Cross-Asset (20)**: VIX, VIX term structure, DXY, gold, oil, bonds
- **Breadth (15)**: Sector internals, advance/decline, up/down volume
- **Calendar (10)**: Seasonality, month-end, earnings season
- **Interactions (15)**: VIX × news, macro risk signals, breadth × sentiment

### Models
- **Quantile Regression**: Predict P10, P50, P90 for uncertainty quantification
- **Direction Classifier**: Binary up/down probability prediction
- **Hybrid Ensemble**: Combine models + LLM for enhanced predictions

### Training
- **Panel Data**: Multi-ticker training for robust models
- **Walk-Forward Validation**: 4-6 folds to prevent overfitting
- **9 Models**: 3 horizons × 3 quantiles (1h, 5h, 20h predictions)

### Backtesting
- **Realistic constraints**: Transaction costs (2 bps), slippage
- **Vol-targeted sizing**: Dynamic position sizing based on volatility
- **Emergency stops**: ATR-based stop losses
- **Comprehensive metrics**: CAGR, Sharpe, max DD, win rate

### Production Features
- **FastAPI**: Modern async API framework
- **InstantDB**: Real-time data persistence
- **SSE streaming**: Real-time progress updates
- **Error handling**: Robust error handling and logging
- **Monitoring**: Accuracy tracking and model monitoring

---

## 📊 Performance Targets

### Model Quality
- **MAE**: < 1.5% for 5-hour horizon
- **Coverage (P10-P90)**: 75-85%
- **Direction Accuracy**: 55-60%

### Backtest Performance (Minimum for deployment)
- **CAGR**: 60%+ annually
- **Sharpe Ratio**: 2.0+
- **Max Drawdown**: < 20%
- **Win Rate**: 55%+

---

## 🚀 API Endpoints

### Training
- `POST /api/train/panel` - Train panel models with walk-forward validation
- `GET /api/train/status/{operation_id}` - Check training status

### Prediction
- `POST /api/predict` - Generate predictions for a ticker
- `GET /api/predict/stream/{operation_id}` - Stream prediction progress

### Backtesting
- `POST /api/backtest` - Run backtest with predictions
- `GET /api/backtest/stream/{operation_id}` - Stream backtest progress

### Health
- `GET /health` - Health check
- `GET /api/status` - System status

See [API Reference](API.md) for complete documentation.

---

## 🔧 Development

### Running Tests
```bash
# Validation test
python tests/test_1_validation.py

# Training test  
python tests/test_2_small_training.py

# Full test suite
pytest tests/
```

### Code Structure
- **Clean architecture**: Separation of concerns
- **Type hints**: Full type annotations
- **Docstrings**: Comprehensive documentation
- **Error handling**: Robust error handling throughout
- **Logging**: Structured logging for debugging

See [Development Guide](DEVELOPMENT.md) for more details.

---

## 📦 Dependencies

- **Python 3.10+**
- **FastAPI**: API framework
- **LightGBM**: Machine learning models
- **pandas/numpy**: Data manipulation
- **scikit-learn**: Model evaluation
- **yfinance**: Market data
- **InstantDB**: Real-time database

See `requirements.txt` for complete list.

---

## 🤝 Support

- **Documentation**: `/docs`
- **API Docs**: `http://localhost:8000/docs` (when server is running)
- **Issues**: Report issues on GitHub

---

## 📄 License

Proprietary - All rights reserved

---

**Built with ❤️ for quantitative trading**

