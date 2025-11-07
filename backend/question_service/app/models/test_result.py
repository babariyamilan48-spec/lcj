from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)  # Reference to user UUID
    test_id = Column(String(50), ForeignKey("tests.test_id"), nullable=False, index=True)
    session_id = Column(String(100), nullable=True)  # For tracking test sessions
    
    # Raw response data
    answers = Column(JSON, nullable=False)  # User's raw answers
    completion_percentage = Column(Float, default=0.0)
    time_taken_seconds = Column(Integer, nullable=True)
    
    # Calculated results
    calculated_result = Column(JSON, nullable=True)  # Processed test results
    primary_result = Column(String(100), nullable=True)  # Main result (e.g., MBTI code, dominant intelligence)
    result_summary = Column(Text, nullable=True)  # Brief summary
    
    # Metadata
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    test = relationship("Test", back_populates="results")
    details = relationship("TestResultDetail", back_populates="test_result", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TestResult(id={self.id}, user_id={self.user_id}, test_id='{self.test_id}', primary_result='{self.primary_result}')>"

class TestResultDetail(Base):
    __tablename__ = "test_result_details"

    id = Column(Integer, primary_key=True, index=True)
    test_result_id = Column(Integer, ForeignKey("test_results.id"), nullable=False)
    
    # Dimension/Category specific results
    dimension_type = Column(String(50), nullable=False)  # e.g., 'mbti_dimension', 'intelligence_type', 'big_five_trait'
    dimension_name = Column(String(100), nullable=False)  # e.g., 'extraversion', 'linguistic', 'openness'
    raw_score = Column(Float, nullable=False)
    percentage_score = Column(Float, nullable=False)
    level = Column(String(50), nullable=True)  # e.g., 'high', 'moderate', 'low'
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    test_result = relationship("TestResult", back_populates="details")

    def __repr__(self):
        return f"<TestResultDetail(id={self.id}, dimension_name='{self.dimension_name}', percentage_score={self.percentage_score})>"

class TestResultConfiguration(Base):
    __tablename__ = "test_result_configurations"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(String(50), ForeignKey("tests.test_id"), nullable=False, index=True)
    
    # Result type configurations
    result_type = Column(String(50), nullable=False)  # e.g., 'mbti_type', 'intelligence_type', 'personality_trait'
    result_code = Column(String(50), nullable=False)  # e.g., 'INTJ', 'linguistic', 'openness'
    result_name_gujarati = Column(String(200), nullable=False)
    result_name_english = Column(String(200), nullable=False)
    description_gujarati = Column(Text, nullable=True)
    description_english = Column(Text, nullable=True)
    
    # Scoring configuration
    min_score = Column(Float, default=0.0)
    max_score = Column(Float, default=100.0)
    scoring_method = Column(String(50), default='percentage')  # 'percentage', 'raw_score', 'weighted'
    
    # Additional metadata
    traits = Column(JSON, nullable=True)  # Associated traits
    careers = Column(JSON, nullable=True)  # Career suggestions
    strengths = Column(JSON, nullable=True)  # Key strengths
    recommendations = Column(JSON, nullable=True)  # Recommendations
    
    # MBTI-specific fields
    characteristics = Column(JSON, nullable=True)  # Personality characteristics
    challenges = Column(JSON, nullable=True)  # Areas for improvement/challenges
    career_suggestions = Column(JSON, nullable=True)  # Specific career suggestions
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    test = relationship("Test", back_populates="configurations")

    def __repr__(self):
        return f"<TestResultConfiguration(id={self.id}, test_id='{self.test_id}', result_code='{self.result_code}')>"

# Relationships will be added to Test model in test.py to avoid circular imports
