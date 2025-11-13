"""
Database Error Handler Middleware
Handles Supabase connection timeouts and provides automatic recovery
"""

import logging
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.exc import OperationalError, TimeoutError, DisconnectionError
from psycopg2 import OperationalError as Psycopg2OperationalError
from core.database_singleton import db_singleton, reset_db_connection

logger = logging.getLogger(__name__)

class DatabaseErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle database connection errors and provide automatic recovery
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.connection_errors = 0
        self.last_reset_time = 0
        self.reset_cooldown = 30  # 30 seconds between resets
    
    async def dispatch(self, request: Request, call_next):
        """Handle database errors and provide recovery"""
        
        try:
            # Process the request
            response = await call_next(request)
            
            # Reset error counter on successful request
            if response.status_code < 500:
                self.connection_errors = 0
            
            return response
            
        except (OperationalError, TimeoutError, DisconnectionError, Psycopg2OperationalError) as e:
            # Database connection error
            self.connection_errors += 1
            current_time = time.time()
            
            logger.error(f"Database connection error #{self.connection_errors}: {e}")
            
            # Attempt connection reset if not in cooldown
            if (current_time - self.last_reset_time) > self.reset_cooldown:
                try:
                    logger.info("Attempting database connection reset...")
                    reset_db_connection()
                    self.last_reset_time = current_time
                    self.connection_errors = 0
                    logger.info("Database connection reset successful")
                    
                except Exception as reset_error:
                    logger.error(f"Database reset failed: {reset_error}")
            
            # Return appropriate error response
            return Response(
                content='{"detail": "Database connection temporarily unavailable. Please try again in a moment."}',
                status_code=503,
                headers={"Content-Type": "application/json"}
            )
            
        except Exception as e:
            # Other errors - let them propagate normally
            logger.error(f"Non-database error in middleware: {e}")
            raise

class DatabaseHealthMonitor:
    """
    Monitor database health and provide recovery suggestions
    """
    
    def __init__(self):
        self.health_checks = []
        self.max_history = 10
    
    def check_health(self) -> dict:
        """Perform health check and store result"""
        try:
            health_result = db_singleton.health_check()
            
            # Add timestamp
            health_result['timestamp'] = time.time()
            
            # Store in history
            self.health_checks.append(health_result)
            if len(self.health_checks) > self.max_history:
                self.health_checks.pop(0)
            
            return health_result
            
        except Exception as e:
            error_result = {
                'status': 'error',
                'error': str(e),
                'timestamp': time.time()
            }
            
            self.health_checks.append(error_result)
            if len(self.health_checks) > self.max_history:
                self.health_checks.pop(0)
            
            return error_result
    
    def get_health_summary(self) -> dict:
        """Get summary of recent health checks"""
        if not self.health_checks:
            return {"status": "no_data", "message": "No health checks performed yet"}
        
        recent_checks = self.health_checks[-5:]  # Last 5 checks
        healthy_count = sum(1 for check in recent_checks if check.get('status') == 'healthy')
        
        return {
            "recent_checks": len(recent_checks),
            "healthy_count": healthy_count,
            "health_percentage": (healthy_count / len(recent_checks)) * 100,
            "last_check": recent_checks[-1],
            "trend": "improving" if healthy_count >= len(recent_checks) // 2 else "degrading"
        }

# Global health monitor instance
health_monitor = DatabaseHealthMonitor()

def get_database_health() -> dict:
    """Get current database health"""
    return health_monitor.check_health()

def get_database_health_summary() -> dict:
    """Get database health summary"""
    return health_monitor.get_health_summary()
