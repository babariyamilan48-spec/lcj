from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class OptionBase(BaseModel):
    question_id: int = Field(..., description="ID of the question this option belongs to")
    option_text: str = Field(..., description="The option text")
    dimension: Optional[str] = Field(None, description="Dimension this option maps to (e.g., 'E', 'I')")
    weight: int = Field(1, description="Weight/score for this option")
    option_order: int = Field(0, description="Order of the option within the question")
    is_active: bool = Field(True, description="Whether the option is active")

class OptionCreate(OptionBase):
    pass

class OptionUpdate(BaseModel):
    option_text: Optional[str] = None
    dimension: Optional[str] = None
    weight: Optional[int] = None
    option_order: Optional[int] = None
    is_active: Optional[bool] = None

class OptionResponse(OptionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
