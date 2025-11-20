"""
Optimized Auth API with Centralized Session Management
Ensures proper session lifecycle and prevents session leaks
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
import logging
import time
import uuid

from ...schemas.user import SignupInput, UserOut, VerifyEmailRequestInput, VerifyEmailConfirmInput, TokenRefreshInput
from ...schemas.auth import LoginRequest, LoginResponse, UserResponse
from ...services.auth import authenticate_user_with_details, generate_tokens_for_user, register_user, verify_and_consume_otp, get_user_by_email
from core.database_dependencies_singleton import get_user_db, get_db
from core.user_session_singleton import user_session_context
from core.session_manager import get_session_health, force_close_user_sessions
from core.database_pool import optimized_db_pool
from core.cache import cache
from core.email import send_email_sync as send_email, otp_email_html, is_email_configured
from core.rate_limit import limiter
from core.app_factory import resp
from datetime import datetime, timedelta, timezone
import secrets

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Optimized Auth V2"])
security = HTTPBearer()

@router.post("/signup")
@limiter.limit("5/minute")
async def signup_optimized_v2(
    request: Request,
    signup_data: SignupInput,
    background_tasks: BackgroundTasks
):
    """
    Optimized signup with centralized session management
    """
    start_time = time.time()
    
    try:
        with optimized_db_pool.get_session() as session:
            try:
                # Register the user
                user = register_user(session, signup_data)
                
                # Generate tokens
                access_token, refresh_token = generate_tokens_for_user(user, session)
                
                # Prepare user response
                user_out = UserOut(
                    id=str(user.id),
                    email=user.email,
                    username=user.username,
                    avatar=user.avatar,
                    is_verified=user.is_verified,
                    providers=user.providers,
                    role=user.role,
                )
                
                # Cache user session info
                user_id_str = str(user.id)
                cache_key = f"user_session:{user_id_str}"
                session_data = {
                    "user_id": user_id_str,
                    "email": user.email,
                    "is_active": user.is_active,
                    "signup_time": time.time()
                }
                
                try:
                    cache.set(cache_key, session_data, ttl=3600)  # 1 hour
                except Exception as cache_error:
                    logger.warning(f"Failed to cache user session: {cache_error}")
                
                # Log performance
                duration = time.time() - start_time
                logger.info(f"Optimized signup completed in {duration:.3f}s for user {user.email}")
                
                return {
                    "user": user_out.dict(),
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer"
                }
                
            except HTTPException:
                # Re-raise HTTPException from register_user (email/username already taken, etc.)
                raise
            except ValueError as e:
                if "already exists" in str(e):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Email already registered"
                    )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(e)
                )
            except Exception as e:
                logger.error(f"Signup error: {str(e)}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="An error occurred during signup"
                )
    except HTTPException:
        # Re-raise HTTPException from register_user
        raise
    except Exception as e:
        logger.error(f"Session error during signup: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user session"
        )

@router.post("/login")
async def login_optimized_v2(
    login_data: LoginRequest,
    background_tasks: BackgroundTasks
):
    """
    Optimized login with centralized session management
    Ensures proper session cleanup and prevents session leaks
    """
    start_time = time.time()
    
    try:
        # Validate input
        if not login_data.email or not login_data.password:
            raise HTTPException(
                status_code=400,
                detail="Email and password are required"
            )
        
        # Use centralized session manager for authentication
        with optimized_db_pool.get_session() as session:
            try:
                # Authenticate user with detailed error information
                auth_result = authenticate_user_with_details(
                    session, 
                    login_data.email, 
                    login_data.password
                )
                
                if auth_result["status"] == "user_not_found":
                    raise HTTPException(
                        status_code=404,
                        detail="No account found with this email. Please sign up first."
                    )
                elif auth_result["status"] == "incorrect_password":
                    raise HTTPException(
                        status_code=401,
                        detail="Incorrect password. Please try again."
                    )
                elif auth_result["status"] == "inactive_user":
                    raise HTTPException(
                        status_code=403,
                        detail="Your account is inactive. Please contact support."
                    )
                elif auth_result["status"] != "success":
                    raise HTTPException(
                        status_code=401,
                        detail="Authentication failed"
                    )
                
                user = auth_result["user"]
                
                # Generate real tokens
                access_token, refresh_token = generate_tokens_for_user(user, session)
                
                # Cache user session info
                user_id_str = str(user.id)
                cache_key = f"user_session:{user_id_str}"
                session_data = {
                    "user_id": user_id_str,
                    "email": user.email,
                    "is_active": user.is_active,
                    "login_time": time.time()
                }
                
                try:
                    cache.set(cache_key, session_data, ttl=3600)  # 1 hour
                except Exception as cache_error:
                    logger.warning(f"Failed to cache user session: {cache_error}")
                
                # Log performance
                duration = time.time() - start_time
                logger.info(f"Optimized login completed in {duration:.3f}s for user {user.email}")
                
                # Background task to cleanup any orphaned sessions for this user
                background_tasks.add_task(
                    _cleanup_user_sessions_background,
                    user_id_str
                )
                
                # Create response in format expected by frontend
                user_response = UserResponse(
                    id=str(user.id),
                    email=user.email,
                    username=user.username,
                    is_active=user.is_active,
                    is_verified=user.is_verified,
                    role=user.role,
                    avatar=user.avatar,
                    providers=user.providers or ["password"]
                )
                
                # Return wrapped response for frontend compatibility
                return {
                    "success": True,
                    "data": {
                        **user_response.dict(),  # User fields
                        "token": {
                            "access_token": access_token,
                            "refresh_token": refresh_token
                        }
                    }
                }
                
            except HTTPException:
                # Re-raise HTTP exceptions
                raise
            except Exception as e:
                logger.error(f"Authentication error: {e}")
                raise HTTPException(
                    status_code=500,
                    detail="Authentication service temporarily unavailable"
                )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Login service temporarily unavailable"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_optimized_v2(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Get current user with optimized session management
    """
    start_time = time.time()
    
    try:
        # Extract token
        token = credentials.credentials
        
        if not token:
            raise HTTPException(
                status_code=401,
                detail="No token provided"
            )
        
        # Validate JWT token and extract claims
        from auth_service.app.utils.jwt import decode_token
        try:
            claims = decode_token(token)
            if not claims:
                raise ValueError("Token decoding returned None")
            logger.debug(f"Token validation successful, claims: {claims}")
        except Exception as e:
            logger.error(f"Token validation failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token"
            )
        
        # Extract user ID from token claims
        user_id_str = claims.get("uid")
        if not user_id_str:
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing user ID"
            )
        
        try:
            user_uuid = uuid.UUID(user_id_str)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=401,
                detail="Invalid token format"
            )
        
        # Check cache first
        cache_key = f"user_session:{user_id_str}"
        try:
            cached_session = cache.get(cache_key)
            if cached_session:
                logger.debug(f"Using cached session for user {user_id_str}")
                return UserResponse(
                    id=cached_session["user_id"],
                    email=cached_session["email"],
                    username=cached_session["email"],
                    is_active=cached_session["is_active"],
                    is_verified=True,
                    role="user",
                    avatar=None,
                    providers=["password"]
                )
        except Exception as cache_error:
            logger.warning(f"Cache lookup failed: {cache_error}")
        
        # Use database session for user lookup
        try:
            # Import user model
            from ...models.user import User
            
            user = db.query(User).filter(User.id == user_uuid).first()
            
            if not user:
                raise HTTPException(
                    status_code=404,
                    detail="User not found"
                )
            
            if not user.is_active:
                raise HTTPException(
                    status_code=403,
                    detail="User account is inactive"
                )
            
            # Update cache
            session_data = {
                "user_id": user_id_str,
                "email": user.email,
                "is_active": user.is_active,
                "last_access": time.time()
            }
            
            try:
                cache.set(cache_key, session_data, ttl=3600)
            except Exception as cache_error:
                logger.warning(f"Failed to update user session cache: {cache_error}")
            
            # Log performance
            duration = time.time() - start_time
            logger.debug(f"Get current user completed in {duration:.3f}s for user {user.email}")
            
            return UserResponse(
                id=str(user.id),
                email=user.email,
                username=user.username,
                is_active=user.is_active,
                is_verified=user.is_verified,
                role=user.role,
                avatar=user.avatar,
                providers=user.providers or ["password"]
            )
            
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            logger.error(f"User lookup error: {e}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail="User service temporarily unavailable"
            )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Get current user error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Authentication service temporarily unavailable"
        )

