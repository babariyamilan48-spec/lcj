from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from core.database_fixed import get_db, get_db_session
from ..models.calculated_result import CalculatedTestResult
from ..services.calculated_result_service import CalculatedResultService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/calculated-results", tags=["calculated-results"])


@router.get("/user/{user_id}/latest/{test_id}", response_model=Dict[str, Any])
async def get_latest_calculated_result(
    user_id: str,
    test_id: str,
    db: Session = Depends(get_db)
):
    """
    Get the latest pre-calculated result for a user and test.
    Used for quick retrieval without recalculation.
    
    Args:
        user_id: User UUID
        test_id: Test identifier
    
    Returns:
        Pre-calculated result data or 404 if not found
    """
    try:
        result = CalculatedResultService.get_latest_calculated_result(
            db=db,
            user_id=user_id,
            test_id=test_id
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No calculated result found for user {user_id} and test {test_id}"
            )
        
        return {
            "id": result.id,
            "user_id": str(result.user_id),
            "test_id": result.test_id,
            "test_result_id": result.test_result_id,
            "calculated_result": result.calculated_result,
            "primary_result": result.primary_result,
            "result_summary": result.result_summary,
            "traits": result.traits,
            "careers": result.careers,
            "strengths": result.strengths,
            "recommendations": result.recommendations,
            "dimensions_scores": result.dimensions_scores,
            "created_at": result.created_at.isoformat() if result.created_at else None,
            "updated_at": result.updated_at.isoformat() if result.updated_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching calculated result: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching calculated result: {str(e)}"
        )


@router.get("/user/{user_id}", response_model=List[Dict[str, Any]])
async def get_user_calculated_results(
    user_id: str,
    test_id: Optional[str] = None,
    limit: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get all pre-calculated results for a user, optionally filtered by test.
    Used for test history display.
    
    Args:
        user_id: User UUID
        test_id: Optional test filter
        limit: Optional limit on results
    
    Returns:
        List of pre-calculated results
    """
    try:
        results = CalculatedResultService.get_user_calculated_results(
            db=db,
            user_id=user_id,
            test_id=test_id,
            limit=limit
        )
        
        return [
            {
                "id": result.id,
                "user_id": str(result.user_id),
                "test_id": result.test_id,
                "test_result_id": result.test_result_id,
                "calculated_result": result.calculated_result,
                "primary_result": result.primary_result,
                "result_summary": result.result_summary,
                "traits": result.traits,
                "careers": result.careers,
                "strengths": result.strengths,
                "recommendations": result.recommendations,
                "dimensions_scores": result.dimensions_scores,
                "created_at": result.created_at.isoformat() if result.created_at else None,
                "updated_at": result.updated_at.isoformat() if result.updated_at else None
            }
            for result in results
        ]
        
    except Exception as e:
        logger.error(f"Error fetching user calculated results: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching calculated results: {str(e)}"
        )


@router.get("/user/{user_id}/by-test", response_model=Dict[str, Dict[str, Any]])
async def get_latest_results_by_test(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Get the latest calculated result for each test type for a user.
    Useful for test history display with one result per test.
    
    Args:
        user_id: User UUID
    
    Returns:
        Dict mapping test_id to latest calculated result
    """
    try:
        results_by_test = CalculatedResultService.get_latest_results_by_test(
            db=db,
            user_id=user_id
        )
        
        return {
            test_id: {
                "id": result.id,
                "user_id": str(result.user_id),
                "test_id": result.test_id,
                "test_result_id": result.test_result_id,
                "calculated_result": result.calculated_result,
                "primary_result": result.primary_result,
                "result_summary": result.result_summary,
                "traits": result.traits,
                "careers": result.careers,
                "strengths": result.strengths,
                "recommendations": result.recommendations,
                "dimensions_scores": result.dimensions_scores,
                "created_at": result.created_at.isoformat() if result.created_at else None,
                "updated_at": result.updated_at.isoformat() if result.updated_at else None
            }
            for test_id, result in results_by_test.items()
        }
        
    except Exception as e:
        logger.error(f"Error fetching latest results by test: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching results by test: {str(e)}"
        )


@router.get("/{result_id}", response_model=Dict[str, Any])
async def get_calculated_result(
    result_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific calculated result by ID.
    
    Args:
        result_id: CalculatedTestResult ID
    
    Returns:
        Pre-calculated result data or 404 if not found
    """
    try:
        result = db.query(CalculatedTestResult).filter(
            CalculatedTestResult.id == result_id,
            CalculatedTestResult.is_valid == True
        ).first()
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Calculated result {result_id} not found"
            )
        
        return {
            "id": result.id,
            "user_id": str(result.user_id),
            "test_id": result.test_id,
            "test_result_id": result.test_result_id,
            "calculated_result": result.calculated_result,
            "primary_result": result.primary_result,
            "result_summary": result.result_summary,
            "traits": result.traits,
            "careers": result.careers,
            "strengths": result.strengths,
            "recommendations": result.recommendations,
            "dimensions_scores": result.dimensions_scores,
            "created_at": result.created_at.isoformat() if result.created_at else None,
            "updated_at": result.updated_at.isoformat() if result.updated_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching calculated result: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching calculated result: {str(e)}"
        )
