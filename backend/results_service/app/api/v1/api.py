from fastapi import APIRouter
from results_service.app.api.v1.results import router as results_router
from results_service.app.api.v1.async_results import router as async_results_router
from results_service.app.api.v1.analytics import router as analytics_router

api_router = APIRouter()
api_router.include_router(results_router, tags=["results"])
api_router.include_router(async_results_router, prefix="/async", tags=["async-results"])
api_router.include_router(analytics_router, prefix="", tags=["analytics"])

router = api_router  # Export as 'router' for gateway compatibility
