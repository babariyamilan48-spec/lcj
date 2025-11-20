"""
Session Singleton Management API
Provides endpoints for monitoring and managing user sessions
"""
import logging
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any

from core.user_session_singleton import get_user_session_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/session-singleton", tags=["Session Management"])


@router.get("/health")
async def session_health() -> Dict[str, Any]:
    """Get session manager health status"""
    try:
        manager = get_user_session_manager()
        active_count = manager.get_active_sessions_count()
        
        status_level = "healthy"
        if active_count > 30:
            status_level = "warning"
        if active_count > 50:
            status_level = "critical"
        
        return {
            "status": status_level,
            "active_sessions": active_count,
            "max_sessions_warning": 30,
            "max_sessions_critical": 50,
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
        manager = get_user_session_manager()
        
        return {
            "active_sessions": manager.get_active_sessions_count(),
            "active_users": manager.get_active_users(),
            "session_details": manager.get_session_info(),
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
        manager = get_user_session_manager()
        manager.force_cleanup_all()
        
        return {
            "status": "success",
            "message": "All sessions cleaned up",
            "active_sessions": manager.get_active_sessions_count()
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
        manager = get_user_session_manager()
        manager.release_user_session(user_id)
        
        return {
            "status": "success",
            "message": f"Session cleaned up for user {user_id}",
            "active_sessions": manager.get_active_sessions_count()
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
        manager = get_user_session_manager()
        
        return {
            "total_active_sessions": manager.get_active_sessions_count(),
            "active_users": manager.get_active_users(),
            "session_details": manager.get_session_info(),
            "timestamp": __import__('datetime').datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting session info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get session information"
        )
