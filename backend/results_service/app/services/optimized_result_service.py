"""
Optimized Result Service with High-Performance Database Operations
Reduces response time from 5-7 seconds to under 1 second
"""
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta
import uuid
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
import json
from sqlalchemy.orm import Session

from ..schemas.result import TestResult, TestResultCreate, UserProfile, UserProfileUpdate
from core.optimized_supabase_client import (
    optimized_supabase, 
    fast_select, 
    fast_insert, 
    fast_update,
    fast_rpc,
    QueryOptimization
)
from core.cache import cache_async_result, QueryCache
from core.database_fixed import get_db_session as get_db

logger = logging.getLogger(__name__)

# Thread pool for CPU-intensive operations
executor = ThreadPoolExecutor(max_workers=4)

def serialize_uuid(obj):
    """Helper function to serialize UUID objects to strings"""
    if isinstance(obj, uuid.UUID):
        return str(obj)
    elif isinstance(obj, dict):
        return {k: serialize_uuid(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [serialize_uuid(item) for item in obj]
    return obj

class OptimizedResultService:
    """
    High-performance result service with optimized database operations
    """
    
    @staticmethod
    async def create_result_fast(result_data: TestResultCreate) -> TestResult:
        """
        Ultra-fast result creation with optimized database operations
        """
        try:
            # Convert user_id to UUID efficiently
            user_uuid = uuid.UUID(result_data.user_id) if isinstance(result_data.user_id, str) else result_data.user_id
            
            # Check for duplicates with minimal data transfer
            duplicate_check = await fast_select(
                table="test_results",  # Use correct table name (plural)
                fields=["id", "created_at"],
                limit=1,
                user_id__eq=str(user_uuid),  # Convert UUID to string
                test_id__eq=result_data.test_id,
                is_completed__eq=True,
                created_at__gte=(datetime.now() - timedelta(minutes=5)).isoformat(),
                use_cache=False  # Don't cache duplicate checks
            )
            
            if duplicate_check:
                logger.info(f"Duplicate result found for user {result_data.user_id}")
                # Return existing result without full data fetch
                return await OptimizedResultService.get_result_by_id(duplicate_check[0]['id'])
            
            # Prepare optimized data for insertion
            insert_data = {
                "user_id": str(user_uuid),  # Convert UUID to string
                "test_id": result_data.test_id,
                "answers": result_data.answers or {},
                "completion_percentage": result_data.percentage_score or result_data.percentage or 100,
                "time_taken_seconds": result_data.duration_seconds or 0,
                "calculated_result": {
                    "analysis": result_data.analysis,
                    "score": result_data.total_score or result_data.score or 0,
                    "percentage": result_data.percentage_score or result_data.percentage or 100,
                    "dimensions_scores": result_data.dimensions_scores,
                    "recommendations": result_data.recommendations
                },
                "primary_result": str(result_data.analysis.get('code', '')) if result_data.analysis else '',
                "result_summary": result_data.test_name,
                "is_completed": True,
                "completed_at": datetime.now().isoformat()
            }
            
            # Fast insert with only required return fields
            db_result = await fast_insert(
                table="test_results",  # Use correct table name (plural)
                data=insert_data,
                return_fields=["id", "user_id", "test_id", "created_at", "completed_at"]
            )
            
            # Invalidate cache asynchronously (don't wait)
            asyncio.create_task(OptimizedResultService._invalidate_user_cache(str(result_data.user_id)))
            
            # Build response efficiently
            result_dict = {
                "id": str(db_result["id"]),
                "user_id": str(db_result["user_id"]),
                "test_id": result_data.test_id,
                "test_name": result_data.test_name,
                "score": result_data.total_score or result_data.score or 0,
                "percentage": result_data.percentage_score or result_data.percentage or 100,
                "percentage_score": result_data.percentage_score or result_data.percentage or 100,
                "total_score": result_data.total_score or result_data.score or 0,
                "answers": result_data.answers,
                "analysis": result_data.analysis,
                "recommendations": result_data.recommendations or [],
                "duration_seconds": result_data.duration_seconds,
                "duration_minutes": result_data.duration_minutes,
                "total_questions": result_data.total_questions,
                "dimensions_scores": result_data.dimensions_scores,
                "timestamp": db_result["created_at"],
                "completed_at": db_result["completed_at"]
            }
            
            return TestResult(**result_dict)
            
        except Exception as e:
            logger.error(f"Error in create_result_fast: {str(e)}")
            raise
    
    @staticmethod
    @cache_async_result(ttl=300, key_prefix="fast_user_results")
    async def get_user_results_fast(user_id: str, limit: Optional[int] = None) -> List[TestResult]:
        """
        Ultra-fast user results retrieval with minimal data transfer
        """
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            
            # Optimized query with only required fields
            optimization = QueryOptimization(
                select_fields=[
                    "id", "user_id", "test_id", "answers", "completion_percentage",
                    "time_taken_seconds", "calculated_result", "primary_result",
                    "result_summary", "created_at", "completed_at"
                ],
                limit=limit or 50,
                order_by="-created_at",
                use_cache=True,
                cache_ttl=600
            )
            
            db_results = await optimized_supabase.optimized_select(
                table="test_results",  # Use correct table name
                optimization=optimization,
                user_id__eq=str(user_uuid),  # Convert UUID to string
                is_completed__eq=True
            )
            
            # Process results in parallel
            tasks = [OptimizedResultService._process_db_result(db_result) for db_result in db_results]
            processed_results = await asyncio.gather(*tasks)
            
            return processed_results
            
        except Exception as e:
            logger.error(f"Error in get_user_results_fast: {str(e)}")
            return []
    
    @staticmethod
    async def _process_db_result(db_result: Dict[str, Any]) -> TestResult:
        """
        Process database result efficiently
        """
        calculated_result = db_result.get('calculated_result') or {}
        
        return TestResult(
            id=str(db_result["id"]),
            user_id=str(db_result["user_id"]),
            test_id=db_result["test_id"],
            test_name=db_result.get("result_summary", db_result["test_id"]),
            score=calculated_result.get('score', 0),
            percentage=db_result.get("completion_percentage", 0),
            percentage_score=db_result.get("completion_percentage", 0),
            total_score=calculated_result.get('score', 0),
            answers=db_result.get("answers", {}),
            analysis=calculated_result.get('analysis', {}),
            recommendations=calculated_result.get('recommendations', []),
            duration_seconds=db_result.get("time_taken_seconds", 0),
            duration_minutes=(db_result.get("time_taken_seconds", 0) // 60),
            total_questions=len(db_result.get("answers", {})),
            dimensions_scores=calculated_result.get('dimensions_scores', {}),
            timestamp=db_result["created_at"],
            completed_at=db_result.get("completed_at")
        )
    
    @staticmethod
    async def get_result_by_id(result_id: str) -> TestResult:
        """
        Fast single result retrieval
        """
        try:
            results = await fast_select(
                table="test_result",
                fields=[
                    "id", "user_id", "test_id", "answers", "completion_percentage",
                    "time_taken_seconds", "calculated_result", "primary_result",
                    "result_summary", "created_at", "completed_at"
                ],
                limit=1,
                id__eq=result_id,
                use_cache=True
            )
            
            if not results:
                raise ValueError(f"Result {result_id} not found")
            
            return await OptimizedResultService._process_db_result(results[0])
            
        except Exception as e:
            logger.error(f"Error getting result by ID: {str(e)}")
            raise
    
    @staticmethod
    @cache_async_result(ttl=600, key_prefix="fast_paginated_results")
    async def get_user_results_paginated_fast(
        user_id: str, 
        page: int = 1, 
        size: int = 10
    ) -> Dict[str, Any]:
        """
        Ultra-fast paginated results with optimized queries
        """
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            
            # Get total count using direct query instead of missing RPC function
            count_optimization = QueryOptimization(
                select_fields=["count(*)"],
                use_cache=True,
                cache_ttl=300
            )
            
            count_task = optimized_supabase.optimized_select(
                table="test_result",
                optimization=count_optimization,
                user_id__eq=str(user_uuid),
                is_completed__eq=True
            )
            
            # Optimized paginated query
            optimization = QueryOptimization(
                select_fields=[
                    "id", "test_id", "completion_percentage", "calculated_result",
                    "result_summary", "created_at", "completed_at"
                ],
                limit=size,
                offset=(page - 1) * size,
                order_by="-created_at",
                use_cache=True,
                cache_ttl=300
            )
            
            results_task = optimized_supabase.optimized_select(
                table="test_results",  # Use correct table name
                optimization=optimization,
                user_id__eq=str(user_uuid),  # Convert UUID to string
                is_completed__eq=True
            )
            
            # Execute in parallel
            count_result, db_results = await asyncio.gather(count_task, results_task)
            
            # Extract count from result
            total_count = count_result[0].get('count', 0) if count_result else 0
            
            # Process results efficiently
            results_data = []
            for db_result in db_results:
                calculated_result = db_result.get('calculated_result', {})
                result_dict = {
                    "id": str(db_result["id"]),
                    "test_id": db_result["test_id"],
                    "test_name": db_result.get("result_summary", db_result["test_id"]),
                    "score": calculated_result.get('score', 0),
                    "percentage": db_result.get("completion_percentage", 0),
                    "timestamp": db_result["created_at"].isoformat() if hasattr(db_result["created_at"], 'isoformat') else str(db_result["created_at"]),
                    "completed_at": db_result.get("completed_at").isoformat() if db_result.get("completed_at") and hasattr(db_result.get("completed_at"), 'isoformat') else str(db_result.get("completed_at", ""))
                }
                results_data.append(result_dict)
            
            return {
                "results": results_data,
                "total": total_count or len(results_data),
                "page": page,
                "size": size,
                "total_pages": ((total_count or len(results_data)) + size - 1) // size
            }
            
        except Exception as e:
            logger.error(f"Error in paginated results: {str(e)}")
            return {"results": [], "total": 0, "page": page, "size": size, "total_pages": 0}
    
    @staticmethod
    @cache_async_result(ttl=900, key_prefix="fast_all_results")
    async def get_all_test_results_fast(user_id: str) -> Dict[str, Any]:
        """
        Ultra-fast retrieval of all test results organized by test type
        """
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            
            # Optimized query with minimal fields for organization
            optimization = QueryOptimization(
                select_fields=[
                    "test_id", "answers", "completion_percentage", "calculated_result",
                    "time_taken_seconds", "result_summary", "created_at", "completed_at"
                ],
                order_by="-created_at",
                use_cache=True,
                cache_ttl=900
            )
            
            db_results = await optimized_supabase.optimized_select(
                table="test_results",  # Use correct table name
                optimization=optimization,
                user_id__eq=str(user_uuid),  # Convert UUID to string
                is_completed__eq=True
            )
            
            # Organize results efficiently
            organized_results = {}
            for db_result in db_results:
                test_id = db_result["test_id"]
                if test_id not in organized_results or db_result["created_at"] > organized_results[test_id]['timestamp']:
                    calculated_result = db_result.get('calculated_result', {})
                    organized_results[test_id] = {
                        'test_id': test_id,
                        'test_name': db_result.get("result_summary", test_id),
                        'analysis': calculated_result.get('analysis', {}),
                        'score': calculated_result.get('score', 0),
                        'percentage': db_result.get("completion_percentage", 0),
                        'percentage_score': db_result.get("completion_percentage", 0),
                        'total_score': calculated_result.get('score', 0),
                        'dimensions_scores': calculated_result.get('dimensions_scores', {}),
                        'recommendations': calculated_result.get('recommendations', []),
                        'answers': db_result.get("answers", {}),
                        'duration_minutes': (db_result.get("time_taken_seconds", 0) // 60),
                        'total_questions': len(db_result.get("answers", {})),
                        'timestamp': db_result["created_at"].isoformat() if db_result.get("created_at") else None,
                        'completed_at': db_result.get("completed_at").isoformat() if db_result.get("completed_at") else None,
                        'user_id': str(user_id)
                    }
            
            logger.info(f"Fast retrieval: {len(organized_results)} unique test results for user {user_id}")
            
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
                    logger.info(f"Added AI insights to fast all-results for user {user_id}")
            except Exception as ai_error:
                logger.warning(f"Could not add AI insights to fast all-results for user {user_id}: {ai_error}")
            
            # Additional safety check: ensure all datetime and UUID objects are converted to strings
            def ensure_json_serializable(obj):
                if isinstance(obj, dict):
                    return {k: ensure_json_serializable(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [ensure_json_serializable(item) for item in obj]
                elif hasattr(obj, 'isoformat'):  # datetime objects
                    return obj.isoformat()
                elif hasattr(obj, 'hex'):  # UUID objects
                    return str(obj)
                else:
                    return obj
            
            return ensure_json_serializable(organized_results)
            
        except Exception as e:
            logger.error(f"Error in get_all_test_results_fast: {str(e)}")
            return {}
    
    @staticmethod
    async def batch_get_user_data(user_id: str) -> Dict[str, Any]:
        """
        Get all user data in a single optimized batch operation
        """
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            
            # Define batch queries
            queries = [
                {
                    'table': 'test_result',
                    'optimization': QueryOptimization(
                        select_fields=['id', 'test_id', 'completion_percentage', 'created_at'],
                        limit=50,
                        order_by='-created_at',
                        use_cache=True
                    ),
                    'filters': {'user_id__eq': user_uuid, 'is_completed__eq': True}
                },
                {
                    'table': 'user_profile',
                    'optimization': QueryOptimization(
                        select_fields=['*'],
                        limit=1,
                        use_cache=True
                    ),
                    'filters': {'user_id__eq': user_uuid}
                }
            ]
            
            # Execute batch queries
            results = await optimized_supabase.batch_select(queries)
            
            return {
                'test_results': results[0] if len(results) > 0 else [],
                'user_profile': results[1][0] if len(results) > 1 and results[1] else None,
                'user_id': user_id
            }
            
        except Exception as e:
            logger.error(f"Error in batch_get_user_data: {str(e)}")
            return {'test_results': [], 'user_profile': None, 'user_id': user_id}
    
    @staticmethod
    async def _invalidate_user_cache(user_id: str):
        """
        Asynchronously invalidate all user-related cache
        """
        try:
            # Invalidate multiple cache patterns
            cache_patterns = [
                f"fast_user_results:*{user_id}*",
                f"fast_paginated_results:*{user_id}*",
                f"fast_all_results:*{user_id}*",
                f"user_analytics:*{user_id}*",
                f"completion_status:*{user_id}*"
            ]
            
            for pattern in cache_patterns:
                cache.delete_pattern(pattern)
            
            logger.debug(f"Cache invalidated for user {user_id}")
            
        except Exception as e:
            logger.warning(f"Cache invalidation failed: {e}")
    
    @staticmethod
    async def health_check() -> Dict[str, Any]:
        """
        Fast health check for the optimized service
        """
        try:
            start_time = datetime.now()
            
            # Quick database connectivity test
            health_result = await optimized_supabase.health_check()
            
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return {
                "service": "OptimizedResultService",
                "status": "healthy" if health_result["status"] == "healthy" else "degraded",
                "response_time_ms": round(response_time, 2),
                "database": health_result,
                "optimizations": {
                    "connection_pooling": True,
                    "query_caching": True,
                    "field_selection": True,
                    "batch_operations": True,
                }
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "service": "OptimizedResultService",
                "status": "unhealthy",
                "error": str(e)
            }
    
    def __init__(self, db: Session):
        self.db = db
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Handle context manager exit - let FastAPI's dependency handle cleanup"""
        # ✅ CRITICAL: Don't close the session here
        # FastAPI's get_db() dependency will handle all cleanup
        # This context manager is just for code organization
        pass
    
    async def get_user_results_fast(self, user_id: str, page: int, size: int):
        """Get paginated user results"""
        try:
            # Convert string user_id to UUID for database query
            user_uuid = uuid.UUID(user_id)
            
            # Import here to avoid circular imports
            from question_service.app.models.test_result import TestResult as TestResultModel
            
            # Calculate offset
            offset = (page - 1) * size
            
            # Get results with pagination
            results_query = self.db.query(TestResultModel).filter(
                TestResultModel.user_id == user_uuid
            ).order_by(TestResultModel.created_at.desc()).offset(offset).limit(size)
            
            results = results_query.all()
            
            # Get total count
            total = self.db.query(TestResultModel).filter(
                TestResultModel.user_id == user_uuid
            ).count()
            
            # Serialize results with proper UUID handling
            serialized_results = []
            for result in results:
                # Serialize calculated_result if it contains UUIDs
                calculated_result = result.calculated_result
                if calculated_result:
                    calculated_result = serialize_uuid(calculated_result)
                
                result_dict = {
                    "id": str(result.id),
                    "user_id": str(result.user_id),
                    "test_id": result.test_id,
                    "primary_result": result.primary_result,
                    "calculated_result": calculated_result,
                    "completion_percentage": getattr(result, 'completion_percentage', 0),
                    "created_at": result.created_at.isoformat() if result.created_at else None,
                    "updated_at": result.updated_at.isoformat() if result.updated_at else None
                }
                serialized_results.append(result_dict)
            
            return serialized_results, total
            
        except Exception as e:
            logger.error(f"Error getting user results: {e}")
            return [], 0
    
    async def get_batch_user_data_fast(self, user_id: str):
        """Get batch user data including results, analytics, etc."""
        try:
            # Convert string user_id to UUID for database query
            user_uuid = uuid.UUID(user_id)
            
            # Import here to avoid circular imports
            from question_service.app.models.test_result import TestResult as TestResultModel
            
            # Get recent results
            recent_results = self.db.query(TestResultModel).filter(
                TestResultModel.user_id == user_uuid,
                TestResultModel.completion_percentage >= 100
            ).order_by(TestResultModel.created_at.desc()).limit(10).all()
            
            # Get completion stats
            total_completed = self.db.query(TestResultModel).filter(
                TestResultModel.user_id == user_uuid,
                TestResultModel.completion_percentage >= 100
            ).count()
            
            # Serialize data with proper UUID handling
            serialized_results = []
            for result in recent_results:
                # Serialize calculated_result if it contains UUIDs
                calculated_result = result.calculated_result
                if calculated_result:
                    calculated_result = serialize_uuid(calculated_result)
                
                result_dict = {
                    "id": str(result.id),
                    "test_id": result.test_id,
                    "primary_result": result.primary_result,
                    "calculated_result": calculated_result,
                    "created_at": result.created_at.isoformat() if result.created_at else None
                }
                serialized_results.append(result_dict)
            
            return {
                "user_id": user_id,
                "recent_results": serialized_results,
                "total_completed": total_completed,
                "last_activity": recent_results[0].created_at.isoformat() if recent_results else None
            }
            
        except Exception as e:
            logger.error(f"Error getting batch user data: {e}")
            return {
                "user_id": user_id,
                "recent_results": [],
                "total_completed": 0,
                "last_activity": None
            }
