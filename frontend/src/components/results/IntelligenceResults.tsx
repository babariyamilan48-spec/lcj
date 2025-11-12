import React from 'react';
import { motion } from 'framer-motion';
import { Brain, BarChart3, Star, Target, TrendingUp, TrendingDown } from 'lucide-react';

interface IntelligenceResultsProps {
  calculatedResult: any;
  testResults: any;
}

const IntelligenceResults: React.FC<IntelligenceResultsProps> = ({ calculatedResult, testResults }) => {
  console.log('🔍 IntelligenceResults: Received props:', { calculatedResult, testResults });
  
  if (!calculatedResult) {
    console.log('❌ IntelligenceResults: No calculatedResult provided');
    return null;
  }
  
  const isIntelligenceTest = calculatedResult.type?.includes('Intelligence') || 
                             calculatedResult.testType === 'intelligence' ||
                             testResults?.testId === 'intelligence';
                             
  if (!isIntelligenceTest) {
    console.log('❌ IntelligenceResults: Not an Intelligence test:', calculatedResult.type);
    return null;
  }
  
  console.log('✅ IntelligenceResults: Rendering Intelligence results');

  // Enhanced calculation validation
  const dominantType = calculatedResult.dominantType || 'Unknown';
  const topIntelligences = calculatedResult.topIntelligences || [];
  const allIntelligences = calculatedResult.allIntelligences || [];
  const profile = calculatedResult.profile || '';
  const primaryIntelligence = allIntelligences[0] || { type: dominantType, percentage: 0 };
  
  // Calculate completion percentage
  const totalQuestions = Object.keys(testResults?.answers || {}).length;
  const completionRate = totalQuestions > 0 ? 100 : 0;

  const getIntelligenceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'linguistic': return <Brain className="w-6 h-6" />;
      case 'logical': return <BarChart3 className="w-6 h-6" />;
      case 'spatial': return <Star className="w-6 h-6" />;
      case 'musical': return <Brain className="w-6 h-6" />;
      case 'bodily-kinesthetic': return <TrendingUp className="w-6 h-6" />;
      case 'interpersonal': return <Target className="w-6 h-6" />;
      case 'intrapersonal': return <Brain className="w-6 h-6" />;
      case 'naturalistic': return <Star className="w-6 h-6" />;
      default: return <Brain className="w-6 h-6" />;
    }
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
          {/* Intelligence Types */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Intelligence Types</h3>
            </div>
            
            <div className="space-y-3">
              {allIntelligences.slice(0, 8).map((intel: any, idx: number) => (
                <div key={idx} className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {getIntelligenceIcon(intel.type)}
                      <span className="text-sm font-semibold text-gray-800 ml-2 capitalize">{intel.type.replace('-', ' ')}</span>
                    </div>
                    <span className="text-xs font-bold text-orange-600">{intel.percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{intel.level}</span>
                    <div className="w-16 bg-orange-200 rounded-full h-1">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-primary h-1 rounded-full"
                        style={{ width: `${intel.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Intelligence Characteristics */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Intelligence Characteristics</h3>
            </div>
            
            <div className="space-y-3">
              {allIntelligences.slice(0, 3).map((intel: any, idx: number) => (
                <div key={idx} className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-orange-600 mr-2" />
                      <span className="text-sm font-medium text-gray-800 capitalize">{intel.type.replace('-', ' ')}</span>
                    </div>
                    <span className="text-xs font-bold text-orange-600">{intel.percentage}%</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 gujarati-text">{intel.description}</p>
                  <div className="space-y-1">
                    {intel.characteristics?.slice(0, 3).map((char: string, i: number) => (
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

          {/* Intelligence Strengths & Career Guidance */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Strengths & Career Guidance</h3>
            </div>
            
            <div className="space-y-4">
              {/* Top 3 Intelligence Types with Detailed Information */}
              {allIntelligences.slice(0, 3).map((intel: any, idx: number) => (
                <div key={idx} className={`${idx === 0 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200' : 'bg-orange-50 border-orange-100'} rounded-xl p-4 border`}>
                  <div className="flex items-center mb-3">
                    {getIntelligenceIcon(intel.type)}
                    <h4 className="font-bold text-gray-800 text-base ml-2 capitalize">
                      {idx === 0 ? `${intel.type?.replace('-', ' ')} Intelligence (${intel.percentage}%)` : 
                       idx === 1 ? `Secondary: ${intel.type?.replace('-', ' ')} (${intel.percentage}%)` :
                       `Third: ${intel.type?.replace('-', ' ')} (${intel.percentage}%)`}
                    </h4>
                  </div>
                  
                  <div className="grid md:grid-cols-1 gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Key Strengths
                      </p>
                      <div className="space-y-1">
                        {intel.strengths?.slice(0, 4).map((strength: string, i: number) => (
                          <div key={i} className="text-xs text-gray-700 pl-4 border-l-2 border-green-200">
                            {strength}
                          </div>
                        )) || <div className="text-xs text-gray-500">No strengths available</div>}
                      </div>
                    </div>
                  </div>

                  {/* Career Suggestions for each intelligence type */}
                  <div className="mt-3 bg-white/50 rounded-lg p-3 border border-orange-100">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Career Suggestions for {intel.type?.replace('-', ' ')} Intelligence
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {intel.careerSuggestions?.slice(0, 6).map((career: string, i: number) => (
                        <div key={i} className="bg-white rounded-lg p-2 border border-orange-200 text-center">
                          <span className="text-xs font-medium text-gray-700">{career}</span>
                        </div>
                      )) || <div className="text-xs text-gray-500">No career suggestions available</div>}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                <h4 className="font-semibold text-gray-800 text-sm mb-1">Assessment Summary</h4>
                <p className="text-xs text-gray-600 gujarati-text">
                  Multiple Intelligence પરીક્ષણ તમારી આઠ મુખ્ય બુદ્ધિ પ્રકારોને માપે છે અને તમારા શીખવા અને કારકિર્દીના વિકાસ માટે માર્ગદર્શન આપે છે.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default IntelligenceResults;
