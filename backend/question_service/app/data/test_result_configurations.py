"""
Predefined test result configurations for all test types
This data will be used to populate the test_result_configurations table
"""

# MBTI - All 16 Personality Types
MBTI_CONFIGS = [
    {"test_id": "mbti", "result_type": "personality_type", "result_code": "ISTJ", "result_name_gujarati": "લોજિસ્ટિશિયન", "result_name_english": "The Logistician", "description_gujarati": "વ્યવહારુ અને હકીકત-લક્ષી, વિશ્વસનીય અને જવાબદાર.", "description_english": "Practical and fact-minded, reliable and responsible.", "min_score": 0.0, "max_score": 100.0, "scoring_method": "percentage", "traits": ["વ્યવહારુ", "વિશ્વસનીય", "વ્યવસ્થિત", "જવાબદાર"], "careers": ["એકાઉન્ટન્ટ", "મેનેજર", "એન્જિનિયર", "ડૉક્ટર", "બેંકર"], "strengths": ["વ્યવસ્થા", "વિશ્વસનીયતા", "કાર્યક્ષમતા", "વિગતવાર કાર્ય"], "recommendations": ["નવા વિચારોને સ્વીકારો", "લવચીકતા વિકસાવો", "સર્જનાત્મકતા વધારો"], "is_active": True},
    {"test_id": "mbti", "result_type": "personality_type", "result_code": "ISFJ", "result_name_gujarati": "રક્ષક", "result_name_english": "The Protector", "description_gujarati": "ગરમદિલ અને જવાબદાર, હંમેશા મદદ કરવા તૈયાર.", "description_english": "Warm-hearted and dedicated, always ready to protect loved ones.", "min_score": 0.0, "max_score": 100.0, "scoring_method": "percentage", "traits": ["સહાનુભૂતિશીલ", "વફાદાર", "વિગતવાર", "સહાયક"], "careers": ["નર્સ", "શિક્ષક", "સામાજિક કાર્યકર", "કાઉન્સેલર", "ડૉક્ટર"], "strengths": ["દયા", "વિશ્વસનીયતા", "સેવાભાવ", "ધીરજ"], "recommendations": ["પોતાની જરૂરિયાતોનું ધ્યાન રાખો", "ના કહેવાનું શીખો", "આત્મવિશ્વાસ વધારો"], "is_active": True},
    {"test_id": "mbti", "result_type": "personality_type", "result_code": "INFJ", "result_name_gujarati": "વકીલ", "result_name_english": "The Advocate", "description_gujarati": "સર્જનાત્મક અને અંતર્દૃષ્ટિ ધરાવતા, પ્રેરણાદાયક અને આદર્શવાદી.", "description_english": "Creative and insightful, inspiring and decisive.", "min_score": 0.0, "max_score": 100.0, "scoring_method": "percentage", "traits": ["આદર્શવાદી", "સર્જનાત્મક", "અંતર્મુખી", "સંવેદનશીલ"], "careers": ["લેખક", "કાઉન્સેલર", "કલાકાર", "મનોવૈજ્ઞાનિક", "શિક્ષક"], "strengths": ["અંતર્દૃષ્ટિ", "સર્જનાત્મકતા", "આદર્શવાદ", "સમજણ"], "recommendations": ["વ્યવહારિક બનો", "નેટવર્કિંગ કરો", "આત્મવિશ્વાસ વધારો"], "is_active": True},
    {"test_id": "mbti", "result_type": "personality_type", "result_code": "INTJ", "result_name_gujarati": "આર્કિટેક્ટ", "result_name_english": "The Architect", "description_gujarati": "વ્યૂહરચનાકાર અને નવીનતાવાદી, દૃઢ સંકલ્પિત.", "description_english": "Imaginative and strategic thinkers, with a plan for everything.", "min_score": 0.0, "max_score": 100.0, "scoring_method": "percentage", "traits": ["વિશ્લેષણાત્મક", "સ્વતંત્ર", "નવીનતાવાદી", "વ્યૂહરચનાત્મક"], "careers": ["સોફ્ટવેર આર્કિટેક્ટ", "સંશોધક", "વિશ્લેષક", "સલાહકાર", "એન્જિનિયર"], "strengths": ["તાર્કિક વિચારસરણી", "સમસ્યા નિરાકરણ", "સ્વતંત્ર કાર્ય", "નવીનતા"], "recommendations": ["લાંબા ગાળાના લક્ષ્યો સેટ કરો", "ટીમવર્ક સ્કિલ્સ વિકસાવો", "સામાજિક કુશળતા વધારો"], "is_active": True},
    
    # Adding missing MBTI types including ESTJ
    {"test_id": "mbti", "result_type": "personality_type", "result_code": "ESTJ", "result_name_gujarati": "વ્યવસ્થાપક અને નેતા", "result_name_english": "બહિર્મુખી + અનુભવી + વિચાર + આયોજન વ્યવસ્થાપક, નેતા", "description_gujarati": "વ્યવસ્થાપક, નેતા અને સંગઠનાત્મક વ્યક્તિત્વ", "description_english": "વ્યવસ્થાપક, નેતા અને સંગઠનાત્મક વ્યક્તિત્વ", "min_score": 0.0, "max_score": 100.0, "scoring_method": "percentage", "traits": ["બહિર્મુખી", "અનુભવી", "વિચાર", "આયોજન"], "careers": ["મેનેજર", "એક્ઝિક્યુટિવ", "વકીલ", "જજ"], "strengths": ["નેતૃત્વ", "સંગઠન", "નિર્ણય લેવાની ક્ષમતા", "કાર્યક્ષમતા", "જવાબદારી"], "recommendations": ["લવચીકતા વિકસાવો", "અન્યની લાગણીઓ સમજો", "ધીરજ રાખો", "સહયોગ વધારો"], "is_active": True},
    
    {"test_id": "mbti", "result_type": "personality_type", "result_code": "ISTP", "result_name_gujarati": "પ્રયોગશીલ અને ટેકનિકલ", "result_name_english": "આંતર્મુખી + અનુભવી + વિચાર + ઓપન પ્રયોગશીલ, ટેકનિકલ નિપુણ", "description_gujarati": "પ્રયોગશીલ, ટેકનિકલ અને સ્વતંત્ર વ્યક્તિત્વ", "description_english": "પ્રયોગશીલ, ટેકનિકલ અને સ્વતંત્ર વ્યક્તિત્વ", "min_score": 0.0, "max_score": 100.0, "scoring_method": "percentage", "traits": ["આંતર્મુખી", "અનુભવી", "વિચાર", "ઓપન"], "careers": ["મિકેનિક", "એન્જિનિયર", "પાઇલટ", "ટેકનિશિયન"], "strengths": ["વ્યવહારિક સમસ્યા નિરાકરણ", "હાથની કુશળતા", "તકનીકી સમજ", "સ્વતંત્ર કાર્ય"], "recommendations": ["લાંબા ગાળાના આયોજન કરો", "સામાજિક કુશળતા વધારો", "ટીમવર્ક સ્કિલ્સ વિકસાવો"], "is_active": True},

    {"test_id": "mbti", "result_type": "personality_type", "result_code": "INFP", "result_name_gujarati": "સપનાવાળો અને મધ્યસ્થ", "result_name_english": "આંતર્મુખી + કલ્પના + લાગણી + ઓપન સપનાવાળો, મધ્યસ્થ", "description_gujarati": "સપનાવાળો, આદર્શવાદી અને સર્જનાત્મક વ્યક્તિત્વ", "description_english": "સપનાવાળો, આદર્શવાદી અને સર્જનાત્મક વ્યક્તિત્વ", "min_score": 0.0, "max_score": 100.0, "scoring_method": "percentage", "traits": ["આંતર્મુખી", "કલ્પના", "લાગણી", "ઓપન"], "careers": ["લેખક", "કાઉન્સેલર", "કલાકાર", "મનોવૈજ્ઞાનિક"], "strengths": ["સર્જનાત્મકતા", "સહાનુભૂતિ", "આદર્શવાદ", "લવચીકતા"], "recommendations": ["વ્યવહારિક લક્ષ્યો સેટ કરો", "સમય વ્યવસ્થાપન સુધારો", "આત્મવિશ્વાસ વધારો"], "is_active": True},
    
    {"test_id": "mbti", "result_type": "personality_type", "result_code": "ESTP", "result_name_gujarati": "ઉદ્યમી", "result_name_english": "The Entrepreneur", "description_gujarati": "સ્વતઃસ્ફૂર્ત અને ઊર્જાવાન, વ્યવહારિક અને લવચીક", "description_english": "Spontaneous and energetic, practical and flexible", "min_score": 0.0, "max_score": 100.0, "scoring_method": "percentage", "traits": ["બહિર્મુખી", "વ્યવહારિક", "લવચીક", "સાહસિક"], "careers": ["સેલ્સ", "માર્કેટિંગ", "ઉદ્યોગપતિ", "એથ્લેટ"], "strengths": ["અનુકૂલનક્ષમતા", "સમસ્યા નિરાકરણ", "સામાજિક કુશળતા"], "recommendations": ["લાંબા ગાળાના આયોજન કરો", "ધીરજ વિકસાવો", "વિગતોનું ધ્યાન રાખો"], "is_active": True},
    
    {"test_id": "mbti", "result_type": "personality_type", "result_code": "ESFP", "result_name_gujarati": "મનોરંજક", "result_name_english": "The Entertainer", "description_gujarati": "ઉત્સાહી અને સર્જનાત્મક, સ્વતઃસ્ફૂર્ત અને સામાજિક", "description_english": "Enthusiastic and creative, spontaneous and social", "min_score": 0.0, "max_score": 100.0, "scoring_method": "percentage", "traits": ["બહિર્મુખી", "સર્જનાત્મક", "સામાજિક", "ઉત્સાહી"], "careers": ["કલાકાર", "શિક્ષક", "મનોરંજન", "ઇવેન્ટ પ્લાનર"], "strengths": ["સર્જનાત્મકતા", "સામાજિક કુશળતા", "ઉત્સાહ"], "recommendations": ["ફોકસ વિકસાવો", "આયોજન કુશળતા સુધારો", "લાંબા ગાળાના લક્ષ્યો સેટ કરો"], "is_active": True},

    # Adding remaining 8 MBTI types to complete all 16 personality types
    {"test_id": "mbti", "result_type": "personality_type", "result_code": "ISFP", "result_name_gujarati": "સાહસિક", "result_name_english": "The Adventurer", "description_gujarati": "લવચીક અને મૈત્રીપૂર્ણ, શાંત કલાકાર", "description_english": "Flexible and charming, quiet artist", "min_score": 0.0, "max_score": 100.0, "scoring_method": "percentage", "traits": ["આંતર્મુખી", "સંવેદનશીલ", "લવચીક", "કલાત્મક"], "careers": ["કલાકાર", "ફોટોગ્રાફર", "મ્યુઝિશિયન", "ડિઝાઇનર"], "strengths": ["સર્જનાત્મકતા", "સહાનુભૂતિ", "લવચીકતા", "સૌંદર્ય બોધ"], "recommendations": ["આત્મવિશ્વાસ વધારો", "સમય વ્યવસ્થાપન સુધારો", "લક્ષ્યો સ્પષ્ટ કરો"], "is_active": True},

    {"test_id": "mbti", "result_type": "personality_type", "result_code": "INTP", "result_name_gujarati": "વિચારક", "result_name_english": "The Thinker", "description_gujarati": "નવીન વિચારક અને દાર્શનિક", "description_english": "Innovative thinker and philosopher", "min_score": 0.0, "max_score": 100.0, "scoring_method": "percentage", "traits": ["આંતર્મુખી", "કલ્પનાશીલ", "તાર્કિક", "લવચીક"], "careers": ["સંશોધક", "દાર્શનિક", "વૈજ્ઞાનિક", "પ્રોગ્રામર"], "strengths": ["તાર્કિક વિચારસરણી", "સમસ્યા નિરાકરણ", "નવીનતા", "વિશ્લેષણ"], "recommendations": ["વ્યવહારિક કુશળતા વિકસાવો", "સામાજિક કુશળતા વધારો", "પ્રોજેક્ટ પૂર્ણ કરવાની આદત બનાવો"], "is_active": True},

    {"test_id": "mbti", "result_type": "personality_type", "result_code": "ENFP", "result_name_gujarati": "પ્રચારક", "result_name_english": "The Campaigner", "description_gujarati": "ઉત્સાહી અને સર્જનાત્મક, મુક્ત આત્મા", "description_english": "Enthusiastic and creative, free spirit", "min_score": 0.0, "max_score": 100.0, "scoring_method": "percentage", "traits": ["બહિર્મુખી", "કલ્પનાશીલ", "લાગણીશીલ", "લવચીક"], "careers": ["પત્રકાર", "કાઉન્સેલર", "માર્કેટિંગ", "લેખક"], "strengths": ["સર્જનાત્મકતા", "સામાજિક કુશળતા", "ઉત્સાહ", "પ્રેરણા"], "recommendations": ["ફોકસ વિકસાવો", "વ્યવસ્થા સુધારો", "લાંબા ગાળાના આયોજન કરો"], "is_active": True},

    {"test_id": "mbti", "result_type": "personality_type", "result_code": "ENTP", "result_name_gujarati": "ચર્ચાકાર", "result_name_english": "The Debater", "description_gujarati": "સ્માર્ટ અને જિજ્ઞાસુ વિચારક", "description_english": "Smart and curious thinker", "min_score": 0.0, "max_score": 100.0, "scoring_method": "percentage", "traits": ["બહિર્મુખી", "કલ્પનાશીલ", "તાર્કિક", "લવચીક"], "careers": ["ઉદ્યોગપતિ", "વકીલ", "સલાહકાર", "નવીનતાકાર"], "strengths": ["નવીનતા", "ચર્ચા કુશળતા", "અનુકૂલનક્ષમતા", "નેતૃત્વ"], "recommendations": ["ધીરજ વિકસાવો", "વિગતોનું ધ્યાન રાખો", "પ્રોજેક્ટ પૂર્ણ કરવાની આદત બનાવો"], "is_active": True},

    {"test_id": "mbti", "result_type": "personality_type", "result_code": "ESFJ", "result_name_gujarati": "કોન્સલ", "result_name_english": "The Consul", "description_gujarati": "લોકપ્રિય અને સહાયક, હંમેશા મદદ કરવા તૈયાર", "description_english": "Popular and helpful, always ready to help", "min_score": 0.0, "max_score": 100.0, "scoring_method": "percentage", "traits": ["બહિર્મુખી", "વ્યવહારિક", "લાગણીશીલ", "વ્યવસ્થિત"], "careers": ["શિક્ષક", "નર્સ", "સામાજિક કાર્યકર", "HR મેનેજર"], "strengths": ["સામાજિક કુશળતા", "સહાનુભૂતિ", "વ્યવસ્થા", "સેવાભાવ"], "recommendations": ["પોતાની જરૂરિયાતોનું ધ્યાન રાખો", "ના કહેવાનું શીખો", "આત્મવિશ્વાસ વધારો"], "is_active": True},

    {"test_id": "mbti", "result_type": "personality_type", "result_code": "ENFJ", "result_name_gujarati": "નાયક", "result_name_english": "The Protagonist", "description_gujarati": "પ્રેરણાદાયક અને કરિશ્માટિક નેતા", "description_english": "Inspiring and charismatic leader", "min_score": 0.0, "max_score": 100.0, "scoring_method": "percentage", "traits": ["બહિર્મુખી", "કલ્પનાશીલ", "લાગણીશીલ", "વ્યવસ્થિત"], "careers": ["શિક્ષક", "કાઉન્સેલર", "મેનેજર", "રાજનેતા"], "strengths": ["નેતૃત્વ", "પ્રેરણા", "સહાનુભૂતિ", "સંવાદ કુશળતા"], "recommendations": ["પોતાની જરૂરિયાતોનું ધ્યાન રાખો", "સ્ટ્રેસ મેનેજમેન્ટ શીખો", "સીમાઓ નક્કી કરો"], "is_active": True},

    {"test_id": "mbti", "result_type": "personality_type", "result_code": "ENTJ", "result_name_gujarati": "કમાન્ડર", "result_name_english": "The Commander", "description_gujarati": "બોલ્ડ અને કલ્પનાશીલ નેતા", "description_english": "Bold and imaginative leader", "min_score": 0.0, "max_score": 100.0, "scoring_method": "percentage", "traits": ["બહિર્મુખી", "કલ્પનાશીલ", "તાર્કિક", "વ્યવસ્થિત"], "careers": ["CEO", "મેનેજર", "ઉદ્યોગપતિ", "વકીલ"], "strengths": ["નેતૃત્વ", "વ્યૂહરચના", "નિર્ણય લેવાની ક્ષમતા", "કાર્યક્ષમતા"], "recommendations": ["ધીરજ વિકસાવો", "અન્યની લાગણીઓ સમજો", "લવચીકતા વધારો"], "is_active": True},
]

