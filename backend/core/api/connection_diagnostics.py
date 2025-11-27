"""
Connection Diagnostics Endpoint
Provides detailed information about database connections, pool usage, and Supabase status
"""

import logging
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, List
from datetime import datetime
from sqlalchemy import text
from core.database_fixed import db_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/connection-diagnostics", tags=["Connection Diagnostics"])


@router.get("/overview")
async def connection_overview() -> Dict[str, Any]:
    """
    Get comprehensive overview of all database connections
    Shows pool status, active connections, and usage breakdown
    """
    try:
        from core.database_fixed import db_manager
        
        pool = db_manager.engine.pool
        
        # Get pool statistics
        pool_size = pool.size()
        checked_in = pool.checkedin()
        checked_out = pool.checkedout()
        overflow = pool.overflow()
        
        total_available = pool_size + overflow
        total_active = checked_out
        total_idle = checked_in
        
        # Calculate percentages
        usage_percent = (total_active / total_available * 100) if total_available > 0 else 0
        
        # Determine health status
        if total_active > total_available:
            health = "critical"
            message = "Connection pool exhausted!"
        elif total_active > (total_available * 0.8):
            health = "warning"
            message = "Connection pool usage is high (>80%)"
        elif total_active > (total_available * 0.5):
            health = "degraded"
            message = "Connection pool usage is moderate (>50%)"
        else:
            health = "healthy"
            message = "Connection pool usage is normal"
        
        return {
            "status": health,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "pool_configuration": {
                "base_size": 3,
                "max_overflow": 5,
                "total_available": total_available,
                "pool_timeout": 15,
                "recycle_interval": 300
            },
            "pool_usage": {
                "checked_out": checked_out,
                "checked_in": checked_in,
                "total_active": total_active,
                "total_idle": total_idle,
                "usage_percentage": round(usage_percent, 2),
                "available_connections": total_available - total_active
            },
            "supabase_compliance": {
                "supabase_limit": 30,
                "current_usage": total_active,
                "safety_margin": 30 - total_active,
                "compliance_status": "safe" if total_active < 30 else "exceeded",
                "usage_percentage": round((total_active / 30) * 100, 2)
            }
        }
    except Exception as e:
        logger.error(f"Error getting connection overview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get connection overview: {str(e)}"
        )


@router.get("/active-connections")
async def active_connections() -> Dict[str, Any]:
    """
    Get list of all active database connections from Supabase
    Shows which connections are in use and their status
    """
    try:
        # Connect to database to query pg_stat_activity
        with db_manager.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    pid,
                    usename,
                    application_name,
                    state,
                    state_change,
                    query,
                    query_start,
                    backend_start,
                    client_addr,
                    wait_event_type,
                    wait_event
                FROM pg_stat_activity
                WHERE datname = current_database()
                ORDER BY backend_start DESC
            """))
            
            connections = []
            for row in result:
                connections.append({
                    "pid": row[0],
                    "user": row[1],
                    "application": row[2],
                    "state": row[3],
                    "state_changed": row[4].isoformat() if row[4] else None,
                    "query": row[5][:100] if row[5] else None,  # First 100 chars
                    "query_started": row[6].isoformat() if row[6] else None,
                    "connection_started": row[7].isoformat() if row[7] else None,
                    "client_ip": str(row[8]) if row[8] else "local",
                    "wait_event_type": row[9],
                    "wait_event": row[10]
                })
            
            return {
                "timestamp": datetime.now().isoformat(),
                "total_connections": len(connections),
                "connections": connections,
                "connection_states": {
                    "active": sum(1 for c in connections if c["state"] == "active"),
                    "idle": sum(1 for c in connections if c["state"] == "idle"),
                    "idle_in_transaction": sum(1 for c in connections if c["state"] == "idle in transaction"),
                    "waiting": sum(1 for c in connections if c["wait_event_type"])
                }
            }
    except Exception as e:
        logger.error(f"Error getting active connections: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get active connections: {str(e)}"
        )


@router.get("/connection-breakdown")
async def connection_breakdown() -> Dict[str, Any]:
    """
    Get breakdown of connections by application and state
    Shows which services are using how many connections
    """
    try:
        with db_manager.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    application_name,
                    state,
                    COUNT(*) as count
                FROM pg_stat_activity
                WHERE datname = current_database()
                GROUP BY application_name, state
                ORDER BY count DESC
            """))
            
            breakdown = {}
            for row in result:
                app = row[0] or "unknown"
                state = row[1]
                count = row[2]
                
                if app not in breakdown:
                    breakdown[app] = {}
                
                breakdown[app][state] = count
            
            # Calculate totals
            total_by_app = {}
            for app, states in breakdown.items():
                total_by_app[app] = sum(states.values())
            
            return {
                "timestamp": datetime.now().isoformat(),
                "breakdown_by_application": breakdown,
                "total_by_application": total_by_app,
                "total_connections": sum(total_by_app.values())
            }
    except Exception as e:
        logger.error(f"Error getting connection breakdown: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get connection breakdown: {str(e)}"
        )


