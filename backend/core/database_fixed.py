"""
FIXED Database Connection Manager - Single Source of Truth
Optimized for Supabase 30-connection limit
Prevents connection leaks and ensures proper cleanup
"""

import os
import logging
import time
from contextlib import contextmanager
from typing import Generator, Optional
from sqlalchemy import create_engine, event, text, Engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import OperationalError, TimeoutError
import threading

logger = logging.getLogger(__name__)

class DatabaseManager:
    """
    Singleton database connection manager optimized for Supabase
    CRITICAL: This is the ONLY database engine instance in the application
    """
    
    _instance: Optional['DatabaseManager'] = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self.engine: Optional[Engine] = None
        self.SessionLocal: Optional[sessionmaker] = None
        self._setup_database()
        self._initialized = True
    
    def _setup_database(self):
        """Setup optimized database engine for Supabase"""
        try:
            database_url = os.getenv("DATABASE_URL")
            if not database_url:
                raise ValueError("DATABASE_URL environment variable not found")
            
            pass  # Database initialization
            
            # CRITICAL: Supabase has 30-connection limit
            # EMERGENCY FIX: Currently at 27/30 connections (90% capacity)
            # Reducing to 3 + 2 = 5 total per service to leave safety margin
            self.engine = create_engine(
                database_url,
                
                # OPTIMIZED CONNECTION POOL SETTINGS FOR SUPABASE - PHASE 2 OPTIMIZATION
                poolclass=QueuePool,
                pool_size=7,             # Base connections (optimized for Supabase 30 limit)
                max_overflow=3,          # Additional connections when needed
                pool_timeout=13,          # REDUCED: 5 second timeout for faster failure detection
                pool_recycle=300,        # Recycle connections every 5 minutes
                pool_pre_ping=True,      # Validate connections before use
                
                # CONNECTION SETTINGS - OPTIMIZED FOR SUPABASE
                connect_args={
                    "connect_timeout": 15,  # 15 second connection timeout
                    "application_name": "lcj_backend_fixed",
                    "options": (
                        "-c statement_timeout=10000 "  # 10 second query timeout (was 30s)
                        "-c lock_timeout=8000 "  # 8 second lock timeout
                        "-c idle_in_transaction_session_timeout=30000 "  # 30 second idle timeout (was 120s)
                        "-c tcp_keepalives_idle=60 "  # TCP keepalive every 60s
                        "-c tcp_keepalives_interval=10 "
                        "-c tcp_keepalives_count=5"
                    )
                },
                
                # ✅ ENGINE SETTINGS
                echo=False,  # Set to True for SQL debugging
                future=True,  # Use SQLAlchemy 2.0 features
                isolation_level="READ_COMMITTED"  # Optimal for most operations
            )
            
            # Setup connection event listeners
            self._setup_connection_events()
            
            # Create session factory
            self.SessionLocal = sessionmaker(
                bind=self.engine,
                autocommit=False,
                autoflush=False,
                expire_on_commit=False,  # Keep objects accessible after commit
                class_=Session
            )
            
            # ✅ CRITICAL FIX: Defer connection test to first request
            # Do NOT test connection at module import time - this causes timeout errors
            # The connection will be tested on first use via pool_pre_ping=True
            logger.info("✅ Database engine created successfully (connection test deferred to first use)")
            
        except Exception as e:
            raise
    
    def _setup_connection_events(self):
        """Setup connection event listeners for monitoring and optimization"""
        
        @event.listens_for(self.engine, "connect")
        def set_connection_settings(dbapi_connection, connection_record):
            """Set connection-level settings for Supabase optimization"""
            try:
                with dbapi_connection.cursor() as cursor:
                    # Set optimal timeouts for Supabase
                    cursor.execute("SET statement_timeout = '15s'")  # 10 second query timeout
                    cursor.execute("SET lock_timeout = '8s'")        # 8 second lock timeout
                    cursor.execute("SET idle_in_transaction_session_timeout = '30s'")  # 30 second idle timeout
                    
                    # TCP keepalive settings for stable connections
                    cursor.execute("SET tcp_keepalives_idle = '60'")
                    cursor.execute("SET tcp_keepalives_interval = '10'")
                    cursor.execute("SET tcp_keepalives_count = '5'")
                    
                    # Connection-level optimizations
                    cursor.execute("SET default_transaction_isolation = 'read committed'")
                    cursor.execute("SET timezone = 'UTC'")
                    
                pass
                
            except Exception as e:
                pass
        
        @event.listens_for(self.engine, "reset")
        def reset_connection_handler(dbapi_connection, connection_record):
            """Handle connection reset - suppress errors when server closes connection"""
            try:
                # Try to rollback any pending transaction
                dbapi_connection.rollback()
            except Exception as e:
                # Suppress errors during reset - connection may already be closed by server
                # This is normal when Supabase closes idle connections
                logger.debug(f"Connection reset error (expected for closed connections): {type(e).__name__}")
                pass
        
        @event.listens_for(self.engine, "close")
        def close_connection_handler(dbapi_connection, connection_record):
            """Handle connection close - ensure proper cleanup"""
            try:
                # ✅ CRITICAL FIX: Ensure connection is properly closed
                # This prevents SSL connection leaks
                if not dbapi_connection.closed:
                    dbapi_connection.close()
            except Exception as e:
                # Connection may already be closed
                logger.debug(f"Connection close error (expected): {type(e).__name__}")
                pass
        
        @event.listens_for(self.engine, "checkout")
        def log_checkout(dbapi_connection, connection_record, connection_proxy):
            """Log connection checkout with timestamp"""
            connection_record.info['checkout_time'] = time.time()
            connection_record.info['checkout_id'] = id(connection_record)
            pass
        
        @event.listens_for(self.engine, "checkin")
        def log_checkin(dbapi_connection, connection_record):
            """Log connection checkin and usage time"""
            if 'checkout_time' in connection_record.info:
                checkout_time = connection_record.info.pop('checkout_time')
                usage_time = time.time() - checkout_time
                checkout_id = connection_record.info.pop('checkout_id', 'unknown')
                
                if usage_time > 10.0:  # Log long-running connections
                    pass
                elif usage_time > 5.0:
                    pass
                else:
                    pass
    
    def _test_connection(self):
        """Test database connection"""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT 1")).scalar()
                if result != 1:
                    raise RuntimeError("Database test query failed")
                    
            pass
            
        except Exception as e:
            raise
    
    @contextmanager
    def get_session(self) -> Generator[Session, None, None]:
        """
        Get a database session with proper error handling and cleanup
        CRITICAL: This ALWAYS closes the session in finally block
        """
        if not self.SessionLocal:
            raise RuntimeError("Database not initialized")
        
        session = self.SessionLocal()
        session_id = id(session)
        start_time = time.time()
        session_closed = False
        
        pass
        
        try:
            yield session
            
            # Only commit if session is still active
            if session and session.is_active:
                try:
                    session.commit()
                    pass
                except Exception as commit_error:
                    # ✅ CRITICAL FIX: Rollback on any commit error (including SSL errors)
                    try:
                        session.rollback()
                        pass
                    except Exception as rollback_error:
                        logger.error(f"[SESSION ROLLBACK ERROR] Rollback failed: {rollback_error} (ID: {session_id})")
                    raise
            
        except (OperationalError, TimeoutError) as e:
            # ✅ CRITICAL FIX: Always rollback on operational errors
            if session and session.is_active:
                try:
                    session.rollback()
                    pass
                except Exception as rollback_error:
                    logger.error(f"[SESSION ROLLBACK ERROR] Rollback failed: {rollback_error} (ID: {session_id})")
            raise
            
        except Exception as e:
            # ✅ CRITICAL FIX: Always rollback on any error
            if session and session.is_active:
                try:
                    session.rollback()
                    pass
                except Exception as rollback_error:
                    logger.error(f"[SESSION ROLLBACK ERROR] Rollback failed: {rollback_error} (ID: {session_id})")
            raise
            
        finally:
            session_duration = time.time() - start_time
            
            # Log slow sessions
            if session_duration > 5.0:
                pass
            elif session_duration > 1.0:
                pass
            
            # ✅ CRITICAL: Always close the session to return connection to pool
            # This is essential for preventing connection leaks
            if session and not session_closed:
                try:
                    # Close the session - this returns the connection to the pool
                    session.close()
                    session_closed = True
                    pass
                except Exception as close_error:
                    # Even if close fails, we've done our best
                    # The connection pool will eventually recycle the connection
                    logger.debug(f"[SESSION CLOSE] Close error (expected for broken connections): {type(close_error).__name__}")
                    pass
    
    def get_session_dependency(self) -> Generator[Session, None, None]:
        """
        FastAPI dependency for getting database session
        """
        with self.get_session() as session:
            yield session
    
    def health_check(self) -> dict:
        """
        Comprehensive database health check
        """
        try:
            if not self.engine:
                return {"status": "unhealthy", "error": "Engine not initialized"}
            
            # Test connection with timeout
            start_time = time.time()
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT 1")).scalar()
                
            connection_time = time.time() - start_time
            
            # Get pool statistics
            pool = self.engine.pool
            pool_stats = {
                "size": pool.size(),
                "checked_in": pool.checkedin(),
                "checked_out": pool.checkedout(),
                "overflow": pool.overflow()
            }
            
            # Add invalid count if available
            try:
                pool_stats["invalid"] = pool.invalid()
            except AttributeError:
                pool_stats["invalid"] = "N/A"
            
            # Determine health status
            checked_out = pool_stats["checked_out"]
            if checked_out > 7:
                health_status = "warning"
            elif checked_out > 5:
                health_status = "degraded"
            else:
                health_status = "healthy"
            
            return {
                "status": health_status,
                "connection_time_ms": round(connection_time * 1000, 2),
                "test_query_result": result == 1,
                "pool_stats": pool_stats,
                "message": f"Checked out: {checked_out}/8 connections"
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "error_type": type(e).__name__
            }
    
    def close(self):
        """
        ✅ CRITICAL: Close ALL database connections and cleanup
        Called on app shutdown to ensure no connections are left open
        """
        try:
            if self.engine:
                # ✅ CRITICAL: Dispose all connections in the pool
                # This closes all active and idle connections
                self.engine.dispose()
                logger.info("✅ All database connections disposed successfully")
        except Exception as e:
            logger.error(f"Error disposing database connections: {e}")
            pass
        
        try:
            # ✅ CRITICAL: Close the session factory
            if self.SessionLocal:
                self.SessionLocal.close_all()
                logger.info("✅ Session factory closed successfully")
        except Exception as e:
            logger.error(f"Error closing session factory: {e}")
            pass
        
        # ✅ CRITICAL: Mark as uninitialized so it can be recreated if needed
        self._initialized = False
        logger.info("✅ Database manager cleanup complete")
    
    def reset_connection(self):
        """Reset database connection (for recovery from connection issues)"""
        try:
            # Close existing connections
            if self.engine:
                self.engine.dispose()
            
            # Reinitialize
            self._setup_database()
            
        except Exception as e:
            raise

