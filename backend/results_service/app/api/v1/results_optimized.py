"""
Optimized Results API with Centralized Session Management
Replaces the main results.py with session-managed endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import io
import json
import uuid
import logging
from datetime import datetime

from results_service.app.schemas.result import TestResult, TestResultCreate, UserProfile, UserProfileUpdate, AnalyticsData
from results_service.app.services.optimized_result_service_v2 import OptimizedResultServiceV2
from results_service.app.services.markdown_report_service import MarkdownReportService
from results_service.app.services.pdf_generator import PDFGeneratorService
from core.services.ai_service import AIInsightService
from core.database_fixed import get_db, get_db_session
from core.database_fixed import get_db_session
from core.database_fixed import get_db_session
from core.cache import cache_async_result, QueryCache
from core.middleware.compression import compress_json_response, optimize_large_response
from core.rate_limit import limiter

logger = logging.getLogger(__name__)

router = APIRouter()

class AIInsightRequest(BaseModel):
    test_type: str
    test_id: str
    answers: List[Any]
    results: Dict[str, Any]
    user_id: Optional[str] = None

class AIInsightResponse(BaseModel):
    success: bool
    insights: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    generated_at: Optional[str] = None
    model: Optional[str] = None

class ComprehensiveAIRequest(BaseModel):
    user_id: str
    all_test_results: Dict[str, Any]

class ComprehensiveAIResponse(BaseModel):
    success: bool
    insights: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    generated_at: Optional[str] = None
    model: Optional[str] = None

class ResultSubmissionResponse(BaseModel):
    message: str
    result_id: str

@router.post("/submit", response_model=ResultSubmissionResponse)
@limiter.limit("30/minute")
async def submit_test_result_optimized(
    request: Request,
    result_data: TestResultCreate,
    background_tasks: BackgroundTasks
) -> ResultSubmissionResponse:
    """
    Submit test result with optimized session management
    """
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
        
        # Background task to cleanup any orphaned sessions for this user
        background_tasks.add_task(
            force_close_user_sessions,
            str(result_data.user_id)
        )
        
        return ResultSubmissionResponse(
            message="Test result submitted successfully",
            result_id=result.id
        )
        
    except ValueError as ve:
        logger.error(f"Validation error in submit_test_result: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in submit_test_result: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit test result")

@router.get("/user/{user_id}", response_model=List[TestResult])
@limiter.limit("60/minute")
async def get_user_results_optimized(
    request: Request,
    user_id: str,
    background_tasks: BackgroundTasks
) -> List[TestResult]:
    """
    Get user results with optimized session management
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
        
        # Get results using optimized service
        results = await OptimizedResultServiceV2.get_user_results(user_id)
        
        # Background task to cleanup any orphaned sessions for this user
        background_tasks.add_task(
            force_close_user_sessions,
            user_id
        )
        
        return results
        
    except ValueError as ve:
        logger.error(f"Validation error in get_user_results: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in get_user_results for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user results")

@router.get("/user/{user_id}/paginated")
@limiter.limit("60/minute")
async def get_user_results_paginated_optimized(
    request: Request,
    user_id: str,
    page: int = 1,
    size: int = 10,
    background_tasks: BackgroundTasks = None
) -> Dict[str, Any]:
    """
    Get paginated user results with optimized session management
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
        
        # Get all results first
        all_results = await OptimizedResultServiceV2.get_user_results(user_id)
        
        # Calculate pagination
        total = len(all_results)
        start_idx = (page - 1) * size
        end_idx = start_idx + size
        paginated_results = all_results[start_idx:end_idx]
        
        # Convert results to dictionaries for JSON serialization
        results_data = []
        for result in paginated_results:
            if hasattr(result, 'dict'):
                result_dict = result.dict()
            else:
                result_dict = result
            
            # Convert datetime objects to ISO strings for JSON serialization
            if 'timestamp' in result_dict and hasattr(result_dict['timestamp'], 'isoformat'):
                result_dict['timestamp'] = result_dict['timestamp'].isoformat()
            if 'completed_at' in result_dict and result_dict['completed_at'] and hasattr(result_dict['completed_at'], 'isoformat'):
                result_dict['completed_at'] = result_dict['completed_at'].isoformat()
                
            results_data.append(result_dict)
        
        # Background task to cleanup any orphaned sessions for this user
        if background_tasks:
            background_tasks.add_task(
                force_close_user_sessions,
                user_id
            )
        
        return {
            "results": results_data,
            "total": total,
            "page": page,
            "size": size,
            "total_pages": (total + size - 1) // size
        }
        
    except ValueError as ve:
        logger.error(f"Validation error in get_user_results_paginated: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in get_user_results_paginated for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve paginated results")

@router.get("/user/{user_id}/analytics", response_model=AnalyticsData)
@limiter.limit("30/minute")
async def get_user_analytics_optimized(
    request: Request,
    user_id: str,
    background_tasks: BackgroundTasks
) -> AnalyticsData:
    """
    Get user analytics with optimized session management
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
        
        # Get analytics using optimized service
        analytics = await OptimizedResultServiceV2.get_user_analytics(user_id)
        
        # Background task to cleanup any orphaned sessions for this user
        background_tasks.add_task(
            force_close_user_sessions,
            user_id
        )
        
        return AnalyticsData(**analytics)
        
    except ValueError as ve:
        logger.error(f"Validation error in get_user_analytics: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in get_user_analytics for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user analytics")

