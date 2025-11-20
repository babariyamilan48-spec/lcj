"""
Database Dependencies with Singleton Session Management
Provides FastAPI dependencies that use the user session singleton
"""
import logging
from typing import Generator, Optional
from functools import lru_cache

from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status

from core.user_session_singleton import (
    get_user_session_manager,
    user_session_context,
    get_user_session,
    release_user_session
)
from core.database_pool import optimized_db_pool
from core.database_singleton import db_singleton

logger = logging.getLogger(__name__)


class DatabaseDependencies:
    """Centralized database dependencies using singleton sessions"""
    
    @staticmethod
    def get_db_session() -> Generator[Session, None, None]:
        """
        FastAPI dependency for general database session
        Uses optimized pool with fallback to singleton
        Ensures proper cleanup to prevent connection leaks
        """
        session = None
        try:
            # Try optimized pool first
            session = optimized_db_pool.get_session_sync()
            if session is None:
                logger.warning("Optimized pool returned None, using fallback")
                session = db_singleton.SessionLocal()
            
            yield session
            
            # Only commit if no exception occurred
            if session.is_active:
                try:
                    session.commit()
                except Exception as commit_error:
                    logger.error(f"Commit error: {commit_error}")
                    session.rollback()
                    raise
            
        except Exception as e:
            logger.error(f"Database session error: {e}")
            if session and session.is_active:
                try:
                    session.rollback()
                except Exception as rollback_error:
                    logger.error(f"Rollback error: {rollback_error}")
            # Don't raise HTTPException here - let FastAPI handle it
            raise
        finally:
            # Always close the session to return connection to pool
            if session:
                try:
                    session.close()
                except Exception as close_error:
                    logger.error(f"Error closing session: {close_error}")
    
    @staticmethod
    def get_user_db_session(user_id: str) -> Generator[Session, None, None]:
        """
        FastAPI dependency for user-specific session
        Uses singleton pattern - only one session per user
        """
        try:
            with user_session_context(user_id) as session:
                yield session
        except Exception as e:
            logger.error(f"User session error for {user_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection error"
            )


# Convenience functions for use in endpoints
def get_db() -> Generator[Session, None, None]:
    """Get general database session"""
    yield from DatabaseDependencies.get_db_session()


def get_user_db(user_id: str):
    """Get user-specific database session - returns a callable dependency"""
    def _get_user_session() -> Generator[Session, None, None]:
        yield from DatabaseDependencies.get_user_db_session(user_id)
    return _get_user_session


# For endpoints with current_user, use this pattern:
# def endpoint(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
#     # The db session will be created, but it won't be user-specific
#     # This is acceptable for authenticated endpoints since current_user provides the user context


# Session manager access
def get_session_manager():
    """Get the session manager singleton"""
    return get_user_session_manager()


# Health check function
def check_session_health() -> dict:
    """Check session manager health"""
    manager = get_user_session_manager()
    return {
        "active_sessions": manager.get_active_sessions_count(),
        "active_users": manager.get_active_users(),
        "session_info": manager.get_session_info(),
        "status": "healthy" if manager.get_active_sessions_count() < 50 else "warning"
    }
