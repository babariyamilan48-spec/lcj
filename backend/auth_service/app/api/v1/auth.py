from datetime import datetime, timedelta, timezone
import secrets
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from core.database_dependencies_singleton import get_user_db, get_db
from auth_service.app.deps.auth import get_current_user
from core.app_factory import resp
from auth_service.app.schemas.user import (
    SignupInput,
    LoginInput,
    Token,
    UserOut,
    TokenRefreshInput,
    ForgotPasswordInput,
    ResetPasswordInput,
    ChangePasswordInput,
    VerifyEmailRequestInput,
    VerifyEmailConfirmInput,
    LogoutInput,
)
from auth_service.app.services.auth import (
    register_user,
    authenticate_user,
    authenticate_user_with_details,
    generate_tokens_for_user,
    ensure_password_provider,
    check_user_login_eligibility,
    issue_reset_otp,
    verify_and_consume_otp,
    get_user_by_email,
    verify_google_token,
    upsert_user_from_google,
    validate_refresh_token,
    update_profile,
    change_password as svc_change_password,
    delete_account as svc_delete_account,
)
from auth_service.app.utils.jwt import get_password_hash
from core.rate_limit import limiter
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/signup")
@limiter.limit("5/minute")
async def signup(request: Request, payload: SignupInput, db: Session = Depends(get_db)):
    try:
        user = register_user(db, payload)
        out = UserOut(
            id=str(user.id),
            email=user.email,
            username=user.username,
            avatar=user.avatar,
            is_verified=user.is_verified,
            providers=user.providers,
            role=user.role,
        )
        response = resp(out.model_dump(), message="Account created. Please verify your email.")
        return response
    except Exception as e:
        raise

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, payload: LoginInput, db: Session = Depends(get_db)):
    user, error_type = authenticate_user_with_details(db, payload.email, payload.password)

    if not user:
        if error_type == 'user_not_found':
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email. Please sign up first."
            )
        elif error_type == 'google_only':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account was created with Google. Please sign in with Google."
            )
        elif error_type == 'incorrect_password':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password. Please try again."
            )
        elif error_type == 'inactive_user':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is inactive. Please contact support."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login failed. Please check your credentials."
            )

    ensure_password_provider(user)
    check_user_login_eligibility(user)
    access_token, refresh_token = generate_tokens_for_user(user, db)
    
    # CRITICAL FIX: Clear all cache for this user on login
    user_id_str = str(user.id)
    from core.cache import cache
    cache_keys_to_clear = [
        f"user_session:{user_id_str}",
        f"user_profile:get_user_profile:{user_id_str}",
        f"fast_user_me:get_current_user_fast:{user_id_str}",
        f"user_results:{user_id_str}",
        f"user_analytics:{user_id_str}",
    ]
    for cache_key in cache_keys_to_clear:
        try:
            cache.delete(cache_key)
            logger.info(f"Cleared cache on login: {cache_key}")
        except Exception as cache_error:
            logger.warning(f"Failed to clear cache {cache_key}: {cache_error}")
    
    out = UserOut(
        id=str(user.id),
        email=user.email,
        username=user.username,
        avatar=user.avatar,
        is_verified=user.is_verified,
        providers=user.providers,
        role=user.role,
    )
    return resp({**out.model_dump(), "token": Token(access_token=access_token, refresh_token=refresh_token).model_dump()}, message="You have successfully logged in.")

