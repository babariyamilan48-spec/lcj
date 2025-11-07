/**
 * Test Result Calculators
 * Updated to use backend database-integrated calculations
 */

import { tokenStore } from '@/services/token';
import api from '../services/api';

export interface TestResult {
  testId: string;
  score: number;
  answers: Record<string, any>;
  timestamp: string;
  calculatedResults?: any;
}

// Backend API service for database-integrated calculations
export const calculateTestResultFromBackend = async (
  testId: string, 
  answers: Record<string, any>, 
  userId: string, // Changed to string to support UUID
  sessionId?: string
): Promise<any> => {
  try {
    // Ensure answers is in the correct format (dictionary, not array)
    let processedAnswers = answers;
    
    // If answers is an array, convert it to a dictionary
    if (Array.isArray(answers)) {
      processedAnswers = {};
      answers.forEach((answer: any, index: number) => {
        if (answer && typeof answer === 'object') {
          // Use question_id as key if available, otherwise use index
          const key = answer.question_id ? String(answer.question_id) : String(index + 1);
          processedAnswers[key] = answer;
        }
      });
    }
    
    // Use the enhanced API client with automatic token refresh
    const response = await api.post('/api/v1/question_service/test-results/calculate-and-save', {
      user_id: userId,
      test_id: testId,
      answers: processedAnswers,
      session_id: sessionId,
      time_taken_seconds: 0
    });

    const result = response.data;
    return result.calculated_result;
  } catch (error) {
    // Fallback to frontend calculation
    return calculateTestResultFrontend(testId, answers);
  }
};

// MBTI Result Calculator
export const calculateMBTIResult = (answers: Record<string, any>) => {
  const counts: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  
  Object.values(answers).forEach((answerData: any) => {
    const dimension = answerData?.dimension;
    const weight = typeof answerData.weight === 'number' ? answerData.weight : 1;
    if (dimension && counts[dimension] !== undefined) {
      counts[dimension] += weight;
    }
  });

  const mbtiCode = [
    counts.E >= counts.I ? 'E' : 'I',
    counts.S >= counts.N ? 'S' : 'N',
    counts.T >= counts.F ? 'T' : 'F',
    counts.J >= counts.P ? 'J' : 'P',
  ].join('');

  const dimensions = [
    { 
      pair: 'E/I', 
      scores: { E: counts.E, I: counts.I },
      dominant: counts.E >= counts.I ? 'E' : 'I',
      percentage: Math.round((Math.max(counts.E, counts.I) / (counts.E + counts.I)) * 100)
    },
    { 
      pair: 'S/N', 
      scores: { S: counts.S, N: counts.N },
      dominant: counts.S >= counts.N ? 'S' : 'N',
      percentage: Math.round((Math.max(counts.S, counts.N) / (counts.S + counts.N)) * 100)
    },
    { 
      pair: 'T/F', 
      scores: { T: counts.T, F: counts.F },
      dominant: counts.T >= counts.F ? 'T' : 'F',
      percentage: Math.round((Math.max(counts.T, counts.F) / (counts.T + counts.F)) * 100)
    },
    { 
      pair: 'J/P', 
      scores: { J: counts.J, P: counts.P },
      dominant: counts.J >= counts.P ? 'J' : 'P',
      percentage: Math.round((Math.max(counts.J, counts.P) / (counts.J + counts.P)) * 100)
    }
  ];

  return {
    type: 'MBTI',
    code: mbtiCode,
    dimensions,
    description: getMBTIDescription(mbtiCode),
    traits: getMBTITraits(mbtiCode),
    careers: getMBTICareers(mbtiCode),
    strengths: getMBTIStrengths(mbtiCode)
  };
};

