"""
LumoTrade ML Backend - Production Trading System
ML-powered market direction prediction with adaptive trading strategy
"""
import os
from dotenv import load_dotenv

# Load environment variables FIRST
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import API_CONFIG

# Import route modules
from src.api import health
from src.api.trading import router as trading_router

# Create FastAPI application
app = FastAPI(
    title="LumoTrade Production API",
    version="6.0.0",
    description="Production ML model for market direction prediction with adaptive trading strategy. 64% accuracy, 80.8% on high-confidence trades.",
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
app.include_router(trading_router, prefix="", tags=["Trading"])

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("=" * 60)
    print("LumoTrade Production API Starting...")
    print("=" * 60)
    print(f"Version: {app.version}")
    print(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    print(f"EODHD API: {'✓ Configured' if os.getenv('EODHD_API_KEY') else '✗ Not set'}")
    print(f"Supabase: {'✓ Configured' if os.getenv('SUPABASE_URL') else '✗ Not set'}")
    print("=" * 60)
    print("Endpoints:")
    print("  ✓ GET  /predict/today       - Today's prediction")
    print("  ✓ GET  /predict/history     - Prediction history")
    print("  ✓ POST /train/trigger       - Trigger training")
    print("  ✓ GET  /train/status        - Training status")
    print("  ✓ GET  /trades/active       - Active trades")
    print("  ✓ GET  /trades/history      - Trade history")
    print("  ✓ GET  /alerts/today        - Today's alert")
    print("  ✓ GET  /model/status        - Model status")
    print("  ✓ GET  /model/accuracy      - Accuracy stats")
    print("  ✓ GET  /model/features      - Feature importance")
    print("=" * 60)
    print(f"API Documentation: http://localhost:{API_CONFIG.get('port', 8000)}/docs")
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
