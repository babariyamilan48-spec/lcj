from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class SignupInput(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128, description="Password must be at least 6 characters long")
    username: Optional[str] = Field(None, max_length=100, description="Username must be less than 100 characters")
    
    @validator('password')
    def validate_password(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Password cannot be empty')
        return v.strip()
    
    @validator('username')
    def validate_username(cls, v):
        if v is not None and len(v.strip()) == 0:
            return None  # Convert empty string to None
        return v.strip() if v else None
    
    @validator('email')
    def validate_email(cls, v):
        if not v or len(str(v).strip()) == 0:
            raise ValueError('Email cannot be empty')
        return str(v).strip().lower()

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class TokenRefreshInput(BaseModel):
    refresh_token: str

class LogoutInput(BaseModel):
    refresh_token: str | None = None

class ForgotPasswordInput(BaseModel):
    email: EmailStr

class ResetPasswordInput(BaseModel):
    email: EmailStr
    otp: str
    new_password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")

class ChangePasswordInput(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")

class VerifyEmailRequestInput(BaseModel):
    email: EmailStr

class VerifyEmailConfirmInput(BaseModel):
    email: EmailStr
    otp: str

class UserOut(BaseModel):
    id: str
    email: EmailStr
    username: Optional[str] = None
    avatar: Optional[str] = None
    is_verified: bool
    providers: List[str]
    role: str