'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIInsights } from '@/services/aiInsightsService';
import { 
  Brain, 
  Briefcase, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Star, 
  Users, 
  Lightbulb, 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  Zap, 
  Award, 
  ArrowRight,
  ExternalLink,
  Copy,
  Share2,
  Sparkles,
  BarChart3,
  PieChart,
  Activity,
  AlertCircle
} from 'lucide-react';

interface ModernAIInsightsProps {
  insights: AIInsights | null;
  isLoading: boolean;
  error: string | null;
  testType?: string;
}

const ModernAIInsights: React.FC<ModernAIInsightsProps> = ({ 
  insights, 
  isLoading, 
  error, 
  testType = 'assessment' 
}) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'career' | 'skills' | 'roadmap'>('overview');

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-orange-500 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-4 text-white text-lg font-medium">
                AI વિશ્લેષણ લોડ કરી રહ્યું છે...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-red-50 border border-red-200 p-8">
            <div className="flex items-center justify-center">
              <div className="text-red-700 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error Loading AI Analysis</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'career', label: 'Career', icon: Briefcase },
    { id: 'skills', label: 'Skills', icon: Target },
    { id: 'roadmap', label: 'Roadmap', icon: MapPin }
  ];

  const renderOverviewTab = () => {
    // Test-specific overview content with actual results
    const getTestSpecificContent = () => {
      const currentTestType = testType?.toLowerCase() || '';
      
      // Helper function to get actual scores from insights or use fallback
      const getScore = (key: string, fallback: number = 0) => {
        if (insights && (insights as any)[key]) {
          return (insights as any)[key];
        }
        return fallback;
      };

      // Helper function to get string values from insights
      const getStringValue = (key: string, fallback: string) => {
        if (insights && (insights as any)[key]) {
          return (insights as any)[key];
        }
        return fallback;
      };

      // Helper function to get array values from insights
      const getArrayValue = (key: string, fallback: string[]) => {
        if (insights && (insights as any)[key]) {
          return (insights as any)[key];
        }
        return fallback;
      };

      // Helper function to get nested object values
      const getNestedValue = (path: string, fallback: any) => {
        if (!insights) return fallback;
        const keys = path.split('.');
        let value = insights;
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = (value as any)[key];
          } else {
            return fallback;
          }
        }
        return value;
      };

      // Helper function to get the highest scoring category
      const getTopResult = (results: any[]) => {
        if (!results || results.length === 0) return null;
        return results.reduce((max, current) => 
          (current.score > max.score) ? current : max
        );
      };
      
      if (currentTestType.includes('intelligence') || currentTestType.includes('બહુવિધ બુદ્ધિ')) {
        // Get intelligence analysis from backend response
        const intelligenceAnalysis = getNestedValue('intelligence_analysis', null);
        const allIntelligences = getNestedValue('intelligence_analysis.all_intelligences', []);
        const dominantIntelligence = getNestedValue('intelligence_analysis.dominant_intelligence', null);
        
        // Create results array from backend data or fallback
        const allResults = allIntelligences.length > 0 ? allIntelligences.map((intelligence: any, index: number) => ({
          name: intelligence.type || intelligence.name || 'અજ્ઞાત બુદ્ધિ',
          english: intelligence.english || 'Unknown Intelligence',
          score: intelligence.score || 0,
          color: ['from-blue-500 to-blue-600', 'from-green-500 to-green-600', 'from-purple-500 to-purple-600', 'from-orange-500 to-orange-600', 'from-pink-500 to-pink-600', 'from-indigo-500 to-indigo-600', 'from-teal-500 to-teal-600', 'from-emerald-500 to-emerald-600', 'from-gray-500 to-gray-600'][index % 9]
        })) : [
          { name: 'ભાષાકૌશલ્ય બુદ્ધિ', english: 'Linguistic Intelligence', score: getScore('linguistic_score', 0), color: 'from-blue-500 to-blue-600' },
          { name: 'તર્કશક્તિ અને ગણિત બુદ્ધિ', english: 'Logical-Mathematical', score: getScore('logical_score', 0), color: 'from-green-500 to-green-600' },
          { name: 'સંગીત બુદ્ધિ', english: 'Musical Intelligence', score: getScore('musical_score', 0), color: 'from-purple-500 to-purple-600' },
          { name: 'શારીરિક-ગતિશીલ બુદ્ધિ', english: 'Bodily-Kinesthetic', score: getScore('bodily_score', 0), color: 'from-orange-500 to-orange-600' },
          { name: 'અવકાશીય બુદ્ધિ', english: 'Visual-Spatial', score: getScore('visual_score', 0), color: 'from-pink-500 to-pink-600' },
          { name: 'માણસ વચ્ચે સંબંધ બુદ્ધિ', english: 'Interpersonal', score: getScore('interpersonal_score', 0), color: 'from-indigo-500 to-indigo-600' },
          { name: 'આત્મ-જ્ઞાન બુદ્ધિ', english: 'Intrapersonal', score: getScore('intrapersonal_score', 0), color: 'from-teal-500 to-teal-600' },
          { name: 'કુદરતી બુદ્ધિ', english: 'Naturalistic', score: getScore('naturalistic_score', 0), color: 'from-emerald-500 to-emerald-600' },
          { name: 'અસ્તિત્વબોધ બુદ્ધિ', english: 'Existential', score: getScore('existential_score', 0), color: 'from-gray-500 to-gray-600' }
        ];
        
        const topResult = dominantIntelligence ? {
          name: dominantIntelligence.type || dominantIntelligence.name || 'અજ્ઞાત બુદ્ધિ',
          english: dominantIntelligence.english || 'Unknown Intelligence',
          score: dominantIntelligence.score || 0
        } : getTopResult(allResults) || allResults[0];
        
        return {
          title: 'બહુવિધ બુદ્ધિ પરીક્ષણ પરિણામ',
          description: 'તમારી વિવિધ બુદ્ધિ ક્ષમતાઓનું વિશ્લેષણ',
          mainResult: {
            type: topResult.name,
            english: topResult.english,
            score: topResult.score,
            description: dominantIntelligence?.description || getStringValue('intelligence_description', 'તમારી બુદ્ધિ ક્ષમતાઓનું વિશ્લેષણ'),
            professions: dominantIntelligence?.careers || getArrayValue('intelligence_professions', ['વ્યાવસાયિક', 'કારકિર્દી', 'વિકાસ'])
          },
          allResults: allResults
        };
      }
      
      if (currentTestType.includes('bigfive') || currentTestType.includes('big five') || currentTestType.includes('બિગ ફાઇવ')) {
        // Get Big Five analysis from backend response
        const bigFiveAnalysis = getNestedValue('result_analysis', null);
        const scores = getNestedValue('scores', {});
        
        // Create results array from backend data or fallback
        const allResults = [
          { name: 'ખૂલ્લુંપન', english: 'Openness to Experience', score: getScore('openness', 0), color: 'from-yellow-500 to-orange-500' },
          { name: 'જવાબદારી', english: 'Conscientiousness', score: getScore('conscientiousness', 0), color: 'from-green-500 to-green-600' },
          { name: 'બહિર્મુખતા', english: 'Extraversion', score: getScore('extraversion', 0), color: 'from-blue-500 to-blue-600' },
          { name: 'સહમતિ', english: 'Agreeableness', score: getScore('agreeableness', 0), color: 'from-pink-500 to-pink-600' },
          { name: 'ભાવનાત્મક સ્થિરતા', english: 'Neuroticism', score: getScore('neuroticism', 0), color: 'from-red-500 to-red-600' }
        ];
        
        const topResult = getTopResult(allResults) || allResults[0];
        
        return {
          title: 'બિગ ફાઇવ વ્યક્તિત્વ પરીક્ષણ પરિણામ',
          description: 'તમારા વ્યક્તિત્વ લક્ષણોનું વિગતવાર વિશ્લેષણ',
          mainResult: {
            type: topResult.name,
            english: topResult.english,
            score: topResult.score,
            description: getStringValue('personality_description', 'તમારા વ્યક્તિત્વ લક્ષણોનું વિશ્લેષણ'),
            professions: getArrayValue('personality_professions', ['વ્યાવસાયિક', 'કારકિર્દી', 'વિકાસ'])
          },
          allResults: allResults
        };
      }
      
      if (currentTestType.includes('riasec')) {
        // Get RIASEC analysis from backend response
        const riasecAnalysis = getNestedValue('riasec_analysis', null);
        const allTypes = getNestedValue('riasec_analysis.all_types', []);
        const primaryType = getNestedValue('riasec_analysis.primary_type', null);
        
        // Create results array from backend data or fallback
        const allResults = allTypes.length > 0 ? allTypes.map((type: any, index: number) => ({
          name: type.type || type.name || 'અજ્ઞાત પ્રકાર',
          english: type.english || 'Unknown Type',
          score: type.score || 0,
          color: ['from-blue-500 to-blue-600', 'from-green-500 to-green-600', 'from-purple-500 to-purple-600', 'from-pink-500 to-pink-600', 'from-orange-500 to-orange-600', 'from-gray-500 to-gray-600'][index % 6]
        })) : [
          { name: 'વાસ્તવિક', english: 'Realistic', score: getScore('realistic', 0), color: 'from-blue-500 to-blue-600' },
          { name: 'અનુસંધાનકર્તા', english: 'Investigative', score: getScore('investigative', 0), color: 'from-green-500 to-green-600' },
          { name: 'કલાત્મક', english: 'Artistic', score: getScore('artistic', 0), color: 'from-purple-500 to-purple-600' },
          { name: 'સામાજિક', english: 'Social', score: getScore('social', 0), color: 'from-pink-500 to-pink-600' },
          { name: 'ઉદ્યોગસાહસિક', english: 'Enterprising', score: getScore('enterprising', 0), color: 'from-orange-500 to-orange-600' },
          { name: 'પરંપરાગત', english: 'Conventional', score: getScore('conventional', 0), color: 'from-gray-500 to-gray-600' }
        ];
        
        const topResult = primaryType ? {
          name: primaryType.type || primaryType.name || 'અજ્ઞાત પ્રકાર',
          english: primaryType.english || 'Unknown Type',
          score: primaryType.score || 0
        } : getTopResult(allResults) || allResults[0];
        
        return {
          title: 'RIASEC કારકિર્દી પરીક્ષણ પરિણામ',
          description: 'તમારા કારકિર્દી રુચિઓ અને કુશળતાઓનું વિશ્લેષણ',
          mainResult: {
            type: topResult.name,
            english: topResult.english,
            score: topResult.score,
            description: primaryType?.description || getStringValue('riasec_description', 'તમારા કારકિર્દી રુચિઓનું વિશ્લેષણ'),
            professions: primaryType?.careers || getArrayValue('riasec_professions', ['વ્યાવસાયિક', 'કારકિર્દી', 'વિકાસ'])
          },
          allResults: allResults
        };
      }
      
      if (currentTestType.includes('decision') || currentTestType.includes('નિર્ણય')) {
        // Get Decision Making analysis from backend response
        const decisionAnalysis = getNestedValue('decision_style_analysis', null);
        const allStyles = getNestedValue('decision_style_analysis.all_styles', []);
        const primaryStyle = getNestedValue('decision_style_analysis.primary_style', null);
        
        // Create results array from backend data or fallback
        const allResults = allStyles.length > 0 ? allStyles.map((style: any, index: number) => ({
          name: style.style || style.name || 'અજ્ઞાત શૈલી',
          english: style.english || 'Unknown Style',
          score: style.score || 0,
          color: ['from-blue-500 to-blue-600', 'from-purple-500 to-purple-600', 'from-green-500 to-green-600', 'from-red-500 to-red-600', 'from-orange-500 to-orange-600'][index % 5]
        })) : [
          { name: 'તર્કવાદી', english: 'Rational', score: getScore('rational', 0), color: 'from-blue-500 to-blue-600' },
          { name: 'સ્વભાવિક', english: 'Intuitive', score: getScore('intuitive', 0), color: 'from-yellow-500 to-orange-500' },
          { name: 'આશ્રિત', english: 'Dependent', score: getScore('dependent', 0), color: 'from-purple-500 to-purple-600' },
          { name: 'ટાળવાની', english: 'Avoidant', score: getScore('avoidant', 0), color: 'from-red-500 to-red-600' },
          { name: 'અચાનક', english: 'Spontaneous', score: getScore('spontaneous', 0), color: 'from-green-500 to-green-600' }
        ];
        
        const topResult = primaryStyle ? {
          name: primaryStyle.style || primaryStyle.name || 'અજ્ઞાત શૈલી',
          english: primaryStyle.english || 'Unknown Style',
          score: primaryStyle.score || 0
        } : getTopResult(allResults) || allResults[0];
        
        return {
          title: 'નિર્ણય લેવાની શૈલી પરીક્ષણ પરિણામ',
          description: 'તમારી નિર્ણય લેવાની પ્રક્રિયા અને શૈલીનું વિશ્લેષણ',
          mainResult: {
            type: topResult.name,
            english: topResult.english,
            score: topResult.score,
            description: primaryStyle?.description || getStringValue('decision_description', 'તમારી નિર્ણય શૈલીનું વિશ્લેષણ'),
            professions: primaryStyle?.careers || getArrayValue('decision_professions', ['વ્યાવસાયિક', 'કારકિર્દી', 'વિકાસ'])
          },
          allResults: allResults
        };
      }
      
      if (currentTestType.includes('vark') || currentTestType.includes('લર્નિંગ')) {
        // Get VARK analysis from backend response
        const varkAnalysis = getNestedValue('vark_analysis', null);
        const allStyles = getNestedValue('vark_analysis.all_styles', []);
        const primaryStyle = getNestedValue('vark_analysis.primary_style', null);
        const studySuggestions = getNestedValue('study_suggestions', []);
        
        // Create results array from backend data or fallback
        const allResults = allStyles.length > 0 ? allStyles.map((style: any, index: number) => ({
          name: style.style || style.name || 'અજ્ઞાત શૈલી',
          english: style.english || 'Unknown Style',
          score: style.score || 0,
          color: ['from-blue-500 to-blue-600', 'from-green-500 to-green-600', 'from-purple-500 to-purple-600', 'from-orange-500 to-orange-600'][index % 4]
        })) : [
          { name: 'દૃષ્ટિ આધારિત', english: 'Visual', score: getScore('visual_score', 0), color: 'from-blue-500 to-blue-600' },
          { name: 'શ્રાવ્ય આધારિત', english: 'Aural', score: getScore('aural_score', 0), color: 'from-green-500 to-green-600' },
          { name: 'વાંચન/લેખન આધારિત', english: 'Read-Write', score: getScore('readwrite_score', 0), color: 'from-purple-500 to-purple-600' },
          { name: 'સ્પર્શ/અનુભવી શૈલી', english: 'Kinesthetic', score: getScore('kinesthetic_score', 0), color: 'from-orange-500 to-orange-600' }
        ];
        
        const topResult = primaryStyle ? {
          name: primaryStyle.style || primaryStyle.name || 'અજ્ઞાત શૈલી',
          english: primaryStyle.english || 'Unknown Style',
          score: primaryStyle.score || 0
        } : getTopResult(allResults) || allResults[0];
        
        return {
          title: 'VARK શીખવાની શૈલી',
          description: 'તમારી શીખવાની પસંદગીઓ',
          mainResult: {
            type: topResult.name,
            english: topResult.english,
            score: topResult.score,
            description: primaryStyle?.description || getStringValue('vark_description', 'તમારી શીખવાની શૈલીનું વિશ્લેષણ'),
            professions: primaryStyle?.careers || getArrayValue('vark_professions', ['આર્કિટેક્ટ', 'ડિઝાઈનર', 'આર્ટિસ્ટ', 'ઇન્જિનિયર'])
          },
          allResults: allResults,
          studySuggestions: studySuggestions.length > 0 ? studySuggestions : getArrayValue('study_suggestions', [
            'માઇન્ડ મેપ્સ બનાવો',
            'રંગીન હાઇલાઇટર્સ વાપરો',
            'ચાર્ટ અને ગ્રાફ બનાવો'
          ])
        };
      }
      
      // Default fallback - use actual AI insights data
      return {
        title: 'AI વિશ્લેષણ પરિણામ',
        description: 'તમારા પરીક્ષણ પરિણામો પર આધારિત AI વિશ્લેષણ',
        mainResult: {
          type: insights?.best_field?.field || 'કારકિર્દી ક્ષેત્ર',
          english: 'Career Field',
          score: insights?.best_field?.match_percentage || 85,
          description: insights?.best_field?.reasoning || 'તમારા મુખ્ય લક્ષણો અને કુશળતાઓ પર આધારિત વિશ્લેષણ',
          professions: insights?.career_recommendations?.slice(0, 3).map((rec: any) => rec.job_role) || ['વ્યાવસાયિક', 'કારકિર્દી', 'વિકાસ']
        },
        allResults: [
          { name: 'શ્રેષ્ઠ ક્ષેત્ર મેચ', english: 'Best Field Match', score: insights?.best_field?.match_percentage || 85, color: 'from-orange-500 to-orange-600' },
          { name: 'કુશળતા સ્કોર', english: 'Skills Score', score: insights?.skill_recommendations?.technical_skills?.length * 20 || 75, color: 'from-blue-500 to-blue-600' },
          { name: 'કારકિર્દી સંભાવના', english: 'Career Potential', score: insights?.career_recommendations?.length * 15 || 80, color: 'from-green-500 to-green-600' }
        ]
      };
    };

    const testContent = getTestSpecificContent();

    // Check if all scores are 0 (no data available)
    const hasData = testContent.allResults.some((result: any) => result.score > 0);

    return (
      <div className="space-y-8">
        {/* Clean No Data Message */}
        {!hasData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 rounded-2xl p-8 border border-yellow-200 text-center"
          >
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-white text-xl mx-auto mb-4">
              ⚠️
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              Assessment Results Not Available
            </h3>
            <p className="text-slate-600 mb-4">
              AI analysis is still loading or the assessment is not complete.
            </p>
            <p className="text-sm text-slate-500">
              Please complete the assessment and wait for AI analysis.
            </p>
          </motion.div>
        )}
        {/* Clean header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            AI Analysis Results
          </h2>
          <p className="text-slate-600">
            Comprehensive insights powered by artificial intelligence
          </p>
        </motion.div>

        {/* Enhanced Main Result Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-3xl p-8 border border-blue-100 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 to-purple-50/20 rounded-3xl"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-200/30 to-pink-200/30 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/30 to-indigo-200/30 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 rounded-2xl text-white text-3xl mb-6 shadow-lg transform hover:scale-105 transition-transform duration-300">
                🏆
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
                {insights?.best_field?.field || testContent.mainResult.type}
              </h3>
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-2xl text-xl font-bold mr-4 shadow-lg">
                  {testContent.mainResult.score}%
                </div>
                <div className="text-center">
                  <span className="text-slate-600 text-sm block">Match Score</span>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(testContent.mainResult.score / 20) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/50 shadow-lg">
              <p className="text-slate-700 leading-relaxed mb-6 text-lg">
                {insights?.best_field?.reasoning || testContent.mainResult.description}
              </p>
              
              <div>
                <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  Related Careers
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {(insights?.career_recommendations?.slice(0, 4).map((rec: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm font-medium hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer"
                    >
                      {rec.job_role}
                    </motion.div>
                  )) || testContent.mainResult.professions.map((profession: string, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm font-medium hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer"
                    >
                      {profession}
                    </motion.div>
                  )))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Results Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white to-gray-50/50 rounded-3xl p-8 border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
        >
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-br from-pink-200/20 to-orange-200/20 rounded-full blur-lg"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl text-white mb-4 shadow-lg">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Complete Analysis
              </h3>
              <p className="text-slate-600 mt-2">Detailed breakdown of all assessment areas</p>
            </div>
            
            <div className="space-y-6">
              {testContent.allResults.map((result: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${result.color} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-slate-800">
                          {result.name}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {result.english}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-800">
                        {result.score}%
                      </div>
                      <div className="text-sm text-slate-500">Score</div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.score}%` }}
                        transition={{ duration: 1.5, delay: 0.5 + index * 0.2, ease: "easeOut" }}
                        className={`h-3 rounded-full bg-gradient-to-r ${result.color} relative`}
                      >
                        <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                      </motion.div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  {/* Score interpretation */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      result.score >= 80 ? 'bg-green-100 text-green-700' :
                      result.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      result.score >= 40 ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {result.score >= 80 ? 'Excellent' :
                       result.score >= 60 ? 'Good' :
                       result.score >= 40 ? 'Average' : 'Needs Improvement'}
                    </div>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(result.score / 20) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* VARK Special Display */}
        {testContent.studySuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-3xl p-8 border-2 border-teal-200"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 font-gujarati flex items-center">
              <CheckCircle className="w-8 h-8 text-teal-500 mr-3" />
              અભ્યાસ સૂચનો
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {testContent.studySuggestions.map((suggestion: string, index: number) => (
                <div key={index} className="bg-white rounded-xl p-4 border border-teal-200">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                      {index + 1}
                    </div>
                    <span className="text-gray-700 font-gujarati">{suggestion}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Enhanced Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="group bg-gradient-to-br from-blue-50 via-blue-100/50 to-indigo-100 rounded-3xl p-8 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-300/20 to-indigo-300/20 rounded-full blur-xl"></div>
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                📊
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3 font-gujarati">સરેરાશ સ્કોર</h4>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {Math.round(testContent.allResults.reduce((sum: number, result: any) => sum + result.score, 0) / testContent.allResults.length)}%
              </div>
              <div className="text-sm text-blue-600 font-medium">Overall Performance</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="group bg-gradient-to-br from-green-50 via-emerald-100/50 to-green-100 rounded-3xl p-8 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-300/20 to-emerald-300/20 rounded-full blur-xl"></div>
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                ⭐
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3 font-gujarati">શ્રેષ્ઠ ક્ષેત્ર</h4>
              <div className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-gujarati mb-2">
                {testContent.mainResult.type}
              </div>
              <div className="text-sm text-green-600 font-medium">Top Strength Area</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="group bg-gradient-to-br from-purple-50 via-violet-100/50 to-purple-100 rounded-3xl p-8 border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-300/20 to-violet-300/20 rounded-full blur-xl"></div>
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                🎯
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3 font-gujarati">વિકાસ ક્ષેત્ર</h4>
              <div className="text-lg font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent font-gujarati mb-2">
                {testContent.allResults.find((r: any) => r.score < 60)?.name || 'બધા ક્ષેત્રો મજબૂત'}
              </div>
              <div className="text-sm text-purple-600 font-medium">Growth Opportunity</div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Detailed Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-white to-orange-50/30 rounded-3xl p-8 border border-orange-100 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
        >
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-200/20 to-pink-200/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-yellow-200/20 to-orange-200/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white mb-4 shadow-lg">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent font-gujarati">
                વિગતવાર વિશ્લેષણ
              </h3>
              <p className="text-slate-600 mt-2">In-depth analysis of your strengths and career opportunities</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 font-gujarati">મુખ્ય શક્તિઓ</h4>
                </div>
                <div className="space-y-4">
                  {insights.result_analysis?.strengths?.slice(0, 3).map((strength: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="bg-green-50 rounded-xl p-4 border border-green-100 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-gray-900 font-bold font-gujarati mb-1">{strength.strength}</h5>
                          <p className="text-gray-600 text-sm font-gujarati leading-relaxed">{strength.reasoning}</p>
                        </div>
                      </div>
                    </motion.div>
                  )) || (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center">
                        <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full mr-3"></div>
                        <span className="text-gray-700 font-gujarati">વ્યક્તિત્વ વિશ્લેષણ લોડ કરી રહ્યું છે...</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 font-gujarati">કારકિર્દી સૂચનાઓ</h4>
                </div>
                <div className="space-y-4">
                  {insights.career_recommendations?.slice(0, 3).map((rec: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="bg-yellow-50 rounded-xl p-4 border border-yellow-100 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-gray-900 font-bold font-gujarati mb-1">{rec.job_role}</h5>
                          <p className="text-gray-600 text-sm font-gujarati">{rec.industry}</p>
                          {rec.salary_range && (
                            <div className="mt-2 flex items-center text-xs text-yellow-600">
                              <DollarSign className="w-3 h-3 mr-1" />
                              {rec.salary_range}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )) || (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center">
                        <div className="animate-spin w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full mr-3"></div>
                        <span className="text-gray-700 font-gujarati">કારકિર્દી સૂચનાઓ લોડ કરી રહ્યું છે...</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderCareerTab = () => (
    <div className="space-y-6">
      {/* Best Career Field */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-500"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-3xl font-bold font-gujarati flex items-center">
            <Briefcase className="w-8 h-8 mr-3" />
            શ્રેષ્ઠ કારકિર્દી ક્ષેત્ર
          </h3>
          <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl text-lg font-bold shadow-lg">
            {insights?.best_field?.match_percentage || 85}% મેચ
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-2xl font-semibold mb-4 font-gujarati">
              {insights?.best_field?.field || 'કારકિર્દી ક્ષેત્ર'}
            </h4>
            <p className="text-orange-100 leading-relaxed font-gujarati text-lg">
              {insights?.best_field?.reasoning || 'તમારા વ્યક્તિત્વ અને કુશળતા મુજબ શ્રેષ્ઠ કારકિર્દી ક્ષેત્ર'}
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <h5 className="font-bold mb-2 font-gujarati text-lg">અપેક્ષિત પગાર</h5>
              <p className="text-orange-100 font-gujarati text-xl">
                {insights?.best_field?.salary_expectations || '₹3-8 લાખ/વર્ષ'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <h5 className="font-bold mb-2 font-gujarati text-lg">વૃદ્ધિ દર</h5>
              <p className="text-orange-100 font-gujarati text-xl">
                {insights?.best_field?.growth_potential || '15-20% વાર્ષિક'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Career Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-white to-blue-50/30 rounded-3xl p-8 border border-blue-100 shadow-xl hover:shadow-2xl transition-all duration-500"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl text-white mb-4 shadow-lg">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent font-gujarati">
            કારકિર્દી વિકલ્પો
          </h3>
          <p className="text-slate-600 mt-2">Explore career paths that match your profile</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {insights?.career_recommendations?.slice(0, 6).map((option: any, index: number) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {index + 1}
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
              
              <h4 className="font-bold text-gray-900 mb-3 font-gujarati text-lg">{option.job_role}</h4>
              <p className="text-gray-600 text-sm font-gujarati mb-4 leading-relaxed">{option.explanation}</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded-full">
                    {option.growth_potential || 'ઉચ્ચ વૃદ્ધિ'}
                  </span>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                
                {option.salary_range && (
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                    <span className="font-gujarati">{option.salary_range}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )) || (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-gujarati text-lg">કારકિર્દી વિકલ્પો લોડ કરી રહ્યું છે...</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );

          <h3 className="text-2xl font-bold font-gujarati flex items-center">
            <Briefcase className="w-8 h-8 mr-3" />
            શ્રેષ્ઠ કારકિર્દી ક્ષેત્ર
          </h3>
          <div className="bg-white/20 px-4 py-2 rounded-full text-sm font-bold">
            {insights.best_field?.match_percentage || 85}% મેચ
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xl font-semibold mb-3 font-gujarati">
              {insights.best_field?.field || 'કારકિર્દી ક્ષેત્ર'}
            </h4>
            <p className="text-orange-100 leading-relaxed font-gujarati">
              {insights.best_field?.reasoning || 'તમારા વ્યક્તિત્વ અને કુશળતા મુજબ શ્રેષ્ઠ કારકિર્દી ક્ષેત્ર'}
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <h5 className="font-semibold mb-2 font-gujarati">અપેક્ષિત પગાર</h5>
              <p className="text-orange-100 font-gujarati">
                {insights.best_field?.salary_expectations || '₹3-8 લાખ/વર્ષ'}
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-2 font-gujarati">વૃદ્ધિ દર</h5>
              <p className="text-orange-100 font-gujarati">
                {insights.best_field?.growth_potential || '15-20% વાર્ષિક'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Career Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-8 border border-gray-200"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-6 font-gujarati flex items-center">
          <Target className="w-8 h-8 text-orange-500 mr-3" />
          કારકિર્દી વિકલ્પો
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {insights.career_recommendations?.slice(0, 6).map((option: any, index: number) => (
            <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2 font-gujarati">{option.job_role}</h4>
              <p className="text-gray-600 text-sm font-gujarati mb-3">{option.explanation}</p>
              <div className="flex items-center justify-between">
                <span className="text-orange-600 font-bold text-sm">
                  {option.growth_potential || 'ઉચ્ચ'}
                </span>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </div>
              <div className="mt-2">
                <span className="text-xs text-gray-500 font-gujarati">
                  {option.salary_range || 'પગાર શ્રેણી'}
                </span>
              </div>
            </div>
          )) || (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 font-gujarati">કારકિર્દી વિકલ્પો લોડ કરી રહ્યું છે...</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );

  const renderSkillsTab = () => (
    <div className="space-y-6">
      {/* Skills Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 border border-gray-200"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-6 font-gujarati flex items-center">
          <Target className="w-8 h-8 text-orange-500 mr-3" />
          કુશળતા વિશ્લેષણ
        </h3>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4 font-gujarati">મુખ્ય શક્તિઓ</h4>
            <div className="space-y-3">
              {insights.result_analysis?.strengths?.slice(0, 5).map((strength: any, index: number) => (
                <div key={index} className="flex items-start">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <div>
                    <span className="text-gray-900 font-semibold font-gujarati block">{strength.strength}</span>
                    <span className="text-gray-600 text-sm font-gujarati">{strength.career_application}</span>
                  </div>
                </div>
              )) || (
                <div className="text-gray-500 font-gujarati">શક્તિઓ લોડ કરી રહ્યું છે...</div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4 font-gujarati">વિકાસ ક્ષેત્રો</h4>
            <div className="space-y-3">
              {insights.result_analysis?.weaknesses?.slice(0, 5).map((weakness: any, index: number) => (
                <div key={index} className="flex items-start">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <div>
                    <span className="text-gray-900 font-semibold font-gujarati block">{weakness.weakness}</span>
                    <span className="text-gray-600 text-sm font-gujarati">{weakness.improvement_strategy}</span>
                  </div>
                </div>
              )) || (
                <div className="text-gray-500 font-gujarati">વિકાસ ક્ષેત્રો લોડ કરી રહ્યું છે...</div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Skill Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4 font-gujarati flex items-center">
          <Lightbulb className="w-6 h-6 text-blue-500 mr-3" />
          કુશળતા સૂચનાઓ
        </h3>
        
        <div className="space-y-6">
          {/* Technical Skills */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4 font-gujarati">તકનીકી કુશળતાઓ</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {insights.skill_recommendations?.technical_skills?.slice(0, 4).map((skill: any, index: number) => (
                <div key={index} className="bg-white rounded-xl p-4 border border-blue-100">
                  <h5 className="font-semibold text-gray-900 mb-2 font-gujarati">{skill.skill}</h5>
                  <p className="text-gray-600 text-sm font-gujarati mb-2">{skill.importance} મહત્વ</p>
                  <div className="text-xs text-gray-500">
                    {skill.learning_resources?.slice(0, 2).map((resource: string, idx: number) => (
                      <span key={idx} className="inline-block bg-gray-100 rounded px-2 py-1 mr-1 mb-1">
                        {resource}
                      </span>
                    ))}
                  </div>
                </div>
              )) || (
                <div className="col-span-full text-center py-4">
                  <p className="text-gray-500 font-gujarati">તકનીકી કુશળતાઓ લોડ કરી રહ્યું છે...</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Soft Skills */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4 font-gujarati">સોફ્ટ સ્કિલ્સ</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {insights.skill_recommendations?.soft_skills?.slice(0, 4).map((skill: any, index: number) => (
                <div key={index} className="bg-white rounded-xl p-4 border border-blue-100">
                  <h5 className="font-semibold text-gray-900 mb-2 font-gujarati">{skill.skill}</h5>
                  <p className="text-gray-600 text-sm font-gujarati mb-2">{skill.importance} મહત્વ</p>
                  <p className="text-xs text-gray-500 font-gujarati">{skill.development_approach}</p>
                </div>
              )) || (
                <div className="col-span-full text-center py-4">
                  <p className="text-gray-500 font-gujarati">સોફ્ટ સ્કિલ્સ લોડ કરી રહ્યું છે...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderRoadmapTab = () => (
    <div className="space-y-6">
      {/* Career Roadmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 border border-gray-200"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-6 font-gujarati flex items-center">
          <MapPin className="w-8 h-8 text-orange-500 mr-3" />
          કારકિર્દી રોડમેપ
        </h3>
        
        <div className="space-y-8">
          {/* Short Term */}
          {insights.roadmap?.short_term && (
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
              </div>
              <div className="ml-6 flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-2 font-gujarati">ટૂંકા ગાળાની યોજના</h4>
                <p className="text-gray-600 font-gujarati mb-3">{insights.roadmap.short_term.duration}</p>
                <div className="mb-4">
                  <h5 className="font-medium text-gray-800 mb-2 font-gujarati">લક્ષ્યો:</h5>
                  <ul className="list-disc list-inside text-gray-600 font-gujarati space-y-1">
                    {insights.roadmap.short_term.goals?.map((goal: string, idx: number) => (
                      <li key={idx}>{goal}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2">
                  {insights.roadmap.short_term.skills_to_develop?.map((skill: string, skillIndex: number) => (
                    <span key={skillIndex} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-gujarati">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Mid Term */}
          {insights.roadmap?.mid_term && (
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
              </div>
              <div className="ml-6 flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-2 font-gujarati">મધ્યમ ગાળાની યોજના</h4>
                <p className="text-gray-600 font-gujarati mb-3">{insights.roadmap.mid_term.duration}</p>
                <div className="mb-4">
                  <h5 className="font-medium text-gray-800 mb-2 font-gujarati">લક્ષ્યો:</h5>
                  <ul className="list-disc list-inside text-gray-600 font-gujarati space-y-1">
                    {insights.roadmap.mid_term.goals?.map((goal: string, idx: number) => (
                      <li key={idx}>{goal}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2">
                  {insights.roadmap.mid_term.skills_to_develop?.map((skill: string, skillIndex: number) => (
                    <span key={skillIndex} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-gujarati">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Long Term */}
          {insights.roadmap?.long_term && (
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
              </div>
              <div className="ml-6 flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-2 font-gujarati">લાંબા ગાળાની યોજના</h4>
                <p className="text-gray-600 font-gujarati mb-3">{insights.roadmap.long_term.duration}</p>
                <div className="mb-4">
                  <h5 className="font-medium text-gray-800 mb-2 font-gujarati">લક્ષ્યો:</h5>
                  <ul className="list-disc list-inside text-gray-600 font-gujarati space-y-1">
                    {insights.roadmap.long_term.goals?.map((goal: string, idx: number) => (
                      <li key={idx}>{goal}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2">
                  {insights.roadmap.long_term.expertise_areas?.map((area: string, skillIndex: number) => (
                    <span key={skillIndex} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-gujarati">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {(!insights.roadmap?.short_term && !insights.roadmap?.mid_term && !insights.roadmap?.long_term) && (
            <div className="text-center py-8">
              <p className="text-gray-500 font-gujarati">રોડમેપ લોડ કરી રહ્યું છે...</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Action Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4 font-gujarati flex items-center">
          <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
          તાત્કાલિક ક્રિયાઓ
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {insights.daily_habits?.slice(0, 6).map((habit: any, index: number) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-green-100">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 font-gujarati mb-1">{habit.habit}</h5>
                  <p className="text-gray-600 text-sm font-gujarati mb-2">{habit.purpose}</p>
                  <div className="text-xs text-gray-500 font-gujarati">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {habit.time_required}
                  </div>
                </div>
              </div>
            </div>
          )) || (
            <div className="col-span-full text-center py-4">
              <p className="text-gray-500 font-gujarati">દૈનિક આદતો લોડ કરી રહ્યું છે...</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white font-gujarati flex items-center">
                <Brain className="w-10 h-10 mr-4" />
                AI વિશ્લેષણ
              </h2>
              <p className="text-orange-100 mt-2 font-gujarati">
                તમારા {testType} પરિણામો પર આધારિત વ્યક્તિગત સૂચનાઓ
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(JSON.stringify(insights, null, 2), 'insights')}
                className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-xl transition-colors"
                title="કોપી કરો"
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  // Set unique filename for AI insights
                  const originalTitle = document.title;
                  const timestamp = new Date().toISOString().split('T')[0];
                  document.title = `AI_Career_Insights_${timestamp}.pdf`;
                  window.print();
                  setTimeout(() => { document.title = originalTitle; }, 1000);
                }}
                className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-xl transition-colors"
                title="પ્રિન્ટ કરો"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600 bg-orange-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'overview' && renderOverviewTab()}
              {activeTab === 'career' && renderCareerTab()}
              {activeTab === 'skills' && renderSkillsTab()}
              {activeTab === 'roadmap' && renderRoadmapTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ModernAIInsights;
