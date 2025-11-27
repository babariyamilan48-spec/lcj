"""
Async API endpoints for handling background AI report generation and PDF creation.
These endpoints use Celery tasks to prevent blocking and handle multiple users efficiently.
"""

from fastapi import APIRouter, HTTPException, Response, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime
import logging
from datetime import datetime

# Import Celery tasks
from core.tasks.ai_report_tasks import (
    generate_ai_insights_task,
    generate_comprehensive_ai_insights_task,
    get_task_status
)
from core.tasks.pdf_generation_tasks import (
    generate_pdf_report_task,
    generate_comprehensive_pdf_task
)

# Import ResultService for one-time restriction check
from results_service.app.services.result_service import ResultService
from core.database_fixed import get_db, get_db_session

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response Models
class AsyncAIInsightRequest(BaseModel):
    test_type: str
    test_id: str
    answers: list
    results: Dict[str, Any]
    user_id: Optional[str] = None

class AsyncComprehensiveAIRequest(BaseModel):
    user_id: str
    all_test_results: Dict[str, Any]

class AsyncPDFRequest(BaseModel):
    user_id: str
    format: str = "pdf"
    include_ai_insights: bool = True
    test_id: Optional[str] = None

class AsyncComprehensivePDFRequest(BaseModel):
    user_id: str
    test_results: Dict[str, Any]
    ai_insights: Dict[str, Any]

class TaskResponse(BaseModel):
    task_id: str
    status: str
    message: str
    estimated_completion: Optional[str] = None
    # Redirect properties for one-time restriction
    redirect_to_history: Optional[bool] = None
    existing_result_id: Optional[str] = None

class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    ready: bool
    successful: Optional[bool] = None
    failed: Optional[bool] = None
    progress: Optional[Dict[str, Any]] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@router.post("/ai-insights/generate-async", response_model=TaskResponse)
async def generate_ai_insights_async(request: AsyncAIInsightRequest, db: Session = Depends(get_db)):
    """
    Start asynchronous AI insights generation.
    Returns immediately with task ID for status tracking.
    """
    try:
        logger.info(f"Starting async AI insights generation for test {request.test_id}")
        
        # Prepare test data
        test_data = {
            "test_type": request.test_type,
            "test_id": request.test_id,
            "answers": request.answers,
            "results": request.results,
            "user_id": request.user_id
        }
        
        # Start the Celery task
        task = generate_ai_insights_task.delay(test_data)
        
        logger.info(f"AI insights task started with ID: {task.id}")
        
        return TaskResponse(
            task_id=task.id,
            status="PENDING",
            message="AI insights generation started. Use the task ID to check progress.",
            estimated_completion="2-5 minutes"
        )
        
    except Exception as e:
        logger.error(f"Error starting async AI insights generation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start AI insights generation: {str(e)}"
        )

@router.post("/ai-insights/comprehensive-async", response_model=TaskResponse)
async def generate_comprehensive_ai_insights_async(request: AsyncComprehensiveAIRequest, db: Session = Depends(get_db)):
    """
    Start asynchronous comprehensive AI insights generation.
    Returns immediately with task ID for status tracking.
    One-time generation per user - checks for existing insights first.
    """
    try:
        # Check if user already has comprehensive AI insights (one-time restriction)
        existing_ai_result = await ResultService.get_user_ai_insights(request.user_id)
        if existing_ai_result:
            logger.info(f"User {request.user_id} already has comprehensive AI insights. Returning redirect response.")
            return TaskResponse(
                task_id="redirect",
                status="REDIRECT",
                message="આપે પહેલેથી જ AI વિશ્લેષણ બનાવ્યું છે. કૃપા કરીને ટેસ્ટ હિસ્ટરીમાં જુઓ.",
                estimated_completion="immediate",
                redirect_to_history=True,
                existing_result_id=str(existing_ai_result.get("id"))
            )
        
        logger.info(f"Starting async comprehensive AI insights generation for user {request.user_id}")
        
        # Start the Celery task
        task = generate_comprehensive_ai_insights_task.delay(request.dict())
        
        logger.info(f"Comprehensive AI insights task started with ID: {task.id}")
        
        return TaskResponse(
            task_id=task.id,
            status="PENDING",
            message="Comprehensive AI insights generation started. Use the task ID to check progress.",
            estimated_completion="3-8 minutes"
        )
        
    except Exception as e:
        logger.error(f"Error starting async comprehensive AI insights generation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start comprehensive AI insights generation: {str(e)}"
        )

