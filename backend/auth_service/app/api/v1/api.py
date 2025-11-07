from fastapi import APIRouter
from auth_service.app.api.v1.auth import router as auth_router
from auth_service.app.api.v1.admin import router as admin_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(admin_router, prefix="", tags=["admin"])  # No prefix for direct /users access

router = api_router  # Export as 'router' for gateway compatibility