# Multiple Intelligence Configurations  
INTELLIGENCE_CONFIGURATIONS = [
    {
        "test_id": "intelligence",
        "result_type": "intelligence_type",
        "result_code": "linguistic",
        "result_name_gujarati": "ભાષાકીય બુદ્ધિ",
        "result_name_english": "Linguistic Intelligence",
        "description_gujarati": "શબ્દો અને ભાષાની કુશળતા, વાંચન, લેખન અને વાતચીતમાં પ્રવીણતા",
        "description_english": "Skill with words and language, proficiency in reading, writing and speaking",
        "traits": ["ભાષા પ્રેમી", "વાંચન શોખીન", "લેખન કુશળ", "વાતચીત પ્રવીણ"],
        "careers": ["લેખક", "પત્રકાર", "વકીલ", "શિક્ષક", "અનુવાદક"],
        "strengths": ["ભાષા સમજ", "લેખન કુશળતા", "વાતચીત", "વાંચન ઝડપ"],
        "recommendations": ["વધુ વાંચો", "લેખન પ્રેક્ટિસ કરો", "નવી ભાષાઓ શીખો", "ચર્ચામાં ભાગ લો"]
    },
    {
        "test_id": "intelligence",
        "result_type": "intelligence_type",
        "result_code": "logical",
        "result_name_gujarati": "તાર્કિક-ગાણિતિક બુદ્ધિ",
        "result_name_english": "Logical-Mathematical Intelligence",
        "description_gujarati": "તર્ક અને ગણિતની કુશળતા, સમસ્યા નિરાકરણ અને વિશ્લેષણ",
        "description_english": "Skill with logic and mathematics, problem-solving and analysis",
        "traits": ["તાર્કિક", "વિશ્લેષણાત્મક", "ગાણિતિક", "સમસ્યા નિરાકરક"],
        "careers": ["ગણિતશાસ્ત્રી", "એન્જિનિયર", "વૈજ્ઞાનિક", "પ્રોગ્રામર", "વિશ્લેષક"],
        "strengths": ["તાર્કિક વિચારસરણી", "ગણિત", "વિશ્લેષણ", "સમસ્યા નિરાકરણ"],
        "recommendations": ["ગાણિતિક પઝલ્સ હલ કરો", "તર્કશાસ્ત્ર અભ્યાસ કરો", "કોડિંગ શીખો"]
    },
    {
        "test_id": "intelligence",
        "result_type": "intelligence_type",
        "result_code": "musical",
        "result_name_gujarati": "સંગીત બુદ્ધિ",
        "result_name_english": "Musical Intelligence",
        "description_gujarati": "તાલ, સ્વર, સંગીતની સમજ અને સંગીત સાથે જોડાણ",
        "description_english": "Rhythm, tone, musical understanding and connection with music",
        "traits": ["સંગીત પ્રેમી", "તાલબદ્ધ", "સ્વર સંવેદનશીલ", "સંગીત સર્જક"],
        "careers": ["સંગીતકાર", "ગાયક", "સંગીત શિક્ષક", "સાઉન્ડ એન્જિનિયર", "સંગીત ચિકિત્સક"],
        "strengths": ["સંગીત સમજ", "તાલ બોધ", "સ્વર ઓળખ", "સંગીત સર્જન"],
        "recommendations": ["સાધન શીખો", "સંગીત સાંભળો", "સંગીત રચના કરો", "સંગીત જૂથોમાં જોડાવ"]
    },
    {
        "test_id": "intelligence",
        "result_type": "intelligence_type",
        "result_code": "bodily_kinesthetic",
        "result_name_gujarati": "શારીરિક-ગતિશીલ બુદ્ધિ",
        "result_name_english": "Bodily-Kinesthetic Intelligence",
        "description_gujarati": "શરીરની કુશળતા અને સમન્વય, ખેલ અને શારીરિક પ્રવૃત્તિઓ",
        "description_english": "Body skills and coordination, sports and physical activities",
        "traits": ["શારીરિક કુશળ", "સમન્વયકારી", "ખેલાડી", "હાથની કુશળતા"],
        "careers": ["એથ્લેટ", "ડાન્સર", "સર્જન", "કારીગર", "ફિઝિયોથેરાપિસ્ટ"],
        "strengths": ["શારીરિક કુશળતા", "સમન્વય", "હાથની કામગીરી", "ખેલ પ્રતિભા"],
        "recommendations": ["નિયમિત કસરત કરો", "નવી ખેલો શીખો", "હાથકામ કરો", "યોગ અભ્યાસ કરો"]
    },
    {
        "test_id": "intelligence",
        "result_type": "intelligence_type",
        "result_code": "visual_spatial",
        "result_name_gujarati": "દૃશ્ય-અવકાશીય બુદ્ધિ",
        "result_name_english": "Visual-Spatial Intelligence",
        "description_gujarati": "દૃશ્યની સમજ અને અવકાશની કલ્પના, ડિઝાઇન અને કલા",
        "description_english": "Visual understanding and spatial imagination, design and art",
        "traits": ["દૃશ્ય સંવેદનશીલ", "અવકાશીય", "કલાત્મક", "ડિઝાઇન કુશળ"],
        "careers": ["આર્કિટેક્ટ", "ડિઝાઇનર", "કલાકાર", "ફોટોગ્રાફર", "એન્જિનિયર"],
        "strengths": ["દૃશ્ય કલ્પના", "અવકાશીય સમજ", "ડિઝાઇન", "કલાત્મક દૃષ્ટિ"],
        "recommendations": ["ચિત્રકામ કરો", "ડિઝાઇન શીખો", "મ્યુઝિયમ જાવ", "ફોટોગ્રાફી કરો"]
    },
    {
        "test_id": "intelligence",
        "result_type": "intelligence_type",
        "result_code": "interpersonal",
        "result_name_gujarati": "આંતરવ્યક્તિગત બુદ્ધિ",
        "result_name_english": "Interpersonal Intelligence",
        "description_gujarati": "અન્ય લોકો સાથે સંવાદ અને સમજણ, સામાજિક કુશળતા",
        "description_english": "Communication and understanding with others, social skills",
        "traits": ["સામાજિક", "સંવાદ કુશળ", "સહાનુભૂતિશીલ", "નેતૃત્વ ક્ષમતા"],
        "careers": ["શિક્ષક", "કાઉન્સેલર", "સેલ્સ", "મેનેજર", "સામાજિક કાર્યકર"],
        "strengths": ["સામાજિક કુશળતા", "સંવાદ", "નેતૃત્વ", "ટીમવર્ક"],
        "recommendations": ["નેટવર્કિંગ કરો", "ટીમ પ્રોજેક્ટ્સમાં ભાગ લો", "સંવાદ કુશળતા વધારો", "સામુદાયિક કાર્યોમાં જોડાવ"]
    },
    {
        "test_id": "intelligence",
        "result_type": "intelligence_type",
        "result_code": "intrapersonal",
        "result_name_gujarati": "આત્મ-જ્ઞાન બુદ્ધિ",
        "result_name_english": "Intrapersonal Intelligence",
        "description_gujarati": "પોતાની જાતને સમજવી - આંતરિક લાગણી, ભાવનાઓ, પ્રેરણા - વ્યક્તિગત આત્મનિરીક્ષણ",
        "description_english": "Understanding oneself - inner feelings, emotions, motivation - personal introspection",
        "traits": ["આત્મનિરીક્ષક", "સ્વતંત્ર", "ભાવનાત્મક સમજ", "આત્મ-જાગૃત"],
        "careers": ["લેખક", "દાર્શનિક", "મનોવૈજ્ઞાનિક", "સંશોધક", "સ્વતંત્ર સલાહકાર"],
        "strengths": ["આત્મ-જાગૃતિ", "ભાવનાત્મક બુદ્ધિ", "સ્વતંત્ર વિચારસરણી", "આત્મનિયંત્રણ"],
        "recommendations": ["મેડિટેશન કરો", "જર્નલ લખો", "આત્મનિરીક્ષણ કરો", "એકલા સમય પસાર કરો"]
    },
    {
        "test_id": "intelligence",
        "result_type": "intelligence_type",
        "result_code": "naturalistic",
        "result_name_gujarati": "કુદરતી બુદ્ધિ",
        "result_name_english": "Naturalistic Intelligence",
        "description_gujarati": "પ્રકૃતિ અને પર્યાવરણની સમજ, જીવ-જંતુઓ અને વનસ્પતિઓ સાથે જોડાણ",
        "description_english": "Understanding of nature and environment, connection with flora and fauna",
        "traits": ["પ્રકૃતિ પ્રેમી", "પર્યાવરણ સંવેદનશીલ", "જીવવિજ્ઞાન રુચિ", "બાગકામ શોખીન"],
        "careers": ["બાયોલોજિસ્ટ", "પર્યાવરણવિદ", "કૃષિવિજ્ઞાની", "વેટરિનેરિયન", "બોટનિસ્ટ"],
        "strengths": ["પ્રકૃતિ સમજ", "પર્યાવરણ જાગૃતિ", "જીવવિજ્ઞાન", "બાગકામ"],
        "recommendations": ["બાગકામ કરો", "પ્રકૃતિમાં સમય વિતાવો", "પર્યાવરણ સંરક્ષણમાં ભાગ લો", "જીવવિજ્ઞાન અભ્યાસ કરો"]
    },
    {
        "test_id": "intelligence",
        "result_type": "intelligence_type",
        "result_code": "existential",
        "result_name_gujarati": "અસ્તિત્વવાદી બુદ્ધિ",
        "result_name_english": "Existential Intelligence",
        "description_gujarati": "અસ્તિત્વ અને જીવનના મૂળભૂત પ્રશ્નોની તપાસ કરવાની ક્ષમતા",
        "description_english": "Ability to explore fundamental questions of existence and life",
        "traits": ["દાર્શનિક", "આધ્યાત્મિક", "જીવન પ્રશ્નોમાં રુચિ", "અર્થ શોધક"],
        "careers": ["દાર્શનિક", "ધર્મગુરુ", "લેખક", "મનોવૈજ્ઞાનિક", "આધ્યાત્મિક શિક્ષક"],
        "strengths": ["ગહન વિચારસરણી", "આધ્યાત્મિક સમજ", "જીવન દર્શન", "અર્થ શોધ"],
        "recommendations": ["દર્શનશાસ્ત્ર વાંચો", "આધ્યાત્મિક અભ્યાસ કરો", "જીવનના મૂળભૂત પ્રશ્નો પર વિચાર કરો", "મેડિટેશન કરો"]
    }
]