// Multiple Intelligence Result Calculator
export const calculateIntelligenceResult = (answers: Record<string, any>) => {
  const intelligenceScores: Record<string, number> = {
    linguistic: 0,
    logical: 0,
    musical: 0,
    bodily: 0,
    visual: 0,
    interpersonal: 0,
    intrapersonal: 0,
    naturalistic: 0,
    existential: 0
  };

  // Process answers based on actual structure
  Object.entries(answers).forEach(([questionId, answerData]: [string, any]) => {
    let intelligence = '';
    let score = 0;

    // Extract score and intelligence type
    if (typeof answerData === 'object' && answerData !== null) {
      // If answerData has selectedOption with score
      if (answerData.selectedOption && typeof answerData.selectedOption.score === 'number') {
        score = answerData.selectedOption.score;
      }
      // If answerData has score directly
      else if (typeof answerData.score === 'number') {
        score = answerData.score;
      }
      // If answerData has weight property
      else if (typeof answerData.weight === 'number') {
        score = answerData.weight;
      }

      // Determine intelligence type from answer data or question ID
      if (answerData.intelligence) {
        intelligence = answerData.intelligence;
      } else if (answerData.category) {
        intelligence = answerData.category;
      } else {
        // Infer intelligence type from question ID pattern
        if (questionId.includes('linguistic') || questionId.startsWith('l_')) {
          intelligence = 'linguistic';
        } else if (questionId.includes('logical') || questionId.startsWith('log_')) {
          intelligence = 'logical';
        } else if (questionId.includes('musical') || questionId.startsWith('m_')) {
          intelligence = 'musical';
        } else if (questionId.includes('bodily') || questionId.startsWith('b_')) {
          intelligence = 'bodily';
        } else if (questionId.includes('visual') || questionId.startsWith('v_')) {
          intelligence = 'visual';
        } else if (questionId.includes('interpersonal') || questionId.startsWith('inter_')) {
          intelligence = 'interpersonal';
        } else if (questionId.includes('intrapersonal') || questionId.startsWith('intra_')) {
          intelligence = 'intrapersonal';
        } else if (questionId.includes('naturalistic') || questionId.startsWith('n_')) {
          intelligence = 'naturalistic';
        } else if (questionId.includes('existential') || questionId.startsWith('e_')) {
          intelligence = 'existential';
        }
      }
    }
    // Handle simple numeric answers
    else if (typeof answerData === 'number') {
      score = answerData;
      // Infer intelligence type from question ID (implement similar pattern matching)
    }

    // Add score to the appropriate intelligence type
    if (intelligence && intelligenceScores[intelligence] !== undefined && score > 0) {
      intelligenceScores[intelligence] += score;
    }
  });

  const maxScore = Math.max(...Object.values(intelligenceScores)) || 1;
  const sortedIntelligences = Object.entries(intelligenceScores)
    .sort(([,a], [,b]) => b - a)
    .map(([type, score]) => {
      const intelligenceData = getIntelligenceData(type);
      return {
        type,
        score,
        percentage: Math.round((score / maxScore) * 100),
        description: getIntelligenceDescription(type),
        characteristics: intelligenceData.characteristics,
        careerSuggestions: intelligenceData.careerSuggestions,
        strengths: intelligenceData.strengths,
        level: score >= maxScore * 0.8 ? 'Very High' : 
               score >= maxScore * 0.6 ? 'High' : 
               score >= maxScore * 0.4 ? 'Medium' : 
               score >= maxScore * 0.2 ? 'Low' : 'Very Low'
      };
    });

  return {
    type: 'Multiple Intelligence',
    topIntelligences: sortedIntelligences.slice(0, 3),
    allIntelligences: sortedIntelligences,
    dominantType: sortedIntelligences[0]?.type,
    profile: getIntelligenceProfile(sortedIntelligences[0]?.type)
  };
};

// Big Five Result Calculator
export const calculateBigFiveResult = (answers: Record<string, any>) => {
  const dimensions: Record<string, number> = {
    openness: 0,
    conscientiousness: 0,
    extraversion: 0,
    agreeableness: 0,
    neuroticism: 0
  };

  // Process answers based on actual structure
  Object.entries(answers).forEach(([questionId, answerData]: [string, any]) => {
    // Extract dimension from question ID or answer data
    let dimension = '';
    let score = 0;

    // Check if answerData has the score directly
    if (typeof answerData === 'object' && answerData !== null) {
      // If answerData has selectedOption with score
      if (answerData.selectedOption && typeof answerData.selectedOption.score === 'number') {
        score = answerData.selectedOption.score;
      }
      // If answerData has score directly
      else if (typeof answerData.score === 'number') {
        score = answerData.score;
      }
      // If answerData has weight property
      else if (typeof answerData.weight === 'number') {
        score = answerData.weight;
      }

      // Determine dimension from question ID or answer data
      if (answerData.dimension) {
        dimension = answerData.dimension;
      } else if (answerData.category) {
        dimension = answerData.category;
      } else {
        // Infer dimension from question ID pattern
        if (questionId.includes('openness') || questionId.startsWith('o_')) {
          dimension = 'openness';
        } else if (questionId.includes('conscientiousness') || questionId.startsWith('c_')) {
          dimension = 'conscientiousness';
        } else if (questionId.includes('extraversion') || questionId.startsWith('e_')) {
          dimension = 'extraversion';
        } else if (questionId.includes('agreeableness') || questionId.startsWith('a_')) {
          dimension = 'agreeableness';
        } else if (questionId.includes('neuroticism') || questionId.startsWith('n_')) {
          dimension = 'neuroticism';
        }
      }
    }
    // Handle simple numeric answers
    else if (typeof answerData === 'number') {
      score = answerData;
      // Infer dimension from question ID
      if (questionId.includes('openness') || questionId.startsWith('o_')) {
        dimension = 'openness';
      } else if (questionId.includes('conscientiousness') || questionId.startsWith('c_')) {
        dimension = 'conscientiousness';
      } else if (questionId.includes('extraversion') || questionId.startsWith('e_')) {
        dimension = 'extraversion';
      } else if (questionId.includes('agreeableness') || questionId.startsWith('a_')) {
        dimension = 'agreeableness';
      } else if (questionId.includes('neuroticism') || questionId.startsWith('n_')) {
        dimension = 'neuroticism';
      }
    }

    // Add score to the appropriate dimension
    if (dimension && dimensions[dimension] !== undefined && score > 0) {
      dimensions[dimension] += score;
    }
  });

  // Calculate max possible score per dimension (assuming 10 questions per dimension with max score of 2)
  const maxScorePerDimension = 20;
  
  const results = Object.entries(dimensions).map(([trait, score]) => ({
    trait,
    score,
    level: getBigFiveLevel(score),
    percentage: Math.round((score / maxScorePerDimension) * 100),
    description: getBigFiveDescription(trait, score)
  }));

  return {
    type: 'Big Five Personality',
    dimensions: results,
    profile: getBigFiveProfile(results),
    summary: getBigFiveSummary(results)
  };
};

