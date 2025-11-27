"""
Connection pool monitoring - uses core.database_fixed
Provides real-time monitoring of database connection pool status
"""
from fastapi import APIRouter, HTTPException
from core.database_fixed import db_manager, check_db_health
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/pool/status")
async def pool_status():
    """Get current pool status"""
    try:
        pool = db_manager.engine.pool
        checked_out = pool.checkedout()
        checked_in = pool.checkedin()
        
        return {
            "status": "success",
            "pool": {
                "size": pool.size(),
                "checked_in": checked_in,
                "checked_out": checked_out,
                "max_overflow": 5,  # Configured in database_fixed.py
                "total": checked_in + checked_out,
                "available": checked_in,
                "in_use": checked_out
            },
            "limits": {
                "pool_size": 3,
                "max_overflow": 5,
                "total_limit": 8,
                "supabase_limit": 30
            },
            "health": "healthy" if checked_out < 7 else "warning" if checked_out < 8 else "critical"
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
        
        pool_stats = health.get("pool_stats", {})
        checked_out = pool_stats.get("checked_out", 0)
        
        # Determine health status (8 total connections: 3 base + 5 overflow)
        if checked_out >= 8:
            status = "critical"
            message = "Connection pool exhausted!"
        elif checked_out >= 6:
            status = "warning"
            message = "Connection pool usage is high"
        else:
            status = "healthy"
            message = "Connection pool is healthy"
        
        return {
            "status": status,
            "message": message,
            "connections": {
                "total": 8,
                "in_use": checked_out,
                "available": 8 - checked_out,
                "percentage_used": round((checked_out / 8) * 100, 2)
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
        health = check_db_health()
        
        if health.get("status") != "healthy":
            return {"status": "error", "error": health.get("error")}
        
        pool_stats = health.get("pool_stats", {})
        
        return {
            "status": "success",
            "diagnostics": {
                "pool_size": 3,
                "max_overflow": 5,
                "checked_in": pool_stats.get("checked_in", 0),
                "checked_out": pool_stats.get("checked_out", 0),
                "overflow": pool_stats.get("overflow", 0),
                "total_connections": pool_stats.get("checked_in", 0) + pool_stats.get("checked_out", 0),
                "available_connections": pool_stats.get("checked_in", 0),
                "in_use_connections": pool_stats.get("checked_out", 0),
                "usage_percent": round((pool_stats.get("checked_out", 0) / 8) * 100, 2)
            },
            "configuration": {
                "pool_size": 3,
                "max_overflow": 5,
                "total_limit": 8,
                "supabase_limit": 30,
                "statement_timeout": "10s",
                "idle_timeout": "30s",
                "lock_timeout": "8s"
            },
            "expected": {
                "pool_size": 3,
                "max_overflow": 5,
                "total_limit": 8
            }
        }
    except Exception as e:
        logger.error(f"Error getting diagnostics: {e}")
        return {"status": "error", "error": str(e)}


@router.post("/pool/reset")
async def reset_pool_endpoint():
    """Reset connection pool (emergency only)"""
    try:
        from core.database_fixed import reset_db_connection
        reset_db_connection()
        
        return {
            "status": "success",
            "message": "Connection pool reset successfully",
            "warning": "All existing connections have been closed"
        }
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
