from fastapi import APIRouter
from question_service.app.api.v1.tests import router as tests_router
from question_service.app.api.v1.questions import router as questions_router
from question_service.app.api.v1.optimized_questions import router as optimized_questions_router
from question_service.app.api.test_results import router as test_results_router
from question_service.app.api.optimized_test_results import router as optimized_test_results_router

api_router = APIRouter()

# Main endpoints with optimized session management (replaces standard endpoints)
api_router.include_router(optimized_questions_router, prefix="", tags=["questions-optimized"])
api_router.include_router(optimized_test_results_router, prefix="/test-results", tags=["test-results-optimized"])

# Legacy optimized endpoints
api_router.include_router(optimized_questions_router, prefix="/optimized", tags=["optimized-questions"])

# Standard endpoints (legacy - for backward compatibility)
api_router.include_router(tests_router, prefix="/legacy/tests", tags=["tests-legacy"])
api_router.include_router(questions_router, prefix="/legacy/questions", tags=["questions-legacy"])
api_router.include_router(test_results_router, prefix="/legacy", tags=["test-results-legacy"])

router = api_router  # Export as 'router' for gateway compatibility
