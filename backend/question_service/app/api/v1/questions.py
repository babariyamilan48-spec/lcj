from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from core.database_dependencies_singleton import get_db
from core.app_factory import resp
from question_service.app.deps.auth import get_current_user
# Removed: from app.models.user import User
from question_service.app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse, QuestionListResponse
from question_service.app.services.question_service import QuestionService
from core.rate_limit import limiter
from core.cache import cache_async_result, QueryCache
from core.middleware.compression import compress_json_response, optimize_large_response
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
@limiter.limit("200/minute")  # Increased rate limit due to caching
async def get_questions(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    test_id: Optional[int] = None,
    section_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all questions with pagination and filtering - OPTIMIZED"""
    try:
        service = QuestionService(db)
        questions, total = service.get_questions(
            skip=skip, 
            limit=limit, 
            test_id=test_id,
            section_id=section_id,
            is_active=is_active
        )
        
        result = QuestionListResponse(
            questions=questions,
            total=total,
            page=skip // limit + 1,
            size=limit
        )
        
        # Optimize response for large datasets
        optimized_result = optimize_large_response(result.dict(), max_items=limit)
        
        # Use compressed response for large payloads
        if len(questions) > 50:
            return compress_json_response(
                {"success": True, "data": optimized_result, "error": None, "message": "Questions retrieved successfully"},
                request
            )
        
        return resp(optimized_result, True, None, "Questions retrieved successfully")
    except Exception as e:
        logger.error(f"Error retrieving questions: {str(e)}")
        return resp(None, False, str(e), "Failed to retrieve questions", 500)

@router.get("/{question_id}")
@limiter.limit("200/minute")  # Increased due to caching
async def get_question(
    request: Request,
    question_id: int,
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific question by ID - OPTIMIZED with caching"""
    try:
        service = QuestionService(db)
        question = service.get_question(question_id)
        if not question:
            return resp(None, False, "Question not found", "Question not found", 404)
        
        return resp(question, True, None, "Question retrieved successfully")
    except Exception as e:
        logger.error(f"Error retrieving question {question_id}: {str(e)}")
        return resp(None, False, str(e), "Failed to retrieve question", 500)

@router.post("/")
@limiter.limit("10/minute")
async def create_question(
    request: Request,
    question_data: QuestionCreate,
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new question (Admin only)"""
    try:
        # Check if user has admin privileges
        if not getattr(current_user, "is_admin", False):
            return resp(None, False, "Insufficient permissions", "Admin access required", 403)
        
        service = QuestionService(db)
        question = service.create_question(question_data)
        return resp(question, True, None, "Question created successfully", 201)
    except Exception as e:
        return resp(None, False, str(e), "Failed to create question", 500)

@router.put("/{question_id}")
@limiter.limit("10/minute")
async def update_question(
    request: Request,
    question_id: int,
    question_data: QuestionUpdate,
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a question (Admin only)"""
    try:
        # Check if user has admin privileges
        if not getattr(current_user, "is_admin", False):
            return resp(None, False, "Insufficient permissions", "Admin access required", 403)
        
        service = QuestionService(db)
        question = service.update_question(question_id, question_data)
        if not question:
            return resp(None, False, "Question not found", "Question not found", 404)
        
        return resp(question, True, None, "Question updated successfully")
    except Exception as e:
        return resp(None, False, str(e), "Failed to update question", 500)

@router.delete("/{question_id}")
@limiter.limit("10/minute")
async def delete_question(
    request: Request,
    question_id: int,
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a question (Admin only)"""
    try:
        # Check if user has admin privileges
        if not getattr(current_user, "is_admin", False):
            return resp(None, False, "Insufficient permissions", "Admin access required", 403)
        
        service = QuestionService(db)
        success = service.delete_question(question_id)
        if not success:
            return resp(None, False, "Question not found", "Question not found", 404)
        
        return resp(None, True, None, "Question deleted successfully")
    except Exception as e:
        return resp(None, False, str(e), "Failed to delete question", 500)
