"""
Simplified connection pool monitoring
Uses core.database_simple for direct, reliable monitoring
"""
from fastapi import APIRouter, HTTPException
from core.database_simple import (
    engine,
    check_db_health,
    get_pool_diagnostics,
    reset_pool,
    POOL_SIZE,
    MAX_OVERFLOW
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/pool/status")
async def pool_status():
    """Get current pool status"""
    try:
        pool = engine.pool
        checked_out = pool.checkedout()
        checked_in = pool.checkedin()
        
        return {
            "status": "success",
            "pool": {
                "size": pool.size(),
                "checked_in": checked_in,
                "checked_out": checked_out,
                "max_overflow": MAX_OVERFLOW,  # Use configured value
                "total": checked_in + checked_out,
                "available": checked_in,
                "in_use": checked_out
            },
            "limits": {
                "pool_size": POOL_SIZE,
                "max_overflow": MAX_OVERFLOW,
                "total_limit": POOL_SIZE + MAX_OVERFLOW,
                "supabase_limit": 30
            },
            "health": "healthy" if checked_out < 10 else "warning" if checked_out < 14 else "critical"
        }
    except Exception as e:
        logger.error(f"Error getting pool status: {e}")
        return {"status": "error", "error": str(e)}


@router.get("/pool/health")
async def pool_health():
    """Get pool health check"""
    try:
        health = check_db_health()
        
        if health.get("status") != "healthy":
            return {
                "status": "unhealthy",
                "error": health.get("error", "Unknown error"),
                "message": "Cannot connect to database"
            }
        
        checked_out = health.get("checked_out", 0)
        
        # Determine health status
        if checked_out >= 14:
            status = "critical"
            message = "Connection pool nearly exhausted!"
        elif checked_out >= 10:
            status = "warning"
            message = "Connection pool usage is high"
        else:
            status = "healthy"
            message = "Connection pool is healthy"
        
        return {
            "status": status,
            "message": message,
            "connections": {
                "total": health.get("pool_size", 0),
                "in_use": checked_out,
                "available": health.get("checked_in", 0),
                "percentage_used": round((checked_out / 15) * 100, 2)
            },
            "recommendations": get_recommendations(status, checked_out)
        }
    except Exception as e:
        logger.error(f"Error checking pool health: {e}")
        return {"status": "error", "error": str(e)}


@router.get("/pool/diagnostics")
async def pool_diagnostics():
    """Get detailed pool diagnostics"""
    try:
        diag = get_pool_diagnostics()
        
        if diag.get("status") != "success":
            return diag
        
        return {
            "status": "success",
            "diagnostics": {
                "pool_size": diag.get("pool_size"),
                "max_overflow": diag.get("max_overflow"),
                "checked_in": diag.get("checked_in"),
                "checked_out": diag.get("checked_out"),
                "total_connections": diag.get("total_connections"),
                "available_connections": diag.get("available_connections"),
                "in_use_connections": diag.get("in_use_connections"),
                "usage_percent": diag.get("usage_percent")
            },
            "configuration": diag.get("configuration"),
            "expected": {
                "pool_size": 5,
                "max_overflow": 10,
                "total_limit": 15
            }
        }
    except Exception as e:
        logger.error(f"Error getting diagnostics: {e}")
        return {"status": "error", "error": str(e)}


@router.post("/pool/reset")
async def reset_pool_endpoint():
    """Reset connection pool (emergency only)"""
    try:
        result = reset_pool()
        
        if result.get("status") == "success":
            return {
                "status": "success",
                "message": "Connection pool reset successfully",
                "warning": "All existing connections have been closed"
            }
        else:
            raise HTTPException(status_code=500, detail=result.get("error"))
    except Exception as e:
        logger.error(f"Error resetting pool: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reset pool: {str(e)}")


def get_recommendations(status: str, in_use: int) -> list:
    """Get recommendations based on health status"""
    recommendations = []
    
    if status == "critical":
        recommendations = [
            "🚨 CRITICAL: Connection pool nearly exhausted!",
            "Check for database connection leaks",
            "Review application logs for errors",
            "Consider restarting the service",
            "Verify all database sessions are being closed properly"
        ]
    elif status == "warning":
        recommendations = [
            "⚠️ WARNING: Connection pool usage is high",
            "Monitor connection usage closely",
            "Check for slow queries that hold connections",
            "Ensure database sessions are closed after use"
        ]
    else:
        recommendations = [
            "✅ Connection pool is healthy",
            "Continue monitoring for any issues",
            "Maintain current connection management practices"
        ]
    
    return recommendations
