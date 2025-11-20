"""
Simple, unified database configuration
No singleton, no async - just straightforward SQLAlchemy setup
"""
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool
import logging
import os

logger = logging.getLogger(__name__)

# Get database URL from environment or use default
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://lcj_user:lcj_password@localhost:5432/lcj"
)

# Pool configuration - FIXED FOR SUPABASE
# Pool size: 5, Max overflow: 10, Total: 15 connections
# Note: pool.overflow() returns current overflow count, not max_overflow setting
POOL_SIZE = 5
MAX_OVERFLOW = 10

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=POOL_SIZE,              # Base pool size
    max_overflow=MAX_OVERFLOW,        # Additional overflow connections
    pool_pre_ping=True,               # Validate connections before use
    pool_recycle=900,                 # Recycle connections every 15 minutes
    pool_timeout=20,                  # Wait up to 20 seconds for available connection
    echo=False,
    connect_args={
        "connect_timeout": 15,
        "application_name": "lcj_backend",
        "options": "-c default_transaction_isolation=read_committed -c statement_timeout=30000 -c idle_in_transaction_session_timeout=60000"
    }
)

# Add connection event listeners for optimization
@event.listens_for(engine, "connect")
def set_connection_settings(dbapi_connection, connection_record):
    """Set connection-level settings for Supabase optimization"""
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("SET statement_timeout = '30s'")
        cursor.execute("SET lock_timeout = '10s'")
        cursor.execute("SET idle_in_transaction_session_timeout = '60s'")
        cursor.close()
        logger.debug("Connection settings applied")
    except Exception as e:
        logger.warning(f"Failed to set connection settings: {e}")

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    """Log connection checkout"""
    connection_record.info['checkout_time'] = __import__('time').time()

@event.listens_for(engine, "checkin")
def receive_checkin(dbapi_connection, connection_record):
    """Log connection checkin and usage time"""
    if 'checkout_time' in connection_record.info:
        checkout_time = connection_record.info.pop('checkout_time')
        usage_time = __import__('time').time() - checkout_time
        if usage_time > 5.0:
            logger.warning(f"Long-running connection: {usage_time:.2f}s")

# Session factory
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)

# Base for models
Base = declarative_base()

# Dependency for FastAPI
def get_db():
    """
    FastAPI dependency for database session
    Ensures proper cleanup
    """
    db = SessionLocal()
    try:
        yield db
        if db.is_active:
            db.commit()
    except Exception as e:
        if db.is_active:
            db.rollback()
        logger.error(f"Database error: {e}")
        raise
    finally:
        try:
            db.close()
        except Exception as close_error:
            logger.error(f"Error closing session: {close_error}")

# Health check
def check_db_health():
    """Check database connection health"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        pool = engine.pool
        return {
            "status": "healthy",
            "pool_size": pool.size(),
            "checked_out": pool.checkedout(),
            "checked_in": pool.checkedin(),
            "overflow": pool.overflow()
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# Pool diagnostics
def get_pool_diagnostics():
    """Get detailed pool diagnostics"""
    try:
        pool = engine.pool
        checked_out = pool.checkedout()
        checked_in = pool.checkedin()
        
        return {
            "status": "success",
            "pool_size": pool.size(),
            "max_overflow": MAX_OVERFLOW,  # Use configured value, not pool.overflow()
            "checked_in": checked_in,
            "checked_out": checked_out,
            "total_connections": checked_in + checked_out,
            "available_connections": checked_in,
            "in_use_connections": checked_out,
            "usage_percent": round((checked_out / 15) * 100, 2),
            "configuration": {
                "pool_size": POOL_SIZE,
                "max_overflow": MAX_OVERFLOW,
                "pool_timeout": 20,
                "pool_recycle": 900,
                "pool_pre_ping": True
            }
        }
    except Exception as e:
        logger.error(f"Error getting pool diagnostics: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

# Reset pool (emergency)
def reset_pool():
    """Reset the connection pool"""
    try:
        engine.dispose()
        logger.warning("Connection pool has been reset")
        return {"status": "success", "message": "Pool reset successfully"}
    except Exception as e:
        logger.error(f"Error resetting pool: {e}")
        return {"status": "error", "error": str(e)}
