"""
Optimized Results API with Centralized Session Management
Ensures proper session lifecycle and prevents session leaks
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
import logging
import time
import uuid

from ...schemas.result import TestResult, TestResultCreate, AnalyticsData
from ...services.optimized_result_service_v2 import OptimizedResultServiceV2
from core.database_fixed import get_db, get_db_session
from core.database_fixed import get_db_session
from core.database_fixed import get_db_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/optimized-v2", tags=["Optimized Results V2"])

@router.post("/results/fast", response_model=TestResult)
async def create_result_fast(
    result_data: TestResultCreate,
    background_tasks: BackgroundTasks
) -> TestResult:
    """
    Create test result with optimized session management
    Ultra-fast result submission with proper session cleanup
    """
    start_time = time.time()
    
    try:
        # Validate user_id format
        try:
            uuid.UUID(str(result_data.user_id))
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid user_id format: {result_data.user_id}"
            )
        
        # Create result using optimized service
        result = await OptimizedResultServiceV2.create_result(result_data)
        
        # Log performance
        duration = time.time() - start_time
        logger.info(f"Fast result creation completed in {duration:.3f}s for user {result_data.user_id}")
        
        # Background task to cleanup any orphaned sessions for this user
        background_tasks.add_task(
            _cleanup_user_sessions_background,
            str(result_data.user_id)
        )
        
        return result
        
    except ValueError as ve:
        logger.error(f"Validation error in create_result_fast: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in create_result_fast: {e}")
        raise HTTPException(status_code=500, detail="Failed to create test result")

@router.get("/results/{user_id}/fast", response_model=List[TestResult])
async def get_user_results_fast(
    user_id: str,
    background_tasks: BackgroundTasks
) -> List[TestResult]:
    """
    Get user results with optimized session management
    Fast paginated results with proper session cleanup
    """
    start_time = time.time()
    
    try:
        # Validate user_id format
        try:
            uuid.UUID(user_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid user_id format: {user_id}"
            )
        
        # Get results using optimized service
        results = await OptimizedResultServiceV2.get_user_results(user_id)
        
        # Log performance
        duration = time.time() - start_time
        logger.info(f"Fast user results retrieval completed in {duration:.3f}s for user {user_id}, found {len(results)} results")
        
        # Background task to cleanup any orphaned sessions for this user
        background_tasks.add_task(
            _cleanup_user_sessions_background,
            user_id
        )
        
        return results
        
    except ValueError as ve:
        logger.error(f"Validation error in get_user_results_fast: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in get_user_results_fast for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user results")

@router.get("/analytics/{user_id}/fast")
async def get_user_analytics_fast(
    user_id: str,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Get user analytics with optimized session management
    Fast analytics data with proper session cleanup
    """
    start_time = time.time()
    
    try:
        # Validate user_id format
        try:
            uuid.UUID(user_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid user_id format: {user_id}"
            )
        
        # Get analytics using optimized service
        analytics = await OptimizedResultServiceV2.get_user_analytics(user_id)
        
        # Log performance
        duration = time.time() - start_time
        logger.info(f"Fast user analytics completed in {duration:.3f}s for user {user_id}")
        
        # Background task to cleanup any orphaned sessions for this user
        background_tasks.add_task(
            _cleanup_user_sessions_background,
            user_id
        )
        
        return analytics
        
    except ValueError as ve:
        logger.error(f"Validation error in get_user_analytics_fast: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in get_user_analytics_fast for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user analytics")

