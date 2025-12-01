"""
Test Completion Status API

New robust API endpoints for managing test completion status with proper error handling,
caching, and UUID validation.
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging

from core.rate_limit import limiter
from core.cache import cache_async_result
from core.database_fixed import get_db, get_db_session
from results_service.app.services.completion_status_service import CompletionStatusService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/completion-status", tags=["completion-status"])


@router.get("/{user_id}")
@limiter.limit("100/minute")
@cache_async_result(ttl=300)  # 5-minute cache
async def get_completion_status(request: Request, user_id: str, force_refresh: bool = False, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    ⚡ ULTRA-OPTIMIZED: Get test completion status for a user - Target: <50ms
    
    Optimizations:
    - Single aggregation query with COUNT and GROUP BY
    - Database-level filtering
    - Minimal response fields: completed_tests, total_tests, completion_percentage
    - 5-minute caching
    - ✅ CRITICAL: Explicit session cleanup to prevent connection leaks
    """
    try:
        from sqlalchemy import func
        from question_service.app.models.test_result import TestResult
        import uuid
        
        # Validate user ID
        try:
            user_uuid = uuid.UUID(user_id)
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        # If force_refresh, skip cache (handled by decorator)
        
        # ⚡ OPTIMIZED: Get completed test IDs
        completed_results = db.query(
            func.distinct(TestResult.test_id)
        ).filter(
            TestResult.user_id == user_uuid,
            TestResult.is_completed == True
        ).all()
        
        completed_test_ids = [r[0] for r in completed_results if r[0]]
        completed_count = len(completed_test_ids)
        
        # Total tests (7 standard tests)
        total_tests = 7
        completion_percentage = round((completed_count / total_tests) * 100, 1) if total_tests > 0 else 0
        
        response = {
            "success": True,
            "data": {
                "completed_tests": completed_test_ids,  # Return array of test IDs
                "total_tests": total_tests,
                "completion_percentage": completion_percentage
            },
            "message": "Completion status retrieved successfully"
        }
        
        # ✅ CRITICAL FIX: Explicitly close session to prevent connection leaks
        if db and db.is_active:
            try:
                db.close()
            except:
                pass
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting completion status for user {user_id}: {e}")
        # ✅ CRITICAL FIX: Explicitly close session on error
        if db and db.is_active:
            try:
                db.close()
            except:
                pass
        raise HTTPException(status_code=500, detail="Failed to retrieve completion status")


@router.get("/{user_id}/progress")
@limiter.limit("100/minute")
async def get_progress_summary(request: Request, user_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get test progress summary for dashboard display
    
    Args:
        user_id: User ID (UUID string)
        
    Returns:
        Progress summary with percentage and next steps
    """
    try:
        logger.info(f"Getting progress summary for user: {user_id}")
        
        summary = await CompletionStatusService.get_test_progress_summary(user_id)
        
        return {
            "success": True,
            "data": summary,
            "message": "Progress summary retrieved successfully"
        }
        
    except ValueError as e:
        logger.error(f"Invalid user ID: {user_id}, error: {e}")
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid user ID format: {user_id}"
        )
    except Exception as e:
        logger.error(f"Error getting progress summary for user {user_id}: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to retrieve progress summary"
        )


@router.get("/{user_id}/completed-tests")
@limiter.limit("100/minute")
async def get_completed_tests(request: Request, user_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get list of completed tests for a user
    
    Args:
        user_id: User ID (UUID string)
        
    Returns:
        List of completed test IDs
    """
    try:
        logger.info(f"Getting completed tests for user: {user_id}")
        
        completed_tests = await CompletionStatusService.get_user_completed_tests(user_id)
        
        return {
            "success": True,
            "data": {
                "user_id": user_id,
                "completed_tests": completed_tests,
                "count": len(completed_tests)
            },
            "message": f"Found {len(completed_tests)} completed tests"
        }
        
    except ValueError as e:
        logger.error(f"Invalid user ID: {user_id}, error: {e}")
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid user ID format: {user_id}"
        )
    except Exception as e:
        logger.error(f"Error getting completed tests for user {user_id}: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to retrieve completed tests"
        )


