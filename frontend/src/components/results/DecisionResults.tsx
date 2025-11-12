import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Users, Clock, Target, TrendingUp, TrendingDown, Award } from 'lucide-react';

interface DecisionResultsProps {
  calculatedResult: any;
  testResults: any;
}

const DecisionResults: React.FC<DecisionResultsProps> = ({ calculatedResult, testResults }) => {
  console.log('🔍 DecisionResults: Received props:', { calculatedResult, testResults });
  
  if (!calculatedResult) {
    console.log('❌ DecisionResults: No calculatedResult provided');
    return null;
  }
  
  const isDecisionTest = calculatedResult.type?.includes('Decision') || 
                         calculatedResult.testType === 'decision' ||
                         testResults?.testId === 'decision';
                         
  if (!isDecisionTest) {
    console.log('❌ DecisionResults: Not a Decision test:', calculatedResult.type);
    return null;
  }
  
  console.log('✅ DecisionResults: Rendering Decision results');

  // Enhanced calculation validation
  const primaryStyle = calculatedResult.primaryStyle || {};
  const allStyles = calculatedResult.allStyles || [];
  const topStyles = calculatedResult.topStyles || allStyles.slice(0, 3);
  const profile = calculatedResult.profile || calculatedResult.profile_english || '';
  
  // Calculate completion percentage
  const totalQuestions = Object.keys(testResults?.answers || {}).length;
  const completionRate = totalQuestions > 0 ? 100 : 0;

  const getStyleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'rational': return <Brain className="w-6 h-6" />;
      case 'intuitive': return <Zap className="w-6 h-6" />;
      case 'dependent': return <Users className="w-6 h-6" />;
      case 'avoidant': return <Clock className="w-6 h-6" />;
      case 'spontaneous': return <TrendingUp className="w-6 h-6" />;
      default: return <Target className="w-6 h-6" />;
    }
  };

  const getStyleColor = (type: string, isPrimary: boolean = false) => {
    const colors = {
      rational: isPrimary ? 'from-blue-500 to-indigo-600' : 'from-blue-300 to-indigo-400',
      intuitive: isPrimary ? 'from-purple-500 to-violet-600' : 'from-purple-300 to-violet-400',
      dependent: isPrimary ? 'from-green-500 to-emerald-600' : 'from-green-300 to-emerald-400',
      avoidant: isPrimary ? 'from-red-500 to-pink-600' : 'from-red-300 to-pink-400',
      spontaneous: isPrimary ? 'from-yellow-500 to-orange-600' : 'from-yellow-300 to-orange-400'
    };
    return colors[type.toLowerCase() as keyof typeof colors] || 'from-gray-400 to-gray-500';
  };

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
          {/* Decision Making Styles */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Decision Styles</h3>
            </div>
            
            <div className="space-y-3">
              {allStyles.slice(0, 5).map((style: any, idx: number) => (
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

          {/* Decision Characteristics */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Decision Characteristics</h3>
            </div>
            
            <div className="space-y-3">
              {allStyles.slice(0, 3).map((style: any, idx: number) => (
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

          {/* Decision Strengths & Applications */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Decision Strengths & Applications</h3>
            </div>
            
            <div className="space-y-4">
              {/* Top 3 Decision Making Styles with Detailed Information */}
              {allStyles.slice(0, 3).map((style: any, idx: number) => (
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
                        Key Strengths
                      </p>
                      <div className="space-y-1">
                        {style.strengths?.slice(0, 4).map((strength: string, i: number) => (
                          <div key={i} className="text-xs text-gray-700 pl-4 border-l-2 border-green-200">
                            {strength}
                          </div>
                        )) || <div className="text-xs text-gray-500">No strengths available</div>}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        Areas to Watch
                      </p>
                      <div className="space-y-1">
                        {style.weaknesses?.slice(0, 3).map((weakness: string, i: number) => (
                          <div key={i} className="text-xs text-gray-700 pl-4 border-l-2 border-red-200">
                            {weakness}
                          </div>
                        )) || <div className="text-xs text-gray-500">No weaknesses listed</div>}
                      </div>
                    </div>
                  </div>

                  {/* Best Applications for each decision style */}
                  <div className="mt-3 bg-white/50 rounded-lg p-3 border border-orange-100">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Best Applications for {style.type} Style
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {style.suitableFor?.map((area: string, i: number) => (
                        <div key={i} className="bg-white rounded-lg p-2 border border-orange-200 text-center min-h-[2rem] flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700 break-words text-center leading-tight">{area}</span>
                        </div>
                      )) || <div className="text-xs text-gray-500">No applications available</div>}
                    </div>
                  </div>
                </div>
              ))}

              {/* Decision Making Tips */}
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Decision Making Tips
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Leverage Your Strengths:</p>
                    <div className="text-xs text-gray-600">
                      Use your {primaryStyle.type} approach when making important decisions, especially in situations that match your natural style.
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Balance Your Approach:</p>
                    <div className="text-xs text-gray-600">
                      Consider incorporating elements from other decision styles to make more well-rounded choices.
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                <h4 className="font-semibold text-gray-800 text-sm mb-1">Assessment Summary</h4>
                <p className="text-xs text-gray-600 gujarati-text">
                  Decision Making પરીક્ષણ તમારી નિર્ણય લેવાની પાંચ મુખ્ય શૈલીઓને માપે છે અને તમારા નિર્ણય લેવાની પ્રક્રિયાને સુધારવા માટે માર્ગદર્શન આપે છે.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default DecisionResults;
