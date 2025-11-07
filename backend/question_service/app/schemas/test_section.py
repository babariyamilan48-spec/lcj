from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TestSectionBase(BaseModel):
    test_id: int = Field(..., description="ID of the test this section belongs to")
    section_id: str = Field(..., description="Unique section identifier (e.g., 'ei', 'sn')")
    name: str = Field(..., description="Section name in Gujarati")
    gujarati_name: Optional[str] = Field(None, description="Additional Gujarati name")

class TestSectionCreate(TestSectionBase):
    pass

class TestSectionResponse(TestSectionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
