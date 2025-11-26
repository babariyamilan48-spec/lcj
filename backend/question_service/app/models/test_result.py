from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, ForeignKey, Float, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database_fixed import Base

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
    is_completed = Column(Boolean, default=False, index=True)  # Added index for filtering completed results
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)  # Added index for time-based queries
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True, index=True)  # Added index for completion time queries
    
    # Performance indexes for common query patterns
    __table_args__ = (
        Index('idx_test_results_user_completed', 'user_id', 'is_completed'),  # Most common query pattern
        Index('idx_test_results_user_test', 'user_id', 'test_id'),  # User's specific test results
        Index('idx_test_results_user_created', 'user_id', 'created_at'),  # User results by time
        Index('idx_test_results_test_completed', 'test_id', 'is_completed'),  # Test completion stats
        Index('idx_test_results_completed_at', 'completed_at'),  # Recent completions
    )

    # Relationships
    test = relationship("Test", back_populates="results")
    details = relationship("TestResultDetail", back_populates="test_result", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TestResult(id={self.id}, user_id={self.user_id}, test_id='{self.test_id}', primary_result='{self.primary_result}')>"

class TestResultDetail(Base):
    __tablename__ = "test_result_details"

    id = Column(Integer, primary_key=True, index=True)
    test_result_id = Column(Integer, ForeignKey("test_results.id"), nullable=False, index=True)  # Added index
    
    # Dimension/Category specific results
    dimension_type = Column(String(50), nullable=False, index=True)  # Added index for filtering by type
    dimension_name = Column(String(100), nullable=False, index=True)  # Added index for filtering by name
    raw_score = Column(Float, nullable=False)
    percentage_score = Column(Float, nullable=False, index=True)  # Added index for score-based queries
    level = Column(String(50), nullable=True, index=True)  # Added index for level filtering
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Performance indexes for dimension analysis
    __table_args__ = (
        Index('idx_result_details_result_type', 'test_result_id', 'dimension_type'),  # Details by result and type
        Index('idx_result_details_type_name', 'dimension_type', 'dimension_name'),  # Dimension analysis
    )

    # Relationships
    test_result = relationship("TestResult", back_populates="details")

    def __repr__(self):
        return f"<TestResultDetail(id={self.id}, dimension_name='{self.dimension_name}', percentage_score={self.percentage_score})>"

class TestResultConfiguration(Base):
    __tablename__ = "test_result_configurations"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(String(50), ForeignKey("tests.test_id"), nullable=False, index=True)
    
    # Result type configurations
    result_type = Column(String(50), nullable=False, index=True)  # Added index for filtering by type
    result_code = Column(String(50), nullable=False, index=True)  # Added index for code lookups
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
    
    is_active = Column(Boolean, default=True, index=True)  # Added index for active configurations
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Performance indexes for configuration lookups
    __table_args__ = (
        Index('idx_config_test_type', 'test_id', 'result_type'),  # Configuration by test and type
        Index('idx_config_type_code', 'result_type', 'result_code'),  # Configuration by type and code
        Index('idx_config_test_active', 'test_id', 'is_active'),  # Active configurations by test
    )

    # Relationships
    test = relationship("Test", back_populates="configurations")

    def __repr__(self):
        return f"<TestResultConfiguration(id={self.id}, test_id='{self.test_id}', result_code='{self.result_code}')>"

# Relationships will be added to Test model in test.py to avoid circular imports
