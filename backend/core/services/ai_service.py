import os
import json
import re
import google.generativeai as genai
from typing import Dict, List, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AIInsightService:
    def __init__(self):
        # Configure Gemini API
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash-lite')

    def generate_insights(self, test_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate AI insights based on test results
        Includes retry mechanism (2 attempts) and strict validation - NO FALLBACK DATA
        """
        # Create a comprehensive prompt based on test type and results
        prompt = self._create_personality_prompt(test_data)

        # Retry mechanism - 2 attempts
        max_retries = 2
        last_error = None

        for attempt in range(max_retries):
            try:
                logger.info(f"AI generation attempt {attempt + 1}/{max_retries} for test: {test_data.get('test_type', 'unknown')}")

                # Generate insights using Gemini
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.1,  # Lower temperature for consistency
                        top_p=0.8,
                        top_k=20,
                        max_output_tokens=4000
                    )
                )

                # Check if response has content
                if not response.text or len(response.text.strip()) < 10:
                    last_error = "AI returned empty or very short response"
                    logger.warning(f"Attempt {attempt + 1}: {last_error}")
                    continue

                # Parse the response
                insights = self._parse_ai_response(response.text)
                logger.info(f"Attempt {attempt + 1} - Parsed insights keys: {list(insights.keys()) if insights else 'None'}")

                # Validate that we have the correct structure
                required_fields = ["best_field", "roadmap", "result_analysis", "career_recommendations",
                                 "skill_recommendations", "skill_gaps", "future_plans", "daily_habits", "certifications"]

                missing_fields = [field for field in required_fields if field not in insights]
                if missing_fields:
                    last_error = f"AI returned incomplete structure. Missing: {missing_fields}"
                    logger.warning(f"Attempt {attempt + 1}: {last_error}")
                    continue

                # Success! Return the valid insights
                logger.info(f"AI generation successful on attempt {attempt + 1} for test: {test_data.get('test_type', 'unknown')}")
                return {
                    "success": True,
                    "insights": insights,
                    "generated_at": datetime.utcnow().isoformat(),
                    "model": "gemini-2.5-flash-lite",
                    "attempt": attempt + 1
                }

            except Exception as e:
                last_error = f"AI generation error: {str(e)}"
                logger.warning(f"Attempt {attempt + 1} failed: {last_error}")
                continue

        # All attempts failed
        logger.error(f"All {max_retries} attempts failed for test: {test_data.get('test_type', 'unknown')}. Last error: {last_error}")
        return {
            "success": False,
            "error": f"AI service failed after {max_retries} attempts. Last error: {last_error}",
            "generated_at": datetime.utcnow().isoformat(),
            "model": "gemini-2.5-flash-lite",
            "attempts_made": max_retries
        }

    def _create_personality_prompt(self, test_data: Dict[str, Any]) -> str:
        """
        Create a comprehensive prompt for personality analysis
        """
        test_type = test_data.get('test_type', 'unknown')
        answers = test_data.get('answers', [])
        results = test_data.get('results', {})

        if test_type == 'mbti':
            return self._create_mbti_prompt(answers, results)
        elif test_type == 'big_five':
            return self._create_big_five_prompt(answers, results)
        else:
            return self._create_general_prompt(answers, results)

    def _create_mbti_prompt(self, answers: List[Any], results: Dict[str, Any]) -> str:
        """
        Create MBTI-specific analysis prompt with comprehensive career insights in Gujarati
        """
        personality_type = results.get('code', 'Unknown')
        dimensions = results.get('dimensions', [])

        prompt = f"""
You are a world-class career counselor, personality psychologist, and life coach with 20+ years of experience. You have deep expertise in:
- MBTI theory, cognitive functions, and personality development
- Career counseling for Indian professionals and students
- Gujarati culture, business environment, and opportunities
- Modern job market trends in India and Gujarat
- Entrepreneurship and startup ecosystem in Gujarat

IMPORTANT: All responses must be in Gujarati language (ગુજરાતી) as this is for Gujarati-speaking users.

PERSONALITY TYPE: {personality_type}

DIMENSION SCORES:
{json.dumps(dimensions, indent=2)}

ASSESSMENT ANSWERS:
{json.dumps(answers[:10], indent=2)}  # First 10 answers for context

ANALYSIS REQUIREMENTS:
1. Provide DEEP, ACTIONABLE insights that go beyond generic advice
2. Include specific Gujarat companies, courses, and opportunities
3. Give concrete examples and real-world applications
4. Consider cultural context and family expectations
5. Address both traditional and modern career paths
6. Include salary expectations and growth potential
7. Provide specific skill development recommendations
8. Consider work-life balance in Indian context

IMPORTANT: You MUST respond with ONLY a valid JSON object containing exactly these fields. All text content must be in Gujarati. Do not include any explanatory text before or after the JSON.

Provide a detailed career-focused psychological analysis in JSON format with EXACTLY this structure. All text must be in Gujarati:

{{
  "best_field": {{
    "field": "તમારા વ્યક્તિત્વ માટે સૌથી યોગ્ય કારકિર્દી ક્ષેત્ર/ઉદ્યોગ",
    "reasoning": "આ ક્ષેત્ર તમારા વ્યક્તિત્વ સાથે કેવી રીતે મેળ ખાય છે તેની વિગતવાર સમજૂતી",
    "match_percentage": 95,
    "gujarat_opportunities": "ગુજરાતમાં આ ક્ષેત્રમાં ઉપલબ્ધ તકો અને કંપનીઓ",
    "indian_market_outlook": "ભારતીય બજારમાં આ ક્ષેત્રની સંભાવના",
    "specific_companies": "ગુજરાતમાં આ ક્ષેત્રમાં કામ કરતી ચોક્કસ કંપનીઓ",
    "salary_expectations": "આ ક્ષેત્રમાં અપેક્ષિત પગાર શ્રેણી",
    "growth_potential": "આ ક્ષેત્રમાં કારકિર્દી વિકાસની સંભાવના",
    "entry_requirements": "આ ક્ષેત્રમાં પ્રવેશ માટે જરૂરી શરતો"
  }},
  "roadmap": {{
    "short_term": {{
      "duration": "1-3 મહિના",
      "goals": ["ચોક્કસ કાર્યક્ષમ લક્ષ્ય 1", "ચોક્કસ કાર્યક્ષમ લક્ષ્ય 2"],
      "skills_to_develop": ["કુશળતા 1", "કુશળતા 2"],
      "resources": ["સંસાધન 1", "સંસાધન 2"],
      "gujarati_courses": "ગુજરાતમાં ઉપલબ્ધ કોર્સ અને શિક્ષણ સંસ્થાઓ",
      "specific_actions": ["ચોક્કસ ક્રિયાઓ જે તમારે કરવી પડશે"],
      "timeline": "દરેક લક્ષ્ય માટે ચોક્કસ સમયસીમા",
      "success_metrics": "સફળતા માપવાના માપદંડ"
    }},
    "mid_term": {{
      "duration": "6-12 મહિના",
      "goals": ["મધ્યમ-અવધિ લક્ષ્ય 1", "મધ્યમ-અવધિ લક્ષ્ય 2"],
      "skills_to_develop": ["અદ્યતન કુશળતા 1", "અદ્યતન કુશળતા 2"],
      "milestones": ["મહત્વપૂર્ણ પડાવ 1", "મહત્વપૂર્ણ પડાવ 2"],
      "internship_opportunities": "ગુજરાત અને ભારતમાં ઇન્ટર્નશિપ તકો",
      "networking_events": "ગુજરાતમાં વ્યવસાયિક નેટવર્કિંગ ઇવેન્ટ્સ",
      "project_ideas": "તમારી કુશળતા વિકસાવવા માટે પ્રોજેક્ટ વિચારો",
      "mentorship_opportunities": "માર્ગદર્શન મેળવવાની તકો"
    }},
    "long_term": {{
      "duration": "1-2 વર્ષ",
      "goals": ["લાંબા ગાળાના કારકિર્દી લક્ષ્ય 1", "લાંબા ગાળાના કારકિર્દી લક્ષ્ય 2"],
      "expertise_areas": ["નિપુણતા ક્ષેત્ર 1", "નિપુણતા ક્ષેત્ર 2"],
      "leadership_development": ["નેતૃત્વ કુશળતા 1", "નેતૃત્વ કુશળતા 2"],
      "entrepreneurship_opportunities": "ગુજરાતમાં ઉદ્યોગસાહસિકતા તકો",
      "career_transition_plan": "કારકિર્દી બદલવાની યોજના",
      "financial_planning": "કારકિર્દી વિકાસ માટે નાણાકીય યોજના",
      "work_life_balance": "કામ-જીવન સંતુલન કેવી રીતે જાળવવું"
    }}
  }},
  "result_analysis": {{
    "strengths": [
      {{
        "strength": "મુખ્ય શક્તિ",
        "reasoning": "વ્યક્તિત્વના આધારે આ શક્તિ કેમ છે",
        "career_application": "કારકિર્દીમાં આ શક્તિનો કેવી રીતે ઉપયોગ કરવો"
      }}
    ],
    "weaknesses": [
      {{
        "weakness": "સુધારાનું ક્ષેત્ર",
        "reasoning": "આ પડકારરૂપ કેમ હોઈ શકે છે",
        "improvement_strategy": "આ નબળાઈને કેવી રીતે સુધારવી"
      }}
    ]
  }},
  "career_recommendations": [
    {{
      "job_role": "ચોક્કસ નોકરીનું પદ",
      "industry": "ઉદ્યોગ ક્ષેત્ર",
      "explanation": "આ ભૂમિકા તેમના વ્યક્તિત્વ સાથે કેવી રીતે મેળ ખાય છે",
      "growth_potential": "ઉચ્ચ/મધ્યમ/નીચું",
      "salary_range": "અપેક્ષિત પગાર શ્રેણી",
      "gujarat_companies": "ગુજરાતમાં આ ભૂમિકા ઓફર કરતી કંપનીઓ",
      "remote_opportunities": "દૂરથી કામ કરવાની તકો",
      "required_skills": "આ ભૂમિકા માટે જરૂરી કુશળતાઓ",
      "day_to_day_tasks": "દરરોજના કામનું વર્ણન",
      "career_progression": "કારકિર્દી આગળ વધવાની રીત",
      "challenges": "આ ભૂમિકામાં આવતી પડકારો",
      "benefits": "આ ભૂમિકાના ફાયદા",
      "work_environment": "કામનું વાતાવરણ અને સંસ્કૃતિ"
    }}
  ],
  "skill_recommendations": {{
    "technical_skills": [
      {{
        "skill": "તકનીકી કુશળતા",
        "importance": "ઉચ્ચ/મધ્યમ/નીચું",
        "learning_resources": ["સંસાધન 1", "સંસાધન 2"],
        "gujarati_tutorials": "ગુજરાતી ટ્યુટોરિયલ અને કોર્સ"
      }}
    ],
    "soft_skills": [
      {{
        "skill": "સોફ્ટ સ્કિલ",
        "importance": "ઉચ્ચ/મધ્યમ/નીચું",
        "development_approach": "આ કુશળતા કેવી રીતે વિકસાવવી",
        "practical_exercises": "વ્યવહારિક અભ્યાસ અને ક્રિયાઓ"
      }}
    ]
  }},
  "skill_gaps": [
    {{
      "gap": "ખૂટતી કુશળતા અથવા જ્ઞાન ક્ષેત્ર",
      "impact": "આ ખાડો કારકિર્દી વિકાસને કેવી રીતે અસર કરે છે",
      "priority": "ઉચ્ચ/મધ્યમ/નીચું",
      "learning_path": "આ ખાડો ભરવા માટે ભલામણ કરેલ અભિગમ",
      "free_resources": "મફત શીખવાના સંસાધનો"
    }}
  ],
  "future_plans": {{
    "3_year_plan": {{
      "career_position": "અપેક્ષિત ભૂમિકા/પદ",
      "key_achievements": ["પ્રાપ્તિ 1", "પ્રાપ્તિ 2"],
      "skills_mastered": ["કુશળતા 1", "કુશળતા 2"],
      "network_goals": "વ્યવસાયિક નેટવર્કિંગ લક્ષ્યો",
      "gujarat_opportunities": "ગુજરાતમાં 3 વર્ષમાં ઉપલબ્ધ તકો"
    }},
    "5_year_plan": {{
      "career_position": "વરિષ્ઠ ભૂમિકા/નેતૃત્વ પદ",
      "expertise_areas": ["નિપુણતા ક્ષેત્ર 1", "નિપુણતા ક્ષેત્ર 2"],
      "leadership_role": "અપેક્ષિત નેતૃત્વનો પ્રકાર",
      "industry_impact": "ઉદ્યોગમાં અપેક્ષિત યોગદાન",
      "entrepreneurship_goals": "ઉદ્યોગસાહસિકતા લક્ષ્યો"
    }},
    "10_year_plan": {{
      "career_vision": "લાંબા ગાળાની કારકિર્દી દ્રષ્ટિ",
      "legacy_goals": ["વારસો લક્ષ્ય 1", "વારસો લક્ષ્ય 2"],
      "mentorship_role": "તેઓ અન્ય લોકોને કેવી રીતે માર્ગદર્શન આપશે",
      "entrepreneurial_potential": "પોતાનો વ્યવસાય શરૂ કરવાની સંભાવના",
      "gujarat_contribution": "ગુજરાતના વિકાસમાં યોગદાન"
    }}
  }},
  "daily_habits": [
    {{
      "habit": "દૈનિક આદતનું નામ",
      "purpose": "આ આદત કેમ મહત્વપૂર્ણ છે",
      "implementation": "આ આદત કેવી રીતે અમલમાં મૂકવી",
      "time_required": "દરરોજ જરૂરી સમય",
      "gujarati_resources": "ગુજરાતી સંસાધનો અને સહાય"
    }}
  ],
  "certifications": [
    {{
      "name": "પ્રમાણપત્રનું નામ",
      "provider": "પ્રમાણપત્ર પ્રદાતા (Google, AWS, Microsoft, Coursera, વગેરે)",
      "direct_enrollment_link": "https://actual-enrollment-link.com",
      "why_recommended": "આ પ્રમાણપત્ર તેમની કારકિર્દી માટે કેમ મૂલ્યવાન છે",
      "difficulty_level": "શરૂઆત/મધ્યમ/અદ્યતન",
      "estimated_duration": "પૂર્ણ કરવામાં લાગતો સમય",
      "gujarat_centers": "ગુજરાતમાં પ્રમાણપત્ર કેન્દ્રો",
      "online_options": "ઓનલાઇન વિકલ્પો"
    }}
  ],
  "additional_insights": {{
    "work_environment": "તમારા વ્યક્તિત્વ માટે યોગ્ય કામનું વાતાવરણ",
    "team_dynamics": "ટીમમાં કેવી રીતે કામ કરવું",
    "stress_management": "તણાવ સંચાલનની તકનીકો",
    "work_life_balance": "કામ-જીવન સંતુલન કેવી રીતે જાળવવું",
    "gujarat_specific_advice": "ગુજરાતી સંસ્કૃતિ અને વ્યવસાયિક વાતાવરણ માટે ખાસ સલાહ",
    "networking_tips": "ગુજરાતમાં વ્યવસાયિક નેટવર્કિંગ ટિપ્સ",
    "mentorship_opportunities": "ગુજરાતમાં માર્ગદર્શન તકો"
  }}
}}

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON - no additional text, explanations, or formatting
2. Include ALL required fields: best_field, roadmap, result_analysis, career_recommendations, skill_recommendations, skill_gaps, future_plans, daily_habits, certifications, additional_insights
3. ALL text content must be in Gujarati language (ગુજરાતી)
4. Use realistic data based on {personality_type} personality type
5. Provide actual working certification links
6. Make all recommendations specific and actionable for Indian/Gujarati context
7. Include Gujarat-specific opportunities, companies, and resources
8. Ensure JSON is properly formatted and parseable
9. Focus on practical, implementable advice for Gujarati-speaking users
"""
        return prompt

    def _create_big_five_prompt(self, answers: List[Any], results: Dict[str, Any]) -> str:
        """
        Create Big Five-specific analysis prompt with comprehensive career insights in Gujarati
        """
        scores = results.get('scores', {})

        prompt = f"""
You are an expert career counselor and personality psychologist specializing in the Big Five model and career development.
You specialize in providing career guidance for Indian students and professionals, with particular focus on the Gujarati-speaking community.

IMPORTANT: All responses must be in Gujarati language (ગુજરાતી) as this is for Gujarati-speaking users.

Analyze this personality assessment data and provide comprehensive career-focused insights.

BIG FIVE SCORES:
{json.dumps(scores, indent=2)}

ASSESSMENT RESPONSES:
{json.dumps(answers[:10], indent=2)}

IMPORTANT: You MUST respond with ONLY a valid JSON object containing exactly these 9 fields. Do not include any explanatory text before or after the JSON.

Provide analysis using the exact same JSON structure with all 9 required fields:
best_field, roadmap, result_analysis, career_recommendations, skill_recommendations, skill_gaps, future_plans, daily_habits, certifications

Tailor insights to Big Five personality dimensions but use the identical JSON format structure.
"""
        return prompt

    def _create_general_prompt(self, answers: List[Any], results: Dict[str, Any]) -> str:
        """
        Create general personality analysis prompt with comprehensive career insights
        """
        prompt = f"""
You are an expert career counselor and personality psychology expert. Analyze this assessment data:

RESULTS:
{json.dumps(results, indent=2)}

RESPONSES:
{json.dumps(answers[:10], indent=2)}

IMPORTANT: You MUST respond with ONLY a valid JSON object containing exactly these 9 fields. Do not include any explanatory text before or after the JSON.

Provide comprehensive career-focused personality insights using the exact same detailed JSON format structure with all 9 key areas:
best_field, roadmap, result_analysis, career_recommendations, skill_recommendations, skill_gaps, future_plans, daily_habits, certifications

Return ONLY valid JSON with no additional text.
"""
        return prompt

    def _parse_ai_response(self, response_text: str) -> Dict[str, Any]:
        """
        Simple and robust JSON parser focused on getting clean JSON
        """
        try:
            logger.info(f"Raw AI response length: {len(response_text)} characters")

            # Step 1: Extract JSON content between first { and last }
            original_text = response_text.strip()
            
            # Remove BOM if present
            if original_text.startswith('\ufeff'):
                original_text = original_text[1:]

            start_idx = original_text.find('{')
            end_idx = original_text.rfind('}') + 1

            if start_idx == -1 or end_idx == 0:
                logger.error("No JSON structure found in response")
                return {}

            json_str = original_text[start_idx:end_idx]
            logger.info(f"Extracted JSON content from position {start_idx} to {end_idx}")

            # Step 2: Simple cleaning - remove markdown and fix basic issues
            # Remove markdown blocks
            json_str = re.sub(r'^```(?:json)?', '', json_str, flags=re.IGNORECASE)
            json_str = re.sub(r'```$', '', json_str)
            json_str = json_str.strip('`').strip()

            # Step 3: Try direct parsing
            logger.info(f"Attempting to parse JSON (len={len(json_str)})")
            logger.info(f"First 100 chars: {repr(json_str[:100])}")

            try:
                parsed = json.loads(json_str)
                logger.info(f"✅ Successfully parsed JSON with {len(parsed)} keys: {list(parsed.keys())}")
                return parsed
            except json.JSONDecodeError as e:
                logger.error(f"❌ JSON parsing failed: {e}")
                logger.error(f"Error at position {e.pos}: {e.msg}")
                logger.error(f"Error context: {repr(json_str[max(0, e.pos-50):e.pos+50])}")

                # Step 4: Aggressive repair attempts
                repaired = json_str

                # Fix newlines and control characters in strings
                repaired = re.sub(r'(?<!\\)\n', '\\n', repaired)  # Escape newlines properly
                repaired = re.sub(r'(?<!\\)\r', '\\r', repaired)  # Escape carriage returns
                repaired = re.sub(r'(?<!\\)\t', '\\t', repaired)  # Escape tabs
                
                # Fix trailing commas
                repaired = re.sub(r',(\s*[}\]])', r'\1', repaired)
                
                # Fix missing commas between objects/arrays
                repaired = re.sub(r'}\s*{', '}, {', repaired)
                repaired = re.sub(r']\s*\[', '], [', repaired)

                logger.info("Attempting repair with escaped control characters")
                try:
                    parsed = json.loads(repaired)
                    logger.info("✅ Fixed with control character escaping")
                    return parsed
                except json.JSONDecodeError as e2:
                    logger.error(f"❌ Repair failed: {e2}")
                    
                    # Last attempt: try to fix specific error location
                    if e2.pos < len(repaired):
                        logger.error(f"Repair error at position {e2.pos}: {repr(repaired[max(0, e2.pos-30):e2.pos+30])}")
                    
                    logger.error(f"First 1000 chars of failed JSON: {repr(repaired[:1000])}")
                    return {}

        except Exception as e:
            logger.exception(f"Unexpected error in JSON parsing: {e}")
            return {}

    def _structure_text_response(self, text: str) -> Dict[str, Any]:
        """
        Convert unstructured text to structured comprehensive career insights
        """
        return {
            "best_field": {
                "field": "Technology/Creative Industries",
                "reasoning": "Based on your responses, you show strong analytical and creative thinking patterns",
                "match_percentage": 85
            },
            "roadmap": {
                "short_term": {
                    "duration": "1-3 months",
                    "goals": ["Complete personality-based skill assessment", "Research target career paths"],
                    "skills_to_develop": ["Self-awareness", "Goal setting"],
                    "resources": ["Career assessment tools", "Industry research"]
                },
                "mid_term": {
                    "duration": "6-12 months",
                    "goals": ["Develop core professional skills", "Build relevant portfolio"],
                    "skills_to_develop": ["Technical competencies", "Communication skills"],
                    "milestones": ["Complete relevant certification", "Network with industry professionals"]
                },
                "long_term": {
                    "duration": "1-2 years",
                    "goals": ["Secure role in target field", "Establish professional reputation"],
                    "expertise_areas": ["Specialized domain knowledge", "Leadership capabilities"],
                    "leadership_development": ["Team collaboration", "Project management"]
                }
            },
            "result_analysis": {
                "strengths": [
                    {
                        "strength": "Self-reflection ability",
                        "reasoning": "Shows strong introspective capabilities",
                        "career_application": "Valuable for continuous improvement and adaptation"
                    }
                ],
                "weaknesses": [
                    {
                        "weakness": "May overthink decisions",
                        "reasoning": "Tendency toward extensive analysis",
                        "improvement_strategy": "Practice time-boxed decision making"
                    }
                ]
            },
            "career_recommendations": [
                {
                    "job_role": "Business Analyst",
                    "industry": "Technology/Consulting",
                    "explanation": "Matches analytical thinking and problem-solving strengths",
                    "growth_potential": "High",
                    "salary_range": "$60,000 - $90,000"
                }
            ],
            "skill_recommendations": {
                "technical_skills": [
                    {
                        "skill": "Data Analysis",
                        "importance": "High",
                        "learning_resources": ["Coursera Data Science", "Kaggle Learn"]
                    }
                ],
                "soft_skills": [
                    {
                        "skill": "Communication",
                        "importance": "High",
                        "development_approach": "Practice presentations and written communication"
                    }
                ]
            },
            "skill_gaps": [
                {
                    "gap": "Industry-specific technical knowledge",
                    "impact": "May limit initial job opportunities",
                    "priority": "High",
                    "learning_path": "Complete relevant online courses and certifications"
                }
            ],
            "future_plans": {
                "3_year_plan": {
                    "career_position": "Senior Analyst or Team Lead",
                    "key_achievements": ["Lead major project", "Mentor junior colleagues"],
                    "skills_mastered": ["Advanced analytics", "Team leadership"],
                    "network_goals": "Build strong professional network in target industry"
                },
                "5_year_plan": {
                    "career_position": "Manager or Director level",
                    "expertise_areas": ["Strategic planning", "Business development"],
                    "leadership_role": "Department or team leadership",
                    "industry_impact": "Recognized expert in specialized area"
                },
                "10_year_plan": {
                    "career_vision": "Senior executive or independent consultant",
                    "legacy_goals": ["Develop innovative solutions", "Influence industry standards"],
                    "mentorship_role": "Guide next generation of professionals",
                    "entrepreneurial_potential": "Consider starting specialized consulting firm"
                }
            },
            "daily_habits": [
                {
                    "habit": "Morning reflection and goal review",
                    "purpose": "Maintain focus and track progress",
                    "implementation": "Spend 10 minutes each morning reviewing goals",
                    "time_required": "10 minutes"
                },
                {
                    "habit": "Continuous learning",
                    "purpose": "Stay current with industry trends",
                    "implementation": "Read industry articles or complete online modules",
                    "time_required": "30 minutes"
                }
            ],
            "certifications": [
                {
                    "name": "Google Data Analytics Certificate",
                    "provider": "Google via Coursera",
                    "direct_enrollment_link": "https://www.coursera.org/professional-certificates/google-data-analytics",
                    "why_recommended": "Builds foundational data analysis skills highly valued in many industries",
                    "difficulty_level": "Beginner",
                    "estimated_duration": "3-6 months"
                },
                {
                    "name": "Project Management Professional (PMP)",
                    "provider": "Project Management Institute",
                    "direct_enrollment_link": "https://www.pmi.org/certifications/project-management-pmp",
                    "why_recommended": "Essential for leadership roles and career advancement",
                    "difficulty_level": "Intermediate",
                    "estimated_duration": "4-6 months"
                }
            ]
        }

    def generate_comprehensive_insights(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate comprehensive AI insights based on all completed tests for a user
        Includes retry mechanism (2 attempts) and strict validation - NO FALLBACK DATA
        """
        user_id = request_data.get('user_id')
        test_results = request_data.get('all_test_results', {})

        logger.info(f"AI Service received data for user {user_id}")
        logger.info(f"Test results keys: {list(test_results.keys()) if test_results else 'None'}")
        logger.info(f"Total test results: {len(test_results) if test_results else 0}")
        
        # Log details of each test result
        for test_id, result in test_results.items():
            logger.info(f"Test {test_id}: {result.get('test_name', 'Unknown')} - Answers: {len(result.get('answers', {})) if result.get('answers') else 0} questions")

        if not test_results:
            logger.error(f"No test results provided for user {user_id}")
            return {
                "success": False,
                "error": "No test results provided. Please complete all tests first.",
                "generated_at": datetime.utcnow().isoformat(),
                "model": "gemini-2.5-flash-lite"
            }

        # Create comprehensive prompt based on all test results
        prompt = self._create_comprehensive_prompt(test_results, user_id)

        # Retry mechanism - 2 attempts
        max_retries = 2
        last_error = None

        for attempt in range(max_retries):
            try:
                logger.info(f"AI generation attempt {attempt + 1}/{max_retries} for user {user_id}")

                # Generate insights using Gemini
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.1,  # Lower temperature for more consistent JSON
                        top_p=0.8,
                        top_k=20,
                        max_output_tokens=32000  # Absolute maximum for comprehensive response
                    )
                )

                # Check if response has content
                if not response.text or len(response.text.strip()) < 10:
                    last_error = "AI returned empty or very short response"
                    logger.warning(f"Attempt {attempt + 1}: {last_error}")
                    continue

                # Check if response appears to be truncated
                if len(response.text) > 20000 and not response.text.strip().endswith(('```', '}')):
                    logger.warning(f"Response appears truncated at {len(response.text)} characters")
                    # Continue anyway and try to parse with auto-repair
                elif len(response.text) < 20000:
                    logger.info(f"Response length: {len(response.text)} characters - should be complete")

                # Log FULL response for debugging
                logger.info(f"Attempt {attempt + 1} - FULL AI Response ({len(response.text)} chars):")
                logger.info(f"FULL RESPONSE START:\n{response.text}\nFULL RESPONSE END")

                # Parse the response
                insights = self._parse_ai_response(response.text)
                logger.info(f"Attempt {attempt + 1} - Parsed insights keys: {list(insights.keys()) if insights else 'None'}")

                # Check for template/placeholder responses (AI copying examples instead of personalizing)
                response_text_lower = response.text.lower()
                template_indicators = [
                    "[career field based on",
                    "[strength 1 based on",
                    "[weakness 1 identified",
                    "[daily habit 1 tailored",
                    "[first career field name]",
                    "[certification name relevant"
                ]

                template_matches = [indicator for indicator in template_indicators if indicator in response_text_lower]
                if template_matches:
                    last_error = f"AI returned template placeholders instead of personalized content. Found: {template_matches}"
                    logger.warning(f"Attempt {attempt + 1}: {last_error}")
                    continue

                # Validate comprehensive insights structure
                required_fields = ["top_career_fields", "career_roadmaps", "strengths", "weaknesses", "daily_habits", "recommended_certifications", "recommended_books", "personality_insights", "networking_suggestions", "skill_development_plan"]

                missing_fields = [field for field in required_fields if field not in insights]
                if missing_fields:
                    last_error = f"AI returned incomplete structure. Missing: {missing_fields}"
                    logger.warning(f"Attempt {attempt + 1}: {last_error}")
                    logger.warning(f"Available fields: {list(insights.keys())}")
                    continue

                # Success! Return the valid insights
                logger.info(f"AI generation successful on attempt {attempt + 1} for user {user_id}")
                return {
                    "success": True,
                    "insights": insights,
                    "generated_at": datetime.utcnow().isoformat(),
                    "model": "gemini-2.5-flash-lite",
                    "attempt": attempt + 1
                }

            except Exception as e:
                last_error = f"AI generation error: {str(e)}"
                logger.warning(f"Attempt {attempt + 1} failed: {last_error}")
                continue

        # All attempts failed
        logger.error(f"All {max_retries} attempts failed for user {user_id}. Last error: {last_error}")
        return {
            "success": False,
            "error": f"AI service failed after {max_retries} attempts. Last error: {last_error}",
            "generated_at": datetime.utcnow().isoformat(),
            "model": "gemini-2.5-flash-lite",
            "attempts_made": max_retries
        }

    def _create_comprehensive_prompt(self, test_results: Dict[str, Any], user_id: str) -> str:
        """
        Create a comprehensive prompt analyzing all test results together
        """
        prompt = f"""🎯 CRITICAL INSTRUCTIONS - READ CAREFULLY:

ABSOLUTE REQUIREMENT: Your response MUST be PURE JSON starting with {{ and ending with }}
NO MARKDOWN: Do NOT use ```json ``` code blocks or any markdown formatting
NO EXPLANATIONS: Do NOT add any text before or after the JSON
SINGLE LINE TEXT: Do NOT use \\n, \\r, \\t or any escape sequences in strings

=== TASK ===
You are an expert career counselor analyzing personality test results for personalized career guidance.

USER ID: {user_id}

TEST RESULTS TO ANALYZE:
{test_results}

=== RESPONSE FORMAT ===
Return ONLY a valid JSON object with these EXACT fields:
- top_career_fields (array of 3 career options)
- career_roadmaps (object with roadmaps for all 3 careers)
- strengths (array of 4 items)
- weaknesses (array of 4 items)
- daily_habits (array of 4 items)
- recommended_certifications (array of 1 certification)
- recommended_books (array of 2 books)
- personality_insights (object with 5 insights)
- networking_suggestions (array of 3 suggestions)
- skill_development_plan (object with immediate/6-month/1-year goals)

=== CONTENT REQUIREMENTS ===
- All descriptive text in Gujarati (ગુજરાતી) - readable characters, NOT Unicode escapes
- Technical terms in English (Data Science, Python, etc.)
- Keep all text concise - maximum 2-3 lines per field
- Include Gujarat-specific opportunities and salary ranges in ₹
- Base recommendations on actual test results provided above

=== JSON STRUCTURE TEMPLATE ===

{{
  "top_career_fields": [
    {{
      "field": "[Career field name]",
      "reasoning": "[Gujarati reasoning]",
      "gujarat_opportunities": "[સ્થાનિક તક]",
      "salary_range": "₹[Range] પ્રતિ વર્ષ",
      "growth_potential": "[વિકાસની સંભાવના]"
    }},
    {{
      "field": "[Career field name]",
      "reasoning": "[Gujarati reasoning]",
      "gujarat_opportunities": "[સ્થાનિક તક]",
      "salary_range": "₹[Range] પ્રતિ વર્ષ",
      "growth_potential": "[વિકાસની સંભાવના]"
    }},
    {{
      "field": "[Career field name]",
      "reasoning": "[Gujarati reasoning]",
      "gujarat_opportunities": "[સ્થાનિક તક]",
      "salary_range": "₹[Range] પ્રતિ વર્ષ",
      "growth_potential": "[વિકાસની સંભાવના]"
    }}
  ],
  "career_roadmaps": {{
    "[Career field name 1]": {{
      "beginner_phase": {{
        "duration": "1–2 વર્ષ",
        "skills_to_learn": ["[Skill]", "[Skill]"],
        "certifications": ["[Cert]"]
      }},
      "intermediate_phase": {{
        "duration": "2–4 વર્ષ",
        "skills_to_learn": ["[Skill]", "[Skill]"],
        "certifications": ["[Cert]"]
      }},
      "expert_phase": {{
        "duration": "5+ વર્ષ",
        "skills_to_learn": ["[Skill]", "[Leadership Skill]"],
        "leadership_roles": ["[Role]"]
      }}
    }},
    "[Career field name 2]": {{
      "beginner_phase": {{
        "duration": "1–2 વર્ષ",
        "skills_to_learn": ["[Skill]", "[Skill]"],
        "certifications": ["[Cert]"]
      }},
      "intermediate_phase": {{
        "duration": "2–4 વર્ષ",
        "skills_to_learn": ["[Skill]", "[Skill]"],
        "certifications": ["[Cert]"]
      }},
      "expert_phase": {{
        "duration": "5+ વર્ષ",
        "skills_to_learn": ["[Skill]", "[Leadership Skill]"],
        "leadership_roles": ["[Role]"]
      }}
    }},
    "[Career field name 3]": {{
      "beginner_phase": {{
        "duration": "1–2 વર્ષ",
        "skills_to_learn": ["[Skill]", "[Skill]"],
        "certifications": ["[Cert]"]
      }},
      "intermediate_phase": {{
        "duration": "2–4 વર્ષ",
        "skills_to_learn": ["[Skill]", "[Skill]"],
        "certifications": ["[Cert]"]
      }},
      "expert_phase": {{
        "duration": "5+ વર્ષ",
        "skills_to_learn": ["[Skill]", "[Leadership Skill]"],
        "leadership_roles": ["[Role]"]
      }}
    }}
  }},
  "strengths": ["[Gujarati Strength]", "[Gujarati Strength]", "[Gujarati Strength]", "[Gujarati Strength]"],
  "weaknesses": ["[Gujarati Weakness]", "[Gujarati Weakness]", "[Gujarati Weakness]", "[Gujarati Weakness]"],
  "daily_habits": ["[Gujarati Habit]", "[Gujarati Habit]", "[Gujarati Habit]", "[Gujarati Habit]"],
  "recommended_certifications": [
    {{
      "priority": "ઉચ્ચ",
      "certification": {{
        "name": "[Certification]",
        "why_recommended": "[Gujarati Reason]",
        "estimated_duration": "[Duration]",
        "direct_enrollment_link": "[Link]"
      }},
      "skills_gained": ["[Skill]", "[Skill]"],
      "career_impact": "[Gujarati Description]"
    }}
  ],
  "recommended_books": [
    {{
      "title": "[પુસ્તકનું નામ]",
      "author": "[લેખકનું નામ]",
      "why_recommended": "[આ પુસ્તક શા માટે ભલામણ કરાયું છે]",
      "key_takeaways": ["[મુખ્ય શીખવા જેવી વાત 1]", "[મુખ્ય શીખવા જેવી વાત 2]"],
      "relevance_to_career": "[કારકિર્દી માટે આ પુસ્તકનું મહત્વ]"
    }},
    {{
      "title": "[પુસ્તકનું નામ]",
      "author": "[લેખકનું નામ]",
      "why_recommended": "[આ પુસ્તક શા માટે ભલામણ કરાયું છે]",
      "key_takeaways": ["[મુખ્ય શીખવા જેવી વાત 1]", "[મુખ્ય શીખવા જેવી વાત 2]"],
      "relevance_to_career": "[કારકિર્દી માટે આ પુસ્તકનું મહત્વ]"
    }}
  ],
  "personality_insights": {{
    "mbti_analysis": "[Gujarati MBTI Summary]",
    "big_five_summary": "[Gujarati Summary]",
    "learning_style": "[Gujarati Style]",
    "work_environment": "[Gujarati Environment]",
    "leadership_potential": "[Gujarati Leadership Insight]"
  }},
  "networking_suggestions": [
    "[સ્થાનિક અથવા ઓનલાઈન પ્રોફેશનલ નેટવર્કિંગ તક 1]",
    "[સ્થાનિક અથવા ઓનલાઈન પ્રોફેશનલ નેટવર્કિંગ તક 2]",
    "[પ્રોજેક્ટ, સમુદાય અથવા ઇવેન્ટમાં જોડાવાની તક 3]"
  ],
  "skill_development_plan": {{
    "immediate_focus": ["[પ્રારંભિક ધ્યાન કે કુશળતાઓ]"],
    "six_month_goals": ["[છ મહિનાના લક્ષ્યો]"],
    "one_year_vision": "[એક વર્ષની કારકિર્દી દ્રષ્ટિ]"
  }}
}}

FINAL REMINDERS:
1. Your response must START with {{ and END with }}
2. NO ```json ``` markdown blocks
3. NO explanatory text before or after JSON
4. Use direct Gujarati characters: તમારી, વિશ્લેષણ, કારકિર્દી
5. Keep all strings on single lines (no \\n, \\r, \\t)
6. Ensure perfect JSON syntax with balanced quotes and braces

RESPOND WITH PURE JSON NOW:
"""
        return prompt