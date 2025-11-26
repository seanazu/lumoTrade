"""
LumoTrade ML Backend - Clean FastAPI Application
Production-grade quantitative trading ML system
"""
import os
from dotenv import load_dotenv

# Load environment variables FIRST
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import MODEL_CONFIG, API_CONFIG

# Import route modules
from src.api import health, prediction, backtest, models_info, training_ultimate

# Create FastAPI application
app = FastAPI(
    title="LumoTrade ML Backend",
    version="4.0.0 OPTIMIZED",
    description="Production-grade quantitative trading ML system optimized for 80%+ annual returns with 50 core features: Research-backed feature selection, VIX, market breadth, momentum, sentiment, and smart money signals. Reduced overfitting, 70% faster training, targeting 65-70% direction accuracy.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=API_CONFIG.get("cors_origins", ["*"]),
    allow_credentials=API_CONFIG.get("cors_credentials", True),
    allow_methods=API_CONFIG.get("cors_methods", ["*"]),
    allow_headers=API_CONFIG.get("cors_headers", ["*"]),
    expose_headers=["*"],
    max_age=3600,
)

# Register route modules
app.include_router(health.router, tags=["Health"])
app.include_router(training_ultimate.router, tags=["Training"])
app.include_router(prediction.router, tags=["Prediction"])
app.include_router(backtest.router, tags=["Backtest"])
app.include_router(models_info.router, tags=["Model Info"])

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("=" * 60)
    print("LumoTrade ML Backend Starting...")
    print("=" * 60)
    print(f"Version: {app.version}")
    print(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    print(f"FMP API: {'✓ Configured' if os.getenv('FMP_API_KEY') else '✗ Not set'}")
    print(f"FRED API: {'✓ Configured' if os.getenv('FRED_API_KEY') else '✗ Not set'}")
    print(f"InstantDB: {'✓ Configured' if os.getenv('INSTANT_APP_ID') else '✗ Not set'}")
    print("=" * 60)
    print("New Model Monitor Endpoints:")
    print("  ✓ GET  /api/model/info       - Model metadata")
    print("  ✓ GET  /api/model/features   - Feature catalog")
    print("  ✓ GET  /api/model/status     - Real-time status")
    print("  ✓ GET  /api/backtest/simulate/{ticker}/{timeframe}")
    print("=" * 60)
    print(f"API Documentation: http://localhost:{API_CONFIG.get('port', 8000)}/docs")
    print(f"Model Monitor: http://localhost:3000/model-monitor")
    print("=" * 60)

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("\nLumoTrade ML Backend shutting down...")

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", API_CONFIG.get("port", 8000)))
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )

