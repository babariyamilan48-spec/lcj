#!/usr/bin/env python3
"""
Production-ready JSON data migration script for question service database.

This script reads JSON files from the data/ directory and populates the database
according to the defined models:
- Tests from test_config.json
- Test sections from test_config.json
- Test dimensions from test_config.json
- Questions and options from all question JSON files

Features:
- Comprehensive error handling and logging
- Progress tracking with statistics
- Dry-run mode for testing
- Data validation and integrity checks
- Rollback capabilities
- Colored console output
"""

import os
import sys
import json
import logging
import argparse
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
from core.database_fixed import get_db_session as get_db, engine
from question_service.app.models import Test, TestSection, TestDimension, Question, Option

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
file_handler = logging.FileHandler('migration.log')
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

class JSONDataMigrator:
    """Production-ready JSON data migrator"""
    
    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.migration_stats = {
            'tests_created': 0,
            'sections_created': 0,
            'dimensions_created': 0,
            'questions_created': 0,
            'options_created': 0,
            'errors': []
        }
        self.test_mapping = {}  # Maps test_id to database Test object
    
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
    
    def validate_test_config(self, data: Dict[str, Any]) -> bool:
        """Validate test configuration data"""
        required_keys = ['availableTests']
        for key in required_keys:
            if key not in data:
                logger.error(f"Missing required key in test_config.json: {key}")
                return False
        
        # testDimensions is optional - if missing, we'll skip dimension migration
        if 'testDimensions' not in data:
            logger.warning("testDimensions not found in test_config.json - will skip dimension migration")
        
        # Validate test structure
        for test in data['availableTests']:
            required_fields = ['id', 'name', 'english', 'description']
            for field in required_fields:
                if field not in test:
                    logger.error(f"Test {test.get('id', 'unknown')} missing field: {field}")
                    return False
        
        logger.info("Test configuration validation passed")
        return True
    
    def migrate_tests(self, db: Session, test_config: Dict[str, Any]) -> bool:
        """Migrate test configurations"""
        logger.info("Starting test migration...")
        
        try:
            available_tests = test_config.get('availableTests', [])
            
            # Create progress bar if available
            if TQDM_AVAILABLE:
                test_iterator = tqdm(available_tests, desc="Migrating tests", unit="test")
            else:
                test_iterator = available_tests
            
            for test_config_item in test_iterator:
                try:
                    # Check if test already exists
                    existing_test = db.query(Test).filter(Test.test_id == test_config_item['id']).first()
                    if existing_test:
                        logger.info(f"Test {test_config_item['id']} already exists, skipping...")
                        self.test_mapping[test_config_item['id']] = existing_test
                        continue
                    
                    if self.dry_run:
                        logger.info(f"[DRY RUN] Would create test: {test_config_item['id']}")
                        self.migration_stats['tests_created'] += 1
                        # Create a mock test object for dry-run
                        mock_test = type('MockTest', (), {'id': 1, 'test_id': test_config_item['id']})()
                        self.test_mapping[test_config_item['id']] = mock_test
                        continue
                    
                    # Create test
                    test = Test(
                        test_id=test_config_item['id'],
                        name=test_config_item['name'],
                        english_name=test_config_item['english'],
                        description=test_config_item['description'],
                        icon=test_config_item.get('icon', 'Brain'),
                        color=test_config_item.get('color', '#3498db'),
                        questions_count=test_config_item.get('questions', 0),
                        duration=test_config_item.get('duration', '30 મિનિટ'),
                        is_active=True
                    )
                    
                    db.add(test)
                    db.flush()  # Get the ID
                    
                    # Store mapping for later use
                    self.test_mapping[test_config_item['id']] = test
                    
                    # Create sections
                    sections_created = self._create_test_sections(db, test, test_config_item.get('sections', []))
                    self.migration_stats['sections_created'] += sections_created
                    
                    self.migration_stats['tests_created'] += 1
                    logger.info(f"Created test: {test_config_item['id']} with {sections_created} sections")
                    
                except Exception as e:
                    error_msg = f"Failed to create test {test_config_item.get('id', 'unknown')}: {e}"
                    logger.error(error_msg)
                    self.migration_stats['errors'].append(error_msg)
                    continue
            
            if not self.dry_run:
                db.commit()
            
            logger.info(f"Test migration completed. Created {self.migration_stats['tests_created']} tests")
            return True
            
        except Exception as e:
            logger.error(f"Test migration failed: {e}")
            if not self.dry_run:
                db.rollback()
            return False
    
    def _create_test_sections(self, db: Session, test: Test, sections_config: List[Dict]) -> int:
        """Create test sections"""
        sections_created = 0
        
        for section_config in sections_config:
            try:
                section = TestSection(
                    test_id=test.id,
                    section_id=section_config['id'],
                    name=section_config['name'],
                    gujarati_name=section_config.get('gujarati')
                )
                db.add(section)
                sections_created += 1
            
            except Exception as e:
                logger.warning(f"Failed to create section {section_config.get('id', 'unknown')}: {e}")
                continue
        
        return sections_created
    
    def migrate_dimensions(self, db: Session, test_config: Dict[str, Any]) -> bool:
        """Migrate test dimensions"""
        logger.info("Starting dimensions migration...")
        
        try:
            test_dimensions = test_config.get('testDimensions', {})
            
            if not test_dimensions:
                logger.info("No testDimensions found - skipping dimensions migration")
                return True
            
            for test_id, dimensions in test_dimensions.items():
                # Get the test
                test = self.test_mapping.get(test_id)
                if not test:
                    logger.warning(f"Test {test_id} not found, skipping dimensions...")
                    continue
                
                for dimension_id, dimension_config in dimensions.items():
                    try:
                        # Check if dimension already exists
                        existing_dimension = db.query(TestDimension).filter(
                            TestDimension.test_id == test.id,
                            TestDimension.dimension_id == dimension_id
                        ).first()
                        if existing_dimension:
                            continue
                        
                        if self.dry_run:
                            logger.info(f"[DRY RUN] Would create dimension: {test_id}.{dimension_id}")
                            self.migration_stats['dimensions_created'] += 1
                            continue
                        
                        dimension = TestDimension(
                            test_id=test.id,
                            dimension_id=dimension_id,
                            name=dimension_config['name'],
                            english_name=dimension_config.get('english', ''),
                            gujarati_name=dimension_config.get('gujarati'),
                            description=dimension_config.get('description'),
                            careers=dimension_config.get('careers', [])
                        )
                        
                        db.add(dimension)
                        self.migration_stats['dimensions_created'] += 1
                        
                    except Exception as e:
                        error_msg = f"Failed to create dimension {test_id}.{dimension_id}: {e}"
                        logger.error(error_msg)
                        self.migration_stats['errors'].append(error_msg)
                        continue
                
                logger.info(f"Created dimensions for test: {test_id}")
            
            if not self.dry_run:
                db.commit()
            
            logger.info(f"Dimensions migration completed. Created {self.migration_stats['dimensions_created']} dimensions")
            return True
            
        except Exception as e:
            logger.error(f"Dimensions migration failed: {e}")
            if not self.dry_run:
                db.rollback()
            return False
    
    def migrate_questions(self, db: Session) -> bool:
        """Migrate questions and options from all question files"""
        logger.info("Starting questions migration...")
        
        try:
            # Map of question files to their test IDs
            question_files = {
                'big_five_questions.json': 'bigfive',
                'vark_questions.json': 'vark',
                'svs_questions.json': 'svs',
                'riasec_questions.json': 'riasec',
                'intelligence_questions.json': 'intelligence',
                'decision_questions.json': 'decision',
                'life_situation_questions.json': 'life-situation',
                'mbit_questions.json': 'mbti'
            }
            
            for filename, test_id in question_files.items():
                try:
                    logger.info(f"Processing {filename}...")
                    questions_data = self.load_json_file(filename)
                    
                    # Get the test
                    test = self.test_mapping.get(test_id)
                    if not test:
                        logger.warning(f"Test {test_id} not found, skipping {filename}...")
                        continue
                    
                    questions_created = self._create_questions_for_test(db, test, questions_data, filename)
                    logger.info(f"Created {questions_created} questions from {filename}")
                    
                except Exception as e:
                    error_msg = f"Failed to process {filename}: {e}"
                    logger.error(error_msg)
                    self.migration_stats['errors'].append(error_msg)
                    continue
            
            if not self.dry_run:
                db.commit()
            
            logger.info(f"Questions migration completed. Created {self.migration_stats['questions_created']} questions")
            return True
            
        except Exception as e:
            logger.error(f"Questions migration failed: {e}")
            if not self.dry_run:
                db.rollback()
            return False
    
    def _create_questions_for_test(self, db: Session, test: Test, questions_data: Dict[str, Any], filename: str) -> int:
        """Create questions for a specific test"""
        questions_created = 0
        question_order = 0
        
        # Handle different question file structures
        if filename == 'big_five_questions.json':
            # Big Five has sections (openness, conscientiousness, etc.)
            for section_id, section_questions in questions_data.get('BIGFIVE_QUESTIONS', {}).items():
                # Get the section
                section = db.query(TestSection).filter(
                    TestSection.test_id == test.id,
                    TestSection.section_id == section_id
                ).first()
                
                for question_data in section_questions:
                    question_order += 1
                    questions_created += self._create_question_with_options(
                        db, test, section, question_data, question_order
                    )
        
        elif filename in ['vark_questions.json', 'svs_questions.json', 'riasec_questions.json', 
                         'intelligence_questions.json', 'decision_questions.json']:
            # These files have sections as top-level keys
            for section_id, section_questions in questions_data.items():
                # Get the section
                section = db.query(TestSection).filter(
                    TestSection.test_id == test.id,
                    TestSection.section_id == section_id
                ).first()
                
                for question_data in section_questions:
                    question_order += 1
                    questions_created += self._create_question_with_options(
                        db, test, section, question_data, question_order
                    )
        
        elif filename in ['life_situation_questions.json', 'mbit_questions.json']:
            # These have nested structure - handle the inner level
            for test_key, test_sections in questions_data.items():
                if isinstance(test_sections, dict):
                    for section_id, section_questions in test_sections.items():
                        # Get the section
                        section = db.query(TestSection).filter(
                            TestSection.test_id == test.id,
                            TestSection.section_id == section_id
                        ).first()
                        
                        for question_data in section_questions:
                            question_order += 1
                            questions_created += self._create_question_with_options(
                                db, test, section, question_data, question_order
                            )
        
        return questions_created
    
    def _create_question_with_options(self, db: Session, test: Test, section: Optional[TestSection], 
                                    question_data: Dict, question_order: int) -> int:
        """Create a single question with its options"""
        try:
            if self.dry_run:
                logger.info(f"[DRY RUN] Would create question: {question_data.get('question', 'Unknown')[:50]}...")
                self.migration_stats['questions_created'] += 1
                return 1
            
            # Create question
            question = Question(
                test_id=test.id,
                section_id=section.id if section else None,
                question_text=question_data['question'],
                question_order=question_order,
                is_active=True
            )
            
            db.add(question)
            db.flush()  # Get the ID
            
            # Create options
            option_order = 0
            for option_data in question_data.get('options', []):
                option_order += 1
                
                option = Option(
                    question_id=question.id,
                    option_text=option_data['text'],
                    dimension=option_data.get('dimension'),
                    weight=option_data.get('weight', option_data.get('score', 1)),
                    option_order=option_order,
                    is_active=True
                )
                
                db.add(option)
                self.migration_stats['options_created'] += 1
            
            self.migration_stats['questions_created'] += 1
            return 1
            
        except Exception as e:
            error_msg = f"Failed to create question: {e}"
            logger.error(error_msg)
            self.migration_stats['errors'].append(error_msg)
            return 0
    
    def run_migration(self) -> bool:
        """Run the complete migration process"""
        logger.info("Starting JSON data migration...")
        start_time = datetime.now()
        
        try:
            # Load test configuration
            logger.info("Loading test configuration...")
            test_config = self.load_json_file('test_config.json')
            if not self.validate_test_config(test_config):
                logger.error("Test configuration validation failed")
                return False
            
            # Create database tables
            from core.database_fixed import Base
            Base.metadata.create_all(bind=engine)
            
            # Get database session
            db = next(get_db())
            
            try:
                # Run migrations
                success = True
                success &= self.migrate_tests(db, test_config)
                success &= self.migrate_dimensions(db, test_config)
                success &= self.migrate_questions(db)
                
                if success:
                    end_time = datetime.now()
                    duration = end_time - start_time
                    
                    logger.info("=" * 50)
                    logger.info("MIGRATION COMPLETED SUCCESSFULLY!")
                    logger.info(f"Duration: {duration}")
                    logger.info(f"Tests created: {self.migration_stats['tests_created']}")
                    logger.info(f"Sections created: {self.migration_stats['sections_created']}")
                    logger.info(f"Dimensions created: {self.migration_stats['dimensions_created']}")
                    logger.info(f"Questions created: {self.migration_stats['questions_created']}")
                    logger.info(f"Options created: {self.migration_stats['options_created']}")
                    
                    if self.migration_stats['errors']:
                        logger.warning(f"Errors encountered: {len(self.migration_stats['errors'])}")
                        for error in self.migration_stats['errors']:
                            logger.warning(f"  - {error}")
                    
                    logger.info("=" * 50)
                    return True
                else:
                    logger.error("Migration failed")
                    return False
                    
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Migration failed with error: {e}")
            return False

def main():
    """Main function with command line argument support"""
    parser = argparse.ArgumentParser(description='Migrate JSON data to question service database')
    parser.add_argument('--dry-run', action='store_true', help='Run migration in dry-run mode')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    migrator = JSONDataMigrator(dry_run=args.dry_run)
    success = migrator.run_migration()
    
    if success:
        print("Migration completed successfully!")
        sys.exit(0)
    else:
        print("Migration failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
