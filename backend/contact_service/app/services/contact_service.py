"""
Contact service for handling contact form operations
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from contact_service.app.models.contact import Contact, ContactStatus, InquiryType
from contact_service.app.schemas.contact import ContactCreate, ContactUpdate
import logging

logger = logging.getLogger(__name__)

class ContactService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_contact(self, contact_data: ContactCreate) -> Contact:
        """Create a new contact submission"""
        try:
            # Map API enum values to database enum values
            inquiry_type_mapping = {
                'general': InquiryType.GENERAL,
                'technical': InquiryType.TECHNICAL,
                'billing': InquiryType.BILLING, 
                'partnership': InquiryType.PARTNERSHIP,
                'feedback': InquiryType.FEEDBACK
            }
            
            db_inquiry_type = inquiry_type_mapping.get(contact_data.inquiry_type, InquiryType.GENERAL)
            
            db_contact = Contact(
                name=contact_data.name,
                email=contact_data.email,
                subject=contact_data.subject,
                message=contact_data.message,
                inquiry_type=db_inquiry_type
            )
            
            self.db.add(db_contact)
            self.db.commit()
            self.db.refresh(db_contact)
            
            logger.info(f"Created new contact submission: {db_contact.id}")
            return db_contact
            
        except Exception as e:
            logger.error(f"Error creating contact: {str(e)}")
            self.db.rollback()
            raise
    
    def get_contact(self, contact_id: int) -> Optional[Contact]:
        """Get a contact by ID"""
        return self.db.query(Contact).filter(Contact.id == contact_id).first()
    
    def get_contacts(self, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> tuple[List[Contact], int]:
        """Get all contacts with pagination and optional status filter"""
        query = self.db.query(Contact)
        
        if status:
            # Map API status to database enum
            status_mapping = {
                'new': ContactStatus.NEW,
                'in_progress': ContactStatus.IN_PROGRESS,
                'resolved': ContactStatus.RESOLVED,
                'closed': ContactStatus.CLOSED
            }
            db_status = status_mapping.get(status)
            if db_status:
                query = query.filter(Contact.status == db_status)
        
        total = query.count()
        contacts = query.order_by(desc(Contact.created_at)).offset(skip).limit(limit).all()
        
        return contacts, total
    
    def update_contact_status(self, contact_id: int, contact_update: ContactUpdate) -> Optional[Contact]:
        """Update contact status"""
        try:
            db_contact = self.get_contact(contact_id)
            if not db_contact:
                return None
            
            if contact_update.status:
                # Map API status values to database enum values
                status_mapping = {
                    'new': ContactStatus.NEW,
                    'in_progress': ContactStatus.IN_PROGRESS,
                    'resolved': ContactStatus.RESOLVED,
                    'closed': ContactStatus.CLOSED
                }
                db_status = status_mapping.get(contact_update.status, ContactStatus.NEW)
                db_contact.status = db_status
            
            self.db.commit()
            self.db.refresh(db_contact)
            
            logger.info(f"Updated contact {contact_id} status to {contact_update.status}")
            return db_contact
            
        except Exception as e:
            logger.error(f"Error updating contact {contact_id}: {str(e)}")
            self.db.rollback()
            raise
    
    def delete_contact(self, contact_id: int) -> bool:
        """Delete a contact"""
        try:
            db_contact = self.get_contact(contact_id)
            if not db_contact:
                return False
            
            self.db.delete(db_contact)
            self.db.commit()
            
            logger.info(f"Deleted contact: {contact_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting contact {contact_id}: {str(e)}")
            self.db.rollback()
            raise
    
    def get_contact_stats(self) -> dict:
        """Get contact statistics"""
        try:
            total_contacts = self.db.query(Contact).count()
            new_contacts = self.db.query(Contact).filter(Contact.status == ContactStatus.NEW).count()
            in_progress_contacts = self.db.query(Contact).filter(Contact.status == ContactStatus.IN_PROGRESS).count()
            resolved_contacts = self.db.query(Contact).filter(Contact.status == ContactStatus.RESOLVED).count()
            
            return {
                "total": total_contacts,
                "new": new_contacts,
                "in_progress": in_progress_contacts,
                "resolved": resolved_contacts
            }
        except Exception as e:
            logger.error(f"Error getting contact stats: {str(e)}")
            raise
