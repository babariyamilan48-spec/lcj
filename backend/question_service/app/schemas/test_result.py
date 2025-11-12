from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class TestResultDetailBase(BaseModel):
    dimension_type: str = Field(..., description="Type of dimension (e.g., 'mbti_dimension', 'intelligence_type')")
    dimension_name: str = Field(..., description="Name of the dimension")
    raw_score: float = Field(..., description="Raw score for this dimension")
    percentage_score: float = Field(..., description="Percentage score for this dimension")
    level: Optional[str] = Field(None, description="Level description (e.g., 'high', 'moderate', 'low')")
    description: Optional[str] = Field(None, description="Detailed description")

class TestResultDetailCreate(TestResultDetailBase):
    pass

class TestResultDetailResponse(TestResultDetailBase):
    id: int
    test_result_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TestResultBase(BaseModel):
    user_id: str = Field(..., description="UUID of the user who took the test")
    test_id: str = Field(..., description="Test identifier (e.g., 'mbti', 'bigfive')")
    session_id: Optional[str] = Field(None, description="Session identifier for tracking")
    answers: Dict[str, Any] = Field(..., description="Raw user answers")
    completion_percentage: float = Field(default=0.0, description="Completion percentage (0-100)")
    time_taken_seconds: Optional[int] = Field(None, description="Time taken to complete in seconds")
    calculated_result: Optional[Dict[str, Any]] = Field(None, description="Processed test results")
    primary_result: Optional[str] = Field(None, description="Main result (e.g., MBTI code)")
    result_summary: Optional[str] = Field(None, description="Brief summary of results")
    is_completed: bool = Field(default=False, description="Whether the test is completed")

class TestResultCreate(TestResultBase):
    details: Optional[List[TestResultDetailCreate]] = Field(None, description="Detailed dimension results")

class TestResultUpdate(BaseModel):
    answers: Optional[Dict[str, Any]] = None
    completion_percentage: Optional[float] = None
    time_taken_seconds: Optional[int] = None
    calculated_result: Optional[Dict[str, Any]] = None
    primary_result: Optional[str] = None
    result_summary: Optional[str] = None
    is_completed: Optional[bool] = None

class TestResultResponse(TestResultBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    details: List[TestResultDetailResponse] = []

    @validator('user_id', pre=True)
    def convert_uuid_to_string(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True
        # Custom serializer to convert UUID to string
        json_encoders = {
            UUID: str
        }

class TestResultConfigurationBase(BaseModel):
    test_id: str = Field(..., description="Test identifier")
    result_type: str = Field(..., description="Type of result (e.g., 'mbti_type', 'intelligence_type')")
    result_code: str = Field(..., description="Result code (e.g., 'INTJ', 'linguistic')")
    result_name_gujarati: str = Field(..., description="Result name in Gujarati")
    result_name_english: str = Field(..., description="Result name in English")
    description_gujarati: Optional[str] = Field(None, description="Description in Gujarati")
    description_english: Optional[str] = Field(None, description="Description in English")
    min_score: float = Field(default=0.0, description="Minimum score for this result")
    max_score: float = Field(default=100.0, description="Maximum score for this result")
    scoring_method: str = Field(default='percentage', description="Scoring method")
    traits: Optional[List[str]] = Field(None, description="Associated traits")
    careers: Optional[List[str]] = Field(None, description="Career suggestions")
    strengths: Optional[List[str]] = Field(None, description="Key strengths")
    recommendations: Optional[List[str]] = Field(None, description="Recommendations")
    is_active: bool = Field(default=True, description="Whether this configuration is active")

class TestResultConfigurationCreate(TestResultConfigurationBase):
    pass

class TestResultConfigurationResponse(TestResultConfigurationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class UserAnalyticsResponse(BaseModel):
    total_tests_completed: int
    tests_by_type: Dict[str, int]
    completion_timeline: List[Dict[str, Any]]
    average_completion_time: float
    latest_results: Dict[str, Dict[str, Any]]

class TestOverviewItem(BaseModel):
    test_id: str
    test_name_gujarati: str
    test_name_english: str
    primary_result: str
    result_name_gujarati: str
    result_name_english: str
    completion_date: datetime
    score_percentage: Optional[float]
    traits: List[str]
    careers: List[str]
    strengths: List[str]
    recommendations: List[str]
    description_gujarati: str
    description_english: str

class UserOverviewResponse(BaseModel):
    user_id: str
    total_tests_completed: int
    last_activity: Optional[datetime]
    test_results: List[TestOverviewItem]
    personality_summary: Dict[str, Any]
    career_recommendations: List[str]
    top_strengths: List[str]
    development_areas: List[str]
    completion_stats: Dict[str, Any]

class TestResultAnalytics(BaseModel):
    test_id: str
    total_completions: int
    average_score: float
    completion_rate: float
    popular_results: List[Dict[str, Any]]
    time_trends: List[Dict[str, Any]]
