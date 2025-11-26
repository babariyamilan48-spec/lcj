"""
Extended Question model with calculation fields
This extends the base Question model with fields needed for test calculations
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database_fixed import Base

class QuestionExtended(Base):
    """Extended Question model with calculation metadata"""
    __tablename__ = "questions_extended"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    test_id = Column(String(50), nullable=False)  # Test identifier (mbti, intelligence, etc.)
    
    # MBTI specific fields
    dimension_map = Column(JSON, nullable=True)  # Maps to E/I, S/N, T/F, J/P dimensions
    
    # Intelligence specific fields
    intelligence_type = Column(String(50), nullable=True)  # linguistic, logical-mathematical, etc.
    
    # Big Five specific fields
    trait = Column(String(50), nullable=True)  # openness, conscientiousness, etc.
    reverse_scored = Column(Boolean, default=False)  # For reverse-scored questions
    
    # RIASEC specific fields
    interest_type = Column(String(50), nullable=True)  # realistic, investigative, etc.
    
    # VARK specific fields
    style_type = Column(String(50), nullable=True)  # visual, auditory, reading, kinesthetic
    
    # SVS specific fields
    value_type = Column(String(50), nullable=True)  # achievement, power, etc.
    
    # Decision Making specific fields
    decision_style = Column(String(50), nullable=True)  # rational, intuitive, etc.
    
    # General calculation fields
    weight = Column(Integer, default=1)  # Question weight in calculation
    category = Column(String(100), nullable=True)  # Question category
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    question = relationship("Question", backref="extended_info")

    def __repr__(self):
        return f"<QuestionExtended(id={self.id}, question_id={self.question_id}, test_id='{self.test_id}')>"

# Sample data for question mappings
SAMPLE_QUESTION_MAPPINGS = {
    'mbti': [
        {
            'question_id': 1,
            'dimension_map': {'E': 1, 'I': -1},  # Extraversion vs Introversion
            'category': 'social_energy'
        },
        {
            'question_id': 2,
            'dimension_map': {'S': 1, 'N': -1},  # Sensing vs Intuition
            'category': 'information_processing'
        },
        {
            'question_id': 3,
            'dimension_map': {'T': 1, 'F': -1},  # Thinking vs Feeling
            'category': 'decision_making'
        },
        {
            'question_id': 4,
            'dimension_map': {'J': 1, 'P': -1},  # Judging vs Perceiving
            'category': 'lifestyle'
        }
    ],
    'intelligence': [
        {
            'question_id': 5,
            'intelligence_type': 'linguistic',
            'category': 'language_skills'
        },
        {
            'question_id': 6,
            'intelligence_type': 'logical-mathematical',
            'category': 'math_logic'
        },
        {
            'question_id': 7,
            'intelligence_type': 'spatial',
            'category': 'visual_spatial'
        },
        {
            'question_id': 8,
            'intelligence_type': 'musical',
            'category': 'music_rhythm'
        }
    ],
    'bigfive': [
        {
            'question_id': 9,
            'trait': 'openness',
            'reverse_scored': False,
            'category': 'creativity'
        },
        {
            'question_id': 10,
            'trait': 'conscientiousness',
            'reverse_scored': False,
            'category': 'organization'
        },
        {
            'question_id': 11,
            'trait': 'extraversion',
            'reverse_scored': False,
            'category': 'social_behavior'
        }
    ],
    'riasec': [
        {
            'question_id': 12,
            'interest_type': 'realistic',
            'category': 'hands_on_work'
        },
        {
            'question_id': 13,
            'interest_type': 'investigative',
            'category': 'research_analysis'
        },
        {
            'question_id': 14,
            'interest_type': 'artistic',
            'category': 'creative_expression'
        }
    ]
}
