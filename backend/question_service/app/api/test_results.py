from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from core.database_fixed import get_db, get_db_session
from ..deps.auth import get_current_user
from auth_service.app.models.user import User
from ..models.test_result import TestResult, TestResultDetail, TestResultConfiguration
from ..services.result_service import TestResultService
from ..schemas.test_result import (
    TestResultCreate, TestResultResponse, TestResultAnalytics, UserOverviewResponse,
    TestResultDetailResponse, TestResultConfigurationResponse,
    UserAnalyticsResponse, TestResultUpdate
)

router = APIRouter(prefix="/test-results", tags=["test-results"])

@router.post("/", response_model=TestResultResponse)
async def create_test_result(
    test_result: TestResultCreate,
    db: Session = Depends(get_db)
):
    """Create a new test result for a user"""
    try:
        print(f"=== SAVING TEST RESULT ===")
        print(f"User ID: {test_result.user_id}")
        print(f"Test ID: {test_result.test_id}")
        print(f"Calculated Result Keys: {list(test_result.calculated_result.keys()) if test_result.calculated_result else 'None'}")
        if test_result.test_id == 'mbti' and test_result.calculated_result:
            print(f"MBTI Code: {test_result.calculated_result.get('code', 'NOT_FOUND')}")
            print(f"MBTI Traits: {test_result.calculated_result.get('traits', 'NOT_FOUND')}")

        service = TestResultService(db)
        result = service.save_test_result(
            user_id=test_result.user_id,
            test_id=test_result.test_id,
            answers=test_result.answers,
            calculated_result=test_result.calculated_result,
            session_id=test_result.session_id,
            time_taken_seconds=test_result.time_taken_seconds
        )
        return result
    except Exception as e:
        # ✅ CRITICAL: Let FastAPI dependency handle rollback
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/calculate-and-save", response_model=TestResultResponse)
async def calculate_and_save_test_result(
    test_result_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculate test results automatically and save them"""
    try:
        service = TestResultService(db)
        result = service.calculate_and_save_test_result(
            user_id=str(current_user.id),  # Use authenticated user's ID
            test_id=test_result_data['test_id'],
            answers=test_result_data['answers'],
            session_id=test_result_data.get('session_id'),
            time_taken_seconds=test_result_data.get('time_taken_seconds')
        )

        return result
    except Exception as e:
        # ✅ CRITICAL: Let FastAPI dependency handle rollback
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/user/{user_id}", response_model=List[TestResultResponse])
async def get_user_test_results(
    user_id: str,
    test_id: Optional[str] = None,
    limit: Optional[int] = 10,
    db: Session = Depends(get_db)
):
    """Get all test results for a specific user"""
    service = TestResultService(db)
    return service.get_user_results(user_id, test_id)

@router.get("/{result_id}", response_model=TestResultResponse)
async def get_test_result(
    result_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific test result by ID"""
    result = db.query(TestResult).filter(TestResult.id == result_id).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test result not found"
        )

    return result