@router.post("/logout")
async def logout_optimized_v2(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    background_tasks: BackgroundTasks = None
) -> Dict[str, str]:
    """
    Logout with session cleanup
    """
    try:
        # Extract token
        token = credentials.credentials
        
        if token and token.startswith("access_token_for_"):
            user_id_str = token.replace("access_token_for_", "")
            
            try:
                uuid.UUID(user_id_str)
                
                # Clear user session cache
                cache_key = f"user_session:{user_id_str}"
                try:
                    cache.delete(cache_key)
                    logger.info(f"Cleared session cache for user {user_id_str}")
                except Exception as cache_error:
                    logger.warning(f"Failed to clear session cache: {cache_error}")
                
                # Force close any remaining database sessions for this user
                if background_tasks:
                    background_tasks.add_task(
                        _cleanup_user_sessions_background,
                        user_id_str
                    )
                else:
                    force_close_user_sessions(user_id_str)
                
            except (ValueError, TypeError):
                pass  # Invalid user ID, but still return success
        
        return {"message": "Successfully logged out"}
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        # Return success even on error to avoid revealing information
        return {"message": "Successfully logged out"}

@router.post("/verify-email/request")
@limiter.limit("5/minute")
async def verify_email_request_optimized(
    request: Request,
    payload: VerifyEmailRequestInput,
    background_tasks: BackgroundTasks
):
    """
    Request email verification OTP
    """
    try:
        with optimized_db_pool.get_session() as session:
            user = get_user_by_email(session, payload.email)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User does not exist"
                )
            
            # Import EmailOTP model
            from ...models.user import EmailOTP
            
            # Delete existing OTPs for this user
            session.query(EmailOTP).filter(
                EmailOTP.user_id == user.id,
                EmailOTP.purpose == "verify_email"
            ).delete()
            
            # Create new OTP
            otp = EmailOTP(
                user_id=user.id,
                code=f"{secrets.randbelow(999999):06d}",
                purpose="verify_email",
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
            )
            session.add(otp)
            session.commit()
            
            # Check if email is configured
            if not is_email_configured():
                return resp(
                    message="Email service not configured. Please contact administrator to set up email settings.",
                    status_code=503
                )
            
            # Send verification email
            html = otp_email_html(
                "Verify your email",
                otp.code,
                "This code expires in 10 minutes."
            )
            email_sent = send_email(
                "Verify your email",
                [payload.email],
                html
            )
            
            if not email_sent:
                return resp(
                    message="Failed to send verification email. Please try again later or contact support.",
                    status_code=503
                )
            
            return resp(message="Verification code sent successfully.")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in verify_email_request: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process verification request"
        )

