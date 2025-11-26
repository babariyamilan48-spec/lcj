"""
Contact model for storing contact form submissions
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from datetime import datetime
import enum
from core.database_fixed import Base

class InquiryType(enum.Enum):
    GENERAL = "GENERAL"
    TECHNICAL = "TECHNICAL"
    BILLING = "BILLING"
    PARTNERSHIP = "PARTNERSHIP"
    FEEDBACK = "FEEDBACK"

class ContactStatus(enum.Enum):
    NEW = "NEW"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class Contact(Base):
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    inquiry_type = Column(Enum(InquiryType), default=InquiryType.GENERAL)
    status = Column(Enum(ContactStatus), default=ContactStatus.NEW)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Contact(id={self.id}, name='{self.name}', email='{self.email}', subject='{self.subject}')>"