# Big Five Configurations
BIG_FIVE_CONFIGURATIONS = [
    {
        "test_id": "bigfive",
        "result_type": "personality_trait",
        "result_code": "openness_high",
        "result_name_gujarati": "ઉચ્ચ ખુલ્લુંપન",
        "result_name_english": "High Openness",
        "description_gujarati": "નવા અનુભવો માટે ખુલ્લા, કલ્પનાશીલ અને જિજ્ઞાસુ",
        "description_english": "Open to new experiences, imaginative and curious",
        "min_score": 70,
        "max_score": 100,
        "traits": ["કલ્પનાશીલ", "જિજ્ઞાસુ", "કલાત્મક", "નવીનતાવાદી"],
        "careers": ["કલાકાર", "લેખક", "સંશોધક", "ડિઝાઇનર"],
        "strengths": ["સર્જનાત્મકતા", "અનુકૂલનક્ષમતા", "નવા વિચારો"],
        "recommendations": ["નવા અનુભવો મેળવો", "કલાત્મક પ્રવૃત્તિઓ કરો", "વિવિધ સંસ્કૃતિઓ જાણો"]
    },
    {
        "test_id": "bigfive",
        "result_type": "personality_trait", 
        "result_code": "conscientiousness_high",
        "result_name_gujarati": "ઉચ્ચ જવાબદારી",
        "result_name_english": "High Conscientiousness",
        "description_gujarati": "વિશ્વસનીય, જવાબદાર અને સંગઠિત વ્યક્તિત્વ",
        "description_english": "Reliable, responsible and organized personality",
        "min_score": 70,
        "max_score": 100,
        "traits": ["વ્યવસ્થિત", "જવાબદાર", "લક્ષ્યલક્ષી", "અનુશાસિત"],
        "careers": ["મેનેજર", "એકાઉન્ટન્ટ", "એન્જિનિયર", "ડૉક્ટર"],
        "strengths": ["વ્યવસ્થા", "વિશ્વસનીયતા", "કાર્યક્ષમતા"],
        "recommendations": ["લવચીકતા વિકસાવો", "સ્ટ્રેસ મેનેજમેન્ટ શીખો", "આરામ કરવાનું શીખો"]
    },
    {
        "test_id": "bigfive",
        "result_type": "personality_trait",
        "result_code": "extraversion_high", 
        "result_name_gujarati": "ઉચ્ચ બહિર્મુખતા",
        "result_name_english": "High Extraversion",
        "description_gujarati": "બહિર્મુખી, સામાજિક અને ઊર્જાવાન વ્યક્તિત્વ",
        "description_english": "Outgoing, social and energetic personality",
        "min_score": 70,
        "max_score": 100,
        "traits": ["સામાજિક", "ઊર્જાવાન", "વાતચીત પ્રિય", "આત્મવિશ્વાસી"],
        "careers": ["સેલ્સ", "માર્કેટિંગ", "શિક્ષક", "મેનેજર"],
        "strengths": ["સામાજિક કુશળતા", "નેતૃત્વ", "સંવાદ"],
        "recommendations": ["એકલા સમયનું મહત્વ સમજો", "સાંભળવાની કુશળતા વધારો", "ધીરજ વિકસાવો"]
    },
    {
        "test_id": "bigfive",
        "result_type": "personality_trait",
        "result_code": "agreeableness_high",
        "result_name_gujarati": "ઉચ્ચ સહમતિ", 
        "result_name_english": "High Agreeableness",
        "description_gujarati": "સહાનુભૂતિશીલ, સહકારી અને વિશ્વાસપાત્ર",
        "description_english": "Empathetic, cooperative and trustworthy",
        "min_score": 70,
        "max_score": 100,
        "traits": ["સહાનુભૂતિશીલ", "સહકારી", "દયાળુ", "વિશ્વાસપાત્ર"],
        "careers": ["કાઉન્સેલર", "શિક્ષક", "સામાજિક કાર્યકર", "નર્સ"],
        "strengths": ["ટીમવર્ક", "સંઘર્ષ નિરાકરણ", "સહાનુભૂતિ"],
        "recommendations": ["આત્મરક્ષા શીખો", "ના કહેવાનું શીખો", "પોતાની જરૂરિયાતોનું ધ્યાન રાખો"]
    },
    {
        "test_id": "bigfive",
        "result_type": "personality_trait",
        "result_code": "neuroticism_low",
        "result_name_gujarati": "નીચી ચિંતા",
        "result_name_english": "Low Neuroticism", 
        "description_gujarati": "શાંત, સ્થિર અને તણાવ સહન કરવાની ક્ષમતા",
        "description_english": "Calm, stable and stress-resistant",
        "min_score": 0,
        "max_score": 30,
        "traits": ["શાંત", "સ્થિર", "આત્મવિશ્વાસી", "તણાવ પ્રતિરોધી"],
        "careers": ["પાઇલટ", "સર્જન", "મેનેજર", "કાઉન્સેલર"],
        "strengths": ["ભાવનાત્મક સ્થિરતા", "તણાવ સંચાલન", "નિર્ણય ક્ષમતા"],
        "recommendations": ["લાગણીઓ વ્યક્ત કરવાનું શીખો", "સહાનુભૂતિ વિકસાવો", "અન્યની લાગણીઓ સમજો"]
    }
]

