"""
Singleton Database Connection Manager for Supabase
Optimized for connection pooling, timeout handling, and proper cleanup
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

class DatabaseSingleton:
    """
    Singleton database connection manager optimized for Supabase
    Ensures proper connection pooling and prevents connection exhaustion
    """
    
    _instance: Optional['DatabaseSingleton'] = None
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
            
            # Optimized configuration for Supabase
            self.engine = create_engine(
                database_url,
                
                # Connection Pool Settings - Conservative for Supabase
                poolclass=QueuePool,
                pool_size=2,  # Very conservative for Supabase free tier
                max_overflow=3,  # Limited overflow to prevent exhaustion
                pool_timeout=20,  # Longer timeout for getting connection
                pool_recycle=600,  # Recycle connections every 10 minutes
                pool_pre_ping=True,  # Always validate connections
                
                # Connection Settings - Optimized for Supabase
                connect_args={
                    "connect_timeout": 20,  # 20 second connection timeout
                    "application_name": "lcj_backend_singleton",
                    "options": (
                        "-c statement_timeout=30000 "  # 30 second query timeout
                        "-c idle_in_transaction_session_timeout=120000 "  # 2 minute idle timeout
                        "-c tcp_keepalives_idle=600 "  # TCP keepalive settings
                        "-c tcp_keepalives_interval=30 "
                        "-c tcp_keepalives_count=3"
                    )
                },
                
                # Engine Settings
                echo=False,  # Set to True for debugging
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
            
            logger.info("✅ Database singleton initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize database singleton: {e}")
            raise
    
    def _setup_connection_events(self):
        """Setup connection event listeners for monitoring and optimization"""
        
        @event.listens_for(self.engine, "connect")
        def set_connection_settings(dbapi_connection, connection_record):
            """Set connection-level settings for Supabase optimization"""
            try:
                with dbapi_connection.cursor() as cursor:
                    # Set optimal timeouts for Supabase
                    cursor.execute("SET statement_timeout = '30s'")
                    cursor.execute("SET lock_timeout = '15s'")
                    cursor.execute("SET idle_in_transaction_session_timeout = '120s'")
                    
                    # TCP keepalive settings for stable connections
                    cursor.execute("SET tcp_keepalives_idle = '600'")
                    cursor.execute("SET tcp_keepalives_interval = '30'")
                    cursor.execute("SET tcp_keepalives_count = '3'")
                    
                    # Connection-level optimizations
                    cursor.execute("SET default_transaction_isolation = 'read committed'")
                    cursor.execute("SET timezone = 'UTC'")
                    
                logger.debug("Connection settings applied successfully")
                
            except Exception as e:
                logger.warning(f"Failed to set connection settings: {e}")
        
        @event.listens_for(self.engine, "checkout")
        def log_checkout(dbapi_connection, connection_record, connection_proxy):
            """Log connection checkout with timestamp"""
            connection_record.info['checkout_time'] = time.time()
            logger.debug("Database connection checked out")
        
        @event.listens_for(self.engine, "checkin")
        def log_checkin(dbapi_connection, connection_record):
            """Log connection checkin and usage time"""
            if 'checkout_time' in connection_record.info:
                checkout_time = connection_record.info.pop('checkout_time')
                usage_time = time.time() - checkout_time
                
                if usage_time > 10.0:  # Log long-running connections
                    logger.warning(f"Long-running connection: {usage_time:.2f}s")
                else:
                    logger.debug(f"Connection returned after {usage_time:.2f}s")
    
    def _test_connection(self):
        """Test database connection"""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT 1")).scalar()
                if result != 1:
                    raise RuntimeError("Database test query failed")
                    
            logger.info("Database connection test passed")
            
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            raise
    
    @contextmanager
    def get_session(self) -> Generator[Session, None, None]:
        """
        Get a database session with proper error handling and cleanup
        """
        if not self.SessionLocal:
            raise RuntimeError("Database not initialized")
        
        session = self.SessionLocal()
        start_time = time.time()
        
        try:
            yield session
            session.commit()
            
        except (OperationalError, TimeoutError) as e:
            session.rollback()
            logger.error(f"Database connection error: {e}")
            # Re-raise connection errors for proper handling
            raise
            
        except Exception as e:
            session.rollback()
            logger.error(f"Database session error: {e}")
            raise
            
        finally:
            session_duration = time.time() - start_time
            if session_duration > 5.0:
                logger.warning(f"Slow database session: {session_duration:.2f}s")
            
            session.close()
    
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
            
            # Add invalid count if available (not all pool types have this)
            try:
                pool_stats["invalid"] = pool.invalid()
            except AttributeError:
                pool_stats["invalid"] = "N/A"
            
            return {
                "status": "healthy",
                "connection_time_ms": round(connection_time * 1000, 2),
                "test_query_result": result == 1,
                "pool_stats": pool_stats
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
                logger.info("Database connections closed")
        except Exception as e:
            logger.error(f"Error closing database: {e}")
    
    def reset_connection(self):
        """Reset database connection (for recovery from connection issues)"""
        try:
            logger.info("Resetting database connection...")
            
            # Close existing connections
            if self.engine:
                self.engine.dispose()
            
            # Reinitialize
            self._setup_database()
            
            logger.info("Database connection reset successfully")
            
        except Exception as e:
            logger.error(f"Failed to reset database connection: {e}")
            raise

# Global singleton instance
db_singleton = DatabaseSingleton()

# FastAPI dependency function
def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency for getting optimized database session
    """
    with db_singleton.get_session() as session:
        yield session

# Context manager for manual session management
@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """
    Context manager for getting database session outside FastAPI
    """
    with db_singleton.get_session() as session:
        yield session

# Base class for SQLAlchemy models
Base = declarative_base()

# Health check function
def check_db_health() -> dict:
    """Check database health"""
    return db_singleton.health_check()

# Connection reset function (for error recovery)
def reset_db_connection():
    """Reset database connection"""
    db_singleton.reset_connection()
