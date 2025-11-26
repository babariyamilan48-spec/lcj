from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import io
import csv
import json
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func
import logging

from ..schemas.result import TestResult, TestResultCreate, UserProfile, UserProfileUpdate, AnalyticsData, UserStats
from core.database_fixed import get_db_session
from core.cache import cache_async_result, QueryCache

logger = logging.getLogger(__name__)

# Import database models
try:
    from question_service.app.models.test_result import TestResult as DBTestResult, TestResultDetail, TestResultConfiguration
except ImportError:
    # Fallback if models are not available
    DBTestResult = None
    TestResultDetail = None
    TestResultConfiguration = None

# Import AI Insights model from question service
try:
    from question_service.app.models.ai_insights import AIInsights
except ImportError:
    AIInsights = None

# Fallback in-memory storage for development/testing
results_db: Dict[str, Dict] = {}
user_profiles_db: Dict[str, Dict] = {}

class ResultService:
    @staticmethod
    def get_db_session() -> Optional[Session]:
        """Get database session, return None if not available"""
        try:
            from core.database_fixed import db_manager
            return db_manager.SessionLocal()
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            return None
    
    @staticmethod
    async def create_result(result_data: TestResultCreate) -> TestResult:
        """Create a new test result with database persistence and deduplication"""
        import uuid
        
        # Convert user_id to UUID if it's a string - FIX FOR UUID HANDLING
        try:
            if isinstance(result_data.user_id, str):
                user_uuid = uuid.UUID(result_data.user_id)
            else:
                user_uuid = result_data.user_id
        except (ValueError, TypeError):
            logger.error(f"Invalid user_id format in create_result: {result_data.user_id}")
            # Fallback to in-memory storage for invalid UUIDs
            result_id = str(uuid.uuid4())
            result_dict = {
                "id": result_id,
                "user_id": str(result_data.user_id),
                "test_id": result_data.test_id,
                "test_name": result_data.test_name,
                "score": result_data.total_score or result_data.score or 0,
                "percentage": 100.0,
                "percentage_score": 100.0,
                "total_score": result_data.total_score or result_data.score or 0,
                "answers": result_data.answers,
                "analysis": result_data.analysis,
                "timestamp": datetime.now().isoformat(),
                "recommendations": result_data.recommendations or []
            }
            results_db[result_id] = result_dict
            QueryCache.invalidate_all_user_cache(str(result_data.user_id))
            return TestResult(**result_dict)
        
        # ✅ FIXED: Use context manager for proper session cleanup
        if DBTestResult:
            try:
                with get_db_session() as db:
                    # Check for existing recent results to prevent duplicates
                    from datetime import datetime, timedelta
                    five_minutes_ago = datetime.now() - timedelta(minutes=5)
                    
                    existing_result = db.query(DBTestResult).filter(
                        DBTestResult.user_id == user_uuid,
                        DBTestResult.test_id == result_data.test_id,
                        DBTestResult.created_at > five_minutes_ago,
                        DBTestResult.is_completed == True
                    ).first()
                    
                    if existing_result:
                        logger.info(f"Duplicate result found for user {result_data.user_id}, test {result_data.test_id}")
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
                        # Convert list back to dict with numeric keys for storage
                        answers_data = {str(i): answer for i, answer in enumerate(answers_data)}
                    
                    # Create database record
                    db_result = DBTestResult(
                        user_id=user_uuid,  # Use converted UUID instead of raw user_id
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
                    
                    db.add(db_result)
                    db.commit()
                    db.refresh(db_result)
                    
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
                    QueryCache.invalidate_all_user_cache(str(result_data.user_id))
                    
                    # Also invalidate completion status cache using direct cache operations
                    try:
                        # Clear completion status cache keys directly
                        user_id_str = str(result_data.user_id)
                        cache_keys = [
                            f"completion_status:{user_id_str}",
                            f"completed_tests:{user_id_str}",
                            f"progress_summary:{user_id_str}",
                            f"completion_status_v2:{user_id_str}",
                        ]
                        
                        # Use QueryCache methods for proper cache invalidation
                        QueryCache.invalidate_completion_status(user_id_str)
                        QueryCache.invalidate_user_results(user_id_str)
                        
                        # Also clear specific keys using cache instance
                        from core.cache import cache
                        for cache_key in cache_keys:
                            try:
                                cache.delete(cache_key)
                            except Exception as cache_error:
                                logger.debug(f"Cache key {cache_key} not found or already cleared: {cache_error}")
                        
                        logger.info(f"Invalidated completion status cache for user {result_data.user_id}")
                    except Exception as cache_error:
                        logger.warning(f"Failed to clear completion status cache: {cache_error}")
                    
                    return TestResult(**result_dict)
                    
            except Exception as e:
                logger.error(f"Database save failed, using fallback: {e}")
        
        # Fallback to in-memory storage
        result_id = str(uuid.uuid4())
        timestamp = datetime.now()
        
        # Generate default recommendations if none provided
        recommendations = result_data.recommendations or [
            f"Continue practicing in areas related to {result_data.test_name}",
            "Focus on improving your weaker areas identified in this assessment",
            "Consider taking similar assessments to track your progress",
            "Seek additional resources to enhance your skills"
        ]
        
        # Use percentage_score if available, otherwise use percentage or score
        percentage_value = result_data.percentage_score or result_data.percentage or result_data.score or 0
        score_value = result_data.total_score or result_data.score or 0
        
        # Ensure answers is properly formatted for storage
        answers_data = result_data.answers or {}
        if isinstance(answers_data, list):
            # Convert list back to dict with numeric keys for storage
            answers_data = {str(i): answer for i, answer in enumerate(answers_data)}
        
        result_dict = {
            "id": result_id,
            "user_id": result_data.user_id,
            "test_id": result_data.test_id,
            "test_name": result_data.test_name,
            "score": score_value,
            "percentage": percentage_value,
            "percentage_score": percentage_value,
            "total_score": score_value,
            "answers": answers_data,
            "analysis": result_data.analysis,
            "recommendations": recommendations,
            "duration_seconds": result_data.duration_seconds,
            "duration_minutes": result_data.duration_minutes,
            "total_questions": result_data.total_questions,
            "dimensions_scores": result_data.dimensions_scores,
            "timestamp": timestamp,
            "completed_at": timestamp
        }
        
        results_db[result_id] = result_dict
        
        # Invalidate cache for in-memory storage too
        QueryCache.invalidate_user_results(result_data.user_id)
        
        return TestResult(**result_dict)
    
    @staticmethod
    async def get_user_results(user_id: str) -> List[TestResult]:
        """Get all results for a user from database first, fallback to memory - OPTIMIZED with caching"""
        import uuid
        
        # Convert user_id to UUID if it's a string - FIX FOR UUID HANDLING
        try:
            if isinstance(user_id, str):
                user_uuid = uuid.UUID(user_id)
            else:
                user_uuid = user_id
        except (ValueError, TypeError):
            logger.error(f"Invalid user_id format in get_user_results: {user_id}")
            return []
        
        # Try cache first - use string user_id for cache key consistency
        cached_results = QueryCache.get_user_results(user_id)
        if cached_results:
            return cached_results
        
        # ✅ FIXED: Use context manager for proper session cleanup
        if DBTestResult:
            try:
                with get_db_session() as db:
                    logger.info(f"Querying database for user_uuid: {user_uuid}")
                    # Optimized query with eager loading - use UUID for database query
                    db_results = db.query(DBTestResult).filter(
                        DBTestResult.user_id == user_uuid,
                        DBTestResult.is_completed == True
                    ).order_by(desc(DBTestResult.created_at)).all()
                    
                    logger.info(f"Database query returned {len(db_results)} results for user {user_id}")
                    
                    user_results = []
                    for db_result in db_results:
                        calculated_result = db_result.calculated_result or {}
                        
                        # Enrich empty analysis data from configurations
                        analysis = calculated_result.get('analysis', {})
                        if not analysis or not analysis.get('code'):
                            analysis = ResultService._get_fallback_analysis(db_result.test_id, db_result.primary_result)
                        
                        # Enrich empty recommendations
                        recommendations = calculated_result.get('recommendations', [])
                        if not recommendations:
                            recommendations = ResultService._get_fallback_recommendations(db_result.test_id, analysis.get('code'))
                        
                        # Enrich empty dimensions_scores
                        dimensions_scores = calculated_result.get('dimensions_scores', {})
                        if not dimensions_scores:
                            dimensions_scores = ResultService._get_fallback_dimensions(db_result.test_id, analysis.get('code'))
                        
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
                    return user_results
                    
            except Exception as e:
                logger.error(f"Database error in get_user_results: {e}")
        
        # Fallback to in-memory storage
        user_results = [
            TestResult(**result) for result in results_db.values() 
            if result["user_id"] == user_id
        ]
        # Sort by timestamp descending (newest first)
        user_results.sort(key=lambda x: x.timestamp, reverse=True)
        return user_results
    
    @staticmethod
    @cache_async_result(ttl=300, key_prefix="paginated_results")
    async def get_user_results_paginated(user_id: str, page: int = 1, size: int = 10) -> Dict[str, Any]:
        """Get paginated results for a user - OPTIMIZED with caching"""
        all_results = await ResultService.get_user_results(user_id)
        
        # Calculate pagination
        total = len(all_results)
        start_idx = (page - 1) * size
        end_idx = start_idx + size
        paginated_results = all_results[start_idx:end_idx]
        
        # Convert results to dictionaries for JSON serialization
        results_data = []
        for result in paginated_results:
            if hasattr(result, 'dict'):
                # Pydantic model
                result_dict = result.dict()
            else:
                # Regular dictionary
                result_dict = result
            
            # Convert datetime objects to ISO strings for JSON serialization
            if 'timestamp' in result_dict and hasattr(result_dict['timestamp'], 'isoformat'):
                result_dict['timestamp'] = result_dict['timestamp'].isoformat()
            if 'completed_at' in result_dict and result_dict['completed_at'] and hasattr(result_dict['completed_at'], 'isoformat'):
                result_dict['completed_at'] = result_dict['completed_at'].isoformat()
                
            results_data.append(result_dict)
        
        return {
            "results": results_data,
            "total": total,
            "page": page,
            "size": size,
            "total_pages": (total + size - 1) // size
        }
    
    @staticmethod
    async def get_latest_result(user_id: str) -> Optional[TestResult]:
        """Get the latest result for a user"""
        user_results = await ResultService.get_user_results(user_id)
        return user_results[0] if user_results else None
    
    @staticmethod
    @cache_async_result(ttl=1800, key_prefix="user_profile")
    async def get_user_profile(user_id: str) -> UserProfile:
        """Get user profile with stats - OPTIMIZED with caching"""
        if user_id not in user_profiles_db:
            # Create minimal profile that can be updated by the user
            # The frontend will populate this with real user data from AuthContext
            profile_dict = {
                "id": user_id,
                "name": "",
                "email": "",
                "username": "",
                "firstName": "",
                "lastName": "",
                "bio": "",
                "location": "",
                "phone": "",
                "education": "",
                "experience": "",
                "interests": [],
                "skills": [],
                "goals": [],
                "website": "",
                "linkedin": "",
                "github": "",
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            user_profiles_db[user_id] = profile_dict
        
        # Get user stats
        user_results = await ResultService.get_user_results(user_id)
        stats = await ResultService._calculate_user_stats(user_id, user_results)
        
        profile_dict = user_profiles_db[user_id].copy()
        profile_dict["stats"] = stats
        
        return UserProfile(**profile_dict)
    
    @staticmethod
    async def update_user_profile(user_id: str, profile_data: UserProfileUpdate) -> UserProfile:
        """Update user profile"""
        if user_id not in user_profiles_db:
            # Create new profile
            profile_dict = {
                "id": user_id,
                "name": "User",
                "email": f"user{user_id}@example.com",
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
        else:
            profile_dict = user_profiles_db[user_id].copy()
            profile_dict["updated_at"] = datetime.now()
        
        # Update fields
        update_data = profile_data.dict(exclude_unset=True)
        profile_dict.update(update_data)
        
        user_profiles_db[user_id] = profile_dict
        return UserProfile(**profile_dict)
    
    @staticmethod
    @cache_async_result(ttl=900, key_prefix="all_test_results")
    async def get_all_test_results(user_id: str) -> Dict[str, Any]:
        """Get all test results organized by test type for comprehensive analysis"""
        user_results = await ResultService.get_user_results(str(user_id))
        
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
        
        logger.info(f"Retrieved {len(organized_results)} unique test results for user {user_id}")
        logger.info(f"Test types found: {list(organized_results.keys())}")
        
        # Add AI insights to the results if they exist
        try:
            ai_insights = await ResultService.get_user_ai_insights(user_id)
            if ai_insights:
                # Add AI insights as a special test type
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
        
        return organized_results

    @staticmethod
    async def get_user_analytics(user_id: str) -> Dict[str, Any]:
        """Get user analytics data - OPTIMIZED with caching"""
        user_results = await ResultService.get_user_results(user_id)
        
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
        
        # Get AI insights and add to test history
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
            ai_insights_history = await ResultService.get_user_ai_insights_for_history(user_id)
            if ai_insights_history:
                for ai_insight in ai_insights_history:
                    test_history.append({
                        "id": ai_insight.get("id"),
                        "test_name": ai_insight.get("test_name"),
                        "score": ai_insight.get("score", 100),
                        "completed_at": ai_insight.get("completion_date")
                    })
                
                # Update total tests count to include AI insights
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
    async def _calculate_user_stats(user_id: str, user_results: List[TestResult]) -> UserStats:
        """Calculate comprehensive user statistics"""
        if not user_results:
            return UserStats(
                total_tests=0,
                average_score=0.0,
                streak_days=0,
                achievements=0,
                recent_tests=[],
                category_scores={}
            )
        
        # Calculate basic stats
        total_tests = len(user_results)
        total_score = sum(result.percentage_score for result in user_results)
        average_score = total_score / total_tests if total_tests > 0 else 0.0
        
        # Calculate streak (simplified - consecutive days with tests)
        streak_days = min(total_tests, 7)  # Simple streak calculation
        
        # Calculate achievements (based on milestones)
        achievements = 0
        if total_tests >= 1:
            achievements += 1  # First test
        if total_tests >= 5:
            achievements += 1  # 5 tests milestone
        if total_tests >= 10:
            achievements += 1  # 10 tests milestone
        if average_score >= 80:
            achievements += 1  # High performer
        
        # Get recent tests (last 5)
        recent_tests = sorted(user_results, key=lambda x: x.completed_at, reverse=True)[:5]
        
        # Calculate category scores (from dimensions_scores)
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
        
        return UserStats(
            total_tests=total_tests,
            average_score=average_score,
            streak_days=0,  # Simplified
            achievements=total_tests,  # Simplified
            recent_tests=[],  # Simplified
            category_scores=category_scores
        )

    @staticmethod
    async def generate_comprehensive_report(
        user_id: str, 
        include_ai_insights: bool = True, 
        test_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate comprehensive report data including overview, results, and AI insights"""
        try:
            # Get user profile and stats
            user_profile = await ResultService.get_user_profile(user_id)
            user_analytics = await ResultService.get_user_analytics(user_id)
            
            # Get user results
            if test_id:
                # Get specific test result
                user_results = [result for result in results_db.values() 
                              if result["user_id"] == user_id and result["test_id"] == test_id]
                user_results = [TestResult(**result) for result in user_results]
            else:
                # Get all user results
                user_results = await ResultService.get_user_results(user_id)
            
            # Prepare AI insights data if requested
            ai_insights_data = []
            if include_ai_insights and user_results:
                try:
                    # Try to get real AI insights, fall back to mock data if service unavailable
                    from core.services.ai_service import AIInsightService
                    ai_service = AIInsightService()
                    
                    for result in user_results:
                        try:
                            # Prepare test data for AI service
                            test_data = {
                                "test_type": result.test_name,
                                "test_id": result.test_id,
                                "answers": result.answers,
                                "results": {
                                    "score": result.score,
                                    "percentage": result.percentage_score,
                                    "dimensions": result.dimensions_scores
                                },
                                "user_id": result.user_id
                            }
                            
                            # Generate AI insights
                            ai_result = ai_service.generate_insights(test_data)
                            
                            if ai_result["success"] and ai_result.get("insights"):
                                ai_insight = {
                                    "test_id": result.test_id,
                                    "test_name": result.test_name,
                                    "insights": ai_result["insights"],
                                    "confidence_score": 85.5,
                                    "generated_at": ai_result.get("generated_at", datetime.now().isoformat()),
                                    "model": ai_result.get("model", "gemini-2.0-flash")
                                }
                            else:
                                # Fallback to mock insights
                                ai_insight = ResultService._generate_fallback_insights(result)
                            
                            ai_insights_data.append(ai_insight)
                            
                        except Exception as e:
                            # If AI service fails for individual result, use fallback
                            print(f"AI service failed for test {result.test_id}: {str(e)}")
                            ai_insights_data.append(ResultService._generate_fallback_insights(result))
                            
                except ImportError:
                    # AI service not available, use fallback for all results
                    print("AI service not available, using fallback insights")
                    for result in user_results:
                        ai_insights_data.append(ResultService._generate_fallback_insights(result))
                except Exception as e:
                    # AI service initialization failed, use fallback
                    print(f"AI service initialization failed: {str(e)}")
                    for result in user_results:
                        ai_insights_data.append(ResultService._generate_fallback_insights(result))
            
            # Compile comprehensive report
            report_data = {
                "report_metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "user_id": user_id,
                    "report_type": "comprehensive",
                    "includes_ai_insights": include_ai_insights,
                    "test_id_filter": test_id
                },
                "user_overview": {
                    "profile": {
                        "name": user_profile.name,
                        "email": user_profile.email,
                        "location": user_profile.location,
                        "education": user_profile.education,
                        "experience": user_profile.experience,
                        "skills": user_profile.skills,
                        "goals": user_profile.goals
                    },
                    "statistics": {
                        "total_tests_completed": user_analytics["stats"]["total_tests"],
                        "average_score": round(user_analytics["stats"]["average_score"], 2),
                        "achievements": user_analytics["stats"]["achievements"],
                        "category_scores": user_analytics["stats"]["category_scores"]
                    }
                },
                "test_results": [
                    {
                        "id": result.id,
                        "test_id": result.test_id,
                        "test_name": result.test_name,
                        "score": result.score,
                        "percentage": result.percentage_score,
                        "completed_at": result.completed_at.isoformat() if result.completed_at else None,
                        "duration_minutes": result.duration_minutes,
                        "total_questions": result.total_questions,
                        "dimensions_scores": result.dimensions_scores,
                        "analysis": result.analysis,
                        "recommendations": result.recommendations
                    } for result in user_results
                ],
                "ai_insights": ai_insights_data if include_ai_insights else [],
                "summary": {
                    "total_tests": len(user_results),
                    "highest_score": max([r.percentage_score for r in user_results]) if user_results else 0,
                    "lowest_score": min([r.percentage_score for r in user_results]) if user_results else 0,
                    "average_score": sum([r.percentage_score for r in user_results]) / len(user_results) if user_results else 0,
                    "most_recent_test": user_results[0].test_name if user_results else None,
                    "improvement_trend": "Positive" if len(user_results) > 1 and user_results[0].percentage_score > user_results[-1].percentage_score else "Stable"
                }
            }
            
            return report_data
            
        except Exception as e:
            raise Exception(f"Error generating comprehensive report: {str(e)}")

    @staticmethod
    async def generate_csv_report(report_data: Dict[str, Any]) -> str:
        """Generate CSV format report"""
        try:
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write header information
            writer.writerow(["User Report - Generated at", report_data["report_metadata"]["generated_at"]])
            writer.writerow(["User ID", report_data["report_metadata"]["user_id"]])
            writer.writerow([])
            
            # Write user overview
            writer.writerow(["USER OVERVIEW"])
            profile = report_data["user_overview"]["profile"]
            for key, value in profile.items():
                if value:
                    writer.writerow([key.replace('_', ' ').title(), str(value)])
            writer.writerow([])
            
            # Write statistics
            writer.writerow(["STATISTICS"])
            stats = report_data["user_overview"]["statistics"]
            for key, value in stats.items():
                if key != "category_scores":
                    writer.writerow([key.replace('_', ' ').title(), str(value)])
            writer.writerow([])
            
            # Write test results
            writer.writerow(["TEST RESULTS"])
            if report_data["test_results"]:
                # Headers
                writer.writerow([
                    "Test Name", "Score", "Percentage", "Completed At", 
                    "Duration (min)", "Total Questions"
                ])
                
                # Data rows
                for result in report_data["test_results"]:
                    writer.writerow([
                        result["test_name"],
                        result["score"],
                        f"{result['percentage']}%",
                        result["completed_at"],
                        result["duration_minutes"],
                        result["total_questions"]
                    ])
            writer.writerow([])
            
            # Write AI insights summary
            if report_data["ai_insights"]:
                writer.writerow(["AI INSIGHTS SUMMARY"])
                for insight in report_data["ai_insights"]:
                    writer.writerow(["Test", insight["test_name"]])
                    writer.writerow(["Confidence Score", f"{insight['confidence_score']}%"])
                    writer.writerow(["Key Strengths", ", ".join(insight["insights"]["strengths"])])
                    writer.writerow(["Areas for Improvement", ", ".join(insight["insights"]["areas_for_improvement"])])
                    writer.writerow([])
            
            return output.getvalue()
            
        except Exception as e:
            raise Exception(f"Error generating CSV report: {str(e)}")

    @staticmethod
    async def generate_pdf_report(report_data: Dict[str, Any]) -> bytes:
        """Generate comprehensive PDF format report with modern styling"""
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer, 
                pagesize=A4,
                rightMargin=50,
                leftMargin=50,
                topMargin=50,
                bottomMargin=50
            )
            styles = getSampleStyleSheet()
            story = []
            
            # Ultra-modern custom styles with vibrant colors
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=32,
                spaceAfter=35,
                textColor=colors.HexColor('#6366f1'),  # Indigo-500 (vibrant)
                alignment=1,  # Center alignment
                fontName='Helvetica-Bold'
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=20,
                spaceAfter=18,
                spaceBefore=25,
                textColor=colors.HexColor('#7c3aed'),  # Violet-600 (modern purple)
                fontName='Helvetica-Bold'
            )
            
            subheading_style = ParagraphStyle(
                'CustomSubHeading',
                parent=styles['Heading3'],
                fontSize=16,
                spaceAfter=12,
                spaceBefore=18,
                textColor=colors.HexColor('#0f766e'),  # Teal-700 (sophisticated)
                fontName='Helvetica-Bold'
            )
            
            highlight_style = ParagraphStyle(
                'HighlightStyle',
                parent=styles['Normal'],
                fontSize=12,
                textColor=colors.HexColor('#dc2626'),  # Red-600 (attention-grabbing)
                fontName='Helvetica-Bold'
            )
            
            # New modern styles for enhanced visual appeal
            accent_style = ParagraphStyle(
                'AccentStyle',
                parent=styles['Normal'],
                fontSize=11,
                textColor=colors.HexColor('#0891b2'),  # Cyan-600
                fontName='Helvetica-Oblique'
            )
            
            card_title_style = ParagraphStyle(
                'CardTitleStyle',
                parent=styles['Normal'],
                fontSize=14,
                textColor=colors.white,
                fontName='Helvetica-Bold',
                alignment=1
            )
            
            # Modern Cover Page with gradient-like effect
            story.append(Paragraph("🎯 Life Changing Journey", title_style))
            story.append(Paragraph("<font color='#8b5cf6'>Comprehensive Assessment Report</font>", heading_style))
            story.append(Paragraph("<font color='#6b7280' size='12'><i>Empowering Personal & Professional Growth Through AI-Powered Insights</i></font>", accent_style))
            story.append(Spacer(1, 40))
            
            # Add a modern decorative element
            decorative_data = [[""]]
            decorative_table = Table(decorative_data, colWidths=[7*inch], rowHeights=[0.2*inch])
            decorative_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f3e8ff')),  # Purple-50
                ('LINEBELOW', (0, 0), (-1, -1), 3, colors.HexColor('#8b5cf6')),  # Purple-500
                ('LINEBEFORE', (0, 0), (-1, -1), 3, colors.HexColor('#06b6d4')),  # Cyan-500
            ]))
            story.append(decorative_table)
            story.append(Spacer(1, 20))
            
            # Report metadata with modern styling
            metadata = report_data["report_metadata"]
            from datetime import datetime
            generated_date = datetime.fromisoformat(metadata['generated_at'].replace('Z', '+00:00'))
            formatted_date = generated_date.strftime("%B %d, %Y at %I:%M %p")
            
            metadata_data = [
                ["📅 Generated:", formatted_date],
                ["👤 User ID:", metadata['user_id']],
                ["📊 Report Type:", "Comprehensive Analysis"],
                ["🤖 AI Insights:", "Included" if metadata.get('includes_ai_insights') else "Not Included"]
            ]
            
            metadata_table = Table(metadata_data, colWidths=[2.2*inch, 4.8*inch])
            metadata_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef7ff')),  # Fuchsia-50 (modern gradient feel)
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),  # Gray-800
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 12),
                ('LEFTPADDING', (0, 0), (-1, -1), 15),
                ('RIGHTPADDING', (0, 0), (-1, -1), 15),
                ('GRID', (0, 0), (-1, -1), 1.5, colors.HexColor('#c084fc')),  # Purple-400
            ]))
            story.append(metadata_table)
            story.append(PageBreak())
            
            # User Overview Section with modern design
            story.append(Paragraph("👤 User Profile", heading_style))
            profile = report_data["user_overview"]["profile"]
            
            # Profile information with icons and better formatting
            profile_sections = [
                ("📝 Personal Information", [
                    ("Name", profile.get("name", "N/A")),
                    ("Email", profile.get("email", "N/A")),
                    ("Location", profile.get("location", "N/A"))
                ]),
                ("🎓 Education & Experience", [
                    ("Education", profile.get("education", "N/A")),
                    ("Experience", profile.get("experience", "N/A"))
                ]),
                ("💼 Skills & Goals", [
                    ("Skills", ", ".join(profile.get("skills", [])) if profile.get("skills") else "N/A"),
                    ("Goals", ", ".join(profile.get("goals", [])) if profile.get("goals") else "N/A")
                ])
            ]
            
            for section_title, section_data in profile_sections:
                story.append(Paragraph(section_title, subheading_style))
                
                section_table_data = []
                for key, value in section_data:
                    if value and value != "N/A":
                        section_table_data.append([key + ":", str(value)])
                
                if section_table_data:
                    section_table = Table(section_table_data, colWidths=[1.5*inch, 4.5*inch])
                    section_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
                        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, -1), 10),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                        ('TOPPADDING', (0, 0), (-1, -1), 6),
                        ('LEFTPADDING', (0, 0), (-1, -1), 10),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb'))
                    ]))
                    story.append(section_table)
                    story.append(Spacer(1, 10))
            
            story.append(Spacer(1, 15))
            
            # Performance Statistics Section with modern cards
            story.append(Paragraph("📊 Performance Overview", heading_style))
            stats = report_data["user_overview"]["statistics"]
            summary = report_data.get("summary", {})
            
            # Create performance cards layout
            performance_cards = [
                ("🎯 Tests Completed", str(stats.get("total_tests_completed", 0)), "Total assessments taken"),
                ("📈 Average Score", f"{stats.get('average_score', 0):.1f}%", "Overall performance"),
                ("🏆 Highest Score", f"{summary.get('highest_score', 0):.1f}%", "Best achievement"),
                ("🎖️ Achievements", str(stats.get("achievements", 0)), "Milestones reached")
            ]
            
            # Create a 2x2 grid for performance cards
            card_rows = []
            for i in range(0, len(performance_cards), 2):
                row_data = []
                for j in range(2):
                    if i + j < len(performance_cards):
                        icon, value, desc = performance_cards[i + j]
                        card_content = f"{icon}\n{value}\n{desc}"
                        row_data.append(card_content)
                    else:
                        row_data.append("")
                card_rows.append(row_data)
            
            performance_table = Table(card_rows, colWidths=[3.5*inch, 3.5*inch])
            performance_table.setStyle(TableStyle([
                # Create gradient-like effect with alternating modern colors
                ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#6366f1')),  # Indigo-500
                ('BACKGROUND', (1, 0), (1, 0), colors.HexColor('#8b5cf6')),  # Purple-500
                ('BACKGROUND', (0, 1), (0, 1), colors.HexColor('#06b6d4')),  # Cyan-500
                ('BACKGROUND', (1, 1), (1, 1), colors.HexColor('#10b981')),  # Emerald-500
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
                ('TOPPADDING', (0, 0), (-1, -1), 20),
                ('LEFTPADDING', (0, 0), (-1, -1), 15),
                ('RIGHTPADDING', (0, 0), (-1, -1), 15),
                ('GRID', (0, 0), (-1, -1), 2, colors.white),  # White grid for modern look
            ]))
            story.append(performance_table)
            story.append(Spacer(1, 20))
            
            # Category Scores if available
            if stats.get("category_scores"):
                story.append(Paragraph("📋 Category Performance", subheading_style))
                category_data = [["Category", "Score", "Performance Level"]]
                
                for category, score in stats["category_scores"].items():
                    performance_level = "Excellent" if score >= 90 else "Good" if score >= 70 else "Average" if score >= 50 else "Needs Improvement"
                    category_data.append([
                        category.replace('_', ' ').title(),
                        f"{score:.1f}%",
                        performance_level
                    ])
                
                category_table = Table(category_data, colWidths=[2*inch, 1.5*inch, 2.5*inch])
                category_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),  # Green-600
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 11),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f0fdf4')),  # Green-50
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#16a34a'))
                ]))
                story.append(category_table)
                story.append(Spacer(1, 20))
            
            # Detailed Test Results Section
            if report_data["test_results"]:
                story.append(PageBreak())
                story.append(Paragraph("📝 Detailed Test Results", heading_style))
                
                for i, result in enumerate(report_data["test_results"]):
                    # Test header
                    test_title = f"Test {i+1}: {result['test_name']}"
                    story.append(Paragraph(test_title, subheading_style))
                    
                    # Test overview table
                    test_overview = [
                        ["📊 Score:", f"{result['score']}/{result.get('total_questions', 'N/A')}"],
                        ["📈 Percentage:", f"{result['percentage']:.1f}%"],
                        ["📅 Completed:", result["completed_at"][:10] if result["completed_at"] else "N/A"],
                        ["⏱️ Duration:", f"{result['duration_minutes']} minutes" if result["duration_minutes"] else "N/A"],
                        ["❓ Questions:", str(result.get('total_questions', 'N/A'))]
                    ]
                    
                    overview_table = Table(test_overview, colWidths=[1.5*inch, 4.5*inch])
                    overview_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef3c7')),  # Yellow-100
                        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#92400e')),  # Yellow-800
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, -1), 10),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                        ('TOPPADDING', (0, 0), (-1, -1), 6),
                        ('LEFTPADDING', (0, 0), (-1, -1), 8),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f59e0b'))
                    ]))
                    story.append(overview_table)
                    
                    # Dimension scores if available
                    if result.get("dimensions_scores"):
                        story.append(Spacer(1, 10))
                        story.append(Paragraph("🎯 Dimension Breakdown:", styles['Heading4']))
                        
                        dim_data = [["Dimension", "Score", "Percentage"]]
                        for dim, score in result["dimensions_scores"].items():
                            if isinstance(score, dict):
                                percentage = score.get('percentage', 0)
                                raw_score = score.get('score', 0)
                            else:
                                percentage = score
                                raw_score = score
                            
                            dim_data.append([
                                dim.replace('_', ' ').title(),
                                str(raw_score),
                                f"{percentage:.1f}%"
                            ])
                        
                        dim_table = Table(dim_data, colWidths=[2.5*inch, 1.5*inch, 2*inch])
                        dim_table.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7c3aed')),  # Purple-600
                            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                            ('FONTSIZE', (0, 0), (-1, -1), 9),
                            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                            ('TOPPADDING', (0, 0), (-1, -1), 6),
                            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f3e8ff')),  # Purple-50
                            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#8b5cf6'))
                        ]))
                        story.append(dim_table)
                    
                    # Analysis and recommendations if available
                    if result.get("analysis"):
                        story.append(Spacer(1, 10))
                        story.append(Paragraph("📋 Analysis:", styles['Heading4']))
                        story.append(Paragraph(str(result["analysis"]), styles['Normal']))
                    
                    if result.get("recommendations"):
                        story.append(Spacer(1, 10))
                        story.append(Paragraph("💡 Recommendations:", styles['Heading4']))
                        if isinstance(result["recommendations"], list):
                            for rec in result["recommendations"]:
                                story.append(Paragraph(f"• {rec}", styles['Normal']))
                        else:
                            story.append(Paragraph(str(result["recommendations"]), styles['Normal']))
                    
                    story.append(Spacer(1, 20))
            
            # Comprehensive AI Insights Section
            if report_data["ai_insights"]:
                story.append(PageBreak())
                story.append(Paragraph("🤖 AI-Powered Insights & Analysis", heading_style))
                
                for i, insight in enumerate(report_data["ai_insights"]):
                    # AI Insight Header
                    insight_title = f"AI Analysis {i+1}: {insight['test_name']}"
                    story.append(Paragraph(insight_title, subheading_style))
                    
                    # AI Metadata
                    ai_meta = [
                        ["🎯 Confidence Score:", f"{insight['confidence_score']:.1f}%"],
                        ["🤖 AI Model:", insight.get('model', 'Gemini-2.0-Flash')],
                        ["📅 Generated:", insight.get('generated_at', 'N/A')[:10] if insight.get('generated_at') else 'N/A']
                    ]
                    
                    meta_table = Table(ai_meta, colWidths=[1.5*inch, 4.5*inch])
                    meta_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f4ff')),  # Indigo-50
                        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#3730a3')),  # Indigo-700
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, -1), 10),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                        ('TOPPADDING', (0, 0), (-1, -1), 6),
                        ('LEFTPADDING', (0, 0), (-1, -1), 8),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#6366f1'))
                    ]))
                    story.append(meta_table)
                    story.append(Spacer(1, 15))
                    
                    insights_data = insight.get("insights", {})
                    
                    # Personality Traits
                    if insights_data.get("personality_traits"):
                        story.append(Paragraph("🧠 Personality Traits", styles['Heading4']))
                        traits_text = ""
                        for trait in insights_data["personality_traits"]:
                            traits_text += f"• {trait}\n"
                        story.append(Paragraph(traits_text, styles['Normal']))
                        story.append(Spacer(1, 10))
                    
                    # Key Strengths
                    if insights_data.get("strengths"):
                        story.append(Paragraph("💪 Key Strengths", styles['Heading4']))
                        strengths_data = []
                        for strength in insights_data["strengths"]:
                            strengths_data.append([f"✅ {strength}"])
                        
                        strengths_table = Table(strengths_data, colWidths=[6*inch])
                        strengths_table.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0fdf4')),  # Green-50
                            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#166534')),  # Green-800
                            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                            ('FONTSIZE', (0, 0), (-1, -1), 10),
                            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                            ('TOPPADDING', (0, 0), (-1, -1), 8),
                            ('LEFTPADDING', (0, 0), (-1, -1), 10),
                            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#22c55e'))
                        ]))
                        story.append(strengths_table)
                        story.append(Spacer(1, 10))
                    
                    # Areas for Improvement
                    if insights_data.get("areas_for_improvement"):
                        story.append(Paragraph("🎯 Areas for Growth", styles['Heading4']))
                        improvement_data = []
                        for area in insights_data["areas_for_improvement"]:
                            improvement_data.append([f"🔄 {area}"])
                        
                        improvement_table = Table(improvement_data, colWidths=[6*inch])
                        improvement_table.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef3c7')),  # Yellow-100
                            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#92400e')),  # Yellow-800
                            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                            ('FONTSIZE', (0, 0), (-1, -1), 10),
                            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                            ('TOPPADDING', (0, 0), (-1, -1), 8),
                            ('LEFTPADDING', (0, 0), (-1, -1), 10),
                            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f59e0b'))
                        ]))
                        story.append(improvement_table)
                        story.append(Spacer(1, 10))
                    
                    # Career Recommendations
                    if insights_data.get("career_recommendations"):
                        story.append(Paragraph("💼 Career Recommendations", styles['Heading4']))
                        career_data = []
                        for rec in insights_data["career_recommendations"]:
                            career_data.append([f"🚀 {rec}"])
                        
                        career_table = Table(career_data, colWidths=[6*inch])
                        career_table.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ede9fe')),  # Purple-100
                            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#581c87')),  # Purple-900
                            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                            ('FONTSIZE', (0, 0), (-1, -1), 10),
                            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                            ('TOPPADDING', (0, 0), (-1, -1), 8),
                            ('LEFTPADDING', (0, 0), (-1, -1), 10),
                            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#8b5cf6'))
                        ]))
                        story.append(career_table)
                        story.append(Spacer(1, 10))
                    
                    # Learning Path
                    if insights_data.get("learning_path"):
                        story.append(Paragraph("📚 Recommended Learning Path", styles['Heading4']))
                        learning_data = []
                        for step in insights_data["learning_path"]:
                            learning_data.append([f"📖 {step}"])
                        
                        learning_table = Table(learning_data, colWidths=[6*inch])
                        learning_table.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f9ff')),  # Sky-50
                            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#0c4a6e')),  # Sky-900
                            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                            ('FONTSIZE', (0, 0), (-1, -1), 10),
                            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                            ('TOPPADDING', (0, 0), (-1, -1), 8),
                            ('LEFTPADDING', (0, 0), (-1, -1), 10),
                            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#0ea5e9'))
                        ]))
                        story.append(learning_table)
                        story.append(Spacer(1, 15))
                    
                    # Add separator between insights
                    if i < len(report_data["ai_insights"]) - 1:
                        story.append(Spacer(1, 10))
                        separator_table = Table([["" * 50]], colWidths=[6*inch])
                        separator_table.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e5e7eb')),
                            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#9ca3af'))
                        ]))
                        story.append(separator_table)
                        story.append(Spacer(1, 15))
            
            # Enhanced Summary Section
            story.append(PageBreak())
            story.append(Paragraph("📋 Executive Summary", heading_style))
            summary = report_data["summary"]
            
            # Key Performance Indicators
            story.append(Paragraph("🎯 Key Performance Indicators", subheading_style))
            
            kpi_data = [
                ["📊 Total Assessments:", str(summary.get("total_tests", 0))],
                ["🏆 Highest Achievement:", f"{summary.get('highest_score', 0):.1f}%"],
                ["📈 Average Performance:", f"{summary.get('average_score', 0):.1f}%"],
                ["📉 Lowest Score:", f"{summary.get('lowest_score', 0):.1f}%"],
                ["🕒 Most Recent Test:", summary.get("most_recent_test", "N/A")],
                ["📊 Progress Trend:", summary.get("improvement_trend", "Stable")]
            ]
            
            kpi_table = Table(kpi_data, colWidths=[2.5*inch, 3.5*inch])
            kpi_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),  # Gray-50
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),  # Gray-800
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
                ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.HexColor('#f8fafc'), colors.HexColor('#f1f5f9')])
            ]))
            story.append(kpi_table)
            story.append(Spacer(1, 20))
            
            # Overall Assessment
            story.append(Paragraph("🎖️ Overall Assessment", subheading_style))
            
            avg_score = summary.get('average_score', 0)
            performance_level = "Outstanding" if avg_score >= 90 else "Excellent" if avg_score >= 80 else "Good" if avg_score >= 70 else "Satisfactory" if avg_score >= 60 else "Needs Improvement"
            
            assessment_text = f"""
            Based on the comprehensive analysis of {summary.get('total_tests', 0)} assessment(s), your overall performance level is classified as <b>{performance_level}</b> with an average score of {avg_score:.1f}%.
            
            Your highest achievement reached {summary.get('highest_score', 0):.1f}%, demonstrating your potential for excellence. The performance trend shows {summary.get('improvement_trend', 'stable')} progress, indicating {"consistent growth" if summary.get('improvement_trend') == 'Positive' else "steady performance"}.
            
            The AI-powered insights provide personalized recommendations to help you leverage your strengths and address areas for development, creating a clear path for continued growth and success.
            """
            
            story.append(Paragraph(assessment_text, styles['Normal']))
            story.append(Spacer(1, 20))
            
            # Next Steps
            story.append(Paragraph("🚀 Recommended Next Steps", subheading_style))
            
            next_steps = [
                ["1. 📚 Review AI Insights:", "Study the detailed AI analysis for each assessment to understand your strengths and growth areas."],
                ["2. 🎯 Set Goals:", "Based on the recommendations, set specific, measurable goals for personal and professional development."],
                ["3. 📈 Track Progress:", "Retake assessments periodically to monitor your growth and improvement over time."],
                ["4. 💼 Apply Insights:", "Use the career recommendations to guide your professional development and decision-making."],
                ["5. 🤝 Seek Support:", "Consider working with mentors or coaches to accelerate your development in identified areas."]
            ]
            
            steps_table = Table(next_steps, colWidths=[1.5*inch, 4.5*inch])
            steps_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ecfdf5')),  # Green-50
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#065f46')),  # Green-800
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#10b981'))
            ]))
            story.append(steps_table)
            story.append(Spacer(1, 30))
            
            # Footer
            footer_text = f"""
            <para align="center">
            <b>🎯 Life Changing Journey - Assessment Report</b><br/>
            Generated on {datetime.now().strftime("%B %d, %Y at %I:%M %p")}<br/>
            <i>Empowering your personal and professional growth through AI-powered insights</i><br/>
            <br/>
            For support or questions, contact us at support@lifechangingjourneyapp.com
            </para>
            """
            
            story.append(Paragraph(footer_text, styles['Normal']))
            
            # Build PDF
            doc.build(story)
            buffer.seek(0)
            return buffer.getvalue()
            
        except Exception as e:
            raise Exception(f"Error generating PDF report: {str(e)}")

    @staticmethod
    def _get_fallback_analysis(test_id: str, primary_result: str = None) -> Dict[str, Any]:
        """Get analysis data from test result configurations"""
        try:
            # Import test configurations
            from question_service.app.data.test_result_configurations import (
                MBTI_CONFIGS, INTELLIGENCE_CONFIGURATIONS, BIG_FIVE_CONFIGURATIONS,
                RIASEC_CONFIGURATIONS, DECISION_CONFIGURATIONS, VARK_CONFIGURATIONS,
                SVS_CONFIGURATIONS, LIFE_SITUATION_CONFIGURATIONS
            )
            
            config_map = {
                'mbti': MBTI_CONFIGS,
                'intelligence': INTELLIGENCE_CONFIGURATIONS,
                'bigfive': BIG_FIVE_CONFIGURATIONS,
                'riasec': RIASEC_CONFIGURATIONS,
                'decision': DECISION_CONFIGURATIONS,
                'vark': VARK_CONFIGURATIONS,
                'svs': SVS_CONFIGURATIONS,
                'life-situation': LIFE_SITUATION_CONFIGURATIONS
            }
            
            configs = config_map.get(test_id, [])
            if not configs:
                return {}
            
            # If primary_result is provided, find matching config
            if primary_result:
                for config in configs:
                    if config.get('result_code') == primary_result:
                        return {
                            'code': config.get('result_code'),
                            'type': config.get('result_name_english'),
                            'description': config.get('description_english'),
                            'gujarati_name': config.get('result_name_gujarati'),
                            'gujarati_description': config.get('description_gujarati')
                        }
            
            # Return first config as default
            if configs:
                config = configs[0]
                return {
                    'code': config.get('result_code'),
                    'type': config.get('result_name_english'),
                    'description': config.get('description_english'),
                    'gujarati_name': config.get('result_name_gujarati'),
                    'gujarati_description': config.get('description_gujarati')
                }
                
        except ImportError:
            pass
        
        return {}
    
    @staticmethod
    def _get_fallback_recommendations(test_id: str, result_code: str = None) -> List[str]:
        """Get recommendations from test result configurations"""
        try:
            from question_service.app.data.test_result_configurations import (
                MBTI_CONFIGS, INTELLIGENCE_CONFIGURATIONS, BIG_FIVE_CONFIGURATIONS,
                RIASEC_CONFIGURATIONS, DECISION_CONFIGURATIONS, VARK_CONFIGURATIONS,
                SVS_CONFIGURATIONS, LIFE_SITUATION_CONFIGURATIONS
            )
            
            config_map = {
                'mbti': MBTI_CONFIGS,
                'intelligence': INTELLIGENCE_CONFIGURATIONS,
                'bigfive': BIG_FIVE_CONFIGURATIONS,
                'riasec': RIASEC_CONFIGURATIONS,
                'decision': DECISION_CONFIGURATIONS,
                'vark': VARK_CONFIGURATIONS,
                'svs': SVS_CONFIGURATIONS,
                'life-situation': LIFE_SITUATION_CONFIGURATIONS
            }
            
            configs = config_map.get(test_id, [])
            
            # Find matching config by result_code
            if result_code:
                for config in configs:
                    if config.get('result_code') == result_code:
                        return config.get('recommendations', [])
            
            # Return default recommendations
            if configs:
                return configs[0].get('recommendations', [])
                
        except ImportError:
            pass
        
        return []
    
    @staticmethod
    def _get_fallback_dimensions(test_id: str, result_code: str = None) -> Dict[str, Any]:
        """Get dimension scores from test result configurations"""
        # For now, return empty dict as dimensions are test-specific
        # This can be enhanced later with actual dimension calculations
        return {}

    @staticmethod
    async def cleanup_duplicate_results(user_id: str) -> Dict[str, Any]:
        """Clean up duplicate test results for a user, keeping only the latest result for each test type"""
        import uuid
        
        # Convert user_id to UUID if it's a string - FIX FOR UUID HANDLING
        try:
            if isinstance(user_id, str):
                user_uuid = uuid.UUID(user_id)
            else:
                user_uuid = user_id
        except (ValueError, TypeError):
            logger.error(f"Invalid user_id format in cleanup_duplicate_results: {user_id}")
            return {"error": "Invalid user ID format", "cleaned_count": 0}
        
        # ✅ FIXED: Use context manager for proper session cleanup
        if DBTestResult:
            try:
                with get_db_session() as db:
                    # Get all results for the user
                    all_results = db.query(DBTestResult).filter(
                        DBTestResult.user_id == user_uuid,
                        DBTestResult.is_completed == True
                    ).order_by(DBTestResult.test_id, desc(DBTestResult.created_at)).all()
                    
                    if not all_results:
                        return {"message": "No results found", "cleaned_count": 0}
                    
                    # Group by test_id and keep only the latest
                    test_groups = {}
                    for result in all_results:
                        test_id = result.test_id
                        if test_id not in test_groups:
                            test_groups[test_id] = []
                        test_groups[test_id].append(result)
                    
                    duplicates_removed = 0
                    
                    # For each test type, delete all but the latest
                    for test_id, results in test_groups.items():
                        if len(results) > 1:
                            # Keep the first (latest) result, delete the rest
                            for duplicate in results[1:]:
                                db.delete(duplicate)
                                duplicates_removed += 1
                    
                    db.commit()
                    
                    return {
                        "message": f"Cleaned up {duplicates_removed} duplicate results",
                        "cleaned_count": duplicates_removed,
                        "unique_tests": len(test_groups),
                        "total_results_before": len(all_results),
                        "total_results_after": len(all_results) - duplicates_removed
                    }
                    
            except Exception as e:
                logger.error(f"Error cleaning up duplicates: {e}")
                raise e
        
        return {"message": "Database not available", "cleaned_count": 0}

    @staticmethod
    def _generate_fallback_insights(result: TestResult) -> Dict[str, Any]:
        """Generate fallback AI insights when AI service is unavailable"""
        return {
            "test_id": result.test_id,
            "test_name": result.test_name,
            "insights": {
                "personality_traits": [
                    "Strong analytical thinking",
                    "Good problem-solving skills",
                    "Excellent attention to detail"
                ],
                "strengths": [
                    "Logical reasoning",
                    "Pattern recognition", 
                    "Critical thinking"
                ],
                "areas_for_improvement": [
                    "Time management",
                    "Communication skills",
                    "Leadership development"
                ],
                "career_recommendations": [
                    "Consider roles in data analysis",
                    "Explore project management opportunities", 
                    "Develop presentation skills"
                ],
                "learning_path": [
                    "Take advanced analytics courses",
                    "Practice public speaking",
                    "Join leadership workshops"
                ]
            },
            "confidence_score": 75.0,
            "generated_at": datetime.now().isoformat(),
            "model": "fallback"
        }

    @staticmethod
    async def store_ai_insights(
        user_id: str,
        insights_data: Dict[str, Any],
        generated_at: Optional[str] = None,
        model: Optional[str] = None,
        test_results_used: Optional[List[str]] = None,
        generation_duration: Optional[int] = None,
        insights_type: str = "comprehensive"
    ) -> Optional[Dict[str, Any]]:
        """
        Store AI insights in dedicated ai_insights table
        
        Args:
            insights_type: Type of insights - "comprehensive" or "individual"
        """
        try:
            db = ResultService.get_db_session()
            if not db or not AIInsights:
                # Fallback to in-memory storage
                insights_id = str(uuid.uuid4())
                results_db[f"ai_insights_{user_id}_{insights_type}"] = {
                    "id": insights_id,
                    "user_id": user_id,
                    "insights_type": insights_type,
                    "insights_data": json.dumps(insights_data),
                    "model_used": model or "gemini",
                    "status": "completed",
                    "generated_at": generated_at or datetime.now().isoformat(),
                    "test_results_used": json.dumps(test_results_used or []),
                    "generation_duration": generation_duration
                }
                print(f"AI insights stored in memory for user {user_id}")
                return results_db[f"ai_insights_{user_id}_{insights_type}"]
            
            # Create AI insights record
            ai_insights = AIInsights(
                user_id=user_id,
                insights_type=insights_type,
                insights_data=json.dumps(insights_data),
                model_used=model or "gemini",
                confidence_score=95,  # Default high confidence for successful generation
                status="completed",
                generated_at=datetime.fromisoformat(generated_at.replace('Z', '+00:00')) if generated_at else datetime.utcnow(),
                test_results_used=json.dumps(test_results_used or []),
                generation_duration=generation_duration
            )
            
            # Save to database
            db.add(ai_insights)
            db.commit()
            db.refresh(ai_insights)
            
            print(f"AI insights stored successfully for user {user_id} with ID {ai_insights.id}")
            
            # Return as dict for compatibility
            return {
                "id": ai_insights.id,
                "user_id": ai_insights.user_id,
                "insights_type": ai_insights.insights_type,
                "insights_data": ai_insights.insights_data,
                "model_used": ai_insights.model_used,
                "status": ai_insights.status,
                "generated_at": ai_insights.generated_at.isoformat(),
                "test_results_used": ai_insights.test_results_used,
                "generation_duration": ai_insights.generation_duration
            }
            
        except Exception as e:
            print(f"Error storing AI insights for user {user_id}: {str(e)}")
            # Fallback to in-memory storage on database error
            insights_id = str(uuid.uuid4())
            results_db[f"ai_insights_{user_id}_{insights_type}"] = {
                "id": insights_id,
                "user_id": user_id,
                "insights_type": insights_type,
                "insights_data": json.dumps(insights_data),
                "model_used": model or "gemini",
                "status": "completed",
                "generated_at": generated_at or datetime.now().isoformat(),
                "test_results_used": json.dumps(test_results_used or []),
                "generation_duration": generation_duration
            }
            return results_db[f"ai_insights_{user_id}_{insights_type}"]

    @staticmethod
    async def get_user_ai_insights(user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get existing comprehensive AI insights for a user (for one-time restriction check)
        """
        import uuid
        import json
        
        print(f"🔍 get_user_ai_insights: Searching for AI insights for user {user_id}")
        
        # First check in-memory storage for any insights type
        for key in results_db:
            if f"ai_insights_{user_id}" in key:
                print(f"✅ Found AI insights in memory: {key}")
                insights = results_db[key]
                # Parse insights_data if it's a JSON string
                if isinstance(insights.get("insights_data"), str):
                    try:
                        insights["insights_data"] = json.loads(insights["insights_data"])
                    except:
                        pass
                return insights
        
        # Then try database
        try:
            db = ResultService.get_db_session()
            if not db or not AIInsights:
                print(f"❌ Database session not available for user {user_id}")
                return None
            
            # Convert user_id to UUID if it's a string
            try:
                if isinstance(user_id, str):
                    user_uuid = uuid.UUID(user_id)
                else:
                    user_uuid = user_id
            except (ValueError, TypeError):
                logger.error(f"Invalid user_id format in get_user_ai_insights: {user_id}")
                return None
            
            # Query AI insights table - look for comprehensive insights first
            ai_insights = db.query(AIInsights).filter(
                AIInsights.user_id == user_uuid,
                AIInsights.insights_type == "comprehensive",
                AIInsights.status == "completed"
            ).order_by(desc(AIInsights.generated_at)).first()
            
            # If no comprehensive insights, look for any completed insights
            if not ai_insights:
                print(f"⚠️ No comprehensive insights found, checking for any completed insights")
                ai_insights = db.query(AIInsights).filter(
                    AIInsights.user_id == user_uuid,
                    AIInsights.status == "completed"
                ).order_by(desc(AIInsights.generated_at)).first()
            
            if ai_insights:
                print(f"✅ Found AI insights in database for user {user_id}")
                
                # Parse insights_data if it's a JSON string
                insights_data = ai_insights.insights_data
                if isinstance(insights_data, str):
                    try:
                        insights_data = json.loads(insights_data)
                        print(f"✅ Successfully parsed JSON insights data")
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse insights_data JSON for user {user_id}: {e}")
                        insights_data = ai_insights.insights_data  # Keep as string if parsing fails
                
                return {
                    "id": str(ai_insights.id),
                    "user_id": str(ai_insights.user_id),  # Convert UUID to string
                    "insights_type": ai_insights.insights_type,
                    "insights_data": insights_data,  # Now parsed JSON object
                    "model_used": ai_insights.model_used,
                    "status": ai_insights.status,
                    "generated_at": ai_insights.generated_at.isoformat(),
                    "timestamp": ai_insights.generated_at.isoformat()  # For compatibility, also as string
                }
            
            print(f"❌ No AI insights found for user {user_id} in database")
            return None
            
        except Exception as e:
            print(f"Error checking AI insights for user {user_id}: {str(e)}")
            return None

    @staticmethod
    async def get_user_ai_insights_for_history(user_id: str) -> List[Dict[str, Any]]:
        """
        Get AI insights formatted for test history display
        """
        try:
            ai_insights = await ResultService.get_user_ai_insights(user_id)
            if not ai_insights:
                return []
            
            # Format AI insights as test result for history display
            formatted_insight = {
                "id": f"ai_insights_{ai_insights['id']}",
                "test_id": "comprehensive-ai-insights",
                "test_name": "સંપૂર્ણ AI વિશ્લેષણ રિપોર્ટ (Comprehensive AI Analysis)",
                "result_name_gujarati": "AI વિશ્લેષણ પૂર્ણ",
                "result_name_english": "AI Analysis Complete",
                "primary_result": "AI_INSIGHTS",
                "completion_date": ai_insights["generated_at"],
                "timestamp": ai_insights["generated_at"],
                "percentage": 100,
                "score": 100,
                "status": "completed",
                "model_used": ai_insights.get("model_used", "gemini"),
                "insights_data": ai_insights["insights_data"]
            }
            
            return [formatted_insight]
            
        except Exception as e:
            print(f"Error getting AI insights for history for user {user_id}: {str(e)}")
            return []