# RIASEC Configurations
RIASEC_CONFIGURATIONS = [
    {
        "test_id": "riasec",
        "result_type": "career_interest",
        "result_code": "realistic",
        "result_name_gujarati": "વાસ્તવિક",
        "result_name_english": "Realistic",
        "description_gujarati": "હાથ વડે કામ, મશીનો અને સાધનો સાથે કામ કરવાની રુચિ",
        "description_english": "Interest in hands-on work, machines and tools",
        "traits": ["વ્યવહારુ", "યાંત્રિક", "શારીરિક", "સ્વતંત્ર"],
        "careers": ["એન્જિનિયર", "ટેકનિશિયન", "ખેડૂત", "કારીગર", "મિકેનિક"],
        "strengths": ["હાથની કુશળતા", "યાંત્રિક સમજ", "વ્યવહારિકતા"],
        "recommendations": ["હાથની કુશળતા વિકસાવો", "ટેકનિકલ સ્કિલ્સ શીખો", "પ્રેક્ટિકલ પ્રોજેક્ટ્સ કરો"]
    },
    {
        "test_id": "riasec",
        "result_type": "career_interest",
        "result_code": "investigative",
        "result_name_gujarati": "તપાસનીશ",
        "result_name_english": "Investigative",
        "description_gujarati": "વૈજ્ઞાનિક અને તાર્કિક વિચારસરણી, સંશોધન અને વિશ્લેષણ",
        "description_english": "Scientific and logical thinking, research and analysis",
        "traits": ["વિશ્લેષણાત્મક", "તાર્કિક", "જિજ્ઞાસુ", "સ્વતંત્ર"],
        "careers": ["વૈજ્ઞાનિક", "સંશોધક", "ડૉક્ટર", "વિશ્લેષક", "ગણિતશાસ્ત્રી"],
        "strengths": ["સમસ્યા નિરાકરણ", "વિશ્લેષણ", "સંશોધન"],
        "recommendations": ["સંશોધન પ્રોજેક્ટ્સમાં ભાગ લો", "વૈજ્ઞાનિક પદ્ધતિ શીખો", "ડેટા વિશ્લેષણ કુશળતા વિકસાવો"]
    },
    {
        "test_id": "riasec",
        "result_type": "career_interest",
        "result_code": "artistic",
        "result_name_gujarati": "કલાત્મક",
        "result_name_english": "Artistic",
        "description_gujarati": "સર્જનાત્મકતા, કલા અને સ્વ-અભિવ્યક્તિમાં રુચિ",
        "description_english": "Interest in creativity, art and self-expression",
        "traits": ["સર્જનાત્મક", "કલ્પનાશીલ", "અભિવ્યક્તિશીલ", "સ્વતંત્ર"],
        "careers": ["કલાકાર", "ડિઝાઇનર", "લેખક", "સંગીતકાર", "અભિનેતા"],
        "strengths": ["સર્જનાત્મકતા", "કલાત્મક દૃષ્ટિ", "નવીનતા"],
        "recommendations": ["કલાત્મક કુશળતા વિકસાવો", "સર્જનાત્મક પ્રોજેક્ટ્સ કરો", "કલા અભ્યાસ કરો"]
    },
    {
        "test_id": "riasec",
        "result_type": "career_interest",
        "result_code": "social",
        "result_name_gujarati": "સામાજિક",
        "result_name_english": "Social",
        "description_gujarati": "લોકોની મદદ, શિક્ષણ અને સેવામાં રુચિ",
        "description_english": "Interest in helping, teaching and serving people",
        "traits": ["સહાયક", "સહાનુભૂતિશીલ", "સંવાદ કુશળ", "સામાજિક"],
        "careers": ["શિક્ષક", "કાઉન્સેલર", "સામાજિક કાર્યકર", "નર્સ", "મનોવૈજ્ઞાનિક"],
        "strengths": ["સામાજિક કુશળતા", "સહાનુભૂતિ", "સંવાદ"],
        "recommendations": ["સામાજિક કુશળતા વધારો", "સ્વયંસેવક કાર્યોમાં ભાગ લો", "કાઉન્સેલિંગ સ્કિલ્સ શીખો"]
    },
    {
        "test_id": "riasec",
        "result_type": "career_interest",
        "result_code": "enterprising",
        "result_name_gujarati": "ઉદ્યમશીલ",
        "result_name_english": "Enterprising",
        "description_gujarati": "નેતૃત્વ, વ્યવસાય અને લોકોને પ્રભાવિત કરવામાં રુચિ",
        "description_english": "Interest in leadership, business and influencing people",
        "traits": ["નેતા", "મહત્વાકાંક્ષી", "પ્રભાવશાળી", "જોખમ લેનાર"],
        "careers": ["મેનેજર", "સેલ્સ", "ઉદ્યોગપતિ", "રાજનેતા", "વકીલ"],
        "strengths": ["નેતૃત્વ", "વ્યવસાયિક સમજ", "પ્રભાવ"],
        "recommendations": ["નેતૃત્વ કુશળતા વિકસાવો", "વ્યવસાયિક જ્ઞાન મેળવો", "નેટવર્કિંગ કરો"]
    },
    {
        "test_id": "riasec",
        "result_type": "career_interest",
        "result_code": "conventional",
        "result_name_gujarati": "પરંપરાગત",
        "result_name_english": "Conventional",
        "description_gujarati": "વ્યવસ્થા, ડેટા અને વિગતવાર કામમાં રુચિ",
        "description_english": "Interest in organization, data and detailed work",
        "traits": ["વ્યવસ્થિત", "વિગતવાર", "વિશ્વસનીય", "સચોટ"],
        "careers": ["એકાઉન્ટન્ટ", "બેંકર", "ક્લાર્ક", "ડેટા એન્ટ્રી", "એડમિન"],
        "strengths": ["વ્યવસ્થા", "સચોટતા", "વિગતવાર કાર્ય"],
        "recommendations": ["કમ્પ્યુટર સ્કિલ્સ શીખો", "ડેટા મેનેજમેન્ટ કુશળતા વિકસાવો", "ફાઇનાન્સિયલ જ્ઞાન મેળવો"]
    }
]

