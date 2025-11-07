from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from core.config.settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def _encode_token(claims: Dict[str, Any]) -> str:
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
