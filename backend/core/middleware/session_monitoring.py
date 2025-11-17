"""
Session Monitoring Middleware
Tracks database session usage and prevents session leaks
"""

import logging
import time
import threading
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Any
from core.session_manager import session_manager

logger = logging.getLogger(__name__)

class SessionMonitoringMiddleware(BaseHTTPMiddleware):
    """
    Middleware to monitor database session usage and prevent leaks
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.request_counter = 0
        self.session_warnings = 0
        self.cleanup_threshold = 100  # Cleanup after every 100 requests
        self.warning_threshold = 5    # Warn if more than 5 long-running sessions
        self._lock = threading.Lock()
    
    async def dispatch(self, request: Request, call_next):
        """Monitor session usage during request processing"""
        
        with self._lock:
            self.request_counter += 1
            current_request = self.request_counter
        
        # Get initial session stats
        initial_stats = session_manager.get_session_stats()
        start_time = time.time()
        
        # Extract user info from request if available
        user_id = self._extract_user_id(request)
        endpoint = f"{request.method} {request.url.path}"
        
        try:
            # Process the request
            response = await call_next(request)
            
            # Get final session stats
            final_stats = session_manager.get_session_stats()
            request_duration = time.time() - start_time
            
            # Check for session leaks
            session_leak_detected = (
                final_stats['total_active_sessions'] > initial_stats['total_active_sessions']
            )
            
            # Log session usage
            if session_leak_detected or request_duration > 5.0:
                logger.warning(
                    f"Session monitoring alert - Request #{current_request}: "
                    f"endpoint={endpoint}, user={user_id}, duration={request_duration:.2f}s, "
                    f"sessions_before={initial_stats['total_active_sessions']}, "
                    f"sessions_after={final_stats['total_active_sessions']}"
                )
                
                if session_leak_detected:
                    self.session_warnings += 1
            
            # Periodic cleanup
            if current_request % self.cleanup_threshold == 0:
                await self._periodic_cleanup(current_request, final_stats)
            
            # Add session info to response headers (for debugging)
            if response:
                response.headers["X-Session-Count"] = str(final_stats['total_active_sessions'])
                response.headers["X-Request-Duration"] = f"{request_duration:.3f}"
                
                if session_leak_detected:
                    response.headers["X-Session-Leak-Warning"] = "true"
            
            return response
            
        except Exception as e:
            # Get final session stats even on error
            final_stats = session_manager.get_session_stats()
            request_duration = time.time() - start_time
            
            logger.error(
                f"Request error with session monitoring - Request #{current_request}: "
                f"endpoint={endpoint}, user={user_id}, duration={request_duration:.2f}s, "
                f"active_sessions={final_stats['total_active_sessions']}, error={e}"
            )
            
            # Force cleanup on error if too many sessions
            if final_stats['total_active_sessions'] > 10:
                logger.warning(f"Force cleaning up sessions due to error and high session count")
                session_manager.cleanup_all_sessions()
            
            raise
    
    def _extract_user_id(self, request: Request) -> str:
        """Extract user ID from request for monitoring"""
        try:
            # Try to get user ID from path parameters
            if hasattr(request, 'path_params') and 'user_id' in request.path_params:
                return request.path_params['user_id']
            
            # Try to get from query parameters
            if 'user_id' in request.query_params:
                return request.query_params['user_id']
            
            # Try to extract from path
            path_parts = request.url.path.split('/')
            for i, part in enumerate(path_parts):
                if part in ['users', 'user', 'results'] and i + 1 < len(path_parts):
                    potential_user_id = path_parts[i + 1]
                    # Basic UUID validation
                    if len(potential_user_id) == 36 and '-' in potential_user_id:
                        return potential_user_id
            
            return "unknown"
            
        except Exception:
            return "unknown"
    
    async def _periodic_cleanup(self, request_number: int, session_stats: Dict[str, Any]):
        """Perform periodic session cleanup"""
        try:
            active_sessions = session_stats['total_active_sessions']
            long_running = session_stats['long_running_sessions']
            
            logger.info(
                f"Periodic session check - Request #{request_number}: "
                f"active_sessions={active_sessions}, long_running={long_running}, "
                f"warnings={self.session_warnings}"
            )
            
            # Cleanup if too many sessions or warnings
            if active_sessions > 15 or long_running > self.warning_threshold:
                logger.warning(
                    f"Performing session cleanup - active={active_sessions}, "
                    f"long_running={long_running}"
                )
                session_manager.cleanup_all_sessions()
                self.session_warnings = 0  # Reset warning counter
            
            # Log session distribution by user
            sessions_by_user = session_stats.get('sessions_by_user', {})
            if sessions_by_user:
                user_session_counts = {
                    user: count for user, count in sessions_by_user.items() 
                    if count > 1  # Only log users with multiple sessions
                }
                
                if user_session_counts:
                    logger.info(f"Users with multiple sessions: {user_session_counts}")
                    
                    # Force cleanup for users with too many sessions
                    for user_id, count in user_session_counts.items():
                        if count > 3:  # More than 3 sessions per user
                            logger.warning(f"Force cleaning sessions for user {user_id} (count: {count})")
                            session_manager.force_close_user_sessions(user_id)
            
        except Exception as e:
            logger.error(f"Error during periodic cleanup: {e}")

class SessionHealthMonitor:
    """
    Background session health monitor
    """
    
    def __init__(self):
        self.monitoring_enabled = True
        self.check_interval = 60  # Check every minute
        self.last_check = 0
        self.health_history = []
        self.max_history = 20
    
    def check_session_health(self) -> Dict[str, Any]:
        """Check session health and return status"""
        try:
            current_time = time.time()
            
            # Don't check too frequently
            if current_time - self.last_check < self.check_interval:
                return {"status": "skipped", "reason": "too_frequent"}
            
            self.last_check = current_time
            
            # Get session stats
            stats = session_manager.get_session_stats()
            
            # Determine health status
            health_status = "healthy"
            issues = []
            recommendations = []
            
            # Check for issues
            if stats['total_active_sessions'] > 20:
                health_status = "critical"
                issues.append(f"Too many active sessions: {stats['total_active_sessions']}")
                recommendations.append("Consider emergency session cleanup")
            elif stats['total_active_sessions'] > 10:
                health_status = "warning"
                issues.append(f"High number of active sessions: {stats['total_active_sessions']}")
                recommendations.append("Monitor session usage closely")
            
            if stats['long_running_sessions'] > 5:
                health_status = "warning" if health_status == "healthy" else health_status
                issues.append(f"Long-running sessions detected: {stats['long_running_sessions']}")
                recommendations.append("Check for session leaks in application code")
            
            if stats['average_session_age'] > 300:  # More than 5 minutes average
                health_status = "warning" if health_status == "healthy" else health_status
                issues.append(f"High average session age: {stats['average_session_age']:.1f}s")
                recommendations.append("Review session lifecycle management")
            
            # Check for users with too many sessions
            sessions_by_user = stats.get('sessions_by_user', {})
            problematic_users = {
                user: count for user, count in sessions_by_user.items() 
                if count > 2
            }
            
            if problematic_users:
                health_status = "warning" if health_status == "healthy" else health_status
                issues.append(f"Users with multiple sessions: {len(problematic_users)}")
                recommendations.append("Review user session isolation")
            
            health_report = {
                "status": health_status,
                "timestamp": current_time,
                "stats": stats,
                "issues": issues,
                "recommendations": recommendations,
                "problematic_users": problematic_users
            }
            
            # Store in history
            self.health_history.append(health_report)
            if len(self.health_history) > self.max_history:
                self.health_history.pop(0)
            
            # Log health status
            if health_status != "healthy":
                logger.warning(f"Session health check: {health_status} - {len(issues)} issues found")
                for issue in issues:
                    logger.warning(f"  - {issue}")
            else:
                logger.debug(f"Session health check: healthy - {stats['total_active_sessions']} active sessions")
            
            return health_report
            
        except Exception as e:
            error_report = {
                "status": "error",
                "timestamp": time.time(),
                "error": str(e)
            }
            
            logger.error(f"Session health check failed: {e}")
            return error_report
    
    def get_health_summary(self) -> Dict[str, Any]:
        """Get summary of recent health checks"""
        if not self.health_history:
            return {"status": "no_data", "message": "No health checks performed yet"}
        
        recent_checks = self.health_history[-5:]  # Last 5 checks
        healthy_count = sum(1 for check in recent_checks if check.get('status') == 'healthy')
        
        return {
            "recent_checks": len(recent_checks),
            "healthy_count": healthy_count,
            "health_percentage": (healthy_count / len(recent_checks)) * 100,
            "last_check": recent_checks[-1],
            "trend": "improving" if healthy_count >= len(recent_checks) // 2 else "degrading",
            "total_history": len(self.health_history)
        }
    
    def force_health_check(self) -> Dict[str, Any]:
        """Force an immediate health check"""
        self.last_check = 0  # Reset to force check
        return self.check_session_health()

# Global session health monitor
session_health_monitor = SessionHealthMonitor()

# Health check functions for API endpoints
def get_session_monitoring_health() -> Dict[str, Any]:
    """Get session monitoring health status"""
    return session_health_monitor.check_session_health()

def get_session_monitoring_summary() -> Dict[str, Any]:
    """Get session monitoring summary"""
    return session_health_monitor.get_health_summary()

def force_session_health_check() -> Dict[str, Any]:
    """Force session health check"""
    return session_health_monitor.force_health_check()
