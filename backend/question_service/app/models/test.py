from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(String(50), unique=True, index=True, nullable=False)  # e.g., "mbti", "bigfive"
    name = Column(String(200), nullable=False)  # Gujarati name
    english_name = Column(String(200), nullable=False)  # English name
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)  # Icon name
    color = Column(String(7), nullable=True)  # Hex color code
    questions_count = Column(Integer, default=0)
    duration = Column(String(50), nullable=True)  # e.g., "45-60 મિનિટ"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    sections = relationship("TestSection", back_populates="test", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="test", cascade="all, delete-orphan")
    dimensions = relationship("TestDimension", back_populates="test", cascade="all, delete-orphan")
    results = relationship("TestResult", back_populates="test", cascade="all, delete-orphan")
    configurations = relationship("TestResultConfiguration", back_populates="test", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Test(id={self.id}, test_id='{self.test_id}', name='{self.name}')>"
