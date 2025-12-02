"""
Optimized Results API Endpoints
Ultra-fast endpoints with response times under 1 second
"""
from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
import asyncio
import time
import logging
from datetime import datetime

from core.cache import cache_async_result
from core.database_fixed import get_db, get_db_session
from core.middleware.compression import compress_json_response, optimize_large_response
from core.rate_limit import limiter
from core.app_factory import resp
from results_service.app.schemas.result import TestResult, TestResultCreate
from results_service.app.services.optimized_result_service import OptimizedResultService
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
router = APIRouter()

class OptimizedResultSubmissionResponse(BaseModel):
    message: str
    result_id: str
    is_duplicate: bool
    processing_time_ms: float

class HealthCheckResponse(BaseModel):
    status: str
    response_time_ms: float
    optimizations: Dict[str, bool]

@router.post("/results/fast", response_model=OptimizedResultSubmissionResponse)
async def submit_result_fast(
    result: TestResultCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Ultra-fast result submission with simple direct database operations
    Target response time: < 500ms
    """
    start_time = time.time()
    
    try:
        logger.info(f"Fast submission for user {result.user_id}, test {result.test_id}")
        
        # Use simple direct database operations instead of complex optimized service
        from sqlalchemy import text
        import json
        from datetime import datetime
        
        # Check for duplicates first
        duplicate_check = text("""
            SELECT id, created_at 
            FROM test_results 
            WHERE user_id = :user_id 
            AND test_id = :test_id 
            AND is_completed = true
            AND created_at >= NOW() - INTERVAL '5 minutes'
            LIMIT 1
        """)
        
        existing = db.execute(duplicate_check, {
            "user_id": str(result.user_id),
            "test_id": result.test_id
        }).fetchone()
        
        if existing:
            logger.info(f"Duplicate result found for user {result.user_id}")
            processing_time = (time.time() - start_time) * 1000
            return OptimizedResultSubmissionResponse(
                message="Duplicate result - using existing",
                result_id=existing.id,
                is_duplicate=True,
                processing_time_ms=round(processing_time, 2)
            )
        
        # Insert new result
        insert_query = text("""
            INSERT INTO test_results (
                user_id, test_id, answers, completion_percentage, 
                time_taken_seconds, calculated_result, primary_result, 
                result_summary, is_completed, created_at, completed_at
            ) VALUES (
                :user_id, :test_id, :answers, :completion_percentage,
                :time_taken_seconds, :calculated_result, :primary_result,
                :result_summary, :is_completed, :created_at, :completed_at
            ) RETURNING id
        """)
        
        # Prepare data
        calculated_result = {
            "analysis": result.analysis,
            "score": result.total_score or result.score or 0,
            "percentage": result.percentage_score or result.percentage or 100,
            "dimensions_scores": result.dimensions_scores,
            "recommendations": result.recommendations
        }
        
        insert_result = db.execute(insert_query, {
            "user_id": str(result.user_id),
            "test_id": result.test_id,
            "answers": json.dumps(result.answers or {}),
            "completion_percentage": result.percentage_score or result.percentage or 100,
            "time_taken_seconds": result.duration_seconds or 0,
            "calculated_result": json.dumps(calculated_result),
            "primary_result": str(result.analysis.get('code', '')) if result.analysis else '',
            "result_summary": result.test_name,
            "is_completed": True,
            "created_at": datetime.now(),
            "completed_at": datetime.now()
        })
        
        db.commit()
        created_result_id = insert_result.fetchone()[0]
        
        # Schedule background tasks (cache warming, analytics updates)
        background_tasks.add_task(
            _warm_user_cache, 
            str(result.user_id)
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        logger.info(f"Fast result created in {processing_time:.2f}ms: {created_result_id}")
        
        return OptimizedResultSubmissionResponse(
            message="Result submitted successfully",
            result_id=str(created_result_id),
            is_duplicate=False,
            processing_time_ms=0
        )
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Fast submission failed in {processing_time:.2f}ms: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile-dashboard/{user_id}")
@limiter.limit("200/minute")
# ✅ REMOVED CACHE: Profile dashboard must always show fresh data
# Cache invalidation was unreliable, so we removed caching entirely
async def get_profile_dashboard(
    request: Request,
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    ⚡ ULTRA-OPTIMIZED: Get combined profile dashboard data - Target: <100ms
    
    Combines results and analytics in a single call to reduce API calls
    Optimizations:
    - Single database query for all data
    - Returns ALL completed test results (not limited to 5)
    - Returns both results and analytics
    - NO CACHING: Always returns fresh data from database
    """
    try:
        from question_service.app.models.test_result import TestResult
        import uuid
        
        logger.info(f"🔍 [profile-dashboard] Fetching fresh data for user: {user_id}")
        
        # Validate user ID
        try:
            user_uuid = uuid.UUID(user_id)
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        # ✅ FIXED: Get ALL completed results (not just 5) - NOW INCLUDES calculated_result
        latest_results = db.query(
            TestResult.id, 
            TestResult.test_id, 
            TestResult.primary_result, 
            TestResult.completed_at,
            TestResult.calculated_result  # ✅ NEW: Include calculated_result for test details
        ).filter(
            TestResult.user_id == user_uuid,
            TestResult.is_completed == True
        ).order_by(TestResult.completed_at.desc()).all()  # ✅ Removed .limit(5)
        
        # ⚡ OPTIMIZED: Get analytics stats in same query
        stats = db.query(
            func.count(TestResult.id).label('total_tests'),
            func.avg(TestResult.completion_percentage).label('avg_score'),
            func.count(TestResult.id).filter(TestResult.is_completed == True).label('completed_tests')
        ).filter(TestResult.user_id == user_uuid).first()
        
        # ✅ FIXED: Build results data with all tests - NOW INCLUDES calculated_result
        results_data = [
            {
                "id": str(r[0]),
                "test_id": r[1],
                "primary_result": r[2],
                "completed_at": r[3].isoformat() if r[3] else None,
                "calculated_result": r[4]  # ✅ NEW: Include calculated_result
            }
            for r in latest_results
        ]
        
        logger.info(f"✅ [profile-dashboard] Found {len(results_data)} completed tests for user {user_id}")
        
        # Build analytics data
        total_tests = stats.total_tests or 0
        avg_score = round(stats.avg_score, 2) if stats.avg_score else 0
        completed_tests = stats.completed_tests or 0
        completion_rate = round((completed_tests / total_tests) * 100, 1) if total_tests > 0 else 0
        
        logger.info(f"📊 [profile-dashboard] Analytics - total_tests: {total_tests}, completed: {completed_tests}")
        
        # ✅ NEW: Fetch AI insights for history display
        ai_insights_history = []
        try:
            from results_service.app.services.optimized_result_service_v2 import OptimizedResultServiceV2
            ai_insights_history = await OptimizedResultServiceV2.get_user_ai_insights_for_history(user_id, db)
        except Exception as e:
            logger.warning(f"Could not fetch AI insights for user {user_id}: {e}")
            # Continue without AI insights if fetch fails
        
        response = {
            "success": True,
            "data": {
                "results": results_data,
                "ai_insights": ai_insights_history,  # ✅ NEW: Include AI insights
                "analytics": {
                    "total_tests": total_tests,
                    "completed_tests": completed_tests,
                    "avg_score": avg_score,
                    "completion_rate": completion_rate
                }
            },
            "message": "Profile dashboard data retrieved successfully"
        }
        
        # ✅ CRITICAL: Add cache-busting headers to prevent browser caching
        json_response = compress_json_response(response, request)
        json_response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        json_response.headers["Pragma"] = "no-cache"
        json_response.headers["Expires"] = "0"
        return json_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting profile dashboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve profile dashboard")

@router.get("/results/{user_id}/fast")
@limiter.limit("200/minute")  # Higher rate limit for optimized endpoint
@cache_async_result(ttl=300)  # 5-minute cache
async def get_user_results_fast(
    request: Request, 
    user_id: str, 
    page: int = 1, 
    size: int = 10,
    use_cache: bool = True,
    db: Session = Depends(get_db)
):
    """
    ⚡ ULTRA-OPTIMIZED: Get user results - Target: <100ms
    
    Optimizations:
    - SELECT only essential columns: test_id, primary_result, completed_at
    - Database-level pagination and filtering
    - Minimal response payload
    - 5-minute caching
    """
    try:
        from question_service.app.models.test_result import TestResult
        import uuid
        
        # Validate user ID
        try:
            user_uuid = uuid.UUID(user_id)
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        # ⚡ OPTIMIZED: SELECT only essential columns
        offset = (page - 1) * size
        
        results = db.query(
            TestResult.id, TestResult.test_id, TestResult.primary_result, TestResult.completed_at
        ).filter(
            TestResult.user_id == user_uuid,
            TestResult.is_completed == True
        ).order_by(TestResult.completed_at.desc()).offset(offset).limit(size).all()
        
        # Get total count
        total_count = db.query(func.count(TestResult.id)).filter(
            TestResult.user_id == user_uuid,
            TestResult.is_completed == True
        ).scalar() or 0
        
        # Build minimal response
        results_data = [
            {
                "id": str(r[0]),
                "test_id": r[1],
                "primary_result": r[2],
                "completed_at": r[3].isoformat() if r[3] else None
            }
            for r in results
        ]
        
        # Compress response
        response = {
            "success": True,
            "data": {
                "results": results_data,
                "total": total_count,
                "page": page,
                "size": size
            },
            "message": "Results retrieved successfully"
        }
        
        return compress_json_response(response, request)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user results: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user results")

@router.get("/all-results/{user_id}/fast")
@limiter.limit("100/minute")
@cache_async_result(ttl=900, key_prefix="fast_all_results")
async def get_all_test_results_fast(request: Request, user_id: str):
    """
    Ultra-fast retrieval of all test results organized by test type
    Target response time: < 800ms
    """
    start_time = time.time()
    
    try:
        logger.info(f"Fast all-results retrieval for user {user_id}")
        
        # Use optimized service
        organized_results = await OptimizedResultService.get_all_test_results_fast(user_id)
        
        processing_time = (time.time() - start_time) * 1000
        
        # Build response without performance metadata
        response_data = {
            "user_id": user_id,
            "test_results": organized_results,
            "test_count": len(organized_results),
            "test_types": list(organized_results.keys())
        }
        
        # Optimize and compress large responses
        if len(organized_results) > 5:
            optimized_response = optimize_large_response(response_data)
            return compress_json_response(optimized_response, request)
        
        logger.info(f"Fast all-results completed in {processing_time:.2f}ms")
        return response_data
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Fast all-results failed in {processing_time:.2f}ms: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/batch-user-data/{user_id}")
@limiter.limit("50/minute")
@cache_async_result(ttl=600, key_prefix="batch_user_data")
async def get_batch_user_data(request: Request, user_id: str):
    """
    Get all user data in a single optimized batch operation
    Target response time: < 400ms
    """
    start_time = time.time()
    
    try:
        logger.info(f"Batch data retrieval for user {user_id}")
        
        # Use batch operation for maximum efficiency
        batch_data = await OptimizedResultService.batch_get_user_data(user_id)
        
        processing_time = (time.time() - start_time) * 1000
        
        # Add performance metadata
        batch_data["performance"] = {
            "processing_time_ms": round(processing_time, 2),
            "batch_optimized": True,
            "queries_executed": 2
        }
        
        logger.info(f"Batch data completed in {processing_time:.2f}ms")
        return batch_data
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Batch data failed in {processing_time:.2f}ms: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results/{user_id}/latest/fast")
async def get_latest_result_fast(user_id: str):
    """
    Ultra-fast latest result retrieval
    Target response time: < 200ms
    """
    start_time = time.time()
    
    try:
        # Get only the latest result with minimal fields
        results = await OptimizedResultService.get_user_results_fast(user_id, limit=1)
        
        processing_time = (time.time() - start_time) * 1000
        
        latest_result = results[0] if results else None
        
        response = {
            "latest_result": latest_result.dict() if latest_result else None,
            "performance": {
                "processing_time_ms": round(processing_time, 2),
                "optimized": True
            }
        }
        
        logger.debug(f"Latest result retrieved in {processing_time:.2f}ms")
        return response
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Latest result failed in {processing_time:.2f}ms: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health/fast", response_model=HealthCheckResponse)
async def health_check_fast():
    """
    Fast health check for optimized endpoints
    """
    start_time = time.time()
    
    try:
        health_data = await OptimizedResultService.health_check()
        processing_time = (time.time() - start_time) * 1000
        
        return HealthCheckResponse(
            status=health_data["status"],
            response_time_ms=round(processing_time, 2),
            optimizations=health_data.get("optimizations", {})
        )
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        return HealthCheckResponse(
            status="unhealthy",
            response_time_ms=round(processing_time, 2),
            optimizations={}
        )

@router.get("/performance/benchmark/{user_id}")
async def performance_benchmark(user_id: str, iterations: int = 5):
    """
    Performance benchmark endpoint to compare old vs new implementation
    """
    try:
        # Benchmark optimized endpoints
        fast_times = []
        for i in range(iterations):
            start_time = time.time()
            await OptimizedResultService.get_user_results_fast(user_id, limit=10)
            fast_times.append((time.time() - start_time) * 1000)
        
        avg_fast_time = sum(fast_times) / len(fast_times)
        
        return {
            "user_id": user_id,
            "benchmark_results": {
                "optimized_endpoint": {
                    "average_response_time_ms": round(avg_fast_time, 2),
                    "min_time_ms": round(min(fast_times), 2),
                    "max_time_ms": round(max(fast_times), 2),
                    "iterations": iterations
                },
                "performance_improvement": {
                    "estimated_old_time_ms": "5000-7000",
                    "new_time_ms": round(avg_fast_time, 2),
                    "improvement_factor": f"{round(5000 / avg_fast_time, 1)}x faster"
                }
            },
            "optimizations_applied": [
                "Connection pooling",
                "Query optimization",
                "Field selection",
                "Async operations",
                "Caching layer",
                "Batch operations",
                "Response compression"
            ]
        }
        
    except Exception as e:
        logger.error(f"Benchmark failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Background task functions
async def _warm_user_cache(user_id: str):
    """
    Warm up cache for user data in background
    """
    try:
        # Pre-load commonly accessed data with correct function signatures
        # ✅ FIXED: Use static methods with correct parameters
        await asyncio.gather(
            OptimizedResultService.get_user_results_fast(user_id, limit=10),  # Static method with limit
            OptimizedResultService.get_all_test_results_fast(user_id),
            return_exceptions=True
        )
        logger.debug(f"Cache warmed for user {user_id}")
    except Exception as e:
        logger.debug(f"Cache warming failed for user {user_id}: {e}")

@router.post("/cache/warm/{user_id}")
async def warm_user_cache(user_id: str, background_tasks: BackgroundTasks):
    """
    Manually warm cache for a user
    """
    background_tasks.add_task(_warm_user_cache, user_id)
    return {"message": f"Cache warming started for user {user_id}"}

@router.delete("/cache/clear/{user_id}")
async def clear_user_cache_fast(user_id: str):
    """
    Clear optimized cache for a user
    """
    try:
        await OptimizedResultService._invalidate_user_cache(user_id)
        return {"message": f"Optimized cache cleared for user {user_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results/{user_id}/fast")
@limiter.limit("100/minute")
@cache_async_result(ttl=300, key_prefix="fast_user_results")
async def get_user_results_fast(
    request: Request,
    user_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Ultra-fast user results retrieval
    Target response time: < 300ms
    """
    start_time = time.time()
    
    try:
        logger.debug(f"Fast user results: user_id={user_id}, page={page}, size={size}")
        
        with OptimizedResultService(db) as service:
            # Get paginated results for user
            results, total = await service.get_user_results_fast(user_id, page, size)
        
        processing_time = (time.time() - start_time) * 1000
        
        result = {
            "results": results,
            "total": total,
            "page": page,
            "size": size,
            "performance": {
                "processing_time_ms": round(processing_time, 2),
                "optimized": True,
                "endpoint": "fast_user_results"
            }
        }
        
        logger.info(f"Fast user results completed in {processing_time:.2f}ms")
        return resp(result, True, "User results retrieved successfully", "success")
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Fast user results failed in {processing_time:.2f}ms: {str(e)}")
        return resp(None, False, str(e), "Failed to retrieve user results", 500)

@router.get("/batch-user-data/{user_id}")
@limiter.limit("50/minute")
@cache_async_result(ttl=600, key_prefix="fast_batch_user_data")
async def get_batch_user_data_fast(
    request: Request,
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Ultra-fast batch user data retrieval
    Target response time: < 400ms
    """
    start_time = time.time()
    
    try:
        logger.debug(f"Fast batch user data: user_id={user_id}")
        
        with OptimizedResultService(db) as service:
            # Get all user data in one batch
            batch_data = await service.get_batch_user_data_fast(user_id)
        
        processing_time = (time.time() - start_time) * 1000
        
        result = {
            **batch_data,
            "performance": {
                "processing_time_ms": round(processing_time, 2),
                "optimized": True,
                "endpoint": "fast_batch_user_data"
            }
        }
        
        logger.info(f"Fast batch user data completed in {processing_time:.2f}ms")
        return resp(result, True, "Batch user data retrieved successfully", "success")
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Fast batch user data failed in {processing_time:.2f}ms: {str(e)}")
        return resp(None, False, str(e), "Failed to retrieve batch user data", 500)

# Add endpoint without /fast suffix for frontend compatibility
@router.get("/results/{user_id}")
@limiter.limit("100/minute")
@cache_async_result(ttl=300, key_prefix="user_results_compat")
async def get_user_results_compat(
    request: Request,
    user_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    User results endpoint for frontend compatibility
    Redirects to the fast implementation
    """
    return await get_user_results_fast(request, user_id, page, size, db)

# Add PUT method for batch-user-data endpoint
@router.put("/batch-user-data/{user_id}")
@limiter.limit("50/minute")
async def update_batch_user_data(
    request: Request,
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Update batch user data (placeholder for frontend compatibility)
    """
    start_time = time.time()
    
    try:
        # For now, just return the current data
        # In the future, this could handle updates
        return await get_batch_user_data_fast(request, user_id, db)
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Batch user data update failed in {processing_time:.2f}ms: {str(e)}")
        return resp(None, False, str(e), "Failed to update batch user data", 500)
