from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import logging

from question_service.app.models import CalculatedTestResult, TestResult

logger = logging.getLogger(__name__)


class CalculatedResultService:
    """Service for storing and retrieving pre-calculated test results"""
    
    def __init__(self, db: Session):
        self.db = db
    
    @staticmethod
    def store_calculated_result(
        db: Session,
        user_id: str,
        test_id: str,
        test_result_id: int,
        calculated_result: Dict[str, Any],
        primary_result: Optional[str] = None,
        result_summary: Optional[str] = None,
        traits: Optional[List[str]] = None,
        careers: Optional[List[str]] = None,
        strengths: Optional[List[str]] = None,
        recommendations: Optional[List[str]] = None,
        dimensions_scores: Optional[Dict[str, float]] = None
    ) -> CalculatedTestResult:
        """
        Store pre-calculated test result for quick retrieval later.
        Called immediately after test completion.
        
        Args:
            db: Database session
            user_id: User UUID
            test_id: Test identifier
            test_result_id: Reference to TestResult record
            calculated_result: Full calculated result object
            primary_result: Main result code
            result_summary: Brief summary
            traits: Extracted traits
            careers: Career suggestions
            strengths: Key strengths
            recommendations: Recommendations
            dimensions_scores: Dimension-wise scores
        
        Returns:
            CalculatedTestResult record
        """
        try:
            # Check if result already exists for this test_result_id
            existing = db.query(CalculatedTestResult).filter(
                CalculatedTestResult.test_result_id == test_result_id
            ).first()
            
            if existing:
                logger.info(f"Updating existing calculated result for test_result_id {test_result_id}")
                # Update existing record
                existing.calculated_result = calculated_result
                existing.primary_result = primary_result
                existing.result_summary = result_summary
                existing.traits = traits
                existing.careers = careers
                existing.strengths = strengths
                existing.recommendations = recommendations
                existing.dimensions_scores = dimensions_scores
                existing.updated_at = datetime.utcnow()
                existing.is_valid = True
                
                db.commit()
                db.refresh(existing)
                return existing
            
            # Create new record
            calc_result = CalculatedTestResult(
                user_id=user_id,
                test_id=test_id,
                test_result_id=test_result_id,
                calculated_result=calculated_result,
                primary_result=primary_result,
                result_summary=result_summary,
                traits=traits or [],
                careers=careers or [],
                strengths=strengths or [],
                recommendations=recommendations or [],
                dimensions_scores=dimensions_scores or {},
                is_valid=True
            )
            
            db.add(calc_result)
            db.commit()
            db.refresh(calc_result)
            
            logger.info(f"Stored calculated result for user {user_id}, test {test_id}, result_id {calc_result.id}")
            return calc_result
            
        except Exception as e:
            logger.error(f"Error storing calculated result: {str(e)}")
            db.rollback()
            raise
    
    @staticmethod
    def get_latest_calculated_result(
        db: Session,
        user_id: str,
        test_id: str
    ) -> Optional[CalculatedTestResult]:
        """
        Get the latest pre-calculated result for a user and test.
        
        Args:
            db: Database session
            user_id: User UUID
            test_id: Test identifier
        
        Returns:
            CalculatedTestResult or None
        """
        try:
            result = db.query(CalculatedTestResult).filter(
                CalculatedTestResult.user_id == user_id,
                CalculatedTestResult.test_id == test_id,
                CalculatedTestResult.is_valid == True
            ).order_by(CalculatedTestResult.created_at.desc()).first()
            
            return result
            
        except Exception as e:
            logger.error(f"Error fetching calculated result: {str(e)}")
            return None
    
    @staticmethod
    def get_user_calculated_results(
        db: Session,
        user_id: str,
        test_id: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[CalculatedTestResult]:
        """
        Get all pre-calculated results for a user, optionally filtered by test.
        
        Args:
            db: Database session
            user_id: User UUID
            test_id: Optional test filter
            limit: Optional limit on results
        
        Returns:
            List of CalculatedTestResult records
        """
        try:
            query = db.query(CalculatedTestResult).filter(
                CalculatedTestResult.user_id == user_id,
                CalculatedTestResult.is_valid == True
            )
            
            if test_id:
                query = query.filter(CalculatedTestResult.test_id == test_id)
            
            query = query.order_by(CalculatedTestResult.created_at.desc())
            
            if limit:
                query = query.limit(limit)
            
            results = query.all()
            return results
            
        except Exception as e:
            logger.error(f"Error fetching user calculated results: {str(e)}")
            return []
    
    @staticmethod
    def get_latest_results_by_test(
        db: Session,
        user_id: str
    ) -> Dict[str, CalculatedTestResult]:
        """
        Get the latest calculated result for each test type for a user.
        Useful for test history display.
        
        Args:
            db: Database session
            user_id: User UUID
        
        Returns:
            Dict mapping test_id to latest CalculatedTestResult
        """
        try:
            results = db.query(CalculatedTestResult).filter(
                CalculatedTestResult.user_id == user_id,
                CalculatedTestResult.is_valid == True
            ).order_by(CalculatedTestResult.created_at.desc()).all()
            
            # Group by test_id, keeping only the latest for each
            latest_by_test = {}
            for result in results:
                if result.test_id not in latest_by_test:
                    latest_by_test[result.test_id] = result
            
            return latest_by_test
            
        except Exception as e:
            logger.error(f"Error fetching latest results by test: {str(e)}")
            return {}
    
    @staticmethod
    def invalidate_calculated_result(
        db: Session,
        test_result_id: int
    ) -> bool:
        """
        Mark a calculated result as invalid (e.g., if recalculation is needed).
        
        Args:
            db: Database session
            test_result_id: TestResult ID to invalidate
        
        Returns:
            True if invalidated, False otherwise
        """
        try:
            result = db.query(CalculatedTestResult).filter(
                CalculatedTestResult.test_result_id == test_result_id
            ).first()
            
            if result:
                result.is_valid = False
                result.updated_at = datetime.utcnow()
                db.commit()
                logger.info(f"Invalidated calculated result for test_result_id {test_result_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error invalidating calculated result: {str(e)}")
            return False
    
    @staticmethod
    def extract_traits_from_result(
        test_id: str,
        calculated_result: Dict[str, Any]
    ) -> List[str]:
        """Extract traits from calculated result based on test type"""
        traits = []
        
        if test_id == 'mbti':
            traits = calculated_result.get('traits', [])
        elif test_id == 'intelligence':
            for intel in calculated_result.get('topIntelligences', []):
                intel_type = intel.get('type', '').replace('_', ' ').title()
                percentage = intel.get('percentage', 0)
                if intel_type:
                    traits.append(f"{intel_type} ({percentage}%)")
        elif test_id == 'bigfive':
            for dim in calculated_result.get('dimensions', []):
                trait_name = dim.get('trait', '').title()
                level = dim.get('level', '')
                if trait_name and level:
                    traits.append(f"{trait_name}: {level}")
        elif test_id == 'riasec':
            for interest in calculated_result.get('topInterests', []):
                interest_type = interest.get('type', '').title()
                percentage = interest.get('percentage', 0)
                if interest_type:
                    traits.append(f"{interest_type} ({percentage}%)")
        elif test_id == 'decision':
            for style in calculated_result.get('topStyles', [])[:3]:
                style_name = style.get('type', '').replace('_', ' ').title()
                percentage = style.get('percentage', 0)
                if style_name:
                    traits.append(f"{style_name} ({percentage}%)")
        elif test_id == 'vark':
            for style in calculated_result.get('topStyles', [])[:3]:
                style_name = style.get('type', '').title()
                percentage = style.get('percentage', 0)
                if style_name:
                    traits.append(f"{style_name} ({percentage}%)")
        
        return traits
    
    @staticmethod
    def extract_careers_from_result(
        test_id: str,
        calculated_result: Dict[str, Any]
    ) -> List[str]:
        """Extract career suggestions from calculated result"""
        return calculated_result.get('careers', [])
    
    @staticmethod
    def extract_strengths_from_result(
        test_id: str,
        calculated_result: Dict[str, Any]
    ) -> List[str]:
        """Extract strengths from calculated result"""
        return calculated_result.get('strengths', [])
    
    @staticmethod
    def extract_recommendations_from_result(
        test_id: str,
        calculated_result: Dict[str, Any]
    ) -> List[str]:
        """Extract recommendations from calculated result"""
        return calculated_result.get('recommendations', [])
    
    @staticmethod
    def extract_dimensions_scores(
        test_id: str,
        calculated_result: Dict[str, Any]
    ) -> Dict[str, float]:
        """Extract dimension-wise scores from calculated result"""
        scores = {}
        
        if test_id == 'bigfive':
            for dim in calculated_result.get('dimensions', []):
                trait = dim.get('trait', '')
                percentage = dim.get('percentage', 0)
                if trait:
                    scores[trait] = percentage
        elif test_id == 'intelligence':
            for intel in calculated_result.get('allIntelligences', []):
                intel_type = intel.get('type', '')
                percentage = intel.get('percentage', 0)
                if intel_type:
                    scores[intel_type] = percentage
        elif test_id == 'riasec':
            for interest in calculated_result.get('allInterests', []):
                interest_type = interest.get('type', '')
                percentage = interest.get('percentage', 0)
                if interest_type:
                    scores[interest_type] = percentage
        
        return scores
