from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timedelta, timezone
import secrets

from auth_service.app.models.user import User, EmailOTP
from auth_service.app.schemas.user import SignupInput
from auth_service.app.utils.jwt import get_password_hash, verify_password, create_token_pair, decode_token
from core.config import settings
from core.firebase import verify_firebase_id_token
from core.email import send_email, otp_email_html, is_email_configured
from auth_service.app.models.user import RefreshToken
import uuid

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def ensure_password_provider(user: User) -> None:
    if user.providers == ["google.com"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please sign in with Google")

def check_user_login_eligibility(user: User) -> None:
    if not user.is_verified:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email not verified")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

def register_user(db: Session, payload: SignupInput) -> User:
    print(f"[REGISTER] Starting registration for email: {payload.email}")
    
    # Test database connectivity
    try:
        print(f"[REGISTER] Testing database connectivity...")
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        print(f"[REGISTER] Database connection OK")
    except Exception as e:
        print(f"[REGISTER] Database connection failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database connection failed")
    
    print(f"[REGISTER] Checking for existing user...")
    existing = get_user_by_email(db, payload.email)
    if existing:
        print(f"[REGISTER] Email already exists: {payload.email}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    if len(payload.password) < settings.PASSWORD_MIN_LENGTH:
        print(f"[REGISTER] Password too short: {len(payload.password)} < {settings.PASSWORD_MIN_LENGTH}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password too short")

    print(f"[REGISTER] Creating user with email: {payload.email}, username: {payload.username}")
    
    try:
        print(f"[REGISTER] Creating User object...")
        user = User(
            email=payload.email,
            username=payload.username,
            password_hash=get_password_hash(payload.password),
            providers=["password"],
            role="user",
        )
        print(f"[REGISTER] Adding user to database...")
        db.add(user)
        print(f"[REGISTER] Committing user to database...")
        db.commit()
        print(f"[REGISTER] Refreshing user object...")
        db.refresh(user)
        print(f"[REGISTER] User created with ID: {user.id}")
    except Exception as e:
        print(f"[REGISTER] Database error during user creation: {e}")
        print(f"[REGISTER] Exception type: {type(e)}")
        import traceback
        print(f"[REGISTER] Full traceback: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create user")
    print(f"[REGISTER] Creating OTP for user...")
    try:
        otp = EmailOTP(
            user_id=user.id,
            code=f"{secrets.randbelow(999999):06d}",
            purpose="verify_email",
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
        )
        print(f"[REGISTER] Adding OTP to database...")
        db.add(otp)
        print(f"[REGISTER] Committing OTP...")
        db.commit()
        print(f"[REGISTER] OTP created: {otp.code}")
    except Exception as e:
        print(f"[REGISTER] Error creating OTP: {e}")
        import traceback
        print(f"[REGISTER] OTP traceback: {traceback.format_exc()}")
        return user
    
    # send verification email (mailer prints whether it was sent or skipped)
    print(f"[REGISTER] Preparing to send verification email...")
    html = otp_email_html("Verify your email", otp.code, "This code expires in 10 minutes.")
    import anyio
    
    print(f"[REGISTER] Checking email configuration...")
    if not is_email_configured():
        # Still create the user but warn about email configuration
        print(f"[AUTH] ⚠️ User {payload.email} registered but verification email not sent - SMTP not configured")
        print(f"[AUTH] 💡 Please set SMTP_USER, SMTP_PASSWORD, and SMTP_FROM environment variables")
        return user
    
    print(f"[REGISTER] Email is configured, attempting to send...")
    try:
        email_sent = anyio.from_thread.run(send_email, "Verify your email", [payload.email], html)
        print(f"[REGISTER] Email send result: {email_sent}")
        if not email_sent:
            print(f"[AUTH] ⚠️ User {payload.email} registered but verification email failed to send")
    except Exception as e:
        print(f"[AUTH] ⚠️ User {payload.email} registered but verification email error: {e}")
        print(f"[AUTH] 💡 Check your SMTP configuration, especially SMTP_FROM email address")
        import traceback
        print(f"[AUTH] Email error traceback: {traceback.format_exc()}")
    
    print(f"[REGISTER] Registration process completed for {payload.email}")
    return user

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash or ""):
        return None
    if not user.is_active:
        return None
    return user

def authenticate_user_with_details(db: Session, email: str, password: str) -> tuple[Optional[User], str]:
    """
    Authenticate user and return detailed error information
    Returns: (user, error_type) where error_type can be 'user_not_found', 'incorrect_password', 'inactive_user', or 'success'
    """
    user = get_user_by_email(db, email)
    if not user:
        return None, 'user_not_found'
    if not verify_password(password, user.password_hash or ""):
        return None, 'incorrect_password'
    if not user.is_active:
        return None, 'inactive_user'
    return user, 'success'

def generate_tokens_for_user(user: User, db: Session, device: str | None = None):
    # Create DB refresh token record
    jti = uuid.uuid4().hex
    rt = RefreshToken(
        jti=jti,
        user_id=user.id,
        device=device,
        expires_at=datetime.now(timezone.utc) + timedelta(days=int(settings.REFRESH_TOKEN_EXPIRE_DAYS or 7)),
    )
    db.add(rt)
    db.commit()
    return create_token_pair(user_id=str(user.id), email=user.email, refresh_jti=jti)

def issue_reset_otp(db: Session, user: Optional[User]) -> None:
    if not user:
        # Privacy mode: don't reveal account existence, but print for dev visibility
        try:
            print("[EMAIL] Forgot-password requested for non-existent email. Privacy mode: not sending.")
        except Exception:
            pass
        return
    db.query(EmailOTP).filter(EmailOTP.user_id == user.id, EmailOTP.purpose == "reset_password").delete()
    otp = EmailOTP(
        user_id=user.id,
        code=f"{secrets.randbelow(999999):06d}",
        purpose="reset_password",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    )
    db.add(otp)
    db.commit()
    if user:
        try:
            print(f"[EMAIL] Generated reset OTP {otp.code} for {user.email}")
        except Exception:
            pass
        html = otp_email_html("Reset your password", otp.code, "Enter this code to reset your password.")
        import anyio
        
        if not is_email_configured():
            print(f"[AUTH] ⚠️ Password reset requested for {user.email} but SMTP not configured")
            return
            
        email_sent = anyio.from_thread.run(send_email, "Reset your password", [user.email], html)
        if not email_sent:
            print(f"[AUTH] ⚠️ Password reset email failed to send to {user.email}")

def verify_and_consume_otp(db: Session, email: str, purpose: str, code: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    otp = (
        db.query(EmailOTP)
        .filter(EmailOTP.user_id == user.id, EmailOTP.purpose == purpose, EmailOTP.consumed_at.is_(None))
        .order_by(EmailOTP.expires_at.desc())
        .first()
    )
    if not otp:
        return None
    now = datetime.now(timezone.utc)
    if otp.expires_at <= now or otp.code != code:
        # increment attempts and optionally lockout
        try:
            current_attempts = int(getattr(otp, "attempts", "0") or 0)
        except Exception:
            current_attempts = 0
        current_attempts += 1
        otp.attempts = str(current_attempts)
        if current_attempts >= 5:
            otp.consumed_at = now  # invalidate on too many failures
        db.add(otp)
        db.commit()
        return None
    otp.consumed_at = now
    db.add(otp)
    db.commit()
    return user

def verify_google_token(id_token: str) -> Optional[dict]:
    # Only Firebase verification
    return verify_firebase_id_token(id_token)

def upsert_user_from_google(db: Session, claims: dict) -> User:
    email = claims.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email not present in token")
    user = get_user_by_email(db, email)
    if not user:
        user = User(
            email=email,
            username=claims.get("name"),
            avatar=claims.get("picture"),
            is_verified=True,
            providers=["google.com"],
            role="user",
            firebase_id=claims.get("user_id") or claims.get("sub"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    # ensure provider includes google.com
    providers = user.providers or []
    if "google.com" not in providers:
        providers.append("google.com")
        user.providers = providers
    # update profile fields
    user.username = user.username or claims.get("name")
    user.avatar = user.avatar or claims.get("picture")
    user.is_verified = True
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def validate_refresh_token(refresh_token: str) -> dict:
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    return payload

def update_profile(db: Session, user: User, username: Optional[str], avatar: Optional[str]) -> User:
    if username is not None:
        user.username = username
    if avatar is not None:
        user.avatar = avatar
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def change_password(db: Session, user: User, old_password: str, new_password: str) -> None:
    print(f"Changing password for user: {user.email}")  # Debug log
    print(f"User has password_hash: {bool(user.password_hash)}")  # Debug log
    
    if not user.password_hash:
        print("Error: Password auth not enabled")  # Debug log
        raise HTTPException(status_code=400, detail="Password auth is not enabled for this account")
    
    print(f"Verifying old password...")  # Debug log
    password_valid = verify_password(old_password, user.password_hash)
    print(f"Old password verification result: {password_valid}")  # Debug log
    
    if not password_valid:
        print("Error: Old password verification failed")  # Debug log
        raise HTTPException(status_code=401, detail="Incorrect old password")
    
    print("Setting new password hash...")  # Debug log
    user.password_hash = get_password_hash(new_password)
    db.add(user)
    db.commit()
    print("Password change completed successfully")  # Debug log

def delete_account(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()