@router.put("/{result_id}", response_model=TestResultResponse)
async def update_test_result(
    result_id: int,
    test_result_update: TestResultUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing test result"""
    db_result = db.query(TestResult).filter(TestResult.id == result_id).first()

    if not db_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test result not found"
        )

    # Update fields
    update_data = test_result_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field != "details":  # Handle details separately
            setattr(db_result, field, value)

    if test_result_update.is_completed and not db_result.completed_at:
        db_result.completed_at = datetime.utcnow()

    # ✅ CRITICAL: Let FastAPI dependency handle commit
    # Do NOT call db.commit() or db.refresh() manually

    return db_result

@router.delete("/{result_id}")
async def delete_test_result(
    result_id: int,
    db: Session = Depends(get_db)
):
    """Delete a test result"""
    db_result = db.query(TestResult).filter(TestResult.id == result_id).first()

    if not db_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test result not found"
        )

    db.delete(db_result)
    # ✅ CRITICAL: Let FastAPI dependency handle commit
    # Do NOT call db.commit() manually

    return {"message": "Test result deleted successfully"}

@router.get("/user/{user_id}/latest/{test_id}", response_model=TestResultResponse)
async def get_latest_test_result(
    user_id: str,
    test_id: str,
    db: Session = Depends(get_db)
):
    """Get the latest test result for a user and test type"""
    service = TestResultService(db)
    result = service.get_latest_result(user_id, test_id)

    if not result:
        raise HTTPException(
            status_code=404,
            detail="No completed test result found for this user and test type"
        )

    return result

@router.get("/configurations/{test_id}", response_model=List[TestResultConfigurationResponse])
async def get_test_configurations(
    test_id: str,
    db: Session = Depends(get_db)
):
    """Get all result configurations for a specific test"""
    configurations = db.query(TestResultConfiguration).filter(
        TestResultConfiguration.test_id == test_id,
        TestResultConfiguration.is_active == True
    ).all()

    return configurations

@router.post("/configurations/", response_model=TestResultConfigurationResponse)
async def create_test_configuration(
    config_data: dict,
    db: Session = Depends(get_db)
):
    """Create a new test result configuration"""
    try:
        db_config = TestResultConfiguration(**config_data)
        db.add(db_config)
        # ✅ CRITICAL: Let FastAPI dependency handle commit
        # Do NOT call db.commit() or db.refresh() manually

        return db_config

    except Exception as e:
        # ✅ CRITICAL: Let FastAPI dependency handle rollback
        raise HTTPException(
            status_code=500,
            detail=f"Error creating configuration: {str(e)}"
        )

@router.get("/analytics/{user_id}", response_model=UserAnalyticsResponse)
async def get_user_analytics(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics for a user"""
    service = TestResultService(db)
    analytics = service.get_user_analytics(user_id)
    return analytics

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

        # Get pre-calculated results by test (latest for each test type)
        latest_results_by_test = CalculatedResultService.get_latest_results_by_test(db, user_id)

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
                        trait_name = dim.get('trait', '').title()
                        level = dim.get('level', '')
                        percentage = dim.get('percentage', 0)
                        if trait_name and level:
                            dynamic_traits.append(f"{trait_name}: {level} ({percentage}%)")
                        if dim.get('description'):
                            dynamic_strengths.append(dim.get('description'))

            elif result.test_id == 'intelligence':
                if 'topIntelligences' in calculated_result:
                    for intel in calculated_result.get('topIntelligences', []):
                        intel_type = intel.get('type', '').replace('_', ' ').title()
                        percentage = intel.get('percentage', 0)
                        if intel_type:
                            dynamic_traits.append(f"{intel_type} ({percentage}%)")
                        if intel.get('description'):
                            dynamic_strengths.append(intel.get('description'))
                elif 'allIntelligences' in calculated_result:
                    # Fallback to all intelligences
                    sorted_intel = sorted(
                        calculated_result.get('allIntelligences', []),
                        key=lambda x: x.get('percentage', 0),
                        reverse=True
                    )[:3]  # Top 3
                    for intel in sorted_intel:
                        intel_type = intel.get('type', '').replace('_', ' ').title()
                        percentage = intel.get('percentage', 0)
                        if intel_type:
                            dynamic_traits.append(f"{intel_type} ({percentage}%)")

            elif result.test_id == 'mbti':
                print(f"DEBUG MBTI - Calculated Result Keys: {list(calculated_result.keys()) if calculated_result else 'None'}")
                print(f"DEBUG MBTI - Traits in calculated_result: {calculated_result.get('traits', 'NOT_FOUND')}")
                print(f"DEBUG MBTI - Careers in calculated_result: {calculated_result.get('careers', 'NOT_FOUND')}")
                print(f"DEBUG MBTI - Strengths in calculated_result: {calculated_result.get('strengths', 'NOT_FOUND')}")
                print(f"DEBUG MBTI - Code in calculated_result: {calculated_result.get('code', 'NOT_FOUND')}")

                dynamic_traits = calculated_result.get('traits', [])
                dynamic_careers = calculated_result.get('careers', [])
                dynamic_strengths = calculated_result.get('strengths', [])

            elif result.test_id == 'riasec':
                if 'topInterests' in calculated_result:
                    for interest in calculated_result.get('topInterests', []):
                        interest_type = interest.get('type', '').title()
                        percentage = interest.get('percentage', 0)
                        if interest_type:
                            dynamic_traits.append(f"{interest_type} ({percentage}%)")

            elif result.test_id == 'decision':
                # Extract traits, careers, strengths from calculated result
                dynamic_traits = calculated_result.get('traits', [])
                dynamic_careers = calculated_result.get('careers', [])
                dynamic_strengths = calculated_result.get('strengths', [])
                dynamic_recommendations = calculated_result.get('recommendations', [])

                # Also add top styles as traits if available
                if 'topStyles' in calculated_result:
                    for style in calculated_result.get('topStyles', [])[:3]:  # Top 3 styles
                        style_name = style.get('type', '').replace('_', ' ').title()
                        percentage = style.get('percentage', 0)
                        if style_name:
                            dynamic_traits.append(f"{style_name} Decision Making ({percentage}%)")
                # Fallback to primary style (old format)
                elif 'primaryStyle' in calculated_result:
                    primary_style = calculated_result.get('primaryStyle', {})
                    if primary_style:
                        style_name = primary_style.get('type', '').replace('_', ' ').title()
                        percentage = primary_style.get('percentage', 0)
                        if style_name:
                            dynamic_traits.append(f"{style_name} Decision Making ({percentage}%)")

            elif result.test_id == 'vark':
                # Extract traits, careers, strengths from calculated result
                dynamic_traits = calculated_result.get('traits', [])
                dynamic_careers = calculated_result.get('careers', [])
                dynamic_strengths = calculated_result.get('strengths', [])
                dynamic_recommendations = calculated_result.get('recommendations', [])

                # Also add top styles as traits if available
                if 'topStyles' in calculated_result:
                    for style in calculated_result.get('topStyles', [])[:3]:  # Top 3 styles
                        style_name = style.get('type', '').title()
                        percentage = style.get('percentage', 0)
                        if style_name:
                            dynamic_traits.append(f"{style_name} Learning ({percentage}%)")
                # Fallback to primary style (old format)
                elif 'primaryStyle' in calculated_result:
                    primary_style = calculated_result.get('primaryStyle', {})
                    if primary_style:
                        style_name = primary_style.get('type', '').title()
                        percentage = primary_style.get('percentage', 0)
                        if style_name:
                            dynamic_traits.append(f"{style_name} Learning ({percentage}%)")

            elif result.test_id == 'svs':
                if 'coreValues' in calculated_result:
                    for value in calculated_result.get('coreValues', [])[:3]:  # Top 3 values
                        value_name = value.get('type', '').replace('_', ' ').title()
                        score = value.get('score', 0)
                        if value_name:
                            dynamic_traits.append(f"{value_name} (Score: {score})")

            # Get configuration data as fallback
            config = db.query(TestResultConfiguration).filter(
                TestResultConfiguration.test_id == result.test_id,
                TestResultConfiguration.result_code == result.primary_result,
                TestResultConfiguration.is_active == True
            ).first()

            # Determine final data (prefer calculated, fallback to config)
            final_traits = dynamic_traits if dynamic_traits else (config.traits if config else [])
            final_careers = dynamic_careers if dynamic_careers else (config.careers if config else [])
            final_strengths = dynamic_strengths if dynamic_strengths else (config.strengths if config else [])
            final_recommendations = dynamic_recommendations if dynamic_recommendations else (config.recommendations if config else [])

            # MBTI-specific fields from config (only for MBTI tests)
            final_characteristics = config.characteristics if config and result.test_id == 'mbti' else []
            final_challenges = config.challenges if config and result.test_id == 'mbti' else []
            final_career_suggestions = config.career_suggestions if config and result.test_id == 'mbti' else []

            # Build test summary
            test_summary = {
                "test_id": result.test_id,
                "test_name_gujarati": test_names_gujarati.get(result.test_id, result.test_id),
                "test_name_english": test_names_english.get(result.test_id, result.test_id),
                "primary_result": result.primary_result,
                "result_name_gujarati": config.result_name_gujarati if config else result.result_summary,
                "result_name_english": config.result_name_english if config else result.primary_result,
                "completion_date": result.completed_at.isoformat() if result.completed_at else None,
                "traits": final_traits,
                "careers": final_careers,
                "strengths": final_strengths,
                "recommendations": final_recommendations,
                # MBTI-specific fields (only included for MBTI tests)
                "characteristics": final_characteristics if result.test_id == 'mbti' else [],
                "challenges": final_challenges if result.test_id == 'mbti' else [],
                "career_suggestions": final_career_suggestions if result.test_id == 'mbti' else [],
                "description_gujarati": config.description_gujarati if config else "",
                "description_english": config.description_english if config else "",
                "score_details": calculated_result.get('dimensions', calculated_result.get('topIntelligences', [])),
                "data_source": "calculated" if dynamic_traits else "configuration"
            }

            summary_data.append(test_summary)

            # Collect aggregated data
            all_careers.extend(final_careers)
            all_strengths.extend(final_strengths)
            all_recommendations.extend(final_recommendations)

        # Calculate aggregated statistics
        from collections import Counter
        career_counts = Counter(all_careers)
        strength_counts = Counter(all_strengths)
        recommendation_counts = Counter(all_recommendations)

        # Get last activity date
        last_activity = None
        completed_dates = [r.completed_at for r in latest_results.values() if r.completed_at]
        if completed_dates:
            last_activity = max(completed_dates).isoformat()

        return {
            "user_id": user_id,
            "total_unique_tests": len(latest_results),
            "total_tests_completed": len(all_results),
            "latest_test_results": summary_data,
            "top_careers": [career for career, _ in career_counts.most_common(8)],
            "top_strengths": [strength for strength, _ in strength_counts.most_common(6)],
            "development_areas": [rec for rec, _ in recommendation_counts.most_common(5)],
            "last_activity": last_activity,
            "api_version": "2.0",
            "generated_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        print(f"Error in get_user_latest_summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user summary: {str(e)}"
        )
