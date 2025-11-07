from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config.settings import settings

def setup_middlewares(app: FastAPI) -> None:
    # More explicit CORS configuration for development
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000", 
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    # If settings.allowed_hosts contains "*", use all origins
    if "*" in settings.allowed_hosts:
        allowed_origins = ["*"]
    else:
        # Extend with configured hosts
        allowed_origins.extend(settings.allowed_hosts)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
        expose_headers=["*"]
    )

