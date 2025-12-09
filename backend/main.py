import os
import sys
from datetime import datetime
import logging

# Add backend root to Python path
BACKEND_ROOT = os.path.dirname(os.path.abspath(__file__))
if BACKEND_ROOT not in sys.path:
    sys.path.append(BACKEND_ROOT)

# Logging setup removed - using default configuration

from core.app_factory import create_app  # noqa: E402
from auth_service.app.api.v1.api import api_router as auth_router  # noqa: E402
from question_service.app.api.v1.api import api_router as question_router  # noqa: E402
from results_service.app.api.v1.api import api_router as results_router  # noqa: E402
from contact_service.app.api.v1.api import api_router as contact_router  # noqa: E402
from core.api.session_management import router as session_management_router  # noqa: E402
from core.api.session_singleton_management import router as session_singleton_router  # noqa: E402
from core.api.pool_monitor import router as pool_monitor_router  # noqa: E402
from core.api.connection_diagnostics import router as connection_diagnostics_router  # noqa: E402
from core.database_fixed import close_db_connection  # noqa: E402
from core.middleware.query_monitoring import *  # noqa: E402, F401, F403 - Auto-registers query monitoring

logger = logging.getLogger(__name__)

# Create unified FastAPI application
app = create_app({
    "title": "LCJ Career Assessment System - Unified API",
    "description": "Unified API combining all LCJ services: Auth, Questions, Results, and Contact",
    "version": "1.0.0",
    "include_root": False  # Disable factory root endpoint, we define our own below
})

# Include all service routers with their respective prefixes
app.include_router(auth_router, prefix="/api/v1/auth_service", tags=["Authentication"])
app.include_router(question_router, prefix="/api/v1/question_service", tags=["Questions"])
app.include_router(results_router, prefix="/api/v1/results_service", tags=["Results"])
app.include_router(contact_router, prefix="/api/v1/contact_service", tags=["Contact"])

# Include session management routers
app.include_router(session_management_router, prefix="/api/v1/core", tags=["Session Management"])
app.include_router(session_singleton_router, prefix="/api/v1/core", tags=["Session Management"])
app.include_router(pool_monitor_router, prefix="/api/v1/core", tags=["Pool Monitoring"])
app.include_router(connection_diagnostics_router, prefix="/api/v1/core", tags=["Connection Diagnostics"])

# Health check endpoints for individual services
@app.get("/health")
async def health_check():
    """⚡ ULTRA-FAST health check - no database queries"""
    # This endpoint is called by load balancers every second
    # Must respond in <100ms to avoid cascading slowness
    return {
        "status": "healthy",
        "service": "unified_lcj_api",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health/database")
async def database_health():
    """Detailed database health check"""
    try:
        from core.database_fixed import check_db_health, DatabaseMonitor
        return {
            "status": check_db_health(),
            "pool_status": DatabaseMonitor.get_pool_status(),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/health/neon")
async def neon_health():
    """Neon Postgres database health check"""
    from core.database_fixed import check_db_health
    return check_db_health()

@app.get("/health/auth")
async def auth_health():
    return {"status": "healthy", "service": "auth_service"}

@app.get("/health/questions")
async def questions_health():
    return {"status": "healthy", "service": "question_service"}

@app.get("/health/results")
async def results_health():
    return {"status": "healthy", "service": "results_service"}

@app.get("/health/contact")
async def contact_health():
    return {"status": "healthy", "service": "contact_service"}

@app.get("/")
async def root():
    return {
        "message": "LCJ Career Assessment System - Unified API (OPTIMIZED)",
        "version": "1.0.0",
        "services": {
            "auth": "/api/v1/auth_service/auth",
            "questions": "/api/v1/question_service",
            "results": "/api/v1/results_service",
            "contact": "/api/v1/contact_service"
        },
        "monitoring": {
            "health": "/health",
            "performance": "/performance",
            "metrics": "/metrics"
        },
        "docs": "/docs",
        "optimizations": [
            "Centralized Session Management",
            "Redis Caching",
            "Response Compression",
            "Database Connection Pooling",
            "Query Optimization",
            "JSON Optimization",
            "Session Monitoring",
            "User Session Isolation"
        ]
    }

@app.on_event("startup")
async def startup_event():
    print("🚀 LCJ Unified API Server starting up... (SESSION OPTIMIZED)")
    print("📋 Available services:")
    print("   • Auth Service: /api/v1/auth_service/auth")
    print("   • Question Service: /api/v1/question_service")
    print("   • Results Service: /api/v1/results_service")
    print("   • Contact Service: /api/v1/contact_service")
    print("   • Session Management: /api/v1/core/session-management")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("💚 Health Check: http://localhost:8000/health")
    print("⚡ Performance Dashboard: http://localhost:8000/performance")
    print("🔧 Session Management Features:")
    print("   • Centralized session management with guaranteed cleanup")
    print("   • User session isolation (one session per user operation)")
    print("   • Real-time session monitoring and leak detection")
    print("   • Automatic session cleanup based on thresholds")
    print("   • Session health monitoring and alerting")
    print("🚀 Performance Optimizations:")
    print("   • Redis caching with intelligent TTL")
    print("   • Response compression (gzip)")
    print("   • Database connection pooling with session management")
    print("   • Query optimization with eager loading")
    print("   • JSON response optimization")
    print("   • Background session cleanup tasks")

# Performance monitoring endpoints
@app.get("/performance")
async def performance_dashboard():
    """Get comprehensive performance dashboard"""
    from core.performance_monitor import get_performance_dashboard
    return get_performance_dashboard()

@app.get("/metrics")
async def system_metrics():
    """Get detailed system metrics"""
    from core.performance_monitor import performance_monitor
    return performance_monitor.get_system_metrics()

@app.get("/performance/test")
async def performance_test():
    """Run performance tests"""
    from core.performance_monitor import performance_monitor
    return await performance_monitor.run_performance_tests()

@app.get("/cache/status")
async def cache_status():
    """Get cache status and statistics"""
    from core.cache import cache_health_check
    return cache_health_check()

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup all database connections on shutdown"""
    print("🛑 LCJ Unified API Server shutting down...")
    try:
        close_db_connection()
        print("✅ Database connections closed successfully")
        logger.info("Database connections closed on shutdown")
    except Exception as e:
        print(f"⚠️ Error closing database connections: {e}")
        logger.error(f"Error closing database on shutdown: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
