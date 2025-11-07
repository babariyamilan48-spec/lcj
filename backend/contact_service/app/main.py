import os
import sys

# Ensure service root is importable so `app` package resolves
SERVICE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SERVICE_ROOT not in sys.path:
    sys.path.append(SERVICE_ROOT)

from core.app_factory import create_app  # noqa: E402
from contact_service.app.api.v1.api import api_router  # noqa: E402

app = create_app({
    "title": "LCJ Contact Service",
    "description": "Contact form and inquiry management service for LCJ Career Assessment System",
})

app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    # Initialize resources if needed
    return None

@app.on_event("shutdown")
async def shutdown_event():
    # Cleanup resources if needed
    return None

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "contact_service"}

@app.get("/")
async def root():
    return {"message": "LCJ Contact Service", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8004,
        reload=True,
        log_level="info"
    )
