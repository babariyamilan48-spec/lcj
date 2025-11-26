#!/usr/bin/env python3
"""
Check Database Status Script
Verifies current database state and what data needs to be populated
"""

import os
import sys
from pathlib import Path

# Add the project root to the Python path
BACKEND_ROOT = Path(__file__).parent.absolute()
sys.path.append(str(BACKEND_ROOT))

from sqlalchemy.orm import Session
from core.database_fixed import get_db_session as get_db, engine
from question_service.app.models.test import Test
from question_service.app.models.question import Question
from question_service.app.models.option import Option
from question_service.app.models.test_result import TestResultConfiguration

def check_database_status():
    """Check current database status"""
    print("🔍 Checking Database Status...")
    print("=" * 50)
    
    try:
        db = next(get_db())
        
        # Check Tests
        tests_count = db.query(Test).count()
        print(f"📋 Tests: {tests_count}")
        
        if tests_count > 0:
            tests = db.query(Test).all()
            for test in tests:
                print(f"   - {test.test_id}: {test.english_name}")
        
        # Check Questions
        questions_count = db.query(Question).count()
        print(f"❓ Questions: {questions_count}")
        
        if questions_count > 0:
            for test in tests:
                test_questions = db.query(Question).filter(Question.test_id == test.id).count()
                print(f"   - {test.test_id}: {test_questions} questions")
        
        # Check Options
        options_count = db.query(Option).count()
        print(f"🔘 Options: {options_count}")
        
        # Check Result Configurations
        configs_count = db.query(TestResultConfiguration).count()
        print(f"🎯 Result Configurations: {configs_count}")
        
        if configs_count > 0:
            configs_by_test = {}
            configs = db.query(TestResultConfiguration).all()
            for config in configs:
                if config.test_id not in configs_by_test:
                    configs_by_test[config.test_id] = 0
                configs_by_test[config.test_id] += 1
            
            for test_id, count in configs_by_test.items():
                print(f"   - {test_id}: {count} configurations")
        
        print("=" * 50)
        
        # Recommendations
        if tests_count == 0:
            print("🚨 No tests found! You need to populate test data.")
            print("📝 Run: python populate_all_data.py")
        elif questions_count == 0:
            print("🚨 No questions found! You need to populate question data.")
            print("📝 Run: python populate_all_data.py")
        elif configs_count == 0:
            print("🚨 No result configurations found!")
            print("📝 Run: python populate_all_data.py")
        else:
            print("✅ Database appears to be populated!")
            print("🎉 You can start using your application.")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        print("💡 Make sure your database is running and accessible.")

if __name__ == "__main__":
    check_database_status()
