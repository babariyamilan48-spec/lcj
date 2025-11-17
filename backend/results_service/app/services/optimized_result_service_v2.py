"""
Optimized Result Service with Centralized Session Management
Ensures proper session lifecycle and prevents session leaks
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import logging

from ..schemas.result import TestResult, TestResultCreate, UserProfile, UserProfileUpdate, AnalyticsData, UserStats
from core.session_manager import get_user_session, get_session
from core.cache import cache_async_result, QueryCache

logger = logging.getLogger(__name__)

# Import database models
try:
    from question_service.app.models.test_result import TestResult as DBTestResult, TestResultDetail, TestResultConfiguration
except ImportError:
    DBTestResult = None
    TestResultDetail = None
    TestResultConfiguration = None

try:
    from question_service.app.models.ai_insights import AIInsights
except ImportError:
    AIInsights = None

class OptimizedResultServiceV2:
    """
    Optimized Result Service with proper session management
    Ensures one session per user operation and proper cleanup
    """
    
    @staticmethod
    async def create_result(result_data: TestResultCreate) -> TestResult:
        """Create a new test result with proper session management"""
        
        # Convert user_id to UUID if it's a string
        try:
            if isinstance(result_data.user_id, str):
                user_uuid = uuid.UUID(result_data.user_id)
            else:
                user_uuid = result_data.user_id
        except (ValueError, TypeError):
            logger.error(f"Invalid user_id format in create_result: {result_data.user_id}")
            raise ValueError(f"Invalid user_id format: {result_data.user_id}")
        
        user_id_str = str(result_data.user_id)
        
        if not DBTestResult:
            logger.error("Database models not available")
            raise RuntimeError("Database models not available")
        
        # Use centralized session manager for user-specific operation
        with get_user_session(user_id_str, "create_result") as session:
            try:
                # Check for existing recent results to prevent duplicates
                five_minutes_ago = datetime.now() - timedelta(minutes=5)
                
                existing_result = session.query(DBTestResult).filter(
                    DBTestResult.user_id == user_uuid,
                    DBTestResult.test_id == result_data.test_id,
                    DBTestResult.created_at > five_minutes_ago,
                    DBTestResult.is_completed == True
                ).first()
                
                if existing_result:
                    logger.info(f"Duplicate result found for user {user_id_str}, test {result_data.test_id}")
                    # Return existing result instead of creating duplicate
                    result_dict = {
                        "id": str(existing_result.id),
                        "user_id": str(existing_result.user_id),
                        "test_id": existing_result.test_id,
                        "test_name": result_data.test_name,
                        "score": result_data.total_score or result_data.score or 0,
                        "percentage": existing_result.completion_percentage,
                        "percentage_score": existing_result.completion_percentage,
                        "total_score": result_data.total_score or result_data.score or 0,
                        "answers": existing_result.answers,
                        "analysis": result_data.analysis,
                        "recommendations": result_data.recommendations or [],
                        "duration_seconds": existing_result.time_taken_seconds,
                        "duration_minutes": result_data.duration_minutes,
                        "total_questions": result_data.total_questions,
                        "dimensions_scores": result_data.dimensions_scores,
                        "timestamp": existing_result.created_at,
                        "completed_at": existing_result.completed_at
                    }
                    return TestResult(**result_dict)
                
                # Ensure answers is properly formatted for database storage
                answers_data = result_data.answers or {}
                if isinstance(answers_data, list):
                    answers_data = {str(i): answer for i, answer in enumerate(answers_data)}
                
                # Create database record
                db_result = DBTestResult(
                    user_id=user_uuid,
                    test_id=result_data.test_id,
                    answers=answers_data,
                    completion_percentage=result_data.percentage_score or result_data.percentage or result_data.score or 0,
                    time_taken_seconds=result_data.duration_seconds,
                    calculated_result={
                        "analysis": result_data.analysis,
                        "score": result_data.total_score or result_data.score or 0,
                        "percentage": result_data.percentage_score or result_data.percentage or result_data.score or 0,
                        "dimensions_scores": result_data.dimensions_scores,
                        "recommendations": result_data.recommendations
                    },
                    primary_result=str(result_data.analysis.get('code', '')) if result_data.analysis else '',
                    result_summary=result_data.test_name,
                    is_completed=True,
                    completed_at=datetime.now()
                )
                
                session.add(db_result)
                session.flush()  # Get ID without committing
                session.refresh(db_result)
                
                # Convert to response format
                result_dict = {
                    "id": str(db_result.id),
                    "user_id": str(db_result.user_id),
                    "test_id": db_result.test_id,
                    "test_name": result_data.test_name,
                    "score": result_data.total_score or result_data.score or 0,
                    "percentage": db_result.completion_percentage,
                    "percentage_score": db_result.completion_percentage,
                    "total_score": result_data.total_score or result_data.score or 0,
                    "answers": db_result.answers,
                    "analysis": result_data.analysis,
                    "recommendations": result_data.recommendations or [],
                    "duration_seconds": db_result.time_taken_seconds,
                    "duration_minutes": result_data.duration_minutes,
                    "total_questions": result_data.total_questions,
                    "dimensions_scores": result_data.dimensions_scores,
                    "timestamp": db_result.created_at,
                    "completed_at": db_result.completed_at
                }
                
                # Invalidate ALL user cache to prevent cross-user contamination
                QueryCache.invalidate_all_user_cache(user_id_str)
                
                # Clear completion status cache
                try:
                    QueryCache.invalidate_completion_status(user_id_str)
                    QueryCache.invalidate_user_results(user_id_str)
                    
                    # Also clear specific keys using cache instance
                    from core.cache import cache
                    cache_keys = [
                        f"completion_status:{user_id_str}",
                        f"completed_tests:{user_id_str}",
                        f"progress_summary:{user_id_str}",
                        f"completion_status_v2:{user_id_str}",
                    ]
                    
                    for cache_key in cache_keys:
                        try:
                            cache.delete(cache_key)
                        except Exception as cache_error:
                            logger.debug(f"Cache key {cache_key} not found or already cleared: {cache_error}")
                    
                    logger.info(f"Invalidated completion status cache for user {user_id_str}")
                except Exception as e:
                    logger.warning(f"Failed to clear completion status cache: {e}")
                
                # Session will be committed automatically by context manager
                logger.info(f"Created result {db_result.id} for user {user_id_str}")
                return TestResult(**result_dict)
                
            except Exception as e:
                logger.error(f"Database save failed for user {user_id_str}: {e}")
                raise
    
    @staticmethod
    async def get_user_results(user_id: str) -> List[TestResult]:
        """Get all results for a user with proper session management"""
        
        # Convert user_id to UUID if it's a string
        try:
            if isinstance(user_id, str):
                user_uuid = uuid.UUID(user_id)
            else:
                user_uuid = user_id
        except (ValueError, TypeError):
            logger.error(f"Invalid user_id format in get_user_results: {user_id}")
            return []
        
        # Try cache first
        cached_results = QueryCache.get_user_results(user_id)
        if cached_results:
            logger.debug(f"Returning cached results for user {user_id}")
            return cached_results
        
        if not DBTestResult:
            logger.error("Database models not available")
            return []
        
        # Use centralized session manager for user-specific operation
        with get_user_session(user_id, "get_user_results") as session:
            try:
                logger.debug(f"Querying database for user_uuid: {user_uuid}")
                
                # Optimized query with proper filtering
                db_results = session.query(DBTestResult).filter(
                    DBTestResult.user_id == user_uuid,
                    DBTestResult.is_completed == True
                ).order_by(DBTestResult.created_at.desc()).all()
                
                logger.info(f"Database query returned {len(db_results)} results for user {user_id}")
                
                user_results = []
                for db_result in db_results:
                    calculated_result = db_result.calculated_result or {}
                    
                    # Enrich empty analysis data from configurations
                    analysis = calculated_result.get('analysis', {})
                    if not analysis or not analysis.get('code'):
                        analysis = OptimizedResultServiceV2._get_fallback_analysis(db_result.test_id, db_result.primary_result)
                    
                    # Enrich empty recommendations
                    recommendations = calculated_result.get('recommendations', [])
                    if not recommendations:
                        recommendations = OptimizedResultServiceV2._get_fallback_recommendations(db_result.test_id, analysis.get('code'))
                    
                    # Enrich empty dimensions_scores
                    dimensions_scores = calculated_result.get('dimensions_scores', {})
                    if not dimensions_scores:
                        dimensions_scores = OptimizedResultServiceV2._get_fallback_dimensions(db_result.test_id, analysis.get('code'))
                    
                    result_dict = {
                        "id": str(db_result.id),
                        "user_id": str(db_result.user_id),
                        "test_id": db_result.test_id,
                        "test_name": db_result.result_summary or db_result.test_id,
                        "score": calculated_result.get('score', 0),
                        "percentage": db_result.completion_percentage,
                        "percentage_score": db_result.completion_percentage,
                        "total_score": calculated_result.get('score', 0),
                        "answers": db_result.answers,
                        "analysis": analysis,
                        "recommendations": recommendations,
                        "duration_seconds": db_result.time_taken_seconds,
                        "duration_minutes": db_result.time_taken_seconds // 60 if db_result.time_taken_seconds else 0,
                        "total_questions": len(db_result.answers) if db_result.answers else 0,
                        "dimensions_scores": dimensions_scores,
                        "timestamp": db_result.created_at,
                        "completed_at": db_result.completed_at
                    }
                    user_results.append(TestResult(**result_dict))
                
                # Cache the results
                QueryCache.set_user_results(user_id, user_results, ttl=600)
                
                logger.debug(f"Returning {len(user_results)} results for user {user_id}")
                return user_results
                
            except Exception as e:
                logger.error(f"Error getting user results for {user_id}: {e}")
                raise
    
    @staticmethod
    async def get_user_analytics(user_id: str) -> Dict[str, Any]:
        """Get user analytics data with proper session management"""
        
        user_results = await OptimizedResultServiceV2.get_user_results(user_id)
        
        if not user_results:
            return {
                "stats": {
                    "total_tests": 0,
                    "average_score": 0.0,
                    "streak_days": 0,
                    "achievements": 0,
                    "recent_tests": [],
                    "category_scores": {}
                },
                "testHistory": [],
                "categoryScores": {},
                "progressOverTime": [],
                "goals": []
            }
        
        # Calculate analytics
        total_tests = len(user_results)
        average_score = sum(r.score for r in user_results) / total_tests
        
        # Calculate category scores
        category_scores = {}
        for result in user_results:
            if hasattr(result, 'dimensions_scores') and result.dimensions_scores:
                for category, score in result.dimensions_scores.items():
                    if category not in category_scores:
                        category_scores[category] = []
                    category_scores[category].append(score)
        
        # Average category scores
        for category in category_scores:
            category_scores[category] = sum(category_scores[category]) / len(category_scores[category])
        
        # Get test history
        test_history = [
            {
                "id": r.id,
                "test_name": r.test_name,
                "score": r.score,
                "completed_at": r.timestamp.isoformat() if hasattr(r.timestamp, 'isoformat') else str(r.timestamp)
            } for r in user_results
        ]
        
        # Add AI insights to test history if they exist
        try:
            ai_insights_history = await OptimizedResultServiceV2.get_user_ai_insights_for_history(user_id)
            if ai_insights_history:
                for ai_insight in ai_insights_history:
                    test_history.append({
                        "id": ai_insight.get("id"),
                        "test_name": ai_insight.get("test_name"),
                        "score": ai_insight.get("score", 100),
                        "completed_at": ai_insight.get("completion_date")
                    })
                
                total_tests += len(ai_insights_history)
                logger.info(f"Added {len(ai_insights_history)} AI insights to analytics for user {user_id}")
        except Exception as ai_error:
            logger.warning(f"Could not add AI insights to analytics for user {user_id}: {ai_error}")
        
        # Sort test history by completion date (newest first)
        test_history.sort(key=lambda x: x.get("completed_at", ""), reverse=True)
        
        return {
            "stats": {
                "total_tests": total_tests,
                "average_score": average_score,
                "streak_days": 0,
                "achievements": total_tests,
                "recent_tests": [
                    {
                        "test_name": r.test_name,
                        "score": r.score,
                        "completed_at": r.timestamp.isoformat() if hasattr(r.timestamp, 'isoformat') else str(r.timestamp)
                    } for r in user_results[:5]
                ],
                "category_scores": category_scores
            },
            "testHistory": test_history,
            "categoryScores": category_scores,
            "progressOverTime": [],
            "goals": [
                {"id": 1, "title": "Complete 10 tests", "progress": min(total_tests * 10, 100)},
                {"id": 2, "title": "Achieve 85% average", "progress": min(average_score, 100)}
            ]
        }
    
    @staticmethod
    async def get_user_ai_insights(user_id: str) -> Optional[Dict[str, Any]]:
        """Get AI insights for a user with proper session management"""
        
        if not AIInsights:
            logger.warning("AIInsights model not available")
            return None
        
        try:
            user_uuid = uuid.UUID(user_id)
        except (ValueError, TypeError):
            logger.error(f"Invalid user_id format in get_user_ai_insights: {user_id}")
            return None
        
        # Use general session for AI insights query
        with get_session("get_ai_insights") as session:
            try:
                ai_insight = session.query(AIInsights).filter(
                    AIInsights.user_id == user_uuid
                ).order_by(AIInsights.generated_at.desc()).first()
                
                if ai_insight:
                    return {
                        'insights_data': ai_insight.insights_data,
                        'model_used': ai_insight.model_used,
                        'generated_at': ai_insight.generated_at.isoformat() if ai_insight.generated_at else None,
                        'insights_type': ai_insight.insights_type
                    }
                
                return None
                
            except Exception as e:
                logger.error(f"Error getting AI insights for user {user_id}: {e}")
                return None
    
    @staticmethod
    async def get_user_ai_insights_for_history(user_id: str) -> List[Dict[str, Any]]:
        """Get AI insights formatted for test history with proper session management"""
        
        if not AIInsights:
            return []
        
        try:
            user_uuid = uuid.UUID(user_id)
        except (ValueError, TypeError):
            logger.error(f"Invalid user_id format in get_user_ai_insights_for_history: {user_id}")
            return []
        
        # Use general session for AI insights query
        with get_session("get_ai_insights_history") as session:
            try:
                ai_insights = session.query(AIInsights).filter(
                    AIInsights.user_id == user_uuid
                ).order_by(AIInsights.generated_at.desc()).all()
                
                insights_history = []
                for insight in ai_insights:
                    insights_history.append({
                        "id": f"ai_insights_{insight.id}",
                        "test_name": "સંપૂર્ણ AI વિશ્લેષણ રિપોર્ટ (Comprehensive AI Analysis)",
                        "score": 100,
                        "completion_date": insight.generated_at.isoformat() if insight.generated_at else None
                    })
                
                return insights_history
                
            except Exception as e:
                logger.error(f"Error getting AI insights history for user {user_id}: {e}")
                return []
    
    @staticmethod
    def _get_fallback_analysis(test_id: str, primary_result: str) -> Dict[str, Any]:
        """Get fallback analysis data for enrichment"""
        return {
            "code": primary_result or "UNKNOWN",
            "title": f"Test Result for {test_id}",
            "description": "Analysis data enriched from configuration"
        }
    
    @staticmethod
    def _get_fallback_recommendations(test_id: str, result_code: str) -> List[str]:
        """Get fallback recommendations for enrichment"""
        return [
            f"Continue practicing in areas related to {test_id}",
            "Focus on improving your weaker areas identified in this assessment",
            "Consider taking similar assessments to track your progress"
        ]
    
    @staticmethod
    def _get_fallback_dimensions(test_id: str, result_code: str) -> Dict[str, float]:
        """Get fallback dimensions scores for enrichment"""
        return {
            "overall": 75.0,
            "category_1": 80.0,
            "category_2": 70.0
        }
