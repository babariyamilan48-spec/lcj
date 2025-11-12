"""
Optimized Auth API Endpoints
Ultra-fast authentication with response times under 300ms
"""

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from pydantic import BaseModel
import asyncio
import time
import logging
from datetime import datetime, timedelta
import jwt
import bcrypt
from contextlib import asynccontextmanager

from core.database import get_db
from core.database_pool import get_optimized_db
from core.app_factory import resp
from core.cache import cache_async_result
from core.rate_limit import limiter
from auth_service.app.models.user import User
from auth_service.app.schemas.user import LoginInput, UserOut
from auth_service.app.utils.jwt import verify_password, create_token_pair, decode_token

# Setup logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/optimized", tags=["optimized-auth"])

# Security
security = HTTPBearer()

class OptimizedAuthService:
    """Ultra-fast auth service with optimized database operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Ensure database session is properly closed"""
        try:
            if self.db:
                self.db.close()
        except Exception as e:
            logger.warning(f"Error closing auth database session: {e}")
    
    async def authenticate_user_fast(self, email: str, password: str) -> Optional[User]:
        """Ultra-fast user authentication with minimal database queries"""
        try:
            # Single optimized query - select only needed fields
            user = self.db.query(
                User.id,
                User.email,
                User.password_hash,
                User.is_active,
                User.is_verified,
                User.role,
                User.username
            ).filter(
                User.email == email,
                User.is_active == True
            ).first()
            
            if not user:
                return None
            
            # Fast password verification
            if not verify_password(password, user.password_hash):
                return None
                
            return user
            
        except Exception as e:
            logger.error(f"Fast auth error: {e}")
            return None
    
    async def get_user_by_id_fast(self, user_id: str) -> Optional[User]:
        """Ultra-fast user retrieval by ID"""
        try:
            # Single optimized query - select only needed fields
            user = self.db.query(
                User.id,
                User.email,
                User.username,
                User.role,
                User.is_active,
                User.is_verified,
                User.created_at,
                User.updated_at
            ).filter(
                User.id == user_id,
                User.is_active == True
            ).first()
            
            return user
            
        except Exception as e:
            logger.error(f"Fast user retrieval error: {e}")
            return None

# Request/Response Models - Use existing schemas
FastLoginRequest = LoginInput

class FastLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]
    expires_in: int

class FastUserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    is_verified: bool
    created_at: Optional[datetime]
    last_login: Optional[datetime]

@router.post("/auth/login/fast")
@limiter.limit("10/minute")  # Rate limiting for security
async def login_fast(
    request: Request,
    login_data: FastLoginRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_optimized_db)
):
    """
    Ultra-fast user login
    Target response time: < 300ms
    """
    start_time = time.time()
    
    try:
        logger.debug(f"Fast login attempt for: {login_data.email}")
        
        with OptimizedAuthService(db) as auth_service:
            # Fast authentication
            user = await auth_service.authenticate_user_fast(
                login_data.email, 
                login_data.password
            )
            
            if not user:
                processing_time = (time.time() - start_time) * 1000
                logger.warning(f"Fast login failed for {login_data.email} in {processing_time:.2f}ms")
                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password"
                )
            
            # Fast token generation
            access_token, refresh_token = create_token_pair(str(user.id), user.email)
            
            # Update last login in background (non-blocking)
            background_tasks.add_task(update_last_login, str(user.id))
            
            # Prepare response
            user_data = {
                "id": str(user.id),
                "email": user.email,
                "username": user.username,
                "role": user.role,
                "is_active": user.is_active,
                "is_verified": user.is_verified
            }
            
            # Format response to match frontend expectations
            response_data = {
                "token": {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer",
                    "expires_in": 3600
                },
                "id": str(user.id),
                "email": user.email,
                "username": user.username,
                "role": user.role,
                "is_verified": user.is_verified,
                "name": user.username or user.email.split('@')[0] if user.email else "",
                "firstName": user.username or "",
                "lastName": "",
                "avatar": ""
            }
        
        processing_time = (time.time() - start_time) * 1000
        
        result = {
            **response_data,
            "performance": {
                "processing_time_ms": round(processing_time, 2),
                "optimized": True,
                "endpoint": "fast_login"
            }
        }
        
        logger.info(f"Fast login successful for {login_data.email} in {processing_time:.2f}ms")
        return resp(result, True, "Login successful", "success")
        
    except HTTPException:
        raise
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Fast login failed in {processing_time:.2f}ms: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/auth/me/fast")
@limiter.limit("100/minute")
@cache_async_result(ttl=300, key_prefix="fast_user_me")  # 5 minute cache
async def get_current_user_fast(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_optimized_db)
):
    """
    Ultra-fast current user retrieval
    Target response time: < 200ms
    """
    start_time = time.time()
    
    try:
        # Fast token verification
        payload = decode_token(credentials.credentials)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = payload.get("uid")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        with OptimizedAuthService(db) as auth_service:
            # Fast user retrieval
            user = await auth_service.get_user_by_id_fast(user_id)
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Prepare response
            user_data = {
                "id": str(user.id),
                "email": user.email,
                "username": user.username,
                "role": user.role,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "updated_at": user.updated_at.isoformat() if user.updated_at else None
            }
        
        processing_time = (time.time() - start_time) * 1000
        
        result = {
            "user": user_data,
            "performance": {
                "processing_time_ms": round(processing_time, 2),
                "optimized": True,
                "endpoint": "fast_me",
                "cached": False  # Will be set to True by cache decorator if cached
            }
        }
        
        logger.info(f"Fast user retrieval completed in {processing_time:.2f}ms")
        return resp(result, True, "User retrieved successfully", "success")
        
    except HTTPException:
        raise
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Fast user retrieval failed in {processing_time:.2f}ms: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

@router.get("/auth/health/fast")
@limiter.limit("200/minute")
async def auth_health_fast(request: Request):
    """Ultra-fast auth service health check"""
    start_time = time.time()
    
    try:
        processing_time = (time.time() - start_time) * 1000
        
        result = {
            "status": "healthy",
            "service": "auth_service_optimized",
            "timestamp": datetime.utcnow().isoformat(),
            "performance": {
                "processing_time_ms": round(processing_time, 2),
                "optimized": True,
                "endpoint": "fast_auth_health"
            }
        }
        
        return resp(result, True, "Auth service is healthy", "success")
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Auth health check failed in {processing_time:.2f}ms: {str(e)}")
        return resp(None, False, str(e), "Auth service health check failed", 500)

# Background task for non-blocking operations
async def update_last_login(user_id: str):
    """Update user's last login timestamp in background"""
    try:
        from core.database import SessionLocal
        
        with SessionLocal() as db:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.last_login = datetime.utcnow()
                db.commit()
                logger.debug(f"Updated last login for user {user_id}")
                
    except Exception as e:
        logger.error(f"Failed to update last login for user {user_id}: {e}")

# Export router
__all__ = ["router"]
