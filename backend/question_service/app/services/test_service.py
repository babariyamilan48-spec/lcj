from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional, Tuple
from question_service.app.models.test import Test
from question_service.app.models.question import Question
from question_service.app.models.option import Option
from question_service.app.schemas.test import TestCreate, TestUpdate, TestResponse
from question_service.app.schemas.question import QuestionResponse
from question_service.app.schemas.option import OptionResponse

class TestService:
    def __init__(self, db: Session):
        self.db = db

    def get_tests(self, skip: int = 0, limit: int = 100, is_active: Optional[bool] = None) -> Tuple[List[TestResponse], int]:
        """Get all tests with pagination and filtering"""
        query = self.db.query(Test)
        
        if is_active is not None:
            query = query.filter(Test.is_active == is_active)
        
        total = query.count()
        tests = query.offset(skip).limit(limit).all()
        
        return [TestResponse.from_orm(test) for test in tests], total

    def get_test_by_test_id(self, test_id: str) -> Optional[TestResponse]:
        """Get a test by its test_id"""
        test = self.db.query(Test).filter(Test.test_id == test_id).first()
        return TestResponse.from_orm(test) if test else None

    def get_test_by_id(self, test_id: int) -> Optional[TestResponse]:
        """Get a test by its database ID"""
        test = self.db.query(Test).filter(Test.id == test_id).first()
        return TestResponse.from_orm(test) if test else None

    def create_test(self, test_data: TestCreate) -> TestResponse:
        """Create a new test"""
        test = Test(**test_data.dict())
        self.db.add(test)
        self.db.commit()
        self.db.refresh(test)
        return TestResponse.from_orm(test)

    def update_test(self, test_id: str, test_data: TestUpdate) -> Optional[TestResponse]:
        """Update a test"""
        test = self.db.query(Test).filter(Test.test_id == test_id).first()
        if not test:
            return None
        
        update_data = test_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(test, field, value)
        
        self.db.commit()
        self.db.refresh(test)
        return TestResponse.from_orm(test)

    def delete_test(self, test_id: str) -> bool:
        """Delete a test"""
        test = self.db.query(Test).filter(Test.test_id == test_id).first()
        if not test:
            return False
        
        self.db.delete(test)
        self.db.commit()
        return True

    def get_test_questions(self, test_id: str) -> List[dict]:
        """Get all questions for a specific test with their options"""
        test = self.db.query(Test).filter(Test.test_id == test_id).first()
        if not test:
            return []
        
        questions = self.db.query(Question).filter(
            and_(Question.test_id == test.id, Question.is_active == True)
        ).order_by(Question.question_order).all()
        
        result = []
        for question in questions:
            options = self.db.query(Option).filter(
                and_(Option.question_id == question.id, Option.is_active == True)
            ).order_by(Option.option_order).all()
            
            question_data = {
                "id": question.id,
                "question_text": question.question_text,
                "question_order": question.question_order,
                "section_id": question.section_id,
                "options": [
                    {
                        "id": option.id,
                        "option_text": option.option_text,
                        "dimension": option.dimension,
                        "weight": option.weight,
                        "option_order": option.option_order
                    }
                    for option in options
                ]
            }
            result.append(question_data)
        
        return result
