import os
import sys

# Add backend root to Python path
BACKEND_ROOT = os.path.dirname(os.path.abspath(__file__))
if BACKEND_ROOT not in sys.path:
    sys.path.append(BACKEND_ROOT)

from core.app_factory import create_app  # noqa: E402
from auth_service.app.api.v1.api import api_router as auth_router  # noqa: E402
from question_service.app.api.v1.api import api_router as question_router  # noqa: E402
from results_service.app.api.v1.api import api_router as results_router  # noqa: E402
from contact_service.app.api.v1.api import api_router as contact_router  # noqa: E402

# Create unified FastAPI application
app = create_app({
    "title": "LCJ Career Assessment System - Unified API",
    "description": "Unified API combining all LCJ services: Auth, Questions, Results, and Contact",
    "version": "1.0.0"
})

# Include all service routers with their respective prefixes
app.include_router(auth_router, prefix="/api/v1/auth_service", tags=["Authentication"])
app.include_router(question_router, prefix="/api/v1/question_service", tags=["Questions"])
app.include_router(results_router, prefix="/api/v1/results_service", tags=["Results"])
app.include_router(contact_router, prefix="/api/v1/contact_service", tags=["Contact"])

# Health check endpoints for individual services
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "unified_lcj_api",
        "services": {
            "auth": "healthy",
            "questions": "healthy",
            "results": "healthy",
            "contact": "healthy"
        }
    }

@app.get("/health/auth")
async def auth_health():
    return {"status": "healthy", "service": "auth_service"}

@app.get("/health/questions")
async def questions_health():
    return {"status": "healthy", "service": "question_service"}

@app.get("/health/results")
async def results_health():
    return {"status": "healthy", "service": "results_service"}

@app.get("/health/contact")
async def contact_health():
    return {"status": "healthy", "service": "contact_service"}

@app.get("/")
async def root():
    return {
        "message": "LCJ Career Assessment System - Unified API",
        "version": "1.0.0",
        "services": {
            "auth": "/api/v1/auth",
            "questions": "/api/v1/questions",
            "results": "/api/v1/results",
            "contact": "/api/v1/contact"
        },
        "docs": "/docs",
        "health": "/health"
    }

@app.on_event("startup")
async def startup_event():
    print("🚀 LCJ Unified API Server starting up...")
    print("📋 Available services:")
    print("   • Auth Service: /api/v1/auth")
    print("   • Question Service: /api/v1/questions")
    print("   • Results Service: /api/v1/results")
    print("   • Contact Service: /api/v1/contact")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("💚 Health Check: http://localhost:8000/health")

@app.on_event("shutdown")
async def shutdown_event():
    print("🛑 LCJ Unified API Server shutting down...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
