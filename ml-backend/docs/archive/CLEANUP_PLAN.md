# ML Backend Cleanup & Reorganization Plan

## Current Issues

### 1. Code Duplication (V1 vs V2)
- ❌ `src/backtesting/` + `src/backtesting_v2/`
- ❌ `src/data/` + `src/data_v2/`
- ❌ `src/inference/` + `src/inference_v2/`
- ❌ `src/models/` + `src/models_v2/`
- ❌ `src/training/` + `src/training_v2/`

### 2. Documentation Overload
Too many MD files at root (15+ files)

### 3. Unorganized Structure
- Mixed concerns in folders
- No clear separation of core vs utilities

## New Clean Structure

```
ml-backend/
├── app.py                          # Main FastAPI application
├── config.py                       # Configuration management
├── requirements.txt                # Dependencies
├── .env                           # Environment variables
├── load_env.sh                    # Helper script
│
├── docs/                          # ALL documentation here
│   ├── README.md                  # Main documentation
│   ├── QUICK_START.md            # Getting started
│   ├── API_REFERENCE.md          # API endpoints
│   ├── TESTING.md                # Testing guide
│   └── DEPLOYMENT.md             # Deployment guide
│
├── src/
│   ├── api/                       # API routes (NEW)
│   │   ├── __init__.py
│   │   ├── training.py           # Training endpoints
│   │   ├── prediction.py         # Prediction endpoints
│   │   ├── backtest.py           # Backtest endpoints
│   │   └── health.py             # Health check endpoints
│   │
│   ├── core/                      # Core business logic (NEW)
│   │   ├── __init__.py
│   │   ├── data/                 # Data loading & caching
│   │   │   ├── __init__.py
│   │   │   ├── loaders.py
│   │   │   ├── cache.py
│   │   │   └── api_clients/
│   │   │       ├── fmp.py
│   │   │       ├── fred.py
│   │   │       ├── yahoo.py
│   │   │       └── breadth.py
│   │   │
│   │   ├── features/             # Feature engineering
│   │   │   ├── __init__.py
│   │   │   ├── builder.py        # Main dataset builder
│   │   │   ├── technical.py
│   │   │   ├── news.py
│   │   │   ├── macro.py
│   │   │   ├── cross_asset.py
│   │   │   ├── breadth.py
│   │   │   ├── calendar.py
│   │   │   ├── interactions.py
│   │   │   └── utils.py
│   │   │
│   │   ├── models/               # ML models
│   │   │   ├── __init__.py
│   │   │   ├── quantile.py
│   │   │   ├── classifier.py
│   │   │   └── base.py
│   │   │
│   │   ├── training/             # Training pipeline
│   │   │   ├── __init__.py
│   │   │   ├── trainer.py
│   │   │   ├── validator.py      # Walk-forward
│   │   │   └── metrics.py
│   │   │
│   │   ├── inference/            # Prediction engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── hybrid.py         # LLM integration
│   │   │
│   │   └── backtesting/          # Backtesting
│   │       ├── __init__.py
│   │       ├── engine.py
│   │       ├── position_sizer.py
│   │       └── metrics.py
│   │
│   ├── database/                  # Database layer (NEW)
│   │   ├── __init__.py
│   │   ├── instantdb.py          # InstantDB client
│   │   ├── models.py             # Data models
│   │   └── repositories/         # Data access
│   │       ├── predictions.py
│   │       ├── training_runs.py
│   │       ├── backtests.py
│   │       └── market_data.py
│   │
│   ├── llm/                       # LLM integration
│   │   ├── __init__.py
│   │   └── analyst.py
│   │
│   └── utils/                     # Utilities
│       ├── __init__.py
│       ├── logging.py
│       ├── monitoring.py
│       └── helpers.py
│
├── tests/                         # All tests
│   ├── __init__.py
│   ├── test_data.py
│   ├── test_features.py
│   ├── test_training.py
│   ├── test_inference.py
│   └── test_api.py
│
├── scripts/                       # Utility scripts
│   ├── train_model.py
│   ├── run_backtest.py
│   └── deploy.py
│
└── data/                          # Data storage
    ├── cache/                     # API response cache
    ├── models/                    # Saved models
    └── logs/                      # Application logs
```

## Migration Steps

### Phase 1: Consolidate Code (Remove V1, Keep V2)
1. ✅ Delete old V1 modules
2. ✅ Rename V2 modules (remove _v2 suffix)
3. ✅ Update all imports

### Phase 2: Reorganize Structure
1. ✅ Create new folder structure
2. ✅ Move files to appropriate locations
3. ✅ Update imports throughout

### Phase 3: Clean Documentation
1. ✅ Move all docs to `docs/` folder
2. ✅ Consolidate into 5 key documents
3. ✅ Update README

### Phase 4: API Cleanup
1. ✅ Organize endpoints into separate route files
2. ✅ Add proper error handling
3. ✅ Add request/response models
4. ✅ Test all endpoints

### Phase 5: InstantDB Integration
1. ✅ Set up InstantDB client
2. ✅ Create data models
3. ✅ Implement repositories
4. ✅ Store predictions
5. ✅ Store training runs
6. ✅ Store backtest results
7. ✅ Store market data

### Phase 6: Testing
1. ✅ Update all tests
2. ✅ Run full test suite
3. ✅ Verify endpoints
4. ✅ Verify database storage

## Benefits

✅ **No Duplication** - Single source of truth  
✅ **Clean Structure** - Clear separation of concerns  
✅ **Easy Navigation** - Logical folder hierarchy  
✅ **Better Testing** - Organized test files  
✅ **Production Ready** - Professional code organization  
✅ **Data Persistence** - All data stored in InstantDB  
✅ **Maintainable** - Easy to understand and extend