@router.post("/verify-email/confirm")
@limiter.limit("5/minute")
async def verify_email_confirm_optimized(
    request: Request,
    payload: VerifyEmailConfirmInput,
    background_tasks: BackgroundTasks
):
    """
    Confirm email verification with OTP
    """
    try:
        with optimized_db_pool.get_session() as session:
            # Verify and consume OTP
            user = verify_and_consume_otp(
                session,
                payload.email,
                "verify_email",
                payload.otp
            )
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired OTP"
                )
            
            # Mark user as verified
            user.is_verified = True
            session.add(user)
            session.commit()
            
            # Clear any cached session data for this user
            try:
                cache_key = f"user_session:{str(user.id)}"
                cache.delete(cache_key)
            except Exception as cache_error:
                logger.warning(f"Failed to clear cache: {cache_error}")
            
            return resp(message="Email verified successfully.")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in verify_email_confirm: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify email"
        )

@router.get("/health")
async def auth_health_check_optimized_v2() -> Dict[str, Any]:
    """
    Health check for optimized auth service
    """
    start_time = time.time()
    
    try:
        # Get session health
        session_health = get_session_health()
        
        # Test database connection
        connection_test = False
        try:
            with optimized_db_pool.get_session() as session:
                from sqlalchemy import text
                result = session.execute(text("SELECT 1")).scalar()
                connection_test = (result == 1)
        except Exception as db_error:
            logger.warning(f"Database health check failed: {db_error}")
        
        # Basic service health
        service_health = {
            "service": "optimized_auth_v2",
            "status": "healthy" if connection_test else "warning",
            "database_connection": connection_test,
            "response_time_ms": round((time.time() - start_time) * 1000, 2),
            "timestamp": time.time()
        }
        
        # Combine health data
        health_data = {
            **service_health,
            "session_manager": session_health
        }
        
        # Determine overall status
        if session_health.get("status") != "healthy" or not connection_test:
            health_data["status"] = "warning"
            issues = session_health.get("issues", [])
            if not connection_test:
                issues.append("Database connection failed")
            health_data["issues"] = issues
        
        return health_data
        
    except Exception as e:
        logger.error(f"Auth health check failed: {e}")
        return {
            "service": "optimized_auth_v2",
            "status": "error",
            "error": str(e),
            "response_time_ms": round((time.time() - start_time) * 1000, 2),
            "timestamp": time.time()
        }