@router.get("/all-results/{user_id}/fast")
async def get_all_test_results_fast(
    user_id: str,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Get all test results organized by test type with optimized session management
    """
    start_time = time.time()
    
    try:
        # Validate user_id format
        try:
            uuid.UUID(user_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid user_id format: {user_id}"
            )
        
        # Get user results
        user_results = await OptimizedResultServiceV2.get_user_results(user_id)
        
        if not user_results:
            return {}
        
        # Organize results by test type (get latest result for each test type)
        organized_results = {}
        
        for result in user_results:
            test_id = result.test_id
            if test_id:
                # Keep only the latest result for each test type
                if test_id not in organized_results or result.timestamp > organized_results[test_id]['timestamp']:
                    organized_results[test_id] = {
                        'test_id': result.test_id,
                        'test_name': result.test_name,
                        'analysis': result.analysis,
                        'score': result.score,
                        'percentage': result.percentage,
                        'percentage_score': result.percentage_score,
                        'total_score': result.total_score,
                        'dimensions_scores': result.dimensions_scores,
                        'recommendations': result.recommendations,
                        'answers': result.answers,
                        'duration_minutes': result.duration_minutes,
                        'total_questions': result.total_questions,
                        'timestamp': result.timestamp.isoformat() if hasattr(result.timestamp, 'isoformat') else str(result.timestamp),
                        'completed_at': result.completed_at.isoformat() if hasattr(result.completed_at, 'isoformat') else str(result.completed_at),
                        'user_id': str(user_id)
                    }
        
        # Add AI insights to the results if they exist
        try:
            ai_insights = await OptimizedResultServiceV2.get_user_ai_insights(user_id)
            if ai_insights:
                organized_results['comprehensive-ai-insights'] = {
                    'test_id': 'comprehensive-ai-insights',
                    'test_name': 'સંપૂર્ણ AI વિશ્લેષણ રિપોર્ટ (Comprehensive AI Analysis)',
                    'analysis': 'AI_INSIGHTS',
                    'score': 100,
                    'percentage': 100,
                    'percentage_score': 100,
                    'total_score': 100,
                    'dimensions_scores': {},
                    'recommendations': [],
                    'answers': {},
                    'duration_minutes': None,
                    'total_questions': 0,
                    'timestamp': ai_insights.get('generated_at'),
                    'completed_at': ai_insights.get('generated_at'),
                    'user_id': str(user_id),
                    'insights_data': ai_insights.get('insights_data'),
                    'model_used': ai_insights.get('model_used'),
                    'insights_type': ai_insights.get('insights_type', 'comprehensive')
                }
                logger.info(f"Added AI insights to all-results for user {user_id}")
        except Exception as ai_error:
            logger.warning(f"Could not add AI insights to all-results for user {user_id}: {ai_error}")
        
        # Log performance
        duration = time.time() - start_time
        logger.info(f"Fast all-results completed in {duration:.3f}s for user {user_id}, found {len(organized_results)} test types")
        
        # Background task to cleanup any orphaned sessions for this user
        background_tasks.add_task(
            _cleanup_user_sessions_background,
            user_id
        )
        
        return organized_results
        
    except ValueError as ve:
        logger.error(f"Validation error in get_all_test_results_fast: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in get_all_test_results_fast for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve all test results")

@router.get("/session-health")
async def get_session_health_status() -> Dict[str, Any]:
    """
    Get session manager health status and statistics
    """
    try:
        health_data = get_session_health()
        return health_data
        
    except Exception as e:
        logger.error(f"Error getting session health: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": time.time()
        }

@router.post("/session-cleanup")
async def emergency_session_cleanup() -> Dict[str, str]:
    """
    Emergency cleanup of all active sessions
    Use only when necessary - will close all active database sessions
    """
    try:
        cleanup_sessions()
        logger.warning("Emergency session cleanup performed")
        return {
            "status": "success",
            "message": "All sessions cleaned up successfully"
        }
        
    except Exception as e:
        logger.error(f"Error during emergency session cleanup: {e}")
        raise HTTPException(status_code=500, detail="Failed to cleanup sessions")

@router.post("/session-cleanup/{user_id}")
async def cleanup_user_sessions(user_id: str) -> Dict[str, str]:
    """
    Force cleanup of all sessions for a specific user
    """
    try:
        # Validate user_id format
        try:
            uuid.UUID(user_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid user_id format: {user_id}"
            )
        
        force_close_user_sessions(user_id)
        logger.info(f"Forced cleanup of sessions for user {user_id}")
        
        return {
            "status": "success",
            "message": f"All sessions for user {user_id} cleaned up successfully"
        }
        
    except ValueError as ve:
        logger.error(f"Validation error in cleanup_user_sessions: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error cleaning up sessions for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to cleanup user sessions")

@router.get("/health/fast")
async def health_check_fast() -> Dict[str, Any]:
    """
    Fast health check for optimized results service
    """
    start_time = time.time()
    
    try:
        # Get session health
        session_health = get_session_health()
        
        # Basic service health
        service_health = {
            "service": "optimized_results_v2",
            "status": "healthy",
            "response_time_ms": round((time.time() - start_time) * 1000, 2),
            "timestamp": time.time()
        }
        
        # Combine health data
        health_data = {
            **service_health,
            "session_manager": session_health
        }
        
        # Determine overall status
        if session_health.get("status") != "healthy":
            health_data["status"] = "warning"
            health_data["issues"] = session_health.get("issues", [])
        
        return health_data
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "service": "optimized_results_v2",
            "status": "error",
            "error": str(e),
            "response_time_ms": round((time.time() - start_time) * 1000, 2),
            "timestamp": time.time()
        }

# Background task functions
async def _cleanup_user_sessions_background(user_id: str):
    """Background task to cleanup user sessions"""
    try:
        # Small delay to allow main operation to complete
        import asyncio
        await asyncio.sleep(1)
        
        # Force cleanup of any remaining sessions for this user
        force_close_user_sessions(user_id)
        logger.debug(f"Background cleanup completed for user {user_id}")
        
    except Exception as e:
        logger.warning(f"Background session cleanup failed for user {user_id}: {e}")