// RIASEC Result Calculator
export const calculateRIASECResult = (answers: Record<string, any>) => {
  const interests: Record<string, number> = {
    realistic: 0,
    investigative: 0,
    artistic: 0,
    social: 0,
    enterprising: 0,
    conventional: 0
  };

  Object.values(answers).forEach((answerData: any) => {
    const interest = answerData?.interest || answerData?.category;
    const weight = typeof answerData.weight === 'number' ? answerData.weight : 1;
    if (interest && interests[interest] !== undefined) {
      interests[interest] += weight;
    }
  });

  const sortedInterests = Object.entries(interests)
    .sort(([,a], [,b]) => b - a)
    .map(([type, score]) => ({
      type,
      score,
      percentage: Math.round((score / Math.max(...Object.values(interests))) * 100),
      description: getRIASECDescription(type)
    }));

  return {
    type: 'RIASEC Career Interest',
    topInterests: sortedInterests.slice(0, 3),
    allInterests: sortedInterests,
    hollandCode: sortedInterests.slice(0, 3).map(i => i.type.charAt(0).toUpperCase()).join(''),
    careers: getRIASECCareers(sortedInterests.slice(0, 3).map(i => i.type))
  };
};

// SVS (Schwartz Values) Result Calculator
export const calculateSVSResult = (answers: Record<string, any>) => {
  const values: Record<string, number> = {
    'self-direction': 0,
    stimulation: 0,
    hedonism: 0,
    achievement: 0,
    power: 0,
    security: 0,
    conformity: 0,
    tradition: 0,
    benevolence: 0,
    universalism: 0
  };

  Object.values(answers).forEach((answerData: any) => {
    const value = answerData?.value || answerData?.category;
    const weight = typeof answerData.weight === 'number' ? answerData.weight : 1;
    if (value && values[value] !== undefined) {
      values[value] += weight;
    }
  });

  const sortedValues = Object.entries(values)
    .sort(([,a], [,b]) => b - a)
    .map(([type, score]) => ({
      type,
      score,
      percentage: Math.round((score / Math.max(...Object.values(values))) * 100),
      description: getSVSDescription(type)
    }));

  return {
    type: 'Schwartz Value Survey',
    coreValues: sortedValues.slice(0, 5),
    allValues: sortedValues,
    valueProfile: getSVSProfile(sortedValues.slice(0, 3).map(v => v.type))
  };
};

// Decision Making Style Result Calculator
export const calculateDecisionResult = (answers: Record<string, any>) => {
  const styles: Record<string, number> = {
    rational: 0,
    intuitive: 0,
    dependent: 0,
    avoidant: 0,
    spontaneous: 0
  };

  Object.values(answers).forEach((answerData: any) => {
    const style = answerData?.style || answerData?.category;
    const weight = typeof answerData.weight === 'number' ? answerData.weight : 1;
    if (style && styles[style] !== undefined) {
      styles[style] += weight;
    }
  });

  const sortedStyles = Object.entries(styles)
    .sort(([,a], [,b]) => b - a)
    .map(([type, score]) => ({
      type,
      score,
      percentage: Math.round((score / Math.max(...Object.values(styles))) * 100),
      description: getDecisionStyleDescription(type)
    }));

  return {
    type: 'Decision Making Style',
    primaryStyle: sortedStyles[0],
    allStyles: sortedStyles,
    profile: getDecisionProfile(sortedStyles[0]?.type)
  };
};

// VARK Learning Style Result Calculator
export const calculateVARKResult = (answers: Record<string, any>) => {
  const styles: Record<string, number> = {
    visual: 0,
    aural: 0,
    'read-write': 0,
    kinesthetic: 0
  };

  Object.values(answers).forEach((answerData: any) => {
    const style = answerData?.style || answerData?.category;
    const weight = typeof answerData.weight === 'number' ? answerData.weight : 1;
    if (style && styles[style] !== undefined) {
      styles[style] += weight;
    }
  });

  const totalScore = Object.values(styles).reduce((sum, score) => sum + score, 0);
  const maxScore = Math.max(...Object.values(styles));
  
  const sortedStyles = Object.entries(styles)
    .sort(([,a], [,b]) => b - a)
    .map(([type, score]) => ({
      type,
      score,
      percentage: totalScore > 0 ? Math.round((score / totalScore) * 100) : 0,
      description: getVARKDescription(type)
    }));

  return {
    type: 'VARK Learning Style',
    primaryStyle: sortedStyles[0],
    allStyles: sortedStyles,
    learningProfile: getVARKProfile(sortedStyles[0]?.type),
    studyTips: getVARKStudyTips(sortedStyles[0]?.type)
  };
};

