"""
Optimized Supabase Client with Connection Pooling, Async Operations, and Caching
High-performance implementation for maximum speed
"""
import os
import asyncio
import aiohttp
from typing import Optional, Dict, Any, List, Union
from threading import Lock
from functools import lru_cache
import logging
import time
from contextlib import asynccontextmanager
import json
from dataclasses import dataclass

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
from core.cache import cache

logger = logging.getLogger(__name__)

@dataclass
class QueryOptimization:
    """Query optimization configuration"""
    select_fields: Optional[List[str]] = None
    limit: Optional[int] = None
    offset: Optional[int] = None
    order_by: Optional[str] = None
    use_cache: bool = True
    cache_ttl: int = 300

class OptimizedSupabaseManager:
    """
    High-performance Supabase client with connection pooling, async operations, and caching
    """
    _instance: Optional['OptimizedSupabaseManager'] = None
    _lock: Lock = Lock()
    _client: Optional[Client] = None
    _session: Optional[aiohttp.ClientSession] = None
    _initialized: bool = False
    _connection_pool_size: int = 20
    _timeout: int = 10
    
    def __new__(cls) -> 'OptimizedSupabaseManager':
        """Ensure singleton pattern"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize the optimized Supabase manager"""
        if not self._initialized:
            with self._lock:
                if not self._initialized:
                    # Initialize synchronously to avoid event loop issues
                    self._setup_client_sync()
                    self._initialized = True
    
    def _setup_client_sync(self) -> None:
        """Setup optimized Supabase client synchronously"""
        if not SUPABASE_AVAILABLE:
            logger.warning("Supabase library not available")
            return
            
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            logger.warning("Supabase credentials not found")
            return
            
        try:
            # Configure optimized client options (minimal config for compatibility)
            try:
                options = ClientOptions(
                    schema="public",
                    auto_refresh_token=False,  # Disable for server-side usage
                    persist_session=False  # Disable for better performance
                )
                self._client = create_client(supabase_url, supabase_key, options)
            except Exception as options_error:
                logger.warning(f"Failed to create client with options: {options_error}")
                # Fallback to basic client creation
                self._client = create_client(supabase_url, supabase_key)
            logger.info("✅ Optimized Supabase client initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize optimized Supabase client: {str(e)}")
            self._client = None
    
    async def setup_async_features(self) -> None:
        """Setup async features like connection pooling (call this from async context if needed)"""
        if not SUPABASE_AVAILABLE:
            return
            
        supabase_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not supabase_key:
            return
            
        try:
            # Setup connection pooling for advanced features
            connector = aiohttp.TCPConnector(
                limit=self._connection_pool_size,
                limit_per_host=10,
                ttl_dns_cache=300,
                enable_cleanup_closed=True
            )
            
            timeout = aiohttp.ClientTimeout(total=self._timeout)
            self._session = aiohttp.ClientSession(
                connector=connector,
                timeout=timeout,
                headers={
                    'apikey': supabase_key,
                    'Authorization': f'Bearer {supabase_key}',
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                }
            )
            
            logger.info("✅ Async connection pooling initialized")
            
        except Exception as e:
            logger.warning(f"⚠️  Failed to setup async features: {str(e)}")
    
    @property
    def client(self) -> Optional[Client]:
        """Get the Supabase client instance"""
        return self._client
    
    @property
    def is_available(self) -> bool:
        """Check if Supabase is available and configured"""
        return self._client is not None and SUPABASE_AVAILABLE
    
    async def close(self):
        """Close connection pool"""
        if self._session:
            await self._session.close()
    
    def _generate_cache_key(self, table: str, operation: str, **kwargs) -> str:
        """Generate cache key for operations"""
        key_parts = [f"supabase", table, operation]
        for k, v in sorted(kwargs.items()):
            if isinstance(v, (dict, list)):
                v = json.dumps(v, sort_keys=True)
            key_parts.append(f"{k}:{v}")
        return ":".join(str(part) for part in key_parts)
    
    async def optimized_select(
        self, 
        table: str, 
        optimization: QueryOptimization = None,
        **filters
    ) -> List[Dict[str, Any]]:
        """
        Highly optimized SELECT operation with caching and field selection
        """
        if not self.is_available:
            raise RuntimeError("Supabase client not available")
        
        optimization = optimization or QueryOptimization()
        
        # Generate cache key
        cache_key = self._generate_cache_key(
            table, "select", 
            fields=optimization.select_fields,
            filters=filters,
            limit=optimization.limit,
            offset=optimization.offset,
            order_by=optimization.order_by
        )
        
        # Try cache first
        if optimization.use_cache:
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_result
        
        try:
            start_time = time.time()
            
            # Build optimized query
            columns = ",".join(optimization.select_fields) if optimization.select_fields else "*"
            query = self._client.table(table).select(columns)
            
            # Apply filters efficiently
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
            
            # Apply ordering
            if optimization.order_by:
                if optimization.order_by.startswith("-"):
                    query = query.order(optimization.order_by[1:], desc=True)
                else:
                    query = query.order(optimization.order_by)
            
            # Apply pagination
            if optimization.limit:
                query = query.limit(optimization.limit)
            if optimization.offset:
                query = query.range(optimization.offset, optimization.offset + (optimization.limit or 1000) - 1)
            
            # Execute query
            response = query.execute()
            result = response.data if response.data else []
            
            # Cache result
            if optimization.use_cache:
                cache.set(cache_key, result, timeout=optimization.cache_ttl)
            
            query_time = time.time() - start_time
            logger.debug(f"Query executed in {query_time:.3f}s, returned {len(result)} rows")
            
            return result
            
        except APIError as e:
            logger.error(f"Supabase API error in optimized_select: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in optimized_select: {str(e)}")
            raise
    
    async def batch_select(
        self, 
        queries: List[Dict[str, Any]]
    ) -> List[List[Dict[str, Any]]]:
        """
        Execute multiple SELECT queries in parallel for maximum performance
        """
        if not self.is_available:
            raise RuntimeError("Supabase client not available")
        
        async def execute_query(query_config):
            table = query_config['table']
            optimization = query_config.get('optimization', QueryOptimization())
            filters = query_config.get('filters', {})
            return await self.optimized_select(table, optimization, **filters)
        
        # Execute all queries in parallel
        start_time = time.time()
        results = await asyncio.gather(*[execute_query(q) for q in queries], return_exceptions=True)
        total_time = time.time() - start_time
        
        logger.info(f"Batch executed {len(queries)} queries in {total_time:.3f}s")
        
        # Handle exceptions
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Query {i} failed: {result}")
                processed_results.append([])
            else:
                processed_results.append(result)
        
        return processed_results
    
    async def optimized_insert(
        self, 
        table: str, 
        data: Union[Dict[str, Any], List[Dict[str, Any]]],
        return_fields: Optional[List[str]] = None
    ) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Optimized INSERT operation with batch support
        """
        if not self.is_available:
            raise RuntimeError("Supabase client not available")
        
        try:
            start_time = time.time()
            
            # Handle batch inserts
            if isinstance(data, list):
                # Batch insert for better performance
                query = self._client.table(table).insert(data)
            else:
                query = self._client.table(table).insert(data)
            
            # Select specific fields for return
            if return_fields:
                query = query.select(",".join(return_fields))
            
            response = query.execute()
            result = response.data
            
            # Invalidate related cache
            cache_pattern = f"supabase:{table}:select:*"
            cache.delete_pattern(cache_pattern)
            
            insert_time = time.time() - start_time
            logger.debug(f"Insert executed in {insert_time:.3f}s")
            
            return result[0] if isinstance(data, dict) and result else result
            
        except APIError as e:
            logger.error(f"Supabase API error in optimized_insert: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in optimized_insert: {str(e)}")
            raise
    
    async def optimized_update(
        self, 
        table: str, 
        data: Dict[str, Any],
        return_fields: Optional[List[str]] = None,
        **filters
    ) -> List[Dict[str, Any]]:
        """
        Optimized UPDATE operation
        """
        if not self.is_available:
            raise RuntimeError("Supabase client not available")
        
        try:
            start_time = time.time()
            
            query = self._client.table(table).update(data)
            
            # Apply filters
            for key, value in filters.items():
                query = query.eq(key, value)
            
            # Select specific fields for return
            if return_fields:
                query = query.select(",".join(return_fields))
            
            response = query.execute()
            result = response.data if response.data else []
            
            # Invalidate related cache
            cache_pattern = f"supabase:{table}:*"
            cache.delete_pattern(cache_pattern)
            
            update_time = time.time() - start_time
            logger.debug(f"Update executed in {update_time:.3f}s")
            
            return result
            
        except APIError as e:
            logger.error(f"Supabase API error in optimized_update: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in optimized_update: {str(e)}")
            raise
    
    async def optimized_rpc(
        self, 
        function_name: str, 
        params: Dict[str, Any] = None,
        use_cache: bool = True,
        cache_ttl: int = 300
    ) -> Any:
        """
        Optimized RPC execution with caching
        """
        if not self.is_available:
            raise RuntimeError("Supabase client not available")
        
        params = params or {}
        
        # Generate cache key for RPC
        cache_key = self._generate_cache_key("rpc", function_name, **params)
        
        # Try cache first
        if use_cache:
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"RPC cache hit for {function_name}")
                return cached_result
        
        try:
            start_time = time.time()
            
            response = self._client.rpc(function_name, params).execute()
            result = response.data
            
            # Cache result
            if use_cache:
                cache.set(cache_key, result, timeout=cache_ttl)
            
            rpc_time = time.time() - start_time
            logger.debug(f"RPC {function_name} executed in {rpc_time:.3f}s")
            
            return result
            
        except APIError as e:
            logger.error(f"Supabase RPC error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in RPC: {str(e)}")
            raise
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Optimized health check
        """
        try:
            if not self.is_available:
                return {"status": "unavailable", "message": "Supabase client not configured"}
            
            start_time = time.time()
            
            # Quick health check query
            response = self._client.table("information_schema.tables").select("table_name").limit(1).execute()
            
            response_time = time.time() - start_time
            
            return {
                "status": "healthy",
                "message": "Supabase connection is working",
                "response_time_ms": round(response_time * 1000, 2),
                "connection_pool": "active" if self._session else "inactive"
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Supabase connection failed: {str(e)}"
            }

