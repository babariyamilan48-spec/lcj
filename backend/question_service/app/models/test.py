from sqlalchemy import Column, Integer, String, VARCHAR, Boolean, DateTime, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database_fixed import Base

class Test(Base):
    """
    ✅ OPTIMIZED: Test model with proper indexing and relationships
    """
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(String(50), unique=True, index=True, nullable=False)  # e.g., "mbti", "bigfive"
    name = Column(VARCHAR(200), nullable=False)  # Gujarati name
    english_name = Column(VARCHAR(200), nullable=False)  # English name
    description = Column(VARCHAR(1000), nullable=True)  # ✅ OPTIMIZED: VARCHAR instead of TEXT
    icon = Column(VARCHAR(50), nullable=True)  # Icon name
    color = Column(VARCHAR(7), nullable=True)  # Hex color code
    questions_count = Column(Integer, default=0)
    duration = Column(VARCHAR(50), nullable=True)  # e.g., "45-60 મિનિટ"
    is_active = Column(Boolean, default=True, index=True)  # ✅ Added index for filtering
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ✅ OPTIMIZED: Indexes for common queries
    __table_args__ = (
        Index('idx_test_active_created', 'is_active', 'created_at'),  # For listing active tests
        Index('idx_test_id_active', 'test_id', 'is_active'),  # For test lookup
    )

    # ✅ OPTIMIZED: Relationships with proper cascade policies
    sections = relationship("TestSection", back_populates="test", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="test", cascade="all, delete-orphan")
    dimensions = relationship("TestDimension", back_populates="test", cascade="all, delete-orphan")
    results = relationship("TestResult", back_populates="test")  # ✅ REMOVED cascade (prevents data loss)
    configurations = relationship("TestResultConfiguration", back_populates="test", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Test(id={self.id}, test_id='{self.test_id}', name='{self.name}')>"
