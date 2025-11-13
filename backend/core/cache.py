"""
High-performance Redis caching layer with intelligent cache strategies
"""
import redis
import json
import pickle
import hashlib
import logging
from typing import Any, Optional, Dict, List, Union
from datetime import datetime, timedelta
from functools import wraps

import asyncio
from core.config.settings import settings

logger = logging.getLogger(__name__)

class CacheManager:
    """High-performance Redis cache manager with intelligent strategies"""
    
    def __init__(self):
        self.redis_client = None
        self._connect()
    
    def _connect(self):
        """Connect to Redis with fallback handling"""
        try:
            # Try to get Redis URL from environment
            redis_url = getattr(settings, 'REDIS_URL', 'redis://localhost:6379/0')
            
            if redis_url.startswith('rediss://'):
                # SSL Redis connection
                self.redis_client = redis.from_url(
                    redis_url,
                    decode_responses=False,
                    ssl_cert_reqs=None,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    retry_on_timeout=True,
                    health_check_interval=30
                )
            else:
                # Regular Redis connection
                self.redis_client = redis.from_url(
                    redis_url,
                    decode_responses=False,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    retry_on_timeout=True,
                    health_check_interval=30
                )
            
            # Test connection
            self.redis_client.ping()
            logger.info("Redis cache connected successfully")
            
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Cache will be disabled.")
            self.redis_client = None
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate consistent cache key"""
        # Filter out non-serializable objects like Request
        serializable_args = []
        for arg in args:
            if hasattr(arg, '__dict__') and hasattr(arg, 'method'):  # Skip Request objects
                continue
            serializable_args.append(str(arg))
        
        key_data = f"{prefix}:{':'.join(serializable_args)}"
        
        if kwargs:
            # Filter out non-serializable kwargs
            serializable_kwargs = {}
            for k, v in kwargs.items():
                if hasattr(v, '__dict__') and hasattr(v, 'method'):  # Skip Request objects
                    continue
                try:
                    json.dumps(v)  # Test if serializable
                    serializable_kwargs[k] = v
                except (TypeError, ValueError):
                    serializable_kwargs[k] = str(v)  # Convert to string if not serializable
            
            if serializable_kwargs:
                key_data += f":{hashlib.md5(json.dumps(serializable_kwargs, sort_keys=True).encode()).hexdigest()}"
        
        return key_data
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.redis_client:
            return None
        
        try:
            data = self.redis_client.get(key)
            if data:
                return pickle.loads(data)
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
        return None
    
    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set value in cache with TTL"""
        if not self.redis_client:
            return False
        
        try:
            serialized = pickle.dumps(value)
            return self.redis_client.setex(key, ttl, serialized)
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.redis_client:
            return False
        
        try:
            return bool(self.redis_client.delete(key))
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching a pattern with optimized batch processing"""
        if not self.redis_client:
            return 0
        
        try:
            # Use SCAN for better performance with large datasets
            cursor = 0
            deleted_count = 0
            batch_size = 1000
            
            while True:
                cursor, keys = self.redis_client.scan(cursor, match=pattern, count=batch_size)
                if keys:
                    # Delete in batches for better performance
                    deleted_count += self.redis_client.delete(*keys)
                
                if cursor == 0:
                    break
            
            logger.debug(f"Deleted {deleted_count} keys matching pattern: {pattern}")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error deleting pattern {pattern}: {e}")
            return 0
    
    async def delete_pattern_async(self, pattern: str) -> int:
        """Async version of delete_pattern for non-blocking operations"""
        if not self.redis_client:
            return 0
        
        try:
            # Run in thread pool to avoid blocking
            import asyncio
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, self.delete_pattern, pattern)
        except Exception as e:
            logger.error(f"Error in async delete pattern {pattern}: {e}")
            return 0
    
    def get_or_set(self, key: str, callback, ttl: int = 300) -> Any:
        """Get from cache or set using callback"""
        value = self.get(key)
        if value is not None:
            return value
        
        # Generate value using callback
        value = callback()
        if value is not None:
            self.set(key, value, ttl)
        return value

# Global cache instance
cache = CacheManager()

# Cache decorators for different use cases
def cache_result(ttl: int = 300, key_prefix: str = "default"):
    """Decorator to cache function results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = cache._generate_key(f"{key_prefix}:{func.__name__}", *args, **kwargs)
            
            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                logger.debug(f"Cache HIT for {cache_key}")
                return result
            
            # Execute function and cache result
            logger.debug(f"Cache MISS for {cache_key}")
            result = func(*args, **kwargs)
            if result is not None:
                cache.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator

