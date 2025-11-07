"""
Contact schemas for request/response validation
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class InquiryTypeEnum(str, Enum):
    GENERAL = "general"
    TECHNICAL = "technical"
    BILLING = "billing"
    PARTNERSHIP = "partnership"
    FEEDBACK = "feedback"

class ContactStatusEnum(str, Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class ContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full name of the person")
    email: EmailStr = Field(..., description="Email address")
    subject: str = Field(..., min_length=1, max_length=500, description="Subject of the inquiry")
    message: str = Field(..., min_length=1, description="Message content")
    inquiry_type: InquiryTypeEnum = Field(default=InquiryTypeEnum.GENERAL, description="Type of inquiry")

class ContactUpdate(BaseModel):
    status: Optional[ContactStatusEnum] = None
    
class ContactResponse(BaseModel):
    id: int
    name: str
    email: str
    subject: str
    message: str
    inquiry_type: InquiryTypeEnum
    status: ContactStatusEnum
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_db_model(cls, db_contact):
        """Convert database model to response schema"""
        # Map database enum values to API enum values
        inquiry_type_mapping = {
            'GENERAL': 'general',
            'TECHNICAL': 'technical',
            'BILLING': 'billing',
            'PARTNERSHIP': 'partnership',
            'FEEDBACK': 'feedback'
        }
        
        status_mapping = {
            'NEW': 'new',
            'IN_PROGRESS': 'in_progress',
            'RESOLVED': 'resolved',
            'CLOSED': 'closed'
        }
        
        return cls(
            id=db_contact.id,
            name=db_contact.name,
            email=db_contact.email,
            subject=db_contact.subject,
            message=db_contact.message,
            inquiry_type=inquiry_type_mapping.get(db_contact.inquiry_type.value if db_contact.inquiry_type else None, 'general'),
            status=status_mapping.get(db_contact.status.value if db_contact.status else None, 'new'),
            created_at=db_contact.created_at,
            updated_at=db_contact.updated_at
        )

class ContactListResponse(BaseModel):
    contacts: list[ContactResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
