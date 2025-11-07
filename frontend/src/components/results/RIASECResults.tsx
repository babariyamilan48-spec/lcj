import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Target, Users, Wrench, Search, Palette, Heart, TrendingUp, Building, Star, BarChart3, TrendingDown } from 'lucide-react';

interface RIASECResultsProps {
  calculatedResult: any;
  testResults: any;
}

const RIASECResults: React.FC<RIASECResultsProps> = ({ calculatedResult, testResults }) => {
  if (!calculatedResult || calculatedResult.type !== 'RIASEC Career Interest') return null;

  // Enhanced calculation validation
  const hollandCode = calculatedResult.hollandCode || 'XXX';
  const interests = calculatedResult.interests || [];
  const allInterests = calculatedResult.allInterests || interests;
  const careers = calculatedResult.careers || [];
  const profile = calculatedResult.profile || '';
  const primaryInterest = allInterests[0] || { type: 'realistic', percentage: 0 };
  
  // Calculate completion percentage
  const totalQuestions = Object.keys(testResults?.answers || {}).length;
  const completionRate = totalQuestions > 0 ? 100 : 0;

  const getInterestIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'realistic': return <Wrench className="w-6 h-6" />;
      case 'investigative': return <Search className="w-6 h-6" />;
      case 'artistic': return <Palette className="w-6 h-6" />;
      case 'social': return <Heart className="w-6 h-6" />;
      case 'enterprising': return <TrendingUp className="w-6 h-6" />;
      case 'conventional': return <Building className="w-6 h-6" />;
      default: return <Target className="w-6 h-6" />;
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
          {/* Interest Types */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Interest Types</h3>
            </div>
            
            <div className="space-y-3">
              {allInterests.slice(0, 6).map((interest: any, idx: number) => (
                <div key={idx} className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {getInterestIcon(interest.type)}
                      <span className="text-sm font-semibold text-gray-800 ml-2 capitalize">{interest.type}</span>
                    </div>
                    <span className="text-xs font-bold text-orange-600">{interest.percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{interest.level}</span>
                    <div className="w-16 bg-orange-200 rounded-full h-1">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-primary h-1 rounded-full"
                        style={{ width: `${interest.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interest Characteristics */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Interest Characteristics</h3>
            </div>
            
            <div className="space-y-3">
              {allInterests.slice(0, 3).map((interest: any, idx: number) => (
                <div key={idx} className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-orange-600 mr-2" />
                      <span className="text-sm font-medium text-gray-800 capitalize">{interest.type}</span>
                    </div>
                    <span className="text-xs font-bold text-orange-600">{interest.percentage}%</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 gujarati-text">{interest.description}</p>
                  <div className="space-y-1">
                    {interest.characteristics?.slice(0, 3).map((char: string, i: number) => (
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

          {/* Career Guidance & Work Environment */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Career Guidance & Environment</h3>
            </div>
            
            <div className="space-y-4">
              {/* Top 3 Career Interest Types with Detailed Information */}
              {allInterests.slice(0, 3).map((interest: any, idx: number) => (
                <div key={idx} className={`${idx === 0 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200' : 'bg-orange-50 border-orange-100'} rounded-xl p-4 border`}>
                  <div className="flex items-center mb-3">
                    {getInterestIcon(interest.type)}
                    <h4 className="font-bold text-gray-800 text-base ml-2 capitalize">
                      {idx === 0 ? `${interest.type} Interest (${interest.percentage}%)` : 
                       idx === 1 ? `${interest.type} (${interest.percentage}%)` :
                       `${interest.type} (${interest.percentage}%)`}
                    </h4>
                  </div>
                  
                  <div className="grid md:grid-cols-1 gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Work Environment
                      </p>
                      <div className="space-y-1">
                        {(() => {
                          const workEnv = interest.workEnvironment;
                          if (typeof workEnv === 'string') {
                            // Split by comma and display each environment
                            return workEnv.split(',').slice(0, 4).map((env: string, i: number) => (
                              <div key={i} className="text-xs text-gray-700 pl-4 border-l-2 border-green-200">
                                {env.trim()}
                              </div>
                            ));
                          } else if (Array.isArray(workEnv)) {
                            // Handle array format
                            return workEnv.slice(0, 4).map((env: string, i: number) => (
                              <div key={i} className="text-xs text-gray-700 pl-4 border-l-2 border-green-200">
                                {env}
                              </div>
                            ));
                          } else {
                            return <div className="text-xs text-gray-500">No work environment data available</div>;
                          }
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Career Suggestions for each interest type */}
                  <div className="mt-3 bg-white/50 rounded-lg p-3 border border-orange-100">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Career Suggestions for {interest.type} Interest
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {interest.careerSuggestions?.slice(0, 6).map((career: string, i: number) => (
                        <div key={i} className="bg-white rounded-lg p-2 border border-orange-200 text-center">
                          <span className="text-xs font-medium text-gray-700">{career}</span>
                        </div>
                      )) || <div className="text-xs text-gray-500">No career suggestions available</div>}
                    </div>
                  </div>
                </div>
              ))}

              {/* Holland Code Summary */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Your Holland Code: {hollandCode}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {hollandCode.split('').map((letter: string, i: number) => (
                    <div key={i} className="bg-white rounded-lg p-2 border border-orange-200 text-center">
                      <div className="text-sm font-bold text-orange-600">{letter}</div>
                      <div className="text-xs text-gray-600">{allInterests.find((int: any) => int.type.charAt(0).toUpperCase() === letter)?.type || ''}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                <h4 className="font-semibold text-gray-800 text-sm mb-1">Assessment Summary</h4>
                <p className="text-xs text-gray-600 gujarati-text">
                  RIASEC પરીક્ષણ તમારી છ મુખ્ય કારકિર્દી રુચિઓને માપે છે અને તમારા વ્યાવસાયિક વિકાસ માટે માર્ગદર્શન આપે છે.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default RIASECResults;
