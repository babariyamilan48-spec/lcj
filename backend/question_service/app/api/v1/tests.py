from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from core.database_dependencies_singleton import get_db
from core.app_factory import resp
from question_service.app.deps.auth import get_current_user
from question_service.app.models.test import Test
# Removed: from app.models.user import User
from question_service.app.schemas.test import TestCreate, TestUpdate, TestResponse, TestListResponse
from question_service.app.services.test_service import TestService
from core.rate_limit import limiter

router = APIRouter()

@router.get("/")
@limiter.limit("100/minute")
async def get_tests(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = None,
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all tests with pagination"""
    try:
        service = TestService(db)
        tests, total = service.get_tests(skip=skip, limit=limit, is_active=is_active)
        
        # Return tests array directly for AdminPanel compatibility
        return tests
    except Exception as e:
        return resp(None, False, str(e), "Failed to retrieve tests", 500)

@router.get("/{test_id}")
@limiter.limit("100/minute")
async def get_test(
    request: Request,
    test_id: str,
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific test by test_id"""
    try:
        service = TestService(db)
        test = service.get_test_by_test_id(test_id)
        if not test:
            return resp(None, False, "Test not found", "Test not found", 404)
        
        return resp(test, True, None, "Test retrieved successfully")
    except Exception as e:
        return resp(None, False, str(e), "Failed to retrieve test", 500)

@router.post("/")
@limiter.limit("10/minute")
async def create_test(
    request: Request,
    test_data: TestCreate, 
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """Create a new test (Admin only)"""
    try:
        # Check if user has admin privileges
        if not getattr(current_user, "is_admin", False):
            return resp(None, False, "Insufficient permissions", "Admin access required", 403)
        
        service = TestService(db)
        test = service.create_test(test_data)
        return resp(test, True, None, "Test created successfully", 201)
    except Exception as e:
        return resp(None, False, str(e), "Failed to create test", 500)

@router.put("/{test_id}")
@limiter.limit("10/minute")
async def update_test(
    request: Request,
    test_id: str, 
    test_data: TestUpdate, 
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """Update a test (Admin only)"""
    try:
        # Check if user has admin privileges
        if not getattr(current_user, "is_admin", False):
            return resp(None, False, "Insufficient permissions", "Admin access required", 403)
        
        service = TestService(db)
        test = service.update_test(test_id, test_data)
        if not test:
            return resp(None, False, "Test not found", "Test not found", 404)
        
        return resp(test, True, None, "Test updated successfully")
    except Exception as e:
        return resp(None, False, str(e), "Failed to update test", 500)

@router.delete("/{test_id}")
@limiter.limit("10/minute")
async def delete_test(
    request: Request,
    test_id: str, 
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """Delete a test (Admin only)"""
    try:
        # Check if user has admin privileges
        if not getattr(current_user, "is_admin", False):
            return resp(None, False, "Insufficient permissions", "Admin access required", 403)
        
        service = TestService(db)
        success = service.delete_test(test_id)
        if not success:
            return resp(None, False, "Test not found", "Test not found", 404)
        
        return resp(None, True, None, "Test deleted successfully")
    except Exception as e:
        return resp(None, False, str(e), "Failed to delete test", 500)

@router.get("/{test_id}/questions")
@limiter.limit("100/minute")
async def get_test_questions(
    request: Request,
    test_id: str, 
    db: Session = Depends(get_db)
):
    """Get all questions for a specific test"""
    try:
        service = TestService(db)
        test = service.get_test_by_test_id(test_id)
        if not test:
            return resp(None, False, "Test not found", "Test not found", 404)
        
        questions = service.get_test_questions(test_id)
        return resp(questions, True, None, "Test questions retrieved successfully")
    except Exception as e:
        return resp(None, False, str(e), "Failed to retrieve test questions", 500)
