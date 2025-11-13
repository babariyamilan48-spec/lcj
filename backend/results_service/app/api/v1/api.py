from fastapi import APIRouter
from results_service.app.api.v1.results import router as results_router
from results_service.app.api.v1.async_results import router as async_results_router
from results_service.app.api.v1.analytics import router as analytics_router
from results_service.app.api.v1.completion_status import router as completion_status_router
from results_service.app.api.v1.optimized_results import router as optimized_results_router
from results_service.app.api.v1.comprehensive_report import router as comprehensive_report_router

api_router = APIRouter()

# Optimized endpoints (prioritized for performance)
api_router.include_router(optimized_results_router, prefix="/optimized", tags=["optimized-results"])

# Standard endpoints
api_router.include_router(results_router, tags=["results"])
api_router.include_router(async_results_router, prefix="/async", tags=["async-results"])
api_router.include_router(analytics_router, prefix="", tags=["analytics"])
api_router.include_router(completion_status_router, prefix="", tags=["completion-status"])
api_router.include_router(comprehensive_report_router, prefix="", tags=["comprehensive-reports"])

router = api_router  # Export as 'router' for gateway compatibility
