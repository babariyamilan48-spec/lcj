from fastapi import APIRouter
from auth_service.app.api.v1.auth import router as auth_router
from auth_service.app.api.v1.admin import router as admin_router
from auth_service.app.api.v1.optimized_auth import router as optimized_auth_router
from auth_service.app.api.v1.optimized_auth_v2 import router as optimized_auth_v2_router
from auth_service.app.api.v1.payment import router as payment_router

api_router = APIRouter()

# Main auth endpoints with optimized session management (replaces standard auth)
api_router.include_router(optimized_auth_v2_router, prefix="/auth", tags=["auth-optimized"])  # Main auth endpoints

# Legacy optimized endpoints
api_router.include_router(optimized_auth_router, prefix="/optimized", tags=["optimized-auth"])  # Legacy optimized endpoints

# Fast optimized endpoints (for the URL you're trying to access)
api_router.include_router(optimized_auth_v2_router, prefix="/optimized/auth", tags=["optimized-auth-fast"])  # Fast endpoints

# Standard endpoints (legacy - for backward compatibility)
api_router.include_router(auth_router, prefix="/legacy", tags=["auth-legacy"])

# Email verification endpoints (available at both /auth and /optimized/auth)
api_router.include_router(optimized_auth_v2_router, prefix="", tags=["auth-verification"])  # Verify-email endpoints at root

# Payment endpoints
api_router.include_router(payment_router, prefix="", tags=["payment"])  # Payment endpoints at /payment/*

# Admin endpoints
api_router.include_router(admin_router, prefix="", tags=["admin"])  # No prefix for direct /users access

router = api_router  # Export as 'router' for gateway compatibility

