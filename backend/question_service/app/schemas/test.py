from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class TestBase(BaseModel):
    test_id: str = Field(..., description="Unique test identifier (e.g., 'mbti', 'bigfive')")
    name: str = Field(..., description="Test name in Gujarati")
    english_name: str = Field(..., description="Test name in English")
    description: Optional[str] = Field(None, description="Test description")
    icon: Optional[str] = Field(None, description="Icon name")
    color: Optional[str] = Field(None, description="Hex color code")
    questions_count: int = Field(0, description="Number of questions in the test")
    duration: Optional[str] = Field(None, description="Test duration")
    is_active: bool = Field(True, description="Whether the test is active")

class TestCreate(TestBase):
    pass

class TestUpdate(BaseModel):
    name: Optional[str] = None
    english_name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    questions_count: Optional[int] = None
    duration: Optional[str] = None
    is_active: Optional[bool] = None

class TestSectionResponse(BaseModel):
    id: int
    section_id: str
    name: str
    gujarati_name: Optional[str] = None

    class Config:
        from_attributes = True

class TestDimensionResponse(BaseModel):
    id: int
    dimension_id: str
    name: str
    english_name: str
    gujarati_name: Optional[str] = None
    description: Optional[str] = None
    careers: Optional[List[str]] = None

    class Config:
        from_attributes = True

class TestResponse(TestBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    sections: List[TestSectionResponse] = []
    dimensions: List[TestDimensionResponse] = []

    class Config:
        from_attributes = True

class TestListResponse(BaseModel):
    tests: List[TestResponse]
    total: int
    page: int
    size: int
