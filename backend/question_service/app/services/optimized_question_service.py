"""
Optimized Question Service with High-Performance Database Operations
Reduces response time for question and option loading from seconds to milliseconds
"""
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
import json

from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, func, text
from question_service.app.models.question import Question
from question_service.app.models.option import Option
from question_service.app.models.test import Test
from question_service.app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse
from question_service.app.schemas.option import OptionResponse
from core.optimized_supabase_client import (
    optimized_supabase, 
    fast_select, 
    fast_insert, 
    fast_update,
    QueryOptimization
)
from core.cache import cache_async_result, QueryCache

logger = logging.getLogger(__name__)

# Thread pool for CPU-intensive operations
executor = ThreadPoolExecutor(max_workers=4)

class OptimizedQuestionService:
    """
    High-performance question service with optimized database operations
    """
    
    def __init__(self, db: Session):
        self.db = db
        self._session_timeout = 30  # 30 second timeout
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Ensure database session is properly closed"""
        try:
            if self.db:
                self.db.close()
        except Exception as e:
            logger.warning(f"Error closing database session: {e}")
    
    def _ensure_session_closed(self):
        """Ensure database session is closed after operation"""
        try:
            if self.db:
                # Commit any pending transactions
                self.db.commit()
                # Close the session
                self.db.close()
        except Exception as e:
            logger.warning(f"Error in session cleanup: {e}")
            try:
                self.db.rollback()
                self.db.close()
            except:
                pass
    
    @cache_async_result(ttl=1800, key_prefix="fast_questions")
    async def get_questions_fast(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        test_id: Optional[int] = None,
        section_id: Optional[int] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Ultra-fast question retrieval with minimal data transfer
        """
        try:
            # Build optimized query with specific field selection
            base_query = self.db.query(
                Question.id,
                Question.test_id,
                Question.section_id,
                Question.question_text,
                Question.question_type,
                Question.question_order,
                Question.is_active
            )
            
            # Apply filters
            if test_id is not None:
                base_query = base_query.filter(Question.test_id == test_id)
            if section_id is not None:
                base_query = base_query.filter(Question.section_id == section_id)
            if is_active is not None:
                base_query = base_query.filter(Question.is_active == is_active)
            
            # Execute count and data queries in parallel
            count_query = base_query.with_entities(func.count(Question.id))
            data_query = base_query.order_by(Question.question_order).offset(skip).limit(limit)
            
            # Execute both queries
            total = count_query.scalar()
            questions = data_query.all()
            
            # Convert to dictionaries efficiently
            question_list = []
            for q in questions:
                question_dict = {
                    "id": q.id,
                    "test_id": q.test_id,
                    "section_id": q.section_id,
                    "question_text": q.question_text,
                    "question_type": q.question_type,
                    "question_order": q.question_order,
                    "is_active": q.is_active,
                    "options": []  # Will be loaded separately if needed
                }
                question_list.append(question_dict)
            
            return question_list, total
            
        except Exception as e:
            logger.error(f"Error in get_questions_fast: {str(e)}")
            return [], 0
        finally:
            # Always ensure session is closed
            self._ensure_session_closed()
    
    @cache_async_result(ttl=1800, key_prefix="fast_question_with_options")
    async def get_question_with_options_fast(self, question_id: int) -> Optional[Dict[str, Any]]:
        """
        Ultra-fast single question retrieval with options
        """
        try:
            # Use optimized query with selectinload for options
            question = self.db.query(Question).options(
                selectinload(Question.options.and_(Option.is_active == True))
            ).filter(Question.id == question_id).first()
            
            if not question:
                return None
            
            # Build response efficiently
            question_dict = {
                "id": question.id,
                "test_id": question.test_id,
                "section_id": question.section_id,
                "question_text": question.question_text,
                "question_type": question.question_type,
                "question_order": question.question_order,
                "is_active": question.is_active,
                "options": [
                    {
                        "id": option.id,
                        "option_text": option.option_text,
                        "dimension": option.dimension,
                        "weight": option.weight,
                        "option_order": option.option_order,
                        "is_active": option.is_active
                    }
                    for option in sorted(question.options, key=lambda x: x.option_order)
                ]
            }
            
            return question_dict
            
        except Exception as e:
            logger.error(f"Error in get_question_with_options_fast: {str(e)}")
            return None
        finally:
            # Always ensure session is closed
            self._ensure_session_closed()
    
    @cache_async_result(ttl=1800, key_prefix="fast_test_questions")
    async def get_test_questions_fast(self, test_id: int) -> List[Dict[str, Any]]:
        """
        Ultra-fast test questions retrieval with all options
        """
        try:
            # Single optimized query with all data
            questions = self.db.query(Question).options(
                selectinload(Question.options.and_(Option.is_active == True))
            ).filter(
                and_(Question.test_id == test_id, Question.is_active == True)
            ).order_by(Question.question_order).all()
            
            # Process results efficiently
            result = []
            for question in questions:
                question_data = {
                    "id": question.id,
                    "question_text": question.question_text,
                    "question_order": question.question_order,
                    "section_id": question.section_id,
                    "question_type": question.question_type,
                    "options": [
                        {
                            "id": option.id,
                            "option_text": option.option_text,
                            "dimension": option.dimension,
                            "weight": option.weight,
                            "option_order": option.option_order
                        }
                        for option in sorted(question.options, key=lambda x: x.option_order)
                    ]
                }
                result.append(question_data)
            
            return result
            
        except Exception as e:
            logger.error(f"Error in get_test_questions_fast: {str(e)}")
            return []
        finally:
            # Always ensure session is closed
            self._ensure_session_closed()
    
    async def batch_get_questions_with_options(self, question_ids: List[int]) -> List[Dict[str, Any]]:
        """
        Batch retrieval of questions with options for maximum efficiency
        """
        try:
            if not question_ids:
                return []
            
            # Single query for all questions and their options
            questions = self.db.query(Question).options(
                selectinload(Question.options.and_(Option.is_active == True))
            ).filter(Question.id.in_(question_ids)).all()
            
            # Create lookup for efficient processing
            question_map = {q.id: q for q in questions}
            
            # Build results in original order
            results = []
            for question_id in question_ids:
                if question_id in question_map:
                    question = question_map[question_id]
                    question_dict = {
                        "id": question.id,
                        "test_id": question.test_id,
                        "section_id": question.section_id,
                        "question_text": question.question_text,
                        "question_type": question.question_type,
                        "question_order": question.question_order,
                        "is_active": question.is_active,
                        "options": [
                            {
                                "id": option.id,
                                "option_text": option.option_text,
                                "dimension": option.dimension,
                                "weight": option.weight,
                                "option_order": option.option_order,
                                "is_active": option.is_active
                            }
                            for option in sorted(question.options, key=lambda x: x.option_order)
                        ]
                    }
                    results.append(question_dict)
            
            return results
            
        except Exception as e:
            logger.error(f"Error in batch_get_questions_with_options: {str(e)}")
            return []
        finally:
            # Always ensure session is closed
            self._ensure_session_closed()
    
    @cache_async_result(ttl=3600, key_prefix="fast_test_structure")
    async def get_test_structure_fast(self, test_id: int) -> Dict[str, Any]:
        """
        Get complete test structure with sections, questions, and options
        """
        try:
            # Get test info
            test = self.db.query(Test).filter(Test.id == test_id).first()
            if not test:
                return {}
            
            # Get all questions with options in one query
            questions = self.db.query(Question).options(
                selectinload(Question.options.and_(Option.is_active == True))
            ).filter(
                and_(Question.test_id == test_id, Question.is_active == True)
            ).order_by(Question.question_order).all()
            
            # Group by sections
            sections = {}
            for question in questions:
                section_id = question.section_id or 0
                if section_id not in sections:
                    sections[section_id] = {
                        "section_id": section_id,
                        "questions": []
                    }
                
                question_data = {
                    "id": question.id,
                    "question_text": question.question_text,
                    "question_order": question.question_order,
                    "question_type": question.question_type,
                    "options": [
                        {
                            "id": option.id,
                            "option_text": option.option_text,
                            "dimension": option.dimension,
                            "weight": option.weight,
                            "option_order": option.option_order
                        }
                        for option in sorted(question.options, key=lambda x: x.option_order)
                    ]
                }
                sections[section_id]["questions"].append(question_data)
            
            return {
                "test_id": test.id,
                "test_name": test.test_name,
                "sections": list(sections.values()),
                "total_questions": len(questions)
            }
            
        except Exception as e:
            logger.error(f"Error in get_test_structure_fast: {str(e)}")
            return {}
        finally:
            # Always ensure session is closed
            self._ensure_session_closed()
    
    async def create_question_fast(self, question_data: QuestionCreate) -> Optional[Dict[str, Any]]:
        """
        Fast question creation with cache invalidation
        """
        try:
            question = Question(**question_data.dict())
            self.db.add(question)
            self.db.commit()
            self.db.refresh(question)
            
            # Invalidate related caches asynchronously
            asyncio.create_task(self._invalidate_question_cache(question.test_id))
            
            return {
                "id": question.id,
                "test_id": question.test_id,
                "section_id": question.section_id,
                "question_text": question.question_text,
                "question_type": question.question_type,
                "question_order": question.question_order,
                "is_active": question.is_active
            }
            
        except Exception as e:
            logger.error(f"Error in create_question_fast: {str(e)}")
            try:
                self.db.rollback()
            except:
                pass
            return None
        finally:
            # Always ensure session is closed
            self._ensure_session_closed()
    
    async def update_question_fast(self, question_id: int, question_data: QuestionUpdate) -> Optional[Dict[str, Any]]:
        """
        Fast question update with cache invalidation
        """
        try:
            question = self.db.query(Question).filter(Question.id == question_id).first()
            if not question:
                return None
            
            old_test_id = question.test_id
            
            update_data = question_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(question, field, value)
            
            self.db.commit()
            self.db.refresh(question)
            
            # Invalidate related caches asynchronously
            asyncio.create_task(self._invalidate_question_cache(old_test_id))
            if question.test_id != old_test_id:
                asyncio.create_task(self._invalidate_question_cache(question.test_id))
            
            return {
                "id": question.id,
                "test_id": question.test_id,
                "section_id": question.section_id,
                "question_text": question.question_text,
                "question_type": question.question_type,
                "question_order": question.question_order,
                "is_active": question.is_active
            }
            
        except Exception as e:
            logger.error(f"Error in update_question_fast: {str(e)}")
            try:
                self.db.rollback()
            except:
                pass
            return None
        finally:
            # Always ensure session is closed
            self._ensure_session_closed()
    
    async def _invalidate_question_cache(self, test_id: int):
        """
        Asynchronously invalidate question-related cache
        """
        try:
            cache_patterns = [
                f"fast_questions:*test_id:{test_id}*",
                f"fast_test_questions:*{test_id}*",
                f"fast_test_structure:*{test_id}*",
                f"fast_question_with_options:*"
            ]
            
            for pattern in cache_patterns:
                QueryCache.cache.delete_pattern(pattern)
            
            logger.debug(f"Cache invalidated for test_id {test_id}")
            
        except Exception as e:
            logger.warning(f"Cache invalidation failed: {e}")
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Fast health check for the optimized question service
        """
        try:
            start_time = datetime.now()
            
            # Quick database connectivity test
            question_count = self.db.query(func.count(Question.id)).scalar()
            
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return {
                "service": "OptimizedQuestionService",
                "status": "healthy",
                "response_time_ms": round(response_time, 2),
                "question_count": question_count,
                "optimizations": {
                    "selectinload_options": True,
                    "query_caching": True,
                    "field_selection": True,
                    "batch_operations": True,
                    "async_processing": True
                }
            }
            
        except Exception as e:
            return {
                "service": "OptimizedQuestionService",
                "status": "unhealthy",
                "error": str(e)
            }
