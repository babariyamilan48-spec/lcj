from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from core.database_fixed import get_db
from auth_service.app.utils.jwt import decode_token
from auth_service.app.models.user import User

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    auth_header: Optional[str] = request.headers.get("Authorization")
    print(f"Auth header: {auth_header}")  # Debug log
    if not auth_header or not auth_header.startswith("Bearer "):
        print("Missing or invalid bearer token format")  # Debug log
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = auth_header.split(" ", 1)[1]
    print(f"Extracted token: {token[:50]}...")  # Debug log (first 50 chars)
    try:
        payload = decode_token(token)
        print(f"Decoded payload: {payload}")  # Debug log
    except Exception as e:
        print(f"Token decode error: {e}")  # Debug log
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token decode failed")
    if not payload or payload.get("type") != "access":
        print(f"Invalid payload or token type: {payload}")  # Debug log
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    user_id = payload.get("uid")
    print(f"User ID from token: {user_id}")  # Debug log
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    user = db.query(User).filter(User.id == user_id).first()
    print(f"User found: {user.email if user else 'None'}")  # Debug log
    if not user or not user.is_active:
        print(f"User not found or inactive: {user}")  # Debug log
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user

def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current user and ensure they have admin role"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Admin access required"
        )
    return current_user
