#!/usr/bin/env python3
"""
Script to populate test result configurations from Python data files
"""

import os
import sys
import logging
from datetime import datetime

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from core.database_fixed import get_db_session as get_db, engine
from question_service.app.models.test_result import TestResultConfiguration
from question_service.app.data.test_result_configurations import ALL_CONFIGURATIONS

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def populate_configurations():
    """Populate test result configurations from Python data"""
    logger.info("Starting test result configurations population...")
    
    try:
        # Create database tables
        from core.database_fixed import Base
        Base.metadata.create_all(bind=engine)
        
        # Get database session
        db = next(get_db())
        
        try:
            created_count = 0
            updated_count = 0
            
            for config_data in ALL_CONFIGURATIONS:
                try:
                    # Check if configuration already exists
                    existing_config = db.query(TestResultConfiguration).filter(
                        TestResultConfiguration.test_id == config_data['test_id'],
                        TestResultConfiguration.result_type == config_data['result_type'],
                        TestResultConfiguration.result_code == config_data['result_code']
                    ).first()
                    
                    if existing_config:
                        # Update existing configuration
                        existing_config.result_name_gujarati = config_data.get('result_name_gujarati', '')
                        existing_config.result_name_english = config_data.get('result_name_english', '')
                        existing_config.description_gujarati = config_data.get('description_gujarati', '')
                        existing_config.description_english = config_data.get('description_english', '')
                        existing_config.traits = config_data.get('traits', [])
                        existing_config.careers = config_data.get('careers', [])
                        existing_config.strengths = config_data.get('strengths', [])
                        existing_config.recommendations = config_data.get('recommendations', [])
                        existing_config.min_score = config_data.get('min_score', 0.0)
                        existing_config.max_score = config_data.get('max_score', 100.0)
                        existing_config.scoring_method = config_data.get('scoring_method', 'percentage')
                        existing_config.is_active = config_data.get('is_active', True)
                        existing_config.updated_at = datetime.now()
                        
                        updated_count += 1
                        logger.info(f"Updated {config_data['result_type']}: {config_data['result_code']}")
                    else:
                        # Create new configuration
                        config = TestResultConfiguration(
                            test_id=config_data['test_id'],
                            result_type=config_data['result_type'],
                            result_code=config_data['result_code'],
                            result_name_gujarati=config_data.get('result_name_gujarati', ''),
                            result_name_english=config_data.get('result_name_english', ''),
                            description_gujarati=config_data.get('description_gujarati', ''),
                            description_english=config_data.get('description_english', ''),
                            traits=config_data.get('traits', []),
                            careers=config_data.get('careers', []),
                            strengths=config_data.get('strengths', []),
                            recommendations=config_data.get('recommendations', []),
                            min_score=config_data.get('min_score', 0.0),
                            max_score=config_data.get('max_score', 100.0),
                            scoring_method=config_data.get('scoring_method', 'percentage'),
                            is_active=config_data.get('is_active', True)
                        )
                        db.add(config)
                        
                        created_count += 1
                        logger.info(f"Created {config_data['result_type']}: {config_data['result_code']}")
                        
                except Exception as e:
                    logger.error(f"Failed to process {config_data['result_code']}: {e}")
                    continue
            
            # Commit all changes
            db.commit()
            
            logger.info("=" * 60)
            logger.info("CONFIGURATION POPULATION COMPLETED SUCCESSFULLY!")
            logger.info(f"Configurations created: {created_count}")
            logger.info(f"Configurations updated: {updated_count}")
            logger.info("=" * 60)
            
            return True
            
        except Exception as e:
            logger.error(f"Database operation failed: {e}")
            logger.error(f"Error type: {type(e)}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            db.rollback()
            return False
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Configuration population failed: {e}")
        return False

if __name__ == "__main__":
    success = populate_configurations()
    if success:
        print("Configuration population completed successfully!")
        sys.exit(0)
    else:
        print("Configuration population failed!")
        sys.exit(1)
