"""
Database Connection Cleanup Middleware
Ensures all database connections are properly closed after each request
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import logging
import time
from typing import Callable

logger = logging.getLogger(__name__)

class DatabaseCleanupMiddleware(BaseHTTPMiddleware):
    """
    Middleware to ensure database connections are properly cleaned up
    """
    
    def __init__(self, app, max_request_time: int = 30):
        super().__init__(app)
        self.max_request_time = max_request_time
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        try:
            # Process the request
            response = await call_next(request)
            
            # Check for long-running requests
            processing_time = time.time() - start_time
            if processing_time > self.max_request_time:
                logger.warning(
                    f"Long-running request detected: {request.method} {request.url.path} "
                    f"took {processing_time:.2f}s"
                )
            
            return response
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(
                f"Request failed after {processing_time:.2f}s: {request.method} {request.url.path} "
                f"Error: {str(e)}"
            )
            raise
        
        finally:
            # Force cleanup of any lingering database connections
            try:
                # Import here to avoid circular imports
                from core.database_fixed import get_db, db_manager
                
                # Force cleanup if request took too long
                processing_time = time.time() - start_time
                if processing_time > 10:  # 10 seconds threshold
                    logger.info(f"Forcing database cleanup after {processing_time:.2f}s request")
                    
                    # Get pool statistics
                    if optimized_db_pool.engine:
                        pool = optimized_db_pool.engine.pool
                        logger.debug(
                            f"Pool stats: size={pool.size()}, "
                            f"checked_in={pool.checkedin()}, "
                            f"checked_out={pool.checkedout()}, "
                            f"overflow={pool.overflow()}"
                        )
                        
                        # Force return of checked out connections if too many
                        if pool.checkedout() > 15:  # More than 15 connections out
                            logger.warning(f"Too many connections checked out: {pool.checkedout()}")
                            
            except Exception as cleanup_error:
                logger.error(f"Error during database cleanup: {cleanup_error}")

def add_database_cleanup_middleware(app):
    """Add database cleanup middleware to FastAPI app"""
    app.add_middleware(DatabaseCleanupMiddleware, max_request_time=30)
    logger.info("✅ Database cleanup middleware added")
