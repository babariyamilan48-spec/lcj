from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool, StaticPool
from sqlalchemy.engine import Engine
import logging
import time

from core.config.settings import settings

logger = logging.getLogger(__name__)

# Optimized engine configuration
engine_config = {
    "poolclass": QueuePool,
    "pool_size": max(settings.DATABASE_POOL_SIZE, 20),  # Increased pool size
    "max_overflow": max(settings.DATABASE_MAX_OVERFLOW, 40),  # Increased overflow
    "pool_pre_ping": True,
    "pool_recycle": 3600,  # Recycle connections every hour
    "pool_timeout": 30,  # Timeout for getting connection from pool
    "echo": False,
    "connect_args": {
        "connect_timeout": 10,
        "application_name": "lcj_backend",
        "options": "-c default_transaction_isolation=read_committed"
    }
}

# Add async support if available
try:
    engine_config["future"] = True
except Exception:
    pass

engine = create_engine(settings.DATABASE_URL, **engine_config)

# Add connection event listeners for monitoring
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Optimize connection settings"""
    if 'postgresql' in settings.DATABASE_URL:
        # PostgreSQL optimizations
        cursor = dbapi_connection.cursor()
        cursor.execute("SET statement_timeout = '30s'")
        cursor.execute("SET lock_timeout = '10s'")
        cursor.execute("SET idle_in_transaction_session_timeout = '60s'")
        cursor.close()

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    """Log slow connection checkouts"""
    connection_record.info['checkout_time'] = time.time()

@event.listens_for(engine, "checkin")
def receive_checkin(dbapi_connection, connection_record):
    """Log connection usage time"""
    if 'checkout_time' in connection_record.info:
        checkout_time = connection_record.info.pop('checkout_time')
        usage_time = time.time() - checkout_time
        if usage_time > 5.0:  # Log connections held for more than 5 seconds
            logger.warning(f"Long-running database connection: {usage_time:.2f}s")

# Optimized session configuration
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine,
    expire_on_commit=False  # Prevent lazy loading issues
)
Base = declarative_base()

def get_db():
    """Optimized database session with better error handling and monitoring"""
    db = SessionLocal()
    start_time = time.time()
    try:
        yield db
        # Commit any pending transactions
        if db.in_transaction():
            db.commit()
    except Exception as e:
        # Rollback on any exception
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        raise
    finally:
        session_time = time.time() - start_time
        if session_time > 2.0:  # Log slow sessions
            logger.warning(f"Slow database session: {session_time:.2f}s")
        db.close()

# Connection health check
def check_db_health():
    """Check database connection health"""
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        return {"status": "healthy", "pool_size": engine.pool.size(), "checked_out": engine.pool.checkedout()}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# Async database session (if needed)
try:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    
    # Create async engine for high-performance operations
    async_engine = create_async_engine(
        settings.DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+asyncpg://"),
        pool_size=20,
        max_overflow=40,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False
    )
    
    AsyncSessionLocal = async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async def get_async_db():
        """Async database session"""
        async with AsyncSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
                
except ImportError:
    # Async support not available
    async_engine = None
    AsyncSessionLocal = None
    
    async def get_async_db():
        raise NotImplementedError("Async database support not available")

# Database monitoring utilities
class DatabaseMonitor:
    """Database performance monitoring"""
    
    @staticmethod
    def get_pool_status():
        """Get connection pool status"""
        return {
            "pool_size": engine.pool.size(),
            "checked_out_connections": engine.pool.checkedout(),
            "overflow_connections": engine.pool.overflow(),
            "invalid_connections": engine.pool.invalid(),
        }
    
    @staticmethod
    def get_slow_queries():
        """Get information about slow queries (placeholder)"""
        # This would require query logging to be enabled
        return {"message": "Enable query logging to track slow queries"}
    
    @staticmethod
    def optimize_connection_pool():
        """Optimize connection pool settings based on current load"""
        pool_status = DatabaseMonitor.get_pool_status()
        
        recommendations = []
        
        if pool_status["checked_out_connections"] > pool_status["pool_size"] * 0.8:
            recommendations.append("Consider increasing pool_size")
        
        if pool_status["overflow_connections"] > 0:
            recommendations.append("High overflow usage - consider increasing pool_size")
        
        return {
            "current_status": pool_status,
            "recommendations": recommendations
        }