@router.get("/all-results/{user_id}")
@limiter.limit("20/minute")
async def get_all_test_results_optimized(
    request: Request,
    user_id: str,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Get all test results organized by test type with optimized session management
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
        
        # Background task to cleanup any orphaned sessions for this user
        background_tasks.add_task(
            force_close_user_sessions,
            user_id
        )
        
        return organized_results
        
    except ValueError as ve:
        logger.error(f"Validation error in get_all_test_results: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in get_all_test_results for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve all test results")

@router.post("/ai-insights", response_model=AIInsightResponse)
@limiter.limit("10/minute")
async def generate_ai_insights_optimized(
    request: Request,
    insight_request: AIInsightRequest,
    background_tasks: BackgroundTasks
) -> AIInsightResponse:
    """
    Generate AI insights with optimized session management
    """
    try:
        ai_service = AIInsightService()
        
        # Generate insights
        insights = await ai_service.generate_insights(
            test_type=insight_request.test_type,
            test_id=insight_request.test_id,
            answers=insight_request.answers,
            results=insight_request.results,
            user_id=insight_request.user_id
        )
        
        # Background task to cleanup any orphaned sessions for this user
        if insight_request.user_id:
            background_tasks.add_task(
                force_close_user_sessions,
                str(insight_request.user_id)
            )
        
        return AIInsightResponse(
            success=True,
            insights=insights,
            generated_at=datetime.now().isoformat(),
            model="gemini-1.5-flash"
        )
        
    except Exception as e:
        logger.error(f"Error generating AI insights: {e}")
        return AIInsightResponse(
            success=False,
            error=str(e)
        )

@router.post("/comprehensive-ai-insights", response_model=ComprehensiveAIResponse)
@limiter.limit("5/minute")
async def generate_comprehensive_ai_insights_optimized(
    request: Request,
    insight_request: ComprehensiveAIRequest,
    background_tasks: BackgroundTasks
) -> ComprehensiveAIResponse:
    """
    Generate comprehensive AI insights with optimized session management
    """
    try:
        # Validate user_id format
        try:
            uuid.UUID(insight_request.user_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid user_id format: {insight_request.user_id}"
            )
        
        ai_service = AIInsightService()
        
        # Generate comprehensive insights
        insights = await ai_service.generate_comprehensive_insights(
            user_id=insight_request.user_id,
            all_test_results=insight_request.all_test_results
        )
        
        # Background task to cleanup any orphaned sessions for this user
        background_tasks.add_task(
            force_close_user_sessions,
            insight_request.user_id
        )
        
        return ComprehensiveAIResponse(
            success=True,
            insights=insights,
            generated_at=datetime.now().isoformat(),
            model="gemini-1.5-flash"
        )
        
    except ValueError as ve:
        logger.error(f"Validation error in comprehensive AI insights: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error generating comprehensive AI insights: {e}")
        return ComprehensiveAIResponse(
            success=False,
            error=str(e)
        )

@router.get("/health")
async def results_health_check_optimized() -> Dict[str, Any]:
    """
    Health check for optimized results service
    """
    try:
        from core.database_fixed import get_db_session
        
        # Get session health
        session_health = get_session_health()
        
        # Basic service health
        service_health = {
            "service": "results_optimized",
            "status": "healthy",
            "timestamp": datetime.now().isoformat()
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
        logger.error(f"Results health check failed: {e}")
        return {
            "service": "results_optimized",
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# Profile endpoints
@router.get("/profile/{user_id}", response_model=UserProfile)
async def get_user_profile_optimized(user_id: str):
    """Get user profile with optimized session management"""
    try:
        # Use the legacy service directly since it has proper caching
        from results_service.app.services.result_service import ResultService
        return await ResultService.get_user_profile(user_id)
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/profile/{user_id}", response_model=UserProfile)
async def update_user_profile_optimized(user_id: str, profile_data: UserProfileUpdate):
    """Update user profile with optimized session management"""
    try:
        # Use the legacy service directly since it has proper caching
        from results_service.app.services.result_service import ResultService
        return await ResultService.update_user_profile(user_id, profile_data)
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# AI Insights endpoints
@router.get("/ai-insights/{user_id}")
async def get_user_ai_insights_optimized(user_id: str):
    """Get AI insights for user with optimized session management"""
    try:
        # Use the legacy service directly since it has proper caching
        from results_service.app.services.result_service import ResultService
        ai_insights = await ResultService.get_user_ai_insights(user_id)
        
        if ai_insights:
            return {
                "success": True,
                "data": ai_insights,
                "message": "AI insights retrieved successfully"
            }
        else:
            return {
                "success": True,
                "data": None,
                "message": "No AI insights found for this user"
            }
        
    except Exception as e:
        logger.error(f"Error retrieving AI insights for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve AI insights: {str(e)}"
        )

@router.get("/ai-insights/{user_id}/history")
async def get_user_ai_insights_for_history_optimized(user_id: str):
    """Get AI insights formatted for test history display with optimized session management"""
    try:
        # Use the legacy service directly since it has proper caching
        from results_service.app.services.result_service import ResultService
        ai_insights_history = await ResultService.get_user_ai_insights_for_history(user_id)
        
        return {
            "success": True,
            "ai_insights": ai_insights_history,
            "count": len(ai_insights_history),
            "message": "AI insights history retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Error retrieving AI insights history for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve AI insights history: {str(e)}"
        )

# Analytics endpoint
@router.get("/analytics/{user_id}")
async def get_user_analytics_optimized(user_id: str):
    """Get user analytics data with optimized session management"""
    try:
        # Use the legacy service directly since it has proper caching
        from results_service.app.services.result_service import ResultService
        return await ResultService.get_user_analytics(user_id)
    except Exception as e:
        logger.error(f"Error getting user analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))
