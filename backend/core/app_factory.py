from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi import Request
from pydantic import ValidationError
from fastapi.exceptions import RequestValidationError
from fastapi import HTTPException
from core.config.settings import settings
from core.middleware.middlewares import setup_middlewares
from core.rate_limit import limiter
import json
from datetime import datetime
from core.user_session_singleton import get_user_session_manager

def create_app(config: dict | None = None) -> FastAPI:
    config = config or {}

    app = FastAPI(
        title=config.get("title", settings.title),
        description=config.get("description", settings.description),
        version=config.get("version", settings.version),
        debug=config.get("debug", settings.debug),
    )

    if config.get("enable_middlewares", True):
        setup_middlewares(app)

    # Global error handlers
    register_error_handlers(app)

    if config.get("include_root", True):
        @app.get("/")
        async def root():
            return {
                "status": 200,
                "message": config.get("root_message", f"{settings.title} is running"),
            }

    # Attach rate limiter
    try:
        from slowapi.errors import RateLimitExceeded
        from slowapi.middleware import SlowAPIMiddleware

        app.state.limiter = limiter
        app.add_exception_handler(RateLimitExceeded, lambda r, e: resp(None, False, "Too many requests", "Too many requests", 429))
        app.add_middleware(SlowAPIMiddleware)
    except Exception:
        pass
    
    # Initialize session manager with cleanup thread
    @app.on_event("startup")
    async def startup_session_manager():
        """Start session cleanup thread on startup"""
        try:
            manager = get_user_session_manager()
            manager.start_cleanup_thread()
        except Exception as e:
            print(f"Warning: Failed to start session cleanup thread: {e}")
    
    @app.on_event("shutdown")
    async def shutdown_session_manager():
        """Stop session cleanup thread on shutdown"""
        try:
            manager = get_user_session_manager()
            manager.stop_cleanup_thread()
            manager.force_cleanup_all()
        except Exception as e:
            print(f"Warning: Failed to stop session cleanup thread: {e}")

    return app

class AppError(Exception):
    def __init__(self, code: int = 400, message: str = "Bad request"):
        self.code = code
        self.message = message

def _json_serializer(obj):
    """Custom JSON serializer for datetime objects"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def resp(payload=None, success: bool = True, error: str | None = None, message: str | None = None, status_code: int = 200):
    # Convert Pydantic models to dictionaries for JSON serialization
    if payload is not None:
        try:
            # If it's a Pydantic model, convert to dict
            if hasattr(payload, 'model_dump'):
                payload = payload.model_dump()
            elif hasattr(payload, 'dict'):
                payload = payload.dict()
            
            # Convert to JSON string and back to handle datetime serialization
            payload = json.loads(json.dumps(payload, default=_json_serializer))
        except Exception:
            # If conversion fails, keep the original payload
            pass
    
    return JSONResponse(
        status_code=status_code,
        content={"success": success, "data": payload, "error": error, "message": message},
    )

def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def handle_request_validation_error(_: Request, exc: RequestValidationError):
        errors = []
        for error in exc.errors():
            field = " -> ".join(str(loc) for loc in error["loc"])
            message = error["msg"]
            errors.append(f"{field}: {message}")
        
        error_message = "; ".join(errors)
        return resp(None, False, error_message, f"Validation failed: {error_message}", 422)

    @app.exception_handler(ValidationError)
    async def handle_validation_error(_: Request, exc: ValidationError):
        errors = []
        for error in exc.errors():
            field = " -> ".join(str(loc) for loc in error["loc"])
            message = error["msg"]
            errors.append(f"{field}: {message}")
        
        error_message = "; ".join(errors)
        return resp(None, False, error_message, f"Validation failed: {error_message}", 422)

    @app.exception_handler(HTTPException)
    async def handle_http_exception(_: Request, exc: HTTPException):
        return resp(None, False, str(exc.detail), str(exc.detail), exc.status_code)

    @app.exception_handler(AppError)
    async def handle_app_error(_: Request, exc: AppError):
        return resp(None, False, exc.message, exc.message, exc.code)

    @app.exception_handler(Exception)
    async def handle_generic(_: Request, exc: Exception):
        return resp(None, False, "Something went wrong!", "Something went wrong!", 500)

