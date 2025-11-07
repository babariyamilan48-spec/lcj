// Configuration for all tests - converted from original system
export const availableTests = [
  {
    id: "mbti",
    name: "MBTI કારકિર્દી પરીક્ષણ",
    english: "MBTI Career Test",
    description: "Personality type assessment for career guidance",
    icon: "Brain",
    color: "#3498db",
    questions: 80,
    duration: "45-60 મિનિટ",
    sections: [
      { id: 'ei', name: 'E vs I - બહિર્મુખી vs આંતર્મુખી', gujarati: 'Extrovert vs Introvert' },
      { id: 'sn', name: 'S vs N - અનુભવ vs કલ્પના', gujarati: 'Sensing vs Intuition' },
      { id: 'tf', name: 'T vs F - વિચાર vs લાગણી', gujarati: 'Thinking vs Feeling' },
      { id: 'jp', name: 'J vs P - આયોજન vs ઓપન', gujarati: 'Judging vs Perceiving' }
    ]
  },
  {
    id: "intelligence",
    name: "બહુવિધ બુદ્ધિ પરીક્ષણ",
    english: "Multiple Intelligences Test",
    description: "Assessment of different types of intelligence",
    icon: "Brain",
    color: "#f39c12",
    questions: 72,
    duration: "45-60 મિનિટ",
    sections: [
      { id: 'musical', name: 'સંગીત બુદ્ધિ', gujarati: 'Musical Intelligence' },
      { id: 'logical', name: 'તાર્કિક-ગાણિતિક બુદ્ધિ', gujarati: 'Logical-Mathematical Intelligence' },
      { id: 'intrapersonal', name: 'આંતરવ્યક્તિગત બુદ્ધિ', gujarati: 'Intrapersonal Intelligence' },
      { id: 'bodily', name: 'શારીરિક-કાયિક બુદ્ધિ', gujarati: 'Bodily-Kinesthetic Intelligence' },
      { id: 'naturalistic', name: 'પ્રાકૃતિક બુદ્ધિ', gujarati: 'Naturalistic Intelligence' },
      { id: 'visual', name: 'દૃષ્ટિ-અવકાશી બુદ્ધિ', gujarati: 'Visual-Spatial Intelligence' },
      { id: 'linguistic', name: 'ભાષાકીય બુદ્ધિ', gujarati: 'Linguistic Intelligence' },
      { id: 'interpersonal', name: 'આંતરવ્યક્તિગત બુદ્ધિ', gujarati: 'Interpersonal Intelligence' },
      { id: 'existential', name: 'અસ્તિત્વવાદી બુદ્ધિ', gujarati: 'Existential Intelligence' }
    ]
  },
  {
    id: "bigfive",
    name: "Big Five વ્યક્તિત્વ પરીક્ષણ",
    english: "Big Five Personality Test",
    description: "Assessment of five core personality dimensions",
    icon: "BarChart3",
    color: "#e74c3c",
    questions: 40,
    duration: "25-35 મિનિટ",
    sections: [
      { id: 'openness', name: 'ખૂલ્લુંપન', gujarati: 'Openness' },
      { id: 'conscientiousness', name: 'જવાબદારી', gujarati: 'Conscientiousness' },
      { id: 'extraversion', name: 'બહિર્મુખતા', gujarati: 'Extraversion' },
      { id: 'agreeableness', name: 'સહમતિ', gujarati: 'Agreeableness' },
      { id: 'neuroticism', name: 'ચિંતા', gujarati: 'Neuroticism' }
    ]
  },
  {
    id: "riasec",
    name: "RIASEC કારકિર્દી પરીક્ષણ",
    english: "RIASEC Career Test",
    description: "Assessment of career interests and work preferences",
    icon: "Compass",
    color: "#f39c12",
    questions: 60,
    duration: "30-40 મિનિટ",
    sections: [
      { id: 'realistic', name: 'વાસ્તવિક', gujarati: 'Realistic' },
      { id: 'investigative', name: 'સંશોધનાત્મક', gujarati: 'Investigative' },
      { id: 'artistic', name: 'કલાત્મક', gujarati: 'Artistic' },
      { id: 'social', name: 'સામાજિક', gujarati: 'Social' },
      { id: 'enterprising', name: 'ઉદ્યોગી', gujarati: 'Enterprising' },
      { id: 'conventional', name: 'પરંપરાગત', gujarati: 'Conventional' }
    ]
  },
  {
    id: "svs",
    name: "SVS મૂલ્ય પરીક્ષણ",
    english: "SVS Value Survey",
    description: "Assessment of personal values and life priorities",
    icon: "Heart",
    color: "#e91e63",
    questions: 50,
    duration: "25-35 મિનિટ",
    sections: [
      { id: 'self-direction', name: 'સ્વ-નિર્દેશન', gujarati: 'Self-Direction' },
      { id: 'achievement', name: 'સિદ્ધિ', gujarati: 'Achievement' },
      { id: 'hedonism', name: 'ભોગવાદ', gujarati: 'Hedonism' },
      { id: 'stimulation', name: 'ઉત્તેજના', gujarati: 'Stimulation' },
      { id: 'benevolence', name: 'પરોપકાર', gujarati: 'Benevolence' },
      { id: 'conformity', name: 'અનુરૂપતા', gujarati: 'Conformity' },
      { id: 'tradition', name: 'પરંપરા', gujarati: 'Tradition' },
      { id: 'security', name: 'સુરક્ષા', gujarati: 'Security' },
      { id: 'power', name: 'શક્તિ', gujarati: 'Power' },
      { id: 'universalism', name: 'સાર્વત્રિકતા', gujarati: 'Universalism' }
    ]
  },
  {
    id: "decision",
    name: "નિર્ણય શૈલી પરીક્ષણ",
    english: "Decision-Making Style Test",
    description: "Assessment of decision-making preferences and approach",
    icon: "Brain",
    color: "#673ab7",
    questions: 25,
    duration: "20-30 મિનિટ",
    sections: [
      { id: 'rational', name: 'તાર્કિક', gujarati: 'Rational' },
      { id: 'intuitive', name: 'અંતર્જ્ઞાન', gujarati: 'Intuitive' },
      { id: 'dependent', name: 'આધારિત', gujarati: 'Dependent' },
      { id: 'avoidant', name: 'ટાળવાવાળું', gujarati: 'Avoidant' },
      { id: 'spontaneous', name: 'તાત્કાલિક', gujarati: 'Spontaneous' }
    ]
  },
  {
    id: "vark",
    name: "VARK શીખવાની શૈલી પરીક્ષણ",
    english: "VARK Learning Style Test",
    description: "Assessment of preferred learning methods and styles",
    icon: "GraduationCap",
    color: "#795548",
    questions: 20,
    duration: "15-25 મિનિટ",
    sections: [
      { id: 'visual', name: 'દૃષ્ટિ', gujarati: 'Visual' },
      { id: 'auditory', name: 'શ્રવણ', gujarati: 'Auditory' },
      { id: 'reading', name: 'વાંચન', gujarati: 'Reading' },
      { id: 'kinesthetic', name: 'કાયિક', gujarati: 'Kinesthetic' }
    ]
  },
  {
    id: "life-situation",
    name: "જીવન પરિવર્તન સફર",
    english: "Life Transformation Journey",
    description: "Assessment of current life situation across social, economic, and geographical dimensions",
    icon: "Map",
    color: "#607d8b",
    questions: 15,
    duration: "15-20 મિનિટ",
    sections: [
      { id: 'social', name: 'સામાજિક પરિસ્થિતિ', gujarati: 'Social Situation' },
      { id: 'economic', name: 'આર્થિક પરિસ્થિતિ', gujarati: 'Economic Situation' },
      { id: 'geographical', name: 'ભૌગોલિક પરિસ્થિતિ', gujarati: 'Geographical Situation' }
    ]
  }
];

