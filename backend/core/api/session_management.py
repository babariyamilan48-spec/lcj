"""
Session Management API Endpoints
Provides monitoring and control over database sessions
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any, List
import logging
import time

from core.session_manager import (
    session_manager, 
    get_session_health, 
    cleanup_sessions, 
    force_close_user_sessions
)
from core.middleware.session_monitoring import (
    session_health_monitor,
    get_session_monitoring_health,
    get_session_monitoring_summary,
    force_session_health_check
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/session-management", tags=["Session Management"])

@router.get("/health")
async def get_session_health_status() -> Dict[str, Any]:
    """
    Get comprehensive session health status
    """
    try:
        # Get session manager health
        session_health = get_session_health()
        
        # Get monitoring health
        monitoring_health = get_session_monitoring_health()
        
        # Get monitoring summary
        monitoring_summary = get_session_monitoring_summary()
        
        # Combine all health data
        combined_health = {
            "timestamp": time.time(),
            "session_manager": session_health,
            "monitoring": monitoring_health,
            "summary": monitoring_summary,
            "overall_status": "healthy"
        }
        
        # Determine overall status
        if (session_health.get("status") != "healthy" or 
            monitoring_health.get("status") not in ["healthy", "skipped"]):
            combined_health["overall_status"] = "warning"
        
        if monitoring_health.get("status") == "critical":
            combined_health["overall_status"] = "critical"
        
        return combined_health
        
    except Exception as e:
        logger.error(f"Error getting session health: {e}")
        return {
            "timestamp": time.time(),
            "overall_status": "error",
            "error": str(e)
        }

@router.get("/stats")
async def get_session_stats() -> Dict[str, Any]:
    """
    Get detailed session statistics
    """
    try:
        stats = session_manager.get_session_stats()
        
        # Add additional metadata
        enhanced_stats = {
            **stats,
            "timestamp": time.time(),
            "monitoring_enabled": True,
            "session_manager_type": "centralized"
        }
        
        return enhanced_stats
        
    except Exception as e:
        logger.error(f"Error getting session stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve session statistics")

@router.post("/cleanup")
async def emergency_cleanup_all_sessions(
    background_tasks: BackgroundTasks
) -> Dict[str, str]:
    """
    Emergency cleanup of all active sessions
    Use with caution - will close all database sessions
    """
    try:
        # Get stats before cleanup
        before_stats = session_manager.get_session_stats()
        
        # Perform cleanup
        cleanup_sessions()
        
        # Get stats after cleanup
        after_stats = session_manager.get_session_stats()
        
        logger.warning(
            f"Emergency session cleanup performed - "
            f"sessions_before={before_stats['total_active_sessions']}, "
            f"sessions_after={after_stats['total_active_sessions']}"
        )
        
        # Background task to monitor recovery
        background_tasks.add_task(
            _monitor_cleanup_recovery,
            before_stats['total_active_sessions']
        )
        
        return {
            "status": "success",
            "message": f"Cleaned up {before_stats['total_active_sessions']} sessions",
            "sessions_before": str(before_stats['total_active_sessions']),
            "sessions_after": str(after_stats['total_active_sessions'])
        }
        
    except Exception as e:
        logger.error(f"Error during emergency cleanup: {e}")
        raise HTTPException(status_code=500, detail="Failed to cleanup sessions")

@router.post("/cleanup/{user_id}")
async def cleanup_user_sessions(
    user_id: str,
    background_tasks: BackgroundTasks
) -> Dict[str, str]:
    """
    Force cleanup of all sessions for a specific user
    """
    try:
        # Validate user_id format (basic validation)
        if not user_id or len(user_id) < 10:
            raise HTTPException(
                status_code=400,
                detail="Invalid user_id format"
            )
        
        # Get stats before cleanup
        before_stats = session_manager.get_session_stats()
        user_sessions_before = before_stats.get('sessions_by_user', {}).get(user_id, 0)
        
        # Perform user-specific cleanup
        force_close_user_sessions(user_id)
        
        # Get stats after cleanup
        after_stats = session_manager.get_session_stats()
        user_sessions_after = after_stats.get('sessions_by_user', {}).get(user_id, 0)
        
        logger.info(
            f"User session cleanup performed for {user_id} - "
            f"user_sessions_before={user_sessions_before}, "
            f"user_sessions_after={user_sessions_after}"
        )
        
        # Background task to monitor user session recovery
        background_tasks.add_task(
            _monitor_user_session_recovery,
            user_id,
            user_sessions_before
        )
        
        return {
            "status": "success",
            "message": f"Cleaned up {user_sessions_before} sessions for user {user_id}",
            "user_id": user_id,
            "sessions_before": str(user_sessions_before),
            "sessions_after": str(user_sessions_after)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cleaning up sessions for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to cleanup user sessions")

@router.get("/monitor/history")
async def get_monitoring_history() -> Dict[str, Any]:
    """
    Get session monitoring history
    """
    try:
        summary = get_session_monitoring_summary()
        return summary
        
    except Exception as e:
        logger.error(f"Error getting monitoring history: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve monitoring history")

@router.post("/monitor/force-check")
async def force_monitoring_check() -> Dict[str, Any]:
    """
    Force an immediate session health check
    """
    try:
        health_check = force_session_health_check()
        return health_check
        
    except Exception as e:
        logger.error(f"Error forcing health check: {e}")
        raise HTTPException(status_code=500, detail="Failed to perform health check")

@router.get("/users/{user_id}/sessions")
async def get_user_session_info(user_id: str) -> Dict[str, Any]:
    """
    Get session information for a specific user
    """
    try:
        # Validate user_id format
        if not user_id or len(user_id) < 10:
            raise HTTPException(
                status_code=400,
                detail="Invalid user_id format"
            )
        
        # Get overall stats
        stats = session_manager.get_session_stats()
        
        # Extract user-specific information
        user_sessions = stats.get('sessions_by_user', {}).get(user_id, 0)
        
        user_info = {
            "user_id": user_id,
            "active_sessions": user_sessions,
            "total_system_sessions": stats['total_active_sessions'],
            "timestamp": time.time()
        }
        
        # Add recommendations
        if user_sessions > 2:
            user_info["warning"] = f"User has {user_sessions} active sessions"
            user_info["recommendation"] = "Consider session cleanup"
        elif user_sessions == 0:
            user_info["status"] = "No active sessions"
        else:
            user_info["status"] = "Normal session usage"
        
        return user_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user session info for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user session information")

@router.get("/alerts")
async def get_session_alerts() -> Dict[str, Any]:
    """
    Get current session alerts and warnings
    """
    try:
        # Get current health status
        health = get_session_health()
        monitoring = get_session_monitoring_health()
        
        alerts = []
        warnings = []
        
        # Check session manager alerts
        if health.get("status") == "error":
            alerts.append({
                "type": "session_manager_error",
                "message": "Session manager is experiencing errors",
                "details": health.get("error", "Unknown error")
            })
        elif health.get("status") == "warning":
            for issue in health.get("issues", []):
                warnings.append({
                    "type": "session_manager_warning",
                    "message": issue
                })
        
        # Check monitoring alerts
        if monitoring.get("status") == "critical":
            alerts.append({
                "type": "session_monitoring_critical",
                "message": "Critical session monitoring alert",
                "details": monitoring.get("issues", [])
            })
        elif monitoring.get("status") == "warning":
            for issue in monitoring.get("issues", []):
                warnings.append({
                    "type": "session_monitoring_warning",
                    "message": issue
                })
        
        return {
            "timestamp": time.time(),
            "alerts": alerts,
            "warnings": warnings,
            "total_alerts": len(alerts),
            "total_warnings": len(warnings),
            "status": "critical" if alerts else ("warning" if warnings else "healthy")
        }
        
    except Exception as e:
        logger.error(f"Error getting session alerts: {e}")
        return {
            "timestamp": time.time(),
            "status": "error",
            "error": str(e),
            "alerts": [],
            "warnings": []
        }

# Background task functions
async def _monitor_cleanup_recovery(sessions_cleaned: int):
    """Monitor system recovery after emergency cleanup"""
    try:
        import asyncio
        
        # Wait a bit for system to stabilize
        await asyncio.sleep(5)
        
        # Check recovery
        stats = session_manager.get_session_stats()
        
        logger.info(
            f"Post-cleanup recovery check - "
            f"sessions_cleaned={sessions_cleaned}, "
            f"current_sessions={stats['total_active_sessions']}"
        )
        
        # Alert if sessions are building up too quickly
        if stats['total_active_sessions'] > sessions_cleaned * 0.5:
            logger.warning(
                f"Sessions building up quickly after cleanup - "
                f"current={stats['total_active_sessions']}, "
                f"cleaned={sessions_cleaned}"
            )
        
    except Exception as e:
        logger.error(f"Error monitoring cleanup recovery: {e}")

async def _monitor_user_session_recovery(user_id: str, sessions_cleaned: int):
    """Monitor user session recovery after cleanup"""
    try:
        import asyncio
        
        # Wait a bit for system to stabilize
        await asyncio.sleep(3)
        
        # Check user session recovery
        stats = session_manager.get_session_stats()
        current_user_sessions = stats.get('sessions_by_user', {}).get(user_id, 0)
        
        logger.info(
            f"Post-cleanup user recovery check for {user_id} - "
            f"sessions_cleaned={sessions_cleaned}, "
            f"current_sessions={current_user_sessions}"
        )
        
        # Alert if user sessions are building up again
        if current_user_sessions > 2:
            logger.warning(
                f"User {user_id} sessions building up after cleanup - "
                f"current={current_user_sessions}"
            )
        
    except Exception as e:
        logger.error(f"Error monitoring user session recovery for {user_id}: {e}")
