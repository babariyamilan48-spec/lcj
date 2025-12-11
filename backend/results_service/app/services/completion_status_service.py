"""
Test Completion Status Service

A robust service for tracking and managing test completion status with proper UUID handling,
cache management, and error handling.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import logging
from sqlalchemy.orm import Session
from sqlalchemy import and_

from core.database_fixed import get_db_session as get_db
from core.cache import QueryCache

logger = logging.getLogger(__name__)

# Import database models
try:
    from question_service.app.models.test_result import TestResult as DBTestResult
except ImportError:
    DBTestResult = None
    logger.warning("Database models not available, using fallback mode")


class CompletionStatusService:
    """Service for managing test completion status"""
    
    # Define required tests for comprehensive analysis
    REQUIRED_TESTS = [
        'mbti', 
        'intelligence', 
        'bigfive', 
        'riasec', 
        'decision', 
        'vark', 
        'life-situation'
    ]
    
    # Test display names mapping
    TEST_DISPLAY_NAMES = {
        'mbti': 'MBTI Personality Test',
        'intelligence': 'Multiple Intelligence Test',
        'bigfive': 'Big Five Personality Test',
        'riasec': 'RIASEC Career Interest Test',
        'decision': 'Decision Making Style Test',
        'vark': 'VARK Learning Style Test',
        'life-situation': 'Life Situation Assessment'
    }
    
    @staticmethod
    def _validate_user_id(user_id: str) -> uuid.UUID:
        """Validate and convert user_id to UUID"""
        try:
            if isinstance(user_id, str):
                return uuid.UUID(user_id)
            elif isinstance(user_id, uuid.UUID):
                return user_id
            else:
                raise ValueError(f"Invalid user_id type: {type(user_id)}")
        except (ValueError, TypeError) as e:
            logger.error(f"Invalid user_id format: {user_id}, error: {e}")
            raise ValueError(f"Invalid user_id format: {user_id}")
    
    @staticmethod
    def _get_db_session():
        """Get database session - returns context manager, not session directly"""
        try:
            from core.database_fixed import get_db_session
            return get_db_session()
        except Exception as e:
            logger.error(f"Failed to get database session: {e}")
            import traceback
            logger.error(f"Database session error traceback: {traceback.format_exc()}")
            return None
    
    @staticmethod
    async def get_user_completed_tests(user_id: str) -> List[str]:
        """
        Get list of completed test IDs for a user
        
        Args:
            user_id: User ID (string or UUID)
            
        Returns:
            List of completed test IDs
            
        Raises:
            ValueError: If user_id is invalid
        """
        try:
            # Validate user ID
            user_uuid = CompletionStatusService._validate_user_id(user_id)
            
            # Try to get from cache first
            cache_key = f"completed_tests:{user_id}"
            try:
                from core.cache import cache
                cached_result = cache.get(cache_key)
                if cached_result is not None:
                    logger.info(f"Retrieved completed tests from cache for user {user_id}")
                    return cached_result
            except Exception as cache_error:
                logger.warning(f"Cache retrieval failed for user {user_id}: {cache_error}")
            
            # ✅ FIXED: Use context manager properly to ensure session is closed
            db_context = CompletionStatusService._get_db_session()
            if not db_context or not DBTestResult:
                logger.warning("Database not available, returning empty list")
                return []
            
            with db_context as db:
                # ✅ OPTIMIZED: Get unique test IDs directly from database (no data transfer overhead)
                completed_tests = [
                    row[0] for row in db.query(DBTestResult.test_id).filter(
                        and_(
                            DBTestResult.user_id == user_uuid,
                            DBTestResult.is_completed == True
                        )
                    ).distinct().all()
                    if row[0] and row[0].strip()
                ]
                
                # Cache the result for 30 seconds (faster invalidation for frequently changing data)
                try:
                    from core.cache import cache
                    cache.set(cache_key, completed_tests, ttl=30)
                except Exception as cache_error:
                    logger.warning(f"Failed to cache completed tests for user {user_id}: {cache_error}")
                
                logger.info(f"Found {len(completed_tests)} completed tests for user {user_id}: {completed_tests}")
                return completed_tests
                
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error getting completed tests for user {user_id}: {e}")
            return []
    
    @staticmethod
    async def get_completion_status(user_id: str) -> Dict[str, Any]:
        """
        Get comprehensive completion status for a user
        
        Args:
            user_id: User ID (string or UUID)
            
        Returns:
            Dictionary with completion status information
        """
        try:
            logger.info(f"Getting completion status for user: {user_id}")
            
            # Validate user ID
            user_uuid = CompletionStatusService._validate_user_id(user_id)
            
            # Try to get from cache first
            cache_key = f"completion_status:{user_id}"
            try:
                from core.cache import cache
                cached_result = cache.get(cache_key)
                if cached_result is not None:
                    logger.info(f"Retrieved completion status from cache for user {user_id}")
                    return cached_result
            except Exception as cache_error:
                logger.warning(f"Cache retrieval failed for completion status {user_id}: {cache_error}")
            
            # Get completed tests
            completed_tests = await CompletionStatusService.get_user_completed_tests(user_id)
            
            # Calculate missing tests
            missing_tests = [
                test for test in CompletionStatusService.REQUIRED_TESTS 
                if test not in completed_tests
            ]
            
            # Calculate completion percentage
            completion_percentage = (
                len(completed_tests) / len(CompletionStatusService.REQUIRED_TESTS)
            ) * 100
            
            # Build status response
            status = {
                "user_id": user_id,
                "user_uuid": str(user_uuid),
                "all_completed": len(missing_tests) == 0,
                "completed_tests": completed_tests,
                "missing_tests": missing_tests,
                "total_tests": len(CompletionStatusService.REQUIRED_TESTS),
                "completion_percentage": round(completion_percentage, 2),
                "required_tests": CompletionStatusService.REQUIRED_TESTS,
                "test_details": {
                    "completed": [
                        {
                            "test_id": test_id,
                            "display_name": CompletionStatusService.TEST_DISPLAY_NAMES.get(
                                test_id, test_id.title()
                            )
                        }
                        for test_id in completed_tests
                    ],
                    "missing": [
                        {
                            "test_id": test_id,
                            "display_name": CompletionStatusService.TEST_DISPLAY_NAMES.get(
                                test_id, test_id.title()
                            )
                        }
                        for test_id in missing_tests
                    ]
                },
                "last_updated": datetime.now().isoformat()
            }
            
            # Cache the result for 2 minutes (shorter TTL for faster updates)
            try:
                from core.cache import cache
                cache.set(cache_key, status, ttl=120)
            except Exception as cache_error:
                logger.warning(f"Failed to cache completion status for user {user_id}: {cache_error}")
            
            logger.info(f"Completion status for user {user_id}: {len(completed_tests)}/{len(CompletionStatusService.REQUIRED_TESTS)} tests completed")
            return status
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error getting completion status for user {user_id}: {e}")
            raise
    
    @staticmethod
    async def invalidate_user_cache(user_id: str) -> bool:
        """
        Invalidate all completion status cache for a user
        
        Args:
            user_id: User ID (string or UUID)
            
        Returns:
            True if cache was invalidated successfully
        """
        try:
            # Validate user ID
            user_uuid = CompletionStatusService._validate_user_id(user_id)
            
            # Clear all cache keys related to this user (multiple formats)
            cache_patterns = [
                f"completion_status:{user_id}",
                f"completed_tests:{user_id}",
                f"progress_summary:{user_id}",
                f"completion_status_v2:{user_id}",  # API cache key
                f"progress_summary:{user_id}",      # Progress cache key
            ]
            
            # Also try with UUID format
            user_uuid_str = str(user_uuid)
            if user_uuid_str != user_id:
                cache_patterns.extend([
                    f"completion_status:{user_uuid_str}",
                    f"completed_tests:{user_uuid_str}",
                    f"progress_summary:{user_uuid_str}",
                    f"completion_status_v2:{user_uuid_str}",
                    f"progress_summary:{user_uuid_str}",
                ])
            
            # Use QueryCache methods to clear cache
            try:
                QueryCache.invalidate_completion_status(user_id)
                QueryCache.invalidate_user_results(user_id)
            except Exception as cache_error:
                logger.warning(f"Failed to clear cache using QueryCache methods: {cache_error}")
            
            # Also clear specific cache keys using the cache instance
            cleared_count = 0
            for pattern in cache_patterns:
                try:
                    from core.cache import cache
                    cache.delete(pattern)
                    cleared_count += 1
                except Exception as cache_error:
                    pass
            
            logger.info(f"Invalidated {cleared_count} completion status cache keys for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error invalidating cache for user {user_id}: {e}")
            return False
    
    @staticmethod
    async def mark_test_completed(user_id: str, test_id: str) -> None:
        """
        Mark a test as completed and invalidate relevant cache
        
        Args:
            user_id: User ID (string or UUID)
            test_id: Test ID that was completed
        """
        try:
            # Validate user ID
            CompletionStatusService._validate_user_id(user_id)
            
            # Invalidate cache to force refresh
            await CompletionStatusService.invalidate_user_cache(user_id)
            
            logger.info(f"Marked test {test_id} as completed for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error marking test completed for user {user_id}, test {test_id}: {e}")
    
    @staticmethod
    async def get_test_progress_summary(user_id: str) -> Dict[str, Any]:
        """
        Get a summary of test progress for dashboard display
        
        Args:
            user_id: User ID (string or UUID)
            
        Returns:
            Dictionary with progress summary
        """
        try:
            status = await CompletionStatusService.get_completion_status(user_id)
            
            return {
                "user_id": user_id,
                "progress_percentage": status["completion_percentage"],
                "completed_count": len(status["completed_tests"]),
                "total_count": status["total_tests"],
                "is_eligible_for_comprehensive_report": status["all_completed"],
                "next_recommended_tests": status["missing_tests"][:3],  # Show up to 3 next tests
                "status_message": (
                    "બધા ટેસ્ટ પૂર્ણ થયા! સંપૂર્ણ રિપોર્ટ જોવા માટે તૈયાર છો." 
                    if status["all_completed"] 
                    else f"હજુ {len(status['missing_tests'])} ટેસ્ટ બાકી છે"
                )
            }
            
        except Exception as e:
            logger.error(f"Error getting progress summary for user {user_id}: {e}")
            return {
                "user_id": user_id,
                "progress_percentage": 0,
                "completed_count": 0,
                "total_count": len(CompletionStatusService.REQUIRED_TESTS),
                "is_eligible_for_comprehensive_report": False,
                "next_recommended_tests": CompletionStatusService.REQUIRED_TESTS[:3],
                "status_message": "ટેસ્ટ પ્રગતિ લોડ કરવામાં સમસ્યા"
            }
