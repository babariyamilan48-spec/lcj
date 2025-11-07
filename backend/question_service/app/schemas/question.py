from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class QuestionBase(BaseModel):
    test_id: int = Field(..., description="ID of the test this question belongs to")
    section_id: Optional[int] = Field(None, description="ID of the section this question belongs to")
    question_text: str = Field(..., description="The question text")
    question_order: int = Field(0, description="Order of the question within the test/section")
    is_active: bool = Field(True, description="Whether the question is active")

class QuestionCreate(QuestionBase):
    pass

class QuestionUpdate(BaseModel):
    section_id: Optional[int] = None
    question_text: Optional[str] = None
    question_order: Optional[int] = None
    is_active: Optional[bool] = None

class OptionResponse(BaseModel):
    id: int
    option_text: str
    dimension: Optional[str] = None
    weight: int
    option_order: int
    is_active: bool

    class Config:
        from_attributes = True

class QuestionResponse(QuestionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    options: List[OptionResponse] = []

    class Config:
        from_attributes = True

class QuestionListResponse(BaseModel):
    questions: List[QuestionResponse]
    total: int
    page: int
    size: int
