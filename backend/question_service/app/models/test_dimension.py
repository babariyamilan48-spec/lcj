from sqlalchemy import Column, Integer, String, ForeignKey, Text, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class TestDimension(Base):
    __tablename__ = "test_dimensions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    dimension_id = Column(String(50), nullable=False)  # e.g., "E", "I", "S", "N"
    name = Column(String(200), nullable=False)  # Gujarati name
    english_name = Column(String(200), nullable=False)  # English name
    gujarati_name = Column(String(200), nullable=True)  # Additional Gujarati name
    description = Column(Text, nullable=True)
    careers = Column(JSON, nullable=True)  # List of career suggestions
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    test = relationship("Test", back_populates="dimensions")

    def __repr__(self):
        return f"<TestDimension(id={self.id}, dimension_id='{self.dimension_id}', name='{self.name}')>"
