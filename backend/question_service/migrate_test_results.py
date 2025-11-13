#!/usr/bin/env python3
"""
Production-ready test result configuration migration script for question service database.

This script reads test result JSON files from the data/ directory and populates the database
with test result configurations according to the TestResultConfiguration model.
"""

import os
import sys
import json
import logging
import argparse
import hashlib
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

# Optional imports for enhanced features
try:
    from tqdm import tqdm
    TQDM_AVAILABLE = True
except ImportError:
    TQDM_AVAILABLE = False

try:
    from colorama import init, Fore, Style
    init(autoreset=True)
    COLORAMA_AVAILABLE = True
except ImportError:
    COLORAMA_AVAILABLE = False

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from core.database_singleton import get_db, engine
from question_service.app.models import TestResultConfiguration

# Configure logging with colors
class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors"""
    
    COLORS = {
        'DEBUG': Fore.CYAN,
        'INFO': Fore.GREEN,
        'WARNING': Fore.YELLOW,
        'ERROR': Fore.RED,
        'CRITICAL': Fore.RED + Style.BRIGHT,
    }
    
    def format(self, record):
        if COLORAMA_AVAILABLE:
            color = self.COLORS.get(record.levelname, '')
            record.levelname = f"{color}{record.levelname}{Style.RESET_ALL}"
        return super().format(record)

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# File handler
file_handler = logging.FileHandler('test_results_migration.log')
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))

# Console handler with colors
console_handler = logging.StreamHandler()
if COLORAMA_AVAILABLE:
    console_handler.setFormatter(ColoredFormatter('%(asctime)s - %(levelname)s - %(message)s'))
else:
    console_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))

logger.addHandler(file_handler)
logger.addHandler(console_handler)

# Path to JSON data files
DATA_PATH = os.path.join(os.path.dirname(__file__), 'data')

# Migration state file
MIGRATION_STATE_FILE = os.path.join(os.path.dirname(__file__), 'test_results_migration_state.json')

class TestResultsMigrator:
    """Production-ready test results configuration migrator"""
    
    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.migration_stats = {
            'configurations_created': 0,
            'configurations_updated': 0,
            'configurations_skipped': 0,
            'errors': []
        }
        self.migration_state = self.load_migration_state()
    
    def load_migration_state(self) -> Dict[str, Any]:
        """Load migration state from file"""
        if os.path.exists(MIGRATION_STATE_FILE):
            try:
                with open(MIGRATION_STATE_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Could not load migration state: {e}")
        
        return {
            'completed_steps': [],
            'last_run': None,
            'data_hashes': {}
        }
    
    def save_migration_state(self):
        """Save migration state to file"""
        if not self.dry_run:
            try:
                with open(MIGRATION_STATE_FILE, 'w', encoding='utf-8') as f:
                    json.dump(self.migration_state, f, indent=2, default=str)
            except Exception as e:
                logger.warning(f"Could not save migration state: {e}")
    
    def get_file_hash(self, filename: str) -> str:
        """Get MD5 hash of a file"""
        file_path = os.path.join(DATA_PATH, filename)
        if not os.path.exists(file_path):
            return ""
        
        with open(file_path, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    
    def should_migrate_file(self, filename: str, step_name: str) -> bool:
        """Check if file should be migrated based on hash"""
        current_hash = self.get_file_hash(filename)
        stored_hash = self.migration_state.get('data_hashes', {}).get(step_name, '')
        
        if current_hash != stored_hash:
            logger.info(f"File {filename} has changed, will migrate")
            return True
        elif step_name not in self.migration_state.get('completed_steps', []):
            logger.info(f"Step {step_name} not completed, will migrate")
            return True
        else:
            logger.info(f"File {filename} unchanged, skipping")
            return False
    
    def load_json_file(self, filename: str) -> Dict[str, Any]:
        """Load and parse a JSON file"""
        file_path = os.path.join(DATA_PATH, filename)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"JSON file not found: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            logger.info(f"Successfully loaded {filename}")
            return data
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in {filename}: {e}")
        except Exception as e:
            raise Exception(f"Error reading {filename}: {e}")
    
    def create_or_update_configuration(self, db: Session, test_id: str, result_type: str, 
                                     result_code: str, config_data: Dict[str, Any]) -> bool:
        """Create or update a test result configuration"""
        try:
            existing_config = db.query(TestResultConfiguration).filter(
                TestResultConfiguration.test_id == test_id,
                TestResultConfiguration.result_type == result_type,
                TestResultConfiguration.result_code == result_code
            ).first()
            
            if existing_config:
                if not self.dry_run:
                    existing_config.result_name_gujarati = config_data.get('name_gujarati', '')
                    existing_config.result_name_english = config_data.get('name_english', '')
                    existing_config.description_gujarati = config_data.get('description_gujarati', '')
                    existing_config.description_english = config_data.get('description_english', '')
                    existing_config.traits = config_data.get('traits', [])
                    existing_config.careers = config_data.get('careers', [])
                    existing_config.strengths = config_data.get('strengths', [])
                    existing_config.recommendations = config_data.get('recommendations', {})
                    existing_config.min_score = config_data.get('min_score', 0.0)
                    existing_config.max_score = config_data.get('max_score', 100.0)
                    existing_config.updated_at = datetime.now()
                
                self.migration_stats['configurations_updated'] += 1
                logger.info(f"Updated {result_type}: {result_code}")
            else:
                if self.dry_run:
                    logger.info(f"[DRY RUN] Would create {result_type}: {result_code}")
                else:
                    config = TestResultConfiguration(
                        test_id=test_id,
                        result_type=result_type,
                        result_code=result_code,
                        result_name_gujarati=config_data.get('name_gujarati', ''),
                        result_name_english=config_data.get('name_english', ''),
                        description_gujarati=config_data.get('description_gujarati', ''),
                        description_english=config_data.get('description_english', ''),
                        traits=config_data.get('traits', []),
                        careers=config_data.get('careers', []),
                        strengths=config_data.get('strengths', []),
                        recommendations=config_data.get('recommendations', {}),
                        min_score=config_data.get('min_score', 0.0),
                        max_score=config_data.get('max_score', 100.0),
                        is_active=True
                    )
                    db.add(config)
                
                self.migration_stats['configurations_created'] += 1
                logger.info(f"Created {result_type}: {result_code}")
            
            return True
            
        except Exception as e:
            error_msg = f"Failed to migrate {result_type} {result_code}: {e}"
            logger.error(error_msg)
            self.migration_stats['errors'].append(error_msg)
            return False
    
    def migrate_mbti_results(self, db: Session) -> bool:
        """Migrate MBTI test result configurations"""
        step_name = 'mbti_results'
        filename = 'mbti_test_results.json'
        
        if not self.should_migrate_file(filename, step_name):
            self.migration_stats['configurations_skipped'] += 1
            return True
        
        logger.info("Starting MBTI results migration...")
        
        try:
            data = self.load_json_file(filename)
            test_id = data.get('testId', 'mbti')
            
            # Migrate personality types
            personality_types = data.get('personalityTypes', {})
            
            for type_code, type_data in personality_types.items():
                config_data = {
                    'name_gujarati': type_data.get('gujarati', ''),
                    'name_english': type_data.get('name', ''),
                    'description_gujarati': type_data.get('description', ''),
                    'description_english': type_data.get('description', ''),
                    'traits': type_data.get('traits', []),
                    'careers': type_data.get('careerSuggestions', [])
                }
                
                self.create_or_update_configuration(db, test_id, 'personality_type', type_code, config_data)
            
            if not self.dry_run:
                db.commit()
                self.migration_state['completed_steps'].append(step_name)
                self.migration_state['data_hashes'][step_name] = self.get_file_hash(filename)
            
            logger.info("MBTI results migration completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"MBTI results migration failed: {e}")
            if not self.dry_run:
                db.rollback()
            return False
    
    def migrate_bigfive_results(self, db: Session) -> bool:
        """Migrate Big Five test result configurations"""
        step_name = 'bigfive_results'
        filename = 'bigfive_test_results.json'
        
        if not self.should_migrate_file(filename, step_name):
            self.migration_stats['configurations_skipped'] += 1
            return True
        
        logger.info("Starting Big Five results migration...")
        
        try:
            data = self.load_json_file(filename)
            test_id = data.get('testId', 'bigfive')
            
            # Migrate personality dimensions
            dimensions = data.get('personalityDimensions', {})
            
            for dim_code, dim_data in dimensions.items():
                config_data = {
                    'name_gujarati': dim_data.get('name', ''),
                    'name_english': dim_data.get('englishName', ''),
                    'description_gujarati': dim_data.get('description', ''),
                    'description_english': dim_data.get('description', ''),
                    'traits': {
                        'high': dim_data.get('highTraits', []),
                        'low': dim_data.get('lowTraits', [])
                    },
                    'careers': dim_data.get('careerSuggestions', {})
                }
                
                self.create_or_update_configuration(db, test_id, 'personality_dimension', dim_code, config_data)
            
            # Migrate scoring ranges
            scoring_ranges = data.get('scoringRanges', {})
            for range_code, range_data in scoring_ranges.items():
                range_parts = range_data.get('range', '0-100').split('-')
                min_score = float(range_parts[0]) if len(range_parts) > 0 else 0.0
                max_score = float(range_parts[1]) if len(range_parts) > 1 else 100.0
                
                config_data = {
                    'name_gujarati': range_code,
                    'name_english': range_code,
                    'description_gujarati': range_data.get('description', ''),
                    'description_english': range_data.get('description', ''),
                    'min_score': min_score,
                    'max_score': max_score
                }
                
                self.create_or_update_configuration(db, test_id, 'scoring_range', range_code, config_data)
            
            if not self.dry_run:
                db.commit()
                self.migration_state['completed_steps'].append(step_name)
                self.migration_state['data_hashes'][step_name] = self.get_file_hash(filename)
            
            logger.info("Big Five results migration completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Big Five results migration failed: {e}")
            if not self.dry_run:
                db.rollback()
            return False
    
    def migrate_intelligence_results(self, db: Session) -> bool:
        """Migrate Intelligence test result configurations"""
        step_name = 'intelligence_results'
        filename = 'intelligence_test_results.json'
        
        if not self.should_migrate_file(filename, step_name):
            self.migration_stats['configurations_skipped'] += 1
            return True
        
        logger.info("Starting Intelligence results migration...")
        
        try:
            data = self.load_json_file(filename)
            test_id = data.get('testId', 'intelligence')
            
            # Migrate intelligence types
            intelligence_types = data.get('intelligenceTypes', {})
            
            for type_code, type_data in intelligence_types.items():
                config_data = {
                    'name_gujarati': type_data.get('name', ''),
                    'name_english': type_data.get('englishName', ''),
                    'description_gujarati': type_data.get('description', ''),
                    'description_english': type_data.get('description', ''),
                    'traits': type_data.get('characteristics', []),
                    'careers': type_data.get('careerSuggestions', []),
                    'strengths': type_data.get('strengths', [])
                }
                
                self.create_or_update_configuration(db, test_id, 'intelligence_type', type_code, config_data)
            
            if not self.dry_run:
                db.commit()
                self.migration_state['completed_steps'].append(step_name)
                self.migration_state['data_hashes'][step_name] = self.get_file_hash(filename)
            
            logger.info("Intelligence results migration completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Intelligence results migration failed: {e}")
            if not self.dry_run:
                db.rollback()
            return False
    
    def migrate_decision_results(self, db: Session) -> bool:
        """Migrate Decision-making test result configurations"""
        step_name = 'decision_results'
        filename = 'decision_test_results.json'
        
        if not self.should_migrate_file(filename, step_name):
            self.migration_stats['configurations_skipped'] += 1
            return True
        
        logger.info("Starting Decision results migration...")
        
        try:
            data = self.load_json_file(filename)
            test_id = data.get('testId', 'decision')
            
            # Migrate decision styles
            decision_styles = data.get('decisionStyles', {})
            
            for style_code, style_data in decision_styles.items():
                config_data = {
                    'name_gujarati': style_data.get('name', ''),
                    'name_english': style_data.get('englishName', ''),
                    'description_gujarati': style_data.get('description', ''),
                    'description_english': style_data.get('description', ''),
                    'traits': style_data.get('characteristics', []),
                    'careers': style_data.get('suitableFor', []),
                    'strengths': style_data.get('strengths', []),
                    'recommendations': {
                        'weaknesses': style_data.get('weaknesses', []),
                        'improvementTips': style_data.get('improvementTips', [])
                    }
                }
                
                self.create_or_update_configuration(db, test_id, 'decision_style', style_code, config_data)
            
            # Migrate scoring ranges
            scoring_ranges = data.get('scoringRanges', {})
            for range_code, range_data in scoring_ranges.items():
                range_parts = range_data.get('range', '0-100').split('-')
                min_score = float(range_parts[0]) if len(range_parts) > 0 else 0.0
                max_score = float(range_parts[1]) if len(range_parts) > 1 else 100.0
                
                config_data = {
                    'name_gujarati': range_code,
                    'name_english': range_code,
                    'description_gujarati': range_data.get('description', ''),
                    'description_english': range_data.get('description', ''),
                    'min_score': min_score,
                    'max_score': max_score
                }
                
                self.create_or_update_configuration(db, test_id, 'scoring_range', range_code, config_data)
            
            if not self.dry_run:
                db.commit()
                self.migration_state['completed_steps'].append(step_name)
                self.migration_state['data_hashes'][step_name] = self.get_file_hash(filename)
            
            logger.info("Decision results migration completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Decision results migration failed: {e}")
            if not self.dry_run:
                db.rollback()
            return False
    
    def migrate_remaining_test_results(self, db: Session) -> bool:
        """Migrate remaining test result configurations (RIASEC, VARK, Life Situation)"""
        test_files = [
            ('riasec_test_results.json', 'riasec', 'riasec_results'),
            ('vark_test_results.json', 'vark', 'vark_results'),
            ('life_situation_test_results.json', 'life-situation', 'life_situation_results')
        ]
        
        success = True
        
        for filename, test_id, step_name in test_files:
            if not self.should_migrate_file(filename, step_name):
                self.migration_stats['configurations_skipped'] += 1
                continue
            
            logger.info(f"Starting {test_id} results migration...")
            
            try:
                data = self.load_json_file(filename)
                
                # Find the main data key (excluding metadata keys)
                main_key = None
                for key in data.keys():
                    if key not in ['testId', 'testName', 'testNameEnglish', 'description', 'scoringRanges']:
                        main_key = key
                        break
                
                if main_key and isinstance(data[main_key], dict):
                    for item_code, item_data in data[main_key].items():
                        config_data = {
                            'name_gujarati': item_data.get('name', item_data.get('gujarati', '')),
                            'name_english': item_data.get('englishName', item_data.get('english', '')),
                            'description_gujarati': item_data.get('description', ''),
                            'description_english': item_data.get('description', ''),
                            'traits': item_data.get('characteristics', item_data.get('traits', [])),
                            'careers': item_data.get('careerSuggestions', item_data.get('careers', [])),
                            'strengths': item_data.get('strengths', [])
                        }
                        
                        result_type = main_key.rstrip('s')  # Remove 's' from plural
                        self.create_or_update_configuration(db, test_id, result_type, item_code, config_data)
                
                # Migrate scoring ranges if they exist
                scoring_ranges = data.get('scoringRanges', {})
                for range_code, range_data in scoring_ranges.items():
                    range_parts = range_data.get('range', '0-100').split('-')
                    min_score = float(range_parts[0]) if len(range_parts) > 0 else 0.0
                    max_score = float(range_parts[1]) if len(range_parts) > 1 else 100.0
                    
                    config_data = {
                        'name_gujarati': range_code,
                        'name_english': range_code,
                        'description_gujarati': range_data.get('description', ''),
                        'description_english': range_data.get('description', ''),
                        'min_score': min_score,
                        'max_score': max_score
                    }
                    
                    self.create_or_update_configuration(db, test_id, 'scoring_range', range_code, config_data)
                
                if not self.dry_run:
                    db.commit()
                    self.migration_state['completed_steps'].append(step_name)
                    self.migration_state['data_hashes'][step_name] = self.get_file_hash(filename)
                
                logger.info(f"{test_id} results migration completed successfully")
                
            except Exception as e:
                logger.error(f"{test_id} results migration failed: {e}")
                if not self.dry_run:
                    db.rollback()
                success = False
                continue
        
        return success
    
    def run_migration(self) -> bool:
        """Run the complete test results migration process"""
        logger.info("Starting test results configuration migration...")
        start_time = datetime.now()
        
        try:
            # Create database tables
            from core.database import Base
            Base.metadata.create_all(bind=engine)
            
            # Get database session
            db = next(get_db())
            
            try:
                # Run migrations for each test type
                success = True
                success &= self.migrate_mbti_results(db)
                success &= self.migrate_bigfive_results(db)
                success &= self.migrate_intelligence_results(db)
                success &= self.migrate_decision_results(db)
                success &= self.migrate_remaining_test_results(db)
                
                if success:
                    end_time = datetime.now()
                    duration = end_time - start_time
                    
                    # Update migration state
                    self.migration_state['last_run'] = datetime.now()
                    self.save_migration_state()
                    
                    logger.info("=" * 60)
                    logger.info("TEST RESULTS MIGRATION COMPLETED SUCCESSFULLY!")
                    logger.info(f"Duration: {duration}")
                    logger.info(f"Configurations created: {self.migration_stats['configurations_created']}")
                    logger.info(f"Configurations updated: {self.migration_stats['configurations_updated']}")
                    logger.info(f"Configurations skipped: {self.migration_stats['configurations_skipped']}")
                    
                    if self.migration_stats['errors']:
                        logger.warning(f"Errors encountered: {len(self.migration_stats['errors'])}")
                        for error in self.migration_stats['errors']:
                            logger.warning(f"  - {error}")
                    
                    logger.info("=" * 60)
                    return True
                else:
                    logger.error("Test results migration failed")
                    return False
                    
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Test results migration failed with error: {e}")
            return False

def main():
    """Main function with command line argument support"""
    parser = argparse.ArgumentParser(description='Migrate test result configurations to question service database')
    parser.add_argument('--dry-run', action='store_true', help='Run migration in dry-run mode')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    migrator = TestResultsMigrator(dry_run=args.dry_run)
    success = migrator.run_migration()
    
    if success:
        print("Test results migration completed successfully!")
        sys.exit(0)
    else:
        print("Test results migration failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
