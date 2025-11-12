from fastapi import APIRouter
from question_service.app.api.v1.tests import router as tests_router
from question_service.app.api.v1.questions import router as questions_router
from question_service.app.api.v1.optimized_questions import router as optimized_questions_router
from question_service.app.api.test_results import router as test_results_router

api_router = APIRouter()

# Optimized endpoints (prioritized for performance)
api_router.include_router(optimized_questions_router, prefix="/optimized", tags=["optimized-questions"])

# Standard endpoints
api_router.include_router(tests_router, prefix="/tests", tags=["tests"])
api_router.include_router(questions_router, prefix="/questions", tags=["questions"])
api_router.include_router(test_results_router, tags=["test-results"])

router = api_router  # Export as 'router' for gateway compatibility
