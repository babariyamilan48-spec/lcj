from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from core.database import Base

class AIInsights(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    insights_type = Column(String(100), default="comprehensive")  # comprehensive, individual, etc.
    insights_data = Column(Text, nullable=False)  # JSON string of AI insights
    model_used = Column(String(50), nullable=True)  # gemini, gpt-4, etc.
    confidence_score = Column(Integer, nullable=True)  # 0-100
    status = Column(String(50), default="completed")  # completed, failed, processing
    generated_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Metadata for tracking
    test_results_used = Column(Text, nullable=True)  # JSON array of test IDs used for generation
    generation_duration = Column(Integer, nullable=True)  # seconds taken to generate

    # Relationships would be defined if User model is available
    # user = relationship("User", back_populates="ai_insights")
