"""
Simple and reliable database dependencies for FastAPI
"""

import logging
from typing import Generator
from sqlalchemy.orm import Session
from sqlalchemy import text
from core.database import SessionLocal

logger = logging.getLogger(__name__)

def get_simple_optimized_db() -> Generator[Session, None, None]:
    """
    Simple database dependency with basic error handling
    """
    session = SessionLocal()
    try:
        # Test connection
        session.execute(text("SELECT 1"))
        yield session
        session.commit()
    except Exception as e:
        logger.error(f"Database session error: {e}")
        session.rollback()
        raise
    finally:
        session.close()
