from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config.settings import settings

def setup_middlewares(app: FastAPI) -> None:
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
