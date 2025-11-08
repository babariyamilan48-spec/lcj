from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class SignupInput(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")
    username: Optional[str] = None

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