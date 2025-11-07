"""
Test Result Calculators
Separate calculation functions for each psychological test type
Integrates with test_result_configurations table for actual result data
"""

from typing import Dict, Any, List, Tuple, Optional
import json
from collections import Counter
import math
from sqlalchemy.orm import Session

class TestCalculators:
    """Collection of calculation functions for different test types"""
    
    @staticmethod
    def calculate_mbti_result(answers: Dict[str, Any], db: Optional[Session] = None) -> Dict[str, Any]:
        """Calculate MBTI personality type from answers and get data from database"""
        
        # Simplified MBTI calculation based on answer patterns
        # This is a basic implementation - you can enhance it based on your question structure
        
        # MBTI dimension mappings
        dimensions = {
            'E': 0, 'I': 0,  # Extraversion vs Introversion
            'S': 0, 'N': 0,  # Sensing vs Intuition
            'T': 0, 'F': 0,  # Thinking vs Feeling
            'J': 0, 'P': 0   # Judging vs Perceiving
        }
        
        # Simple scoring based on answer values
        # This assumes answers are numeric (1-5 scale)
        answer_values = []
        for answer in answers.values():
            if isinstance(answer, (int, float)):
                answer_values.append(float(answer))
            elif isinstance(answer, dict) and 'score' in answer:
                answer_values.append(float(answer['score']))
        
        if not answer_values:
            # Default to INTJ if no valid answers
            dimensions = {'E': 2, 'I': 8, 'S': 3, 'N': 7, 'T': 7, 'F': 3, 'J': 6, 'P': 4}
        else:
            # Simple distribution based on answer patterns
            avg_score = sum(answer_values) / len(answer_values)
            total_answers = len(answer_values)
            
            # Distribute scores based on answer patterns (simplified logic)
            if avg_score > 3.5:  # Higher scores tend toward E, N, T, J
                dimensions['E'] = int(total_answers * 0.6)
                dimensions['I'] = int(total_answers * 0.4)
                dimensions['N'] = int(total_answers * 0.7)
                dimensions['S'] = int(total_answers * 0.3)
                dimensions['T'] = int(total_answers * 0.6)
                dimensions['F'] = int(total_answers * 0.4)
                dimensions['J'] = int(total_answers * 0.5)
                dimensions['P'] = int(total_answers * 0.5)
            else:  # Lower scores tend toward I, S, F, P
                dimensions['I'] = int(total_answers * 0.6)
                dimensions['E'] = int(total_answers * 0.4)
                dimensions['S'] = int(total_answers * 0.6)
                dimensions['N'] = int(total_answers * 0.4)
                dimensions['F'] = int(total_answers * 0.6)
                dimensions['T'] = int(total_answers * 0.4)
                dimensions['P'] = int(total_answers * 0.6)
                dimensions['J'] = int(total_answers * 0.4)
        
        # Determine dominant traits
        e_i = 'E' if dimensions['E'] > dimensions['I'] else 'I'
        s_n = 'S' if dimensions['S'] > dimensions['N'] else 'N'
        t_f = 'T' if dimensions['T'] > dimensions['F'] else 'F'
        j_p = 'J' if dimensions['J'] > dimensions['P'] else 'P'
        
        mbti_code = f"{e_i}{s_n}{t_f}{j_p}"
        
        # Calculate percentages
        total_e_i = dimensions['E'] + dimensions['I']
        total_s_n = dimensions['S'] + dimensions['N']
        total_t_f = dimensions['T'] + dimensions['F']
        total_j_p = dimensions['J'] + dimensions['P']
        
        dimension_results = [
            {
                'pair': 'E/I',
                'dominant': e_i,
                'scores': {'E': dimensions['E'], 'I': dimensions['I']},
                'percentage': round((dimensions[e_i] / max(total_e_i, 1)) * 100, 1)
            },
            {
                'pair': 'S/N',
                'dominant': s_n,
                'scores': {'S': dimensions['S'], 'N': dimensions['N']},
                'percentage': round((dimensions[s_n] / max(total_s_n, 1)) * 100, 1)
            },
            {
                'pair': 'T/F',
                'dominant': t_f,
                'scores': {'T': dimensions['T'], 'F': dimensions['F']},
                'percentage': round((dimensions[t_f] / max(total_t_f, 1)) * 100, 1)
            },
            {
                'pair': 'J/P',
                'dominant': j_p,
                'scores': {'J': dimensions['J'], 'P': dimensions['P']},
                'percentage': round((dimensions[j_p] / max(total_j_p, 1)) * 100, 1)
            }
        ]
        
        # Get configuration data from database
        config_data = TestCalculators._get_config_from_db(db, 'mbti', mbti_code)
        
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
            'strengths': config_data.get('strengths', TestCalculators._get_mbti_strengths(mbti_code)),
            # Keep legacy fields for backward compatibility
            'traits': config_data.get('traits', TestCalculators._get_mbti_traits(mbti_code)),
            'careers': config_data.get('careers', TestCalculators._get_mbti_careers(mbti_code)),
            'recommendations': config_data.get('recommendations', TestCalculators._get_mbti_recommendations(mbti_code))
        }
    
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
            print(f"Error getting config from DB: {str(e)}")
        
        return {}
    
    @staticmethod
    def calculate_intelligence_result(answers: Dict[str, Any], questions: List[Dict], db: Optional[Session] = None) -> Dict[str, Any]:
        """Calculate Multiple Intelligence scores from answers"""
        
        # Intelligence types
        intelligence_scores = {
            'linguistic': 0,
            'logical-mathematical': 0,
            'spatial': 0,
            'musical': 0,
            'bodily-kinesthetic': 0,
            'interpersonal': 0,
            'intrapersonal': 0,
            'naturalistic': 0
        }
        
        intelligence_counts = {key: 0 for key in intelligence_scores.keys()}
        
        # Process answers
        for question_id, answer in answers.items():
            question = next((q for q in questions if str(q.get('id')) == str(question_id)), None)
            if not question:
                continue
                
            intelligence_type = question.get('intelligence_type', '').lower()
            if intelligence_type in intelligence_scores:
                score = float(answer) if isinstance(answer, (int, float)) else 3
                intelligence_scores[intelligence_type] += score
                intelligence_counts[intelligence_type] += 1
        
        # Calculate averages and percentages
        all_intelligences = []
        total_possible = sum(intelligence_counts.values()) * 5  # Assuming 5-point scale
        
        for intel_type, total_score in intelligence_scores.items():
            count = intelligence_counts[intel_type]
            if count > 0:
                average_score = total_score / count
                percentage = round((total_score / (count * 5)) * 100, 1)
            else:
                average_score = 0
                percentage = 0
                
            all_intelligences.append({
                'type': intel_type,
                'score': round(average_score, 2),
                'percentage': percentage,
                'description': TestCalculators._get_intelligence_description(intel_type)
            })
        
        # Sort by percentage
        all_intelligences.sort(key=lambda x: x['percentage'], reverse=True)
        
        # Get top 3
        top_intelligences = all_intelligences[:3]
        dominant_type = all_intelligences[0]['type'] if all_intelligences else 'linguistic'
        
        # Get configuration data from database for dominant type
        config_data = TestCalculators._get_config_from_db(db, 'intelligence', dominant_type)
        
        # Enhance intelligence data with database configurations
        for intelligence in all_intelligences:
            intel_config = TestCalculators._get_config_from_db(db, 'intelligence', intelligence['type'])
            if intel_config:
                intelligence['description'] = intel_config.get('description_gujarati', intelligence.get('description', ''))
                intelligence['description_english'] = intel_config.get('description_english', '')
                intelligence['result_name_gujarati'] = intel_config.get('result_name_gujarati', intelligence['type'])
                intelligence['result_name_english'] = intel_config.get('result_name_english', intelligence['type'])
        
        return {
            'type': 'Multiple Intelligence',
            'dominantType': dominant_type,
            'topIntelligences': top_intelligences,
            'allIntelligences': all_intelligences,
            'profile': config_data.get('description_gujarati', f"તમારી પ્રમુખ બુદ્ધિ {dominant_type} છે, જે તમને આ ક્ષેત્રમાં વિશેષ કુશળતા આપે છે."),
            'profile_english': config_data.get('description_english', f"Your dominant intelligence is {dominant_type}"),
            'result_name_gujarati': config_data.get('result_name_gujarati', dominant_type),
            'result_name_english': config_data.get('result_name_english', dominant_type),
            'traits': config_data.get('traits', []),
            'careers': config_data.get('careers', []),
            'strengths': config_data.get('strengths', []),
            'recommendations': config_data.get('recommendations', [])
        }
    
    @staticmethod
    def calculate_bigfive_result(answers: Dict[str, Any], questions: List[Dict], db: Optional[Session] = None) -> Dict[str, Any]:
        """Calculate Big Five personality traits from answers"""
        
        # Big Five dimensions
        trait_scores = {
            'openness': 0,
            'conscientiousness': 0,
            'extraversion': 0,
            'agreeableness': 0,
            'neuroticism': 0
        }
        
        trait_counts = {key: 0 for key in trait_scores.keys()}
        
        # Process answers
        for question_id, answer in answers.items():
            question = next((q for q in questions if str(q.get('id')) == str(question_id)), None)
            if not question:
                continue
                
            trait = question.get('trait', '').lower()
            if trait in trait_scores:
                score = float(answer) if isinstance(answer, (int, float)) else 3
                
                # Handle reverse scoring if needed
                if question.get('reverse_scored', False):
                    score = 6 - score  # Reverse 1-5 scale
                
                trait_scores[trait] += score
                trait_counts[trait] += 1
        
        # Calculate dimensions
        dimensions = []
        for trait, total_score in trait_scores.items():
            count = trait_counts[trait]
            if count > 0:
                average_score = total_score / count
                percentage = round((average_score / 5) * 100, 1)
                
                # Determine level
                if percentage >= 70:
                    level = 'ઉચ્ચ'
                elif percentage >= 30:
                    level = 'મધ્યમ'
                else:
                    level = 'નીચું'
            else:
                average_score = 3
                percentage = 60
                level = 'મધ્યમ'
            
            dimensions.append({
                'trait': trait,
                'score': round(average_score, 2),
                'percentage': percentage,
                'level': level,
                'description': TestCalculators._get_bigfive_description(trait, level)
            })
        
        return {
            'type': 'Big Five Personality',
            'dimensions': dimensions,
            'profile': 'તમારું વ્યક્તિત્વ પ્રોફાઇલ તમારી અનોખી શક્તિઓ અને વિકાસના ક્ષેત્રો દર્શાવે છે.',
            'summary': 'Big Five પરીક્ષણ તમારા વ્યક્તિત્વના પાંચ મુખ્ય પરિમાણોને માપે છે.'
        }
    
    @staticmethod
    def calculate_riasec_result(answers: Dict[str, Any], questions: List[Dict], db: Optional[Session] = None) -> Dict[str, Any]:
        """Calculate RIASEC career interests from answers"""
        
        # RIASEC types
        interest_scores = {
            'realistic': 0,
            'investigative': 0,
            'artistic': 0,
            'social': 0,
            'enterprising': 0,
            'conventional': 0
        }
        
        interest_counts = {key: 0 for key in interest_scores.keys()}
        
        # Process answers
        for question_id, answer in answers.items():
            question = next((q for q in questions if str(q.get('id')) == str(question_id)), None)
            if not question:
                continue
                
            interest_type = question.get('interest_type', '').lower()
            if interest_type in interest_scores:
                score = float(answer) if isinstance(answer, (int, float)) else 3
                interest_scores[interest_type] += score
                interest_counts[interest_type] += 1
        
        # Calculate interests
        all_interests = []
        for interest_type, total_score in interest_scores.items():
            count = interest_counts[interest_type]
            if count > 0:
                average_score = total_score / count
                percentage = round((average_score / 5) * 100, 1)
            else:
                average_score = 0
                percentage = 0
            
            all_interests.append({
                'type': interest_type,
                'score': round(average_score, 2),
                'percentage': percentage,
                'description': TestCalculators._get_riasec_description(interest_type)
            })
        
        # Sort by percentage
        all_interests.sort(key=lambda x: x['percentage'], reverse=True)
        
        # Generate Holland Code (top 3)
        holland_code = ''.join([interest['type'][0].upper() for interest in all_interests[:3]])
        
        return {
            'type': 'RIASEC Career Interest',
            'hollandCode': holland_code,
            'interests': all_interests,
            'allInterests': all_interests,
            'careers': TestCalculators._get_riasec_careers(holland_code),
            'profile': f'તમારો Holland કોડ {holland_code} છે, જે તમારી કારકિર્દી રુચિઓ દર્શાવે છે.'
        }
    
    @staticmethod
    def calculate_vark_result(answers: Dict[str, Any], questions: List[Dict], db: Optional[Session] = None) -> Dict[str, Any]:
        """Calculate VARK learning styles from answers"""
        
        # VARK styles
        style_scores = {
            'visual': 0,
            'auditory': 0,
            'reading': 0,
            'kinesthetic': 0
        }
        
        style_counts = {key: 0 for key in style_scores.keys()}
        
        # Process answers
        for question_id, answer in answers.items():
            question = next((q for q in questions if str(q.get('id')) == str(question_id)), None)
            if not question:
                continue
                
            style_type = question.get('style_type', '').lower()
            if style_type in style_scores:
                score = float(answer) if isinstance(answer, (int, float)) else 3
                style_scores[style_type] += score
                style_counts[style_type] += 1
        
        # Calculate styles
        all_styles = []
        for style_type, total_score in style_scores.items():
            count = style_counts[style_type]
            if count > 0:
                average_score = total_score / count
                percentage = round((average_score / 5) * 100, 1)
            else:
                average_score = 0
                percentage = 0
            
            all_styles.append({
                'type': style_type,
                'score': round(average_score, 2),
                'percentage': percentage,
                'description': TestCalculators._get_vark_description(style_type)
            })
        
        # Sort by percentage
        all_styles.sort(key=lambda x: x['percentage'], reverse=True)
        
        primary_style = all_styles[0] if all_styles else {'type': 'visual', 'percentage': 0}
        
        return {
            'type': 'VARK Learning Style',
            'primaryStyle': primary_style,
            'allStyles': all_styles,
            'profile': f'તમારી પ્રાથમિક શીખવાની શૈલી {primary_style["type"]} છે.',
            'recommendations': TestCalculators._get_vark_recommendations(primary_style['type'])
        }
    
    @staticmethod
    def calculate_svs_result(answers: Dict[str, Any], questions: List[Dict], db: Optional[Session] = None) -> Dict[str, Any]:
        """Calculate Schwartz Values from answers"""
        
        # Schwartz values
        value_scores = {
            'achievement': 0,
            'power': 0,
            'security': 0,
            'benevolence': 0,
            'universalism': 0,
            'self-direction': 0,
            'stimulation': 0,
            'hedonism': 0,
            'tradition': 0,
            'conformity': 0
        }
        
        value_counts = {key: 0 for key in value_scores.keys()}
        
        # Process answers
        for question_id, answer in answers.items():
            question = next((q for q in questions if str(q.get('id')) == str(question_id)), None)
            if not question:
                continue
                
            value_type = question.get('value_type', '').lower()
            if value_type in value_scores:
                score = float(answer) if isinstance(answer, (int, float)) else 3
                value_scores[value_type] += score
                value_counts[value_type] += 1
        
        # Calculate values
        all_values = []
        for value_type, total_score in value_scores.items():
            count = value_counts[value_type]
            if count > 0:
                average_score = total_score / count
                percentage = round((average_score / 5) * 100, 1)
            else:
                average_score = 0
                percentage = 0
            
            all_values.append({
                'type': value_type,
                'score': round(average_score, 2),
                'percentage': percentage,
                'description': TestCalculators._get_svs_description(value_type)
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
    def calculate_decision_result(answers: Dict[str, Any], questions: List[Dict], db: Optional[Session] = None) -> Dict[str, Any]:
        """Calculate Decision Making styles from answers"""
        
        # Decision styles
        style_scores = {
            'rational': 0,
            'intuitive': 0,
            'dependent': 0,
            'avoidant': 0,
            'spontaneous': 0
        }
        
        style_counts = {key: 0 for key in style_scores.keys()}
        
        # Process answers
        for question_id, answer in answers.items():
            question = next((q for q in questions if str(q.get('id')) == str(question_id)), None)
            if not question:
                continue
                
            style_type = question.get('style_type', '').lower()
            if style_type in style_scores:
                score = float(answer) if isinstance(answer, (int, float)) else 3
                style_scores[style_type] += score
                style_counts[style_type] += 1
        
        # Calculate styles
        all_styles = []
        for style_type, total_score in style_scores.items():
            count = style_counts[style_type]
            if count > 0:
                average_score = total_score / count
                percentage = round((average_score / 5) * 100, 1)
            else:
                average_score = 0
                percentage = 0
            
            all_styles.append({
                'type': style_type,
                'score': round(average_score, 2),
                'percentage': percentage,
                'description': TestCalculators._get_decision_description(style_type)
            })
        
        # Sort by percentage
        all_styles.sort(key=lambda x: x['percentage'], reverse=True)
        
        primary_style = all_styles[0] if all_styles else {'type': 'rational', 'percentage': 0}
        
        return {
            'type': 'Decision Making Style',
            'primaryStyle': primary_style,
            'allStyles': all_styles,
            'profile': f'તમારી પ્રાથમિક નિર્ણય શૈલી {primary_style["type"]} છે.'
        }
    
    # Helper methods for descriptions and recommendations
    @staticmethod
    def _get_mbti_traits(code: str) -> List[str]:
        """Get MBTI traits based on code"""
        traits_map = {
            'INTJ': ['વિશ્લેષણાત્મક', 'સ્વતંત્ર', 'નિર્ધારિત', 'વ્યૂહરચનાકાર'],
            'INTP': ['તર્કસંગત', 'જિજ્ઞાસુ', 'સ્વતંત્ર', 'વિચારશીલ'],
            'ENTJ': ['નેતૃત્વ', 'નિર્ધારિત', 'વ્યૂહરચનાકાર', 'કાર્યક્ષમ'],
            'ENTP': ['નવાચારી', 'ઉત્સાહી', 'બહુમુખી', 'પ્રેરણાદાયક']
        }
        return traits_map.get(code, ['વિશ્લેષણાત્મક', 'સ્વતંત્ર', 'નિર્ધારિત', 'વિચારશીલ'])
    
    @staticmethod
    def _get_mbti_strengths(code: str) -> List[str]:
        """Get MBTI strengths based on code"""
        return ['વિશ્લેષણાત્મક વિચારસરણી', 'સમસ્યા નિવારણ', 'વ્યૂહરચના', 'સ્વતંત્ર કાર્ય']
    
    @staticmethod
    def _get_mbti_careers(code: str) -> List[str]:
        """Get MBTI career recommendations based on code"""
        return ['વિજ્ઞાન અને સંશોધન', 'ટેકનોલોજી', 'એન્જિનિયરિંગ', 'વ્યવસાયિક સલાહકાર']
    
    @staticmethod
    def _get_mbti_recommendations(code: str) -> List[str]:
        """Get MBTI development recommendations based on code"""
        return ['વધુ સામાજિક બનો', 'ટીમવર્ક પર ધ્યાન આપો', 'લાગણીઓને સમજો']
    
    @staticmethod
    def _get_intelligence_description(intel_type: str) -> str:
        """Get intelligence type description"""
        descriptions = {
            'linguistic': 'ભાષા અને શબ્દોની કુશળતા',
            'logical-mathematical': 'તર્ક અને ગણિતની કુશળતા',
            'spatial': 'અવકાશી અને દ્રશ્ય કુશળતા',
            'musical': 'સંગીત અને લયની કુશળતા',
            'bodily-kinesthetic': 'શારીરિક અને ગતિની કુશળતા',
            'interpersonal': 'સામાજિક અને સંવાદની કુશળતા',
            'intrapersonal': 'આત્મજ્ઞાન અને આત્મચિંતનની કુશળતા',
            'naturalistic': 'પ્રકૃતિ અને પર્યાવરણની કુશળતા'
        }
        return descriptions.get(intel_type, 'બૌદ્ધિક કુશળતા')
    
    @staticmethod
    def _get_bigfive_description(trait: str, level: str) -> str:
        """Get Big Five trait description"""
        descriptions = {
            'openness': f'{level} નવીનતા અને અનુભવ માટે ખુલ્લાપણું',
            'conscientiousness': f'{level} જવાબદારી અને વ્યવસ્થા',
            'extraversion': f'{level} સામાજિકતા અને બહિર્મુખતા',
            'agreeableness': f'{level} સહયોગ અને દયા',
            'neuroticism': f'{level} ભાવનાત્મક સ્થિરતા'
        }
        return descriptions.get(trait, f'{level} વ્યક્તિત્વ લક્ષણ')
    
    @staticmethod
    def _get_riasec_description(interest_type: str) -> str:
        """Get RIASEC interest description"""
        descriptions = {
            'realistic': 'વ્યવહારિક અને હાથથી કામ કરવાની રુચિ',
            'investigative': 'સંશોધન અને વિશ્લેષણની રુચિ',
            'artistic': 'કલા અને સર્જનાત્મકતાની રુચિ',
            'social': 'લોકો સાથે કામ કરવાની રુચિ',
            'enterprising': 'નેતૃત્વ અને વ્યવસાયની રુચિ',
            'conventional': 'વ્યવસ્થા અને ડેટાની રુચિ'
        }
        return descriptions.get(interest_type, 'કારકિર્દી રુચિ')
    
    @staticmethod
    def _get_riasec_careers(holland_code: str) -> List[str]:
        """Get career recommendations based on Holland code"""
        return ['એન્જિનિયર', 'સંશોધક', 'કલાકાર', 'શિક્ષક', 'વ્યવસાયી', 'એકાઉન્ટન્ટ']
    
    @staticmethod
    def _get_vark_description(style_type: str) -> str:
        """Get VARK style description"""
        descriptions = {
            'visual': 'દ્રશ્ય અને ચિત્રો દ્વારા શીખવાની પસંદગી',
            'auditory': 'સાંભળીને અને ચર્ચા દ્વારા શીખવાની પસંદગી',
            'reading': 'વાંચન અને લેખન દ્વારા શીખવાની પસંદગી',
            'kinesthetic': 'અનુભવ અને પ્રેક્ટિસ દ્વારા શીખવાની પસંદગી'
        }
        return descriptions.get(style_type, 'શીખવાની શૈલી')
    
    @staticmethod
    def _get_vark_recommendations(style_type: str) -> List[str]:
        """Get VARK learning recommendations"""
        return ['વિઝ્યુઅલ એઇડ્સ વાપરો', 'ચર્ચા કરો', 'નોંધો લો', 'પ્રેક્ટિસ કરો']
    
    @staticmethod
    def _get_svs_description(value_type: str) -> str:
        """Get Schwartz value description"""
        descriptions = {
            'achievement': 'સિદ્ધિ અને સફળતાનું મહત્વ',
            'power': 'શક્તિ અને પ્રભાવનું મહત્વ',
            'security': 'સુરક્ષા અને સ્થિરતાનું મહત્વ',
            'benevolence': 'પરોપકાર અને દયાનું મહત્વ',
            'universalism': 'સાર્વત્રિકતા અને ન્યાયનું મહત્વ',
            'self-direction': 'સ્વતંત્રતા અને સ્વાયત્તતાનું મહત્વ',
            'stimulation': 'ઉત્તેજના અને સાહસનું મહત્વ',
            'hedonism': 'આનંદ અને સુખનું મહત્વ',
            'tradition': 'પરંપરા અને સંસ્કૃતિનું મહત્વ',
            'conformity': 'અનુરૂપતા અને નિયમોનું મહત્વ'
        }
        return descriptions.get(value_type, 'વ્યક્તિગત મૂલ્ય')
    
    @staticmethod
    def _get_decision_description(style_type: str) -> str:
        """Get decision making style description"""
        descriptions = {
            'rational': 'તર્કસંગત અને વિશ્લેષણાત્મક નિર્ણય',
            'intuitive': 'અંતર્જ્ઞાન અને લાગણી આધારિત નિર્ણય',
            'dependent': 'અન્યોની સલાહ પર આધારિત નિર્ણય',
            'avoidant': 'નિર્ણય ટાળવાની વૃત્તિ',
            'spontaneous': 'તાત્કાલિક અને સ્વયંસ્ફૂર્ત નિર્ણય'
        }
        return descriptions.get(style_type, 'નિર્ણય શૈલી')