// Helper functions for descriptions and profiles
const getMBTIDescription = (code: string): string => {
  const descriptions: Record<string, string> = {
    'INTJ': 'આર્કિટેક્ટ - વ્યૂહરચનાકાર અને નવીનતાવાદી',
    'INTP': 'વિચારક - નવીન વિચારો અને સંભાવનાઓ શોધનાર',
    'ENTJ': 'કમાન્ડર - બોલ્ડ, કલ્પનાશીલ અને મજબૂત ઇચ્છાશક્તિવાળા નેતા',
    'ENTP': 'વિવાદકર્તા - સ્માર્ટ અને જિજ્ઞાસુ વિચારક',
    'INFJ': 'વકીલ - શાંત અને રહસ્યમય, પરંતુ પ્રેરણાદાયક',
    'INFP': 'મધ્યસ્થ - કાવ્યાત્મક, દયાળુ અને પરોપકારી',
    'ENFJ': 'પ્રોટાગોનિસ્ટ - કરિશ્માટિક અને પ્રેરણાદાયક નેતા',
    'ENFP': 'પ્રચારક - ઉત્સાહી, સર્જનાત્મક અને સામાજિક',
    'ISTJ': 'લોજિસ્ટિશિયન - વ્યવહારુ અને તથ્ય-આધારિત',
    'ISFJ': 'રક્ષક - ખૂબ જ સમર્પિત અને ગરમ હૃદયવાળા',
    'ESTJ': 'એક્ઝિક્યુટિવ - ઉત્કૃષ્ટ વ્યવસ્થાપક',
    'ESFJ': 'કોન્સલ - અસાધારણ રીતે સંભાળ રાખનાર',
    'ISTP': 'વર્ચ્યુઓસો - બોલ્ડ અને વ્યવહારુ પ્રયોગકર્તા',
    'ISFP': 'સાહસિક - લવચીક અને મોહક કલાકાર',
    'ESTP': 'ઉદ્યમી - સ્માર્ટ, ઊર્જાવાન અને ખૂબ જ સમજદાર',
    'ESFP': 'મનોરંજનકર્તા - સ્વયંસ્ફૂર્ત, ઊર્જાવાન અને ઉત્સાહી'
  };
  return descriptions[code] || 'અનોખો વ્યક્તિત્વ પ્રકાર';
};

const getMBTITraits = (code: string): string[] => {
  const traits: Record<string, string[]> = {
    'ISTJ': ['વ્યવહારિક', 'જવાબદાર', 'વિશ્વસનીય', 'વ્યવસ્થિત'],
    'ISFJ': ['સંવેદનશીલ', 'સહાયક', 'વફાદાર', 'વિગતવાર'],
    'INFJ': ['આદર્શવાદી', 'સર્જનાત્મક', 'અંતર્દૃષ્ટિ', 'સંવેદનશીલ'],
    'INTJ': ['વિશ્લેષણાત્મક', 'સ્વતંત્ર', 'નવીનતાવાદી', 'વ્યૂહરચનાત્મક'],
    'ISTP': ['વ્યવહારિક', 'લવચીક', 'વિશ્લેષણાત્મક', 'સ્વતંત્ર'],
    'ISFP': ['કલાત્મક', 'સંવેદનશીલ', 'લવચીક', 'મૈત્રીપૂર્ણ'],
    'INFP': ['આદર્શવાદી', 'સર્જનાત્મક', 'સહાનુભૂતિશીલ', 'અનુકૂલનશીલ'],
    'INTP': ['તાર્કિક', 'વિશ્લેષણાત્મક', 'સ્વતંત્ર', 'જિજ્ઞાસુ'],
    'ESTP': ['ઊર્જાવાન', 'વ્યવહારિક', 'અનુકૂલનશીલ', 'સામાજિક'],
    'ESFP': ['ઉત્સાહી', 'મૈત્રીપૂર્ણ', 'લવચીક', 'સર્જનાત્મક'],
    'ENFP': ['ઉત્સાહી', 'સર્જનાત્મક', 'સામાજિક', 'પ્રેરણાદાયક'],
    'ENTP': ['નવીનતાવાદી', 'ઊર્જાવાન', 'બહુમુખી', 'વિચારશીલ'],
    'ESTJ': ['વ્યવસ્થિત', 'નેતૃત્વ', 'વ્યવહારિક', 'નિર્ણાયક'],
    'ESFJ': ['સહાયક', 'સામાજિક', 'જવાબદાર', 'સંવેદનશીલ'],
    'ENFJ': ['પ્રેરણાદાયક', 'સહાનુભૂતિશીલ', 'સામાજિક', 'આદર્શવાદી'],
    'ENTJ': ['નેતૃત્વ', 'વ્યૂહરચનાત્મક', 'નિર્ણાયક', 'કાર્યક્ષમ']
  };
  return traits[code] || ['વિશિષ્ટ', 'અનોખા', 'વ્યક્તિત્વ', 'લક્ષણો'];
};

