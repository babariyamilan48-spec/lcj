from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database_fixed import Base

class TestSection(Base):
    __tablename__ = "test_sections"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    section_id = Column(String(50), nullable=False)  # e.g., "ei", "sn", "tf", "jp"
    name = Column(String(200), nullable=False)  # Gujarati name
    gujarati_name = Column(String(200), nullable=True)  # English translation
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    test = relationship("Test", back_populates="sections")
    questions = relationship("Question", back_populates="section", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TestSection(id={self.id}, section_id='{self.section_id}', name='{self.name}')>"