// Test dimensions and their descriptions
export const testDimensions = {
  mbti: {
    E: {
      name: "બહિર્મુખી",
      english: "Extrovert",
      gujarati: "બહિર્મુખી",
      description: "લોકોમાં ઉર્જા મેળવે.. (Gets energy from people..)"
    },
    I: {
      name: "આંતર્મુખી",
      english: "Introvert",
      gujarati: "આંતર્મુખી",
      description: "એકલામાં ઉર્જા મેળવે.. (Gets energy when alone..)"
    },
    S: {
      name: "અનુભવ",
      english: "Sensing",
      gujarati: "અનુભવ",
      description: "હકીકત, વર્તમાન, અનુભવ પર આધારિત.. (Based on facts, present, experience..)"
    },
    N: {
      name: "કલ્પના",
      english: "Intuition",
      gujarati: "કલ્પના",
      description: "ભવિષ્ય, સંકેતો, શક્યતાઓ પર આધારિત.. (Based on future, signs, possibilities..)"
    },
    T: {
      name: "વિચાર",
      english: "Thinking",
      gujarati: "વિચાર",
      description: "તર્ક અને યોગ્યતા પરથી નિર્ણય લે.. (Makes decisions based on logic and correctness..)"
    },
    F: {
      name: "લાગણી",
      english: "Feeling",
      gujarati: "લાગણી",
      description: "લાગણી અને સંબંધો પરથી નિર્ણય લે.. (Makes decisions based on feelings and relationships..)"
    },
    J: {
      name: "આયોજન",
      english: "Judging",
      gujarati: "આયોજન",
      description: "વ્યવસ્થા, યોજના અને નિયમ પસંદ કરે.. (Prefers order, plan, and rules..)"
    },
    P: {
      name: "ઓપન",
      english: "Perceiving",
      gujarati: "ઓપન",
      description: "સ્વતંત્રતા, અવકાશ અને બદલાવ પસંદ કરે.. (Prefers freedom, space, and change..)"
    }
  },
  intelligence: {
    musical: {
      name: 'સંગીત બુદ્ધિ',
      english: 'Musical Intelligence',
      gujarati: 'સંગીત બુદ્ધિ',
      description: 'સંગીત, ધ્વનિ અને તાલ સમજવાની ક્ષમતા',
      careers: ['સંગીતકાર', 'ગાયક', 'સંગીત શિક્ષક', 'સાઉન્ડ એન્જિનિયર']
    },
    logical: {
      name: 'તાર્કિક-ગાણિતિક બુદ્ધિ',
      english: 'Logical-Mathematical Intelligence',
      gujarati: 'તાર્કિક-ગાણિતિક બુદ્ધિ',
      description: 'તર્ક, સંખ્યાઓ અને વૈજ્ઞાનિક વિચારની ક્ષમતા',
      careers: ['વૈજ્ઞાનિક', 'ગણિતશાસ્ત્રી', 'ઇન્જિનિયર', 'ડેટા એનાલિસ્ટ']
    },
    intrapersonal: {
      name: 'આંતરવ્યક્તિગત બુદ્ધિ',
      english: 'Intrapersonal Intelligence',
      gujarati: 'આંતરવ્યક્તિગત બુદ્ધિ',
      description: 'પોતાની લાગણીઓ અને વિચારો સમજવાની ક્ષમતા',
      careers: ['મનોવૈજ્ઞાનિક', 'સલાહકાર', 'લેખક', 'ધ્યાન શિક્ષક']
    },
    bodily: {
      name: 'શારીરિક-કાયિક બુદ્ધિ',
      english: 'Bodily-Kinesthetic Intelligence',
      gujarati: 'શારીરિક-કાયિક બુદ્ધિ',
      description: 'શરીરની હલનચલન અને કુશળતા',
      careers: ['ડાન્સર', 'એથ્લીટ', 'સર્જન', 'ફિઝિયોથેરાપિસ્ટ']
    },
    naturalistic: {
      name: 'પ્રાકૃતિક બુદ્ધિ',
      english: 'Naturalistic Intelligence',
      gujarati: 'પ્રાકૃતિક બુદ્ધિ',
      description: 'પ્રકૃતિ અને પર્યાવરણ સમજવાની ક્ષમતા',
      careers: ['બાયોલોજિસ્ટ', 'પર્યાવરણવિદ', 'ખેડૂત', 'વેટરિનરી']
    },
    visual: {
      name: 'દૃષ્ટિ-અવકાશી બુદ્ધિ',
      english: 'Visual-Spatial Intelligence',
      gujarati: 'દૃષ્ટિ-અવકાશી બુદ્ધિ',
      description: 'ચિત્રો, અવકાશ અને ડિઝાઇન સમજવાની ક્ષમતા',
      careers: ['આર્કિટેક્ટ', 'ડિઝાઇનર', 'ફિઝોટોગ્રાફર', 'કલાકાર']
    },
    linguistic: {
      name: 'ભાષાકીય બુદ્ધિ',
      english: 'Linguistic Intelligence',
      gujarati: 'ભાષાકીય બુદ્ધિ',
      description: 'ભાષા, શબ્દો અને સંવાદની ક્ષમતા',
      careers: ['લેખક', 'પત્રકાર', 'વકીલ', 'ભાષા શિક્ષક']
    },
    interpersonal: {
      name: 'આંતરવ્યક્તિગત બુદ્ધિ',
      english: 'Interpersonal Intelligence',
      gujarati: 'આંતરવ્યક્તિગત બુદ્ધિ',
      description: 'અન્ય લોકો સાથે સંબંધ અને સંવાદની ક્ષમતા',
      careers: ['વેપારી', 'નર્સ', 'સામાજિક કાર્યકર', 'માનવ સંસાધન']
    },
    existential: {
      name: 'અસ્તિત્વવાદી બુદ્ધિ',
      english: 'Existential Intelligence',
      gujarati: 'અસ્તિત્વવાદી બુદ્ધિ',
      description: 'જીવનના ઊંડા અર્થ અને અસ્તિત્વ વિશે વિચારવાની ક્ષમતા',
      careers: ['ફિલોસોફર', 'ધાર્મિક નેતા', 'મનોવૈજ્ઞાનિક', 'લેખક']
    }
  }
};

