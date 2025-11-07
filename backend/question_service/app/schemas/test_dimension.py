from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class TestDimensionBase(BaseModel):
    test_id: int = Field(..., description="ID of the test this dimension belongs to")
    dimension_id: str = Field(..., description="Unique dimension identifier (e.g., 'E', 'I')")
    name: str = Field(..., description="Dimension name in Gujarati")
    english_name: str = Field(..., description="Dimension name in English")
    gujarati_name: Optional[str] = Field(None, description="Additional Gujarati name")
    description: Optional[str] = Field(None, description="Dimension description")
    careers: Optional[List[str]] = Field(None, description="List of career suggestions")

class TestDimensionCreate(TestDimensionBase):
    pass

class TestDimensionResponse(TestDimensionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
