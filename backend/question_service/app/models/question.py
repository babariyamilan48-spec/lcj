from sqlalchemy import Column, Integer, String, VARCHAR, ForeignKey, DateTime, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database_fixed import Base

class Question(Base):
    """
    ✅ OPTIMIZED: Questions with proper indexing and VARCHAR for text
    """
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey("test_sections.id"), nullable=True, index=True)
    question_text = Column(VARCHAR(2000), nullable=False)  # ✅ OPTIMIZED: VARCHAR with reasonable limit
    question_type = Column(VARCHAR(50), default="multiple_choice")
    question_order = Column(Integer, default=0, index=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # ✅ OPTIMIZED: Indexes in correct order for query patterns
    __table_args__ = (
        Index('idx_questions_test_active_order', 'test_id', 'is_active', 'question_order'),  # ✅ CRITICAL
        Index('idx_questions_section_active_order', 'section_id', 'is_active', 'question_order'),  # Section queries
    )

    # Relationships
    test = relationship("Test", back_populates="questions")
    section = relationship("TestSection", back_populates="questions")
    options = relationship("Option", back_populates="question", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Question(id={self.id}, test_id={self.test_id}, text='{self.question_text[:50]}...')>"