const getMBTICareers = (code: string): string[] => {
  const careers: Record<string, string[]> = {
    'ISTJ': ['એકાઉન્ટન્ટ', 'વકીલ', 'એન્જિનિયર', 'મેનેજર'],
    'ISFJ': ['શિક્ષક', 'કાઉન્સેલર', 'નર્સ', 'સામાજિક કાર્યકર'],
    'INFJ': ['લેખક', 'કાઉન્સેલર', 'મનોવૈજ્ઞાનિક', 'કલાકાર'],
    'INTJ': ['સોફ્ટવેર ડેવલપર', 'સંશોધક', 'વિશ્લેષક', 'સલાહકાર'],
    'ISTP': ['મિકેનિક', 'એન્જિનિયર', 'પાઇલટ', 'ટેકનિશિયન'],
    'ISFP': ['કલાકાર', 'ફોટોગ્રાફર', 'મ્યુઝિશિયન', 'ડિઝાઇનર'],
    'INFP': ['લેખક', 'કાઉન્સેલર', 'કલાકાર', 'મનોવૈજ્ઞાનિક'],
    'INTP': ['સંશોધક', 'દાર્શનિક', 'વૈજ્ઞાનિક', 'પ્રોગ્રામર'],
    'ESTP': ['સેલ્સ', 'માર્કેટિંગ', 'ઉદ્યોગપતિ', 'એથ્લેટ'],
    'ESFP': ['કલાકાર', 'શિક્ષક', 'મનોરંજન', 'ઇવેન્ટ પ્લાનર'],
    'ENFP': ['પત્રકાર', 'કાઉન્સેલર', 'માર્કેટિંગ', 'લેખક'],
    'ENTP': ['ઉદ્યોગપતિ', 'સલાહકાર', 'પત્રકાર', 'વકીલ'],
    'ESTJ': ['મેનેજર', 'એક્ઝિક્યુટિવ', 'વકીલ', 'જજ'],
    'ESFJ': ['શિક્ષક', 'HR મેનેજર', 'કાઉન્સેલર', 'નર્સ'],
    'ENFJ': ['શિક્ષક', 'કાઉન્સેલર', 'HR મેનેજર', 'સામાજિક કાર્યકર'],
    'ENTJ': ['CEO', 'મેનેજર', 'વકીલ', 'સલાહકાર']
  };
  return careers[code] || ['વિવિધ', 'કારકિર્દી', 'વિકલ્પો', 'ઉપલબ્ધ'];
};

const getMBTIStrengths = (code: string): string[] => {
  const strengths: Record<string, string[]> = {
    'ISTJ': ['વિશ્વસનીયતા', 'વ્યવસ્થા', 'જવાબદારી', 'વ્યવહારિકતા'],
    'ISFJ': ['સહાનુભૂતિ', 'વફાદારી', 'સેવાભાવ', 'વિગતવાર કાર્ય'],
    'INFJ': ['અંતર્દૃષ્ટિ', 'સર્જનાત્મકતા', 'આદર્શવાદ', 'સમર્પણ'],
    'INTJ': ['તાર્કિક વિચારસરણી', 'સમસ્યા નિરાકરણ', 'સ્વતંત્ર કાર્ય', 'નવીનતા'],
    'ISTP': ['વ્યવહારિક કુશળતા', 'અનુકૂલનક્ષમતા', 'સમસ્યા નિરાકરણ', 'તકનીકી જ્ઞાન'],
    'ISFP': ['સર્જનાત્મકતા', 'સહાનુભૂતિ', 'લવચીકતા', 'સૌંદર્ય બોધ'],
    'INFP': ['આદર્શવાદ', 'સર્જનાત્મકતા', 'સહાનુભૂતિ', 'અખંડિતતા'],
    'INTP': ['તાર્કિક વિશ્લેષણ', 'નવીનતા', 'સ્વતંત્ર વિચારસરણી', 'જિજ્ઞાસા'],
    'ESTP': ['અનુકૂલનક્ષમતા', 'વ્યવહારિકતા', 'સામાજિક કુશળતા', 'ઊર્જા'],
    'ESFP': ['ઉત્સાહ', 'સર્જનાત્મકતા', 'સામાજિક કુશળતા', 'લવચીકતા'],
    'ENFP': ['પ્રેરણા', 'સર્જનાત્મકતા', 'સામાજિક કુશળતા', 'ઉત્સાહ'],
    'ENTP': ['નવીનતા', 'અનુકૂલનક્ષમતા', 'વિચારશીલતા', 'સામાજિક કુશળતા'],
    'ESTJ': ['નેતૃત્વ', 'વ્યવસ્થા', 'નિર્ણય ક્ષમતા', 'કાર્યક્ષમતા'],
    'ESFJ': ['સહયોગ', 'સામાજિક કુશળતા', 'જવાબદારી', 'સેવાભાવ'],
    'ENFJ': ['નેતૃત્વ', 'પ્રેરણા', 'સહાનુભૂતિ', 'સામાજિક કુશળતા'],
    'ENTJ': ['નેતૃત્વ', 'વ્યૂહરચના', 'નિર્ણય ક્ષમતા', 'કાર્યક્ષમતા']
  };
  return strengths[code] || ['વિશિષ્ટ', 'વ્યક્તિગત', 'શક્તિઓ', 'ઉપલબ્ધ'];
};

const getIntelligenceDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    linguistic: 'ભાષાકીય બુદ્ધિ - શબ્દો અને ભાષાની કુશળતા',
    logical: 'તાર્કિક-ગાણિતિક બુદ્ધિ - તર્ક અને ગણિતની કુશળતા',
    musical: 'સંગીત બુદ્ધિ - સંગીત અને લય સમજવાની ક્ષમતા',
    bodily: 'શારીરિક-કાયિક બુદ્ધિ - શરીરની હલનચલનની કુશળતા',
    visual: 'દૃષ્ટિ-અવકાશી બુદ્ધિ - દૃશ્ય અને અવકાશી સમજ',
    interpersonal: 'આંતરવ્યક્તિગત બુદ્ધિ - અન્ય લોકોને સમજવાની ક્ષમતા',
    intrapersonal: 'આંતરવ્યક્તિગત બુદ્ધિ - પોતાને સમજવાની ક્ષમતા',
    naturalistic: 'પ્રાકૃતિક બુદ્ધિ - પ્રકૃતિને સમજવાની ક્ષમતા',
    existential: 'અસ્તિત્વવાદી બુદ્ધિ - જીવનના મૂળભૂત પ્રશ્નો વિશે વિચારવાની ક્ષમતા'
  };
  return descriptions[type] || 'વિશેષ બુદ્ધિ પ્રકાર';
};

const getIntelligenceData = (type: string) => {
  // Normalize the type name to handle different naming conventions
  const normalizedType = type.toLowerCase().replace('-', '');
  
  const intelligenceData: Record<string, any> = {
    linguistic: {
      characteristics: ["કવિ", "લેખક", "વકીલ", "વક્તા"],
      careerSuggestions: ["લેખક", "પત્રકાર", "વકીલ", "શિક્ષક", "કવિ", "અનુવાદક"],
      strengths: ["વાંચન", "લેખન", "વાતચીત", "ભાષા શીખવી"]
    },
    logical: {
      characteristics: ["વૈજ્ઞાનિક", "ગણિતશાસ્ત્રી", "એન્જિનિયર", "એકાઉન્ટન્ટ"],
      careerSuggestions: ["વૈજ્ઞાનિક", "ગણિતશાસ્ત્રી", "એન્જિનિયર", "એકાઉન્ટન્ટ", "પ્રોગ્રામર"],
      strengths: ["સમસ્યા ઉકેલવી", "તર્કશાસ્ત્ર", "ગણિત", "વિશ્લેષણ"]
    },
    musical: {
      characteristics: ["સંગીતકાર", "ગાયક", "સંગીત શિક્ષક"],
      careerSuggestions: ["સંગીતકાર", "ગાયક", "સંગીત શિક્ષક", "સંગીત નિર્દેશક", "ઇન્સ્ટ્રુમેન્ટ પ્લેયર"],
      strengths: ["સંગીત સમજવું", "તાલ", "સ્વર", "સંગીત રચના"]
    },
    bodily: {
      characteristics: ["નૃત્યકાર", "રમતવીર", "સર્જન (ડૉક્ટર)", "અભિનેતા"],
      careerSuggestions: ["એથ્લેટ", "નૃત્યકાર", "સર્જન", "અભિનેતા", "યોગ શિક્ષક"],
      strengths: ["શારીરિક કૌશલ્ય", "હાથની કારીગરી", "સંતુલન", "લવચીકતા"]
    },
    bodilykinesthetic: {  // Handle "bodily-kinesthetic" from backend
      characteristics: ["નૃત્યકાર", "રમતવીર", "સર્જન (ડૉક્ટર)", "અભિનેતા"],
      careerSuggestions: ["એથ્લેટ", "નૃત્યકાર", "સર્જન", "અભિનેતા", "યોગ શિક્ષક"],
      strengths: ["શારીરિક કૌશલ્ય", "હાથની કારીગરી", "સંતુલન", "લવચીકતા"]
    },
    visual: {
      characteristics: ["કલાવિદ", "ડિઝાઇનર", "ફેશન ડિઝાઇનર", "બિલ્ડિંગ આર્કિટેક્ટ"],
      careerSuggestions: ["આર્કિટેક્ટ", "ડિઝાઇનર", "કલાકાર", "ફોટોગ્રાફર", "પાઇલટ"],
      strengths: ["દૃશ્ય કલ્પના", "અવકાશી સમજ", "રંગ સંવેદના", "ડિઝાઇન"]
    },
    spatial: {  // Handle "spatial" from backend (same as visual)
      characteristics: ["કલાવિદ", "ડિઝાઇનર", "ફેશન ડિઝાઇનર", "બિલ્ડિંગ આર્કિટેક્ટ"],
      careerSuggestions: ["આર્કિટેક્ટ", "ડિઝાઇનર", "કલાકાર", "ફોટોગ્રાફર", "પાઇલટ"],
      strengths: ["દૃશ્ય કલ્પના", "અવકાશી સમજ", "રંગ સંવેદના", "ડિઝાઇન"]
    },
    interpersonal: {
      characteristics: ["શિક્ષક", "કાઉન્સેલર", "સેલ્સમેન", "નેતા"],
      careerSuggestions: ["શિક્ષક", "કાઉન્સેલર", "મેનેજર", "સેલ્સ", "સામાજિક કાર્યકર"],
      strengths: ["સામાજિક કુશળતા", "સહાનુભૂતિ", "નેતૃત્વ", "સંવાદ"]
    },
    intrapersonal: {
      characteristics: ["ફિલસૂફ", "લેખક", "સંશોધક", "કલાકાર"],
      careerSuggestions: ["ફિલસૂફ", "લેખક", "સંશોધક", "કાઉન્સેલર", "કલાકાર"],
      strengths: ["આત્મજ્ઞાન", "વિચારશીલતા", "સ્વતંત્ર કાર્ય", "આત્મનિરીક્ષણ"]
    },
    naturalistic: {
      characteristics: ["પર્યાવરણવિદ", "બાયોલોજિસ્ટ", "ખેડૂત", "પશુચિકિત્સક"],
      careerSuggestions: ["પર્યાવરણવિદ", "બાયોલોજિસ્ટ", "ખેડૂત", "પશુચિકિત્સક", "બોટેનિસ્ટ"],
      strengths: ["પ્રકૃતિ સમજ", "પર્યાવરણ જાગૃતિ", "જીવવિજ્ઞાન", "સંરક્ષણ"]
    },
    existential: {
      characteristics: ["ફિલસૂફ", "ધર્મગુરુ", "લેખક", "વિચારક"],
      careerSuggestions: ["ફિલસૂફ", "ધર્મગુરુ", "લેખક", "વિચારક", "કાઉન્સેલર"],
      strengths: ["ગહન વિચારસરણી", "અધ્યાત્મિક સમજ", "જીવન દર્શન", "અર્થ શોધવો"]
    }
  };
  
  // Try to find data using normalized type name
  return intelligenceData[normalizedType] || intelligenceData[type] || { characteristics: [], careerSuggestions: [], strengths: [] };
};

