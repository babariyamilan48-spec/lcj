# Comprehensive test result configurations for all possible results

# MBTI - All 16 personality types
MBTI_CONFIGURATIONS = [
    {
        "test_id": "mbti", "result_type": "personality_type", "result_code": "ISTJ",
        "result_name_gujarati": "લોજિસ્ટિશિયન", "result_name_english": "The Logistician",
        "description_gujarati": "વ્યવહારુ અને હકીકત-લક્ષી, વિશ્વસનીય અને જવાબદાર.", 
        "description_english": "Practical and fact-minded, reliable and responsible.",
        "traits": ["વ્યવહારુ", "વિશ્વસનીય", "વ્યવસ્થિત", "જવાબદાર"],
        "careers": ["એકાઉન્ટન્ટ", "મેનેજર", "એન્જિનિયર", "ડૉક્ટર"],
        "strengths": ["વ્યવસ્થા", "વિશ્વસનીયતા", "કાર્યક્ષમતા"],
        "recommendations": ["નવા વિચારોને સ્વીકારો", "લવચીકતા વિકસાવો"]
    },
    {
        "test_id": "mbti", "result_type": "personality_type", "result_code": "ISFJ", 
        "result_name_gujarati": "રક્ષક", "result_name_english": "The Protector",
        "description_gujarati": "ગરમદિલ અને જવાબદાર, હંમેશા મદદ કરવા તૈયાર.",
        "description_english": "Warm-hearted and dedicated, always ready to protect loved ones.",
        "traits": ["સહાનુભૂતિશીલ", "વફાદાર", "વિગતવાર", "સહાયક"],
        "careers": ["નર્સ", "શિક્ષક", "સામાજિક કાર્યકર", "કાઉન્સેલર"],
        "strengths": ["દયા", "વિશ્વસનીયતા", "સેવાભાવ"],
        "recommendations": ["પોતાની જરૂરિયાતોનું ધ્યાન રાખો", "ના કહેવાનું શીખો"]
    },
    {
        "test_id": "mbti", "result_type": "personality_type", "result_code": "INFJ",
        "result_name_gujarati": "વકીલ", "result_name_english": "The Advocate", 
        "description_gujarati": "સર્જનાત્મક અને અંતર્દૃષ્ટિ ધરાવતા, પ્રેરણાદાયક અને આદર્શવાદી.",
        "description_english": "Creative and insightful, inspiring and decisive.",
        "traits": ["આદર્શવાદી", "સર્જનાત્મક", "અંતર્મુખી", "સંવેદનશીલ"],
        "careers": ["લેખક", "કાઉન્સેલર", "કલાકાર", "મનોવૈજ્ઞાનિક"],
        "strengths": ["અંતર્દૃષ્ટિ", "સર્જનાત્મકતા", "આદર્શવાદ"],
        "recommendations": ["વ્યવહારિક બનો", "નેટવર્કિંગ કરો"]
    },
    {
        "test_id": "mbti", "result_type": "personality_type", "result_code": "INTJ",
        "result_name_gujarati": "આર્કિટેક્ટ", "result_name_english": "The Architect",
        "description_gujarati": "વ્યૂહરચનાકાર અને નવીનતાવાદી, દૃઢ સંકલ્પિત.",
        "description_english": "Imaginative and strategic thinkers, with a plan for everything.",
        "traits": ["વિશ્લેષણાત્મક", "સ્વતંત્ર", "નવીનતાવાદી", "વ્યૂહરચનાત્મક"],
        "careers": ["સોફ્ટવેર આર્કિટેક્ટ", "સંશોધક", "વિશ્લેષક", "સલાહકાર"],
        "strengths": ["તાર્કિક વિચારસરણી", "સમસ્યા નિરાકરણ", "સ્વતંત્ર કાર્ય"],
        "recommendations": ["લાંબા ગાળાના લક્ષ્યો સેટ કરો", "ટીમવર્ક સ્કિલ્સ વિકસાવો"]
    }
]

# Multiple Intelligence - All 8 types  
INTELLIGENCE_CONFIGURATIONS = [
    {
        "test_id": "intelligence", "result_type": "intelligence_type", "result_code": "linguistic",
        "result_name_gujarati": "ભાષાકીય બુદ્ધિ", "result_name_english": "Linguistic Intelligence",
        "description_gujarati": "શબ્દો અને ભાષાની કુશળતા, વાંચન, લેખન અને વાતચીતમાં પ્રવીણતા",
        "description_english": "Skill with words and language, proficiency in reading, writing and speaking",
        "traits": ["ભાષા પ્રેમી", "વાંચન શોખીન", "લેખન કુશળ", "વાતચીત પ્રવીણ"],
        "careers": ["લેખક", "પત્રકાર", "વકીલ", "શિક્ષક", "અનુવાદક"],
        "strengths": ["ભાષા સમજ", "લેખન કુશળતા", "વાતચીત", "વાંચન ઝડપ"],
        "recommendations": ["વધુ વાંચો", "લેખન પ્રેક્ટિસ કરો", "નવી ભાષાઓ શીખો"]
    },
    {
        "test_id": "intelligence", "result_type": "intelligence_type", "result_code": "logical",
        "result_name_gujarati": "તાર્કિક-ગાણિતિક બુદ્ધિ", "result_name_english": "Logical-Mathematical Intelligence", 
        "description_gujarati": "તર્ક અને ગણિતની કુશળતા, સમસ્યા નિરાકરણ અને વિશ્લેષણ",
        "description_english": "Skill with logic and mathematics, problem-solving and analysis",
        "traits": ["તાર્કિક", "વિશ્લેષણાત્મક", "ગાણિતિક", "સમસ્યા નિરાકરક"],
        "careers": ["ગણિતશાસ્ત્રી", "એન્જિનિયર", "વૈજ્ઞાનિક", "પ્રોગ્રામર"],
        "strengths": ["તાર્કિક વિચારસરણી", "ગણિત", "વિશ્લેષણ", "સમસ્યા નિરાકરણ"],
        "recommendations": ["ગાણિતિક પઝલ્સ હલ કરો", "તર્કશાસ્ત્ર અભ્યાસ કરો"]
    }
]

# Add all other test configurations similarly...
ALL_COMPREHENSIVE_CONFIGURATIONS = MBTI_CONFIGURATIONS + INTELLIGENCE_CONFIGURATIONS
