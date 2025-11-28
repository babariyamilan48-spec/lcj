from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from core.database_fixed import get_db, get_db_session
from results_service.app.services.result_service import ResultService
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/comprehensive-report/{user_id}")
async def get_comprehensive_report(user_id: str, db: Session = Depends(get_db)):
    """
    Generate a comprehensive report combining all test results for a user
    This endpoint provides data for the "Download All" functionality
    Queries test_results table directly for calculated_result column
    """
    try:
        logger.info(f"🔍 Generating comprehensive report for user {user_id}")
        
        import uuid
        from question_service.app.models.test_result import TestResult as DBTestResult
        
        # Convert user_id to UUID
        try:
            user_uuid = uuid.UUID(user_id)
        except (ValueError, TypeError):
            logger.error(f"Invalid user_id format: {user_id}")
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        # ✅ FIXED: Query test_results table directly for calculated_result column
        logger.info(f"🔍 Querying test_results table for user {user_uuid}")
        db_results = db.query(DBTestResult).filter(
            DBTestResult.user_id == user_uuid
        ).order_by(DBTestResult.created_at.desc()).all()
        
        logger.info(f"✅ Found {len(db_results)} test results for user {user_id}")
        
        # Organize results by test type (latest for each)
        all_results = {}
        for db_result in db_results:
            test_id = db_result.test_id
            if test_id not in all_results:  # Keep only latest for each test type
                calculated_result = db_result.calculated_result or {}
                logger.info(f"✅ Processing test {test_id}: {db_result.result_summary}")
                all_results[test_id] = {
                    'test_id': test_id,
                    'test_name': db_result.result_summary or f"Test: {test_id}",
                    'analysis': calculated_result,
                    'primary_result': db_result.primary_result,
                    'traits': calculated_result.get('traits', []),
                    'careers': calculated_result.get('careers', []),
                    'strengths': calculated_result.get('strengths', []),
                    'recommendations': calculated_result.get('recommendations', []),
                    'dimensions_scores': calculated_result.get('dimensions_scores', {}),
                    'created_at': db_result.created_at.isoformat() if db_result.created_at else None,
                    'updated_at': db_result.updated_at.isoformat() if db_result.updated_at else None,
                }
        
        if not all_results:
            logger.warning(f"⚠️ No test results found for user {user_id}")
            all_results = {}
        
        # Get AI insights
        ai_insights = None
        try:
            ai_insights = await ResultService.get_user_ai_insights(user_id)
        except Exception as ai_error:
            logger.warning(f"Could not fetch AI insights for comprehensive report: {ai_error}")
        
        # Get user analytics for summary stats
        analytics = await ResultService.get_user_analytics(user_id)
        stats = analytics.get('stats', {})
        
        # Prepare comprehensive report data
        report_data = {
            "user_id": user_id,
            "generated_at": datetime.utcnow().isoformat(),
            "report_type": "comprehensive_all_tests",
            
            # Summary statistics
            "summary": {
                "total_tests_completed": stats.get('total_tests', 0),
                "average_score": stats.get('average_score', 0),
                "achievements": stats.get('achievements', 0),
                "report_generation_date": datetime.utcnow().strftime("%B %d, %Y")
            },
            
            # All test results organized by type
            "test_results": all_results,
            
            # AI insights (if available)
            "ai_insights": ai_insights,
            
            # Test categories for organization
            "test_categories": {
                "personality": ["mbti", "bigfive"],
                "intelligence": ["intelligence"],
                "career": ["riasec"],
                "learning": ["vark"],
                "decision_making": ["decision"],
                "life_situation": ["life-situation"],
                "ai_analysis": ["comprehensive-ai-insights"]
            },
            
            # Metadata for report generation
            "metadata": {
                "report_version": "1.0",
                "includes_ai_insights": ai_insights is not None,
                "total_sections": len(all_results) + (1 if ai_insights else 0),
                "generation_timestamp": datetime.utcnow().isoformat()
            }
        }
        
        logger.info(f"Comprehensive report generated successfully for user {user_id}")
        logger.info(f"Report includes {len(all_results)} test results and {'AI insights' if ai_insights else 'no AI insights'}")
        
        # Ensure all data is JSON serializable
        def ensure_json_serializable(obj):
            if isinstance(obj, dict):
                return {k: ensure_json_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [ensure_json_serializable(item) for item in obj]
            elif hasattr(obj, 'isoformat'):  # datetime objects
                return obj.isoformat()
            elif hasattr(obj, 'hex'):  # UUID objects
                return str(obj)
            else:
                return obj
        
        serializable_data = ensure_json_serializable(report_data)
        return JSONResponse(content=serializable_data)
        
    except Exception as e:
        logger.error(f"Error generating comprehensive report for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate comprehensive report: {str(e)}"
        )

@router.get("/comprehensive-report/{user_id}/preview")
async def get_comprehensive_report_preview(user_id: str):
    """
    Get a preview of what will be included in the comprehensive report
    """
    try:
        # Get basic counts and info
        all_results = await ResultService.get_all_test_results(user_id)
        analytics = await ResultService.get_user_analytics(user_id)
        
        # Check for AI insights
        has_ai_insights = False
        try:
            ai_insights = await ResultService.get_user_ai_insights(user_id)
            has_ai_insights = ai_insights is not None
        except:
            pass
        
        preview_data = {
            "user_id": user_id,
            "total_tests": len(all_results),
            "test_types": list(all_results.keys()) if all_results else [],
            "has_ai_insights": has_ai_insights,
            "estimated_pages": len(all_results) + (2 if has_ai_insights else 0) + 1,  # +1 for summary
            "generation_time_estimate": "2-3 minutes",
            "available_formats": ["PDF (via browser print)", "Web view"]
        }
        
        return JSONResponse(content=preview_data)
        
    except Exception as e:
        logger.error(f"Error generating comprehensive report preview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