@router.post("/pdf/generate-async", response_model=TaskResponse)
async def generate_pdf_async(request: AsyncPDFRequest, db: Session = Depends(get_db)):
    """
    Start asynchronous PDF report generation.
    Returns immediately with task ID for status tracking.
    """
    try:
        logger.info(f"Starting async PDF generation for user {request.user_id}")
        
        # Start the Celery task
        task = generate_pdf_report_task.delay(
            user_id=request.user_id,
            report_format=request.format,
            include_ai_insights=request.include_ai_insights,
            test_id=request.test_id
        )
        
        logger.info(f"PDF generation task started with ID: {task.id}")
        
        return TaskResponse(
            task_id=task.id,
            status="PENDING",
            message=f"{request.format.upper()} report generation started. Use the task ID to check progress.",
            estimated_completion="1-3 minutes"
        )
        
    except Exception as e:
        logger.error(f"Error starting async PDF generation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start PDF generation: {str(e)}"
        )

@router.post("/pdf/comprehensive-async", response_model=TaskResponse)
async def generate_comprehensive_pdf_async(request: AsyncComprehensivePDFRequest, db: Session = Depends(get_db)):
    """
    Start asynchronous comprehensive PDF generation with AI insights.
    Returns immediately with task ID for status tracking.
    """
    try:
        logger.info(f"Starting async comprehensive PDF generation for user {request.user_id}")
        
        # Start the Celery task
        task = generate_comprehensive_pdf_task.delay(
            user_id=request.user_id,
            test_results=request.test_results,
            ai_insights=request.ai_insights
        )
        
        logger.info(f"Comprehensive PDF generation task started with ID: {task.id}")
        
        return TaskResponse(
            task_id=task.id,
            status="PENDING",
            message="Comprehensive PDF generation started. Use the task ID to check progress.",
            estimated_completion="2-4 minutes"
        )
        
    except Exception as e:
        logger.error(f"Error starting async comprehensive PDF generation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start comprehensive PDF generation: {str(e)}"
        )

@router.get("/task-status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status_endpoint(task_id: str, http_response: Response):
    """
    ⚡ Get the status of a running or completed task (NO database dependency).
    """
    try:
        # Import here to avoid circular imports
        from celery.result import AsyncResult
        from core.celery_app import celery_app
        
        # Get task result - no database needed
        task_result = AsyncResult(task_id, app=celery_app)
        
        # Quick status check without retries (Redis is fast)
        response = TaskStatusResponse(
            task_id=task_id,
            status=task_result.status,
            ready=task_result.ready(),
            successful=task_result.successful() if task_result.ready() else None,
            failed=task_result.failed() if task_result.ready() else None
        )
        
        if task_result.ready():
            if task_result.successful():
                response.result = task_result.result
                response.progress = {
                    "status": "Task completed successfully",
                    "progress": 100
                }
            else:
                response.error = str(task_result.info)
        else:
            # Task is still running, get progress info
            task_info = getattr(task_result, 'info', None)
            if task_info is not None and isinstance(task_info, dict):
                response.progress = task_info
            else:
                response.progress = {"status": "Processing...", "progress": 0}
        
        # Add cache-busting headers
        http_response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        http_response.headers["Pragma"] = "no-cache"
        http_response.headers["Expires"] = "0"
        
        return response
        
    except Exception as e:
        logger.error(f"Error getting task status for {task_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get task status: {str(e)}"
        )

@router.get("/task-result/{task_id}")
async def get_task_result(task_id: str):
    """
    Get the result of a completed task.
    Returns the actual result data or error information.
    """
    try:
        logger.info(f"Getting result for task {task_id}")
        
        # Import here to avoid circular imports
        from celery.result import AsyncResult
        from core.celery_app import celery_app
        
        # Get task result
        task_result = AsyncResult(task_id, app=celery_app)
        
        if not task_result.ready():
            raise HTTPException(
                status_code=202,
                detail="Task is still processing. Check task status first."
            )
        
        if task_result.failed():
            raise HTTPException(
                status_code=500,
                detail=f"Task failed: {str(task_result.info)}"
            )
        
        result = task_result.result
        logger.info(f"Task {task_id} completed successfully")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting task result for {task_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get task result: {str(e)}"
        )

@router.delete("/task/{task_id}")
async def cancel_task(task_id: str):
    """
    Cancel a running task.
    """
    try:
        logger.info(f"Cancelling task {task_id}")
        
        # Import here to avoid circular imports
        from core.celery_app import celery_app
        
        # Revoke the task
        celery_app.control.revoke(task_id, terminate=True)
        
        logger.info(f"Task {task_id} cancelled successfully")
        
        return {
            "message": f"Task {task_id} has been cancelled",
            "task_id": task_id,
            "cancelled_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error cancelling task {task_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cancel task: {str(e)}"
        )

@router.get("/health")
async def async_health_check():
    """
    Health check endpoint for async services.
    """
    try:
        # Import here to avoid circular imports
        from core.celery_app import celery_app, health_check
        
        # Test Celery connection
        task = health_check.delay()
        result = task.get(timeout=10)  # Wait up to 10 seconds
        
        return {
            "status": "healthy",
            "service": "async-results",
            "celery_status": "connected",
            "redis_status": "connected",
            "test_task_result": result
        }
        
    except Exception as e:
        logger.error(f"Async health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "service": "async-results",
            "error": str(e)
        }
