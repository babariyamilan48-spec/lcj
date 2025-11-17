"""
Authentication schemas for optimized auth endpoints
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str = Field(..., min_length=1, description="Password is required")

class LoginResponse(BaseModel):
    """Login response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    """User response schema"""
    id: str
    email: EmailStr
    username: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    role: str = "user"
    avatar: Optional[str] = None
    providers: Optional[list] = ["password"]

class TokenRefreshRequest(BaseModel):
    """Token refresh request schema"""
    refresh_token: str

class TokenRefreshResponse(BaseModel):
    """Token refresh response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class LogoutRequest(BaseModel):
    """Logout request schema"""
    refresh_token: Optional[str] = None

class LogoutResponse(BaseModel):
    """Logout response schema"""
    message: str = "Successfully logged out"

# Update forward references
LoginResponse.model_rebuild()
