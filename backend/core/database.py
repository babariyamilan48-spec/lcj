from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool, StaticPool
from sqlalchemy.engine import Engine
import logging
import time

from core.config.settings import settings

logger = logging.getLogger(__name__)

# Optimized engine configuration for Supabase (30 connection limit)
engine_config = {
    "poolclass": QueuePool,
    "pool_size": settings.DATABASE_POOL_SIZE,  # Use settings value (5)
    "max_overflow": settings.DATABASE_MAX_OVERFLOW,  # Use settings value (10)
    "pool_pre_ping": True,
    "pool_recycle": 900,  # Recycle connections every 15 minutes
    "pool_timeout": 20,  # Timeout for getting connection from pool
    "echo": False,
    "connect_args": {
        "connect_timeout": 15,
        "application_name": "lcj_backend",
        "options": "-c default_transaction_isolation=read_committed -c statement_timeout=30000 -c idle_in_transaction_session_timeout=60000"
    }
}

# Add async support if available
try:
    engine_config["future"] = True
except Exception:
    pass

engine = create_engine(settings.DATABASE_URL, **engine_config)

# Database monitoring utilities
class DatabaseMonitor:
    def __init__(self, engine):
        self.engine = engine
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

# Database monitoring class
class DatabaseMonitor:
    """Database performance monitoring"""
    
    @staticmethod
    def get_pool_status():
        """Get database connection pool status"""
        try:
            return {
                "pool_size": engine.pool.size(),
                "checked_out_connections": engine.pool.checkedout(),
                "overflow_connections": engine.pool.overflow(),
                "checked_in_connections": engine.pool.checkedin()
            }
        except Exception as e:
            logger.error(f"Error getting pool status: {e}")
            return {
                "pool_size": 0,
                "checked_out_connections": 0,
                "overflow_connections": 0,
                "checked_in_connections": 0,
                "error": str(e)
            }

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

# Async database session (if needed) - lazy initialization
async_engine = None
AsyncSessionLocal = None

def get_async_engine():
    """Lazy initialization of async engine"""
    global async_engine, AsyncSessionLocal
    
    if async_engine is None:
        try:
            from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
            
            # Only create if asyncpg is available and URL contains asyncpg
            async_url = settings.DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+asyncpg://")
            
            # Create async engine for high-performance operations
            async_engine = create_async_engine(
                async_url,
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
            
        except ImportError:
            # Async support not available
            async_engine = None
            AsyncSessionLocal = None
    
    return async_engine, AsyncSessionLocal

async def get_async_db():
    """Async database session"""
    engine, session_maker = get_async_engine()
    
    if session_maker is None:
        raise NotImplementedError("Async database support not available")
    
    async with session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

