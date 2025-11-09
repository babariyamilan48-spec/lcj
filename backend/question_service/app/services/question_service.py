from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func
from typing import List, Optional, Tuple
from question_service.app.models.question import Question
from question_service.app.models.option import Option
from question_service.app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse
from question_service.app.schemas.option import OptionResponse
from core.cache import cache_result, QueryCache
import logging

logger = logging.getLogger(__name__)

class QuestionService:
    def __init__(self, db: Session):
        self.db = db

    def get_questions(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        test_id: Optional[int] = None,
        section_id: Optional[int] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[List[QuestionResponse], int]:
        """Get all questions with pagination and filtering - OPTIMIZED with caching"""
        # Try cache first for common queries
        if skip == 0 and limit >= 100 and test_id is not None and is_active is True:
            cached_questions = QueryCache.get_questions(test_id, section_id)
            if cached_questions:
                logger.debug(f"Cache HIT for questions test_id={test_id}, section_id={section_id}")
                total = len(cached_questions)
                return cached_questions[:limit], total
        
        # Build optimized query with eager loading
        query = self.db.query(Question).options(
            joinedload(Question.options)  # Eager load options to prevent N+1
        )
        
        # Apply filters
        if test_id is not None:
            query = query.filter(Question.test_id == test_id)
        
        if section_id is not None:
            query = query.filter(Question.section_id == section_id)
        
        if is_active is not None:
            query = query.filter(Question.is_active == is_active)
        
        # Optimized count query
        count_query = self.db.query(func.count(Question.id))
        if test_id is not None:
            count_query = count_query.filter(Question.test_id == test_id)
        if section_id is not None:
            count_query = count_query.filter(Question.section_id == section_id)
        if is_active is not None:
            count_query = count_query.filter(Question.is_active == is_active)
        
        total = count_query.scalar()
        
        # Order by question_order for consistent results
        questions = query.order_by(Question.question_order).offset(skip).limit(limit).all()
        
        question_responses = [QuestionResponse.from_orm(question) for question in questions]
        
        # Cache common queries
        if skip == 0 and limit >= 100 and test_id is not None and is_active is True:
            QueryCache.set_questions(test_id, question_responses, section_id, ttl=1800)
            logger.debug(f"Cached questions for test_id={test_id}, section_id={section_id}")
        
        return question_responses, total

    @cache_result(ttl=1800, key_prefix="question")
    def get_question(self, question_id: int) -> Optional[QuestionResponse]:
        """Get a question by its ID - OPTIMIZED with caching"""
        question = self.db.query(Question).options(
            joinedload(Question.options)  # Eager load options
        ).filter(Question.id == question_id).first()
        return QuestionResponse.from_orm(question) if question else None

    def create_question(self, question_data: QuestionCreate) -> QuestionResponse:
        """Create a new question - OPTIMIZED with cache invalidation"""
        question = Question(**question_data.dict())
        self.db.add(question)
        self.db.commit()
        self.db.refresh(question)
        
        # Invalidate related caches
        if question.test_id:
            QueryCache.set_questions(question.test_id, [], ttl=0)  # Clear cache
        
        return QuestionResponse.from_orm(question)

    def update_question(self, question_id: int, question_data: QuestionUpdate) -> Optional[QuestionResponse]:
        """Update a question - OPTIMIZED with cache invalidation"""
        question = self.db.query(Question).filter(Question.id == question_id).first()
        if not question:
            return None
        
        old_test_id = question.test_id
        
        update_data = question_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(question, field, value)
        
        self.db.commit()
        self.db.refresh(question)
        
        # Invalidate related caches
        if old_test_id:
            QueryCache.set_questions(old_test_id, [], ttl=0)  # Clear cache
        if question.test_id and question.test_id != old_test_id:
            QueryCache.set_questions(question.test_id, [], ttl=0)  # Clear new cache
        
        return QuestionResponse.from_orm(question)

    def delete_question(self, question_id: int) -> bool:
        """Delete a question - OPTIMIZED with cache invalidation"""
        question = self.db.query(Question).filter(Question.id == question_id).first()
        if not question:
            return False
        
        test_id = question.test_id
        
        self.db.delete(question)
        self.db.commit()
        
        # Invalidate related caches
        if test_id:
            QueryCache.set_questions(test_id, [], ttl=0)  # Clear cache
        
        return True

    def get_questions_by_test_id(self, test_id: int) -> List[QuestionResponse]:
        """Get all questions for a specific test - OPTIMIZED with caching"""
        # Try cache first
        cached_questions = QueryCache.get_questions(test_id)
        if cached_questions:
            logger.debug(f"Cache HIT for test questions test_id={test_id}")
            return cached_questions
        
        # Query with eager loading
        questions = self.db.query(Question).options(
            joinedload(Question.options)  # Prevent N+1 queries
        ).filter(
            and_(Question.test_id == test_id, Question.is_active == True)
        ).order_by(Question.question_order).all()
        
        question_responses = [QuestionResponse.from_orm(question) for question in questions]
        
        # Cache the results
        QueryCache.set_questions(test_id, question_responses, ttl=1800)
        logger.debug(f"Cached test questions for test_id={test_id}")
        
        return question_responses
