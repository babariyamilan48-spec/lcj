from sqlalchemy import Column, Integer, String, VARCHAR, DateTime, ForeignKey, Boolean, Index, desc
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database_fixed import Base

class AIInsights(Base):
    """
    ✅ OPTIMIZED: AI insights with JSONB instead of TEXT and proper indexing
    """
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)  # ✅ Added FK
    insights_type = Column(VARCHAR(100), default="comprehensive", index=True)
    insights_data = Column(JSON, nullable=False)  # ✅ OPTIMIZED: JSON instead of TEXT
    model_used = Column(VARCHAR(50), nullable=True, index=True)
    confidence_score = Column(Integer, nullable=True, index=True)
    status = Column(VARCHAR(50), default="completed", index=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)  # ✅ timezone-aware
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)  # ✅ timezone-aware
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Metadata for tracking
    test_results_used = Column(JSON, nullable=True)  # ✅ OPTIMIZED: JSON instead of TEXT
    generation_duration = Column(Integer, nullable=True, index=True)
    
    # ✅ OPTIMIZED: Critical indexes for all query patterns
    __table_args__ = (
        Index('idx_ai_insights_user_type_created', 'user_id', 'insights_type', desc('created_at')),  # ✅ CRITICAL
        Index('idx_ai_insights_user_status_created', 'user_id', 'status', desc('created_at')),  # User status queries
        Index('idx_ai_insights_type_status', 'insights_type', 'status'),  # Type and status analytics
        Index('idx_ai_insights_generated_at', desc('generated_at')),  # Recent insights
    )

    # ✅ OPTIMIZED: User relationship added for eager loading
    user = relationship("User", foreign_keys=[user_id])
