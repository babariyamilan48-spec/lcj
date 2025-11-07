#!/usr/bin/env python3
"""
Script to populate test result configurations in the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import sessionmaker
from core.database import engine
from question_service.app.services.result_service import TestResultService

def main():
    """Populate test result configurations"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        service = TestResultService(db)
        count = service.populate_configurations()
        print(f"Successfully populated {count} new test result configurations")
        
        if count == 0:
            print("All configurations already exist in the database")
        
    except Exception as e:
        print(f"Error populating configurations: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
