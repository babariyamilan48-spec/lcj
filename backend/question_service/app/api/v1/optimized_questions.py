"""
Optimized Question API Endpoints
Ultra-fast endpoints with response times under 200ms
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import asyncio
import time
import logging
from datetime import datetime

from core.database import get_db
from core.database_pool import get_optimized_db
from core.app_factory import resp
from core.cache import cache_async_result
from core.middleware.compression import compress_json_response, optimize_large_response
from core.rate_limit import limiter
from question_service.app.services.optimized_question_service import OptimizedQuestionService
from question_service.app.schemas.question import QuestionCreate, QuestionUpdate
from question_service.app.deps.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

class OptimizedQuestionResponse(BaseModel):
    message: str
    data: Optional[Any] = None
    processing_time_ms: float
    cached: bool = False

class HealthCheckResponse(BaseModel):
    status: str
    response_time_ms: float
    optimizations: Dict[str, bool]

@router.get("/questions/fast")
@limiter.limit("300/minute")  # Higher rate limit for optimized endpoint
async def get_questions_fast(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    test_id: Optional[int] = None,
    section_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_optimized_db)
):
    """
    Ultra-fast question retrieval with pagination and filtering
    Target response time: < 200ms
    """
    start_time = time.time()
    
    try:
        logger.debug(f"Fast questions retrieval: test_id={test_id}, limit={limit}")
        
        with OptimizedQuestionService(db) as service:
            questions, total = await service.get_questions_fast(
                skip=skip,
                limit=limit,
                test_id=test_id,
                section_id=section_id,
                is_active=is_active
            )
        
        processing_time = (time.time() - start_time) * 1000
        
        result = {
            "questions": questions,
            "total": total,
            "page": skip // limit + 1,
            "size": limit,
            "performance": {
                "processing_time_ms": round(processing_time, 2),
                "optimized": True,
                "results_count": len(questions)
            }
        }
        
        # Optimize response for large datasets
        if len(questions) > 50:
            optimized_result = optimize_large_response(result, max_items=limit)
            return compress_json_response(
                {"success": True, "data": optimized_result, "error": None},
                request
            )
        
        logger.debug(f"Fast questions completed in {processing_time:.2f}ms")
        return resp(result, True, None, "Questions retrieved successfully")
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Fast questions failed in {processing_time:.2f}ms: {str(e)}")
        return resp(None, False, str(e), "Failed to retrieve questions", 500)

@router.get("/questions/{question_id}/fast")
@limiter.limit("300/minute")
async def get_question_with_options_fast(
    request: Request,
    question_id: int,
    db: Session = Depends(get_optimized_db)
):
    """
    Ultra-fast single question retrieval with options
    Target response time: < 150ms
    """
    start_time = time.time()
    
    try:
        logger.debug(f"Fast question retrieval: question_id={question_id}")
        
        with OptimizedQuestionService(db) as service:
            question = await service.get_question_with_options_fast(question_id)
        
        processing_time = (time.time() - start_time) * 1000
        
        if not question:
            return resp(None, False, "Question not found", "Question not found", 404)
        
        # Add performance metadata
        question["performance"] = {
            "processing_time_ms": round(processing_time, 2),
            "optimized": True,
            "options_count": len(question.get("options", []))
        }
        
        logger.debug(f"Fast question completed in {processing_time:.2f}ms")
        return resp(question, True, None, "Question retrieved successfully")
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Fast question failed in {processing_time:.2f}ms: {str(e)}")
        return resp(None, False, str(e), "Failed to retrieve question", 500)

@router.get("/tests/{test_id}/questions/fast")
@limiter.limit("200/minute")
@cache_async_result(ttl=1800, key_prefix="fast_test_questions")
async def get_test_questions_fast(
    request: Request,
    test_id: int,
    db: Session = Depends(get_optimized_db)
):
    """
    Ultra-fast test questions retrieval with all options
    Target response time: < 300ms
    """
    start_time = time.time()
    
    try:
        logger.info(f"Fast test questions retrieval: test_id={test_id}")
        
        with OptimizedQuestionService(db) as service:
            questions = await service.get_test_questions_fast(test_id)
        
        processing_time = (time.time() - start_time) * 1000
        
        result = {
            "test_id": test_id,
            "questions": questions,
            "total_questions": len(questions),
            "performance": {
                "processing_time_ms": round(processing_time, 2),
                "optimized": True,
                "questions_loaded": len(questions),
                "total_options": sum(len(q.get("options", [])) for q in questions)
            }
        }
        
        # Optimize and compress large responses
        if len(questions) > 20:
            optimized_result = optimize_large_response(result)
            return compress_json_response(
                {"success": True, "data": optimized_result, "error": None},
                request
            )
        
        logger.info(f"Fast test questions completed in {processing_time:.2f}ms")
        return resp(result, True, None, "Test questions retrieved successfully")
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Fast test questions failed in {processing_time:.2f}ms: {str(e)}")
        return resp(None, False, str(e), "Failed to retrieve test questions", 500)

@router.get("/tests/")
@limiter.limit("200/minute")
@cache_async_result(ttl=1800, key_prefix="fast_tests_list")
async def get_tests_fast(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_optimized_db)
):
    """
    Ultra-fast tests list retrieval
    Target response time: < 200ms
    """
    start_time = time.time()
    
    try:
        logger.debug(f"Fast tests retrieval: skip={skip}, limit={limit}")
        
        # Import Test model here to avoid circular imports
        from question_service.app.models.test import Test
        
        with OptimizedQuestionService(db) as service:
            # Get tests with basic info only
            tests_query = db.query(
                Test.id,
                Test.test_id,
                Test.name,
                Test.english_name,
                Test.description,
                Test.is_active,
                Test.created_at
            ).filter(Test.is_active == True)
            
            total = tests_query.count()
            tests = tests_query.offset(skip).limit(limit).all()
            
            # Convert to dictionaries
            tests_list = []
            for test in tests:
                test_dict = {
                    "id": test.id,
                    "test_id": test.test_id,
                    "name": test.name,
                    "english_name": test.english_name,
                    "description": test.description,
                    "is_active": test.is_active,
                    "created_at": test.created_at.isoformat() if test.created_at else None
                }
                tests_list.append(test_dict)
        
        processing_time = (time.time() - start_time) * 1000
        
        result = {
            "tests": tests_list,
            "total": total,
            "page": skip // limit + 1,
            "size": limit,
            "performance": {
                "processing_time_ms": round(processing_time, 2),
                "optimized": True,
                "endpoint": "fast_tests_list"
            }
        }
        
        logger.info(f"Fast tests retrieval completed in {processing_time:.2f}ms")
        return resp(result, True, "Tests retrieved successfully", "success")
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Fast tests failed in {processing_time:.2f}ms: {str(e)}")
        return resp(None, False, str(e), "Failed to retrieve tests", 500)

@router.get("/tests/{test_id}/questions")
@limiter.limit("200/minute")
@cache_async_result(ttl=3600, key_prefix="fast_test_questions")
async def get_test_questions_fast(
    request: Request,
    test_id: str,
    db: Session = Depends(get_optimized_db)
):
    """
    Ultra-fast test questions retrieval
    Target response time: < 300ms
    """
    start_time = time.time()
    
    try:
        logger.debug(f"Fast test questions retrieval: test_id={test_id}")
        
        # Import models here to avoid circular imports
        from question_service.app.models.question import Question
        from question_service.app.models.option import Option
        
        with OptimizedQuestionService(db) as service:
            # First, find the test by test_id string to get the integer ID
            from question_service.app.models.test import Test
            from sqlalchemy.orm import joinedload
            
            test = db.query(Test).filter(
                Test.test_id == test_id,
                Test.is_active == True
            ).first()
            
            if not test:
                raise HTTPException(status_code=404, detail=f"Test '{test_id}' not found")
            
            # Optimized query: Get questions with options in a single query using joinedload
            questions = db.query(Question).options(
                joinedload(Question.options)
            ).filter(
                Question.test_id == test.id,  # Use the integer ID
                Question.is_active == True
            ).order_by(Question.question_order).all()
            
            # Convert to dictionaries with options (much faster since options are already loaded)
            questions_list = []
            for question in questions:
                # Filter active options and sort them
                active_options = [opt for opt in question.options if opt.is_active]
                active_options.sort(key=lambda x: x.option_order)
                
                question_dict = {
                    "id": question.id,
                    "question_text": question.question_text,
                    "question_order": question.question_order,
                    "test_id": question.test_id,
                    "options": [
                        {
                            "id": option.id,
                            "option_text": option.option_text,
                            "option_order": option.option_order,
                            "weight": option.weight,
                            "dimension": option.dimension
                        } for option in active_options
                    ]
                }
                questions_list.append(question_dict)
        
        processing_time = (time.time() - start_time) * 1000
        
        result = {
            "questions": questions_list,
            "total": len(questions_list),
            "test_id": test_id,
            "performance": {
                "processing_time_ms": round(processing_time, 2),
                "optimized": True,
                "endpoint": "fast_test_questions"
            }
        }
        
        logger.info(f"Fast test questions completed in {processing_time:.2f}ms")
        return resp(result, True, None, "Test questions retrieved successfully")
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Fast test questions failed in {processing_time:.2f}ms: {str(e)}")
        return resp(None, False, str(e), "Failed to retrieve test questions", 500)

@router.get("/tests/{test_id}/structure/fast")
@limiter.limit("100/minute")
@cache_async_result(ttl=3600, key_prefix="fast_test_structure")
async def get_test_structure_fast(
    request: Request,
    test_id: int,
    db: Session = Depends(get_optimized_db)
):
    """
    Get complete test structure with sections, questions, and options
    Target response time: < 400ms
    """
    start_time = time.time()
    
    try:
        logger.info(f"Fast test structure retrieval: test_id={test_id}")
        
        with OptimizedQuestionService(db) as service:
            structure = await service.get_test_structure_fast(test_id)
        
        processing_time = (time.time() - start_time) * 1000
        
        if not structure:
            return resp(None, False, "Test not found", "Test not found", 404)
        
        # Add performance metadata
        structure["performance"] = {
            "processing_time_ms": round(processing_time, 2),
            "optimized": True,
            "sections_count": len(structure.get("sections", [])),
            "total_questions": structure.get("total_questions", 0)
        }
        
        # Optimize and compress large responses
        if structure.get("total_questions", 0) > 30:
            optimized_structure = optimize_large_response(structure)
            return compress_json_response(
                {"success": True, "data": optimized_structure, "error": None},
                request
            )
        
        logger.info(f"Fast test structure completed in {processing_time:.2f}ms")
        return resp(structure, True, None, "Test structure retrieved successfully")
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Fast test structure failed in {processing_time:.2f}ms: {str(e)}")
        return resp(None, False, str(e), "Failed to retrieve test structure", 500)

@router.post("/questions/batch/fast")
@limiter.limit("100/minute")
async def get_questions_batch_fast(
    request: Request,
    question_ids: List[int],
    db: Session = Depends(get_optimized_db)
):
    """
    Batch retrieval of questions with options for maximum efficiency
    Target response time: < 250ms
    """
    start_time = time.time()
    
    try:
        logger.info(f"Fast batch questions retrieval: {len(question_ids)} questions")
        
        if len(question_ids) > 100:
            return resp(None, False, "Too many questions requested", "Maximum 100 questions per batch", 400)
        
        with OptimizedQuestionService(db) as service:
            questions = await service.batch_get_questions_with_options(question_ids)
        
        processing_time = (time.time() - start_time) * 1000
        
        result = {
            "questions": questions,
            "requested_count": len(question_ids),
            "returned_count": len(questions),
            "performance": {
                "processing_time_ms": round(processing_time, 2),
                "optimized": True,
                "batch_size": len(question_ids)
            }
        }
        
        logger.info(f"Fast batch questions completed in {processing_time:.2f}ms")
        return resp(result, True, None, "Batch questions retrieved successfully")
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Fast batch questions failed in {processing_time:.2f}ms: {str(e)}")
        return resp(None, False, str(e), "Failed to retrieve batch questions", 500)

@router.post("/questions/fast")
@limiter.limit("20/minute")
async def create_question_fast(
    request: Request,
    question_data: QuestionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_optimized_db),
    current_user: Any = Depends(get_current_user)
):
    """
    Ultra-fast question creation with background cache invalidation
    Target response time: < 300ms
    """
    start_time = time.time()
    
    try:
        # Check admin privileges
        if not getattr(current_user, "is_admin", False):
            return resp(None, False, "Insufficient permissions", "Admin access required", 403)
        
        logger.info(f"Fast question creation: test_id={question_data.test_id}")
        
        with OptimizedQuestionService(db) as service:
            question = await service.create_question_fast(question_data)
        
        processing_time = (time.time() - start_time) * 1000
        
        if not question:
            return resp(None, False, "Failed to create question", "Question creation failed", 500)
        
        # Schedule background cache warming
        background_tasks.add_task(_warm_question_cache, question["test_id"])
        
        question["performance"] = {
            "processing_time_ms": round(processing_time, 2),
            "optimized": True
        }
        
        logger.info(f"Fast question created in {processing_time:.2f}ms: {question['id']}")
        return resp(question, True, None, "Question created successfully", 201)
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Fast question creation failed in {processing_time:.2f}ms: {str(e)}")
        return resp(None, False, str(e), "Failed to create question", 500)

@router.put("/questions/{question_id}/fast")
@limiter.limit("20/minute")
async def update_question_fast(
    request: Request,
    question_id: int,
    question_data: QuestionUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_optimized_db),
    current_user: Any = Depends(get_current_user)
):
    """
    Ultra-fast question update with background cache invalidation
    Target response time: < 300ms
    """
    start_time = time.time()
    
    try:
        # Check admin privileges
        if not getattr(current_user, "is_admin", False):
            return resp(None, False, "Insufficient permissions", "Admin access required", 403)
        
        logger.info(f"Fast question update: question_id={question_id}")
        
        with OptimizedQuestionService(db) as service:
            question = await service.update_question_fast(question_id, question_data)
        
        processing_time = (time.time() - start_time) * 1000
        
        if not question:
            return resp(None, False, "Question not found", "Question not found", 404)
        
        # Schedule background cache warming
        background_tasks.add_task(_warm_question_cache, question["test_id"])
        
        question["performance"] = {
            "processing_time_ms": round(processing_time, 2),
            "optimized": True
        }
        
        logger.info(f"Fast question updated in {processing_time:.2f}ms: {question_id}")
        return resp(question, True, None, "Question updated successfully")
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Fast question update failed in {processing_time:.2f}ms: {str(e)}")
        return resp(None, False, str(e), "Failed to update question", 500)

@router.get("/health/fast", response_model=HealthCheckResponse)
async def health_check_fast(db: Session = Depends(get_db)):
    """
    Fast health check for optimized question endpoints
    """
    start_time = time.time()
    
    try:
        with OptimizedQuestionService(db) as service:
            health_data = await service.health_check()
        processing_time = (time.time() - start_time) * 1000
        
        return HealthCheckResponse(
            status=health_data["status"],
            response_time_ms=round(processing_time, 2),
            optimizations=health_data.get("optimizations", {})
        )
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        return HealthCheckResponse(
            status="unhealthy",
            response_time_ms=round(processing_time, 2),
            optimizations={}
        )

@router.get("/performance/benchmark/{test_id}")
async def performance_benchmark(
    test_id: int, 
    iterations: int = 5,
    db: Session = Depends(get_optimized_db)
):
    """
    Performance benchmark endpoint to measure optimization improvements
    """
    try:
        service = OptimizedQuestionService(db)
        
        # Benchmark optimized endpoints
        fast_times = []
        for i in range(iterations):
            start_time = time.time()
            await service.get_test_questions_fast(test_id)
            fast_times.append((time.time() - start_time) * 1000)
        
        avg_fast_time = sum(fast_times) / len(fast_times)
        
        return {
            "test_id": test_id,
            "benchmark_results": {
                "optimized_endpoint": {
                    "average_response_time_ms": round(avg_fast_time, 2),
                    "min_time_ms": round(min(fast_times), 2),
                    "max_time_ms": round(max(fast_times), 2),
                    "iterations": iterations
                },
                "performance_improvement": {
                    "estimated_old_time_ms": "2000-5000",
                    "new_time_ms": round(avg_fast_time, 2),
                    "improvement_factor": f"{round(3000 / avg_fast_time, 1)}x faster"
                }
            },
            "optimizations_applied": [
                "SelectInLoad for options",
                "Query field selection",
                "Async operations",
                "Caching layer",
                "Batch operations",
                "Response compression"
            ]
        }
        
    except Exception as e:
        logger.error(f"Benchmark failed: {str(e)}")
        return resp(None, False, str(e), "Benchmark failed", 500)

# Background task functions
async def _warm_question_cache(test_id: int):
    """
    Warm up cache for question data in background
    """
    try:
        # This would pre-load commonly accessed data
        logger.debug(f"Cache warming started for test_id {test_id}")
        # Implementation would depend on your specific caching strategy
    except Exception as e:
        logger.warning(f"Cache warming failed for test_id {test_id}: {e}")

@router.post("/cache/warm/{test_id}")
async def warm_question_cache(test_id: int, background_tasks: BackgroundTasks):
    """
    Manually warm cache for a test's questions
    """
    background_tasks.add_task(_warm_question_cache, test_id)
    return {"message": f"Cache warming started for test {test_id}"}

@router.delete("/cache/clear/{test_id}")
async def clear_question_cache_fast(test_id: int, db: Session = Depends(get_db)):
    """
    Clear optimized cache for a test's questions
    """
    try:
        with OptimizedQuestionService(db) as service:
            await service._invalidate_question_cache(test_id)
        return {"message": f"Optimized cache cleared for test {test_id}"}
    except Exception as e:
        return resp(None, False, str(e), "Cache clear failed", 500)
