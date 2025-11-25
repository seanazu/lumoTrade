"""
Health check and status endpoints
"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "name": "LumoTrade ML API",
        "version": "2.0",
        "status": "operational",
        "docs": "/docs"
    }

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ml-backend",
        "version": "2.0"
    }

