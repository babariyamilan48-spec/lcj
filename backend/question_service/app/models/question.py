from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database_fixed import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False, index=True)  # Added index
    section_id = Column(Integer, ForeignKey("test_sections.id"), nullable=True, index=True)  # Added index
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="multiple_choice")  # multiple_choice, text, rating, etc.
    question_order = Column(Integer, default=0, index=True)  # Added index for ordering
    is_active = Column(Boolean, default=True, index=True)  # Added index for filtering
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Performance indexes for common query patterns
    __table_args__ = (
        Index('idx_questions_test_active', 'test_id', 'is_active'),  # Composite index for active questions by test
        Index('idx_questions_section_active', 'section_id', 'is_active'),  # Composite index for active questions by section
        Index('idx_questions_test_order', 'test_id', 'question_order'),  # Composite index for ordered questions by test
    )

    # Relationships
    test = relationship("Test", back_populates="questions")
    section = relationship("TestSection", back_populates="questions")
    options = relationship("Option", back_populates="question", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Question(id={self.id}, test_id={self.test_id}, text='{self.question_text[:50]}...')>"
