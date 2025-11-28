from sqlalchemy import Column, Integer, String, VARCHAR, Boolean, DateTime, JSON, ForeignKey, Float, Index, desc
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database_fixed import Base
from auth_service.app.models.user import User  # ✅ CRITICAL: Import User for relationship

class TestResult(Base):
    """
    ✅ OPTIMIZED: Test results with comprehensive indexing and user relationship
    """
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    test_id = Column(String(50), ForeignKey("tests.test_id"), nullable=False, index=True)
    session_id = Column(VARCHAR(100), nullable=True)  # For tracking test sessions
    
    # Raw response data
    answers = Column(JSON, nullable=False)  # User's raw answers
    completion_percentage = Column(Float, default=0.0)
    time_taken_seconds = Column(Integer, nullable=True)
    
    # Calculated results
    calculated_result = Column(JSON, nullable=True)  # Processed test results
    primary_result = Column(VARCHAR(100), nullable=True)  # Main result (e.g., MBTI code)
    result_summary = Column(VARCHAR(1000), nullable=True)  # ✅ OPTIMIZED: VARCHAR instead of TEXT
    
    # Metadata
    is_completed = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True, index=True)
    
    # ✅ OPTIMIZED: Critical indexes for all query patterns
    __table_args__ = (
        # User-based queries
        Index('idx_test_results_user_completed_created', 'user_id', 'is_completed', desc('created_at')),  # ✅ CRITICAL
        Index('idx_test_results_user_test_completed', 'user_id', 'test_id', 'is_completed'),  # Duplicate check
        Index('idx_test_results_user_created', 'user_id', desc('created_at')),  # User results by time
        
        # Test-based queries
        Index('idx_test_results_test_completed_created', 'test_id', 'is_completed', desc('created_at')),  # Analytics
        Index('idx_test_results_test_created', 'test_id', desc('created_at')),  # Test history
        
        # Analytics queries
        Index('idx_test_results_is_completed_created', 'is_completed', desc('created_at')),  # Global analytics
        Index('idx_test_results_completed_at', desc('completed_at')),  # Recent completions
    )

    # ✅ OPTIMIZED: Relationships with user relationship added
    user = relationship(User, foreign_keys=[user_id])  # ✅ FIXED: Use User class directly instead of string
    test = relationship("Test", back_populates="results")
    details = relationship("TestResultDetail", back_populates="test_result", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TestResult(id={self.id}, user_id={self.user_id}, test_id='{self.test_id}', primary_result='{self.primary_result}')>"

class TestResultDetail(Base):
    """
    ✅ OPTIMIZED: Test result details with optimized indexes
    """
    __tablename__ = "test_result_details"

    id = Column(Integer, primary_key=True, index=True)
    test_result_id = Column(Integer, ForeignKey("test_results.id"), nullable=False, index=True)
    
    # Dimension/Category specific results
    dimension_type = Column(VARCHAR(50), nullable=False, index=True)
    dimension_name = Column(VARCHAR(100), nullable=False, index=True)
    raw_score = Column(Float, nullable=False)
    percentage_score = Column(Float, nullable=False, index=True)
    level = Column(VARCHAR(50), nullable=True, index=True)
    description = Column(VARCHAR(1000), nullable=True)  # ✅ OPTIMIZED: VARCHAR instead of TEXT
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # ✅ OPTIMIZED: Indexes in correct order for query patterns
    __table_args__ = (
        Index('idx_result_details_result_type_name', 'test_result_id', 'dimension_type', 'dimension_name'),  # ✅ CRITICAL
        Index('idx_result_details_type_score', 'dimension_type', desc('percentage_score')),  # Analytics
    )

    # Relationships
    test_result = relationship("TestResult", back_populates="details")

    def __repr__(self):
        return f"<TestResultDetail(id={self.id}, dimension_name='{self.dimension_name}', percentage_score={self.percentage_score})>"

class TestResultConfiguration(Base):
    """
    ✅ OPTIMIZED: Result configurations with proper indexing and VARCHAR fields
    """
    __tablename__ = "test_result_configurations"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(String(50), ForeignKey("tests.test_id"), nullable=False, index=True)
    
    # Result type configurations
    result_type = Column(VARCHAR(50), nullable=False, index=True)
    result_code = Column(VARCHAR(50), nullable=False, index=True)
    result_name_gujarati = Column(VARCHAR(200), nullable=False)
    result_name_english = Column(VARCHAR(200), nullable=False)
    description_gujarati = Column(VARCHAR(1000), nullable=True)  # ✅ OPTIMIZED: VARCHAR instead of TEXT
    description_english = Column(VARCHAR(1000), nullable=True)  # ✅ OPTIMIZED: VARCHAR instead of TEXT
    
    # Scoring configuration
    min_score = Column(Float, default=0.0)
    max_score = Column(Float, default=100.0)
    scoring_method = Column(VARCHAR(50), default='percentage')
    
    # Additional metadata
    traits = Column(JSON, nullable=True)
    careers = Column(JSON, nullable=True)
    strengths = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    
    # MBTI-specific fields
    characteristics = Column(JSON, nullable=True)
    challenges = Column(JSON, nullable=True)
    career_suggestions = Column(JSON, nullable=True)
    
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # ✅ OPTIMIZED: Indexes for all query patterns
    __table_args__ = (
        Index('idx_config_test_type_active', 'test_id', 'result_type', 'is_active'),  # ✅ CRITICAL
        Index('idx_config_type_code', 'result_type', 'result_code'),  # Code lookups
        Index('idx_config_test_active', 'test_id', 'is_active'),  # Active configs
    )

    # Relationships
    test = relationship("Test", back_populates="configurations")

    def __repr__(self):
        return f"<TestResultConfiguration(id={self.id}, test_id='{self.test_id}', result_code='{self.result_code}')>"

# Relationships will be added to Test model in test.py to avoid circular imports