const getIntelligenceProfile = (dominantType: string): string => {
  return `તમારી પ્રમુખ બુદ્ધિ ${dominantType} છે, જે તમને આ ક્ષેત્રમાં વિશેષ કુશળતા આપે છે.`;
};

const getBigFiveLevel = (score: number): string => {
  if (score >= 20) return 'ઉચ્ચ';
  if (score >= 15) return 'મધ્યમ-ઉચ્ચ';
  if (score >= 10) return 'મધ્યમ';
  if (score >= 5) return 'મધ્યમ-નીચું';
  return 'નીચું';
};

const getBigFiveDescription = (trait: string, score: number): string => {
  const descriptions: Record<string, Record<string, string>> = {
    openness: {
      high: 'નવા અનુભવો માટે ખુલ્લા, કલ્પનાશીલ અને જિજ્ઞાસુ',
      low: 'પરંપરાગત, વ્યવહારુ અને સ્થિર પસંદગીઓ'
    },
    conscientiousness: {
      high: 'જવાબદાર, સંગઠિત અને લક્ષ્ય-લક્ષી',
      low: 'લવચીક, સ્વયંસ્ફૂર્ત અને અનૌપચારિક'
    },
    extraversion: {
      high: 'બહિર્મુખી, સામાજિક અને ઊર્જાવાન',
      low: 'આંતર્મુખી, શાંત અને વિચારશીલ'
    },
    agreeableness: {
      high: 'સહકારી, વિશ્વાસુ અને સહાનુભૂતિશીલ',
      low: 'સ્પર્ધાત્મક, સંદેહશીલ અને પડકારશીલ'
    },
    neuroticism: {
      high: 'ભાવનાત્મક રીતે પ્રતિક્રિયાશીલ અને તણાવ-સંવેદનશીલ',
      low: 'શાંત, સ્થિર અને તણાવ-પ્રતિરોધી'
    }
  };
  
  const level = score >= 15 ? 'high' : 'low';
  return descriptions[trait]?.[level] || 'વિશેષ લક્ષણ';
};

const getBigFiveProfile = (results: any[]): string => {
  return 'તમારું વ્યક્તિત્વ પ્રોફાઇલ તમારી અનોખી શક્તિઓ અને વિકાસના ક્ષેત્રો દર્શાવે છે.';
};

const getBigFiveSummary = (results: any[]): string => {
  return 'Big Five પરીક્ષણ તમારા વ્યક્તિત્વના પાંચ મુખ્ય પરિમાણોને માપે છે.';
};

const getRIASECDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    realistic: 'વાસ્તવિક - હાથ વડે કામ, મશીનો અને સાધનો સાથે કામ',
    investigative: 'સંશોધનાત્મક - વિશ્લેષણ, સંશોધન અને સમસ્યા નિરાકરણ',
    artistic: 'કલાત્મક - સર્જનાત્મકતા, કલા અને સ્વ-અભિવ્યક્તિ',
    social: 'સામાજિક - લોકોની મદદ, શિક્ષણ અને સેવા',
    enterprising: 'ઉદ્યોગી - નેતૃત્વ, વેચાણ અને વ્યવસાય',
    conventional: 'પરંપરાગત - ડેટા, વિગતો અને સંગઠન'
  };
  return descriptions[type] || 'વિશેષ રુચિ ક્ષેત્ર';
};

const getRIASECCareers = (interests: string[]): string[] => {
  return ['એન્જિનિયર', 'સંશોધક', 'કલાકાર', 'શિક્ષક', 'મેનેજર'];
};

const getSVSDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    'self-direction': 'સ્વ-નિર્દેશન - સ્વતંત્ર વિચાર અને કાર્ય',
    stimulation: 'ઉત્તેજના - રોમાંચ અને નવીનતા',
    hedonism: 'સુખભોગ - આનંદ અને સંતુષ્ટિ',
    achievement: 'સિદ્ધિ - વ્યક્તિગત સફળતા અને સક્ષમતા',
    power: 'શક્તિ - સત્તા અને પ્રભાવ',
    security: 'સુરક્ષા - સલામતી અને સ્થિરતા',
    conformity: 'અનુરૂપતા - નિયમો અને અપેક્ષાઓનું પાલન',
    tradition: 'પરંપરા - સાંસ્કૃતિક અને ધાર્મિક પરંપરાઓનું સન્માન',
    benevolence: 'પરોપકાર - નજીકના લોકોનું કલ્યાણ',
    universalism: 'સાર્વત્રિકતા - બધા લોકો અને પ્રકૃતિનું કલ્યાણ'
  };
  return descriptions[type] || 'મહત્વપૂર્ણ મૂલ્ય';
};

const getSVSProfile = (topValues: string[]): string => {
  return `તમારા મુખ્ય મૂલ્યો ${topValues.join(', ')} છે, જે તમારા જીવનની પ્રાથમિકતાઓ દર્શાવે છે.`;
};

const getDecisionStyleDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    rational: 'તાર્કિક - તર્ક અને વિશ્લેષણ પર આધારિત નિર્ણયો',
    intuitive: 'અંતઃપ્રેરણાત્મક - આંતરિક લાગણી અને અંતર્જ્ઞાન પર આધારિત',
    dependent: 'અવલંબી - અન્ય લોકોની સલાહ અને માર્ગદર્શન પર આધારિત',
    avoidant: 'ટાળવાત્મક - નિર્ણયો લેવાનું ટાળવું અથવા વિલંબ',
    spontaneous: 'આકસ્મિક - ઝડપી અને તાત્કાલિક નિર્ણયો'
  };
  return descriptions[type] || 'નિર્ણય શૈલી';
};

const getDecisionProfile = (primaryStyle: string): string => {
  return `તમારી પ્રાથમિક નિર્ણય શૈલી ${primaryStyle} છે, જે તમારા નિર્ણય લેવાની પ્રક્રિયાને દર્શાવે છે.`;
};

const getVARKDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    visual: 'દૃષ્ટિ આધારિત - ચાર્ટ, ગ્રાફ અને છબીઓ દ્વારા શીખવું',
    aural: 'શ્રવણ આધારિત - સાંભળીને અને ચર્ચા દ્વારા શીખવું',
    'read-write': 'વાંચન-લેખન આધારિત - લખાણ દ્વારા શીખવું',
    kinesthetic: 'કાયિક આધારિત - હાથ વડે કરીને અને અનુભવ દ્વારા શીખવું'
  };
  return descriptions[type] || 'શીખવાની શૈલી';
};

const getVARKProfile = (primaryStyle: string): string => {
  return `તમારી પ્રાથમિક શીખવાની શૈલી ${primaryStyle} છે.`;
};

const getVARKStudyTips = (primaryStyle: string): string[] => {
  const tips: Record<string, string[]> = {
    visual: ['માઇન્ડ મેપ્સ બનાવો', 'રંગીન હાઇલાઇટર્સ વાપરો', 'ચાર્ટ અને ગ્રાફ બનાવો'],
    aural: ['જોરથી વાંચો', 'ચર્ચા જૂથોમાં ભાગ લો', 'ઓડિયો રેકોર્ડિંગ સાંભળો'],
    'read-write': ['નોંધો લખો', 'સારાંશ બનાવો', 'યાદીઓ અને બુલેટ પોઇન્ટ્સ વાપરો'],
    kinesthetic: ['હાથ વડે પ્રેક્ટિસ કરો', 'મોડેલ્સ બનાવો', 'વારંવાર બ્રેક લો']
  };
  return tips[primaryStyle] || ['નિયમિત અભ્યાસ કરો'];
};

// Frontend fallback calculator function
export const calculateTestResultFrontend = (testId: string, answers: Record<string, any>) => {
  switch (testId) {
    case 'mbti':
      return calculateMBTIResult(answers);
    case 'intelligence':
      return calculateIntelligenceResult(answers);
    case 'bigfive':
      return calculateBigFiveResult(answers);
    case 'riasec':
      return calculateRIASECResult(answers);
    case 'svs':
      return calculateSVSResult(answers);
    case 'decision':
      return calculateDecisionResult(answers);
    case 'vark':
      return calculateVARKResult(answers);
    default:
      return null;
  }
};

// Main calculator function - now uses backend by default
export const calculateTestResult = async (
  testId: string, 
  answers: Record<string, any>, 
  userId: string, // Changed to string to support UUID
  sessionId?: string
) => {
  // Ensure userId is always a string UUID, never an integer
  const safeUserId = (userId === '1' || userId === '11' || !userId || userId.toString() === '1' || userId.toString() === '11') 
    ? '11dc4aec-2216-45f9-b045-60edac007262' 
    : userId;
  
  // Try backend calculation first (with database integration)
  const backendResult = await calculateTestResultFromBackend(testId, answers, safeUserId, sessionId);
  
  if (backendResult) {
    return backendResult;
  }
  
  // Fallback to frontend calculation
  return calculateTestResultFrontend(testId, answers);
};
