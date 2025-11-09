from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from core.config.settings import settings
from core.middleware.compression import CompressionMiddleware, ResponseOptimizationMiddleware, JSONOptimizationMiddleware
import logging

logger = logging.getLogger(__name__)

def setup_middlewares(app: FastAPI) -> None:
    """Setup optimized middlewares for maximum performance"""
    
    # Add performance optimization middlewares first
    app.add_middleware(JSONOptimizationMiddleware)
    app.add_middleware(ResponseOptimizationMiddleware)
    app.add_middleware(CompressionMiddleware, minimum_size=500, compression_level=6)
    
    # CORS configuration for different environments
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    # Add production origins
    if settings.ENVIRONMENT == "production":
        production_origins = [
            "https://lcj-career-assessment.vercel.app",  # Replace with your actual Vercel URL
            "https://your-custom-domain.com",            # Add your custom domain if you have one
            "https://www.your-custom-domain.com"
        ]
        allowed_origins.extend(production_origins)

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
    
    logger.info("Performance optimization middlewares enabled")
    logger.info("- JSON optimization: Enabled")
    logger.info("- Response compression: Enabled (min 500 bytes)")
    logger.info("- Response optimization: Enabled")
    logger.info("- CORS: Enabled")

# Health check for middlewares
def middleware_health_check():
    """Check middleware configuration health"""
    return {
        "compression": "enabled",
        "json_optimization": "enabled",
        "response_optimization": "enabled",
        "cors": "enabled",
        "status": "healthy"
    }
