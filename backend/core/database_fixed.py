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
            # pool_size=3 + max_overflow=5 = 8 total (safe margin)
            self.engine = create_engine(
                database_url,
                
                # ✅ OPTIMIZED CONNECTION POOL SETTINGS FOR SUPABASE
                poolclass=QueuePool,
                pool_size=3,              # Base connections (conservative)
                max_overflow=5,           # Additional connections when needed
                pool_timeout=15,          # 15 second timeout for getting connection
                pool_recycle=300,         # Recycle connections every 5 minutes
                pool_pre_ping=True,       # Validate connections before use
                
                # ✅ CONNECTION SETTINGS - OPTIMIZED FOR SUPABASE
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
            
            # Test the connection
            self._test_connection()
            
            pass
            
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
                    cursor.execute("SET statement_timeout = '10s'")  # 10 second query timeout
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
                    pass
                    try:
                        session.rollback()
                        pass
                    except Exception as rollback_error:
                        pass
                    raise
            
        except (OperationalError, TimeoutError) as e:
            if session and session.is_active:
                try:
                    session.rollback()
                    pass
                except Exception as rollback_error:
                    logger.error(f"[SESSION ROLLBACK ERROR] Rollback failed: {rollback_error} (ID: {session_id})")
            pass
            raise
            
        except Exception as e:
            if session and session.is_active:
                try:
                    session.rollback()
                    pass
                except Exception as rollback_error:
                    logger.error(f"[SESSION ROLLBACK ERROR] Rollback failed: {rollback_error} (ID: {session_id})")
            pass
            raise
            
        finally:
            session_duration = time.time() - start_time
            
            # Log slow sessions
            if session_duration > 5.0:
                pass
            elif session_duration > 1.0:
                pass
            
            # CRITICAL: Always close the session to return connection to pool
            if session and not session_closed:
                try:
                    session.close()
                    session_closed = True
                    pass
                except Exception as close_error:
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
        """Close database connections and cleanup"""
        try:
            if self.engine:
                self.engine.dispose()
        except Exception as e:
            pass
    
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
    """
    with db_manager.get_session() as session:
        yield session

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
