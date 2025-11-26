from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database_fixed import Base

class Option(Base):
    __tablename__ = "options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)  # Added index
    option_text = Column(Text, nullable=False)
    dimension = Column(String(10), nullable=True, index=True)  # Added index for MBTI filtering
    weight = Column(Integer, default=1)
    option_order = Column(Integer, default=0, index=True)  # Added index for ordering
    is_active = Column(Boolean, default=True, index=True)  # Added index for filtering
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Performance indexes for common query patterns
    __table_args__ = (
        Index('idx_options_question_active', 'question_id', 'is_active'),  # Composite index for active options by question
        Index('idx_options_question_order', 'question_id', 'option_order'),  # Composite index for ordered options
    )

    # Relationships
    question = relationship("Question", back_populates="options")

    def __repr__(self):
        return f"<Option(id={self.id}, question_id={self.question_id}, text='{self.option_text[:30]}...')>"