# SVS (Schwartz Values) Configurations
SVS_CONFIGURATIONS = [
    {
        "test_id": "svs",
        "result_type": "personal_value",
        "result_code": "achievement",
        "result_name_gujarati": "સિદ્ધિ",
        "result_name_english": "Achievement",
        "description_gujarati": "વ્યક્તિગત સફળતા અને સક્ષમતા દર્શાવવાની ઇચ્છા",
        "description_english": "Personal success through demonstrating competence",
        "traits": ["મહત્વાકાંક્ષી", "લક્ષ્ય-લક્ષી", "સ્પર્ધાત્મક", "સફળતા-લક્ષી"],
        "careers": ["બિઝનેસ લીડર", "સેલ્સ", "ઉદ્યોગપતિ", "મેનેજર"],
        "strengths": ["લક્ષ્ય સેટિંગ", "પ્રેરણા", "નેતૃત્વ", "પરિણામ-લક્ષી"],
        "recommendations": ["સ્પષ્ટ લક્ષ્યો સેટ કરો", "પ્રગતિ માપો", "સફળતાઓ ઉજવો"]
    },
    {
        "test_id": "svs",
        "result_type": "personal_value",
        "result_code": "power",
        "result_name_gujarati": "શક્તિ",
        "result_name_english": "Power",
        "description_gujarati": "અન્ય લોકો અને સંસાધનો પર નિયંત્રણ અને પ્રભાવ",
        "description_english": "Control and influence over people and resources",
        "traits": ["નેતૃત્વ", "પ્રભાવશાળી", "નિયંત્રણ", "અધિકાર"],
        "careers": ["સીઇઓ", "રાજકારણી", "જજ", "મિલિટરી ઓફિસર"],
        "strengths": ["નેતૃત્વ", "નિર્ણય લેવાની ક્ષમતા", "પ્રભાવ", "સંગઠન"],
        "recommendations": ["નેતૃત્વ કુશળતા વિકસાવો", "જવાબદારી લો", "ટીમ બિલ્ડિંગ કરો"]
    },
    {
        "test_id": "svs",
        "result_type": "personal_value",
        "result_code": "security",
        "result_name_gujarati": "સુરક્ષા",
        "result_name_english": "Security",
        "description_gujarati": "સમાજ, સંબંધો અને સ્વયંની સુરક્ષા અને સ્થિરતા",
        "description_english": "Safety and stability of society, relationships and self",
        "traits": ["સુરક્ષા-લક્ષી", "સ્થિર", "સાવચેત", "જવાબદાર"],
        "careers": ["સિક્યુરિટી ઓફિસર", "બેંકર", "ઇન્શ્યોરન્સ એજન્ટ", "એકાઉન્ટન્ટ"],
        "strengths": ["જોખમ મૂલ્યાંકન", "આયોજન", "વિશ્વસનીયતા", "સ્થિરતા"],
        "recommendations": ["ઇમર્જન્સી ફંડ બનાવો", "વીમો લો", "સુરક્ષિત રોકાણ કરો"]
    },
    {
        "test_id": "svs",
        "result_type": "personal_value",
        "result_code": "benevolence",
        "result_name_gujarati": "પરોપકાર",
        "result_name_english": "Benevolence",
        "description_gujarati": "નજીકના લોકોના કલ્યાણ અને ખુશીની ચિંતા",
        "description_english": "Concern for the welfare and happiness of close others",
        "traits": ["દયાળુ", "મદદગાર", "વફાદાર", "માફ કરનાર"],
        "careers": ["કાઉન્સેલર", "સોશિયલ વર્કર", "નર્સ", "શિક્ષક"],
        "strengths": ["સહાનુભૂતિ", "સંબંધ નિર્માણ", "ટીમવર્ક", "સેવાભાવ"],
        "recommendations": ["સ્વયંસેવક કામ કરો", "પરિવાર સાથે સમય વિતાવો", "મિત્રોની મદદ કરો"]
    },
    {
        "test_id": "svs",
        "result_type": "personal_value",
        "result_code": "universalism",
        "result_name_gujarati": "સાર્વત્રિકતા",
        "result_name_english": "Universalism",
        "description_gujarati": "બધા લોકો અને પ્રકૃતિના કલ્યાણની સમજ અને સહનશીલતા",
        "description_english": "Understanding and tolerance for all people and nature",
        "traits": ["સહનશીલ", "ન્યાયપ્રિય", "પર્યાવરણ પ્રેમી", "સમાનતાવાદી"],
        "careers": ["એનજીઓ વર્કર", "પર્યાવરણવાદી", "માનવાધિકાર કાર્યકર", "સંશોધક"],
        "strengths": ["સામાજિક ન્યાય", "પર્યાવરણ જાગૃતિ", "સહનશીલતા", "વૈશ્વિક દૃષ્ટિકોણ"],
        "recommendations": ["સામાજિક કારણો માટે કામ કરો", "પર્યાવરણ બચાવો", "વિવિધતાને અપનાવો"]
    },
    {
        "test_id": "svs",
        "result_type": "personal_value",
        "result_code": "self_direction",
        "result_name_gujarati": "સ્વ-દિશા",
        "result_name_english": "Self-Direction",
        "description_gujarati": "વિચાર અને ક્રિયામાં સ્વતંત્ર અને સ્વાયત્ત હોવાની ઇચ્છા",
        "description_english": "Independent thought and action - choosing, creating, exploring",
        "traits": ["સ્વતંત્ર", "સર્જનાત્મક", "જિજ્ઞાસુ", "નવીનતાપ્રિય"],
        "careers": ["ઉદ્યોગપતિ", "કલાકાર", "સંશોધક", "ફ્રીલાન્સર"],
        "strengths": ["સર્જનાત્મકતા", "સ્વતંત્રતા", "નવીનતા", "સમસ્યા નિવારણ"],
        "recommendations": ["નવા વિચારો અજમાવો", "સ્વતંત્ર પ્રોજેક્ટ કરો", "સર્જનાત્મક હોબી અપનાવો"]
    },
    {
        "test_id": "svs",
        "result_type": "personal_value",
        "result_code": "stimulation",
        "result_name_gujarati": "ઉત્તેજના",
        "result_name_english": "Stimulation",
        "description_gujarati": "જીવનમાં ઉત્તેજના, નવીનતા અને પડકારની જરૂરિયાત",
        "description_english": "Excitement, novelty and challenge in life",
        "traits": ["સાહસિક", "ઉત્તેજના પ્રેમી", "જોખમ લેનાર", "નવીનતા પ્રેમી"],
        "careers": ["એડવેન્ચર ગાઇડ", "સ્પોર્ટ્સ", "ટ્રાવેલ બ્લોગર", "એક્સ્ટ્રીમ સ્પોર્ટ્સ"],
        "strengths": ["સાહસ", "અનુકૂલનક્ષમતા", "ઉર્જા", "નવા અનુભવો"],
        "recommendations": ["નવા સ્થળોએ જાઓ", "નવી પ્રવૃત્તિઓ અજમાવો", "પડકારો સ્વીકારો"]
    },
    {
        "test_id": "svs",
        "result_type": "personal_value",
        "result_code": "hedonism",
        "result_name_gujarati": "સુખવાદ",
        "result_name_english": "Hedonism",
        "description_gujarati": "આનંદ અને જીવનનો આનંદ માણવાની ઇચ્છા",
        "description_english": "Pleasure and sensuous gratification for oneself",
        "traits": ["આનંદ પ્રેમી", "જીવન આનંદી", "સુખ લક્ષી", "મજા પ્રેમી"],
        "careers": ["એન્ટરટેઇનર", "રેસ્ટોરન્ટ ઓનર", "ઇવેન્ટ પ્લાનર", "લાઇફસ્ટાઇલ બ્લોગર"],
        "strengths": ["જીવનનો આનંદ", "સકારાત્મકતા", "સામાજિકતા", "ઉત્સાહ"],
        "recommendations": ["જીવનનો આનંદ માણો", "હોબી વિકસાવો", "મિત્રો સાથે સમય વિતાવો"]
    },
    {
        "test_id": "svs",
        "result_type": "personal_value",
        "result_code": "tradition",
        "result_name_gujarati": "પરંપરા",
        "result_name_english": "Tradition",
        "description_gujarati": "પરંપરાગત સંસ્કૃતિ અને ધર્મના રિવાજોનું સન્માન",
        "description_english": "Respect and commitment to traditional cultural or religious customs",
        "traits": ["પરંપરાવાદી", "સંસ્કૃતિ પ્રેમી", "આદરશીલ", "ધાર્મિક"],
        "careers": ["પુરોહિત", "સાંસ્કૃતિક કાર્યકર", "ઇતિહાસકાર", "પરંપરાગત કલાકાર"],
        "strengths": ["સાંસ્કૃતિક જ્ઞાન", "આદર", "સ્થિરતા", "મૂલ્યો"],
        "recommendations": ["પરંપરાઓ જાળવો", "સંસ્કૃતિ શીખો", "વડીલોનું સન્માન કરો"]
    },
    {
        "test_id": "svs",
        "result_type": "personal_value",
        "result_code": "conformity",
        "result_name_gujarati": "અનુરૂપતા",
        "result_name_english": "Conformity",
        "description_gujarati": "સામાજિક અપેક્ષાઓ અને નિયમોનું પાલન",
        "description_english": "Restraint of actions that might upset others or violate social expectations",
        "traits": ["નિયમ પાલક", "શિસ્તબદ્ધ", "સામાજિક", "સહયોગી"],
        "careers": ["સરકારી કર્મચારી", "બેંક મેનેજર", "એડમિનિસ્ટ્રેટર", "કોમ્પ્લાયન્સ ઓફિસર"],
        "strengths": ["શિસ્ત", "નિયમ પાલન", "સામાજિક સમરસતા", "વિશ્વસનીયતા"],
        "recommendations": ["નિયમોનું પાલન કરો", "સામાજિક જવાબદારી લો", "ટીમવર્ક કરો"]
    }
]