# Background task functions
async def _cleanup_user_sessions_background(user_id: str):
    """Background task to cleanup user sessions"""
    try:
        # Small delay to allow main operation to complete
        import asyncio
        await asyncio.sleep(1)
        
        # Force cleanup of any remaining sessions for this user
        force_close_user_sessions(user_id)
        logger.debug(f"Background auth session cleanup completed for user {user_id}")
        
    except Exception as e:
        logger.warning(f"Background auth session cleanup failed for user {user_id}: {e}")

# Fast endpoint aliases for backward compatibility
@router.post("/login/fast")
async def login_fast_alias(
    login_data: LoginRequest,
    background_tasks: BackgroundTasks
):
    """
    Fast login endpoint - alias for the main optimized login
    """
    return await login_optimized_v2(login_data, background_tasks)

@router.get("/me/fast", response_model=UserResponse)
async def get_current_user_fast_alias(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    background_tasks: BackgroundTasks = None
) -> UserResponse:
    """
    Fast get current user endpoint - alias for the main optimized endpoint
    """
    return await get_current_user_optimized_v2(credentials, background_tasks)

@router.post("/logout/fast")
async def logout_fast_alias(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    background_tasks: BackgroundTasks = None
) -> Dict[str, str]:
    """
    Fast logout endpoint - alias for the main optimized logout
    """
    return await logout_optimized_v2(credentials, background_tasks)

@router.get("/health/fast")
async def auth_health_check_fast_alias() -> Dict[str, Any]:
    """
    Fast health check endpoint - alias for the main health check
    """
    return await auth_health_check_optimized_v2()

@router.post("/token/refresh")
@limiter.limit("10/minute")
async def refresh_token_optimized(
    request: Request,
    payload: TokenRefreshInput,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Refresh access token using refresh token
    """
    try:
        refresh_token_value = payload.refresh_token
        if not refresh_token_value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token is required"
            )
        
        # Import required functions
        from auth_service.app.services.auth import validate_refresh_token, generate_tokens_for_user
        from auth_service.app.models.user import RefreshToken, User
        from datetime import datetime, timezone
        
        # Validate refresh token JWT
        claims = validate_refresh_token(refresh_token_value)
        jti = claims.get("jti")
        uid = claims.get("uid")
        
        if not jti or not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Check DB token
        rt = db.query(RefreshToken).filter(
            RefreshToken.jti == jti, 
            RefreshToken.is_revoked.is_(False)
        ).first()
        
        if not rt or str(rt.user_id) != uid or rt.expires_at <= datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        # Get user
        user = db.query(User).filter(User.id == rt.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Revoke old refresh token
        rt.is_revoked = True
        db.add(rt)
        db.commit()
        
        # Generate new token pair - this will create a new refresh token and commit
        try:
            access_token, new_refresh_token = generate_tokens_for_user(user, db)
            
            return resp(
                {
                    "token": {
                        "access_token": access_token,
                        "refresh_token": new_refresh_token
                    }
                },
                message="Token refreshed successfully"
            )
        except Exception as token_error:
            logger.error(f"Error generating new tokens: {token_error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate new tokens"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refresh token"
        )
