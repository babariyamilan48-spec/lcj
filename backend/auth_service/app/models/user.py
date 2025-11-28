import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    String,
    VARCHAR,
    Index,
    CheckConstraint,
    ForeignKey,
    JSON,
    Integer,
    desc,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from core.database_fixed import Base

class User(Base):
    """
    ✅ OPTIMIZED: User model with proper indexing and VARCHAR fields
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(VARCHAR(255), unique=True, index=True, nullable=False)  # ✅ OPTIMIZED: VARCHAR
    username = Column(VARCHAR(100), nullable=True, index=True)  # ✅ Added index for username lookups
    password_hash = Column(VARCHAR(255), nullable=True)  # ✅ OPTIMIZED: VARCHAR
    is_active = Column(Boolean, nullable=False, default=True, index=True)  # ✅ Added index for filtering
    is_verified = Column(Boolean, nullable=False, default=False, index=True)  # ✅ Added index for filtering
    providers = Column(JSON, nullable=False, server_default='["password"]')
    avatar = Column(VARCHAR(512), nullable=True)  # ✅ OPTIMIZED: VARCHAR
    role = Column(VARCHAR(32), nullable=False, default="user", index=True)  # ✅ Added index for role filtering
    firebase_id = Column(VARCHAR(255), nullable=True, index=True)  # ✅ Added index for Firebase lookups
    device = Column(VARCHAR(255), nullable=True)  # ✅ OPTIMIZED: VARCHAR
    flag = Column(VARCHAR(255), nullable=True)  # ✅ OPTIMIZED: VARCHAR
    payment_completed = Column(Boolean, nullable=False, default=False, index=True)  # ✅ Added index
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)  # ✅ Added index
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # ✅ OPTIMIZED: Indexes for common query patterns
    __table_args__ = (
        Index("ix_users_email_lower", func.lower(email), unique=True),  # Case-insensitive email lookup
        Index("ix_users_active_created", "is_active", desc("created_at")),  # Active users by time
        Index("ix_users_role_active", "role", "is_active"),  # Users by role
        Index("ix_users_verified_created", "is_verified", desc("created_at")),  # Verified users
        CheckConstraint("role IN ('admin','user')", name="ck_users_role_allowed"),
    )

class EmailOTP(Base):
    """
    ✅ OPTIMIZED: Email OTP with proper indexing
    """
    __tablename__ = "email_otp"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(VARCHAR(8), nullable=False)
    purpose = Column(VARCHAR(32), nullable=False, index=True)  # ✅ Added index for filtering
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)  # ✅ Added index for cleanup
    consumed_at = Column(DateTime(timezone=True), nullable=True)

    attempts = Column(Integer, nullable=False, server_default='0')
    
    # ✅ OPTIMIZED: Indexes for common queries
    __table_args__ = (
        Index("ix_emailotp_user_purpose", "user_id", "purpose"),  # User OTPs by purpose
        Index("ix_emailotp_expires_at", "expires_at"),  # Expired OTP cleanup
        CheckConstraint("purpose IN ('verify_email','reset_password')", name="ck_emailotp_purpose"),
    )

class RefreshToken(Base):
    """
    ✅ OPTIMIZED: Refresh tokens with proper indexing
    """
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jti = Column(VARCHAR(64), unique=True, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device = Column(VARCHAR(255), nullable=True)
    is_revoked = Column(Boolean, nullable=False, default=False, index=True)  # ✅ Added index
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)  # ✅ Added index for cleanup
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # ✅ OPTIMIZED: Indexes for all query patterns
    __table_args__ = (
        Index("ix_refresh_user_active", "user_id", postgresql_where=(~(is_revoked))),  # Active tokens
        Index("ix_refresh_expires_at", "expires_at"),  # Expired token cleanup
        Index("ix_refresh_user_created", "user_id", desc("created_at")),  # User tokens by time
    )


class Payment(Base):
    """
    ✅ OPTIMIZED: Payment transaction records with proper indexing
    """
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(VARCHAR(255), nullable=False, index=True)
    payment_id = Column(VARCHAR(255), nullable=True, index=True)
    amount = Column(Integer, nullable=False)  # Amount in paise (e.g., 50000 = ₹500)
    currency = Column(VARCHAR(3), nullable=False, default="INR")
    status = Column(VARCHAR(32), nullable=False, default="created", index=True)  # ✅ Added index
    signature = Column(VARCHAR(255), nullable=True)
    error_message = Column(VARCHAR(512), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)  # ✅ Added index
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # ✅ OPTIMIZED: Indexes for all query patterns
    __table_args__ = (
        Index("ix_payments_user_id", "user_id"),
        Index("ix_payments_order_id", "order_id"),
        Index("ix_payments_payment_id", "payment_id"),
        Index("ix_payments_user_status_created", "user_id", "status", desc("created_at")),  # ✅ CRITICAL
        Index("ix_payments_status_created", "status", desc("created_at")),  # Analytics
        CheckConstraint("status IN ('created','paid','failed')", name="ck_payments_status"),
    )