# Decision Making Style Configurations
DECISION_CONFIGURATIONS = [
    {
        "test_id": "decision",
        "result_type": "decision_style",
        "result_code": "rational",
        "result_name_gujarati": "તાર્કિક",
        "result_name_english": "Rational",
        "description_gujarati": "તર્ક અને વિશ્લેષણ પર આધારિત નિર્ણયો લેવાની શૈલી",
        "description_english": "Decision-making based on logic and analysis",
        "traits": ["વિશ્લેષણાત્મક", "તાર્કિક", "વ્યવસ્થિત", "ડેટા-આધારિત"],
        "careers": ["વિશ્લેષક", "સંશોધક", "સલાહકાર", "ફાઇનાન્સિયલ એડવાઇઝર"],
        "strengths": ["તાર્કિક વિચારસરણી", "ડેટા વિશ્લેષણ", "વ્યવસ્થિત અભિગમ"],
        "recommendations": ["ડેટા એકત્ર કરો", "વિકલ્પોનું વિશ્લેષણ કરો", "પ્રો-કોન લિસ્ટ બનાવો"]
    },
    {
        "test_id": "decision",
        "result_type": "decision_style",
        "result_code": "intuitive",
        "result_name_gujarati": "અંતર્જ્ઞાન",
        "result_name_english": "Intuitive",
        "description_gujarati": "અંતર્જ્ઞાન અને લાગણી પર આધારિત નિર્ણયો",
        "description_english": "Decision-making based on intuition and feelings",
        "traits": ["અંતર્જ્ઞાનશીલ", "લાગણીશીલ", "ઝડપી", "સહજ"],
        "careers": ["કલાકાર", "કાઉન્સેલર", "લેખક", "ડિઝાઇનર"],
        "strengths": ["ઝડપી નિર્ણય", "સર્જનાત્મકતા", "લાગણીશીલ બુદ્ધિ"],
        "recommendations": ["પોતાના અંતર્જ્ઞાન પર વિશ્વાસ રાખો", "લાગણીઓને ધ્યાનમાં લો", "પ્રથમ પ્રતિક્રિયા પર વિચાર કરો"]
    },
    {
        "test_id": "decision",
        "result_type": "decision_style",
        "result_code": "dependent",
        "result_name_gujarati": "આશ્રિત",
        "result_name_english": "Dependent",
        "description_gujarati": "અન્યની સલાહ અને માર્ગદર્શન પર આધારિત નિર્ણયો",
        "description_english": "Decision-making based on advice and guidance from others",
        "traits": ["સહાયતા માંગનાર", "સલાહ લેનાર", "સહયોગી", "સામાજિક"],
        "careers": ["ટીમ મેમ્બર", "સહાયક", "કસ્ટમર સર્વિસ", "સપોર્ટ સ્ટાફ"],
        "strengths": ["ટીમવર્ક", "સહયોગ", "સામાજિક કુશળતા"],
        "recommendations": ["વિશ્વસનીય સલાહકારો શોધો", "વિવિધ મંતવ્યો લો", "આત્મવિશ્વાસ વિકસાવો"]
    },
    {
        "test_id": "decision",
        "result_type": "decision_style",
        "result_code": "avoidant",
        "result_name_gujarati": "ટાળનાર",
        "result_name_english": "Avoidant",
        "description_gujarati": "નિર્ણયો લેવાથી બચવાની અથવા મુલતવી રાખવાની વૃત્તિ",
        "description_english": "Tendency to avoid or postpone making decisions",
        "traits": ["મુલતવી રાખનાર", "અનિશ્ચિત", "સાવચેત", "જોખમ ટાળનાર"],
        "careers": ["સંશોધક", "વિશ્લેષક", "લાઇબ્રેરિયન", "ટેકનિકલ સપોર્ટ"],
        "strengths": ["સાવચેતી", "જોખમ મૂલ્યાંકન", "વિગતવાર વિચારણા"],
        "recommendations": ["નાના નિર્ણયોથી શરૂઆત કરો", "સમય મર્યાદા સેટ કરો", "આત્મવિશ્વાસ વિકસાવો"]
    },
    {
        "test_id": "decision",
        "result_type": "decision_style",
        "result_code": "spontaneous",
        "result_name_gujarati": "સ્વયંસ્ફૂર્ત",
        "result_name_english": "Spontaneous",
        "description_gujarati": "ઝડપી અને તાત્કાલિક નિર્ણયો લેવાની શૈલી",
        "description_english": "Quick and immediate decision-making style",
        "traits": ["ઝડપી", "સ્વયંસ્ફૂર્ત", "લવચીક", "અનુકૂલનશીલ"],
        "careers": ["સેલ્સ", "ઇવેન્ટ મેનેજર", "એન્ટરપ્રેન્યોર", "એમર્જન્સી રિસ્પોન્ડર"],
        "strengths": ["ઝડપી પ્રતિક્રિયા", "અનુકૂલનક્ષમતા", "તકનો લાભ"],
        "recommendations": ["મહત્વપૂર્ણ નિર્ણયો માટે થોડો સમય લો", "પરિણામો વિશે વિચાર કરો", "આયોજન કુશળતા વિકસાવો"]
    }
]

