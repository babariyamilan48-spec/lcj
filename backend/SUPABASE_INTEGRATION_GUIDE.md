# Supabase Integration Guide

## Overview

This integration provides a singleton-like structure for Supabase that ensures optimal performance and efficient connection management. The system automatically chooses between SQLAlchemy and Supabase based on availability and performance characteristics.

## Key Features

### 🚀 **Singleton Pattern**
- Thread-safe singleton implementation
- Single connection instance across the application
- Automatic connection pooling and management

### ⚡ **Performance Optimizations**
- LRU caching for frequently accessed data
- Connection pooling with configurable limits
- Automatic fallback between Supabase and SQLAlchemy
- Async/await support for non-blocking operations

### 🔄 **Smart Routing**
- Automatically chooses the best database method
- Graceful fallback when Supabase is unavailable
- Environment-based routing (dev vs production)

### 🛡️ **Error Handling**
- Comprehensive error handling and logging
- Automatic retry mechanisms
- Health monitoring and diagnostics

## Usage Examples

### Basic Operations

```python
from core.database_service import db_service

# Smart operations (automatically choose best method)
async def example_operations():
    # SELECT with automatic routing
    users = await db_service.smart_select("users", columns="id, name, email")
    
    # INSERT with automatic routing
    new_user = await db_service.smart_insert("users", {
        "name": "John Doe",
        "email": "john@example.com"
    })
    
    # Direct Supabase operations
    if db_service.supabase.is_available:
        # Advanced filtering
        active_users = await db_service.supabase_select(
            "users",
            columns="*",
            status__eq="active",
            created_at__gte="2024-01-01"
        )
        
        # RPC calls
        analytics = await db_service.supabase_rpc("get_user_analytics", {
            "start_date": "2024-01-01",
            "end_date": "2024-12-31"
        })
```

### Service Integration

```python
from core.services.supabase_service import supabase_service

async def user_management_example():
    # Create user profile
    user_data = {
        "name": "Jane Smith",
        "email": "jane@example.com",
        "preferences": {"theme": "dark", "notifications": True}
    }
    profile = await supabase_service.create_user_profile(user_data)
    
    # Get user assessments
    assessments = await supabase_service.get_user_assessments(
        user_id=profile["id"],
        limit=5
    )
    
    # Save assessment result
    result_data = {
        "user_id": profile["id"],
        "assessment_type": "career_match",
        "score": 85,
        "results": {"primary_match": "Software Engineer"}
    }
    await supabase_service.save_assessment_result(result_data)
```

### Health Monitoring

```python
# Check system health
health = await db_service.health_check()
print(f"Overall status: {health['overall']['status']}")

# Get connection info
info = await db_service.get_connection_info()
print(f"Supabase available: {info['supabase']['available']}")
```

## Configuration

### Environment Variables

Add these to your `.env.production` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Environment setting affects routing
ENVIRONMENT=production
```

### Settings Configuration

The system automatically reads configuration from your settings:

```python
# core/config/settings.py
class Settings(BaseSettings):
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    ENVIRONMENT: str = "development"
```

## Performance Benefits

### 1. **Connection Efficiency**
- Single connection instance reduces overhead
- Connection pooling prevents connection exhaustion
- Automatic connection health monitoring

### 2. **Caching Strategy**
- LRU cache for table schemas and metadata
- Smart caching of frequently accessed data
- Cache invalidation on data changes

### 3. **Async Operations**
- Non-blocking database operations
- Concurrent request handling
- Improved response times

### 4. **Smart Routing**
- Automatic selection of fastest method
- Load balancing between systems
- Fallback mechanisms for reliability

## Monitoring and Health Checks

### Built-in Health Endpoints

```
GET /health              # Overall system health
GET /health/database     # Database systems health
GET /health/supabase     # Supabase-specific health
```

### Health Check Response

```json
{
  "sqlalchemy": {
    "status": "healthy",
    "message": "SQLAlchemy connection working"
  },
  "supabase": {
    "status": "healthy", 
    "message": "Supabase connection is working"
  },
  "overall": {
    "status": "healthy",
    "message": "Both database systems operational"
  }
}
```

## Best Practices

### 1. **Use Smart Operations**
```python
# ✅ Good - Uses smart routing
await db_service.smart_select("users")

# ❌ Avoid - Forces specific method
await db_service.supabase_select("users")  # Unless you need Supabase-specific features
```

### 2. **Handle Errors Gracefully**
```python
try:
    result = await db_service.smart_insert("users", data)
except Exception as e:
    logger.error(f"Database operation failed: {e}")
    # Handle fallback or error response
```

### 3. **Use Appropriate Methods**
```python
# For simple CRUD operations
await db_service.smart_select("users")

# For complex queries with JSON operations
await db_service.supabase_select("users", metadata__contains={"premium": True})

# For raw SQL when needed
await db_service.execute_sql("SELECT custom_function()")
```

### 4. **Monitor Performance**
```python
# Regular health checks
health = await db_service.health_check()
if health["overall"]["status"] != "healthy":
    # Alert or take corrective action
    pass
```

## Migration Strategy

### 1. **Gradual Migration**
- Start with read operations using smart routing
- Migrate write operations incrementally
- Keep SQLAlchemy as fallback

### 2. **Feature Flags**
```python
# Use environment-based routing
use_supabase = settings.ENVIRONMENT == "production"
await db_service.smart_select("users", use_supabase=use_supabase)
```

### 3. **Testing**
- Test both Supabase and SQLAlchemy paths
- Verify fallback mechanisms work
- Monitor performance metrics

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check environment variables
   - Verify Supabase project settings
   - Check network connectivity

2. **Performance Issues**
   - Monitor connection pool usage
   - Check for connection leaks
   - Review query patterns

3. **Fallback Not Working**
   - Verify SQLAlchemy configuration
   - Check error handling logic
   - Review logs for specific errors

### Debug Mode

```python
# Enable detailed logging
import logging
logging.getLogger("core.supabase_client").setLevel(logging.DEBUG)
logging.getLogger("core.database_service").setLevel(logging.DEBUG)
```

## Advanced Features

### Real-time Subscriptions (Supabase Only)

```python
# Set up real-time subscriptions
await supabase_service.subscribe_to_user_updates(
    user_id="123",
    callback=handle_user_update
)
```

### Custom RPC Functions

```python
# Execute custom Supabase functions
result = await db_service.supabase_rpc("calculate_user_score", {
    "user_id": "123",
    "assessment_type": "career"
})
```

### Batch Operations

```python
# Efficient batch operations
batch_data = [{"name": f"User {i}"} for i in range(100)]
# Implement batch insert logic based on your needs
```

This integration provides a robust, scalable foundation for your application's database operations while maintaining high performance and reliability.