// MBTI dimension combinations with full descriptions
export const mbtiDimensionDescriptions = {
  E: {
    name: "બહિર્મુખી",
    english: "Extrovert", 
    description: "લોકોમાં ઉર્જા મેળવે છે"
  },
  I: {
    name: "આંતર્મુખી",
    english: "Introvert",
    description: "એકલામાં ઉર્જા મેળવે છે"
  },
  S: {
    name: "અનુભવ",
    english: "Sensing",
    description: "હકીકત, વર્તમાન, અનુભવ પર આધારિત"
  },
  N: {
    name: "કલ્પના",
    english: "Intuition",
    description: "ભવિષ્ય, સંકેતો, શક્યતાઓ પર આધારિત"
  },
  T: {
    name: "વિચાર",
    english: "Thinking",
    description: "તર્ક અને યોગ્યતા પરથી નિર્ણય લે છે"
  },
  F: {
    name: "લાગણી",
    english: "Feeling",
    description: "લાગણી અને સંબંધો પરથી નિર્ણય લે છે"
  },
  J: {
    name: "આયોજન",
    english: "Judging",
    description: "વ્યવસ્થા, યોજના અને નિયમ પસંદ કરે છે"
  },
  P: {
    name: "ઓપન",
    english: "Perceiving",
    description: "સ્વતંત્રતા, અવકાશ અને બદલાવ પસંદ કરે છે"
  }
};

