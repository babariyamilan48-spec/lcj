"""
Optimized Database Connection Pool Configuration
Prevents connection timeouts and ensures proper session management
"""
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import logging
import os
from contextlib import contextmanager
from typing import Generator

logger = logging.getLogger(__name__)

class OptimizedDatabasePool:
    """
    Optimized database connection pool with proper timeout and session management
    """
    
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self._setup_engine()
    
    def _setup_engine(self):
        """Setup optimized database engine with connection pooling"""
        try:
            database_url = os.getenv("DATABASE_URL")
            if not database_url:
                logger.warning("DATABASE_URL not found, using default")
                return
            
            # Optimized engine configuration for Supabase
            self.engine = create_engine(
                database_url,
                # Connection pool settings - optimized for Supabase
                poolclass=QueuePool,
                pool_size=3,  # Conservative for Supabase connection limits
                max_overflow=5,  # Reduced overflow to prevent exhaustion
                pool_timeout=10,  # Timeout for getting connection from pool
                pool_recycle=300,  # Recycle connections every 5 minutes (prevent stale connections)
                pool_pre_ping=True,  # Validate connections before use
                
                # Connection settings - optimized for Supabase
                connect_args={
                    "connect_timeout": 10,  # Connection timeout
                    "application_name": "lcj_optimized_api",
                    "options": "-c statement_timeout=15000 -c idle_in_transaction_session_timeout=30000 -c tcp_keepalives_idle=60 -c tcp_keepalives_interval=10 -c tcp_keepalives_count=5"
                },
                
                # Engine settings
                echo=False,  # Set to True for SQL debugging
                future=True,  # Use SQLAlchemy 2.0 style
            )
            
            # Add connection event listeners
            self._setup_connection_events()
            
            # Create session factory
            self.SessionLocal = sessionmaker(
                bind=self.engine,
                autocommit=False,
                autoflush=False,
                expire_on_commit=False  # Keep objects accessible after commit
            )
            
            logger.info("✅ Optimized database pool initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to setup database pool: {e}")
    
    def _setup_connection_events(self):
        """Setup connection event listeners for monitoring and optimization"""
        import time
        
        @event.listens_for(self.engine, "connect")
        def set_connection_settings(dbapi_connection, connection_record):
            """Set connection-level settings for optimization"""
            try:
                with dbapi_connection.cursor() as cursor:
                    # Set reasonable timeouts for Supabase
                    cursor.execute("SET statement_timeout = '15s'")  # 15 second query timeout
                    cursor.execute("SET lock_timeout = '10s'")        # 10 second lock timeout
                    cursor.execute("SET idle_in_transaction_session_timeout = '30s'")  # 30 second idle timeout
                    cursor.execute("SET tcp_keepalives_idle = '60'")  # TCP keepalive every 60s
                    cursor.execute("SET tcp_keepalives_interval = '10'")  # TCP keepalive interval
                    cursor.execute("SET tcp_keepalives_count = '5'")   # TCP keepalive count
                    
                logger.debug("Optimized connection settings applied")
            except Exception as e:
                logger.warning(f"Failed to set connection settings: {e}")
        
        @event.listens_for(self.engine, "checkout")
        def receive_checkout(dbapi_connection, connection_record, connection_proxy):
            """Monitor connection checkout"""
            connection_record.info['checkout_time'] = time.time()
            logger.debug("Connection checked out from pool")
        
        @event.listens_for(self.engine, "checkin")
        def receive_checkin(dbapi_connection, connection_record):
            """Monitor connection checkin and log long-running connections"""
            if 'checkout_time' in connection_record.info:
                checkout_time = connection_record.info.pop('checkout_time')
                usage_time = time.time() - checkout_time
                if usage_time > 10.0:  # Log connections held for more than 10 seconds
                    logger.warning(f"⚠️ Long-running database connection: {usage_time:.2f}s")
                elif usage_time > 5.0:
                    logger.info(f"ℹ️ Moderate connection time: {usage_time:.2f}s")
            logger.debug("Connection returned to pool")
    
    @contextmanager
    def get_session(self) -> Generator[Session, None, None]:
        """
        Get a database session with proper cleanup
        """
        if not self.SessionLocal:
            raise RuntimeError("Database pool not initialized")
        
        session = self.SessionLocal()
        try:
            yield session
            # Only commit if session is still active
            if session.is_active:
                session.commit()
        except Exception as e:
            if session.is_active:
                session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            # Always close to return connection to pool
            try:
                session.close()
            except Exception as close_error:
                logger.error(f"Error closing session: {close_error}")
    
    def get_session_sync(self) -> Session:
        """
        Get a database session (synchronous)
        Note: Caller is responsible for closing the session
        """
        if not self.SessionLocal:
            raise RuntimeError("Database pool not initialized")
        
        return self.SessionLocal()
    
    def health_check(self) -> dict:
        """
        Check database pool health
        """
        try:
            if not self.engine:
                return {"status": "unhealthy", "error": "Engine not initialized"}
            
            # Test connection
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT 1")).scalar()
                
            # Get pool status
            pool = self.engine.pool
            pool_status = {
                "size": pool.size(),
                "checked_in": pool.checkedin(),
                "checked_out": pool.checkedout(),
                "overflow": pool.overflow(),
                "invalid": pool.invalid()
            }
            
            return {
                "status": "healthy",
                "pool_status": pool_status,
                "test_query": result == 1
            }
            
        except Exception as e:
            return {
                "status": "unhealthy", 
                "error": str(e)
            }
    
    def close(self):
        """Close the database pool"""
        try:
            if self.engine:
                self.engine.dispose()
                logger.info("Database pool closed")
        except Exception as e:
            logger.error(f"Error closing database pool: {e}")

# Global optimized database pool instance
optimized_db_pool = OptimizedDatabasePool()

def get_optimized_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency for getting optimized database session
    """
    with optimized_db_pool.get_session() as session:
        yield session

@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """
    Context manager for getting database session
    """
    with optimized_db_pool.get_session() as session:
        yield session
