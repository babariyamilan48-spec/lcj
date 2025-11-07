#!/usr/bin/env python3
"""
Script to populate test_result_configurations table with MBTI personality types data
"""

import json
import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import sessionmaker
from core.database import engine
from question_service.app.models.test_result import TestResultConfiguration

# Create database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def load_mbti_data():
    """Load MBTI data from JSON file"""
    json_file_path = backend_dir / "question_service" / "data" / "mbti_test_results.json"
    
    if not json_file_path.exists():
        raise FileNotFoundError(f"MBTI data file not found: {json_file_path}")
    
    with open(json_file_path, 'r', encoding='utf-8') as file:
        return json.load(file)

def populate_mbti_configurations():
    """Populate the test_result_configurations table with MBTI data"""
    
    print("Loading MBTI data from JSON file...")
    mbti_data = load_mbti_data()
    
    db = SessionLocal()
    
    try:
        # Get test_id for MBTI test
        test_id = mbti_data.get("testId", "mbti")
        personality_types = mbti_data.get("personalityTypes", {})
        
        print(f"Processing {len(personality_types)} MBTI personality types...")
        
        # Clear existing MBTI configurations
        existing_configs = db.query(TestResultConfiguration).filter(
            TestResultConfiguration.test_id == test_id
        ).all()
        
        if existing_configs:
            print(f"Found {len(existing_configs)} existing MBTI configurations. Deleting...")
            for config in existing_configs:
                db.delete(config)
            db.commit()
        
        # Insert new configurations
        configurations_added = 0
        
        for mbti_code, personality_data in personality_types.items():
            # Create new configuration
            config = TestResultConfiguration(
                test_id=test_id,
                result_type="mbti_type",
                result_code=mbti_code,
                result_name_gujarati=personality_data.get("name", ""),
                result_name_english=personality_data.get("gujarati", ""),
                description_gujarati=personality_data.get("description", ""),
                description_english=f"{mbti_code} - {personality_data.get('name', '')}",
                
                # Existing fields
                traits=personality_data.get("traits", []),
                careers=personality_data.get("careerSuggestions", []),
                strengths=personality_data.get("strengths", []),
                recommendations=[],  # Can be populated later if needed
                
                # New MBTI-specific fields
                characteristics=personality_data.get("characteristics", []),
                challenges=personality_data.get("challenges", []),
                career_suggestions=personality_data.get("careerSuggestions", []),
                
                # Scoring configuration
                min_score=0.0,
                max_score=100.0,
                scoring_method="percentage",
                is_active=True
            )
            
            db.add(config)
            configurations_added += 1
            
            print(f"Added configuration for {mbti_code}: {personality_data.get('name', '')}")
        
        # Commit all changes
        db.commit()
        print(f"\n✅ Successfully added {configurations_added} MBTI configurations to the database!")
        
        # Verify the data
        print("\nVerifying inserted data...")
        inserted_configs = db.query(TestResultConfiguration).filter(
            TestResultConfiguration.test_id == test_id
        ).count()
        print(f"Total MBTI configurations in database: {inserted_configs}")
        
    except Exception as e:
        }")
        db.rollback()
        raise
    finally:
        db.close()

def main():
    """Main function"""
    print("🚀 Starting MBTI configurations population script...")
    print("=" * 60)
    
    try:
        populate_mbti_configurations()
        print("\n" + "=" * 60)
        print("✅ Script completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Script failed with error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
