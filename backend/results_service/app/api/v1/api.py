from fastapi import APIRouter
from results_service.app.api.v1.results import router as results_router
from results_service.app.api.v1.results_optimized import router as results_optimized_router
from results_service.app.api.v1.async_results import router as async_results_router
from results_service.app.api.v1.analytics import router as analytics_router
from results_service.app.api.v1.completion_status import router as completion_status_router
from results_service.app.api.v1.optimized_results import router as optimized_results_router
from results_service.app.api.v1.optimized_results_v2 import router as optimized_results_v2_router
from results_service.app.api.v1.comprehensive_report import router as comprehensive_report_router

api_router = APIRouter()

# Main endpoints with optimized session management (replaces standard results)
api_router.include_router(results_optimized_router, prefix="", tags=["results-optimized"])

# Optimized endpoints V2 (latest with centralized session management)
api_router.include_router(optimized_results_v2_router, prefix="/optimized-v2", tags=["optimized-results-v2"])

# Optimized endpoints V1 (legacy)
api_router.include_router(optimized_results_router, prefix="/optimized", tags=["optimized-results"])

# Standard endpoints (legacy - for backward compatibility)
api_router.include_router(results_router, prefix="/legacy", tags=["results-legacy"])
api_router.include_router(async_results_router, prefix="/async", tags=["async-results"])
api_router.include_router(analytics_router, prefix="/admin/analytics", tags=["analytics"])  # Moved to avoid conflict
api_router.include_router(completion_status_router, prefix="", tags=["completion-status"])
api_router.include_router(comprehensive_report_router, prefix="", tags=["comprehensive-reports"])

router = api_router  # Export as 'router' for gateway compatibility
