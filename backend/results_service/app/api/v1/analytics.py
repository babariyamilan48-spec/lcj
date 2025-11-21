from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from core.database_dependencies_singleton import get_user_db, get_db
from question_service.app.models.test_result import TestResult
from question_service.app.models.test import Test
from core.app_factory import resp
import requests

router = APIRouter()

@router.get("/analytics/tests")
async def get_test_analytics(db: Session = Depends(get_db)):
    """Get test analytics for admin dashboard"""
    try:
        # Get unique test types from test results
        test_types = db.query(TestResult.test_type).distinct().all()
        test_types = [t[0] for t in test_types if t[0]]
        
        # Total tests available (unique test types)
        total_tests = len(test_types)
        
        # Active tests (assuming all are active for now)
        active_tests = total_tests
        
        # Total questions (estimate based on test types)
        question_estimates = {
            'mbti': 20,
            'bigfive': 25,
            'intelligence': 30,
            'riasec': 18,
            'vark': 16,
            'svs': 21,
            'decision': 15,
            'life_situation': 12
        }
        
        total_questions = sum(question_estimates.get(test_type, 20) for test_type in test_types)
        avg_questions_per_test = total_questions / total_tests if total_tests > 0 else 0
        
        # Category distribution based on actual test results
        category_stats = db.query(
            TestResult.test_type,
            func.count(TestResult.id).label('count')
        ).group_by(TestResult.test_type).all()
        
        category_distribution = []
        for test_type, count in category_stats:
            if test_type:
                category_distribution.append({
                    "category": test_type.replace('_', ' ').title(),
                    "count": count
                })
        
        return {
            "total_tests": total_tests,
            "active_tests": active_tests,
            "total_questions": total_questions,
            "avg_questions_per_test": round(avg_questions_per_test, 1),
            "category_distribution": category_distribution
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get test analytics: {str(e)}")

@router.get("/analytics/users")
async def get_user_analytics_from_results(db: Session = Depends(get_db)):
    """Get user analytics based on test results"""
    try:
        # Total users who have taken tests
        total_users = db.query(TestResult.user_id).distinct().count()
        
        # Active users (users who took tests in last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        active_users = db.query(TestResult.user_id).filter(
            TestResult.created_at >= thirty_days_ago
        ).distinct().count()
        
        # Users who completed tests (have results)
        verified_users = db.query(TestResult.user_id).filter(
            TestResult.analysis.isnot(None)
        ).distinct().count()
        
        # Admin users (assuming 1 for now, should be fetched from auth service)
        admin_users = 1
        
        # Recent registrations (users who took their first test in last 30 days)
        recent_registrations = db.query(TestResult.user_id).filter(
            TestResult.created_at >= thirty_days_ago
        ).distinct().count()
        
        # Test completion stats
        completion_stats = db.query(
            TestResult.test_type,
            func.count(TestResult.id).label('completions')
        ).group_by(TestResult.test_type).all()
        
        test_completion_distribution = []
        for test_type, completions in completion_stats:
            if test_type:
                test_completion_distribution.append({
                    "test_type": test_type.replace('_', ' ').title(),
                    "completions": completions
                })
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "verified_users": verified_users,
            "admin_users": admin_users,
            "recent_registrations": recent_registrations,
            "test_completion_distribution": test_completion_distribution
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user analytics: {str(e)}")