# VARK Learning Style Configurations
VARK_CONFIGURATIONS = [
    {
        "test_id": "vark",
        "result_type": "learning_style",
        "result_code": "visual",
        "result_name_gujarati": "દૃષ્ટિ આધારિત",
        "result_name_english": "Visual",
        "description_gujarati": "ચાર્ટ, ગ્રાફ અને છબીઓ દ્વારા શીખવાની શૈલી",
        "description_english": "Learning through charts, graphs and images",
        "traits": ["દૃશ્ય શિક્ષાર્થી", "ચિત્ર પ્રેમી", "રંગ સંવેદનશીલ", "સ્થાનિક સમજ"],
        "careers": ["ગ્રાફિક ડિઝાઇનર", "આર્કિટેક્ટ", "ફોટોગ્રાફર", "કલાકાર"],
        "strengths": ["દૃશ્ય મેમરી", "સ્થાનિક સમજ", "પેટર્ન ઓળખ", "ડિઝાઇન સેન્સ"],
        "recommendations": ["માઇન્ડ મેપ્સ બનાવો", "રંગીન હાઇલાઇટર્સ વાપરો", "ચાર્ટ અને ગ્રાફ બનાવો", "વિઝ્યુઅલ એઇડ્સ વાપરો"]
    },
    {
        "test_id": "vark",
        "result_type": "learning_style",
        "result_code": "auditory",
        "result_name_gujarati": "શ્રવણ આધારિત",
        "result_name_english": "Auditory",
        "description_gujarati": "સાંભળીને અને ચર્ચા કરીને શીખવાની શૈલી",
        "description_english": "Learning through listening and discussion",
        "traits": ["શ્રવણ શિક્ષાર્થી", "સંવાદ પ્રેમી", "સંગીત પ્રેમી", "મૌખિક સમજ"],
        "careers": ["શિક્ષક", "કાઉન્સેલર", "રેડિયો જોકી", "સંગીતકાર"],
        "strengths": ["મૌખિક સંવાદ", "સાંભળવાની કુશળતા", "સંગીત સમજ", "ભાષા કુશળતા"],
        "recommendations": ["લેક્ચર સાંભળો", "ગ્રુપ ડિસ્કશન કરો", "ઓડિયો બુક્સ સાંભળો", "મોટેથી વાંચો"]
    },
    {
        "test_id": "vark",
        "result_type": "learning_style",
        "result_code": "reading",
        "result_name_gujarati": "વાંચન આધારિત",
        "result_name_english": "Reading/Writing",
        "description_gujarati": "વાંચન અને લેખન દ્વારા શીખવાની શૈલી",
        "description_english": "Learning through reading and writing",
        "traits": ["વાંચન પ્રેમી", "લેખન કુશળ", "ટેક્સ્ટ પ્રેમી", "નોંધ લેનાર"],
        "careers": ["લેખક", "પત્રકાર", "સંપાદક", "સંશોધક"],
        "strengths": ["વાંચન ગતિ", "લેખન કુશળતા", "ટેક્સ્ટ સમજ", "નોંધ લેવાની કુશળતા"],
        "recommendations": ["વિગતવાર નોંધ લો", "સારાંશ લખો", "બુક્સ વાંચો", "લિસ્ટ બનાવો"]
    },
    {
        "test_id": "vark",
        "result_type": "learning_style",
        "result_code": "kinesthetic",
        "result_name_gujarati": "ક્રિયા આધારિત",
        "result_name_english": "Kinesthetic",
        "description_gujarati": "હાથે કરીને અને અનુભવ દ્વારા શીખવાની શૈલી",
        "description_english": "Learning through hands-on experience and movement",
        "traits": ["પ્રેક્ટિકલ શિક્ષાર્થી", "હાથે કામ કરનાર", "ચળવળ પ્રેમી", "અનુભવ આધારિત"],
        "careers": ["એન્જિનિયર", "ડૉક્ટર", "રસોઇયા", "એથ્લેટ"],
        "strengths": ["પ્રેક્ટિકલ કુશળતા", "હાથની કુશળતા", "શારીરિક સમન્વય", "અનુભવ આધારિત શિક્ષણ"],
        "recommendations": ["હાથે પ્રેક્ટિસ કરો", "મોડેલ બનાવો", "એક્સપેરિમેન્ટ કરો", "ફિલ્ડ ટ્રિપ લો"]
    }
]

