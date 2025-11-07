import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    String,
    Index,
    CheckConstraint,
    ForeignKey,
    JSON,
    Integer,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), nullable=True)
    password_hash = Column(String(255), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    providers = Column(JSON, nullable=False, server_default='["password"]')
    avatar = Column(String(512), nullable=True)
    role = Column(String(32), nullable=False, default="user")
    firebase_id = Column(String(255), nullable=True)
    device = Column(String(255), nullable=True)
    flag = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_users_email_lower", func.lower(email), unique=True),
        CheckConstraint("role IN ('admin','user')", name="ck_users_role_allowed"),
    )

class EmailOTP(Base):
    __tablename__ = "email_otp"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(8), nullable=False)
    purpose = Column(String(32), nullable=False)  # verify_email | reset_password
    expires_at = Column(DateTime(timezone=True), nullable=False)
    consumed_at = Column(DateTime(timezone=True), nullable=True)

    attempts = Column(Integer, nullable=False, server_default='0')
    __table_args__ = (
        CheckConstraint("purpose IN ('verify_email','reset_password')", name="ck_emailotp_purpose"),
    )

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jti = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device = Column(String(255), nullable=True)
    is_revoked = Column(Boolean, nullable=False, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        Index("ix_refresh_user_active", user_id, postgresql_where=(~(is_revoked))),
    )