def cache_async_result(ttl: int = 300, key_prefix: str = "async"):
    """Decorator to cache async function results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Filter out Request objects for cache key generation
            cache_args = []
            cache_kwargs = {}
            
            for arg in args:
                if not (hasattr(arg, '__dict__') and hasattr(arg, 'method')):  # Skip Request objects
                    cache_args.append(arg)
            
            for k, v in kwargs.items():
                if not (hasattr(v, '__dict__') and hasattr(v, 'method')):  # Skip Request objects
                    cache_kwargs[k] = v
            
            # Generate cache key
            cache_key = cache._generate_key(f"{key_prefix}:{func.__name__}", *cache_args, **cache_kwargs)
            
            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                logger.debug(f"Cache HIT for {cache_key}")
                return result
            
            # Execute function and cache result
            logger.debug(f"Cache MISS for {cache_key}")
            result = await func(*args, **kwargs)
            if result is not None:
                cache.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator

# Specialized cache functions for common patterns
class QueryCache:
    """Specialized caching for database queries"""
    
    @staticmethod
    def get_user_results(user_id: str) -> Optional[List]:
        """Get cached user results"""
        key = f"user_results:{user_id}"
        return cache.get(key)
    
    @staticmethod
    def set_user_results(user_id: str, results: List, ttl: int = 600):
        """Cache user results"""
        key = f"user_results:{user_id}"
        cache.set(key, results, ttl)
    
    @staticmethod
    def invalidate_user_results(user_id: str):
        """Invalidate user results cache"""
        pattern = f"user_results:{user_id}*"
        cache.delete_pattern(pattern)
    
    @staticmethod
    def invalidate_completion_status(user_id: str):
        """Invalidate completion status cache for a user"""
        # Direct cache key deletion (exact matches)
        exact_keys = [
            f"completion_status:{user_id}",
            f"completed_tests:{user_id}",
            f"progress_summary:{user_id}",
            f"completion_status_v2:{user_id}",
            # API-level cache keys that were causing stale data
            f"completion_status_v2:get_completion_status:{user_id}",
            f"progress_summary:get_progress_summary:{user_id}",
            f"completed_tests_list:get_completed_tests:{user_id}"
        ]
        
        for key in exact_keys:
            try:
                cache.delete(key)
                logger.debug(f"Deleted cache key: {key}")
            except Exception as e:
                logger.debug(f"Cache key {key} not found: {e}")
        
        # Pattern-based deletion for broader cleanup
        patterns = [
            f"completion_status:*{user_id}*",
            f"*completion_status*{user_id}*",  # API cache patterns
            f"*progress_summary*{user_id}*",   # API cache patterns
            f"*completed_tests*{user_id}*",    # API cache patterns
            f"all_results:*{user_id}*",
            f"paginated_results:*{user_id}*",
            f"user_analytics:*{user_id}*",
            f"user_profile:*{user_id}*"
        ]
        for pattern in patterns:
            try:
                deleted_count = cache.delete_pattern(pattern)
                if deleted_count > 0:
                    logger.debug(f"Deleted {deleted_count} keys matching pattern: {pattern}")
            except Exception as e:
                logger.debug(f"Pattern deletion failed for {pattern}: {e}")
    
    @staticmethod
    def invalidate_all_user_cache(user_id: str):
        """Invalidate all cache entries for a user"""
        QueryCache.invalidate_user_results(user_id)
        QueryCache.invalidate_completion_status(user_id)
    
    @staticmethod
    def get_questions(test_id: int, section_id: Optional[int] = None) -> Optional[List]:
        """Get cached questions"""
        key = f"questions:{test_id}:{section_id or 'all'}"
        return cache.get(key)
    
    @staticmethod
    def set_questions(test_id: int, questions: List, section_id: Optional[int] = None, ttl: int = 1800):
        """Cache questions"""
        key = f"questions:{test_id}:{section_id or 'all'}"
        cache.set(key, questions, ttl)
    
    @staticmethod
    def get_ai_insights(user_id: str) -> Optional[Dict]:
        """Get cached AI insights"""
        key = f"ai_insights:{user_id}"
        return cache.get(key)
    
    @staticmethod
    def set_ai_insights(user_id: str, insights: Dict, ttl: int = 3600):
        """Cache AI insights"""
        key = f"ai_insights:{user_id}"
        cache.set(key, insights, ttl)

# Cache warming functions
class CacheWarmer:
    """Proactive cache warming for frequently accessed data"""
    
    @staticmethod
    async def warm_popular_questions():
        """Pre-load popular questions into cache"""
        try:
            from question_service.app.services.question_service import QuestionService
            from core.database_singleton import get_db
            
            db = next(get_db())
            service = QuestionService(db)
            
            # Common test IDs to pre-warm
            popular_test_ids = [1, 2, 3, 4, 5]  # Adjust based on your data
            
            for test_id in popular_test_ids:
                questions, _ = service.get_questions(test_id=test_id, limit=1000)
                QueryCache.set_questions(test_id, questions, ttl=3600)
                logger.info(f"Warmed cache for test_id {test_id}")
            
            db.close()
        except Exception as e:
            logger.error(f"Cache warming failed: {e}")
    
    @staticmethod
    async def warm_user_data(user_id: str):
        """Pre-load user data into cache"""
        try:
            from results_service.app.services.result_service import ResultService
            
            # Warm user results
            results = await ResultService.get_user_results(user_id)
            QueryCache.set_user_results(user_id, results)
            
            logger.info(f"Warmed cache for user {user_id}")
        except Exception as e:
            logger.error(f"User cache warming failed: {e}")

# Optimized cache methods for high-performance operations
class OptimizedCache:
    """High-performance cache operations for optimized endpoints"""
    
    @staticmethod
    def batch_get(keys: List[str]) -> Dict[str, Any]:
        """Get multiple cache keys in a single operation"""
        if not cache.is_available():
            return {}
        
        try:
            values = cache.redis_client.mget(keys)
            result = {}
            
            for i, key in enumerate(keys):
                if values[i] is not None:
                    try:
                        result[key] = pickle.loads(values[i])
                    except:
                        try:
                            result[key] = json.loads(values[i].decode('utf-8'))
                        except:
                            result[key] = values[i].decode('utf-8')
            
            return result
        except Exception as e:
            logger.error(f"Batch get error: {e}")
            return {}
    
    @staticmethod
    def batch_set(data: Dict[str, Any], ttl: int = 300) -> bool:
        """Set multiple cache keys in a single operation"""
        if not cache.is_available():
            return False
        
        try:
            pipe = cache.redis_client.pipeline()
            
            for key, value in data.items():
                serialized_value = pickle.dumps(value)
                pipe.setex(key, ttl, serialized_value)
            
            pipe.execute()
            return True
        except Exception as e:
            logger.error(f"Batch set error: {e}")
            return False
    
    @staticmethod
    async def warm_user_cache_optimized(user_id: str):
        """Optimized cache warming for user data"""
        try:
            from results_service.app.services.optimized_result_service import OptimizedResultService
            
            # Pre-load critical user data
            tasks = [
                OptimizedResultService.get_user_results_fast(user_id, limit=20),
                OptimizedResultService.get_all_test_results_fast(user_id),
                OptimizedResultService.batch_get_user_data(user_id)
            ]
            
            await asyncio.gather(*tasks, return_exceptions=True)
            logger.info(f"Optimized cache warmed for user {user_id}")
            
        except Exception as e:
            logger.error(f"Optimized cache warming failed: {e}")

# Health check for cache
def cache_health_check() -> Dict[str, Any]:
    """Check cache health status with performance metrics"""
    if not cache.is_available():
        return {"status": "unhealthy", "error": "Redis not connected"}
    
    try:
        import time
        
        # Test basic operations with timing
        test_key = "health_check"
        
        start_time = time.time()
        cache.set(test_key, "test", 10)
        set_time = (time.time() - start_time) * 1000
        
        start_time = time.time()
        result = cache.get(test_key)
        get_time = (time.time() - start_time) * 1000
        
        start_time = time.time()
        cache.delete(test_key)
        delete_time = (time.time() - start_time) * 1000
        
        if result == "test":
            return {
                "status": "healthy", 
                "redis_connected": True,
                "performance": {
                    "set_time_ms": round(set_time, 2),
                    "get_time_ms": round(get_time, 2),
                    "delete_time_ms": round(delete_time, 2)
                },
                "optimizations": {
                    "connection_pooling": True,
                    "batch_operations": True,
                    "async_operations": True
                }
            }
        else:
            return {"status": "degraded", "error": "Cache operations failed"}
    
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
