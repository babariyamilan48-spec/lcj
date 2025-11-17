from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
import os
from core.config.settings import settings

# Try to import JWT and password hashing libraries, handle gracefully if not available
try:
    from jose import JWTError, jwt
    JWT_AVAILABLE = True
except ImportError:
    print("[JWT] ⚠️ python-jose not available. JWT functionality will be disabled.")
    JWT_AVAILABLE = False
    JWTError = Exception
    jwt = None

try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    PASSLIB_AVAILABLE = True
except ImportError:
    print("[JWT] ⚠️ passlib not available. Password hashing will be disabled.")
    PASSLIB_AVAILABLE = False
    pwd_context = None

# Pull from env or shared settings with sane fallbacks so app boots even if env is incomplete
SECRET_KEY = os.getenv("SECRET_KEY") or (settings.SECRET_KEY or "change-this-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES") or (settings.ACCESS_TOKEN_EXPIRE_MINUTES or 15)
)
REFRESH_TOKEN_EXPIRE_DAYS = int(
    os.getenv("REFRESH_TOKEN_EXPIRE_DAYS") or (settings.REFRESH_TOKEN_EXPIRE_DAYS or 7)
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not PASSLIB_AVAILABLE or not pwd_context:
        print("[JWT] ⚠️ Password verification not available - passlib not installed")
        return False
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    if not PASSLIB_AVAILABLE or not pwd_context:
        print("[JWT] ⚠️ Password hashing not available - passlib not installed")
        return "HASHING_NOT_AVAILABLE"
    return pwd_context.hash(password)

def _encode_token(claims: Dict[str, Any]) -> str:
    if not JWT_AVAILABLE or not jwt:
        print("[JWT] ⚠️ JWT encoding not available - python-jose not installed")
        return "JWT_NOT_AVAILABLE"
    return jwt.encode(claims, SECRET_KEY, algorithm=ALGORITHM)

def create_token_pair(user_id: str, email: str, refresh_jti: Optional[str] = None) -> Tuple[str, str]:
    now = datetime.now(timezone.utc)
    access_claims = {
        "sub": email,
        "uid": user_id,
        "type": "access",
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    refresh_claims = {
        "sub": email,
        "uid": user_id,
        "type": "refresh",
        "exp": now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    }
    if refresh_jti:
        refresh_claims["jti"] = refresh_jti
    return _encode_token(access_claims), _encode_token(refresh_claims)

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    if not JWT_AVAILABLE or not jwt:
        print("[JWT] ⚠️ JWT decoding not available - python-jose not installed")
        return None
    
    try:
        print(f"Decoding token with SECRET_KEY: {SECRET_KEY[:10]}...")  # Debug log
        print(f"Using algorithm: {ALGORITHM}")  # Debug log
        result = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Successfully decoded token: {result}")  # Debug log
        return result
    except JWTError as e:
        print(f"JWT decode error: {e}")  # Debug log
        print(f"Token being decoded: {token[:50]}...")  # Debug log
        return None
