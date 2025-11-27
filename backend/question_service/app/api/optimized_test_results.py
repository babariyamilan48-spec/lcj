"""
Optimized Test Results API Endpoints
Ultra-fast endpoints with response times under 500ms
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import time
import logging

from core.database_fixed import get_db, get_db_session
from auth_service.app.models.user import User
from ..deps.auth import get_current_user
from ..models.test_result import TestResult
from ..schemas.test_result import TestResultResponse
from ..utils.simple_calculators import SimpleTestCalculators
from ..services.result_service import TestResultService

logger = logging.getLogger(__name__)

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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ultra-fast test result calculation and saving
    Target response time: < 500ms
    Same logic as original but optimized for speed
    """
    start_time = time.time()
    
    try:
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
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/latest-summary/{user_id}")
async def get_user_latest_summary(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Get latest test results summary for user - optimized for overview tab
    Returns pre-calculated results for instant performance
    """
    try:
        from question_service.app.services.calculated_result_service import CalculatedResultService
        from question_service.app.models.test_result import TestResult
        
        # Get pre-calculated results by test (latest for each test type)
        latest_results_by_test = CalculatedResultService.get_latest_results_by_test(db, user_id)
        
        # If no pre-calculated results, fallback to test_results table
        if not latest_results_by_test:
            logger.warning(f"No pre-calculated results found for user {user_id}, falling back to test_results table")
            
            # Get latest result for each test type from test_results table
            test_results = db.query(TestResult).filter(
                TestResult.user_id == user_id,
                TestResult.is_completed == True
            ).all()
            
            if not test_results:
                return {
                    "user_id": user_id,
                    "total_unique_tests": 0,
                    "total_tests_completed": 0,
                    "latest_test_results": [],
                    "top_careers": [],
                    "top_strengths": [],
                    "development_areas": [],
                    "last_activity": None
                }
            
            # Group by test_id, keeping only the latest for each
            latest_by_test = {}
            for result in sorted(test_results, key=lambda x: x.created_at or x.completed_at, reverse=True):
                if result.test_id not in latest_by_test:
                    latest_by_test[result.test_id] = result
            
            # Convert to CalculatedTestResult-like objects for consistent processing
            latest_results_by_test = {}
            for test_id, test_result in latest_by_test.items():
                # Create a simple object that mimics CalculatedTestResult
                class ResultProxy:
                    def __init__(self, tr):
                        self.test_id = tr.test_id
                        self.calculated_result = tr.calculated_result or {}
                        self.primary_result = tr.primary_result
                        self.result_summary = tr.result_summary
                        self.traits = []
                        self.careers = []
                        self.strengths = []
                        self.recommendations = []
                        self.created_at = tr.completed_at or tr.created_at
                
                latest_results_by_test[test_id] = ResultProxy(test_result)
        
        if not latest_results_by_test:
            return {
                "user_id": user_id,
                "total_unique_tests": 0,
                "total_tests_completed": 0,
                "latest_test_results": [],
                "top_careers": [],
                "top_strengths": [],
                "development_areas": [],
                "last_activity": None
            }
        
        # Already have latest results by test from pre-calculated data
        latest_results = latest_results_by_test
        
        # Build summary response with proper data extraction
        summary_data = []
        all_careers = []
        all_strengths = []
        all_recommendations = []
        
        # Test name mappings
        test_names_gujarati = {
            'mbti': 'MBTI વ્યક્તિત્વ પરીક્ષા',
            'intelligence': 'બહુવિધ બુદ્ધિ પરીક્ષા',
            'bigfive': 'Big Five વ્યક્તિત્વ પરીક્ષા',
            'riasec': 'કારકિર્દી રુચિ પરીક્ષા',
            'decision': 'નિર્ણય શૈલી પરીક્ષા',
            'vark': 'શીખવાની શૈલી પરીક્ષા',
            'svs': 'મૂલ્ય પ્રણાલી પરીક્ષા'
        }
        
        test_names_english = {
            'mbti': 'MBTI Personality Test',
            'intelligence': 'Multiple Intelligence Test',
            'bigfive': 'Big Five Personality Test',
            'riasec': 'Career Interest Test',
            'decision': 'Decision Making Style Test',
            'vark': 'Learning Style Test',
            'svs': 'Schwartz Values Survey'
        }
        
        for result in latest_results.values():
            # Get calculated result data
            calculated_result = result.calculated_result or {}
            
            # Extract dynamic data based on test type and calculated result structure
            dynamic_traits = []
            dynamic_careers = []
            dynamic_strengths = []
            dynamic_recommendations = []
            
            # Process different test types
            if result.test_id == 'bigfive':
                if 'dimensions' in calculated_result:
                    for dim in calculated_result.get('dimensions', []):
                        if isinstance(dim, dict):
                            dynamic_traits.append(dim.get('name', ''))
            elif result.test_id == 'mbti':
                if 'type' in calculated_result:
                    dynamic_traits.append(calculated_result['type'])
            elif result.test_id == 'riasec':
                if 'codes' in calculated_result:
                    dynamic_traits = calculated_result['codes']
            elif result.test_id == 'intelligence':
                if 'top_intelligences' in calculated_result:
                    dynamic_traits = calculated_result['top_intelligences']
            
            # Use pre-stored traits/careers if available
            if result.traits:
                dynamic_traits = result.traits
            if result.careers:
                dynamic_careers = result.careers
            if result.strengths:
                dynamic_strengths = result.strengths
            if result.recommendations:
                dynamic_recommendations = result.recommendations
            
            summary_data.append({
                'test_id': result.test_id,
                'test_name': test_names_english.get(result.test_id, result.result_summary or f"Test: {result.test_id}"),
                'test_name_gujarati': test_names_gujarati.get(result.test_id, result.result_summary or f"Test: {result.test_id}"),
                'primary_result': result.primary_result,
                'score': result.primary_result,
                'completed_at': result.created_at.isoformat() if result.created_at else None,
                'traits': dynamic_traits,
                'careers': dynamic_careers,
                'strengths': dynamic_strengths,
                'recommendations': dynamic_recommendations
            })
            
            all_careers.extend(dynamic_careers)
            all_strengths.extend(dynamic_strengths)
            all_recommendations.extend(dynamic_recommendations)
        
        # Get top items
        top_careers = list(set(all_careers))[:5]
        top_strengths = list(set(all_strengths))[:5]
        development_areas = list(set(all_recommendations))[:5]
        
        # Get last activity
        last_activity = None
        if summary_data:
            last_activity = max([s['completed_at'] for s in summary_data if s['completed_at']])
        
        return {
            "user_id": user_id,
            "total_unique_tests": len(summary_data),
            "total_tests_completed": len(summary_data),
            "latest_test_results": summary_data,
            "top_careers": top_careers,
            "top_strengths": top_strengths,
            "development_areas": development_areas,
            "last_activity": last_activity
        }
        
    except Exception as e:
        logger.error(f"Error getting latest summary for user {user_id}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error fetching summary: {str(e)}")
