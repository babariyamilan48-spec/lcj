from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class CalculatedResultBase(BaseModel):
    """Base schema for calculated test results"""
    test_id: str
    calculated_result: Dict[str, Any]
    primary_result: Optional[str] = None
    result_summary: Optional[str] = None
    traits: Optional[List[str]] = None
    careers: Optional[List[str]] = None
    strengths: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    dimensions_scores: Optional[Dict[str, float]] = None


class CalculatedResultCreate(CalculatedResultBase):
    """Schema for creating a calculated result"""
    user_id: str
    test_result_id: int


class CalculatedResultResponse(CalculatedResultBase):
    """Schema for calculated result response"""
    id: int
    user_id: str
    test_result_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class CalculatedResultSummary(BaseModel):
    """Simplified summary of calculated result for list views"""
    id: int
    test_id: str
    primary_result: Optional[str] = None
    result_summary: Optional[str] = None
    traits: Optional[List[str]] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserCalculatedResultsResponse(BaseModel):
    """Response containing user's calculated results grouped by test"""
    user_id: str
    total_results: int
    results_by_test: Dict[str, CalculatedResultResponse]
    
    class Config:
        from_attributes = True