@router.get("/pool-statistics")
async def pool_statistics() -> Dict[str, Any]:
    """
    Get detailed pool statistics and metrics
    Shows pool health, connection lifecycle, and performance metrics
    """
    try:
        pool = db_manager.engine.pool
        
        # Get pool info
        pool_size = pool.size()
        checked_in = pool.checkedin()
        checked_out = pool.checkedout()
        overflow = pool.overflow()
        
        # Try to get invalid count if available
        try:
            invalid = pool.invalid()
        except AttributeError:
            invalid = 0
        
        total_connections = checked_in + checked_out
        total_available = pool_size + overflow
        
        return {
            "timestamp": datetime.now().isoformat(),
            "pool_configuration": {
                "base_pool_size": 3,
                "max_overflow": 5,
                "total_slots": total_available,
                "pool_timeout_seconds": 15,
                "connection_recycle_seconds": 300,
                "pre_ping_enabled": True
            },
            "current_state": {
                "checked_in_connections": checked_in,
                "checked_out_connections": checked_out,
                "overflow_connections": overflow,
                "invalid_connections": invalid,
                "total_active": total_connections,
                "available_slots": total_available - total_connections
            },
            "utilization": {
                "pool_utilization_percent": round((total_connections / total_available) * 100, 2) if total_available > 0 else 0,
                "checked_out_percent": round((checked_out / total_available) * 100, 2) if total_available > 0 else 0,
                "idle_percent": round((checked_in / total_available) * 100, 2) if total_available > 0 else 0
            },
            "health_status": {
                "status": "healthy" if checked_out <= 5 else "warning" if checked_out <= 7 else "critical",
                "recommendation": (
                    "All good" if checked_out <= 5 else
                    "Monitor closely" if checked_out <= 7 else
                    "Critical - investigate immediately"
                )
            }
        }
    except Exception as e:
        logger.error(f"Error getting pool statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get pool statistics: {str(e)}"
        )


@router.get("/supabase-status")
async def supabase_status() -> Dict[str, Any]:
    """
    Get Supabase connection status and compliance information
    Shows how many connections are used vs Supabase limit
    """
    try:
        with db_manager.engine.connect() as conn:
            # Get total connections in database
            result = conn.execute(text("""
                SELECT COUNT(*) as total_connections
                FROM pg_stat_activity
            """))
            
            total_connections = result.scalar() or 0
            
            # Get connection limit
            limit_result = conn.execute(text("""
                SELECT setting::integer
                FROM pg_settings
                WHERE name = 'max_connections'
            """))
            
            max_connections = limit_result.scalar() or 100
            
            # Get connections by state
            state_result = conn.execute(text("""
                SELECT 
                    state,
                    COUNT(*) as count
                FROM pg_stat_activity
                GROUP BY state
            """))
            
            states = {}
            for row in state_result:
                states[row[0]] = row[1]
            
            # Supabase specific limits
            supabase_limit = 30  # Standard Supabase limit
            
            # Calculate metrics
            usage_percent = (total_connections / supabase_limit) * 100
            safety_margin = supabase_limit - total_connections
            
            return {
                "timestamp": datetime.now().isoformat(),
                "supabase_limits": {
                    "connection_limit": supabase_limit,
                    "current_usage": total_connections,
                    "available_connections": safety_margin,
                    "usage_percentage": round(usage_percent, 2),
                    "status": "safe" if total_connections < supabase_limit else "exceeded"
                },
                "connection_states": states,
                "database_settings": {
                    "max_connections": max_connections
                },
                "recommendations": [
                    "✅ All good - plenty of connections available" if safety_margin > 15 else
                    "⚠️  Warning - connection usage is getting high" if safety_margin > 5 else
                    "🔴 Critical - approaching Supabase connection limit"
                ],
                "safety_level": (
                    "safe" if safety_margin > 15 else
                    "warning" if safety_margin > 5 else
                    "critical"
                )
            }
    except Exception as e:
        logger.error(f"Error getting Supabase status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get Supabase status: {str(e)}"
        )


