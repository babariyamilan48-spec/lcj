"""
Enhanced database dependencies with better error handling and connection management
"""

import logging
import time
from contextlib import contextmanager
from typing import Generator
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, TimeoutError, DisconnectionError
from sqlalchemy import text
from core.database_pool import optimized_db_pool
from core.database import SessionLocal

logger = logging.getLogger(__name__)

class DatabaseConnectionError(Exception):
    """Custom exception for database connection issues"""
    pass

@contextmanager
def get_robust_db_session(max_retries: int = 3, retry_delay: float = 1.0) -> Generator[Session, None, None]:
    """
    Get a database session with retry logic for connection issues
    """
    session = None
    last_error = None
    
    for attempt in range(max_retries):
        try:
            # Try optimized pool first, fallback to regular session
            try:
                session = optimized_db_pool.get_session_sync()
            except Exception as pool_error:
                logger.warning(f"Optimized pool failed (attempt {attempt + 1}): {pool_error}")
                session = SessionLocal()
            
            # Test the connection with a simple query
            session.execute(text("SELECT 1"))
            
            yield session
            session.commit()
            return
            
        except (OperationalError, TimeoutError, DisconnectionError) as e:
            last_error = e
            logger.warning(f"Database connection attempt {attempt + 1} failed: {e}")
            
            if session:
                try:
                    session.rollback()
                    session.close()
                except Exception:
                    pass
                session = None
            
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (attempt + 1))  # Exponential backoff
                continue
            else:
                break
                
        except Exception as e:
            last_error = e
            logger.error(f"Unexpected database error (attempt {attempt + 1}): {e}")
            
            if session:
                try:
                    session.rollback()
                    session.close()
                except Exception:
                    pass
                session = None
            
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                continue
            else:
                break
    
    # If we get here, all attempts failed
    error_msg = f"Failed to establish database connection after {max_retries} attempts"
    if last_error:
        error_msg += f": {last_error}"
    
    logger.error(error_msg)
    raise DatabaseConnectionError(error_msg)

def get_robust_optimized_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency for getting a robust database session
    """
    session = None
    last_error = None
    
    for attempt in range(3):  # max_retries = 3
        try:
            # Try optimized pool first, fallback to regular session
            try:
                session = optimized_db_pool.get_session_sync()
            except Exception as pool_error:
                logger.warning(f"Optimized pool failed (attempt {attempt + 1}): {pool_error}")
                session = SessionLocal()
            
            # Test the connection with a simple query
            session.execute(text("SELECT 1"))
            
            # If we get here, connection is good
            break
            
        except (OperationalError, TimeoutError, DisconnectionError) as e:
            last_error = e
            logger.warning(f"Database connection attempt {attempt + 1} failed: {e}")
            
            if session:
                try:
                    session.rollback()
                    session.close()
                except Exception:
                    pass
                session = None
            
            if attempt < 2:  # max_retries - 1
                time.sleep(1.0 * (attempt + 1))  # Exponential backoff
                continue
            else:
                break
                
        except Exception as e:
            last_error = e
            logger.error(f"Unexpected database error (attempt {attempt + 1}): {e}")
            
            if session:
                try:
                    session.rollback()
                    session.close()
                except Exception:
                    pass
                session = None
            
            if attempt < 2:  # max_retries - 1
                time.sleep(1.0)
                continue
            else:
                break
    
    # Check if we have a valid session
    if not session:
        error_msg = f"Failed to establish database connection after 3 attempts"
        if last_error:
            error_msg += f": {last_error}"
        logger.error(error_msg)
        raise DatabaseConnectionError(error_msg)
    
    try:
        yield session
        session.commit()
    except Exception as e:
        logger.error(f"Database session error during operation: {e}")
        session.rollback()
        raise
    finally:
        try:
            session.close()
        except Exception as e:
            logger.warning(f"Error closing database session: {e}")

def get_fast_db_session() -> Generator[Session, None, None]:
    """
    Fast database session with minimal retry logic for performance-critical endpoints
    """
    session = None
    try:
        # Try optimized pool first
        try:
            session = optimized_db_pool.get_session_sync()
        except Exception:
            # Quick fallback to regular session
            session = SessionLocal()
        
        # Quick connection test
        session.execute(text("SELECT 1"))
        
        yield session
        session.commit()
        
    except Exception as e:
        logger.error(f"Fast database session error: {e}")
        if session:
            try:
                session.rollback()
            except Exception:
                pass
        raise DatabaseConnectionError(f"Database connection failed: {e}")
        
    finally:
        if session:
            try:
                session.close()
            except Exception as e:
                logger.warning(f"Error closing fast database session: {e}")
