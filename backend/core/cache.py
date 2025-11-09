"""
High-performance Redis caching layer with intelligent cache strategies
"""
import redis
import json
import pickle
import hashlib
from typing import Any, Optional, Dict, List, Union
from datetime import datetime, timedelta
from functools import wraps
import asyncio
import logging
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
        """Delete keys matching pattern"""
        if not self.redis_client:
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {e}")
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
            from core.database import get_db
            
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

# Health check for cache
def cache_health_check() -> Dict[str, Any]:
    """Check cache health status"""
    if not cache.redis_client:
        return {"status": "unhealthy", "error": "Redis not connected"}
    
    try:
        # Test basic operations
        test_key = "health_check"
        cache.set(test_key, "test", 10)
        result = cache.get(test_key)
        cache.delete(test_key)
        
        if result == "test":
            return {"status": "healthy", "redis_connected": True}
        else:
            return {"status": "degraded", "error": "Cache operations failed"}
    
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
