import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Ear, BookOpen, Hand, Target, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface VARKResultsProps {
  calculatedResult: any;
  testResults: any;
}

const VARKResults: React.FC<VARKResultsProps> = ({ calculatedResult, testResults }) => {
  console.log('🔍 VARKResults: Received props:', { calculatedResult, testResults });
  
  // More flexible type checking
  if (!calculatedResult) {
    console.log('❌ VARKResults: No calculatedResult provided');
    return null;
  }
  
  // Check if it's a VARK test (more flexible)
  const isVARKTest = calculatedResult.type?.includes('VARK') || 
                     calculatedResult.testType === 'vark' ||
                     testResults?.testId === 'vark';
                     
  if (!isVARKTest) {
    console.log('❌ VARKResults: Not a VARK test:', calculatedResult.type);
    return null;
  }
  
  console.log('✅ VARKResults: Rendering VARK results');

  // Enhanced calculation validation
  const primaryStyle = calculatedResult.primaryStyle || {};
  const allStyles = calculatedResult.allStyles || [];
  const topStyles = calculatedResult.topStyles || allStyles.slice(0, 3);
  const profile = calculatedResult.profile || calculatedResult.profile_english || '';

  // VARK detailed data mapping - fallback configuration
  const varkDetailedData = {
    visual: {
      learningStrategies: [
        "માઇન્ડ મેપ્સ બનાવો",
        "કલરફુલ હાઇલાઇટર વાપરો", 
        "ડાયાગ્રામ અને ચાર્ટ બનાવો",
        "વિડિયો અને ઇમેજ જુઓ"
      ],
      studyTips: [
        "વિઝ્યુઅલ એઇડ્સ વાપરો",
        "નોટ્સમાં રંગો વાપરો",
        "ગ્રાફિક ઓર્ગેનાઇઝર બનાવો"
      ],
      careerSuggestions: [
        "ગ્રાફિક ડિઝાઇનર",
        "આર્કિટેક્ટ", 
        "ફોટોગ્રાફર",
        "કલાકાર",
        "એન્જિનિયર"
      ]
    },
    auditory: {
      learningStrategies: [
        "લેક્ચર અને પોડકાસ્ટ સાંભળો",
        "ગ્રુપ ડિસ્કશન કરો",
        "જોરથી વાંચો",
        "રેકોર્ડિંગ બનાવો"
      ],
      studyTips: [
        "ઓડિયો બુક્સ સાંભળો",
        "સ્ટડી ગ્રુપ જોઇન કરો",
        "રિપીટ અને રિહર્સલ કરો"
      ],
      careerSuggestions: [
        "શિક્ષક",
        "કાઉન્સેલર",
        "રેડિયો જોકી",
        "સંગીતકાર",
        "વકીલ"
      ]
    },
    readwrite: {
      learningStrategies: [
        "વિસ્તૃત નોટ્સ લખો",
        "સમરી અને આઉટલાઇન બનાવો",
        "બુક્સ અને આર્ટિકલ વાંચો",
        "એસે અને રિપોર્ટ લખો"
      ],
      studyTips: [
        "હેન્ડરાઇટિંગ નોટ્સ લો",
        "મલ્ટિપલ ટાઇમ્સ રીરાઇટ કરો",
        "બુલેટ પોઇન્ટ્સ વાપરો"
      ],
      careerSuggestions: [
        "લેખક",
        "પત્રકાર",
        "એડિટર",
        "લાઇબ્રેરિયન",
        "રિસર્ચર"
      ]
    },
    reading: {
      learningStrategies: [
        "વિસ્તૃત નોટ્સ લખો",
        "સમરી અને આઉટલાઇન બનાવો",
        "બુક્સ અને આર્ટિકલ વાંચો",
        "એસે અને રિપોર્ટ લખો"
      ],
      studyTips: [
        "હેન્ડરાઇટિંગ નોટ્સ લો",
        "મલ્ટિપલ ટાઇમ્સ રીરાઇટ કરો",
        "બુલેટ પોઇન્ટ્સ વાપરો"
      ],
      careerSuggestions: [
        "લેખક",
        "પત્રકાર",
        "એડિટર",
        "લાઇબ્રેરિયન",
        "રિસર્ચર"
      ]
    },
    kinesthetic: {
      learningStrategies: [
        "હેન્ડ્સ-ઓન એક્ટિવિટી કરો",
        "પ્રેક્ટિકલ એક્સપેરિમેન્ટ કરો",
        "મૂવમેન્ટ સાથે અભ્યાસ કરો",
        "મોડેલ અને ઓબ્જેક્ટ વાપરો"
      ],
      studyTips: [
        "વૉકિંગ કરતા અભ્યાસ કરો",
        "બ્રેક લેતા રહો",
        "ફિઝિકલ એક્ટિવિટી કરો"
      ],
      careerSuggestions: [
        "એન્જિનિયર",
        "ડૉક્ટર",
        "એથ્લેટ",
        "શેફ",
        "મિકેનિક"
      ]
    }
  };

  // Enhance styles with detailed data
  const enhancedStyles = allStyles.map((style: any) => ({
    ...style,
    ...varkDetailedData[(style.type && typeof style.type === 'string' ? style.type.toLowerCase() : 'visual') as keyof typeof varkDetailedData] || {}
  }));

  const getStyleIcon = (type: string) => {
    if (!type || typeof type !== 'string') return <Eye className="w-6 h-6" />;
    switch (type.toLowerCase()) {
      case 'visual': return <Eye className="w-6 h-6" />;
      case 'aural': 
      case 'auditory': return <Ear className="w-6 h-6" />;
      case 'read-write':
      case 'reading/writing': return <BookOpen className="w-6 h-6" />;
      case 'kinesthetic': return <Hand className="w-6 h-6" />;
      default: return <Target className="w-6 h-6" />;
    }
  };

  const getStyleColor = (type: string, isPrimary: boolean = false) => {
    const baseColors = {
      visual: isPrimary ? 'from-teal-500 to-cyan-600' : 'from-teal-300 to-cyan-400',
      aural: isPrimary ? 'from-blue-500 to-indigo-600' : 'from-blue-300 to-indigo-400',
      'read-write': isPrimary ? 'from-green-500 to-emerald-600' : 'from-green-300 to-emerald-400',
      kinesthetic: isPrimary ? 'from-purple-500 to-violet-600' : 'from-purple-300 to-violet-400'
    };
    return baseColors[(type && typeof type === 'string' ? type.toLowerCase() : 'visual') as keyof typeof baseColors] || 'from-gray-400 to-gray-500';
  };

  // Calculate completion percentage
  const totalQuestions = Object.keys(testResults?.answers || {}).length;
  const completionRate = totalQuestions > 0 ? 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative bg-gradient-to-br from-orange-50 via-white to-orange-100 rounded-3xl p-8 border border-orange-200 shadow-xl overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-orange-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-primary rounded-full blur-2xl"></div>
      </div>
      
      <div className="relative">

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Learning Styles */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Learning Styles</h3>
            </div>
            
            <div className="space-y-3">
              {enhancedStyles.slice(0, 4).map((style: any, idx: number) => (
                <div key={idx} className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {getStyleIcon(style.type)}
                      <span className="text-sm font-semibold text-gray-800 ml-2 capitalize">{style.type}</span>
                    </div>
                    <span className="text-xs font-bold text-orange-600">{style.percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{style.level}</span>
                    <div className="w-16 bg-orange-200 rounded-full h-1">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-primary h-1 rounded-full"
                        style={{ width: `${style.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Characteristics */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Learning Characteristics</h3>
            </div>
            
            <div className="space-y-3">
              {enhancedStyles.slice(0, 3).map((style: any, idx: number) => (
                <div key={idx} className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-orange-600 mr-2" />
                      <span className="text-sm font-medium text-gray-800 capitalize">{style.type}</span>
                    </div>
                    <span className="text-xs font-bold text-orange-600">{style.percentage}%</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 gujarati-text">{style.description}</p>
                  <div className="space-y-1">
                    {style.characteristics?.slice(0, 3).map((char: string, i: number) => (
                      <div key={i} className="flex items-center text-xs text-gray-700">
                        <div className="w-1 h-1 bg-orange-500 rounded-full mr-2"></div>
                        <span>{char}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Strategies & Study Tips */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Learning Strategies & Study Tips</h3>
            </div>
            
            <div className="space-y-4">
              {/* Top 3 Learning Styles with Detailed Information */}
              {enhancedStyles.slice(0, 3).map((style: any, idx: number) => (
                <div key={idx} className={`${idx === 0 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200' : 'bg-orange-50 border-orange-100'} rounded-xl p-4 border`}>
                  <div className="flex items-center mb-3">
                    {getStyleIcon(style.type)}
                    <h4 className="font-bold text-gray-800 text-base ml-2 capitalize">
                      {idx === 0 ? `${style.type} (${style.percentage}%)` : 
                       idx === 1 ? `${style.type} (${style.percentage}%)` :
                       `${style.type} (${style.percentage}%)`}
                    </h4>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Learning Strategies
                      </p>
                      <div className="space-y-1">
                        {style.learningStrategies?.slice(0, 4).map((strategy: string, i: number) => (
                          <div key={i} className="text-xs text-gray-700 pl-4 border-l-2 border-green-200">
                            {strategy}
                          </div>
                        )) || <div className="text-xs text-gray-500">No strategies available</div>}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Study Tips
                      </p>
                      <div className="space-y-1">
                        {style.studyTips?.slice(0, 3).map((tip: string, i: number) => (
                          <div key={i} className="text-xs text-gray-700 pl-4 border-l-2 border-blue-200">
                            {tip}
                          </div>
                        )) || <div className="text-xs text-gray-500">No tips available</div>}
                      </div>
                    </div>
                  </div>

                  {/* Career Suggestions for each learning style */}
                  <div className="mt-3 bg-white/50 rounded-lg p-3 border border-orange-100">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      Career Suggestions for {style.type} Learners
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {style.careerSuggestions?.map((career: string, i: number) => (
                        <div key={i} className="bg-white rounded-lg p-2 border border-orange-200 text-center min-h-[2rem] flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700 break-words text-center leading-tight">{career}</span>
                        </div>
                      )) || <div className="text-xs text-gray-500">No career suggestions available</div>}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                <h4 className="font-semibold text-gray-800 text-sm mb-1">Assessment Summary</h4>
                <p className="text-xs text-gray-600 gujarati-text">
                  VARK પરીક્ષણ તમારી ચાર મુખ્ય શીખવાની શૈલીઓને માપે છે અને તમારા શીખવાના સૌથી અસરકારક માર્ગો સૂચવે છે.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default VARKResults;
