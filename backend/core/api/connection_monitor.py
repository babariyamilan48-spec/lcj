"""
Connection pool monitoring and management endpoints
Helps diagnose and fix connection pool exhaustion issues
"""
from fastapi import APIRouter, HTTPException
from core.database import engine, DatabaseMonitor
from core.database_pool import optimized_db_pool
from core.database_singleton import db_singleton
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/pool/status")
async def get_pool_status():
    """Get current database connection pool status"""
    try:
        pool = engine.pool
        checked_out = pool.checkedout()
        checked_in = pool.checkedin()
        
        return {
            "status": "healthy",
            "pool_info": {
                "size": pool.size(),
                "checked_in": checked_in,
                "checked_out": checked_out,
                "overflow": pool.overflow(),
                "total_connections": checked_in + checked_out,
                "available_connections": checked_in,
                "in_use_connections": checked_out
            },
            "limits": {
                "pool_size": 5,
                "max_overflow": 10,
                "total_limit": 15,
                "supabase_limit": 30
            }
        }
    except Exception as e:
        logger.error(f"Error getting pool status: {e}")
        return {
            "status": "error",
            "error": str(e)
        }


@router.get("/pool/health")
async def get_pool_health():
    """Get detailed pool health information"""
    try:
        pool_status = DatabaseMonitor.get_pool_status()
        
        # Calculate health metrics
        total_connections = pool_status.get("pool_size", 0) + pool_status.get("overflow_connections", 0)
        in_use = pool_status.get("checked_out_connections", 0)
        available = pool_status.get("checked_in_connections", 0)
        
        # Determine health status
        if in_use >= 14:  # Close to limit
            health_status = "critical"
        elif in_use >= 10:  # Getting close
            health_status = "warning"
        else:
            health_status = "healthy"
        
        return {
            "status": health_status,
            "connections": {
                "total": total_connections,
                "in_use": in_use,
                "available": available,
                "percentage_used": round((in_use / 15) * 100, 2) if total_connections > 0 else 0
            },
            "recommendations": get_health_recommendations(health_status, in_use)
        }
    except Exception as e:
        logger.error(f"Error getting pool health: {e}")
        return {
            "status": "error",
            "error": str(e)
        }


@router.post("/pool/reset")
async def reset_pool():
    """Reset the connection pool (use with caution)"""
    try:
        # Dispose of all connections
        engine.dispose()
        logger.warning("Connection pool has been reset")
        
        return {
            "status": "success",
            "message": "Connection pool reset successfully",
            "warning": "All existing connections have been closed"
        }
    except Exception as e:
        logger.error(f"Error resetting pool: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reset pool: {str(e)}")


@router.get("/pool/diagnostics")
async def get_pool_diagnostics():
    """Get comprehensive pool diagnostics"""
    try:
        pool = engine.pool
        checked_out = pool.checkedout()
        checked_in = pool.checkedin()
        
        return {
            "status": "success",
            "diagnostics": {
                "pool_class": str(type(pool).__name__),
                "pool_size": pool.size(),
                "checked_in": checked_in,
                "checked_out": checked_out,
                "overflow": pool.overflow(),
                "total_connections": checked_in + checked_out,
                "available_connections": checked_in,
                "in_use_connections": checked_out,
                "connection_usage_percent": round((checked_out / 15) * 100, 2)
            },
            "configuration": {
                "pool_size": 5,
                "max_overflow": 10,
                "pool_timeout": 20,
                "pool_recycle": 900,
                "pool_pre_ping": True
            },
            "recommendations": [
                "Ensure all database sessions are properly closed",
                "Check for long-running queries that hold connections",
                "Monitor application logs for database errors",
                "Use connection pool monitoring regularly"
            ]
        }
    except Exception as e:
        logger.error(f"Error getting diagnostics: {e}")
        return {
            "status": "error",
            "error": str(e)
        }


def get_health_recommendations(status: str, in_use: int) -> list:
    """Get recommendations based on health status"""
    recommendations = []
    
    if status == "critical":
        recommendations.extend([
            "🚨 CRITICAL: Connection pool nearly exhausted!",
            "Check for database connection leaks",
            "Review application logs for errors",
            "Consider restarting the service if connections don't recover",
            "Verify all database sessions are being closed properly"
        ])
    elif status == "warning":
        recommendations.extend([
            "⚠️ WARNING: Connection pool usage is high",
            "Monitor connection usage closely",
            "Check for slow queries that hold connections",
            "Ensure database sessions are closed after use"
        ])
    else:
        recommendations.extend([
            "✅ Connection pool is healthy",
            "Continue monitoring for any issues",
            "Maintain current connection management practices"
        ])
    
    return recommendations
