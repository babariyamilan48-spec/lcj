from sqlalchemy import Column, Integer, String, VARCHAR, DateTime, JSON, ForeignKey, Index, Boolean, desc
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database_fixed import Base


class CalculatedTestResult(Base):
    """
    ✅ OPTIMIZED: Pre-calculated test results cache without denormalization
    Stores final calculated results for quick retrieval without recalculation.
    """
    __tablename__ = "calculated_test_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    test_id = Column(String(50), ForeignKey("tests.test_id"), nullable=False, index=True)
    test_result_id = Column(Integer, ForeignKey("test_results.id"), nullable=False, index=True)
    
    # Pre-calculated result data
    calculated_result = Column(JSON, nullable=False)  # Full calculated result object
    primary_result = Column(VARCHAR(100), nullable=True)  # Main result code (e.g., MBTI code)
    result_summary = Column(VARCHAR(1000), nullable=True)  # Brief summary
    
    # ✅ OPTIMIZED: Removed denormalization - use JOINs instead
    # traits, careers, strengths, recommendations, dimensions_scores removed
    # These are available in TestResultConfiguration and TestResultDetail
    
    # Metadata
    is_valid = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # ✅ OPTIMIZED: Critical indexes for all query patterns
    __table_args__ = (
        Index('idx_calc_result_user_test_created', 'user_id', 'test_id', desc('created_at')),  # ✅ CRITICAL
        Index('idx_calc_result_user_created', 'user_id', desc('created_at')),  # User results by time
        Index('idx_calc_result_test_result_id', 'test_result_id'),  # Link to test result
        Index('idx_calc_result_valid_created', 'is_valid', desc('created_at')),  # Valid results by time
    )

    # Relationships
    test_result = relationship("TestResult", foreign_keys=[test_result_id])

    def __repr__(self):
        return f"<CalculatedTestResult(id={self.id}, user_id={self.user_id}, test_id='{self.test_id}', primary_result='{self.primary_result}')>"
