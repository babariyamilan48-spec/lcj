from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

from question_service.app.models import TestResult, TestResultDetail, TestResultConfiguration, Question
from question_service.app.utils.simple_calculators import SimpleTestCalculators

class TestResultService:
    """Service for managing test results and calculations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_and_save_test_result(
        self, 
        user_id: str, 
        test_id: str, 
        answers: Dict[str, Any],
        session_id: Optional[str] = None,
        time_taken_seconds: Optional[int] = None
    ) -> TestResult:
        """Calculate test results and save them"""
        
        # Calculate results based on test type using simplified approach
        calculated_result = self._calculate_test_result(test_id, answers)
        
        return self.save_test_result(
            user_id=user_id,
            test_id=test_id,
            answers=answers,
            calculated_result=calculated_result,
            session_id=session_id,
            time_taken_seconds=time_taken_seconds
        )
    
    def save_test_result(
        self, 
        user_id: str, 
        test_id: str, 
        answers: Dict[str, Any],
        calculated_result: Dict[str, Any],
        session_id: Optional[str] = None,
        time_taken_seconds: Optional[int] = None
    ) -> TestResult:
        """Save a complete test result with calculated data"""
        
        # Check if a result already exists for this user and test
        existing_result = self.db.query(TestResult).filter(
            TestResult.user_id == user_id,
            TestResult.test_id == test_id,
            TestResult.is_completed == True
        ).first()
        
        if existing_result:
            print(f"Found existing completed result for user {user_id}, test {test_id}. Updating instead of creating new.")
            # Update existing result
            existing_result.answers = answers
            existing_result.calculated_result = calculated_result
            existing_result.completion_percentage = 100.0
            existing_result.time_taken_seconds = time_taken_seconds
            existing_result.primary_result = self._extract_primary_result(test_id, calculated_result)
            existing_result.result_summary = self._generate_result_summary(test_id, calculated_result)
            existing_result.updated_at = datetime.utcnow()
            existing_result.completed_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(existing_result)
            
            # CRITICAL FIX: Invalidate cache when updating existing result
            try:
                from core.cache import QueryCache
                # Specifically invalidate completion status cache
                QueryCache.invalidate_completion_status(str(user_id))
                QueryCache.invalidate_user_results(str(user_id))
                print(f"✅ Cache invalidated for user {user_id} after updating test result")
            except Exception as e:
                print(f"⚠️ Warning: Failed to invalidate cache for user {user_id}: {e}")
            
            return existing_result
        
        # Calculate completion percentage
        completion_percentage = 100.0 if answers else 0.0
        
        # Extract primary result based on test type
        primary_result = self._extract_primary_result(test_id, calculated_result)
        
        # Generate result summary
        result_summary = self._generate_result_summary(test_id, calculated_result)
        
        # Create main test result
        test_result = TestResult(
            user_id=user_id,
            test_id=test_id,
            session_id=session_id,
            answers=answers,
            completion_percentage=completion_percentage,
            time_taken_seconds=time_taken_seconds,
            calculated_result=calculated_result,
            primary_result=primary_result,
            result_summary=result_summary,
            is_completed=True,
            completed_at=datetime.utcnow()
        )
        
        self.db.add(test_result)
        self.db.commit()
        self.db.refresh(test_result)
        
        # Save detailed results
        self._save_result_details(test_result.id, test_id, calculated_result)
        
        # CRITICAL FIX: Invalidate cache when creating new result
        try:
            from core.cache import QueryCache
            # Specifically invalidate completion status cache
            QueryCache.invalidate_completion_status(str(user_id))
            QueryCache.invalidate_user_results(str(user_id))
            print(f"✅ Cache invalidated for user {user_id} after creating new test result")
        except Exception as e:
            print(f"⚠️ Warning: Failed to invalidate cache for user {user_id}: {e}")
        
        return test_result
    
    def get_user_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive analytics for a user"""
        # Get all completed test results for the user
        results = self.db.query(TestResult).filter(
            TestResult.user_id == user_id,
            TestResult.is_completed == True
        ).order_by(TestResult.completed_at.desc()).all()
        
        if not results:
            return {
                "total_tests_completed": 0,
                "tests_by_type": {},
                "completion_timeline": [],
                "average_completion_time": 0.0,
                "latest_results": {}
            }
        
        # Calculate analytics
        total_tests = len(results)
        tests_by_type = {}
        completion_timeline = []
        total_time = 0
        time_count = 0
        latest_results = {}
        
        for result in results:
            # Count by test type
            tests_by_type[result.test_id] = tests_by_type.get(result.test_id, 0) + 1
            
            # Timeline data
            completion_timeline.append({
                "date": result.completed_at.isoformat() if result.completed_at else None,
                "test_id": result.test_id,
                "primary_result": result.primary_result
            })
            
            # Average time calculation
            if result.time_taken_seconds:
                total_time += result.time_taken_seconds
                time_count += 1
            
            # Latest result for each test type
            if result.test_id not in latest_results:
                latest_results[result.test_id] = {
                    "primary_result": result.primary_result,
                    "result_summary": result.result_summary,
                    "completed_at": result.completed_at.isoformat() if result.completed_at else None,
                    "calculated_result": result.calculated_result
                }
        
        average_time = total_time / time_count if time_count > 0 else 0.0
        
        return {
            "total_tests_completed": total_tests,
            "tests_by_type": tests_by_type,
            "completion_timeline": completion_timeline,
            "average_completion_time": average_time,
            "latest_results": latest_results
        }

    def _extract_primary_result(self, test_id: str, calculated_result: Dict[str, Any]) -> str:
        """Extract the primary result identifier based on test type"""
        if test_id == 'mbti':
            return calculated_result.get('code', '')
        elif test_id == 'intelligence':
            top_intelligence = calculated_result.get('dominantType', '')
            return top_intelligence
        elif test_id == 'bigfive':
            # Return the highest scoring trait
            dimensions = calculated_result.get('dimensions', [])
            if dimensions:
                highest = max(dimensions, key=lambda x: x.get('score', 0))
                return f"{highest.get('trait', '')}_high"
            return ''
        elif test_id == 'riasec':
            return calculated_result.get('hollandCode', '')
        elif test_id == 'svs':
            core_values = calculated_result.get('coreValues', [])
            if core_values:
                return core_values[0].get('type', '')
            return ''
        elif test_id == 'decision':
            primary_style = calculated_result.get('primaryStyle', {})
            return primary_style.get('type', '')
        elif test_id == 'vark':
            primary_style = calculated_result.get('primaryStyle', {})
            return primary_style.get('type', '')
        return ''
    
    def _generate_result_summary(self, test_id: str, calculated_result: Dict[str, Any]) -> str:
        """Generate a brief summary of the test results"""
        if test_id == 'mbti':
            code = calculated_result.get('code', '')
            description = calculated_result.get('description', '')
            return f"MBTI પ્રકાર: {code} - {description}"
        elif test_id == 'intelligence':
            dominant = calculated_result.get('dominantType', '')
            return f"પ્રબળ બુદ્ધિ પ્રકાર: {dominant}"
        elif test_id == 'bigfive':
            return "Big Five વ્યક્તિત્વ પરિમાણોનું વિશ્લેષણ પૂર્ણ"
        elif test_id == 'riasec':
            code = calculated_result.get('hollandCode', '')
            return f"કારકિર્દી રુચિ કોડ: {code}"
        elif test_id == 'svs':
            core_values = calculated_result.get('coreValues', [])
            if core_values:
                top_value = core_values[0].get('type', '')
                return f"મુખ્ય મૂલ્ય: {top_value}"
            return "મૂલ્ય વિશ્લેષણ પૂર્ણ"
        elif test_id == 'decision':
            primary = calculated_result.get('primaryStyle', {})
            style_type = primary.get('type', '')
            return f"નિર્ણય શૈલી: {style_type}"
        elif test_id == 'vark':
            primary = calculated_result.get('primaryStyle', {})
            style_type = primary.get('type', '')
            return f"શીખવાની શૈલી: {style_type}"
        return "પરીક્ષણ પૂર્ણ"
    
    def _save_result_details(self, test_result_id: int, test_id: str, calculated_result: Dict[str, Any]):
        """Save detailed dimension-wise results"""
        details = []
        
        if test_id == 'mbti':
            dimensions = calculated_result.get('dimensions', [])
            for dim in dimensions:
                detail = TestResultDetail(
                    test_result_id=test_result_id,
                    dimension_type='mbti_dimension',
                    dimension_name=dim.get('pair', ''),
                    raw_score=dim.get('scores', {}).get(dim.get('dominant', ''), 0),
                    percentage_score=dim.get('percentage', 0),
                    level=dim.get('dominant', ''),
                    description=f"પ્રબળ લક્ષણ: {dim.get('dominant', '')}"
                )
                details.append(detail)
        
        elif test_id == 'intelligence':
            intelligences = calculated_result.get('allIntelligences', [])
            for intel in intelligences:
                detail = TestResultDetail(
                    test_result_id=test_result_id,
                    dimension_type='intelligence_type',
                    dimension_name=intel.get('type', ''),
                    raw_score=intel.get('score', 0),
                    percentage_score=intel.get('percentage', 0),
                    level=self._get_intelligence_level(intel.get('percentage', 0)),
                    description=intel.get('description', '')
                )
                details.append(detail)
        
        elif test_id == 'bigfive':
            dimensions = calculated_result.get('dimensions', [])
            for dim in dimensions:
                detail = TestResultDetail(
                    test_result_id=test_result_id,
                    dimension_type='personality_trait',
                    dimension_name=dim.get('trait', ''),
                    raw_score=dim.get('score', 0),
                    percentage_score=dim.get('percentage', 0),
                    level=dim.get('level', ''),
                    description=dim.get('description', '')
                )
                details.append(detail)
        
        elif test_id == 'riasec':
            interests = calculated_result.get('allInterests', [])
            for interest in interests:
                detail = TestResultDetail(
                    test_result_id=test_result_id,
                    dimension_type='career_interest',
                    dimension_name=interest.get('type', ''),
                    raw_score=interest.get('score', 0),
                    percentage_score=interest.get('percentage', 0),
                    level=self._get_interest_level(interest.get('percentage', 0)),
                    description=interest.get('description', '')
                )
                details.append(detail)
        
        elif test_id == 'svs':
            values = calculated_result.get('allValues', [])
            for value in values:
                detail = TestResultDetail(
                    test_result_id=test_result_id,
                    dimension_type='personal_value',
                    dimension_name=value.get('type', ''),
                    raw_score=value.get('score', 0),
                    percentage_score=value.get('percentage', 0),
                    level=self._get_value_level(value.get('percentage', 0)),
                    description=value.get('description', '')
                )
                details.append(detail)
        
        elif test_id == 'decision':
            styles = calculated_result.get('allStyles', [])
            for style in styles:
                detail = TestResultDetail(
                    test_result_id=test_result_id,
                    dimension_type='decision_style',
                    dimension_name=style.get('type', ''),
                    raw_score=style.get('score', 0),
                    percentage_score=style.get('percentage', 0),
                    level=self._get_style_level(style.get('percentage', 0)),
                    description=style.get('description', '')
                )
                details.append(detail)
        
        elif test_id == 'vark':
            styles = calculated_result.get('allStyles', [])
            for style in styles:
                detail = TestResultDetail(
                    test_result_id=test_result_id,
                    dimension_type='learning_style',
                    dimension_name=style.get('type', ''),
                    raw_score=style.get('score', 0),
                    percentage_score=style.get('percentage', 0),
                    level=self._get_style_level(style.get('percentage', 0)),
                    description=style.get('description', '')
                )
                details.append(detail)
        
        # Save all details
        for detail in details:
            self.db.add(detail)
        
        self.db.commit()
    
    def _get_intelligence_level(self, percentage: float) -> str:
        """Get intelligence level based on percentage"""
        if percentage >= 80:
            return 'ઉચ્ચ'
        elif percentage >= 60:
            return 'મધ્યમ-ઉચ્ચ'
        elif percentage >= 40:
            return 'મધ્યમ'
        elif percentage >= 20:
            return 'મધ્યમ-નીચું'
        else:
            return 'નીચું'
    
    def _get_interest_level(self, percentage: float) -> str:
        """Get interest level based on percentage"""
        if percentage >= 70:
            return 'મજબૂત રુચિ'
        elif percentage >= 50:
            return 'મધ્યમ રુચિ'
        elif percentage >= 30:
            return 'થોડી રુચિ'
        else:
            return 'ઓછી રુચિ'
    
    def _get_value_level(self, percentage: float) -> str:
        """Get value importance level based on percentage"""
        if percentage >= 80:
            return 'અત્યંત મહત્વપૂર્ણ'
        elif percentage >= 60:
            return 'મહત્વપૂર્ણ'
        elif percentage >= 40:
            return 'મધ્યમ મહત્વ'
        else:
            return 'ઓછું મહત્વ'
    
    def _get_style_level(self, percentage: float) -> str:
        """Get style preference level based on percentage"""
        if percentage >= 70:
            return 'મજબૂત પસંદગી'
        elif percentage >= 50:
            return 'મધ્યમ પસંદગી'
        elif percentage >= 30:
            return 'થોડી પસંદગી'
        else:
            return 'ઓછી પસંદગી'
    
    def get_user_results(self, user_id: str, test_id: Optional[str] = None) -> List[TestResult]:
        """Get all test results for a user"""
        query = self.db.query(TestResult).filter(TestResult.user_id == user_id)
        
        if test_id:
            query = query.filter(TestResult.test_id == test_id)
        
        return query.order_by(TestResult.created_at.desc()).all()
    
    def get_latest_result(self, user_id: str, test_id: str) -> Optional[TestResult]:
        """Get the latest completed result for a user and test type"""
        return self.db.query(TestResult).filter(
            TestResult.user_id == user_id,
            TestResult.test_id == test_id,
            TestResult.is_completed == True
        ).order_by(TestResult.completed_at.desc()).first()
    
    def _calculate_test_result(self, test_id: str, answers: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate test results using appropriate calculator"""
        
        try:
            if test_id == 'mbti':
                return SimpleTestCalculators.calculate_mbti_result(answers, self.db)
            elif test_id == 'intelligence':
                return SimpleTestCalculators.calculate_intelligence_result(answers, self.db)
            elif test_id == 'bigfive':
                return SimpleTestCalculators.calculate_bigfive_result(answers, self.db)
            elif test_id == 'riasec':
                return SimpleTestCalculators.calculate_riasec_result(answers, self.db)
            elif test_id == 'vark':
                return SimpleTestCalculators.calculate_vark_result(answers, self.db)
            elif test_id == 'svs':
                return SimpleTestCalculators.calculate_svs_result(answers, self.db)
            elif test_id == 'decision':
                return SimpleTestCalculators.calculate_decision_result(answers, self.db)
            elif test_id == 'life-situation':
                return SimpleTestCalculators.calculate_life_situation_result(answers, self.db)
            else:
                # Fallback for unknown test types
                return {
                    'type': f'{test_id.title()} Test',
                    'message': 'પરીક્ષણ પૂર્ણ થયું',
                    'score': len(answers),
                    'total_questions': len(answers)
                }
        except Exception as e:
            # Fallback calculation if specific calculator fails
            return {
                'type': f'{test_id.title()} Test',
                'message': 'પરીક્ષણ પૂર્ણ થયું',
                'score': len(answers),
                'total_questions': len(answers),
                'error': str(e)
            }
    
    def populate_configurations(self):
        """This method is deprecated - use the populate_configurations.py script instead"""
        return 0
    
