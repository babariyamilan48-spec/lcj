from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import io
import json
from datetime import datetime

from results_service.app.schemas.result import TestResult, TestResultCreate, UserProfile, UserProfileUpdate, AnalyticsData
from results_service.app.services.result_service import ResultService
from results_service.app.services.markdown_report_service import MarkdownReportService
from results_service.app.services.pdf_generator import PDFGeneratorService
from core.services.ai_service import AIInsightService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class AIInsightRequest(BaseModel):
    test_type: str
    test_id: str
    answers: List[Any]
    results: Dict[str, Any]
    user_id: Optional[str] = None

class AIInsightResponse(BaseModel):
    success: bool
    insights: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    generated_at: Optional[str] = None
    model: Optional[str] = None

class ComprehensiveAIRequest(BaseModel):
    user_id: str  # Changed from int to str to support UUID
    all_test_results: Dict[str, Any]

class ComprehensiveAIResponse(BaseModel):
    success: bool
    insights: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    generated_at: Optional[str] = None
    model: Optional[str] = None

class ResultSubmissionResponse(BaseModel):
    message: str
    result_id: str
    is_duplicate: bool

@router.post("/results", response_model=ResultSubmissionResponse)
async def submit_result(result: TestResultCreate):
    """Submit a test result with deduplication"""
    try:
        logger.info(f"Submitting result for user {result.user_id}, test {result.test_id}")
        
        # Check for existing results to prevent duplicates
        existing_results = await ResultService.get_user_results(str(result.user_id))
        
        # Check if user has already completed this test (one-time restriction)
        for existing_result in existing_results:
            if existing_result.test_id == result.test_id:
                logger.info(f"Test already completed by user {result.user_id}, test {result.test_id}. Preventing retake.")
                return ResultSubmissionResponse(
                    message="Test already completed. Each test can only be taken once.", 
                    result_id=existing_result.id,
                    is_duplicate=True
                )
        
        # Create new result if no recent duplicate found
        created_result = await ResultService.create_result(result)
        logger.info(f"New result created successfully: {created_result.id}")
        
        return ResultSubmissionResponse(
            message="Result submitted successfully", 
            result_id=created_result.id,
            is_duplicate=False
        )
    except Exception as e:
        logger.error(f"Error submitting result: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results/{user_id}")
async def get_user_results(user_id: str, page: int = 1, size: int = 10):
    """Get paginated results for a user"""
    try:
        logger.info(f"Getting results for user {user_id}, page {page}, size {size}")
        results = await ResultService.get_user_results_paginated(user_id, page, size)
        logger.info(f"Successfully retrieved {len(results.get('results', []))} results")
        return results
    except Exception as e:
        logger.error(f"Error getting user results: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving results: {str(e)}")

