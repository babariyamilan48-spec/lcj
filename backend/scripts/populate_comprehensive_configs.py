#!/usr/bin/env python3
"""
Script to populate comprehensive test result configurations
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import sessionmaker
from core.database import engine
from question_service.app.models.test_result import TestResultConfiguration

def main():
    """Populate comprehensive test result configurations"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Clear existing configurations
        db.query(TestResultConfiguration).delete()
        db.commit()
        
        # MBTI - All 16 types
        mbti_types = [
            ('ISTJ', 'લોજિસ્ટિશિયન', 'The Logistician'),
            ('ISFJ', 'રક્ષક', 'The Protector'), 
            ('INFJ', 'વકીલ', 'The Advocate'),
            ('INTJ', 'આર્કિટેક્ટ', 'The Architect'),
            ('ISTP', 'વર્ચુઓસો', 'The Virtuoso'),
            ('ISFP', 'સાહસિક', 'The Adventurer'),
            ('INFP', 'મધ્યસ્થ', 'The Mediator'),
            ('INTP', 'વિચારક', 'The Thinker'),
            ('ESTP', 'ઉદ્યમી', 'The Entrepreneur'),
            ('ESFP', 'મનોરંજક', 'The Entertainer'),
            ('ENFP', 'પ્રચારક', 'The Campaigner'),
            ('ENTP', 'વિવાદાસ્પદ', 'The Debater'),
            ('ESTJ', 'કાર્યકારી', 'The Executive'),
            ('ESFJ', 'કોન્સલ', 'The Consul'),
            ('ENFJ', 'નાયક', 'The Protagonist'),
            ('ENTJ', 'કમાન્ડર', 'The Commander')
        ]
        
        count = 0
        for code, gujarati, english in mbti_types:
            config = TestResultConfiguration(
                test_id='mbti',
                result_type='personality_type',
                result_code=code,
                result_name_gujarati=gujarati,
                result_name_english=english,
                description_gujarati=f'{gujarati} વ્યક્તિત્વ પ્રકાર - {code}',
                description_english=f'{english} personality type - {code}',
                min_score=0.0,
                max_score=100.0,
                scoring_method='percentage',
                is_active=True
            )
            db.add(config)
            count += 1
        
        # Intelligence - All 8 types
        intelligence_types = [
            ('linguistic', 'ભાષાકીય બુદ્ધિ', 'Linguistic Intelligence'),
            ('logical', 'તાર્કિક-ગાણિતિક બુદ્ધિ', 'Logical-Mathematical Intelligence'),
            ('spatial', 'અવકાશીય બુદ્ધિ', 'Spatial Intelligence'),
            ('musical', 'સંગીત બુદ્ધિ', 'Musical Intelligence'),
            ('bodily', 'શારીરિક-ગતિશીલ બુદ્ધિ', 'Bodily-Kinesthetic Intelligence'),
            ('interpersonal', 'આંતરવ્યક્તિગત બુદ્ધિ', 'Interpersonal Intelligence'),
            ('intrapersonal', 'આંતરિક બુદ્ધિ', 'Intrapersonal Intelligence'),
            ('naturalistic', 'કુદરતી બુદ્ધિ', 'Naturalistic Intelligence')
        ]
        
        for code, gujarati, english in intelligence_types:
            config = TestResultConfiguration(
                test_id='intelligence',
                result_type='intelligence_type',
                result_code=code,
                result_name_gujarati=gujarati,
                result_name_english=english,
                description_gujarati=f'{gujarati} - બહુવિધ બુદ્ધિ પ્રકાર',
                description_english=f'{english} - Multiple Intelligence type',
                min_score=0.0,
                max_score=100.0,
                scoring_method='percentage',
                is_active=True
            )
            db.add(config)
            count += 1
        
        # Big Five - High/Low for each trait
        bigfive_traits = [
            ('openness_high', 'ઉચ્ચ ખુલ્લુંપન', 'High Openness'),
            ('openness_low', 'નીચું ખુલ્લુંપન', 'Low Openness'),
            ('conscientiousness_high', 'ઉચ્ચ કર્તવ્યનિષ્ઠા', 'High Conscientiousness'),
            ('conscientiousness_low', 'નીચી કર્તવ્યનિષ્ઠા', 'Low Conscientiousness'),
            ('extraversion_high', 'ઉચ્ચ બહિર્મુખતા', 'High Extraversion'),
            ('extraversion_low', 'નીચી બહિર્મુખતા', 'Low Extraversion'),
            ('agreeableness_high', 'ઉચ્ચ સહમતિ', 'High Agreeableness'),
            ('agreeableness_low', 'નીચી સહમતિ', 'Low Agreeableness'),
            ('neuroticism_high', 'ઉચ્ચ ન્યુરોટિસિઝમ', 'High Neuroticism'),
            ('neuroticism_low', 'નીચું ન્યુરોટિસિઝમ', 'Low Neuroticism')
        ]
        
        for code, gujarati, english in bigfive_traits:
            config = TestResultConfiguration(
                test_id='bigfive',
                result_type='personality_trait',
                result_code=code,
                result_name_gujarati=gujarati,
                result_name_english=english,
                description_gujarati=f'{gujarati} - Big Five વ્યક્તિત્વ લક્ષણ',
                description_english=f'{english} - Big Five personality trait',
                min_score=0.0,
                max_score=100.0,
                scoring_method='percentage',
                is_active=True
            )
            db.add(config)
            count += 1
        
        # RIASEC - All 6 career types
        riasec_types = [
            ('realistic', 'વાસ્તવિક', 'Realistic'),
            ('investigative', 'તપાસનીશ', 'Investigative'),
            ('artistic', 'કલાત્મક', 'Artistic'),
            ('social', 'સામાજિક', 'Social'),
            ('enterprising', 'ઉદ્યમશીલ', 'Enterprising'),
            ('conventional', 'પરંપરાગત', 'Conventional')
        ]
        
        for code, gujarati, english in riasec_types:
            config = TestResultConfiguration(
                test_id='riasec',
                result_type='career_interest',
                result_code=code,
                result_name_gujarati=gujarati,
                result_name_english=english,
                description_gujarati=f'{gujarati} - કારકિર્દી રુચિ પ્રકાર',
                description_english=f'{english} - Career interest type',
                min_score=0.0,
                max_score=100.0,
                scoring_method='percentage',
                is_active=True
            )
            db.add(config)
            count += 1
        
        # SVS - All 10 core values
        svs_values = [
            ('achievement', 'સિદ્ધિ', 'Achievement'),
            ('benevolence', 'પરોપકાર', 'Benevolence'),
            ('conformity', 'અનુકૂલતા', 'Conformity'),
            ('hedonism', 'સુખભોગ', 'Hedonism'),
            ('power', 'શક્તિ', 'Power'),
            ('security', 'સુરક્ષા', 'Security'),
            ('self_direction', 'સ્વ-દિશા', 'Self-Direction'),
            ('stimulation', 'ઉત્તેજના', 'Stimulation'),
            ('tradition', 'પરંપરા', 'Tradition'),
            ('universalism', 'વિશ્વવાદ', 'Universalism')
        ]
        
        for code, gujarati, english in svs_values:
            config = TestResultConfiguration(
                test_id='svs',
                result_type='personal_value',
                result_code=code,
                result_name_gujarati=gujarati,
                result_name_english=english,
                description_gujarati=f'{gujarati} - વ્યક્તિગત મૂલ્ય',
                description_english=f'{english} - Personal value',
                min_score=0.0,
                max_score=100.0,
                scoring_method='percentage',
                is_active=True
            )
            db.add(config)
            count += 1
        
        # Decision Making - All 5 styles
        decision_styles = [
            ('rational', 'તાર્કિક', 'Rational'),
            ('intuitive', 'સ્વાભાવિક', 'Intuitive'),
            ('dependent', 'આશ્રિત', 'Dependent'),
            ('avoidant', 'ટાળનારી', 'Avoidant'),
            ('spontaneous', 'સ્વયંભૂ', 'Spontaneous')
        ]
        
        for code, gujarati, english in decision_styles:
            config = TestResultConfiguration(
                test_id='decision',
                result_type='decision_style',
                result_code=code,
                result_name_gujarati=gujarati,
                result_name_english=english,
                description_gujarati=f'{gujarati} - નિર્ણય લેવાની શૈલી',
                description_english=f'{english} - Decision making style',
                min_score=0.0,
                max_score=100.0,
                scoring_method='percentage',
                is_active=True
            )
            db.add(config)
            count += 1
        
        # VARK - All 4 learning styles
        vark_styles = [
            ('visual', 'દૃષ્ટિ આધારિત', 'Visual'),
            ('auditory', 'શ્રાવ્ય આધારિત', 'Auditory'),
            ('reading', 'વાંચન આધારિત', 'Reading/Writing'),
            ('kinesthetic', 'સ્પર્શ આધારિત', 'Kinesthetic')
        ]
        
        for code, gujarati, english in vark_styles:
            config = TestResultConfiguration(
                test_id='vark',
                result_type='learning_style',
                result_code=code,
                result_name_gujarati=gujarati,
                result_name_english=english,
                description_gujarati=f'{gujarati} - શીખવાની શૈલી',
                description_english=f'{english} - Learning style',
                min_score=0.0,
                max_score=100.0,
                scoring_method='percentage',
                is_active=True
            )
            db.add(config)
            count += 1
        
        db.commit()
        print(f"Successfully populated {count} comprehensive test result configurations")
        
        # Print summary
        print("\nConfiguration Summary:")
        print(f"- MBTI: 16 personality types")
        print(f"- Intelligence: 8 intelligence types") 
        print(f"- Big Five: 10 trait variations")
        print(f"- RIASEC: 6 career interest types")
        print(f"- SVS: 10 core values")
        print(f"- Decision Making: 5 decision styles")
        print(f"- VARK: 4 learning styles")
        print(f"Total: {count} configurations")
        
    except Exception as e:
        print(f"Error populating configurations: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
