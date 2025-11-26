# ML Backend - Technical Documentation

Backend server for LumoTrade AI trading system.

## Quick Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Train model
python3 run_full_multi_timeframe_training.py

# Start server
uvicorn app:app --reload --port 8000
```

## Environment Variables

Required in `.env`:
```bash
OPENAI_API_KEY=your_key        # For news sentiment (GPT-5)
NEWSAPI_KEY=your_key           # For news articles
ALPHAVANTAGE_KEY=your_key      # For market data
SUPABASE_URL=your_url          # For database
SUPABASE_KEY=your_key          # For database
```

## API Server

**Start:** `uvicorn app:app --reload --port 8000`

**Key Endpoints:**
- `/api/train/ultimate` - Train model (POST)
- `/api/predict/{ticker}` - Get predictions (GET)
- `/api/backtest` - Run backtest (POST)

## Training Scripts

**Full pipeline (recommended):**
```bash
python3 run_full_multi_timeframe_training.py
```
Trains 1h, 4h, and daily models. Takes 30-45 minutes.

**Individual models:**
```bash
python3 train_model.py      # Daily (baseline)
python3 train_1h_model.py   # Intraday  
python3 train_4h_model.py   # Swing
```

## Model Architecture

- **ML Models:** LightGBM, XGBoost, CatBoost ensemble
- **Features:** 109+ predictive features
- **RL Agent:** DDPG (246K parameters) for position sizing
- **Validation:** Walk-forward with 5-fold cross-validation
- **Target:** Binary classification (UP/DOWN direction)

## Results Location

After training, check:
```bash
models/ultimate/metadata.json       # Training stats
models/ultimate/predictions.csv     # All predictions
models/ultimate/signals.csv         # Trading signals
```

## Troubleshooting

**"Module not found":** Install dependencies with `pip install -r requirements.txt`

**"Insufficient data":** Use at least 2 years of data for training

**"Model not found":** Train a model first using training scripts

**News not working:** Set `OPENAI_API_KEY` in `.env`

For complete documentation, see main `README.md` in project root.
