#!/usr/bin/env python3
"""
Comprehensive Data Population Script
Loads all test data, questions, and configurations in the correct order
"""

import os
import sys
import json
import logging
from datetime import datetime
from pathlib import Path

# Add the project root to the Python path
BACKEND_ROOT = Path(__file__).parent.absolute()
sys.path.append(str(BACKEND_ROOT))

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from core.database import get_db, engine, Base
from question_service.app.models.test import Test
from question_service.app.models.test_dimension import TestDimension
from question_service.app.models.test_section import TestSection
from question_service.app.models.question import Question
from question_service.app.models.option import Option
from question_service.app.models.test_result import TestResultConfiguration

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DataPopulator:
    def __init__(self):
        self.db = next(get_db())
        self.data_dir = BACKEND_ROOT / "question_service" / "data"
        
    def __enter__(self):
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.db.rollback()
        self.db.close()

    def load_json_file(self, filename: str) -> dict:
        """Load JSON data from file"""
        file_path = self.data_dir / filename
        if not file_path.exists():
            logger.warning(f"File not found: {file_path}")
            return {}
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading {filename}: {e}")
            return {}

    def populate_tests(self) -> int:
        """Populate basic test configurations"""
        logger.info("📋 Populating test configurations...")
        
        test_config = self.load_json_file("test_config.json")
        
        # Handle different JSON structures
        tests_data = []
        if test_config and "availableTests" in test_config:
            # Convert from existing format
            for test in test_config["availableTests"]:
                tests_data.append({
                    "test_id": test.get("id"),
                    "name": test.get("name"),
                    "english_name": test.get("english"),
                    "description": test.get("description"),
                    "icon": test.get("icon", "psychology"),
                    "color": test.get("color", "#4CAF50"),
                    "questions_count": test.get("questions", 20),
                    "duration": test.get("duration", "10-15 minutes"),
                    "is_active": True
                })
        elif test_config and "tests" in test_config:
            tests_data = test_config["tests"]
        else:
            logger.warning("No test config found, creating default tests")
            tests_data = [
                    {
                        "test_id": "mbti",
                        "name": "MBTI વ્યક્તિત્વ પરીક્ષણ",
                        "english_name": "MBTI Personality Test",
                        "description": "Myers-Briggs Type Indicator personality assessment",
                        "icon": "psychology",
                        "color": "#4CAF50",
                        "questions_count": 60,
                        "duration": "15-20 minutes",
                        "is_active": True
                    },
                    {
                        "test_id": "big_five",
                        "name": "બિગ ફાઇવ વ્યક્તિત્વ પરીક્ષણ",
                        "english_name": "Big Five Personality Test",
                        "description": "Five-factor model personality assessment",
                        "icon": "psychology",
                        "color": "#2196F3",
                        "questions_count": 50,
                        "duration": "10-15 minutes",
                        "is_active": True
                    },
                    {
                        "test_id": "riasec",
                        "name": "RIASEC કારકિર્દી રુચિ પરીક્ષણ",
                        "english_name": "RIASEC Career Interest Test",
                        "description": "Holland Code career interest assessment",
                        "icon": "work",
                        "color": "#FF9800",
                        "questions_count": 60,
                        "duration": "15-20 minutes",
                        "is_active": True
                    },
                    {
                        "test_id": "vark",
                        "name": "VARK શીખવાની શૈલી પરીક્ષણ",
                        "english_name": "VARK Learning Style Test",
                        "description": "Visual, Auditory, Reading, Kinesthetic learning style assessment",
                        "icon": "school",
                        "color": "#9C27B0",
                        "questions_count": 16,
                        "duration": "5-10 minutes",
                        "is_active": True
                    },
                    {
                        "test_id": "intelligence",
                        "name": "બુદ્ધિમત્તા પરીક્ષણ",
                        "english_name": "Intelligence Test",
                        "description": "Multiple intelligence assessment",
                        "icon": "psychology",
                        "color": "#607D8B",
                        "questions_count": 80,
                        "duration": "20-25 minutes",
                        "is_active": True
                    }
                ]
        
        count = 0
        for test_data in tests_data:
            try:
                existing_test = self.db.query(Test).filter(Test.test_id == test_data["test_id"]).first()
                
                if existing_test:
                    # Update existing test
                    for key, value in test_data.items():
                        if hasattr(existing_test, key):
                            setattr(existing_test, key, value)
                    existing_test.updated_at = datetime.now()
                    logger.info(f"Updated test: {test_data['test_id']}")
                else:
                    # Create new test
                    test = Test(**test_data)
                    self.db.add(test)
                    count += 1
                    logger.info(f"Created test: {test_data['test_id']}")
                    
            except Exception as e:
                logger.error(f"Error processing test {test_data.get('test_id', 'unknown')}: {e}")
                continue
        
        self.db.commit()
        logger.info(f"✅ Tests populated: {count} new, others updated")
        return count

    def populate_questions_and_options(self, test_id: str) -> int:
        """Populate questions and options for a specific test"""
        logger.info(f"❓ Populating questions for {test_id}...")
        
        # Map test_id to question file
        question_files = {
            "mbti": "mbit_questions.json",
            "bigfive": "big_five_questions.json",
            "riasec": "riasec_questions.json",
            "vark": "vark_questions.json",
            "intelligence": "intelligence_questions.json",
            "decision": "decision_questions.json",
            "life-situation": "life_situation_questions.json"
        }
        
        filename = question_files.get(test_id)
        if not filename:
            logger.warning(f"No question file found for test: {test_id}")
            return 0
            
        questions_data = self.load_json_file(filename)
        if not questions_data:
            return 0
        
        # Get test record
        test = self.db.query(Test).filter(Test.test_id == test_id).first()
        if not test:
            logger.error(f"Test not found: {test_id}")
            return 0
        
        count = 0
        questions_list = []
        
        # Handle different JSON structures
        if test_id == "mbti" and "mbti" in questions_data:
            # MBTI format: {"mbti": {"ei": [...], "sn": [...], ...}}
            mbti_data = questions_data["mbti"]
            for section_key, section_questions in mbti_data.items():
                for q in section_questions:
                    questions_list.append({
                        "question_text": q.get("question", ""),
                        "options": q.get("options", []),
                        "section": section_key
                    })
        elif test_id == "bigfive" and "BIGFIVE_QUESTIONS" in questions_data:
            # Big Five format: {"BIGFIVE_QUESTIONS": {"openness": [...], ...}}
            bigfive_data = questions_data["BIGFIVE_QUESTIONS"]
            for trait_key, trait_questions in bigfive_data.items():
                for q in trait_questions:
                    questions_list.append({
                        "question_text": q.get("question", ""),
                        "options": q.get("options", []),
                        "trait": trait_key
                    })
        elif test_id == "life-situation" and "life-situation" in questions_data:
            # Life situation format: {"life-situation": {"family": [...], "economic": [...], ...}}
            life_data = questions_data["life-situation"]
            for domain_key, domain_questions in life_data.items():
                for q in domain_questions:
                    questions_list.append({
                        "question_text": q.get("question", ""),
                        "options": q.get("options", []),
                        "domain": domain_key
                    })
        elif test_id in ["riasec", "intelligence", "vark", "decision"] and not questions_data.get("questions"):
            # These tests have direct category structure: {"realistic": [...], "musical": [...], ...}
            for category_key, category_questions in questions_data.items():
                if isinstance(category_questions, list):
                    for q in category_questions:
                        questions_list.append({
                            "question_text": q.get("question", ""),
                            "options": q.get("options", []),
                            "category": category_key
                        })
        else:
            # Standard format: {"questions": [...]}
            questions_list = questions_data.get("questions", [])
        
        for q_data in questions_list:
            try:
                # Check if question already exists
                existing_question = self.db.query(Question).filter(
                    Question.test_id == test.id,
                    Question.question_text == q_data.get("question_text", q_data.get("text", ""))
                ).first()
                
                if existing_question:
                    continue
                
                # Create question
                question = Question(
                    test_id=test.id,
                    question_text=q_data.get("question_text", q_data.get("text", "")),
                    question_type=q_data.get("question_type", "multiple_choice"),
                    question_order=q_data.get("order", count + 1),
                    is_active=True
                )
                self.db.add(question)
                self.db.flush()  # Get the question ID
                
                # Add options
                options_data = q_data.get("options", [])
                for idx, opt_data in enumerate(options_data):
                    # Get dimension and truncate to fit database constraint (max 10 chars)
                    dimension = opt_data.get("dimension", opt_data.get("type", q_data.get("category", q_data.get("trait", q_data.get("section", q_data.get("domain"))))))
                    if dimension and len(dimension) > 10:
                        # Create abbreviations for common long dimension names
                        dimension_map = {
                            "interpersonal": "inter",
                            "intrapersonal": "intra", 
                            "naturalistic": "nature",
                            "kinesthetic": "kines",
                            "linguistic": "ling",
                            "logical": "logic",
                            "musical": "music",
                            "spatial": "space",
                            "realistic": "R",
                            "investigative": "I",
                            "artistic": "A",
                            "social": "S",
                            "enterprising": "E",
                            "conventional": "C",
                            "rational": "ratio",
                            "intuitive": "intuit",
                            "dependent": "depend",
                            "avoidant": "avoid",
                            "spontaneous": "spont"
                        }
                        dimension = dimension_map.get(dimension, dimension[:10])
                    
                    option = Option(
                        question_id=question.id,
                        option_text=opt_data.get("text", opt_data.get("option_text", "")),
                        dimension=dimension,
                        weight=opt_data.get("weight", opt_data.get("score", 1)),
                        option_order=opt_data.get("order", idx + 1),
                        is_active=True
                    )
                    self.db.add(option)
                
                count += 1
                
            except Exception as e:
                logger.error(f"Error processing question for {test_id}: {e}")
                self.db.rollback()  # Rollback on error
                continue
        
        try:
            self.db.commit()
            logger.info(f"✅ Questions populated for {test_id}: {count}")
        except Exception as e:
            logger.error(f"Error committing questions for {test_id}: {e}")
            self.db.rollback()
            return 0
        return count

    def populate_test_results(self, test_id: str) -> int:
        """Populate test result configurations for a specific test"""
        logger.info(f"🎯 Populating result configurations for {test_id}...")
        
        # Map test_id to result file
        result_files = {
            "mbti": "mbti_test_results.json",
            "bigfive": "bigfive_test_results.json",
            "riasec": "riasec_test_results.json",
            "vark": "vark_test_results.json",
            "intelligence": "intelligence_test_results.json",
            "decision": "decision_test_results.json",
            "life-situation": "life_situation_test_results.json"
        }
        
        filename = result_files.get(test_id)
        if not filename:
            logger.warning(f"No result file found for test: {test_id}")
            return 0
            
        results_data = self.load_json_file(filename)
        if not results_data:
            return 0
        
        count = 0
        results_list = []
        
        # Handle different JSON structures
        if test_id == "mbti" and "personalityTypes" in results_data:
            # MBTI format: {"personalityTypes": {"ISTJ": {...}, "ISFJ": {...}, ...}}
            personality_types = results_data["personalityTypes"]
            for type_code, type_data in personality_types.items():
                results_list.append({
                    "result_code": type_code,
                    "result_name_gujarati": type_data.get("name", ""),
                    "result_name_english": type_data.get("gujarati", ""),
                    "description_gujarati": type_data.get("description", ""),
                    "description_english": type_data.get("description", ""),
                    "traits": type_data.get("traits", []),
                    "characteristics": type_data.get("characteristics", []),
                    "strengths": type_data.get("strengths", []),
                    "challenges": type_data.get("challenges", []),
                    "career_suggestions": type_data.get("careerSuggestions", []),
                    "result_type": "personality_type"
                })
        elif test_id == "bigfive" and "personalityDimensions" in results_data:
            # Big Five format: {"personalityDimensions": {"openness": {...}, ...}}
            dimensions = results_data["personalityDimensions"]
            for dim_code, dim_data in dimensions.items():
                results_list.append({
                    "result_code": dim_code,
                    "result_name_gujarati": dim_data.get("name", ""),
                    "result_name_english": dim_data.get("englishName", ""),
                    "description_gujarati": dim_data.get("description", ""),
                    "description_english": dim_data.get("description", ""),
                    "traits": dim_data.get("highTraits", []) + dim_data.get("lowTraits", []),
                    "characteristics": dim_data.get("characteristics", []),
                    "strengths": dim_data.get("strengths", []),
                    "career_suggestions": dim_data.get("careerSuggestions", []),
                    "result_type": "personality_dimension"
                })
        elif test_id == "riasec" and "interestTypes" in results_data:
            # RIASEC format: {"interestTypes": {"realistic": {...}, ...}}
            interest_types = results_data["interestTypes"]
            for type_code, type_data in interest_types.items():
                results_list.append({
                    "result_code": type_data.get("code", type_code),
                    "result_name_gujarati": type_data.get("name", ""),
                    "result_name_english": type_data.get("englishName", ""),
                    "description_gujarati": type_data.get("description", ""),
                    "description_english": type_data.get("description", ""),
                    "characteristics": type_data.get("characteristics", []),
                    "career_suggestions": type_data.get("careerSuggestions", []),
                    "result_type": "interest_type"
                })
        elif test_id == "vark" and "learningStyles" in results_data:
            # VARK format: {"learningStyles": {"visual": {...}, ...}}
            learning_styles = results_data["learningStyles"]
            for style_code, style_data in learning_styles.items():
                results_list.append({
                    "result_code": style_data.get("code", style_code),
                    "result_name_gujarati": style_data.get("name", ""),
                    "result_name_english": style_data.get("englishName", ""),
                    "description_gujarati": style_data.get("description", ""),
                    "description_english": style_data.get("description", ""),
                    "characteristics": style_data.get("characteristics", []),
                    "strengths": style_data.get("learningStrategies", []),
                    "result_type": "learning_style"
                })
        elif test_id == "intelligence" and "intelligenceTypes" in results_data:
            # Intelligence format: {"intelligenceTypes": {"linguistic": {...}, ...}}
            intelligence_types = results_data["intelligenceTypes"]
            for type_code, type_data in intelligence_types.items():
                results_list.append({
                    "result_code": type_code,
                    "result_name_gujarati": type_data.get("name", ""),
                    "result_name_english": type_data.get("englishName", ""),
                    "description_gujarati": type_data.get("description", ""),
                    "description_english": type_data.get("description", ""),
                    "characteristics": type_data.get("characteristics", []),
                    "strengths": type_data.get("strengths", []),
                    "career_suggestions": type_data.get("careerSuggestions", []),
                    "result_type": "intelligence_type"
                })
        elif test_id == "decision" and "decisionStyles" in results_data:
            # Decision format: {"decisionStyles": {"rational": {...}, ...}}
            decision_styles = results_data["decisionStyles"]
            for style_code, style_data in decision_styles.items():
                results_list.append({
                    "result_code": style_code,
                    "result_name_gujarati": style_data.get("name", ""),
                    "result_name_english": style_data.get("englishName", ""),
                    "description_gujarati": style_data.get("description", ""),
                    "description_english": style_data.get("description", ""),
                    "characteristics": style_data.get("characteristics", []),
                    "strengths": style_data.get("strengths", []),
                    "result_type": "decision_style"
                })
        elif test_id == "life-situation" and "lifeDomains" in results_data:
            # Life situation format: {"lifeDomains": {"social": {...}, ...}}
            life_domains = results_data["lifeDomains"]
            for domain_code, domain_data in life_domains.items():
                results_list.append({
                    "result_code": domain_code,
                    "result_name_gujarati": domain_data.get("name", ""),
                    "result_name_english": domain_data.get("englishName", ""),
                    "description_gujarati": domain_data.get("description", ""),
                    "description_english": domain_data.get("description", ""),
                    "characteristics": domain_data.get("aspects", []),
                    "strengths": domain_data.get("indicators", {}).get("positive", []),
                    "challenges": domain_data.get("indicators", {}).get("negative", []),
                    "result_type": "life_domain"
                })
        else:
            # Standard format: {"results": [...]} or {"configurations": [...]}
            results_list = results_data.get("results", results_data.get("configurations", []))
        
        for result_data in results_list:
            try:
                # Check if configuration already exists
                existing_config = self.db.query(TestResultConfiguration).filter(
                    TestResultConfiguration.test_id == test_id,
                    TestResultConfiguration.result_code == result_data.get("result_code", result_data.get("code", ""))
                ).first()
                
                if existing_config:
                    # Update existing
                    for key, value in result_data.items():
                        if hasattr(existing_config, key):
                            setattr(existing_config, key, value)
                    existing_config.updated_at = datetime.now()
                    continue
                
                # Create new configuration
                config = TestResultConfiguration(
                    test_id=test_id,
                    result_type=result_data.get("result_type", "personality_type"),
                    result_code=result_data.get("result_code", result_data.get("code", "")),
                    result_name_gujarati=result_data.get("result_name_gujarati", result_data.get("name_gujarati", "")),
                    result_name_english=result_data.get("result_name_english", result_data.get("name_english", "")),
                    description_gujarati=result_data.get("description_gujarati", ""),
                    description_english=result_data.get("description_english", ""),
                    traits=result_data.get("traits", []),
                    careers=result_data.get("careers", []),
                    strengths=result_data.get("strengths", []),
                    recommendations=result_data.get("recommendations", []),
                    characteristics=result_data.get("characteristics", []),
                    challenges=result_data.get("challenges", []),
                    career_suggestions=result_data.get("career_suggestions", []),
                    min_score=result_data.get("min_score", 0.0),
                    max_score=result_data.get("max_score", 100.0),
                    scoring_method=result_data.get("scoring_method", "percentage"),
                    is_active=result_data.get("is_active", True)
                )
                self.db.add(config)
                count += 1
                
            except Exception as e:
                logger.error(f"Error processing result config for {test_id}: {e}")
                self.db.rollback()  # Rollback on error
                continue
        
        try:
            self.db.commit()
            logger.info(f"✅ Result configurations populated for {test_id}: {count}")
        except Exception as e:
            logger.error(f"Error committing result configs for {test_id}: {e}")
            self.db.rollback()
            return 0
        return count

    def populate_all_data(self):
        """Populate all data in the correct order"""
        logger.info("🚀 Starting comprehensive data population...")
        
        try:
            # Step 1: Create tables if needed
            Base.metadata.create_all(bind=engine)
            
            # Step 2: Populate tests
            test_count = self.populate_tests()
            
            # Step 3: Get all test IDs
            tests = self.db.query(Test).all()
            test_ids = [test.test_id for test in tests]
            
            # Step 4: Populate questions and options for each test
            total_questions = 0
            for test_id in test_ids:
                questions_count = self.populate_questions_and_options(test_id)
                total_questions += questions_count
            
            # Step 5: Populate result configurations for each test
            total_results = 0
            for test_id in test_ids:
                results_count = self.populate_test_results(test_id)
                total_results += results_count
            
            logger.info("=" * 60)
            logger.info("🎉 DATA POPULATION COMPLETED SUCCESSFULLY!")
            logger.info(f"📋 Tests: {test_count} new")
            logger.info(f"❓ Questions: {total_questions} new")
            logger.info(f"🎯 Result configs: {total_results} new")
            logger.info("=" * 60)
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Data population failed: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return False

def main():
    """Main function"""
    logger.info("Starting LCJ Data Population...")
    
    try:
        with DataPopulator() as populator:
            success = populator.populate_all_data()
            
        if success:
            print("\n🎉 All data populated successfully!")
            print("\nNext steps:")
            print("1. Verify data in your database")
            print("2. Test the API endpoints")
            print("3. Run your application")
            return 0
        else:
            print("\n❌ Data population failed!")
            return 1
            
    except Exception as e:
        logger.error(f"Script execution failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
