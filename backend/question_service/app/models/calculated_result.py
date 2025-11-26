from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Index, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database_fixed import Base


class CalculatedTestResult(Base):
    """
    Stores pre-calculated test results to avoid recalculation on every access.
    Similar to AIInsights, this table caches the final calculated results.
    """
    __tablename__ = "calculated_test_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    test_id = Column(String(50), ForeignKey("tests.test_id"), nullable=False, index=True)
    test_result_id = Column(Integer, ForeignKey("test_results.id"), nullable=False, index=True)
    
    # Pre-calculated result data
    calculated_result = Column(JSON, nullable=False)  # Full calculated result object
    primary_result = Column(String(100), nullable=True)  # Main result code (e.g., MBTI code)
    result_summary = Column(Text, nullable=True)  # Brief summary
    
    # Extracted data for quick access (denormalized for performance)
    traits = Column(JSON, nullable=True)  # List of traits
    careers = Column(JSON, nullable=True)  # Career suggestions
    strengths = Column(JSON, nullable=True)  # Key strengths
    recommendations = Column(JSON, nullable=True)  # Recommendations
    dimensions_scores = Column(JSON, nullable=True)  # Dimension-wise scores
    
    # Metadata
    is_valid = Column(Boolean, default=True, index=True)  # Mark as invalid if recalculation needed
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Performance indexes for common query patterns
    __table_args__ = (
        Index('idx_calc_result_user_test', 'user_id', 'test_id'),  # Get latest result for user+test
        Index('idx_calc_result_user_created', 'user_id', 'created_at'),  # User results by time
        Index('idx_calc_result_test_result', 'test_result_id'),  # Link to test result
        Index('idx_calc_result_valid', 'is_valid'),  # Filter valid results
    )

    # Relationships
    test_result = relationship("TestResult", foreign_keys=[test_result_id])

    def __repr__(self):
        return f"<CalculatedTestResult(id={self.id}, user_id={self.user_id}, test_id='{self.test_id}', primary_result='{self.primary_result}')>"
