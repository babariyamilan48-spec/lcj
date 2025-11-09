from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from core.database import Base

class AIInsights(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)  # Added index for user queries
    insights_type = Column(String(100), default="comprehensive", index=True)  # Added index for type filtering
    insights_data = Column(Text, nullable=False)  # JSON string of AI insights
    model_used = Column(String(50), nullable=True, index=True)  # Added index for model tracking
    confidence_score = Column(Integer, nullable=True, index=True)  # Added index for quality filtering
    status = Column(String(50), default="completed", index=True)  # Added index for status filtering
    generated_at = Column(DateTime, default=datetime.utcnow, index=True)  # Added index for time queries
    created_at = Column(DateTime, default=datetime.utcnow, index=True)  # Added index for creation time
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Metadata for tracking
    test_results_used = Column(Text, nullable=True)  # JSON array of test IDs used for generation
    generation_duration = Column(Integer, nullable=True, index=True)  # Added index for performance tracking
    
    # Performance indexes for AI insights queries
    __table_args__ = (
        Index('idx_ai_insights_user_type', 'user_id', 'insights_type'),  # User insights by type
        Index('idx_ai_insights_user_status', 'user_id', 'status'),  # User insights by status
        Index('idx_ai_insights_generated_at', 'generated_at'),  # Recent insights
        Index('idx_ai_insights_type_status', 'insights_type', 'status'),  # Insights by type and status
    )

    # Relationships would be defined if User model is available
    # user = relationship("User", back_populates="ai_insights")
