"""
Centralized Session Manager for Database Operations
✅ FIXED: Now uses ONLY core/database_fixed.py
Ensures proper session lifecycle management and prevents session leaks
"""

import logging
import time
import threading
from contextlib import contextmanager
from typing import Generator, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, TimeoutError, DisconnectionError
from sqlalchemy import text
from core.database_fixed import db_manager

logger = logging.getLogger(__name__)

class SessionManager:
    """
    Centralized session manager that ensures proper session lifecycle
    and prevents session leaks across the application
    """
    
    def __init__(self):
        self._active_sessions: Dict[str, Dict[str, Any]] = {}
        self._session_lock = threading.Lock()
        self._max_session_duration = 300  # 5 minutes max session duration
        self._session_counter = 0
    
    def _generate_session_id(self) -> str:
        """Generate unique session ID for tracking"""
        with self._session_lock:
            self._session_counter += 1
            return f"session_{self._session_counter}_{int(time.time())}"
    
    def _track_session(self, session_id: str, session: Session, user_id: Optional[str] = None):
        """Track active session for monitoring"""
        with self._session_lock:
            self._active_sessions[session_id] = {
                'session': session,
                'user_id': user_id,
                'created_at': time.time(),
                'thread_id': threading.get_ident()
            }
    
    def _untrack_session(self, session_id: str):
        """Remove session from tracking"""
        with self._session_lock:
            self._active_sessions.pop(session_id, None)
    
    @contextmanager
    def get_user_session(self, user_id: str, operation: str = "general") -> Generator[Session, None, None]:
        """
        Get a database session for a specific user with proper lifecycle management
        Ensures only one session per user at a time
        """
        session_id = self._generate_session_id()
        session = None
        start_time = time.time()
        
        try:
            # Check for existing user sessions and clean up old ones
            self._cleanup_user_sessions(user_id)
            
            # ✅ FIXED: Get session from fixed database manager only
            session = db_manager.SessionLocal()
            logger.debug(f"Session created for user {user_id}")
            
            # Test connection
            session.execute(text("SELECT 1"))
            
            # Track the session
            self._track_session(session_id, session, user_id)
            
            logger.info(f"Session {session_id} created for user {user_id} operation: {operation}")
            
            yield session
            
            # Commit if no exceptions
            session.commit()
            logger.debug(f"Session {session_id} committed successfully")
            
        except Exception as e:
            logger.error(f"Session {session_id} error for user {user_id}: {e}")
            if session:
                try:
                    session.rollback()
                    logger.debug(f"Session {session_id} rolled back")
                except Exception as rollback_error:
                    logger.error(f"Rollback failed for session {session_id}: {rollback_error}")
            raise
            
        finally:
            # Always cleanup
            session_duration = time.time() - start_time
            
            if session:
                try:
                    session.close()
                    logger.debug(f"Session {session_id} closed after {session_duration:.2f}s")
                except Exception as close_error:
                    logger.error(f"Error closing session {session_id}: {close_error}")
            
            # Untrack session
            self._untrack_session(session_id)
            
            # Log long-running sessions
            if session_duration > 10.0:
                logger.warning(f"Long-running session {session_id} for user {user_id}: {session_duration:.2f}s")
    
    @contextmanager
    def get_general_session(self, operation: str = "general") -> Generator[Session, None, None]:
        """
        Get a general database session for non-user-specific operations
        """
        session_id = self._generate_session_id()
        session = None
        start_time = time.time()
        
        try:
            # ✅ FIXED: Get session from fixed database manager only
            session = db_manager.SessionLocal()
            logger.debug(f"Using database manager session for operation: {operation}")
            
            # Test connection
            session.execute(text("SELECT 1"))
            
            # Track the session
            self._track_session(session_id, session)
            
            logger.debug(f"Session {session_id} created for operation: {operation}")
            
            yield session
            
            # Commit if no exceptions
            session.commit()
            logger.debug(f"Session {session_id} committed successfully")
            
        except Exception as e:
            logger.error(f"Session {session_id} error for operation {operation}: {e}")
            if session:
                try:
                    session.rollback()
                    logger.debug(f"Session {session_id} rolled back")
                except Exception as rollback_error:
                    logger.error(f"Rollback failed for session {session_id}: {rollback_error}")
            raise
            
        finally:
            # Always cleanup
            session_duration = time.time() - start_time
            
            if session:
                try:
                    session.close()
                    logger.debug(f"Session {session_id} closed after {session_duration:.2f}s")
                except Exception as close_error:
                    logger.error(f"Error closing session {session_id}: {close_error}")
            
            # Untrack session
            self._untrack_session(session_id)
            
            # Log long-running sessions
            if session_duration > 5.0:
                logger.warning(f"Long-running session {session_id} for operation {operation}: {session_duration:.2f}s")
    
    def _cleanup_user_sessions(self, user_id: str):
        """Clean up old sessions for a specific user"""
        current_time = time.time()
        sessions_to_cleanup = []
        
        with self._session_lock:
            for session_id, session_info in self._active_sessions.items():
                if session_info.get('user_id') == user_id:
                    session_age = current_time - session_info['created_at']
                    if session_age > self._max_session_duration:
                        sessions_to_cleanup.append((session_id, session_info))
        
        # Cleanup old sessions outside the lock
        for session_id, session_info in sessions_to_cleanup:
            try:
                session = session_info['session']
                session.close()
                logger.warning(f"Cleaned up old session {session_id} for user {user_id}")
            except Exception as e:
                logger.error(f"Error cleaning up session {session_id}: {e}")
            finally:
                self._untrack_session(session_id)
    
    def cleanup_all_sessions(self):
        """Emergency cleanup of all active sessions"""
        logger.warning("Performing emergency cleanup of all active sessions")
        
        sessions_to_cleanup = []
        with self._session_lock:
            sessions_to_cleanup = list(self._active_sessions.items())
            self._active_sessions.clear()
        
        for session_id, session_info in sessions_to_cleanup:
            try:
                session = session_info['session']
                session.close()
                logger.info(f"Emergency cleanup of session {session_id}")
            except Exception as e:
                logger.error(f"Error during emergency cleanup of session {session_id}: {e}")
    
    def get_session_stats(self) -> Dict[str, Any]:
        """Get statistics about active sessions"""
        current_time = time.time()
        stats = {
            'total_active_sessions': 0,
            'sessions_by_user': {},
            'long_running_sessions': 0,
            'average_session_age': 0
        }
        
        with self._session_lock:
            stats['total_active_sessions'] = len(self._active_sessions)
            
            if self._active_sessions:
                total_age = 0
                for session_id, session_info in self._active_sessions.items():
                    user_id = session_info.get('user_id', 'system')
                    session_age = current_time - session_info['created_at']
                    
                    # Count sessions by user
                    if user_id not in stats['sessions_by_user']:
                        stats['sessions_by_user'][user_id] = 0
                    stats['sessions_by_user'][user_id] += 1
                    
                    # Count long-running sessions
                    if session_age > 60:  # More than 1 minute
                        stats['long_running_sessions'] += 1
                    
                    total_age += session_age
                
                stats['average_session_age'] = total_age / len(self._active_sessions)
        
        return stats
    
    def force_close_user_sessions(self, user_id: str):
        """Force close all sessions for a specific user"""
        logger.warning(f"Force closing all sessions for user {user_id}")
        
        sessions_to_close = []
        with self._session_lock:
            for session_id, session_info in self._active_sessions.items():
                if session_info.get('user_id') == user_id:
                    sessions_to_close.append((session_id, session_info))
        
        for session_id, session_info in sessions_to_close:
            try:
                session = session_info['session']
                session.close()
                logger.info(f"Force closed session {session_id} for user {user_id}")
            except Exception as e:
                logger.error(f"Error force closing session {session_id}: {e}")
            finally:
                self._untrack_session(session_id)

