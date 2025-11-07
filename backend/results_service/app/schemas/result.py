from pydantic import BaseModel, field_validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

class TestResultBase(BaseModel):
    user_id: str
    test_id: str
    test_name: str
    score: Optional[float] = None
    percentage: Optional[float] = None
    percentage_score: Optional[float] = None
    total_score: Optional[float] = None
    answers: Union[List[Dict[str, Any]], Dict[str, Any]]
    analysis: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[str]] = None
    duration_seconds: Optional[int] = None
    duration_minutes: Optional[int] = None
    total_questions: Optional[int] = None
    dimensions_scores: Optional[Dict[str, float]] = None
    
    @field_validator('answers')
    @classmethod
    def validate_answers(cls, v):
        """Convert answers dict to list if needed"""
        if isinstance(v, dict):
            # Convert dict with numeric keys to list
            if all(str(k).isdigit() for k in v.keys()):
                # Sort by numeric key and return as list
                sorted_items = sorted(v.items(), key=lambda x: int(x[0]))
                return [item[1] for item in sorted_items]
            else:
                # Return as-is if not numeric keys
                return v
        return v

class TestResultCreate(TestResultBase):
    pass

class TestResult(TestResultBase):
    id: str
    timestamp: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserStats(BaseModel):
    total_tests: int
    average_score: float
    streak_days: int
    achievements: int
    recent_tests: List[Dict[str, Any]]
    category_scores: Dict[str, float]

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    username: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    interests: Optional[List[str]] = None
    avatar: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    skills: Optional[List[str]] = None
    goals: Optional[List[str]] = None
    stats: Optional[UserStats] = None
    created_at: datetime
    updated_at: datetime

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    interests: Optional[List[str]] = None
    avatar: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    skills: Optional[List[str]] = None
    goals: Optional[List[str]] = None

class AnalyticsData(BaseModel):
    user_id: str
    total_tests: int
    average_score: float
    tests_this_month: int
    improvement_rate: float
    category_scores: Dict[str, float]
    recent_activity: List[Dict[str, Any]]
    strengths: List[str]
    areas_for_improvement: List[str]
