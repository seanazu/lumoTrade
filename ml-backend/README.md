# LumoTrade ML Backend

**Production-grade quantitative trading ML system with 230+ features and quantile regression.**

---

## 🚀 Quick Start

```bash
# 1. Load environment variables
source load_env.sh

# 2. Run validation
python tests/test_1_validation.py

# 3. Start server
python app.py

# 4. Access API docs
open http://localhost:8001/docs
```

---

## 📚 Complete Documentation

**See the main [GUIDE.md](../GUIDE.md) for comprehensive documentation including:**

- Complete setup instructions
- API reference with examples
- Feature engineering details
- Model architecture
- Training & prediction workflows
- Environment configuration
- Troubleshooting

---

## 📂 Quick Reference

### Project Structure

```
ml-backend/
├── app.py                 # FastAPI server
├── src/
│   ├── api/              # API routes
│   ├── core/             # Business logic
│   │   ├── data/         # Data loading & API clients
│   │   ├── features/     # 230+ feature engineering
│   │   ├── models/       # ML models
│   │   ├── training/     # Training pipeline
│   │   ├── inference/    # Prediction engine
│   │   └── backtesting/  # Backtesting engine
│   ├── database/         # InstantDB integration
│   └── llm/             # LLM integration
├── tests/               # Test suite
└── docs/                # Additional documentation
```

### Key Features

- **230+ Features**: Technical, news, macro, cross-asset, breadth, calendar, interactions
- **9 Models**: 3 horizons × 3 quantiles (P10, P50, P90)
- **Panel Data**: Multi-ticker training for better generalization
- **Walk-Forward Validation**: Prevents overfitting
- **Real-Time Predictions**: <500ms latency
- **Advanced Backtesting**: Realistic constraints (costs, stops)

### API Endpoints

```bash
# Health
GET /api/health

# Training
POST /api/training/panel

# Predictions
POST /api/predict/

# Backtesting
POST /api/backtest/

# Model Info
GET /api/model/info
GET /api/model/features
GET /api/model/status

# Investment Simulation
GET /api/backtest/simulate/{ticker}/{timeframe}
```

---

## 🔧 Additional Resources

- **[Quick Start Guide](docs/QUICK_START.md)** - Get started in 5 minutes
- **[Environment Setup](docs/ENV_SETUP.md)** - API keys and configuration
- **[Main Guide](../GUIDE.md)** - Complete documentation
- **[API Docs](http://localhost:8001/docs)** - Interactive API documentation

---

## 🎯 What This System Does

1. **Collects Data** from FMP, FRED, Yahoo Finance
2. **Engineers 230+ Features** across 8 categories
3. **Trains Models** using panel data with walk-forward validation
4. **Generates Predictions** with uncertainty bands (P10, P50, P90)
5. **Backtests Strategies** with realistic constraints
6. **Stores Results** in InstantDB for continuous learning

---

**For complete documentation, see [GUIDE.md](../GUIDE.md)**
