"""
Pydantic schemas for partner-school free access
"""
from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class SchoolActiveOut(BaseModel):
    """Public dropdown payload — codes are intentionally NOT exposed here."""
    id: UUID
    name: str

    class Config:
        json_schema_extra = {
            "example": {"id": "550e8400-e29b-41d4-a716-446655440000", "name": "Greenfield High School"}
        }


class RedeemSchoolCodeRequest(BaseModel):
    """Student submits the school they belong to + that school's access code"""
    school_id: UUID = Field(..., description="School selected from the dropdown")
    code: str = Field(..., min_length=1, max_length=40, description="School access code (case-insensitive)")

    class Config:
        json_schema_extra = {
            "example": {"school_id": "550e8400-e29b-41d4-a716-446655440000", "code": "GREENFIELD26"}
        }


class RedeemSchoolCodeResponse(BaseModel):
    """Response after successful code redemption"""
    success: bool = True
    school_name: str

    class Config:
        json_schema_extra = {"example": {"success": True, "school_name": "Greenfield High School"}}


class SchoolCreate(BaseModel):
    """Admin: create a partner school (code is auto-generated)"""
    name: str = Field(..., min_length=2, max_length=120)
    contact_email: Optional[str] = Field(None, max_length=120)


class SchoolUpdate(BaseModel):
    """Admin: modify a school — all fields optional"""
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    code: Optional[str] = Field(None, min_length=4, max_length=40, description="New access code (uppercased server-side)")
    contact_email: Optional[str] = Field(None, max_length=120)
    is_active: Optional[bool] = Field(None, description="Deactivate to revoke free access for all linked students")


class SchoolOut(BaseModel):
    """Admin: school record with linked student count"""
    id: UUID
    name: str
    code: str
    is_active: bool
    contact_email: Optional[str] = None
    student_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
