"""
Session Singleton Management API
Provides endpoints for monitoring and managing user sessions
"""
import logging
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any

from core.database_fixed import get_db_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/session-singleton", tags=["Session Management"])


@router.get("/health")
async def session_health() -> Dict[str, Any]:
    """Get session manager health status"""
    try:
        from core.database_fixed import db_manager
        pool = db_manager.engine.pool
        active_count = pool.checkedout()
        
        status_level = "healthy"
        if active_count > 7:
            status_level = "warning"
        if active_count > 8:
            status_level = "critical"
        
        return {
            "status": status_level,
            "active_sessions": active_count,
            "max_sessions_warning": 7,
            "max_sessions_critical": 8,
            "message": f"Session manager is {status_level} with {active_count} active sessions"
        }
    except Exception as e:
        logger.error(f"Error checking session health: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check session health"
        )


@router.get("/stats")
async def session_stats() -> Dict[str, Any]:
    """Get detailed session statistics"""
    try:
        from core.database_fixed import db_manager
        pool = db_manager.engine.pool
        
        return {
            "active_sessions": pool.checkedout(),
            "available_connections": pool.checkedin(),
            "pool_size": pool.size(),
            "overflow": pool.overflow(),
            "timestamp": __import__('datetime').datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting session stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get session statistics"
        )


@router.post("/cleanup")
async def cleanup_all_sessions() -> Dict[str, Any]:
    """Force cleanup all sessions (emergency only)"""
    try:
        from core.database_fixed import db_manager
        db_manager.engine.dispose()
        
        return {
            "status": "success",
            "message": "All sessions cleaned up",
            "active_sessions": db_manager.engine.pool.checkedout()
        }
    except Exception as e:
        logger.error(f"Error cleaning up sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cleanup sessions"
        )


@router.post("/cleanup/{user_id}")
async def cleanup_user_session(user_id: str) -> Dict[str, Any]:
    """Cleanup session for specific user"""
    try:
        from core.database_fixed import db_manager
        from core.cache import cache
        
        # Clear user-related cache entries
        cache_keys = [
            f"user_session:{user_id}",
            f"user_profile:get_user_profile:{user_id}",
            f"fast_user_me:get_current_user_fast:{user_id}",
            f"user_results:{user_id}",
            f"user_analytics:{user_id}"
        ]
        
        for key in cache_keys:
            try:
                cache.delete(key)
            except:
                pass
        
        return {
            "status": "success",
            "message": f"Session cleaned up for user {user_id}",
            "active_sessions": db_manager.engine.pool.checkedout()
        }
    except Exception as e:
        logger.error(f"Error cleaning up session for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup session for user {user_id}"
        )


@router.get("/info")
async def session_info() -> Dict[str, Any]:
    """Get detailed information about all active sessions"""
    try:
        from core.database_fixed import db_manager
        pool = db_manager.engine.pool
        
        return {
            "total_active_sessions": pool.checkedout(),
            "available_connections": pool.checkedin(),
            "pool_size": pool.size(),
            "overflow": pool.overflow(),
            "pool_timeout": 15,
            "pool_recycle": 300,
            "timestamp": __import__('datetime').datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting session info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get session information"
        )
