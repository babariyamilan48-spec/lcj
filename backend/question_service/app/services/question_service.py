from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional, Tuple
from question_service.app.models.question import Question
from question_service.app.models.option import Option
from question_service.app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse
from question_service.app.schemas.option import OptionResponse

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
        """Get all questions with pagination and filtering"""
        query = self.db.query(Question)
        
        if test_id is not None:
            query = query.filter(Question.test_id == test_id)
        
        if section_id is not None:
            query = query.filter(Question.section_id == section_id)
        
        if is_active is not None:
            query = query.filter(Question.is_active == is_active)
        
        total = query.count()
        questions = query.offset(skip).limit(limit).all()
        
        return [QuestionResponse.from_orm(question) for question in questions], total

    def get_question(self, question_id: int) -> Optional[QuestionResponse]:
        """Get a question by its ID"""
        question = self.db.query(Question).filter(Question.id == question_id).first()
        return QuestionResponse.from_orm(question) if question else None

    def create_question(self, question_data: QuestionCreate) -> QuestionResponse:
        """Create a new question"""
        question = Question(**question_data.dict())
        self.db.add(question)
        self.db.commit()
        self.db.refresh(question)
        return QuestionResponse.from_orm(question)

    def update_question(self, question_id: int, question_data: QuestionUpdate) -> Optional[QuestionResponse]:
        """Update a question"""
        question = self.db.query(Question).filter(Question.id == question_id).first()
        if not question:
            return None
        
        update_data = question_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(question, field, value)
        
        self.db.commit()
        self.db.refresh(question)
        return QuestionResponse.from_orm(question)

    def delete_question(self, question_id: int) -> bool:
        """Delete a question"""
        question = self.db.query(Question).filter(Question.id == question_id).first()
        if not question:
            return False
        
        self.db.delete(question)
        self.db.commit()
        return True

    def get_questions_by_test_id(self, test_id: int) -> List[QuestionResponse]:
        """Get all questions for a specific test"""
        questions = self.db.query(Question).filter(
            and_(Question.test_id == test_id, Question.is_active == True)
        ).order_by(Question.question_order).all()
        
        return [QuestionResponse.from_orm(question) for question in questions]