# Global singleton instance - ONLY DATABASE ENGINE IN APPLICATION
db_manager = DatabaseManager()

# FastAPI dependency function
def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency for getting optimized database session
    CRITICAL: Use this in ALL endpoints
    
    ✅ CRITICAL FIX: Close session IMMEDIATELY after endpoint, before response sent
    """
    session = None
    session_id = None
    debug = os.getenv("DEBUG_SESSIONS") == "true"
    
    try:
        # Create session
        session = db_manager.SessionLocal()
        session_id = id(session)
        if debug:
            logger.debug(f"Session {session_id} opened")
        yield session
        
        if debug:
            logger.debug(f"Session {session_id} endpoint complete")
        
        # Commit on success - BEFORE closing
        if session and session.is_active:
            try:
                if debug:
                    logger.debug(f"Session {session_id} committing")
                session.commit()
                if debug:
                    logger.debug(f"Session {session_id} committed successfully")
            except Exception as e:
                if debug:
                    logger.debug(f"Session {session_id} commit failed: {e}")
                try:
                    session.rollback()
                except Exception:
                    pass
                raise
        
        # Close immediately after commit (don't wait for finally)
        if debug:
            logger.debug(f"Session {session_id} closing immediately")
        session.expunge_all()
        session.close()
        if debug:
            logger.debug(f"Session {session_id} closed - connection returned to pool")
        session = None  # Prevent double-close in finally
        
    except Exception as e:
        # Rollback on error
        if debug:
            logger.debug(f"Session {session_id} error: {e}")
        if session and session.is_active:
            try:
                if debug:
                    logger.debug(f"Session {session_id} rolling back")
                session.rollback()
                if debug:
                    logger.debug(f"Session {session_id} rolled back")
            except Exception:
                pass
        raise
    finally:
        # Final safety check - close if not already closed
        if session:
            try:
                if debug:
                    logger.debug(f"Session {session_id} finally safety close")
                session.expunge_all()
                session.close()
                if debug:
                    logger.debug(f"Session {session_id} finally closed")
            except Exception as e:
                if debug:
                    logger.debug(f"Session {session_id} finally close error: {e}")

# Context manager for manual session management
@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """
    Context manager for getting database session outside FastAPI
    Use this in Celery tasks and background jobs
    """
    with db_manager.get_session() as session:
        yield session

# Base class for SQLAlchemy models
Base = declarative_base()

# Health check function
def check_db_health() -> dict:
    """Check database health"""
    return db_manager.health_check()

# Connection reset function (for error recovery)
def reset_db_connection():
    """Reset database connection"""
    db_manager.reset_connection()

# Shutdown cleanup function
def close_db_connection():
    """Close database connection on shutdown"""
    db_manager.close()