@router.post("/token/refresh")
@limiter.limit("10/minute")
async def refresh_token(request: Request, payload: TokenRefreshInput, db: Session = Depends(get_db)):
    try:
        claims = validate_refresh_token(payload.refresh_token)
        jti = claims.get("jti")
        uid = claims.get("uid")
        if not jti or not uid:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        # Check DB token
        from auth_service.app.models.user import RefreshToken

        rt = db.query(RefreshToken).filter(RefreshToken.jti == jti, RefreshToken.is_revoked.is_(False)).first()
        if not rt or str(rt.user_id) != uid or rt.expires_at <= datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        # Issue a new pair and rotate refresh token
        from auth_service.app.models.user import User

        user = db.query(User).filter(User.id == rt.user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        rt.is_revoked = True
        db.add(rt)
        db.commit()
        
        # Generate new tokens - this will create a new refresh token and commit
        try:
            access_token, refresh_token = generate_tokens_for_user(user, db)
            return resp({"token": Token(access_token=access_token, refresh_token=refresh_token).model_dump()}, message="Token refreshed.")
        except Exception as token_error:
            logger.error(f"Error generating new tokens: {token_error}")
            raise HTTPException(status_code=500, detail="Failed to generate new tokens")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(status_code=500, detail="Failed to refresh token")

@router.post("/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(request: Request, payload: ForgotPasswordInput, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User does not exist")
    issue_reset_otp(db, user)
    return resp(message="Reset code sent to your email.")

@router.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password(request: Request, payload: ResetPasswordInput, db: Session = Depends(get_db)):
    user = verify_and_consume_otp(db, payload.email, "reset_password", payload.otp)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")
    user.password_hash = get_password_hash(payload.new_password)
    db.add(user)
    db.commit()
    return resp(message="Password has been reset.")

@router.post("/verify-email/request")
@limiter.limit("5/minute")
async def verify_email_request(request: Request, payload: VerifyEmailRequestInput, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User does not exist")
    # Create verify_email OTP
    from auth_service.app.models.user import EmailOTP
    db.query(EmailOTP).filter(EmailOTP.user_id == user.id, EmailOTP.purpose == "verify_email").delete()
    otp = EmailOTP(
        user_id=user.id,
        code=f"{secrets.randbelow(999999):06d}",
        purpose="verify_email",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    )
    db.add(otp)
    db.commit()
    # Send email (prints if skipped)
    from core.email import send_email_sync, otp_email_html, is_email_configured

    if not is_email_configured():
        return resp(
            message="Email service not configured. Please contact administrator to set up email settings.",
            status_code=503
        )

    html = otp_email_html("Verify your email", otp.code, "This code expires in 10 minutes.")
    email_sent = send_email_sync("Verify your email", [payload.email], html)

    if not email_sent:
        return resp(
            message="Failed to send verification email. Please try again later or contact support.",
            status_code=503
        )

    return resp(message="Verification code sent successfully.")

@router.post("/verify-email/confirm")
@limiter.limit("5/minute")
async def verify_email_confirm(request: Request, payload: VerifyEmailConfirmInput, db: Session = Depends(get_db)):
    user = verify_and_consume_otp(db, payload.email, "verify_email", payload.otp)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")
    user.is_verified = True
    db.add(user)
    db.commit()
    return resp(message="Email verified.")

@router.get("/me")
async def me(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    out = UserOut(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        avatar=current_user.avatar,
        is_verified=current_user.is_verified,
        providers=current_user.providers,
        role=current_user.role,
    )
    return resp(out.model_dump())

@router.post("/change-password")
async def change_password(payload: ChangePasswordInput, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    print(f"Password change endpoint reached for user: {current_user.email}")  # Debug log
    print(f"Payload: old_password='{payload.old_password}', new_password='{payload.new_password}'")  # Debug log

    if payload.old_password == payload.new_password:
        print("Error: New password same as old password")  # Debug log
        raise HTTPException(status_code=400, detail="New password must differ from old password")

    try:
        from auth_service.app.services.auth import change_password as svc_change_password
        print("Calling service change_password function...")  # Debug log
        svc_change_password(db, current_user, payload.old_password, payload.new_password)
        print("Password change successful!")  # Debug log
        return resp(message="Password changed.")
    except Exception as e:
        print(f"Error in change_password service: {e}")  # Debug log
        raise

@router.post("/logout")
async def logout(payload: Optional[LogoutInput] = None, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    # Revoke provided refresh token; if none, revoke all tokens for this user
    from auth_service.app.models.user import RefreshToken
    from core.cache import cache
    
    user_id = str(current_user.id)
    
    if payload and payload.refresh_token:
        claims = validate_refresh_token(payload.refresh_token)
        jti = claims.get("jti")
        if jti:
            db.query(RefreshToken).filter(RefreshToken.jti == jti).update({RefreshToken.is_revoked: True})
            db.commit()
    else:
        db.query(RefreshToken).filter(RefreshToken.user_id == current_user.id, RefreshToken.is_revoked.is_(False)).update({RefreshToken.is_revoked: True})
        db.commit()
    
    # CRITICAL FIX: Clear ALL user-related caches on logout
    cache_keys_to_clear = [
        f"user_session:{user_id}",
        f"user_profile:get_user_profile:{user_id}",  # Profile cache
        f"fast_user_me:get_current_user_fast:{user_id}",  # Fast user cache
        f"user_results:{user_id}",  # Results cache
        f"user_analytics:{user_id}",  # Analytics cache
    ]
    
    for cache_key in cache_keys_to_clear:
        try:
            cache.delete(cache_key)
            logger.info(f"Cleared cache: {cache_key}")
        except Exception as cache_error:
            logger.warning(f"Failed to clear cache {cache_key}: {cache_error}")
    
    return resp(message="Logged out successfully")

@router.post("/google")
@limiter.limit("5/minute")
async def google_login(
    request: Request,
    id_token_query: str | None = Query(default=None, alias="id_token"),
):
    token = id_token_query
    if not token:
        # Try to parse JSON body: { "id_token": "..." }
        try:
            body = await request.json()
            if isinstance(body, dict):
                token = body.get("id_token")
        except Exception:
            token = None
    if not token:
        raise HTTPException(status_code=400, detail="Missing Firebase ID token")
    
    try:
        claims = verify_google_token(token)
        if not claims:
            logger.error("Firebase verification returned None - credentials may not be loaded")
            raise HTTPException(status_code=401, detail="Invalid Firebase ID token")
    except Exception as e:
        logger.error(f"Firebase verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Firebase verification failed: {str(e)}")
    
    # Get user email from claims for session management
    user_email = claims.get("email", "google-user")
    from core.database_dependencies_singleton import get_user_db as get_user_db_func
    from core.user_session_singleton import user_session_context
    
    with user_session_context(user_email) as db:
        user = upsert_user_from_google(db, claims)
        access_token, refresh_token = generate_tokens_for_user(user, db)
    
    # CRITICAL FIX: Clear all cache for this user on login
    user_id_str = str(user.id)
    from core.cache import cache
    cache_keys_to_clear = [
        f"user_session:{user_id_str}",
        f"user_profile:get_user_profile:{user_id_str}",
        f"fast_user_me:get_current_user_fast:{user_id_str}",
        f"user_results:{user_id_str}",
        f"user_analytics:{user_id_str}",
    ]
    for cache_key in cache_keys_to_clear:
        try:
            cache.delete(cache_key)
            logger.info(f"Cleared cache on Google login: {cache_key}")
        except Exception as cache_error:
            logger.warning(f"Failed to clear cache {cache_key}: {cache_error}")
    
    out = UserOut(
        id=str(user.id),
        email=user.email,
        username=user.username,
        avatar=user.avatar,
        is_verified=user.is_verified,
        providers=user.providers,
        role=user.role,
    )
    return resp({**out.model_dump(), "token": Token(access_token=access_token, refresh_token=refresh_token).model_dump()}, message="Logged in with Google")

@router.post("/profile")
async def profile_update(username: Optional[str] = None, avatar: Optional[str] = None, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    from auth_service.app.services.auth import update_profile
    user = update_profile(db, current_user, username, avatar)
    out = UserOut(
        id=str(user.id),
        email=user.email,
        username=user.username,
        avatar=user.avatar,
        is_verified=user.is_verified,
        providers=user.providers,
        role=user.role,
    )
    return resp(out.model_dump(), message="Profile updated.")

@router.delete("/delete-account")
async def delete_account(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    from auth_service.app.services.auth import delete_account as svc_delete_account
    svc_delete_account(db, current_user)
    return resp(message="Account deleted.")
