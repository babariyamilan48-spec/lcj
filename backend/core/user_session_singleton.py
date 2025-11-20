"""
User Session Singleton Manager
Ensures only one active Supabase session per user at a time
Guarantees proper session cleanup and prevents connection pool exhaustion
"""
import logging
import threading
import time
from typing import Dict, Optional, Tuple
from contextlib import contextmanager
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from core.database_pool import optimized_db_pool
from core.database_singleton import db_singleton

logger = logging.getLogger(__name__)


class UserSessionSingleton:
    """
    Singleton manager for user sessions
    Ensures only one session per user, with guaranteed cleanup
    """
    
    _instance: Optional['UserSessionSingleton'] = None
    _lock: threading.Lock = threading.Lock()
    
    def __init__(self):
        """Initialize the singleton"""
        self._user_sessions: Dict[str, Tuple[Session, float]] = {}  # user_id -> (session, timestamp)
        self._session_lock = threading.Lock()
        self._cleanup_thread = None
        self._running = False
        logger.info("✅ UserSessionSingleton initialized")
    
    @classmethod
    def get_instance(cls) -> 'UserSessionSingleton':
        """Get singleton instance (thread-safe)"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance
    
    def _cleanup_old_sessions(self):
        """Background task to cleanup old sessions"""
        while self._running:
            try:
                current_time = time.time()
                to_remove = []
                
                with self._session_lock:
                    for user_id, (session, timestamp) in self._user_sessions.items():
                        # Remove sessions older than 5 minutes
                        if current_time - timestamp > 300:
                            try:
                                session.close()
                                to_remove.append(user_id)
                                logger.warning(f"Cleaned up stale session for user {user_id}")
                            except Exception as e:
                                logger.error(f"Error closing stale session for {user_id}: {e}")
                    
                    for user_id in to_remove:
                        del self._user_sessions[user_id]
                
                time.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in cleanup task: {e}")
                time.sleep(30)
    
    def start_cleanup_thread(self):
        """Start background cleanup thread"""
        if not self._running:
            self._running = True
            self._cleanup_thread = threading.Thread(
                target=self._cleanup_old_sessions,
                daemon=True,
                name="SessionCleanupThread"
            )
            self._cleanup_thread.start()
            logger.info("✅ Session cleanup thread started")
    
    def stop_cleanup_thread(self):
        """Stop background cleanup thread"""
        self._running = False
        if self._cleanup_thread:
            self._cleanup_thread.join(timeout=5)
            logger.info("✅ Session cleanup thread stopped")
    
    def _close_existing_session(self, user_id: str) -> None:
        """Close existing session for user if any"""
        with self._session_lock:
            if user_id in self._user_sessions:
                old_session, _ = self._user_sessions[user_id]
                try:
                    old_session.close()
                    logger.debug(f"Closed existing session for user {user_id}")
                except Exception as e:
                    logger.warning(f"Error closing existing session for {user_id}: {e}")
                del self._user_sessions[user_id]
    
    def get_user_session(self, user_id: str) -> Session:
        """
        Get or create a session for a user (singleton per user)
        Ensures only one session exists per user
        """
        with self._session_lock:
            # Check if user already has an active session
            if user_id in self._user_sessions:
                session, timestamp = self._user_sessions[user_id]
                # Update timestamp to keep session alive
                self._user_sessions[user_id] = (session, time.time())
                logger.debug(f"Reusing existing session for user {user_id}")
                return session
            
            # Create new session
            try:
                session = optimized_db_pool.get_session_sync()
                if session is None:
                    logger.warning(f"Optimized pool returned None for user {user_id}, using fallback")
                    session = db_singleton.SessionLocal()
                
                self._user_sessions[user_id] = (session, time.time())
                logger.info(f"Created new session for user {user_id}")
                return session
                
            except Exception as e:
                logger.error(f"Error creating session for user {user_id}: {e}")
                # Fallback to singleton
                try:
                    session = db_singleton.SessionLocal()
                    self._user_sessions[user_id] = (session, time.time())
                    logger.info(f"Created fallback session for user {user_id}")
                    return session
                except Exception as fallback_error:
                    logger.error(f"Failed to create fallback session for {user_id}: {fallback_error}")
                    raise
    
    def release_user_session(self, user_id: str) -> None:
        """
        Release and close session for a user
        MANDATORY: Call this after operations complete
        """
        with self._session_lock:
            if user_id in self._user_sessions:
                session, _ = self._user_sessions[user_id]
                try:
                    session.close()
                    del self._user_sessions[user_id]
                    logger.info(f"Released session for user {user_id}")
                except Exception as e:
                    logger.error(f"Error releasing session for {user_id}: {e}")
    
    @contextmanager
    def user_session_context(self, user_id: str):
        """
        Context manager for user session
        Automatically handles session lifecycle
        """
        session = None
        try:
            session = self.get_user_session(user_id)
            yield session
            # Commit on success
            try:
                session.commit()
                logger.debug(f"Session committed for user {user_id}")
            except Exception as commit_error:
                logger.error(f"Commit error for user {user_id}: {commit_error}")
                session.rollback()
                raise
        except Exception as e:
            logger.error(f"Session error for user {user_id}: {e}")
            if session:
                try:
                    session.rollback()
                except Exception as rollback_error:
                    logger.error(f"Rollback error for user {user_id}: {rollback_error}")
            raise
        finally:
            # Always release the session
            self.release_user_session(user_id)
    
    def get_active_sessions_count(self) -> int:
        """Get count of active sessions"""
        with self._session_lock:
            return len(self._user_sessions)
    
    def get_active_users(self) -> list:
        """Get list of users with active sessions"""
        with self._session_lock:
            return list(self._user_sessions.keys())
    
    def get_session_info(self) -> Dict:
        """Get information about all active sessions"""
        with self._session_lock:
            info = {}
            current_time = time.time()
            for user_id, (session, timestamp) in self._user_sessions.items():
                duration = current_time - timestamp
                info[user_id] = {
                    "duration_seconds": round(duration, 2),
                    "created_at": datetime.fromtimestamp(timestamp).isoformat(),
                    "status": "active"
                }
            return info
    
    def force_cleanup_all(self) -> None:
        """Force cleanup all sessions (emergency only)"""
        with self._session_lock:
            for user_id, (session, _) in self._user_sessions.items():
                try:
                    session.close()
                    logger.warning(f"Force closed session for user {user_id}")
                except Exception as e:
                    logger.error(f"Error force closing session for {user_id}: {e}")
            self._user_sessions.clear()
            logger.warning("All sessions force closed")


# Global singleton instance
_user_session_manager = UserSessionSingleton.get_instance()


def get_user_session_manager() -> UserSessionSingleton:
    """Get the user session manager singleton"""
    return _user_session_manager


def get_user_session(user_id: str) -> Session:
    """Get a session for a user"""
    return _user_session_manager.get_user_session(user_id)


def release_user_session(user_id: str) -> None:
    """Release a user's session"""
    _user_session_manager.release_user_session(user_id)


@contextmanager
def user_session_context(user_id: str):
    """Context manager for user session"""
    with _user_session_manager.user_session_context(user_id) as session:
        yield session