@router.post("/{user_id}/mark-completed/{test_id}")
@limiter.limit("50/minute")
async def mark_test_completed(request: Request, user_id: str, test_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Mark a test as completed and invalidate cache
    
    Args:
        user_id: User ID (UUID string)
        test_id: Test ID that was completed
        
    Returns:
        Success confirmation
    """
    try:
        logger.info(f"Marking test {test_id} as completed for user: {user_id}")
        
        await CompletionStatusService.mark_test_completed(user_id, test_id)
        
        return {
            "success": True,
            "data": {
                "user_id": user_id,
                "test_id": test_id,
                "marked_at": "now"
            },
            "message": f"Test {test_id} marked as completed"
        }
        
    except ValueError as e:
        logger.error(f"Invalid user ID: {user_id}, error: {e}")
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid user ID format: {user_id}"
        )
    except Exception as e:
        logger.error(f"Error marking test completed for user {user_id}, test {test_id}: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to mark test as completed"
        )


@router.delete("/{user_id}/cache")
@limiter.limit("20/minute")
async def clear_completion_cache(request: Request, user_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Clear completion status cache for a user (for testing/debugging)
    
    Args:
        user_id: User ID (UUID string)
        
    Returns:
        Cache clear confirmation
    """
    try:
        logger.info(f"Clearing completion status cache for user: {user_id}")
        
        await CompletionStatusService.invalidate_user_cache(user_id)
        
        return {
            "success": True,
            "data": {
                "user_id": user_id,
                "cache_cleared": True
            },
            "message": "Completion status cache cleared successfully"
        }
        
    except ValueError as e:
        logger.error(f"Invalid user ID: {user_id}, error: {e}")
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid user ID format: {user_id}"
        )
    except Exception as e:
        logger.error(f"Error clearing cache for user {user_id}: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to clear completion status cache"
        )


@router.get("/debug/{user_id}")
async def debug_user_database(request: Request, user_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Debug endpoint to check what's actually in the database for a user
    """
    try:
        import uuid
        from core.database_fixed import get_db_session
        from question_service.app.models.test_result import TestResult as DBTestResult
        from sqlalchemy import and_
        
        logger.info(f"Debug: Checking database for user {user_id}")
        
        # Validate user ID
        try:
            user_uuid = uuid.UUID(user_id)
        except (ValueError, TypeError) as e:
            raise HTTPException(status_code=400, detail=f"Invalid user_id format: {user_id}")
        
        # Get database session
        with get_db_session() as db:
            # Get ALL results for this user
            all_results = db.query(DBTestResult).filter(
                DBTestResult.user_id == user_uuid
            ).all()
            
            # Get only completed results
            completed_results = db.query(DBTestResult).filter(
                and_(
                    DBTestResult.user_id == user_uuid,
                    DBTestResult.is_completed == True
                )
            ).all()
            
            debug_info = {
                "user_id": user_id,
                "user_uuid": str(user_uuid),
                "database_results": {
                    "total_results": len(all_results),
                    "completed_results": len(completed_results),
                    "all_results_details": [
                        {
                            "id": result.id,
                            "test_id": result.test_id,
                            "is_completed": result.is_completed,
                            "user_id": str(result.user_id),
                            "created_at": result.created_at.isoformat() if result.created_at else None,
                            "completed_at": result.completed_at.isoformat() if result.completed_at else None
                        } for result in all_results
                    ],
                    "completed_test_ids": [result.test_id for result in completed_results if result.test_id]
                }
            }
            
            return {
                "success": True,
                "data": debug_info,
                "message": "Database debug info retrieved"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Debug endpoint error for user {user_id}: {e}")
        import traceback
        logger.error(f"Debug traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"Debug failed: {str(e)}"
        )


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint for completion status service
    
    Returns:
        Service health status
    """
    try:
        # Test basic functionality
        required_tests = CompletionStatusService.REQUIRED_TESTS
        
        return {
            "success": True,
            "data": {
                "service": "completion-status",
                "status": "healthy",
                "required_tests_count": len(required_tests),
                "required_tests": required_tests
            },
            "message": "Completion status service is healthy"
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Completion status service is unhealthy"
        )
