#!/usr/bin/env python3
"""
Complete script to populate test_result_configurations table with MBTI data
including both personality types and dimensions
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

def populate_mbti_personality_types(db, test_id, personality_types):
    """Populate MBTI personality types"""
    print(f"Processing {len(personality_types)} MBTI personality types...")
    
    configurations_added = 0
    
    for mbti_code, personality_data in personality_types.items():
        # Create new configuration for personality type
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
            recommendations=[],
            
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
        
        print(f"  ✓ Added personality type: {mbti_code} - {personality_data.get('name', '')}")
    
    return configurations_added

def populate_mbti_dimensions(db, test_id, dimensions):
    """Populate MBTI dimensions (E/I, S/N, T/F, J/P)"""
    print(f"Processing {len(dimensions)} MBTI dimensions...")
    
    configurations_added = 0
    
    for dimension_code, dimension_data in dimensions.items():
        dimension_name = dimension_data.get("name", "")
        dimension_description = dimension_data.get("description", "")
        
        # Add configuration for each pole of the dimension
        for pole_code, pole_data in dimension_data.items():
            if pole_code in ['name', 'description']:
                continue
                
            pole_name = pole_data.get("name", "")
            pole_traits = pole_data.get("traits", [])
            
            # Create configuration for this dimension pole
            config = TestResultConfiguration(
                test_id=test_id,
                result_type="mbti_dimension",
                result_code=f"{dimension_code}_{pole_code}",
                result_name_gujarati=pole_name,
                result_name_english=pole_name,
                description_gujarati=f"{dimension_name} - {pole_name}",
                description_english=f"{dimension_description} - {pole_name}",
                
                # Fields
                traits=pole_traits,
                careers=[],
                strengths=pole_traits,  # Use traits as strengths for dimensions
                recommendations=[],
                characteristics=pole_traits,
                challenges=[],
                career_suggestions=[],
                
                # Scoring configuration
                min_score=0.0,
                max_score=100.0,
                scoring_method="percentage",
                is_active=True
            )
            
            db.add(config)
            configurations_added += 1
            
            print(f"  ✓ Added dimension: {dimension_code}_{pole_code} - {pole_name}")
    
    return configurations_added

def populate_mbti_configurations():
    """Populate the test_result_configurations table with complete MBTI data"""
    
    print("Loading MBTI data from JSON file...")
    mbti_data = load_mbti_data()
    
    db = SessionLocal()
    
    try:
        test_id = mbti_data.get("testId", "mbti")
        personality_types = mbti_data.get("personalityTypes", {})
        dimensions = mbti_data.get("dimensions", {})
        
        print(f"Test ID: {test_id}")
        print(f"Found {len(personality_types)} personality types and {len(dimensions)} dimensions")
        
        # Clear existing MBTI configurations
        existing_configs = db.query(TestResultConfiguration).filter(
            TestResultConfiguration.test_id == test_id
        ).all()
        
        if existing_configs:
            print(f"\nFound {len(existing_configs)} existing MBTI configurations. Deleting...")
            for config in existing_configs:
                db.delete(config)
            db.commit()
            print("✓ Existing configurations cleared")
        
        total_added = 0
        
        # Add personality types
        print("\n" + "="*50)
        print("ADDING PERSONALITY TYPES")
        print("="*50)
        personality_added = populate_mbti_personality_types(db, test_id, personality_types)
        total_added += personality_added
        
        # Add dimensions
        print("\n" + "="*50)
        print("ADDING DIMENSIONS")
        print("="*50)
        dimensions_added = populate_mbti_dimensions(db, test_id, dimensions)
        total_added += dimensions_added
        
        # Commit all changes
        db.commit()
        
        print(f"\n" + "="*60)
        print("✅ SUMMARY")
        print("="*60)
        print(f"Personality types added: {personality_added}")
        print(f"Dimension configurations added: {dimensions_added}")
        print(f"Total configurations added: {total_added}")
        
        # Verify the data
        print("\nVerifying inserted data...")
        inserted_configs = db.query(TestResultConfiguration).filter(
            TestResultConfiguration.test_id == test_id
        ).count()
        print(f"Total MBTI configurations in database: {inserted_configs}")
        
        # Show breakdown by result_type
        personality_count = db.query(TestResultConfiguration).filter(
            TestResultConfiguration.test_id == test_id,
            TestResultConfiguration.result_type == "mbti_type"
        ).count()
        
        dimension_count = db.query(TestResultConfiguration).filter(
            TestResultConfiguration.test_id == test_id,
            TestResultConfiguration.result_type == "mbti_dimension"
        ).count()
        
        print(f"  - Personality types: {personality_count}")
        print(f"  - Dimensions: {dimension_count}")
        
    except Exception as e:
        }")
        db.rollback()
        raise
    finally:
        db.close()

def main():
    """Main function"""
    print("🚀 Starting Complete MBTI Configurations Population Script")
    print("=" * 70)
    
    try:
        populate_mbti_configurations()
        print("\n" + "=" * 70)
        print("✅ Script completed successfully!")
        print("You can now use the MBTI configurations in your application.")
        
    except Exception as e:
        print(f"\n❌ Script failed with error: {str(e)}")
        print("\nPlease check:")
        print("1. Database connection is working")
        print("2. MBTI JSON file exists and is valid")
        print("3. Database migrations have been run")
        sys.exit(1)

if __name__ == "__main__":
    main()