@router.get("/analytics/overview")
async def get_overview_analytics(db: Session = Depends(get_db)):
    """Get overview analytics for dashboard"""
    try:
        # Total test completions
        total_completions = db.query(TestResult).count()
        
        # Completions in last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_completions = db.query(TestResult).filter(
            TestResult.created_at >= thirty_days_ago
        ).count()
        
        # Most popular test
        popular_test = db.query(
            TestResult.test_type,
            func.count(TestResult.id).label('count')
        ).group_by(TestResult.test_type).order_by(desc('count')).first()
        
        # Average score (if available)
        avg_score = db.query(func.avg(TestResult.score)).scalar()
        
        # Daily completions for last 7 days
        daily_stats = []
        for i in range(7):
            date = datetime.utcnow().date() - timedelta(days=i)
            count = db.query(TestResult).filter(
                func.date(TestResult.created_at) == date
            ).count()
            daily_stats.append({
                "date": date.isoformat(),
                "completions": count
            })
        
        daily_stats.reverse()  # Show oldest to newest
        
        return resp({
            "total_completions": total_completions,
            "recent_completions": recent_completions,
            "most_popular_test": popular_test[0] if popular_test else None,
            "average_score": round(avg_score, 2) if avg_score else None,
            "daily_completions": daily_stats
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get overview analytics: {str(e)}")

@router.get("/analytics/dashboard")
async def get_dashboard_analytics(db: Session = Depends(get_db)):
    """Get comprehensive analytics for admin dashboard"""
    
    try:
        # Get basic counts
        total_tests = db.query(Test).filter(Test.is_active == True).count()
        total_completions = db.query(TestResult).filter(TestResult.is_completed == True).count()
        total_users = db.query(TestResult.user_id).distinct().count()
        
        
        # Calculate average completion percentage (since we don't have scores)
        avg_completion = db.query(func.avg(TestResult.completion_percentage)).scalar()
        avg_completion = round(avg_completion, 1) if avg_completion else 0
        
        # Get recent completions with user details
        recent_results = db.query(TestResult, Test).join(Test, TestResult.test_id == Test.test_id)\
            .filter(TestResult.is_completed == True)\
            .order_by(desc(TestResult.completed_at))\
            .limit(10).all()
        
        # Get user IDs from recent results
        user_ids = [result.TestResult.user_id for result, test in recent_results]
        
        # Fetch user details from auth service
        user_emails = {}
        try:
            # Call auth service to get user details
            auth_response = requests.get(
                'http://localhost:8000/api/v1/auth_service/users',
                params={'per_page': 100},
                timeout=5
            )
            if auth_response.status_code == 200:
                auth_data = auth_response.json()
                users = auth_data.get('users', [])
                for user in users:
                    user_emails[str(user['id'])] = user['email']
        except Exception as e:
            print(f"Failed to fetch user emails: {e}")
        
        recent_completions = []
        for result, test in recent_results:
            # Get user email from fetched data or use fallback
            user_email = user_emails.get(str(result.user_id), f"user_{result.user_id}@example.com")
                
            recent_completions.append({
                "id": result.id,
                "test_name": test.english_name if test.english_name else test.name,
                "user_email": user_email,
                "completed_at": result.completed_at.isoformat() if result.completed_at else result.created_at.isoformat(),
                "score": round(result.completion_percentage) if result.completion_percentage else 0
            })
        
        # Get test statistics
        test_stats_query = db.query(
            Test.test_id,
            Test.english_name,
            Test.name,
            func.count(TestResult.id).label('completions'),
            func.avg(TestResult.completion_percentage).label('avg_completion')
        ).join(TestResult, Test.test_id == TestResult.test_id)\
         .filter(TestResult.is_completed == True)\
         .group_by(Test.test_id, Test.english_name, Test.name).all()
        
        test_stats = []
        for test_id, english_name, gujarati_name, completions, avg_test_completion in test_stats_query:
            test_stats.append({
                "test_id": test_id,
                "test_name": english_name if english_name else gujarati_name,
                "completions": completions,
                "avg_score": round(avg_test_completion, 1) if avg_test_completion else 0
            })
        
        # Sort by completions descending
        test_stats.sort(key=lambda x: x['completions'], reverse=True)
        
        return resp({
            "totalTests": total_tests,
            "totalQuestions": total_tests * 20,  # Estimate
            "totalUsers": total_users,
            "totalCompletions": total_completions,
            "avgScore": avg_completion,
            "recentCompletions": recent_completions,
            "testStats": test_stats
        })
        
    except Exception as e:
        print(f"Analytics error: {e}")
        # Return empty data on error
        return resp({
            "totalTests": 0,
            "totalQuestions": 0,
            "totalUsers": 0,
            "totalCompletions": 0,
            "avgScore": 0,
            "recentCompletions": [],
            "testStats": []
        })