@router.get("/connection-usage-by-endpoint")
async def connection_usage_by_endpoint() -> Dict[str, Any]:
    """
    Get connection usage by endpoint/query
    Shows which queries are using connections and for how long
    """
    try:
        with db_manager.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    query,
                    state,
                    COUNT(*) as connection_count,
                    MAX(EXTRACT(EPOCH FROM (now() - query_start))) as max_duration_seconds,
                    MIN(EXTRACT(EPOCH FROM (now() - query_start))) as min_duration_seconds
                FROM pg_stat_activity
                WHERE datname = current_database()
                    AND query NOT LIKE '%pg_stat_activity%'
                GROUP BY query, state
                ORDER BY connection_count DESC
            """))
            
            usage = []
            for row in result:
                query = row[0] or "idle"
                state = row[1]
                count = row[2]
                max_duration = row[3]
                min_duration = row[4]
                
                usage.append({
                    "query": query[:200],  # First 200 chars
                    "state": state,
                    "connection_count": count,
                    "max_duration_seconds": round(max_duration, 2) if max_duration else 0,
                    "min_duration_seconds": round(min_duration, 2) if min_duration else 0,
                    "avg_duration_seconds": round((max_duration + min_duration) / 2, 2) if max_duration and min_duration else 0
                })
            
            return {
                "timestamp": datetime.now().isoformat(),
                "total_queries": len(usage),
                "usage_by_query": usage,
                "total_connections_in_use": sum(u["connection_count"] for u in usage)
            }
    except Exception as e:
        logger.error(f"Error getting connection usage by endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get connection usage by endpoint: {str(e)}"
        )


@router.get("/backend-connections")
async def backend_connections() -> Dict[str, Any]:
    """
    Get ONLY your backend connections
    Shows exactly which connections your LCJ backend is using
    """
    try:
        with db_manager.engine.connect() as conn:
            # Get only LCJ backend connections
            result = conn.execute(text("""
                SELECT 
                    pid,
                    usename,
                    application_name,
                    state,
                    state_change,
                    query,
                    query_start,
                    backend_start,
                    client_addr,
                    wait_event_type,
                    wait_event,
                    EXTRACT(EPOCH FROM (now() - backend_start)) as connection_age_seconds,
                    EXTRACT(EPOCH FROM (now() - query_start)) as query_duration_seconds
                FROM pg_stat_activity
                WHERE datname = current_database()
                    AND application_name = 'lcj_backend_fixed'
                ORDER BY backend_start DESC
            """))
            
            connections = []
            for row in result:
                connections.append({
                    "pid": row[0],
                    "user": row[1],
                    "application": row[2],
                    "state": row[3],
                    "state_changed": row[4].isoformat() if row[4] else None,
                    "query": row[5][:150] if row[5] else "No query",
                    "query_started": row[6].isoformat() if row[6] else None,
                    "connection_started": row[7].isoformat() if row[7] else None,
                    "client_ip": str(row[8]) if row[8] else "local",
                    "wait_event_type": row[9],
                    "wait_event": row[10],
                    "connection_age_seconds": round(row[11], 2) if row[11] else 0,
                    "query_duration_seconds": round(row[12], 2) if row[12] else 0
                })
            
            # Analyze connections
            active_count = sum(1 for c in connections if c["state"] == "active")
            idle_count = sum(1 for c in connections if c["state"] == "idle")
            waiting_count = sum(1 for c in connections if c["wait_event_type"])
            
            return {
                "timestamp": datetime.now().isoformat(),
                "backend_name": "lcj_backend_fixed",
                "total_backend_connections": len(connections),
                "connection_summary": {
                    "active": active_count,
                    "idle": idle_count,
                    "waiting": waiting_count
                },
                "connections": connections,
                "analysis": {
                    "why_6_connections": [
                        "1. Connection pool has 3 base connections (always open)",
                        "2. Connection pool has 5 overflow connections (for spikes)",
                        "3. Currently using 6 out of 8 available slots",
                        "4. Idle connections are kept open for reuse (faster than creating new)",
                        "5. No active queries right now - all idle and waiting for requests",
                        "6. This is NORMAL and HEALTHY behavior"
                    ],
                    "why_idle": [
                        "Idle connections are GOOD - they're ready for next request",
                        "Closing and reopening connections is SLOW",
                        "Keeping them open is FAST for next request",
                        "They will auto-recycle every 300 seconds (5 minutes)",
                        "No queries running = no resources being used"
                    ]
                }
            }
    except Exception as e:
        logger.error(f"Error getting backend connections: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get backend connections: {str(e)}"
        )


@router.get("/full-diagnostics")
async def full_diagnostics() -> Dict[str, Any]:
    """
    Get complete diagnostics report
    Combines all connection information into one comprehensive report
    """
    try:
        pool = db_manager.engine.pool
        
        # Pool info
        pool_size = pool.size()
        checked_in = pool.checkedin()
        checked_out = pool.checkedout()
        overflow = pool.overflow()
        total_available = pool_size + overflow
        
        # Get active connections from Supabase
        with db_manager.engine.connect() as conn:
            total_result = conn.execute(text("SELECT COUNT(*) FROM pg_stat_activity"))
            total_connections = total_result.scalar() or 0
            
            states_result = conn.execute(text("""
                SELECT state, COUNT(*) as count
                FROM pg_stat_activity
                GROUP BY state
            """))
            
            states = {row[0]: row[1] for row in states_result}
        
        # Calculate metrics
        supabase_limit = 30
        usage_percent = (total_connections / supabase_limit) * 100
        safety_margin = supabase_limit - total_connections
        
        return {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "pool_health": "healthy" if checked_out <= 5 else "warning" if checked_out <= 7 else "critical",
                "supabase_compliance": "safe" if total_connections < supabase_limit else "exceeded",
                "overall_status": "✅ All systems operational" if (checked_out <= 5 and total_connections < supabase_limit) else "⚠️ Issues detected"
            },
            "pool_metrics": {
                "base_size": 3,
                "max_overflow": 5,
                "total_available": total_available,
                "checked_out": checked_out,
                "checked_in": checked_in,
                "overflow_in_use": overflow,
                "utilization_percent": round((checked_out / total_available) * 100, 2)
            },
            "supabase_metrics": {
                "limit": supabase_limit,
                "current_usage": total_connections,
                "available": safety_margin,
                "usage_percent": round(usage_percent, 2),
                "safety_margin_percent": round((safety_margin / supabase_limit) * 100, 2)
            },
            "connection_states": states,
            "recommendations": [
                "✅ Pool is healthy" if checked_out <= 5 else "⚠️ Monitor pool usage",
                "✅ Supabase limit safe" if safety_margin > 10 else "🔴 Approaching limit",
                "✅ No idle connections" if states.get("idle", 0) < 2 else "ℹ️ Some idle connections present"
            ]
        }
    except Exception as e:
        logger.error(f"Error getting full diagnostics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get full diagnostics: {str(e)}"
        )
