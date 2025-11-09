"""
Performance monitoring and optimization utilities
"""
import time
import psutil
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from core.cache import cache, cache_health_check
from core.database import DatabaseMonitor, check_db_health
from core.middleware.middlewares import middleware_health_check
import asyncio

logger = logging.getLogger(__name__)

class PerformanceMonitor:
    """Comprehensive performance monitoring system"""
    
    def __init__(self):
        self.metrics = {
            "requests": 0,
            "slow_requests": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "db_queries": 0,
            "errors": 0
        }
        self.start_time = time.time()
    
    def record_request(self, duration: float, endpoint: str):
        """Record request metrics"""
        self.metrics["requests"] += 1
        if duration > 1.0:  # Slow request threshold
            self.metrics["slow_requests"] += 1
            logger.warning(f"Slow request: {endpoint} took {duration:.2f}s")
    
    def record_cache_hit(self):
        """Record cache hit"""
        self.metrics["cache_hits"] += 1
    
    def record_cache_miss(self):
        """Record cache miss"""
        self.metrics["cache_misses"] += 1
    
    def record_db_query(self):
        """Record database query"""
        self.metrics["db_queries"] += 1
    
    def record_error(self):
        """Record error"""
        self.metrics["errors"] += 1
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get comprehensive system metrics"""
        try:
            # System metrics (non-blocking)
            cpu_percent = psutil.cpu_percent(interval=0)  # Non-blocking
            memory = psutil.virtual_memory()
            try:
                disk = psutil.disk_usage('/')
            except:
                # Fallback for Windows
                disk = psutil.disk_usage('C:\\')
            
            # Application uptime
            uptime_seconds = time.time() - self.start_time
            uptime_hours = uptime_seconds / 3600
            
            # Cache metrics (with timeout)
            try:
                cache_status = cache_health_check()
            except Exception as e:
                cache_status = {"status": "error", "error": str(e)}
            
            # Database metrics (with timeout)
            try:
                db_status = check_db_health()
                db_pool_status = DatabaseMonitor.get_pool_status()
            except Exception as e:
                db_status = {"status": "error", "error": str(e)}
                db_pool_status = {"error": str(e)}
            
            # Middleware status (with timeout)
            try:
                middleware_status = middleware_health_check()
            except Exception as e:
                middleware_status = {"status": "error", "error": str(e)}
            
            # Calculate cache hit rate
            total_cache_requests = self.metrics["cache_hits"] + self.metrics["cache_misses"]
            cache_hit_rate = (self.metrics["cache_hits"] / total_cache_requests * 100) if total_cache_requests > 0 else 0
            
            # Calculate error rate
            error_rate = (self.metrics["errors"] / self.metrics["requests"] * 100) if self.metrics["requests"] > 0 else 0
            
            return {
                "timestamp": datetime.now().isoformat(),
                "system": {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_available_gb": memory.available / (1024**3),
                    "disk_percent": disk.percent,
                    "disk_free_gb": disk.free / (1024**3),
                    "uptime_hours": round(uptime_hours, 2)
                },
                "application": {
                    "total_requests": self.metrics["requests"],
                    "slow_requests": self.metrics["slow_requests"],
                    "error_rate_percent": round(error_rate, 2),
                    "db_queries": self.metrics["db_queries"],
                    "requests_per_hour": round(self.metrics["requests"] / max(uptime_hours, 0.01), 2)
                },
                "cache": {
                    "status": cache_status.get("status", "unknown"),
                    "hit_rate_percent": round(cache_hit_rate, 2),
                    "total_hits": self.metrics["cache_hits"],
                    "total_misses": self.metrics["cache_misses"]
                },
                "database": {
                    "status": db_status.get("status", "unknown"),
                    "pool_size": db_pool_status.get("pool_size", 0),
                    "active_connections": db_pool_status.get("checked_out_connections", 0),
                    "overflow_connections": db_pool_status.get("overflow_connections", 0)
                },
                "middleware": middleware_status,
                "performance_score": self._calculate_performance_score(cpu_percent, memory.percent, cache_hit_rate, error_rate)
            }
        except Exception as e:
            logger.error(f"Error getting system metrics: {e}")
            return {"error": str(e), "timestamp": datetime.now().isoformat()}
    
    def _calculate_performance_score(self, cpu_percent: float, memory_percent: float, 
                                   cache_hit_rate: float, error_rate: float) -> int:
        """Calculate overall performance score (0-100)"""
        try:
            # Start with perfect score
            score = 100
            
            # Deduct for high CPU usage
            if cpu_percent > 80:
                score -= 30
            elif cpu_percent > 60:
                score -= 15
            elif cpu_percent > 40:
                score -= 5
            
            # Deduct for high memory usage
            if memory_percent > 90:
                score -= 25
            elif memory_percent > 75:
                score -= 10
            elif memory_percent > 60:
                score -= 5
            
            # Deduct for low cache hit rate
            if cache_hit_rate < 50:
                score -= 20
            elif cache_hit_rate < 70:
                score -= 10
            elif cache_hit_rate < 85:
                score -= 5
            
            # Deduct for high error rate
            if error_rate > 5:
                score -= 25
            elif error_rate > 2:
                score -= 10
            elif error_rate > 1:
                score -= 5
            
            return max(0, score)
        except Exception:
            return 50  # Default score if calculation fails
    
    def get_optimization_recommendations(self) -> List[str]:
        """Get performance optimization recommendations"""
        recommendations = []
        
        try:
            metrics = self.get_system_metrics()
            
            # CPU recommendations
            if metrics["system"]["cpu_percent"] > 80:
                recommendations.append("High CPU usage detected. Consider scaling horizontally or optimizing CPU-intensive operations.")
            
            # Memory recommendations
            if metrics["system"]["memory_percent"] > 85:
                recommendations.append("High memory usage detected. Consider increasing memory or optimizing memory-intensive operations.")
            
            # Cache recommendations
            if metrics["cache"]["hit_rate_percent"] < 70:
                recommendations.append("Low cache hit rate. Consider increasing cache TTL or warming up frequently accessed data.")
            
            # Database recommendations
            db_connections = metrics["database"]["active_connections"]
            pool_size = metrics["database"]["pool_size"]
            if db_connections > pool_size * 0.8:
                recommendations.append("High database connection usage. Consider increasing pool size or optimizing queries.")
            
            # Error rate recommendations
            if metrics["application"]["error_rate_percent"] > 2:
                recommendations.append("High error rate detected. Review error logs and implement better error handling.")
            
            # Slow requests recommendations
            if metrics["application"]["slow_requests"] > metrics["application"]["total_requests"] * 0.1:
                recommendations.append("Many slow requests detected. Consider adding more caching or optimizing slow endpoints.")
            
            if not recommendations:
                recommendations.append("System performance is optimal. No immediate optimizations needed.")
            
        except Exception as e:
            recommendations.append(f"Could not generate recommendations: {str(e)}")
        
        return recommendations
    
    async def run_performance_tests(self) -> Dict[str, Any]:
        """Run automated performance tests"""
        results = {
            "timestamp": datetime.now().isoformat(),
            "tests": {}
        }
        
        try:
            # Test cache performance
            cache_start = time.time()
            cache.set("perf_test", "test_data", 60)
            cache.get("perf_test")
            cache_duration = time.time() - cache_start
            results["tests"]["cache_latency_ms"] = round(cache_duration * 1000, 2)
            
            # Test database performance
            db_start = time.time()
            db_status = check_db_health()
            db_duration = time.time() - db_start
            results["tests"]["db_latency_ms"] = round(db_duration * 1000, 2)
            results["tests"]["db_status"] = db_status.get("status", "unknown")
            
            # Memory allocation test
            memory_start = time.time()
            test_data = [i for i in range(10000)]  # Small memory allocation test
            del test_data
            memory_duration = time.time() - memory_start
            results["tests"]["memory_allocation_ms"] = round(memory_duration * 1000, 2)
            
            # Overall test score
            total_latency = cache_duration + db_duration + memory_duration
            if total_latency < 0.1:
                results["performance_grade"] = "A"
            elif total_latency < 0.5:
                results["performance_grade"] = "B"
            elif total_latency < 1.0:
                results["performance_grade"] = "C"
            else:
                results["performance_grade"] = "D"
            
        except Exception as e:
            results["error"] = str(e)
        
        return results

# Global performance monitor instance
performance_monitor = PerformanceMonitor()

# Utility functions for easy integration
def record_request_metrics(duration: float, endpoint: str):
    """Record request metrics"""
    performance_monitor.record_request(duration, endpoint)

def record_cache_metrics(hit: bool):
    """Record cache metrics"""
    if hit:
        performance_monitor.record_cache_hit()
    else:
        performance_monitor.record_cache_miss()

def record_error_metrics():
    """Record error metrics"""
    performance_monitor.record_error()

def get_performance_dashboard() -> Dict[str, Any]:
    """Get complete performance dashboard data"""
    try:
        metrics = performance_monitor.get_system_metrics()
        recommendations = performance_monitor.get_optimization_recommendations()
        
        return {
            "status": "healthy" if metrics.get("performance_score", 0) > 70 else "degraded",
            "metrics": metrics,
            "recommendations": recommendations,
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "last_updated": datetime.now().isoformat()
        }
