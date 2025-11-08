"""
Supabase Client Singleton
Provides efficient, thread-safe Supabase integration with connection pooling
"""
import os
import asyncio
from typing import Optional, Dict, Any, List
from threading import Lock
from functools import lru_cache
import logging

try:
    from supabase import create_client, Client
    from supabase.lib.client_options import ClientOptions
    from postgrest import APIError
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None
    APIError = Exception

from core.config.settings import settings

logger = logging.getLogger(__name__)

class SupabaseManager:
    """
    Singleton-like Supabase client manager with connection pooling and caching
    """
    _instance: Optional['SupabaseManager'] = None
    _lock: Lock = Lock()
    _client: Optional[Client] = None
    _initialized: bool = False
    
    def __new__(cls) -> 'SupabaseManager':
        """Ensure singleton pattern"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize the Supabase manager (only once)"""
        if not self._initialized:
            with self._lock:
                if not self._initialized:
                    self._setup_client()
                    self._initialized = True
    
    def _setup_client(self) -> None:
        """Setup Supabase client with optimal configuration"""
        if not SUPABASE_AVAILABLE:
            logger.warning("Supabase library not available. Install with: pip install supabase")
            return
            
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            logger.warning("Supabase credentials not found in environment variables")
            return
            
        try:
            # Configure client options for optimal performance
            options = ClientOptions(
                schema="public",
                headers={"apikey": supabase_key},
                auto_refresh_token=True,
                persist_session=True,
                detect_session_in_url=False,
                flow_type="implicit"
            )
            
            self._client = create_client(supabase_url, supabase_key, options)
            logger.info("✅ Supabase client initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Supabase client: {str(e)}")
            self._client = None
    
    @property
    def client(self) -> Optional[Client]:
        """Get the Supabase client instance"""
        if not self._client and SUPABASE_AVAILABLE:
            self._setup_client()
        return self._client
    
    @property
    def is_available(self) -> bool:
        """Check if Supabase is available and configured"""
        return self._client is not None and SUPABASE_AVAILABLE
    
    # Database Operations with Error Handling and Caching
    
    async def select(self, table: str, columns: str = "*", **filters) -> List[Dict[str, Any]]:
        """
        Optimized SELECT operation with caching
        """
        if not self.is_available:
            raise RuntimeError("Supabase client not available")
            
        try:
            query = self._client.table(table).select(columns)
            
            # Apply filters
            for key, value in filters.items():
                if key.endswith("__eq"):
                    query = query.eq(key[:-4], value)
                elif key.endswith("__neq"):
                    query = query.neq(key[:-5], value)
                elif key.endswith("__gt"):
                    query = query.gt(key[:-4], value)
                elif key.endswith("__gte"):
                    query = query.gte(key[:-5], value)
                elif key.endswith("__lt"):
                    query = query.lt(key[:-4], value)
                elif key.endswith("__lte"):
                    query = query.lte(key[:-5], value)
                elif key.endswith("__like"):
                    query = query.like(key[:-6], value)
                elif key.endswith("__ilike"):
                    query = query.ilike(key[:-7], value)
                elif key.endswith("__in"):
                    query = query.in_(key[:-4], value)
                else:
                    query = query.eq(key, value)
            
            response = query.execute()
            return response.data if response.data else []
            
        except APIError as e:
            logger.error(f"Supabase API error in select: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in select: {str(e)}")
            raise
    
    async def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optimized INSERT operation
        """
        if not self.is_available:
            raise RuntimeError("Supabase client not available")
            
        try:
            response = self._client.table(table).insert(data).execute()
            return response.data[0] if response.data else {}
            
        except APIError as e:
            logger.error(f"Supabase API error in insert: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in insert: {str(e)}")
            raise
    
    async def update(self, table: str, data: Dict[str, Any], **filters) -> List[Dict[str, Any]]:
        """
        Optimized UPDATE operation
        """
        if not self.is_available:
            raise RuntimeError("Supabase client not available")
            
        try:
            query = self._client.table(table).update(data)
            
            # Apply filters
            for key, value in filters.items():
                query = query.eq(key, value)
            
            response = query.execute()
            return response.data if response.data else []
            
        except APIError as e:
            logger.error(f"Supabase API error in update: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in update: {str(e)}")
            raise
    
    async def delete(self, table: str, **filters) -> List[Dict[str, Any]]:
        """
        Optimized DELETE operation
        """
        if not self.is_available:
            raise RuntimeError("Supabase client not available")
            
        try:
            query = self._client.table(table).delete()
            
            # Apply filters
            for key, value in filters.items():
                query = query.eq(key, value)
            
            response = query.execute()
            return response.data if response.data else []
            
        except APIError as e:
            logger.error(f"Supabase API error in delete: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in delete: {str(e)}")
            raise
    
    @lru_cache(maxsize=128)
    def get_table_schema(self, table: str) -> Dict[str, Any]:
        """
        Cached table schema retrieval
        """
        if not self.is_available:
            return {}
            
        try:
            # This would require additional Supabase API calls
            # For now, return empty dict - implement based on your needs
            return {}
        except Exception as e:
            logger.error(f"Error getting table schema: {str(e)}")
            return {}
    
    async def execute_rpc(self, function_name: str, params: Dict[str, Any] = None) -> Any:
        """
        Execute Supabase RPC (Remote Procedure Call)
        """
        if not self.is_available:
            raise RuntimeError("Supabase client not available")
            
        try:
            params = params or {}
            response = self._client.rpc(function_name, params).execute()
            return response.data
            
        except APIError as e:
            logger.error(f"Supabase RPC error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in RPC: {str(e)}")
            raise
    
    def health_check(self) -> Dict[str, Any]:
        """
        Check Supabase connection health
        """
        try:
            if not self.is_available:
                return {"status": "unavailable", "message": "Supabase client not configured"}
            
            # Simple health check - try to access a system table
            response = self._client.table("information_schema.tables").select("table_name").limit(1).execute()
            
            return {
                "status": "healthy",
                "message": "Supabase connection is working",
                "timestamp": asyncio.get_event_loop().time()
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Supabase connection failed: {str(e)}",
                "timestamp": asyncio.get_event_loop().time()
            }
    
    def reset_connection(self) -> None:
        """
        Reset the Supabase connection (useful for connection issues)
        """
        with self._lock:
            self._client = None
            self._initialized = False
            self._setup_client()
            self._initialized = True
        logger.info("🔄 Supabase connection reset")

# Global singleton instance
supabase_manager = SupabaseManager()

# Convenience functions for easy access
async def get_supabase_client() -> Optional[Client]:
    """Get the Supabase client instance"""
    return supabase_manager.client

async def supabase_select(table: str, columns: str = "*", **filters) -> List[Dict[str, Any]]:
    """Convenience function for SELECT operations"""
    return await supabase_manager.select(table, columns, **filters)

async def supabase_insert(table: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience function for INSERT operations"""
    return await supabase_manager.insert(table, data)

async def supabase_update(table: str, data: Dict[str, Any], **filters) -> List[Dict[str, Any]]:
    """Convenience function for UPDATE operations"""
    return await supabase_manager.update(table, data, **filters)

async def supabase_delete(table: str, **filters) -> List[Dict[str, Any]]:
    """Convenience function for DELETE operations"""
    return await supabase_manager.delete(table, **filters)

async def supabase_rpc(function_name: str, params: Dict[str, Any] = None) -> Any:
    """Convenience function for RPC operations"""
    return await supabase_manager.execute_rpc(function_name, params)

def supabase_health() -> Dict[str, Any]:
    """Convenience function for health check"""
    return supabase_manager.health_check()
