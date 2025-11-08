from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Any, Optional, Union
from dotenv import load_dotenv, find_dotenv

class Settings(BaseSettings):
    # App
    title: str = "LCJ Backend"
    description: str = "LCJ Microservices"
    version: str = "1.0.0"
    debug: bool = True

    # CORS
    allowed_hosts: List[str] = ["*"]

    # Database
    DATABASE_URL: str = "postgresql+psycopg2://lcj_user:lcj_password@localhost:5432/lcj"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    
    # Supabase Configuration
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # Additional production settings
    @property
    def environment(self) -> str:
        """Alias for ENVIRONMENT for backward compatibility"""
        return self.ENVIRONMENT

    # Security / Password policy
    PASSWORD_MIN_LENGTH: int = 8

    # JWT (kept in env but exposed for convenience if needed elsewhere)
    SECRET_KEY: Optional[str] = None
    ACCESS_TOKEN_EXPIRE_MINUTES: Optional[int] = None
    REFRESH_TOKEN_EXPIRE_DAYS: Optional[int] = None

    # SMTP / Email (optional; if unset, email sending is skipped)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: Optional[str] = None

    # Google / Firebase (uses backend/credential.json)

    # Pydantic v2 settings config
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("allowed_hosts", mode="before")
    @classmethod
    def parse_allowed_hosts(cls, v: Any) -> List[str]:
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            s = v.strip()
            # Try JSON-style list
            if s.startswith("[") and s.endswith("]"):
                try:
                    import json

                    parsed = json.loads(s)
                    if isinstance(parsed, list):
                        return [str(x) for x in parsed]
                except Exception:
                    pass
            # Comma-separated fallback
            return [x.strip() for x in s.split(",") if x.strip()]
        # default
        return ["*"]

load_dotenv(find_dotenv(filename=".env", usecwd=True))
settings = Settings()

