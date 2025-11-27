"""
Query performance monitoring middleware
Logs slow queries and identifies optimization opportunities
"""
import time
import logging
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.pool import Pool

logger = logging.getLogger(__name__)

# Threshold for slow query logging (in seconds)
SLOW_QUERY_THRESHOLD = 1.0
VERY_SLOW_QUERY_THRESHOLD = 5.0

@event.listens_for(Engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Track query start time"""
    conn.info.setdefault('query_start_time', []).append(time.time())

@event.listens_for(Engine, "after_cursor_execute")
def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Log slow queries"""
    total_time = time.time() - conn.info['query_start_time'].pop(-1)
    
    if total_time > VERY_SLOW_QUERY_THRESHOLD:
        logger.error(
            f"🔴 VERY SLOW QUERY ({total_time:.3f}s): {statement[:150]}..."
        )
    elif total_time > SLOW_QUERY_THRESHOLD:
        logger.warning(
            f"🟠 SLOW QUERY ({total_time:.3f}s): {statement[:150]}..."
        )

@event.listens_for(Pool, "connect")
def receive_connect(dbapi_conn, connection_record):
    """Log new connections"""
    logger.debug("📊 New database connection established")

@event.listens_for(Pool, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    """Log connection checkouts"""
    logger.debug("📤 Connection checked out from pool")

@event.listens_for(Pool, "checkin")
def receive_checkin(dbapi_conn, connection_record):
    """Log connection returns"""
    logger.debug("📥 Connection returned to pool")
