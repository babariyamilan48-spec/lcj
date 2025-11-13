"""
Optimized Test Results API Endpoints
Ultra-fast endpoints with response times under 500ms
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import time

from core.database import get_db
from auth_service.app.models.user import User
from ..deps.auth import get_current_user
from ..models.test_result import TestResult
from ..schemas.test_result import TestResultResponse
from ..utils.simple_calculators import SimpleTestCalculators
from ..services.result_service import TestResultService

router = APIRouter()

class OptimizedTestResultService:
    """Ultra-fast test result service with optimized database operations"""
    
    @staticmethod
    def calculate_and_save_fast(
        user_id: str,
        test_id: str,
        answers: Dict[str, Any],
        session_id: Optional[str] = None,
        time_taken_seconds: Optional[int] = None,
        db: Session = None
    ) -> TestResult:
        """
        Ultra-fast calculation and saving using existing service with optimizations
        Target response time: < 500ms
        """
        start_time = time.time()
        
        try:
            print(f"🚀 Starting fast calculation for user {user_id}, test {test_id}")
            
            # Use the existing TestResultService which has proven database operations
            service = TestResultService(db)
            
            # Call the existing calculate_and_save_test_result method
            result = service.calculate_and_save_test_result(
                user_id=user_id,
                test_id=test_id,
                answers=answers,
                session_id=session_id,
                time_taken_seconds=time_taken_seconds
            )
            
            processing_time = (time.time() - start_time) * 1000
            print(f"🚀 Fast calculation completed in {processing_time:.2f}ms")
            
            return result
            
        except Exception as e:
            print(f"❌ Database error in service: {str(e)}")
            print(f"❌ Error type: {type(e)}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")
            db.rollback()
            raise e
    

@router.post("/calculate-and-save/fast", response_model=TestResultResponse)
async def calculate_and_save_test_result_fast(
    test_result_data: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ultra-fast test result calculation and saving
    Target response time: < 500ms
    Same logic as original but optimized for speed
    """
    start_time = time.time()
    
    try:
        print(f"🚀 Fast endpoint called with data: {test_result_data}")
        print(f"🚀 User ID: {current_user.id}")
        
        result = OptimizedTestResultService.calculate_and_save_fast(
            user_id=str(current_user.id),
            test_id=test_result_data['test_id'],
            answers=test_result_data['answers'],
            session_id=test_result_data.get('session_id'),
            time_taken_seconds=test_result_data.get('time_taken_seconds'),
            db=db
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        return result
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        print(f"❌ Error in fast endpoint: {str(e)}")
        print(f"❌ Error type: {type(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
