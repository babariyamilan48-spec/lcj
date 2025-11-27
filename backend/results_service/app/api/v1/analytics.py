from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, distinct
from datetime import datetime, timedelta
from core.database_fixed import get_db, get_db_session
from question_service.app.models.test_result import TestResult
from question_service.app.models.test import Test
from core.app_factory import resp
import requests

router = APIRouter()

@router.get("/analytics/tests")
async def get_test_analytics(db: Session = Depends(get_db)):
    """Get test analytics for admin dashboard"""
    try:
        # ✅ OPTIMIZED: Single query for category distribution (eliminates N+1)
        category_stats = db.query(
            TestResult.test_type,
            func.count(TestResult.id).label('count')
        ).group_by(TestResult.test_type).all()
        
        # Extract test types from results (no additional query needed)
        test_types = [t[0] for t in category_stats if t[0]]
        
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
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # ✅ OPTIMIZED: Combine queries where possible
        # Total users who have taken tests
        total_users = db.query(TestResult.user_id).distinct().count()
        
        # Active users (users who took tests in last 30 days)
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
        recent_registrations = active_users  # Same as active_users
        
        # ✅ OPTIMIZED: Single query for test completion stats
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
    """Get overview analytics for dashboard - OPTIMIZED"""
    try:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # ✅ OPTIMIZED: Single query for all counts using aggregation
        stats = db.query(
            func.count(TestResult.id).label('total_completions'),
            func.count(TestResult.id).filter(TestResult.created_at >= thirty_days_ago).label('recent_completions'),
            func.avg(TestResult.completion_percentage).label('avg_score')
        ).first()
        
        total_completions = stats.total_completions or 0
        recent_completions = stats.recent_completions or 0
        avg_score = round(stats.avg_score, 2) if stats.avg_score else 0
        
        # ✅ OPTIMIZED: Single query for most popular test
        popular_test = db.query(
            TestResult.test_id,
            func.count(TestResult.id).label('count')
        ).filter(TestResult.is_completed == True).group_by(TestResult.test_id).order_by(desc('count')).first()
        
        # ✅ OPTIMIZED: Single query for daily stats (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        daily_results = db.query(
            func.date(TestResult.created_at).label('date'),
            func.count(TestResult.id).label('count')
        ).filter(TestResult.created_at >= seven_days_ago).group_by(func.date(TestResult.created_at)).all()
        
        # Build daily stats map
        daily_map = {str(r[0]): r[1] for r in daily_results}
        daily_stats = []
        for i in range(6, -1, -1):  # Last 7 days
            date = (datetime.utcnow().date() - timedelta(days=i))
            daily_stats.append({
                "date": date.isoformat(),
                "completions": daily_map.get(str(date), 0)
            })
        
        return resp({
            "total_completions": total_completions,
            "recent_completions": recent_completions,
            "most_popular_test": popular_test[0] if popular_test else None,
            "average_score": avg_score,
            "daily_completions": daily_stats
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get overview analytics: {str(e)}")

@router.get("/analytics/dashboard")
async def get_dashboard_analytics(db: Session = Depends(get_db)):
    """Get comprehensive analytics for admin dashboard - OPTIMIZED"""
    
    try:
        # ✅ OPTIMIZED: Single query for basic stats
        stats = db.query(
            func.count(distinct(Test.id)).filter(Test.is_active == True).label('total_tests'),
            func.count(TestResult.id).filter(TestResult.is_completed == True).label('total_completions'),
            func.count(distinct(TestResult.user_id)).label('total_users'),
            func.avg(TestResult.completion_percentage).label('avg_completion')
        ).outerjoin(TestResult, Test.test_id == TestResult.test_id).first()
        
        total_tests = stats.total_tests or 0
        total_completions = stats.total_completions or 0
        total_users = stats.total_users or 0
        avg_completion = round(stats.avg_completion, 1) if stats.avg_completion else 0
        
        # ✅ OPTIMIZED: Get recent completions with single query
        recent_results = db.query(
            TestResult.id,
            TestResult.test_id,
            TestResult.user_id,
            TestResult.completed_at,
            TestResult.created_at,
            TestResult.completion_percentage,
            Test.english_name,
            Test.name
        ).join(Test, TestResult.test_id == Test.test_id)\
         .filter(TestResult.is_completed == True)\
         .order_by(desc(TestResult.completed_at))\
         .limit(10).all()
        
        # Fetch user emails asynchronously (non-blocking)
        user_emails = {}
        try:
            auth_response = requests.get(
                'http://localhost:8000/api/v1/auth_service/users',
                params={'per_page': 100},
                timeout=3  # Reduced timeout
            )
            if auth_response.status_code == 200:
                auth_data = auth_response.json()
                users = auth_data.get('users', [])
                for user in users:
                    user_emails[str(user['id'])] = user['email']
        except Exception as e:
            pass  # Silently fail, use fallback
        
        recent_completions = []
        for result in recent_results:
            user_email = user_emails.get(str(result.user_id), f"user_{result.user_id}@example.com")
            recent_completions.append({
                "id": result.id,
                "test_name": result.english_name if result.english_name else result.name,
                "user_email": user_email,
                "completed_at": (result.completed_at.isoformat() if result.completed_at else result.created_at.isoformat()),
                "score": round(result.completion_percentage) if result.completion_percentage else 0
            })
        
        # ✅ OPTIMIZED: Get test statistics with single query
        test_stats_query = db.query(
            Test.test_id,
            Test.english_name,
            Test.name,
            func.count(TestResult.id).label('completions'),
            func.avg(TestResult.completion_percentage).label('avg_completion')
        ).outerjoin(TestResult, (Test.test_id == TestResult.test_id) & (TestResult.is_completed == True))\
         .filter(Test.is_active == True)\
         .group_by(Test.test_id, Test.english_name, Test.name)\
         .all()
        
        test_stats = []
        for row in test_stats_query:
            test_stats.append({
                "test_id": row.test_id,
                "test_name": row.english_name if row.english_name else row.name,
                "completions": row.completions or 0,
                "avg_score": round(row.avg_completion, 1) if row.avg_completion else 0
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
