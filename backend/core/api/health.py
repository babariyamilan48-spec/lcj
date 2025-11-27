"""
Health Check API Endpoints
Monitor database and system health
"""

from fastapi import APIRouter, HTTPException
from core.database_fixed import get_db, db_manager
from core.middleware.database_error_handler import get_database_health, get_database_health_summary
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["health"])

@router.get("/database")
async def database_health():
    """Check database connection health"""
    try:
        health_result = get_database_health()
        
        if health_result.get("status") == "healthy":
            return {
                "status": "healthy",
                "database": health_result,
                "message": "Database connection is working properly"
            }
        else:
            return {
                "status": "unhealthy",
                "database": health_result,
                "message": "Database connection issues detected"
            }
            
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Health check failed: {str(e)}")

@router.get("/database/summary")
async def database_health_summary():
    """Get database health summary and trends"""
    try:
        summary = get_database_health_summary()
        return {
            "status": "success",
            "summary": summary
        }
    except Exception as e:
        logger.error(f"Health summary failed: {e}")
        raise HTTPException(status_code=500, detail=f"Health summary failed: {str(e)}")

@router.post("/database/reset")
async def reset_database_connection():
    """Reset database connection (admin only)"""
    try:
        reset_db_connection()
        return {
            "status": "success",
            "message": "Database connection reset successfully"
        }
    except Exception as e:
        logger.error(f"Database reset failed: {e}")
        raise HTTPException(status_code=500, detail=f"Database reset failed: {str(e)}")

@router.get("/system")
async def system_health():
    """Overall system health check"""
    try:
        # Check database
        db_health = get_database_health()
        
        # Check other components (can be expanded)
        components = {
            "database": db_health,
            "api": {"status": "healthy", "message": "API is responding"}
        }
        
        # Determine overall status
        overall_status = "healthy"
        if any(comp.get("status") != "healthy" for comp in components.values()):
            overall_status = "degraded"
        
        return {
            "status": overall_status,
            "components": components,
            "timestamp": db_health.get("timestamp")
        }
        
    except Exception as e:
        logger.error(f"System health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"System health check failed: {str(e)}")
