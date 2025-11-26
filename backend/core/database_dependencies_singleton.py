"""
Database Dependencies - Uses the single consolidated database manager
CRITICAL: This module now uses ONLY core/database_fixed.py
All other database engines are deprecated.
"""
import logging
from typing import Generator

from sqlalchemy.orm import Session
from fastapi import Depends

from core.database_fixed import get_db as _get_db

logger = logging.getLogger(__name__)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency for general database session
    Uses the single consolidated database manager
    CRITICAL: This is the ONLY database dependency to use
    """
    yield from _get_db()


def get_user_db(user_id: str = None):
    """
    FastAPI dependency for user-specific database session
    Alias for get_db() - user_id parameter is ignored
    All endpoints should use get_db() instead
    """
    def _get_user_session() -> Generator[Session, None, None]:
        yield from _get_db()
    return _get_user_session


__all__ = ['get_db', 'get_user_db']