@router.get("/results/{user_id}/latest", response_model=Optional[TestResult])
async def get_latest_result(user_id: str):
    """Get the latest result for a user"""
    try:
        return await ResultService.get_latest_result(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile/{user_id}", response_model=UserProfile)
async def get_user_profile(user_id: str):
    """Get user profile"""
    try:
        return await ResultService.get_user_profile(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/profile/{user_id}", response_model=UserProfile)
async def update_user_profile(user_id: str, profile_data: UserProfileUpdate):
    """Update user profile"""
    try:
        return await ResultService.update_user_profile(user_id, profile_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/{user_id}")
async def get_user_analytics(user_id: str):
    """Get user analytics data"""
    try:
        return await ResultService.get_user_analytics(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai-insights/generate", response_model=AIInsightResponse)
async def generate_ai_insights(request: AIInsightRequest, async_processing: bool = False):
    """
    Generate AI-powered personality insights using Gemini-2.0-flash.
    
    Args:
        request: AI insight request data
        async_processing: If True, returns task ID for async processing. If False, processes synchronously.
    """
    try:
        if async_processing:
            # Use async processing via Celery
            try:
                from core.tasks.ai_report_tasks import generate_ai_insights_task
                
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
                
                return AIInsightResponse(
                    success=True,
                    insights={"task_id": task.id, "status": "PENDING", "message": "Processing started. Use task ID to check progress."},
                    generated_at=datetime.utcnow().isoformat(),
                    model="async-celery"
                )
                
            except ImportError:
                logger.warning("Celery not available, falling back to synchronous processing")
                async_processing = False
        
        if not async_processing:
            # Original synchronous processing
            # Initialize AI service
            ai_service = AIInsightService()
            
            # Prepare test data
            test_data = {
                "test_type": request.test_type,
                "test_id": request.test_id,
                "answers": request.answers,
                "results": request.results,
                "user_id": request.user_id
            }
            
            # Generate insights
            result = ai_service.generate_personality_insights(test_data)
            
            if result["success"]:
                # Log successful generation
                logger.info(f"AI insights generated successfully for test {request.test_id}")
                
                return AIInsightResponse(
                    success=True,
                    insights=result["insights"],
                    generated_at=result["generated_at"],
                    model=result["model"]
                )
            else:
                # Return fallback insights if AI generation failed
                logger.warning(f"AI generation failed, using fallback for test {request.test_id}")
                
                return AIInsightResponse(
                    success=True,
                    insights=result.get("fallback_insights"),
                    error="AI generation failed, using fallback insights",
                    model="fallback"
                )
            
    except Exception as e:
        logger.error(f"Error in AI insights endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate AI insights: {str(e)}"
        )

@router.post("/ai-insights/comprehensive", response_model=ComprehensiveAIResponse)
async def generate_comprehensive_ai_insights(request: ComprehensiveAIRequest, async_processing: bool = False):
    """
    Generate comprehensive AI insights based on all completed tests.
    One-time generation per user - stores result and prevents regeneration.
    
    Args:
        request: Comprehensive AI request data
        async_processing: If True, returns task ID for async processing. If False, processes synchronously.
    """
    try:
        # Check if user already has comprehensive AI insights (one-time restriction)
        existing_ai_result = await ResultService.get_user_ai_insights(request.user_id)
        if existing_ai_result:
            logger.info(f"User {request.user_id} already has comprehensive AI insights. Redirecting to view existing results.")
            return ComprehensiveAIResponse(
                success=True,
                insights={
                    "redirect_to_history": True,
                    "message": "આપે પહેલેથી જ AI વિશ્લેષણ બનાવ્યું છે. કૃપા કરીને ટેસ્ટ હિસ્ટરીમાં જુઓ.",
                    "existing_result_id": str(existing_ai_result.get("id"))
                },
                generated_at=existing_ai_result.get("generated_at"),
                model="existing"
            )
        
        if async_processing:
            # Use async processing via Celery
            try:
                from core.tasks.ai_report_tasks import generate_comprehensive_ai_insights_task
                
                logger.info(f"Starting async comprehensive AI insights generation for user {request.user_id}")
                
                # Start the Celery task
                task = generate_comprehensive_ai_insights_task.delay(request.dict())
                
                return ComprehensiveAIResponse(
                    success=True,
                    insights={"task_id": task.id, "status": "PENDING", "message": "Processing started. Use task ID to check progress."},
                    generated_at=datetime.utcnow().isoformat(),
                    model="async-celery"
                )
                
            except ImportError:
                logger.warning("Celery not available, falling back to synchronous processing")
                async_processing = False
        
        if not async_processing:
            # Original synchronous processing
            # Initialize AI service
            ai_service = AIInsightService()
            
            # Generate comprehensive insights
            result = ai_service.generate_comprehensive_insights(request.dict())
            
            if result["success"]:
                logger.info(f"Comprehensive AI insights generated successfully for user {request.user_id}")
                
                # Store AI insights as a test result for one-time restriction and history display
                ai_test_result = await ResultService.store_ai_insights(
                    user_id=request.user_id,
                    insights_data=result["insights"],
                    generated_at=result.get("generated_at"),
                    model=result.get("model")
                )
                
                return ComprehensiveAIResponse(
                    success=True,
                    insights=result["insights"],
                    generated_at=result.get("generated_at"),
                    model=result.get("model")
                )
            else:
                logger.warning(f"Comprehensive AI generation failed for user {request.user_id}")
                
                return ComprehensiveAIResponse(
                    success=False,
                    insights=None,
                    error="AI insights are currently unavailable. Please try again in a few minutes. Our AI service may be temporarily busy processing other requests.",
                    model="unavailable"
                )
            
    except Exception as e:
        logger.error(f"Error in comprehensive AI insights endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate comprehensive AI insights: {str(e)}"
        )

@router.get("/ai-insights/{user_id}")
async def get_user_ai_insights(user_id: str):
    """
    Get existing AI insights for a user
    """
    try:
        ai_insights = await ResultService.get_user_ai_insights(user_id)
        if not ai_insights:
            raise HTTPException(
                status_code=404,
                detail="No AI insights found for this user"
            )
        
        return {
            "success": True,
            "ai_insights": ai_insights,
            "message": "AI insights retrieved successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving AI insights for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve AI insights: {str(e)}"
        )

@router.get("/ai-insights/{user_id}/history")
async def get_user_ai_insights_for_history(user_id: str):
    """
    Get AI insights formatted for test history display
    """
    try:
        ai_insights_history = await ResultService.get_user_ai_insights_for_history(user_id)
        
        return {
            "success": True,
            "ai_insights": ai_insights_history,
            "count": len(ai_insights_history),
            "message": "AI insights history retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Error retrieving AI insights history for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve AI insights history: {str(e)}"
        )

@router.get("/completion-status/{user_id}")
async def check_test_completion_status(user_id: str):
    """
    Check if user has completed all required tests for comprehensive analysis
    """
    try:
        # Define required tests for comprehensive analysis (SVS removed from test suite)
        required_tests = ['mbti', 'intelligence', 'bigfive', 'riasec', 'decision', 'vark', 'life-situation']
        
        # Get user's completed tests using the database-backed service
        user_results = await ResultService.get_user_results(str(user_id))
        completed_tests = []
        
        if user_results:
            completed_tests = [result.test_id for result in user_results if result.test_id]
        
        # Remove duplicates
        completed_tests = list(set(completed_tests))
        
        # Find missing tests
        missing_tests = [test for test in required_tests if test not in completed_tests]
        
        logger.info(f"User {user_id} completion status: {len(completed_tests)}/{len(required_tests)} tests completed")
        logger.info(f"Completed tests: {completed_tests}")
        logger.info(f"Missing tests: {missing_tests}")
        
        completion_percentage = (len(completed_tests) / len(required_tests)) * 100
        
        return {
            "allCompleted": len(missing_tests) == 0,
            "completedTests": completed_tests,
            "missingTests": missing_tests,
            "totalTests": len(required_tests),
            "completionPercentage": completion_percentage
        }
        
    except Exception as e:
        logger.error(f"Error checking test completion status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking completion status: {str(e)}")

class ComprehensivePDFRequest(BaseModel):
    test_results: Dict[str, Any]
    ai_insights: Dict[str, Any]

@router.post("/download-comprehensive-pdf/{user_id}")
async def download_comprehensive_pdf(user_id: str, request_data: ComprehensivePDFRequest):
    """
    Generate and download comprehensive PDF report with all test results and AI insights
    """
    try:
        logger.info(f"Generating comprehensive PDF report for user {user_id}")
        
        # Extract data from request
        test_results = request_data.test_results
        ai_insights = request_data.ai_insights
        
        # Generate PDF using the PDF generator service
        pdf_path = PDFGeneratorService.generate_comprehensive_report_pdf(
            test_results=test_results,
            ai_insights=ai_insights,
            user_id=user_id
        )
        
        # Read the generated PDF file
        with open(pdf_path, 'rb') as pdf_file:
            pdf_content = pdf_file.read()
        
        # Clean up the temporary file
        import os
        os.remove(pdf_path)
        
        # Return PDF as streaming response
        pdf_stream = io.BytesIO(pdf_content)
        
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type='application/pdf',
            headers={
                "Content-Disposition": f"attachment; filename=comprehensive_report_user_{user_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating comprehensive PDF report: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate comprehensive PDF report: {str(e)}"
        )

@router.get("/all-results/{user_id}")
async def get_all_test_results(user_id: str):
    """
    Get all test results for a user organized by test type for comprehensive analysis
    """
    try:
        # Get all user results using the database-backed service
        user_results = await ResultService.get_user_results(str(user_id))
        
        if not user_results:
            return {}
        
        # Organize results by test type (get latest result for each test type)
        organized_results = {}
        
        for result in user_results:
            test_id = result.test_id
            if test_id:
                # Keep only the latest result for each test type
                if test_id not in organized_results or result.timestamp > organized_results[test_id]['timestamp']:
                    organized_results[test_id] = {
                        'test_id': result.test_id,
                        'test_name': result.test_name,
                        'analysis': result.analysis,
                        'score': result.score,
                        'percentage': result.percentage,
                        'percentage_score': result.percentage_score,
                        'total_score': result.total_score,
                        'dimensions_scores': result.dimensions_scores,
                        'recommendations': result.recommendations,
                        'answers': result.answers,  # Include raw answers for AI analysis
                        'duration_minutes': result.duration_minutes,
                        'total_questions': result.total_questions,
                        'timestamp': result.timestamp,
                        'completed_at': result.completed_at,
                        'user_id': result.user_id  # Include user_id for AI context
                    }
        
        logger.info(f"Retrieved {len(organized_results)} unique test results for user {user_id}")
        logger.info(f"Test types found: {list(organized_results.keys())}")
        
        # Log summary of each test result for debugging
        for test_id, result in organized_results.items():
            logger.info(f"Test {test_id}: {result.get('test_name', 'Unknown')} - Score: {result.get('score', 'N/A')} - Questions: {result.get('total_questions', 'N/A')}")
        
        return organized_results
        
    except Exception as e:
        logger.error(f"Error getting all test results: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting all test results: {str(e)}")

@router.get("/debug/ai-input/{user_id}")
async def debug_ai_input_data(user_id: str):
    """
    Debug endpoint to show exactly what data would be sent to AI service
    """
    try:
        # Get all user results using the same method as AI insights
        user_results = await ResultService.get_user_results(str(user_id))
        
        if not user_results:
            return {
                "user_id": user_id,
                "message": "No test results found",
                "test_count": 0,
                "test_results": {}
            }
        
        # Organize results by test type (same as AI endpoint)
        organized_results = {}
        
        for result in user_results:
            test_id = result.test_id
            if test_id:
                # Keep only the latest result for each test type
                if test_id not in organized_results or result.timestamp > organized_results[test_id]['timestamp']:
                    organized_results[test_id] = {
                        'test_id': result.test_id,
                        'test_name': result.test_name,
                        'analysis': result.analysis,
                        'score': result.score,
                        'percentage': result.percentage,
                        'percentage_score': result.percentage_score,
                        'total_score': result.total_score,
                        'dimensions_scores': result.dimensions_scores,
                        'recommendations': result.recommendations,
                        'answers': result.answers,
                        'duration_minutes': result.duration_minutes,
                        'total_questions': result.total_questions,
                        'timestamp': result.timestamp,
                        'completed_at': result.completed_at,
                        'user_id': result.user_id,
                        # Debug info
                        'answers_count': len(result.answers) if result.answers else 0,
                        'has_analysis': bool(result.analysis),
                        'has_recommendations': bool(result.recommendations),
                        'has_dimensions': bool(result.dimensions_scores)
                    }
        
        return {
            "user_id": user_id,
            "message": f"Found {len(organized_results)} test results for AI analysis",
            "test_count": len(organized_results),
            "test_types": list(organized_results.keys()),
            "test_results": organized_results,
            "ai_input_preview": {
                "user_id": user_id,
                "all_test_results": organized_results
            }
        }
        
    except Exception as e:
        logger.error(f"Error in debug endpoint: {str(e)}")
        return {
            "user_id": user_id,
            "error": str(e),
            "message": "Failed to retrieve test results for AI analysis"
        }

@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify service is working"""
    try:
        from results_service.app.services.result_service import results_db
        return {
            "status": "ok",
            "message": "Results service is working",
            "sample_data_count": len(results_db),
            "sample_keys": list(results_db.keys())[:3]  # Show first 3 keys
        }
    except Exception as e:
        logger.error(f"Test endpoint error: {str(e)}")
        return {"status": "error", "error": str(e)}

@router.get("/ai-insights/health")
async def ai_insights_health_check():
    """
    Health check endpoint for AI insights service
    """
    try:
        # Test AI service initialization
        ai_service = AIInsightService()
        return {"status": "healthy", "service": "ai-insights", "model": "gemini-2.0-flash"}
    except Exception as e:
        logger.error(f"AI service health check failed: {str(e)}")
        return {"status": "unhealthy", "error": str(e)}

@router.get("/download-report/{user_id}")
async def download_user_report(
    user_id: str, 
    format: str = "pdf",
    include_ai_insights: bool = True,
    test_id: Optional[str] = None
):
    """
    Download comprehensive user report including overview, results, and AI insights
    
    Args:
        user_id: User ID to generate report for
        format: Report format (pdf, json, csv)
        include_ai_insights: Whether to include AI insights in the report
        test_id: Optional specific test ID to generate report for (if not provided, includes all tests)
    """
    try:
        logger.info(f"Generating {format} report for user {user_id}, include_ai_insights={include_ai_insights}, test_id={test_id}")
        
        # Generate the report
        report_data = await ResultService.generate_comprehensive_report(
            user_id=user_id,
            include_ai_insights=include_ai_insights,
            test_id=test_id
        )
        
        logger.info(f"Report data generated successfully, contains {len(report_data.get('test_results', []))} test results")
        
        if format.lower() == "json":
            # Return JSON report
            json_content = json.dumps(report_data, indent=2, default=str)
            buffer = io.BytesIO(json_content.encode('utf-8'))
            
            return StreamingResponse(
                io.BytesIO(json_content.encode('utf-8')),
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=user_report_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                }
            )
        
        elif format.lower() == "csv":
            # Generate CSV report
            csv_content = await ResultService.generate_csv_report(report_data)
            
            return StreamingResponse(
                io.BytesIO(csv_content.encode('utf-8')),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=user_report_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                }
            )
        
        elif format.lower() == "markdown" or format.lower() == "md":
            # Generate Markdown report
            logger.info("Starting Markdown generation...")
            markdown_content = await MarkdownReportService.generate_markdown_report(report_data)
            logger.info(f"Markdown generated successfully, size: {len(markdown_content)} characters")
            
            return StreamingResponse(
                io.BytesIO(markdown_content.encode('utf-8')),
                media_type="text/markdown",
                headers={
                    "Content-Disposition": f"attachment; filename=user_report_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
                }
            )
        
        elif format.lower() == "pdf":
            # Generate PDF report
            logger.info("Starting PDF generation...")
            pdf_buffer = await ResultService.generate_pdf_report(report_data)
            logger.info(f"PDF generated successfully, size: {len(pdf_buffer)} bytes")
            
            return StreamingResponse(
                io.BytesIO(pdf_buffer),
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename=user_report_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                }
            )
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported format. Use 'pdf', 'json', 'csv', or 'markdown'")
            
    except Exception as e:
        logger.error(f"Error generating report for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

@router.post("/cleanup-duplicates/{user_id}")
async def cleanup_duplicate_results(user_id: str):
    """
    Clean up duplicate test results for a user, keeping only the latest result for each test type
    """
    try:
        logger.info(f"Cleaning up duplicate results for user {user_id}")
        
        # Use the service method to actually clean up duplicates
        cleanup_result = await ResultService.cleanup_duplicate_results(user_id)
        
        logger.info(f"Cleanup completed: {cleanup_result}")
        return cleanup_result
        
    except Exception as e:
        logger.error(f"Error cleaning up duplicates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")

@router.get("/test-report/{user_id}")
async def test_report_generation(user_id: str):
    """
    Test endpoint to verify report generation works
    """
    try:
        logger.info(f"Testing report generation for user {user_id}")
        
        # Generate the report data
        report_data = await ResultService.generate_comprehensive_report(
            user_id=user_id,
            include_ai_insights=False,  # Disable AI insights for testing
            test_id=None
        )
        
        return {
            "status": "success",
            "message": "Report generation test successful",
            "user_id": user_id,
            "test_results_count": len(report_data.get('test_results', [])),
            "has_user_profile": bool(report_data.get('user_overview', {}).get('profile')),
            "report_metadata": report_data.get('report_metadata', {})
        }
        
    except Exception as e:
        logger.error(f"Error in test report generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")