# Global optimized instance
optimized_supabase = OptimizedSupabaseManager()

# Convenience functions for easy migration
async def fast_select(
    table: str, 
    fields: Optional[List[str]] = None,
    limit: Optional[int] = None,
    order_by: Optional[str] = None,
    use_cache: bool = True,
    **filters
) -> List[Dict[str, Any]]:
    """Fast SELECT with optimizations"""
    optimization = QueryOptimization(
        select_fields=fields,
        limit=limit,
        order_by=order_by,
        use_cache=use_cache
    )
    return await optimized_supabase.optimized_select(table, optimization, **filters)

async def fast_insert(
    table: str, 
    data: Union[Dict[str, Any], List[Dict[str, Any]]],
    return_fields: Optional[List[str]] = None
) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    """Fast INSERT with batch support"""
    return await optimized_supabase.optimized_insert(table, data, return_fields)

async def fast_update(
    table: str, 
    data: Dict[str, Any],
    return_fields: Optional[List[str]] = None,
    **filters
) -> List[Dict[str, Any]]:
    """Fast UPDATE operation"""
    return await optimized_supabase.optimized_update(table, data, return_fields, **filters)

async def fast_rpc(
    function_name: str, 
    params: Dict[str, Any] = None,
    use_cache: bool = True
) -> Any:
    """Fast RPC execution"""
    return await optimized_supabase.optimized_rpc(function_name, params, use_cache)