# Big Five Configurations (missing definition)
BIGFIVE_CONFIGURATIONS = [
    {
        "test_id": "bigfive",
        "result_type": "personality_trait",
        "result_code": "openness",
        "result_name_gujarati": "નવીનતા",
        "result_name_english": "Openness",
        "description_gujarati": "નવા અનુભવો અને વિચારો માટે ખુલ્લાપણું",
        "description_english": "Openness to new experiences and ideas",
        "traits": ["કલ્પનાશીલ", "જિજ્ઞાસુ", "કલાત્મક", "સાહસિક"],
        "careers": ["કલાકાર", "લેખક", "સંશોધક", "ડિઝાઇનર"],
        "strengths": ["સર્જનાત્મકતા", "નવીનતા", "લવચીકતા"],
        "recommendations": ["નવા અનુભવો મેળવો", "કલાત્મક પ્રવૃત્તિઓ કરો", "વિવિધ સંસ્કૃતિઓ જાણો"]
    }
]

# Life Situation Assessment Configurations
LIFE_SITUATION_CONFIGURATIONS = [
    {
        "test_id": "life-situation",
        "result_type": "life_assessment",
        "result_code": "career_focused",
        "result_name_gujarati": "કારકિર્દી કેન્દ્રિત",
        "result_name_english": "Career Focused",
        "description_gujarati": "વ્યાવસાયિક વિકાસ અને કારકિર્દીની પ્રગતિ પર ધ્યાન",
        "description_english": "Focus on professional development and career advancement",
        "traits": ["મહત્વાકાંક્ષી", "લક્ષ્ય-લક્ષી", "વ્યાવસાયિક", "પ્રગતિશીલ"],
        "careers": ["મેનેજર", "કન્સલ્ટન્ટ", "ઉદ્યોગપતિ", "એક્ઝિક્યુટિવ"],
        "strengths": ["વ્યાવસાયિક કુશળતા", "નેતૃત્વ", "લક્ષ્ય સિદ્ધિ", "આયોજન"],
        "recommendations": ["કારકિર્દીની યોજના બનાવો", "નેટવર્કિંગ કરો", "કુશળતા વિકસાવો", "મેન્ટર શોધો"]
    },
    {
        "test_id": "life-situation",
        "result_type": "life_assessment",
        "result_code": "relationship_focused",
        "result_name_gujarati": "સંબંધ કેન્દ્રિત",
        "result_name_english": "Relationship Focused",
        "description_gujarati": "પારિવારિક અને વ્યક્તિગત સંબંધો પર ધ્યાન",
        "description_english": "Focus on family and personal relationships",
        "traits": ["સંબંધ પ્રેમી", "પરિવાર કેન્દ્રિત", "સહાનુભૂતિશીલ", "સામાજિક"],
        "careers": ["કાઉન્સેલર", "શિક્ષક", "સોશિયલ વર્કર", "થેરાપિસ્ટ"],
        "strengths": ["સંબંધ નિર્માણ", "સહાનુભૂતિ", "સંવાદ", "સહયોગ"],
        "recommendations": ["પરિવાર સાથે સમય વિતાવો", "મિત્રતા જાળવો", "સામાજિક પ્રવૃત્તિઓ કરો", "સંવાદ કુશળતા વિકસાવો"]
    },
    {
        "test_id": "life-situation",
        "result_type": "life_assessment",
        "result_code": "health_focused",
        "result_name_gujarati": "આરોગ્ય કેન્દ્રિત",
        "result_name_english": "Health Focused",
        "description_gujarati": "શારીરિક અને માનસિક આરોગ્ય પર ધ્યાન",
        "description_english": "Focus on physical and mental health",
        "traits": ["આરોગ્ય સભાન", "સક્રિય", "સંતુલિત", "સ્વ-સંભાળ"],
        "careers": ["ફિટનેસ ટ્રેનર", "ડૉક્ટર", "ન્યુટ્રિશનિસ્ટ", "યોગા ઇન્સ્ટ્રક્ટર"],
        "strengths": ["સ્વ-સંભાળ", "શિસ્ત", "સંતુલન", "જીવનશૈલી મેનેજમેન્ટ"],
        "recommendations": ["નિયમિત વ્યાયામ કરો", "સંતુલિત આહાર લો", "તણાવ મેનેજમેન્ટ શીખો", "પૂરતી ઊંઘ લો"]
    },
    {
        "test_id": "life-situation",
        "result_type": "life_assessment",
        "result_code": "financial_focused",
        "result_name_gujarati": "આર્થિક કેન્દ્રિત",
        "result_name_english": "Financial Focused",
        "description_gujarati": "આર્થિક સ્થિરતા અને સંપત્તિ નિર્માણ પર ધ્યાન",
        "description_english": "Focus on financial stability and wealth building",
        "traits": ["આર્થિક સભાન", "બચત કરનાર", "રોકાણકાર", "આયોજક"],
        "careers": ["ફાઇનાન્સિયલ એડવાઇઝર", "એકાઉન્ટન્ટ", "બેંકર", "રોકાણ સલાહકાર"],
        "strengths": ["આર્થિક આયોજન", "બજેટિંગ", "રોકાણ", "જોખમ મેનેજમેન્ટ"],
        "recommendations": ["બજેટ બનાવો", "ઇમર્જન્સી ફંડ બનાવો", "રોકાણ શીખો", "આર્થિક લક્ષ્યો સેટ કરો"]
    },
    {
        "test_id": "life-situation",
        "result_type": "life_assessment",
        "result_code": "personal_growth_focused",
        "result_name_gujarati": "વ્યક્તિગત વિકાસ કેન્દ્રિત",
        "result_name_english": "Personal Growth Focused",
        "description_gujarati": "આત્મ-સુધારણા અને વ્યક્તિગત વિકાસ પર ધ્યાન",
        "description_english": "Focus on self-improvement and personal development",
        "traits": ["સ્વ-સુધારણા", "શીખવાની ઇચ્છા", "આત્મ-જાગૃત", "વિકાસશીલ"],
        "careers": ["કોચ", "ટ્રેનર", "લેખક", "સ્પીકર"],
        "strengths": ["સ્વ-જાગૃતિ", "શીખવાની ક્ષમતા", "અનુકૂલનક્ષમતા", "પ્રેરણા"],
        "recommendations": ["નવી કુશળતા શીખો", "પુસ્તકો વાંચો", "કોર્સ કરો", "મેડિટેશન કરો"]
    },
    {
        "test_id": "life-situation",
        "result_type": "life_assessment",
        "result_code": "creative_focused",
        "result_name_gujarati": "સર્જનાત્મક કેન્દ્રિત",
        "result_name_english": "Creative Focused",
        "description_gujarati": "કલાત્મક અને સર્જનાત્મક પ્રવૃત્તિઓ પર ધ્યાન",
        "description_english": "Focus on artistic and creative pursuits",
        "traits": ["સર્જનાત્મક", "કલાત્મક", "કલ્પનાશીલ", "અભિવ્યક્તિશીલ"],
        "careers": ["કલાકાર", "ડિઝાઇનર", "લેખક", "સંગીતકાર"],
        "strengths": ["સર્જનાત્મકતા", "કલાત્મક દ્રષ્ટિ", "અભિવ્યક્તિ", "નવીનતા"],
        "recommendations": ["કલાત્મક હોબી અપનાવો", "સર્જનાત્મક પ્રોજેક્ટ કરો", "કલા શીખો", "પ્રેરણા મેળવો"]
    }
]

# Combined configurations for easy import - All working configurations
ALL_CONFIGURATIONS = MBTI_CONFIGS + INTELLIGENCE_CONFIGURATIONS + BIGFIVE_CONFIGURATIONS + RIASEC_CONFIGURATIONS + DECISION_CONFIGURATIONS + VARK_CONFIGURATIONS + LIFE_SITUATION_CONFIGURATIONS
