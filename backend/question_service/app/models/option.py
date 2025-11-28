from sqlalchemy import Column, Integer, String, VARCHAR, ForeignKey, DateTime, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database_fixed import Base

class Option(Base):
    """
    ✅ OPTIMIZED: Options with proper indexing and VARCHAR for text
    """
    __tablename__ = "options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    option_text = Column(VARCHAR(1000), nullable=False)  # ✅ OPTIMIZED: VARCHAR with reasonable limit
    dimension = Column(VARCHAR(10), nullable=True, index=True)  # MBTI dimension (E/I, S/N, etc.)
    weight = Column(Integer, default=1)
    option_order = Column(Integer, default=0, index=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # ✅ OPTIMIZED: Indexes in correct order for query patterns
    __table_args__ = (
        Index('idx_options_question_active_order', 'question_id', 'is_active', 'option_order'),  # ✅ CRITICAL
        Index('idx_options_dimension_active', 'dimension', 'is_active'),  # Dimension filtering
    )

    # Relationships
    question = relationship("Question", back_populates="options")

    def __repr__(self):
        return f"<Option(id={self.id}, question_id={self.question_id}, text='{self.option_text[:30]}...')>"
