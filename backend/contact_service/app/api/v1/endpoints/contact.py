"""
Contact API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import math

from core.database_dependencies_singleton import get_user_db, get_db
from contact_service.app.services.contact_service import ContactService
from contact_service.app.schemas.contact import (
    ContactCreate, 
    ContactUpdate, 
    ContactResponse, 
    ContactListResponse,
    ContactStatusEnum
)

router = APIRouter()

@router.post("/", response_model=ContactResponse, status_code=201)
async def create_contact(
    contact_data: ContactCreate,
    db: Session = Depends(get_db)
):
    """Create a new contact submission"""
    try:
        contact_service = ContactService(db)
        contact = contact_service.create_contact(contact_data)
        return ContactResponse.from_db_model(contact)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create contact: {str(e)}")

@router.get("/", response_model=ContactListResponse)
async def get_contacts(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[ContactStatusEnum] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db)
):
    """Get all contacts with pagination and optional status filter"""
    try:
        contact_service = ContactService(db)
        skip = (page - 1) * per_page
        
        contacts, total = contact_service.get_contacts(
            skip=skip, 
            limit=per_page, 
            status=status.value if status else None
        )
        
        total_pages = math.ceil(total / per_page) if total > 0 else 1
        
        return ContactListResponse(
            contacts=[ContactResponse.from_db_model(contact) for contact in contacts],
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get contacts: {str(e)}")

@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific contact by ID"""
    try:
        contact_service = ContactService(db)
        contact = contact_service.get_contact(contact_id)
        
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        return ContactResponse.from_db_model(contact)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get contact: {str(e)}")

@router.patch("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: int,
    contact_update: ContactUpdate,
    db: Session = Depends(get_db)
):
    """Update contact status"""
    try:
        contact_service = ContactService(db)
        contact = contact_service.update_contact_status(contact_id, contact_update)
        
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        return ContactResponse.from_db_model(contact)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update contact: {str(e)}")

@router.delete("/{contact_id}", status_code=204)
async def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db)
):
    """Delete a contact"""
    try:
        contact_service = ContactService(db)
        success = contact_service.delete_contact(contact_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        return {"message": "Contact deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete contact: {str(e)}")

@router.get("/stats/overview")
async def get_contact_stats(db: Session = Depends(get_db)):
    """Get contact statistics"""
    try:
        contact_service = ContactService(db)
        stats = contact_service.get_contact_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get contact stats: {str(e)}")
