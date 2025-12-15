"""
Simplified Test Result Calculators
Uses only TestResultConfiguration table for database integration
No dependency on QuestionExtended table
"""

from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

class SimpleTestCalculators:
    """Simplified collection of calculation functions for different test types"""

    @staticmethod
    def _get_config_from_db(db: Optional[Session], test_id: str, result_code: str) -> Dict[str, Any]:
        """Get configuration data from database"""
        if not db:
            return {}

        try:
            from question_service.app.models.test_result import TestResultConfiguration

            config = db.query(TestResultConfiguration).filter(
                TestResultConfiguration.test_id == test_id,
                TestResultConfiguration.result_code == result_code,
                TestResultConfiguration.is_active == True
            ).first()

            if config:
                return {
                    'description_gujarati': config.description_gujarati,
                    'description_english': config.description_english,
                    'result_name_gujarati': config.result_name_gujarati,
                    'result_name_english': config.result_name_english,
                    'traits': config.traits or [],
                    'careers': config.careers or [],
                    'strengths': config.strengths or [],
                    'recommendations': config.recommendations or [],
                    # MBTI-specific fields
                    'characteristics': config.characteristics or [],
                    'challenges': config.challenges or [],
                    'career_suggestions': config.career_suggestions or []
                }
        except Exception as e:
            pass

        return {}

    @staticmethod
    def calculate_mbti_result(answers: Dict[str, Any], db: Optional[Session] = None) -> Dict[str, Any]:
        """Calculate MBTI personality type from answers and get data from database"""

        # Initialize dimension counts (counting actual selections)
        dimension_counts = {
            'E': 0, 'I': 0,  # Extraversion vs Introversion
            'S': 0, 'N': 0,  # Sensing vs Intuition
            'T': 0, 'F': 0,  # Thinking vs Feeling
            'J': 0, 'P': 0   # Judging vs Perceiving
        }

        # Process each answer to count dimension selections

        for question_id, answer in answers.items():
            selected_option = None

            # Extract selected option from different answer formats
            if isinstance(answer, str):
                # Direct option selection (A, B, etc.)
                selected_option = answer.upper()
            elif isinstance(answer, dict):
                if 'selectedOption' in answer:
                    if isinstance(answer['selectedOption'], dict):
                        selected_option = answer['selectedOption'].get('value', answer['selectedOption'].get('option', ''))
                    else:
                        selected_option = str(answer['selectedOption']).upper()
                elif 'option' in answer:
                    selected_option = str(answer['option']).upper()
                elif 'value' in answer:
                    selected_option = str(answer['value']).upper()
                # Also check for dimension-based answers (fallback to old logic)
                elif 'dimension' in answer:
                    dimension = answer['dimension']
                    weight = answer.get('weight', 1)
                    if dimension in dimension_counts:
                        dimension_counts[dimension] += weight
                        continue
            elif isinstance(answer, (int, float)):
                # Numeric answer - use modulo mapping as fallback
                score = float(answer)
                question_num = int(question_id)

                # Simple mapping based on question number
                if question_num % 4 == 1:  # E/I questions
                    if score >= 3:
                        dimension_counts['E'] += 1
                    else:
                        dimension_counts['I'] += 1
                elif question_num % 4 == 2:  # S/N questions
                    if score >= 3:
                        dimension_counts['N'] += 1
                    else:
                        dimension_counts['S'] += 1
                elif question_num % 4 == 3:  # T/F questions
                    if score >= 3:
                        dimension_counts['T'] += 1
                    else:
                        dimension_counts['F'] += 1
                else:  # J/P questions
                    if score >= 3:
                        dimension_counts['J'] += 1
                    else:
                        dimension_counts['P'] += 1
                continue

            if selected_option:
                question_num = int(question_id)

                # Map questions to MBTI dimensions based on question number
                # Assuming questions are grouped: 1-5 (E/I), 6-10 (S/N), 11-15 (T/F), 16-20 (J/P)
                if 1 <= question_num <= 5:  # E/I questions
                    if selected_option == 'A':
                        dimension_counts['E'] += 1
                    elif selected_option == 'B':
                        dimension_counts['I'] += 1
                elif 6 <= question_num <= 10:  # S/N questions
                    if selected_option == 'A':
                        dimension_counts['S'] += 1
                    elif selected_option == 'B':
                        dimension_counts['N'] += 1
                elif 11 <= question_num <= 15:  # T/F questions
                    if selected_option == 'A':
                        dimension_counts['T'] += 1
                    elif selected_option == 'B':
                        dimension_counts['F'] += 1
                elif 16 <= question_num <= 20:  # J/P questions
                    if selected_option == 'A':
                        dimension_counts['J'] += 1
                    elif selected_option == 'B':
                        dimension_counts['P'] += 1

        # Determine dominant traits based on actual counts
        e_i = 'E' if dimension_counts['E'] > dimension_counts['I'] else 'I'
        s_n = 'S' if dimension_counts['S'] > dimension_counts['N'] else 'N'
        t_f = 'T' if dimension_counts['T'] > dimension_counts['F'] else 'F'
        j_p = 'J' if dimension_counts['J'] > dimension_counts['P'] else 'P'

        mbti_code = f"{e_i}{s_n}{t_f}{j_p}"

        # Get configuration data from database
        config_data = SimpleTestCalculators._get_config_from_db(db, 'mbti', mbti_code)

        # Calculate actual percentages from dimension counts
        def calculate_percentage(count1, count2):
            total = count1 + count2
            if total == 0:
                return 50  # Default if no selections
            return int((max(count1, count2) / total) * 100)

        # Create dimension results for display with actual calculated percentages
        dimension_results = [
            {
                'pair': 'E/I',
                'dominant': e_i,
                'scores': {'E': dimension_counts['E'], 'I': dimension_counts['I']},
                'percentage': calculate_percentage(dimension_counts['E'], dimension_counts['I'])
            },
            {
                'pair': 'S/N',
                'dominant': s_n,
                'scores': {'S': dimension_counts['S'], 'N': dimension_counts['N']},
                'percentage': calculate_percentage(dimension_counts['S'], dimension_counts['N'])
            },
            {
                'pair': 'T/F',
                'dominant': t_f,
                'scores': {'T': dimension_counts['T'], 'F': dimension_counts['F']},
                'percentage': calculate_percentage(dimension_counts['T'], dimension_counts['F'])
            },
            {
                'pair': 'J/P',
                'dominant': j_p,
                'scores': {'J': dimension_counts['J'], 'P': dimension_counts['P']},
                'percentage': calculate_percentage(dimension_counts['J'], dimension_counts['P'])
            }
        ]

        return {
            'type': 'MBTI',
            'code': mbti_code,
            'description': config_data.get('description_gujarati', f"તમારો MBTI પ્રકાર {mbti_code} છે"),
            'description_english': config_data.get('description_english', f"Your MBTI type is {mbti_code}"),
            'result_name_gujarati': config_data.get('result_name_gujarati', mbti_code),
            'result_name_english': config_data.get('result_name_english', mbti_code),
            'dimensions': dimension_results,
            # MBTI-specific fields from database
            'characteristics': config_data.get('characteristics', []),
            'challenges': config_data.get('challenges', []),
            'career_suggestions': config_data.get('career_suggestions', []),
            'strengths': config_data.get('strengths', []),
            # Keep legacy fields for backward compatibility
            'traits': config_data.get('traits', []),
            'careers': config_data.get('careers', []),
            'recommendations': config_data.get('recommendations', [])
        }

    @staticmethod
    def calculate_intelligence_result(answers: Dict[str, Any], db: Optional[Session] = None) -> Dict[str, Any]:
        """Calculate Multiple Intelligence types from answers"""

        # Initialize intelligence counts (counting A selections for each intelligence)
        intelligence_counts = {
            'linguistic': 0,
            'logical': 0,
            'spatial': 0,
            'musical': 0,
            'bodily-kinesthetic': 0,
            'interpersonal': 0,
            'intrapersonal': 0,
            'naturalistic': 0,
            'existential': 0
        }

        # Total questions per intelligence (5 questions each = 40 total for 8 intelligences)
        questions_per_intelligence = 5

        # Process each answer to count A selections for each intelligence
        for question_id, answer in answers.items():
            selected_option = None
            is_positive_answer = False

            # Extract selected option from different answer formats
            if isinstance(answer, str):
                selected_option = answer.upper()
                # Check for positive answers in Gujarati/English
                if any(pos in answer for pos in ['હા', 'હંમેશા', 'ખૂબ વધારે', 'YES', 'ALWAYS', 'VERY MUCH']):
                    is_positive_answer = True
                    selected_option = 'A'  # Treat positive answers as A
                elif any(neg in answer for neg in ['ના', 'નહીં', 'NO', 'NEVER']):
                    is_positive_answer = False
                    selected_option = 'B'  # Treat negative answers as B
            elif isinstance(answer, dict):
                # Check answer field for Gujarati text
                if 'answer' in answer:
                    answer_text = answer['answer']
                    if any(pos in answer_text for pos in ['હા', 'હંમેશા', 'ખૂબ વધારે', 'YES', 'ALWAYS', 'VERY MUCH']):
                        is_positive_answer = True
                        selected_option = 'A'
                    elif any(neg in answer_text for neg in ['ના', 'નહીં', 'NO', 'NEVER']):
                        is_positive_answer = False
                        selected_option = 'B'

                # Fallback to other fields
                if not selected_option:
                    if 'selectedOption' in answer:
                        if isinstance(answer['selectedOption'], dict):
                            selected_option = answer['selectedOption'].get('value', answer['selectedOption'].get('option', ''))
                        else:
                            selected_option = str(answer['selectedOption']).upper()
                    elif 'option' in answer:
                        selected_option = str(answer['option']).upper()
                    elif 'value' in answer:
                        selected_option = str(answer['value']).upper()
                    # Fallback to intelligence-based answers
                    elif 'intelligence' in answer or 'dimension' in answer:
                        intelligence = answer.get('intelligence', answer.get('dimension'))
                        weight = answer.get('weight', 1)
                        if intelligence in intelligence_counts:
                            intelligence_counts[intelligence] += weight
                            continue
                    # Use score/weight as fallback
                    elif 'score' in answer or 'weight' in answer:
                        score = answer.get('score', answer.get('weight', 0))
                        if score >= 3:  # High score = positive answer = A
                            selected_option = 'A'
                            is_positive_answer = True
                        else:
                            selected_option = 'B'
                            is_positive_answer = False
            elif isinstance(answer, (int, float)):
                # Numeric answer - use modulo mapping as fallback
                score = float(answer)
                question_num = int(question_id)
                intelligence_types = list(intelligence_counts.keys())
                intel_type = intelligence_types[question_num % len(intelligence_types)]

                if score >= 3:  # Assuming 1-5 scale, 3+ means "A" selection
                    intelligence_counts[intel_type] += 1
                continue

            if selected_option == 'A':
                question_num = int(question_id)

                # Map questions to Multiple Intelligence types based on question number
                # Updated to match current test structure (3 questions per type):
                # Questions 0-2: Musical, 3-5: Logical, 6-8: Spatial, 9-11: Bodily-Kinesthetic
                # Questions 12-14: Interpersonal, 15-17: Intrapersonal, 18-20: Naturalistic, 21-23: Linguistic, 24-26: Existential
                if 0 <= question_num <= 2:
                    intelligence_counts['musical'] += 1
                    
                elif 3 <= question_num <= 5:
                    intelligence_counts['logical'] += 1
                    
                elif 6 <= question_num <= 8:
                    intelligence_counts['spatial'] += 1
                    
                elif 9 <= question_num <= 11:
                    intelligence_counts['bodily-kinesthetic'] += 1
                    
                elif 12 <= question_num <= 14:
                    intelligence_counts['interpersonal'] += 1
                    
                elif 15 <= question_num <= 17:
                    intelligence_counts['intrapersonal'] += 1
                    
                elif 18 <= question_num <= 20:
                    intelligence_counts['naturalistic'] += 1
                    
                elif 21 <= question_num <= 23:
                    intelligence_counts['linguistic'] += 1
                    
                elif 24 <= question_num <= 26:
                    intelligence_counts['existential'] += 1

        # Find dominant intelligence type
        
        if all(count == 0 for count in intelligence_counts.values()):
            dominant_type = 'linguistic'  # Default
        else:
            dominant_type = max(intelligence_counts, key=intelligence_counts.get)

        # Get configuration data from database
        config_data = SimpleTestCalculators._get_config_from_db(db, 'intelligence', dominant_type)

        # Load detailed data from JSON file
        import json
        import os

        json_file_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'intelligence_test_results.json')
        detailed_data = {}
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
                detailed_data = json_data.get('intelligenceTypes', {})
        except Exception as e:
            print(f"Error loading intelligence test data: {e}")

        # Calculate percentages and levels based on actual A selections
        all_intelligences = []

        for intel_type, count in intelligence_counts.items():
            # Calculate percentage based on A selections out of total questions for this intelligence
            # Map intelligence type to actual question count (updated to match current question file)
            intel_question_counts = {
                'musical': 3,
                'logical': 3,
                'spatial': 3,
                'bodily-kinesthetic': 3,
                'interpersonal': 3,
                'intrapersonal': 3,
                'naturalistic': 3,
                'linguistic': 3,
                'existential': 3
            }
            actual_count = intel_question_counts.get(intel_type, 3)
            percentage = int((count / actual_count) * 100)

            if percentage >= 80:
                level = 'Very High'
            elif percentage >= 60:
                level = 'High'
            elif percentage >= 40:
                level = 'Medium'
            elif percentage >= 20:
                level = 'Low'
            else:
                level = 'Very Low'

            # Get detailed data for this intelligence type
            intel_details = detailed_data.get(intel_type, {})

            all_intelligences.append({
                'type': intel_type,
                'count': count,
                'total_questions': actual_count,
                'percentage': percentage,
                'level': level,
                'score': count,  # For compatibility
                'description': intel_details.get('description', f"{intel_type.replace('-', ' ').title()} Intelligence - {level} level ({count}/{actual_count} A selections, {percentage}%)"),
                'characteristics': intel_details.get('characteristics', []),
                'careerSuggestions': intel_details.get('careerSuggestions', []),
                'strengths': intel_details.get('strengths', [])
            })

        # Sort by count (descending) to get top intelligences
        all_intelligences.sort(key=lambda x: x['count'], reverse=True)

        # Get top 3 intelligences
        top_intelligences = all_intelligences[:3]

        return {
            'type': 'Multiple Intelligence',
            'dominantType': dominant_type,
            'topIntelligences': top_intelligences,
            'allIntelligences': all_intelligences,
            'profile': f'તમારા ટોચના ત્રણ બુદ્ધિ પ્રકારો: {", ".join([intel["type"].replace("-", " ").title() for intel in top_intelligences])}',
            'profile_english': f'Your top three intelligence types: {", ".join([intel["type"].replace("-", " ").title() for intel in top_intelligences])}',
            'result_name_gujarati': config_data.get('result_name_gujarati', dominant_type),
            'result_name_english': config_data.get('result_name_english', dominant_type),
            'traits': config_data.get('traits', []),
            'careers': config_data.get('careers', []),
            'strengths': config_data.get('strengths', []),
            'recommendations': config_data.get('recommendations', [])
        }

    @staticmethod
    def calculate_riasec_result(answers: Dict[str, Any], db: Optional[Session] = None) -> Dict[str, Any]:
        """Calculate RIASEC career interests from answers"""

        # Initialize interest counts (counting A selections for each interest)
        interest_counts = {
            'realistic': 0,
            'investigative': 0,
            'artistic': 0,
            'social': 0,
            'enterprising': 0,
            'conventional': 0
        }

        # Total questions per interest (3 questions each = 18 total)
        questions_per_interest = 3

        # Process each answer to count A selections for each interest
        for question_id, answer in answers.items():
            selected_option = None
            is_positive_answer = False

            # Extract selected option from different answer formats
            if isinstance(answer, str):
                selected_option = answer.upper()
                # Check for positive answers in Gujarati/English
                if any(pos in answer for pos in ['હા', 'હંમેશા', 'ખૂબ વધારે', 'YES', 'ALWAYS', 'VERY MUCH']):
                    is_positive_answer = True
                    selected_option = 'A'  # Treat positive answers as A
                elif any(neg in answer for neg in ['ના', 'નહીં', 'NO', 'NEVER']):
                    is_positive_answer = False
                    selected_option = 'B'  # Treat negative answers as B
            elif isinstance(answer, dict):
                # Check answer field for Gujarati text
                if 'answer' in answer:
                    answer_text = answer['answer']
                    if any(pos in answer_text for pos in ['હા', 'હંમેશા', 'ખૂબ વધારે', 'YES', 'ALWAYS', 'VERY MUCH']):
                        is_positive_answer = True
                        selected_option = 'A'
                    elif any(neg in answer_text for neg in ['ના', 'નહીં', 'NO', 'NEVER']):
                        is_positive_answer = False
                        selected_option = 'B'

                # Fallback to other fields
                if not selected_option:
                    if 'selectedOption' in answer:
                        if isinstance(answer['selectedOption'], dict):
                            selected_option = answer['selectedOption'].get('value', answer['selectedOption'].get('option', ''))
                        else:
                            selected_option = str(answer['selectedOption']).upper()
                    elif 'option' in answer:
                        selected_option = str(answer['option']).upper()
                    elif 'value' in answer:
                        selected_option = str(answer['value']).upper()
                    # Use score/weight as fallback
                    elif 'score' in answer or 'weight' in answer:
                        score = answer.get('score', answer.get('weight', 0))
                        if score >= 3:  # High score = positive answer = A
                            selected_option = 'A'
                            is_positive_answer = True
                        else:
                            selected_option = 'B'
                            is_positive_answer = False
            elif isinstance(answer, (int, float)):
                # Numeric answer - use modulo mapping as fallback
                score = float(answer)
                question_num = int(question_id)
                interest_types = list(interest_counts.keys())
                interest_type = interest_types[question_num % len(interest_types)]

                if score >= 3:  # Assuming 1-5 scale, 3+ means "A" selection
                    interest_counts[interest_type] += 1
                continue

            if selected_option == 'A':
                question_num = int(question_id)

                # Map questions to RIASEC interests based on question number
                # Questions 0-2: Realistic, 3-5: Investigative, 6-8: Artistic, 9-11: Social, 12-14: Enterprising, 15-17: Conventional
                if 0 <= question_num <= 2:
                    interest_counts['realistic'] += 1
                elif 3 <= question_num <= 5:
                    interest_counts['investigative'] += 1
                elif 6 <= question_num <= 8:
                    interest_counts['artistic'] += 1
                elif 9 <= question_num <= 11:
                    interest_counts['social'] += 1
                elif 12 <= question_num <= 14:
                    interest_counts['enterprising'] += 1
                elif 15 <= question_num <= 17:
                    interest_counts['conventional'] += 1

        # Find dominant interest type
        if all(count == 0 for count in interest_counts.values()):
            dominant_type = 'realistic'  # Default
        else:
            dominant_type = max(interest_counts, key=interest_counts.get)

        # Get configuration data from database
        config_data = SimpleTestCalculators._get_config_from_db(db, 'riasec', dominant_type)

        # Load detailed data from JSON file
        import json
        import os

        json_file_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'riasec_test_results.json')
        detailed_data = {}
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
                detailed_data = json_data.get('interestTypes', {})
        except Exception as e:
            print(f"Error loading RIASEC JSON data: {e}")

        # Calculate percentages and levels based on actual A selections
        all_interests = []

        for interest_type, count in interest_counts.items():
            # Calculate percentage based on A selections out of total questions for this interest
            percentage = int((count / questions_per_interest) * 100)

            if percentage >= 80:
                level = 'Very High'
            elif percentage >= 60:
                level = 'High'
            elif percentage >= 40:
                level = 'Medium'
            elif percentage >= 20:
                level = 'Low'
            else:
                level = 'Very Low'

            # Get detailed data for this interest type
            interest_details = detailed_data.get(interest_type, {})

            all_interests.append({
                'type': interest_type,
                'count': count,
                'total_questions': questions_per_interest,
                'percentage': percentage,
                'level': level,
                'score': count,  # For compatibility
                'description': interest_details.get('description', f"{interest_type.title()} Interest - {level} level ({count}/{questions_per_interest} A selections, {percentage}%)"),
                'characteristics': interest_details.get('characteristics', []),
                'careerSuggestions': interest_details.get('careerSuggestions', []),
                'workEnvironment': interest_details.get('workEnvironment', [])
            })

        # Sort by count (descending) to get top interests
        all_interests.sort(key=lambda x: x['count'], reverse=True)

        # Generate Holland Code (top 3)
        holland_code = ''.join([interest['type'][0].upper() for interest in all_interests[:3]])

        # Get top 3 interests
        top_interests = all_interests[:3]

        return {
            'type': 'RIASEC Career Interest',
            'hollandCode': holland_code,
            'topInterests': top_interests,
            'interests': all_interests,
            'allInterests': all_interests,
            'careers': config_data.get('careers', []),
            'profile': f'તમારા ટોચના ત્રણ કારકિર્દી રુચિઓ: {", ".join([interest["type"].title() for interest in top_interests])}',
            'profile_english': f'Your top three career interests: {", ".join([interest["type"].title() for interest in top_interests])}',
            'result_name_gujarati': config_data.get('result_name_gujarati', dominant_type),
            'result_name_english': config_data.get('result_name_english', dominant_type),
            'traits': config_data.get('traits', []),
            'strengths': config_data.get('strengths', []),
            'recommendations': config_data.get('recommendations', [])
        }

    @staticmethod
    def calculate_bigfive_result(answers: Dict[str, Any], db: Optional[Session] = None) -> Dict[str, Any]:
        """Calculate Big Five personality traits from answers"""

        # Initialize trait counts (counting A selections for each trait)
        trait_counts = {
            'openness': 0,
            'conscientiousness': 0,
            'extraversion': 0,
            'agreeableness': 0,
            'neuroticism': 0
        }

        # Total questions per trait (3 questions each = 15 total)
        questions_per_trait = 3

        # Process each answer to count A selections for each trait
        for question_id, answer in answers.items():
            selected_option = None
            is_positive_answer = False

            # Extract selected option from different answer formats
            if isinstance(answer, str):
                selected_option = answer.upper()
                # Check for positive answers in Gujarati/English
                if any(pos in answer for pos in ['હા', 'હંમેશા', 'ખૂબ વધારે', 'YES', 'ALWAYS', 'VERY MUCH']):
                    is_positive_answer = True
                    selected_option = 'A'  # Treat positive answers as A
                elif any(neg in answer for neg in ['ના', 'નહીં', 'NO', 'NEVER']):
                    is_positive_answer = False
                    selected_option = 'B'  # Treat negative answers as B
            elif isinstance(answer, dict):
                # Check answer field for Gujarati text
                if 'answer' in answer:
                    answer_text = answer['answer']
                    if any(pos in answer_text for pos in ['હા', 'હંમેશા', 'ખૂબ વધારે', 'YES', 'ALWAYS', 'VERY MUCH']):
                        is_positive_answer = True
                        selected_option = 'A'
                    elif any(neg in answer_text for neg in ['ના', 'નહીં', 'NO', 'NEVER']):
                        is_positive_answer = False
                        selected_option = 'B'

                # Fallback to other fields
                if not selected_option:
                    if 'selectedOption' in answer:
                        if isinstance(answer['selectedOption'], dict):
                            selected_option = answer['selectedOption'].get('value', answer['selectedOption'].get('option', ''))
                        else:
                            selected_option = str(answer['selectedOption']).upper()
                    elif 'option' in answer:
                        selected_option = str(answer['option']).upper()
                    elif 'value' in answer:
                        selected_option = str(answer['value']).upper()
                    # Fallback to dimension-based answers
                    elif 'dimension' in answer:
                        dimension = answer['dimension']
                        weight = answer.get('weight', 1)
                        if dimension in trait_counts:
                            trait_counts[dimension] += weight
                            continue
                    # Use score/weight as fallback
                    elif 'score' in answer or 'weight' in answer:
                        score = answer.get('score', answer.get('weight', 0))
                        if score >= 3:  # High score = positive answer = A
                            selected_option = 'A'
                            is_positive_answer = True
                        else:
                            selected_option = 'B'
                            is_positive_answer = False
            elif isinstance(answer, (int, float)):
                # Numeric answer - use modulo mapping as fallback
                score = float(answer)
                question_num = int(question_id)
                trait_names = list(trait_counts.keys())
                trait = trait_names[question_num % len(trait_names)]

                if score >= 3:  # Assuming 1-5 scale, 3+ means "A" selection
                    trait_counts[trait] += 1
                continue

            if selected_option == 'A':
                question_num = int(question_id)

                # Map questions to Big Five traits based on question number
                # Questions 0-2: Openness, 3-5: Conscientiousness, 6-8: Extraversion, 9-11: Agreeableness, 12-14: Neuroticism
                if 0 <= question_num <= 2:
                    trait_counts['openness'] += 1
                elif 3 <= question_num <= 5:
                    trait_counts['conscientiousness'] += 1
                elif 6 <= question_num <= 8:
                    trait_counts['extraversion'] += 1
                elif 9 <= question_num <= 11:
                    trait_counts['agreeableness'] += 1
                elif 12 <= question_num <= 14:
                    trait_counts['neuroticism'] += 1

        # Load detailed data from JSON file
        import json
        import os

        json_file_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'bigfive_test_results.json')
        detailed_data = {}
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
                detailed_data = json_data.get('personalityDimensions', {})
        except Exception as e:
            print(f"Error loading Big Five JSON data: {e}")

        # Calculate percentages and levels based on actual A selections
        dimensions = []

        for trait, count in trait_counts.items():
            # Calculate percentage based on A selections out of total questions for this trait
            percentage = int((count / questions_per_trait) * 100)

            if percentage >= 80:
                level = 'Very High'
            elif percentage >= 60:
                level = 'High'
            elif percentage >= 40:
                level = 'Medium'
            elif percentage >= 20:
                level = 'Low'
            else:
                level = 'Very Low'

            # Get detailed data for this trait
            trait_details = detailed_data.get(trait, {})

            dimensions.append({
                'trait': trait,
                'count': count,
                'total_questions': questions_per_trait,
                'percentage': percentage,
                'level': level,
                'score': count,  # For compatibility
                'description': trait_details.get('description', f"{trait.title()} - {level} level ({count}/{questions_per_trait} A selections, {percentage}%)"),
                'highTraits': trait_details.get('highTraits', []),
                'lowTraits': trait_details.get('lowTraits', []),
                'careerSuggestions': trait_details.get('careerSuggestions', {})
            })

        # Sort by count (descending) to get top traits
        dimensions.sort(key=lambda x: x['count'], reverse=True)

        # Get top 3 traits
        top_traits = dimensions[:3]

        return {
            'type': 'Big Five Personality',
            'dimensions': dimensions,
            'topTraits': top_traits,
            'profile': f'તમારા ટોચના ત્રણ વ્યક્તિત્વ લક્ષણો: {", ".join([trait["trait"].title() for trait in top_traits])}',
            'summary': 'Big Five પરીક્ષણ તમારા વ્યક્તિત્વના પાંચ મુખ્ય પરિમાણોને માપે છે.',
            'profile_english': f'Your top three personality traits: {", ".join([trait["trait"].title() for trait in top_traits])}'
        }

    @staticmethod
    def calculate_vark_result(answers: Dict[str, Any], db: Optional[Session] = None) -> Dict[str, Any]:
        """Calculate VARK learning styles from answers"""

        # Initialize style counts (counting A selections for each style)
        style_counts = {
            'visual': 0,
            'auditory': 0,
            'reading': 0,
            'kinesthetic': 0
        }

        # Total questions per style (5 questions each = 20 total)
        questions_per_style = 5

        # Process each answer to count A selections for each style
        for question_id, answer in answers.items():
            selected_option = None
            is_positive_answer = False

            # Extract selected option from different answer formats
            if isinstance(answer, str):
                selected_option = answer.upper()
                # Check for positive answers in Gujarati/English
                if any(pos in answer for pos in ['હા', 'હંમેશા', 'ખૂબ વધારે', 'YES', 'ALWAYS', 'VERY MUCH']):
                    is_positive_answer = True
                    selected_option = 'A'  # Treat positive answers as A
                elif any(neg in answer for neg in ['ના', 'નહીં', 'NO', 'NEVER']):
                    is_positive_answer = False
                    selected_option = 'B'  # Treat negative answers as B
            elif isinstance(answer, dict):
                # Check answer field for Gujarati text
                if 'answer' in answer:
                    answer_text = answer['answer']
                    if any(pos in answer_text for pos in ['હા', 'હંમેશા', 'ખૂબ વધારે', 'YES', 'ALWAYS', 'VERY MUCH']):
                        is_positive_answer = True
                        selected_option = 'A'
                    elif any(neg in answer_text for neg in ['ના', 'નહીં', 'NO', 'NEVER']):
                        is_positive_answer = False
                        selected_option = 'B'

                # Fallback to other fields
                if not selected_option:
                    if 'selectedOption' in answer:
                        if isinstance(answer['selectedOption'], dict):
                            selected_option = answer['selectedOption'].get('value', answer['selectedOption'].get('option', ''))
                        else:
                            selected_option = str(answer['selectedOption']).upper()
                    elif 'option' in answer:
                        selected_option = str(answer['option']).upper()
                    elif 'value' in answer:
                        selected_option = str(answer['value']).upper()
                    # Use score/weight as fallback
                    elif 'score' in answer or 'weight' in answer:
                        score = answer.get('score', answer.get('weight', 0))
                        if score >= 3:  # High score = positive answer = A
                            selected_option = 'A'
                            is_positive_answer = True
                        else:
                            selected_option = 'B'
                            is_positive_answer = False
            elif isinstance(answer, (int, float)):
                # Numeric answer - use modulo mapping as fallback
                score = float(answer)
                question_num = int(question_id)
                style_types = list(style_counts.keys())
                style_type = style_types[question_num % len(style_types)]

                if score >= 3:  # Assuming 1-5 scale, 3+ means "A" selection
                    style_counts[style_type] += 1
                continue

            if selected_option == 'A':
                question_num = int(question_id)

                # Map questions to VARK styles based on question number
                # Updated to match current test structure (3 questions per style):
                # Questions 0-2: Visual, 3-5: Auditory, 6-8: Reading, 9-11: Kinesthetic
                if 0 <= question_num <= 2:
                    style_counts['visual'] += 1
                elif 3 <= question_num <= 5:
                    style_counts['auditory'] += 1
                elif 6 <= question_num <= 8:
                    style_counts['reading'] += 1
                elif 9 <= question_num <= 11:
                    style_counts['kinesthetic'] += 1

        # Find primary learning style
        if all(count == 0 for count in style_counts.values()):
            primary_style = 'visual'  # Default
        else:
            primary_style = max(style_counts, key=style_counts.get)

        # Get configuration data from database
        config_data = SimpleTestCalculators._get_config_from_db(db, 'vark', primary_style)

        # Load detailed data from JSON file
        import json
        import os

        json_file_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'vark_test_results.json')
        detailed_data = {}
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
                detailed_data = json_data.get('learningStyles', {})
        except Exception as e:
            # Removed print statement
            pass

        # Calculate percentages and levels based on actual A selections
        all_styles = []

        for style_type, count in style_counts.items():
            # Calculate percentage based on A selections out of total questions for this style
            # Map style type to actual question count (updated to match current question file)
            style_question_counts = {
                'visual': 3,
                'auditory': 3,
                'reading': 3,
                'kinesthetic': 3
            }
            actual_count = style_question_counts.get(style_type, 3)
            percentage = int((count / actual_count) * 100)

            if percentage >= 80:
                level = 'Very High'
            elif percentage >= 60:
                level = 'High'
            elif percentage >= 40:
                level = 'Medium'
            elif percentage >= 20:
                level = 'Low'
            else:
                level = 'Very Low'

            # Get detailed data for this style
            style_details = detailed_data.get(style_type, {})

            all_styles.append({
                'type': style_type,
                'count': count,
                'total_questions': actual_count,
                'percentage': percentage,
                'level': level,
                'score': count,  # For compatibility
                'description': style_details.get('description', f"{style_type.title()} Learning - {level} level ({count}/{actual_count} A selections, {percentage}%)"),
                'characteristics': style_details.get('characteristics', []),
                'learningStrategies': style_details.get('learningStrategies', []),
                'studyTips': style_details.get('studyTips', []),
                'careerSuggestions': style_details.get('careerSuggestions', [])
            })

        # Sort by count (descending) to get top styles
        all_styles.sort(key=lambda x: x['count'], reverse=True)

        # Get top 3 styles
        top_styles = all_styles[:3]

        return {
            'type': 'VARK Learning Style',
            'primaryStyle': {'type': primary_style, 'percentage': all_styles[0]['percentage']},
            'topStyles': top_styles,
            'allStyles': all_styles,
            'profile': f'તમારા ટોચના ત્રણ શીખવાની શૈલીઓ: {", ".join([style["type"].title() for style in top_styles])}',
            'profile_english': f'Your top three learning styles: {", ".join([style["type"].title() for style in top_styles])}',
            'result_name_gujarati': config_data.get('result_name_gujarati', primary_style),
            'result_name_english': config_data.get('result_name_english', primary_style),
            'traits': config_data.get('traits', []),
            'recommendations': config_data.get('recommendations', [])
        }

    @staticmethod
    def calculate_svs_result(answers: Dict[str, Any], db: Optional[Session] = None) -> Dict[str, Any]:
        """Calculate Schwartz Values from answers"""

        # Initialize value scores
        value_scores = {
            'achievement': 0, 'power': 0, 'security': 0, 'benevolence': 0, 'universalism': 0,
            'self-direction': 0, 'stimulation': 0, 'hedonism': 0, 'tradition': 0, 'conformity': 0
        }

        # Process each answer to calculate value scores
        value_types = list(value_scores.keys())
        for question_id, answer in answers.items():
            score = 0

            # Extract score from different answer formats
            if isinstance(answer, (int, float)):
                score = float(answer)
            elif isinstance(answer, dict):
                if 'score' in answer:
                    score = float(answer['score'])
                elif 'selectedOption' in answer and isinstance(answer['selectedOption'], dict):
                    score = float(answer['selectedOption'].get('score', 0))
                elif 'weight' in answer:
                    score = float(answer['weight'])

            if score > 0:
                question_num = int(question_id)

                # Map questions to values (cycling through values)
                value_type = value_types[question_num % len(value_types)]
                value_scores[value_type] += score

        # Calculate percentages based on actual scores
        total_score = sum(value_scores.values())
        all_values = []

        for value_type, score in value_scores.items():
            if total_score > 0:
                percentage = int((score / total_score) * 100)
            else:
                percentage = 10  # Default equal distribution

            all_values.append({
                'type': value_type,
                'percentage': max(5, percentage),  # Minimum 5%
                'score': score
            })

        # Sort by percentage
        all_values.sort(key=lambda x: x['percentage'], reverse=True)
        core_values = all_values[:3]

        return {
            'type': 'Schwartz Values',
            'coreValues': core_values,
            'allValues': all_values,
            'profile': f'તમારા મુખ્ય મૂલ્યો {", ".join([v["type"] for v in core_values])} છે.'
        }

    @staticmethod
    def calculate_decision_result(answers: Dict[str, Any], db: Optional[Session] = None) -> Dict[str, Any]:
        """Calculate Decision Making styles from answers"""

        # Initialize style counts (counting A selections for each style)
        style_counts = {
            'rational': 0,
            'intuitive': 0,
            'dependent': 0,
            'avoidant': 0,
            'spontaneous': 0
        }

        # Total questions per style (3 questions each = 15 total)
        questions_per_style = 3

        # Process each answer to count A selections for each style
        for question_id, answer in answers.items():
            selected_option = None
            is_positive_answer = False

            # Extract selected option from different answer formats
            if isinstance(answer, str):
                selected_option = answer.upper()
                # Check for positive answers in Gujarati/English
                if any(pos in answer for pos in ['હા', 'હંમેશા', 'ખૂબ વધારે', 'YES', 'ALWAYS', 'VERY MUCH']):
                    is_positive_answer = True
                    selected_option = 'A'  # Treat positive answers as A
                elif any(neg in answer for neg in ['ના', 'નહીં', 'NO', 'NEVER']):
                    is_positive_answer = False
                    selected_option = 'B'  # Treat negative answers as B
            elif isinstance(answer, dict):
                # Check answer field for Gujarati text
                if 'answer' in answer:
                    answer_text = answer['answer']
                    if any(pos in answer_text for pos in ['હા', 'હંમેશા', 'ખૂબ વધારે', 'YES', 'ALWAYS', 'VERY MUCH']):
                        is_positive_answer = True
                        selected_option = 'A'
                    elif any(neg in answer_text for neg in ['ના', 'નહીં', 'NO', 'NEVER']):
                        is_positive_answer = False
                        selected_option = 'B'

                # Fallback to other fields
                if not selected_option:
                    if 'selectedOption' in answer:
                        if isinstance(answer['selectedOption'], dict):
                            selected_option = answer['selectedOption'].get('value', answer['selectedOption'].get('option', ''))
                        else:
                            selected_option = str(answer['selectedOption']).upper()
                    elif 'option' in answer:
                        selected_option = str(answer['option']).upper()
                    elif 'value' in answer:
                        selected_option = str(answer['value']).upper()
                    # Use score/weight as fallback
                    elif 'score' in answer or 'weight' in answer:
                        score = answer.get('score', answer.get('weight', 0))
                        if score >= 3:  # High score = positive answer = A
                            selected_option = 'A'
                            is_positive_answer = True
                        else:
                            selected_option = 'B'
                            is_positive_answer = False
            elif isinstance(answer, (int, float)):
                # Numeric answer - use modulo mapping as fallback
                score = float(answer)
                question_num = int(question_id)
                style_types = list(style_counts.keys())
                style_type = style_types[question_num % len(style_types)]

                if score >= 3:  # Assuming 1-5 scale, 3+ means "A" selection
                    style_counts[style_type] += 1
                continue

            if selected_option == 'A':
                question_num = int(question_id)

                # Map questions to Decision Making styles based on question number
                # Questions 0-2: Rational, 3-5: Intuitive, 6-8: Dependent, 9-11: Avoidant, 12-14: Spontaneous
                if 0 <= question_num <= 2:
                    style_counts['rational'] += 1
                elif 3 <= question_num <= 5:
                    style_counts['intuitive'] += 1
                elif 6 <= question_num <= 8:
                    style_counts['dependent'] += 1
                elif 9 <= question_num <= 11:
                    style_counts['avoidant'] += 1
                elif 12 <= question_num <= 14:
                    style_counts['spontaneous'] += 1

        # Find primary decision style
        if all(count == 0 for count in style_counts.values()):
            primary_style = 'rational'  # Default
        else:
            primary_style = max(style_counts, key=style_counts.get)

        # Get configuration data from database
        config_data = SimpleTestCalculators._get_config_from_db(db, 'decision', primary_style)

        # Load detailed data from JSON file
        import json
        import os

        json_file_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'decision_test_results.json')
        detailed_data = {}
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
                detailed_data = json_data.get('decisionStyles', {})
        except Exception as e:
            # Removed print statement
            pass

        # Calculate percentages and levels based on actual A selections
        all_styles = []

        for style_type, count in style_counts.items():
            # Calculate percentage based on A selections out of total questions for this style
            percentage = int((count / questions_per_style) * 100)

            if percentage >= 80:
                level = 'Very High'
            elif percentage >= 60:
                level = 'High'
            elif percentage >= 40:
                level = 'Medium'
            elif percentage >= 20:
                level = 'Low'
            else:
                level = 'Very Low'

            # Get detailed data for this style
            style_details = detailed_data.get(style_type, {})

            all_styles.append({
                'type': style_type,
                'count': count,
                'total_questions': questions_per_style,
                'percentage': percentage,
                'level': level,
                'score': count,  # For compatibility
                'description': style_details.get('description', f"{style_type.title()} Decision Making - {level} level ({count}/{questions_per_style} A selections, {percentage}%)"),
                'characteristics': style_details.get('characteristics', []),
                'strengths': style_details.get('strengths', []),
                'weaknesses': style_details.get('weaknesses', []),
                'suitableFor': style_details.get('suitableFor', [])
            })

        # Sort by count (descending) to get top styles
        all_styles.sort(key=lambda x: x['count'], reverse=True)

        # Get top 3 styles
        top_styles = all_styles[:3]

        return {
            'type': 'Decision Making Style',
            'primaryStyle': all_styles[0],
            'topStyles': top_styles,
            'allStyles': all_styles,
            'profile': f'તમારા ટોચના ત્રણ નિર્ણય શૈલીઓ: {", ".join([style["type"].title() for style in top_styles])}',
            'profile_english': f'Your top three decision making styles: {", ".join([style["type"].title() for style in top_styles])}',
            'result_name_gujarati': config_data.get('result_name_gujarati', primary_style),
            'result_name_english': config_data.get('result_name_english', primary_style),
            'traits': config_data.get('traits', []),
            'recommendations': config_data.get('recommendations', [])
        }

    @staticmethod
    def calculate_life_situation_result(answers: Dict[str, Any], db: Optional[Session] = None) -> Dict[str, Any]:
        """Calculate Life Situation assessment from answers - returns questions and answers instead of scores"""
        
        # Instead of calculating scores, we return the questions and user's selected answers
        # This is what the user requested - to show questions and answers, not calculated results
        
        # Load questions from JSON file
        import os
        import json
        
        questions_data = {}
        try:
            # Get the path to the questions file
            current_dir = os.path.dirname(os.path.abspath(__file__))
            questions_file = os.path.join(current_dir, '..', '..', 'data', 'life_situation_questions.json')
            
            with open(questions_file, 'r', encoding='utf-8') as f:
                questions_data = json.load(f)
        except Exception as e:
            print(f"Error loading life situation questions: {e}")
        
        # Extract questions from the loaded data
        all_questions = []
        if 'life-situation' in questions_data:
            life_questions = questions_data['life-situation']
            # Combine all categories
            for category in ['family', 'financial', 'career']:
                if category in life_questions:
                    all_questions.extend(life_questions[category])
        
        # Categories mapping
        categories = {
            'family': {
                'name_gujarati': 'કુટુંબ અને સમાજ',
                'name_english': 'Family & Society',
                'questions_range': [0, 0]  # Question 0 only
            },
            'financial': {
                'name_gujarati': 'આર્થિક પરિસ્થિતિ', 
                'name_english': 'Financial Situation',
                'questions_range': [1, 5]  # Questions 1-5
            },
            'career': {
                'name_gujarati': 'ભૌગોલિક અને કારકિર્દી',
                'name_english': 'Geographic & Career',
                'questions_range': [6, 9]  # Questions 6-9
            }
        }
        
        # Process answers to create a structured response
        processed_answers = []
        total_questions = len(answers)
        
        # Handle both "q1", "q2"... and "0", "1"... formats
        for i in range(total_questions):
            # Try both formats
            question_key = f"q{i+1}"  # q1, q2, q3...
            if question_key not in answers:
                question_key = str(i)  # 0, 1, 2...
            
            if question_key in answers:
                # Determine category based on question number (0-indexed)
                # Q0: family, Q1-Q5: financial, Q6-Q9: career
                category = 'family'
                if 1 <= i <= 5:
                    category = 'financial'
                elif 6 <= i <= 9:
                    category = 'career'
                
                answer_data = answers[question_key]
                
                # Get the actual question text
                question_text = f"પ્રશ્ન {i + 1}"  # Default fallback
                if i < len(all_questions) and 'question' in all_questions[i]:
                    question_text = all_questions[i]['question']
                
                # Extract answer text - handle different formats
                answer_text = answer_data
                if isinstance(answer_data, dict):
                    answer_text = answer_data.get('answer', answer_data.get('text', str(answer_data)))
                
                processed_answers.append({
                    'question_number': i + 1,
                    'category': category,
                    'category_gujarati': categories[category]['name_gujarati'],
                    'category_english': categories[category]['name_english'],
                    'question_text': question_text,
                    'answer': answer_text
                })
        
        return {
            'type': 'Life Situation Assessment',
            'testType': 'life-situation',
            'result_name_gujarati': 'જીવન પરિવર્તન સફર',
            'result_name_english': 'Life Transformation Journey',
            'description_gujarati': 'તમારા જીવન પરિસ્થિતિના પ્રશ્નો અને જવાબો',
            'description_english': 'Your life situation questions and answers',
            'total_questions': total_questions,
            'categories': categories,
            'processed_answers': processed_answers,
            'userAnswers': answers,  # Include raw answers for component
            'questions': all_questions,  # Include questions for frontend
            'display_type': 'questions_and_answers'  # Flag to indicate this should show Q&A format
        }