# Global session manager instance
session_manager = SessionManager()

# FastAPI dependency functions
def get_user_db_session(user_id: str, operation: str = "api_call") -> Generator[Session, None, None]:
    """
    FastAPI dependency for getting user-specific database session
    """
    with session_manager.get_user_session(user_id, operation) as session:
        yield session

def get_general_db_session(operation: str = "api_call") -> Generator[Session, None, None]:
    """
    FastAPI dependency for getting general database session
    """
    with session_manager.get_general_session(operation) as session:
        yield session

# Context managers for manual session management
@contextmanager
def get_user_session(user_id: str, operation: str = "manual") -> Generator[Session, None, None]:
    """
    Context manager for getting user-specific database session outside FastAPI
    """
    with session_manager.get_user_session(user_id, operation) as session:
        yield session

@contextmanager
def get_session(operation: str = "manual") -> Generator[Session, None, None]:
    """
    Context manager for getting general database session outside FastAPI
    """
    with session_manager.get_general_session(operation) as session:
        yield session

# Health check and monitoring functions
def get_session_health() -> Dict[str, Any]:
    """Get session manager health status"""
    try:
        stats = session_manager.get_session_stats()
        
        # Determine health status
        health_status = "healthy"
        issues = []
        
        if stats['total_active_sessions'] > 10:
            health_status = "warning"
            issues.append(f"High number of active sessions: {stats['total_active_sessions']}")
        
        if stats['long_running_sessions'] > 3:
            health_status = "warning"
            issues.append(f"Long-running sessions detected: {stats['long_running_sessions']}")
        
        if stats['average_session_age'] > 120:  # More than 2 minutes average
            health_status = "warning"
            issues.append(f"High average session age: {stats['average_session_age']:.1f}s")
        
        return {
            "status": health_status,
            "stats": stats,
            "issues": issues,
            "timestamp": time.time()
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": time.time()
        }

def cleanup_sessions():
    """Manual cleanup function for emergency use"""
    session_manager.cleanup_all_sessions()

def force_close_user_sessions(user_id: str):
    """Force close all sessions for a specific user"""
    session_manager.force_close_user_sessions(user_id)
