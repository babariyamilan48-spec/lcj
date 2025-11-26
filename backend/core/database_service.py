"""
Hybrid Database Service
Provides unified interface for both SQLAlchemy and Supabase operations
✅ FIXED: Now uses ONLY core/database_fixed.py for all database operations
"""
import asyncio
from typing import Optional, Dict, Any, List, Union, Type
from contextlib import asynccontextmanager, contextmanager
import logging

from sqlalchemy.orm import Session
from sqlalchemy import text

from core.database_fixed import db_manager, get_db_session
from core.supabase_client import supabase_manager, SupabaseManager
from core.config.settings import settings

logger = logging.getLogger(__name__)

class DatabaseService:
    """
    Unified database service that provides both SQLAlchemy and Supabase access
    with intelligent routing and caching
    ✅ FIXED: Uses ONLY core/database_fixed.py - no duplicate engines
    """
    
    def __init__(self):
        self.supabase = supabase_manager
        logger.info("✅ DatabaseService initialized with single database manager")
    
    # SQLAlchemy Operations
    
    def get_sync_session(self) -> Session:
        """Get synchronous SQLAlchemy session from fixed database manager"""
        return db_manager.SessionLocal()
    
    @contextmanager
    def get_session_context(self):
        """Get database session with automatic cleanup"""
        with get_db_session() as session:
            yield session
    
    @asynccontextmanager
    async def get_async_session(self):
        """Get database session in async context (uses sync engine in thread pool)"""
        # For async code, run sync operation in thread pool
        loop = asyncio.get_event_loop()
        with get_db_session() as session:
            yield session
    
    async def execute_sql(self, query: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Execute raw SQL query with parameters using fixed database manager"""
        params = params or {}
        
        try:
            # ✅ FIXED: Use fixed database manager instead of separate async engine
            with db_manager.engine.begin() as conn:
                result = conn.execute(text(query), params)
                return [dict(row._mapping) for row in result.fetchall()]
                    
        except Exception as e:
            logger.error(f"SQL execution error: {str(e)}")
            raise
    
    # Supabase Operations (delegated to SupabaseManager)
    
    async def supabase_select(self, table: str, columns: str = "*", **filters) -> List[Dict[str, Any]]:
        """Select data using Supabase"""
        return await self.supabase.select(table, columns, **filters)
    
    async def supabase_insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert data using Supabase"""
        return await self.supabase.insert(table, data)
    
    async def supabase_update(self, table: str, data: Dict[str, Any], **filters) -> List[Dict[str, Any]]:
        """Update data using Supabase"""
        return await self.supabase.update(table, data, **filters)
    
    async def supabase_delete(self, table: str, **filters) -> List[Dict[str, Any]]:
        """Delete data using Supabase"""
        return await self.supabase.delete(table, **filters)
    
    async def supabase_rpc(self, function_name: str, params: Dict[str, Any] = None) -> Any:
        """Execute Supabase RPC"""
        return await self.supabase.execute_rpc(function_name, params)
    
    # Hybrid Operations (choose best method automatically)
    
    async def smart_select(self, table: str, columns: str = "*", use_supabase: bool = None, **filters) -> List[Dict[str, Any]]:
        """
        Intelligent SELECT that chooses between SQLAlchemy and Supabase
        based on availability and performance characteristics
        """
        # Auto-detect best method if not specified
        if use_supabase is None:
            use_supabase = self.supabase.is_available and settings.ENVIRONMENT == "production"
        
        if use_supabase and self.supabase.is_available:
            try:
                return await self.supabase_select(table, columns, **filters)
            except Exception as e:
                logger.warning(f"Supabase select failed, falling back to SQL: {str(e)}")
                # Fallback to SQL
        
        # Use SQLAlchemy
        where_clause = " AND ".join([f"{k} = :{k}" for k in filters.keys()])
        query = f"SELECT {columns} FROM {table}"
        if where_clause:
            query += f" WHERE {where_clause}"
        
        return await self.execute_sql(query, filters)
    
    async def smart_insert(self, table: str, data: Dict[str, Any], use_supabase: bool = None) -> Dict[str, Any]:
        """
        Intelligent INSERT that chooses between SQLAlchemy and Supabase
        """
        if use_supabase is None:
            use_supabase = self.supabase.is_available and settings.ENVIRONMENT == "production"
        
        if use_supabase and self.supabase.is_available:
            try:
                return await self.supabase_insert(table, data)
            except Exception as e:
                logger.warning(f"Supabase insert failed, falling back to SQL: {str(e)}")
        
        # Use SQLAlchemy
        columns = ", ".join(data.keys())
        placeholders = ", ".join([f":{k}" for k in data.keys()])
        query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders}) RETURNING *"
        
        result = await self.execute_sql(query, data)
        return result[0] if result else {}
    
    # Health and Monitoring
    
    async def health_check(self) -> Dict[str, Any]:
        """Comprehensive health check for both database systems"""
        health_status = {
            "sqlalchemy": {"status": "unknown"},
            "supabase": {"status": "unknown"},
            "overall": {"status": "unknown"}
        }
        
        # Check SQLAlchemy
        try:
            result = await self.execute_sql("SELECT 1 as test")
            if result and result[0].get("test") == 1:
                health_status["sqlalchemy"] = {"status": "healthy", "message": "SQLAlchemy connection working"}
            else:
                health_status["sqlalchemy"] = {"status": "unhealthy", "message": "Unexpected SQLAlchemy response"}
        except Exception as e:
            health_status["sqlalchemy"] = {"status": "unhealthy", "message": f"SQLAlchemy error: {str(e)}"}
        
        # Check Supabase
        health_status["supabase"] = self.supabase.health_check()
        
        # Overall status
        sqlalchemy_healthy = health_status["sqlalchemy"]["status"] == "healthy"
        supabase_healthy = health_status["supabase"]["status"] == "healthy"
        
        if sqlalchemy_healthy and supabase_healthy:
            health_status["overall"] = {"status": "healthy", "message": "Both database systems operational"}
        elif sqlalchemy_healthy or supabase_healthy:
            health_status["overall"] = {"status": "degraded", "message": "One database system operational"}
        else:
            health_status["overall"] = {"status": "unhealthy", "message": "No database systems operational"}
        
        return health_status
    
    async def get_connection_info(self) -> Dict[str, Any]:
        """Get information about current database connections"""
        return {
            "sqlalchemy": {
                "database_url": settings.DATABASE_URL,
                "pool_size": settings.DATABASE_POOL_SIZE,
                "max_overflow": settings.DATABASE_MAX_OVERFLOW,
                "async_available": self._async_engine is not None
            },
            "supabase": {
                "available": self.supabase.is_available,
                "url": settings.SUPABASE_URL,
                "configured": bool(settings.SUPABASE_URL and (settings.SUPABASE_ANON_KEY or settings.SUPABASE_SERVICE_ROLE_KEY))
            }
        }

# Global singleton instance
db_service = DatabaseService()

# Convenience functions for easy access
async def get_db_service() -> DatabaseService:
    """Get the database service instance"""
    return db_service

async def smart_select(table: str, columns: str = "*", **filters) -> List[Dict[str, Any]]:
    """Convenience function for smart SELECT operations"""
    return await db_service.smart_select(table, columns, **filters)

async def smart_insert(table: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience function for smart INSERT operations"""
    return await db_service.smart_insert(table, data)

async def execute_sql(query: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """Convenience function for raw SQL execution"""
    return await db_service.execute_sql(query, params)

async def db_health_check() -> Dict[str, Any]:
    """Convenience function for database health check"""
    return await db_service.health_check()