// MBTI personality types with detailed information
export const mbtiTypes = {
  ISTJ: {
    name: "જવાબદાર અને નિયમપ્રિય",
    english: "Responsible and Rule-Loving",
    qualities: "વ્યવહારીક, જવાબદાર, વિશ્વાસપાત્ર",
    strengths: "આયોજનમાં અસરકારક, નિયમપાલન, કામ માટે સમર્પિત",
    challenges: "ભાવનાઓ વ્યક્ત કરવામાં મુશ્કેલી, બદલાવ સ્વીકારવામાં અસમર્થ",
    careers: ["Accounting", "Administration", "Law", "Management"]
  },
  ISFJ: {
    name: "સંભાળ રાખનાર અને સહાનુભૂતિશીલ",
    english: "Caring and Empathetic",
    qualities: "આરામદાયક, સેવા-ઉન્મુખ, વિશ્વાસપાત્ર",
    strengths: "શાંતિથી સંભાળ રાખવી, જવાબદારીપૂર્વક કામ કરવું",
    challenges: "પોતાની જરૂરિયાતો ભૂલી જવી, બદલાયેલી પરિસ્થિતિઓમાં અસમર્થ",
    careers: ["Teacher", "Counselor", "Nursing", "Service sectors"]
  },
  INFJ: {
    name: "માર્ગદર્શક અને કલ્પનાશીલ",
    english: "Guide and Imaginative",
    qualities: "આંતરિક દ્રષ્ટિ ધરાવતા, હેતુપૂર્ણ",
    strengths: "ઊંડા સંબંધો બનાવવા, ભવિષ્ય માટે દ્રષ્ટિ",
    challenges: "વધુ સિદ્ધાંતવાદી, પોતા પર વધુ દબાણ",
    careers: ["Writer", "Counselor", "Leader", "Human Services"]
  },
  INTJ: {
    name: "વ્યૂહરચનાકાર અને દ્રષ્ટિવાળો",
    english: "Strategist and Visionary",
    qualities: "બુદ્ધિશાળી, આત્મવિશ્વાસી, મજબૂત",
    strengths: "વ્યૂહરચના બનાવવામાં માસ્ટર, સ્વતંત્ર વિચારક",
    challenges: "વધુ ટીકાત્મક, ભાવનાઓ સમજવામાં ઓછો",
    careers: ["Scientist", "Strategy Manager", "Technology", "Entrepreneur"]
  },
  ISTP: {
    name: "ટેકનિકલ નિપુણ અને અસરકારક",
    english: "Technically Skilled and Effective",
    qualities: "શાંત, વ્યવહારીક, કાર્યક્ષમ",
    strengths: "ઝડપથી સમસ્યા ઉકેલવી, હાથથી કામ કરવામાં નિપુણ",
    challenges: "ભાવનાઓ વ્યક્ત ન કરવી, લાંબા ગાળાના આયોજનમાં ઓછો રસ",
    careers: ["Engineer", "Mechanic", "Sports", "Emergency Services"]
  },
  ISFP: {
    name: "શાંત પ્રેમી અને કલાપ્રેમી",
    english: "Quiet, Loving, and Art-Loving",
    qualities: "વિનમ્ર, સહાનુભૂતિશીલ, સુંદરતા પ્રેમી",
    strengths: "દયાળુ, સર્જનાત્મક, આનંદથી જીવવું",
    challenges: "કઠોર ચર્ચાઓથી બચવું, કઠોર નિર્ણયો લેવામાં મુશ્કેલી",
    careers: ["Design", "Music", "Art", "Caring professions"]
  },
  INFP: {
    name: "મધ્યસ્થ અને સપનાવાળો",
    english: "Mediator and Dreamy",
    qualities: "આદર્શવાદી, કરુણાશીલ, આંતર્મુખી",
    strengths: "ઊંડો અર્થ શોધવો, સર્જનાત્મક, લોકોની મદદ કરવા તૈયાર",
    challenges: "વ્યવહારીક બાબતોમાં ઓછો રસ, ઝડપથી અસ્વસ્થ થવું",
    careers: ["Writer", "Counselor", "Fact-finder", "Social Services"]
  },
  INTP: {
    name: "શોધખોળ કરનાર અને વિચારક",
    english: "Explorer and Thinker",
    qualities: "શોધક, વિચારોમાં ડૂબેલા, તાર્કિક",
    strengths: "તાર્કિક વિચારધારા, નવી સિસ્ટમો શોધવામાં નિપુણ",
    challenges: "ભાવનાઓ પર ઓછું ધ્યાન, ઓછા વ્યવસ્થિત",
    careers: ["Scientist", "Developer", "Researcher", "Professor"]
  },
  ESTP: {
    name: "એક્શન મેન અને જોખમ લેનાર",
    english: "Action Man and Risk Taker",
    qualities: "ઊર્જાવાન, ઝડપથી કાર્યવાહી, લક્ષ્ય-ઉન્મુખ",
    strengths: "લોકો સાથે સરળતાથી જોડાવું, ઝડપથી નિર્ણયો લેવા",
    challenges: "લાંબા ગાળાના આયોજનમાં ઓછો રસ, વ્યવસ્થિત અભિગમનો અભાવ",
    careers: ["Marketing", "Adventure Sports", "Sales", "Industry"]
  },
  ESFP: {
    name: "મોજશોખી અને પ્રસ્તુત કરનાર",
    english: "Fun-loving and Presenter",
    qualities: "આનંદમય, લોકપ્રિય, વર્તમાનમાં જીવે છે",
    strengths: "સમાજમાં આનંદ ફેલાવવો, લોકો સાથે સરળતાથી જોડાવું",
    challenges: "ભયથી બચવું, વધુ મોજ શોધવાની વૃત્તિ",
    careers: ["Art", "Music", "Event Management", "Hotel Management"]
  },
  ENFP: {
    name: "ઉત્સાહી અને પ્રેરક",
    english: "Enthusiastic and Inspirer",
    qualities: "સ્વતંત્ર, ઉત્સાહી, પ્રેરણાદાયી વ્યક્તિ",
    strengths: "લોકોને પ્રેરણા આપવી, સર્જનાત્મક વિચારો લાવવા",
    challenges: "વધુ વિચારવું, ઝડપથી કંટાળવું",
    careers: ["Writer", "Communicator", "Coach", "Media"]
  },
  ENTP: {
    name: "ચર્ચાકાર અને નવીન વિચારક",
    english: "Debater and Innovative Thinker",
    qualities: "ગતિશીલ, ચર્ચાકાર, નવી દિશાઓના શોધક",
    strengths: "વિચાર કરવાની ક્ષમતા, ચર્ચામાં આનંદ, નવી દિશાઓ શોધવી",
    challenges: "પ્રોજેક્ટ્સ પૂરા કરવામાં મુશ્કેલી, ઓછા ટકાઉ",
    careers: ["Entrepreneur", "Marketing", "Startup", "Strategy Development"]
  },
  ESTJ: {
    name: "વ્યવસ્થાપક અને નેતા",
    english: "Manager and Leader",
    qualities: "સંસ્થાકીય કૌશલ્યો ધરાવતા, સિસ્ટમ્સમાં વિશ્વાસ",
    strengths: "વસ્તુઓને વ્યવસ્થિત રાખવી, નિયમોનું પાલન, મજબૂત નેતા",
    challenges: "વધુ કઠોર હોઈ શકે છે, ઓછા ભાવનાત્મક",
    careers: ["Management", "Logistics", "Police", "Leadership"]
  },
  ESFJ: {
    name: "સંભાળ લેનાર અને સમર્પિત",
    english: "Caretaker and Dedicated",
    qualities: "મિત્રતાને મૂલ્ય આપે છે, હંમેશા મદદ કરવા તૈયાર",
    strengths: "લોકોની સુખાકારીની કાળજી, સમૂહોને મજબૂત બનાવવા",
    challenges: "અન્યોને વધુ પ્રસન્ન કરવાની વૃત્તિ, પોતાને ભૂલી જવું",
    careers: ["Teacher", "Nurse", "Healthcare", "Social Service"]
  },
  ENFJ: {
    name: "શિક્ષક અને પ્રેરક નેતા",
    english: "Teacher and Inspiring Leader",
    qualities: "સામાજિક નેતા, દ્રષ્ટિવાળું વ્યક્તિત્વ",
    strengths: "લોકોની ભાવનાઓ સમજવી, નેતૃત્વમાં શ્રેષ્ઠ",
    challenges: "બળથી સંપૂર્ણ બનવાનો પ્રયાસ",
    careers: ["Teacher", "Coach", "Mentor", "Organizer"]
  },
  ENTJ: {
    name: "કમાન્ડર અને CEO મટિરિયલ",
    english: "Commander and CEO Material",
    qualities: "આત્મવિશ્વાસી, પડકારપૂર્ણ નેતા, વ્યૂહરચનાકાર",
    strengths: "કાર્ય-ઉન્મુખ, પ્રભાવશાળી નેતૃત્વ, મોટા વિચારક",
    challenges: "ઓછા ભાવનાત્મક, ઓછા સહાનુભૂતિશીલ",
    careers: ["CEO", "Leadership", "Strategy", "Business Development"]
  }
};
