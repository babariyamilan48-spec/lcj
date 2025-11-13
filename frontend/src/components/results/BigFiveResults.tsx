import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';

interface BigFiveResultsProps {
  calculatedResult: any;
  testResults: any;
}

const BigFiveResults: React.FC<BigFiveResultsProps> = ({ calculatedResult, testResults }) => {
  console.log('🔍 BigFiveResults: Received props:', { calculatedResult, testResults });
  
  if (!calculatedResult) {
    console.log('❌ BigFiveResults: No calculatedResult provided');
    return null;
  }
  
  const isBigFiveTest = calculatedResult.type?.includes('Big Five') || 
                        calculatedResult.testType === 'bigfive' ||
                        testResults?.testId === 'bigfive';
                        
  if (!isBigFiveTest) {
    console.log('❌ BigFiveResults: Not a Big Five test:', calculatedResult.type);
    return null;
  }
  
  console.log('✅ BigFiveResults: Rendering Big Five results');

  // Enhanced calculation validation
  const dimensions = calculatedResult.dimensions || [];
  const profile = calculatedResult.profile || '';
  const summary = calculatedResult.summary || '';
  
  // Calculate completion percentage
  const totalQuestions = Object.keys(testResults?.answers || {}).length;
  const completionRate = totalQuestions > 0 ? 100 : 0;

  const getTraitIcon = (level: string) => {
    if (!level || typeof level !== 'string') {
      return <Minus className="w-4 h-4" />;
    }
    
    switch (level.toLowerCase()) {
      case 'ઉચ્ચ':
      case 'high':
        return <TrendingUp className="w-4 h-4" />;
      case 'નીચું':
      case 'low':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
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
          {/* Big Five Traits */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Personality Traits</h3>
            </div>
            
            <div className="space-y-3">
              {dimensions.slice(0, 5).map((trait: any, idx: number) => (
                <div key={idx} className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {getTraitIcon(trait.level)}
                      <span className="text-sm font-semibold text-gray-800 ml-2 capitalize">{trait.trait}</span>
                    </div>
                    <span className="text-xs font-bold text-orange-600">{trait.percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{trait.level}</span>
                    <div className="w-16 bg-orange-200 rounded-full h-1">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-primary h-1 rounded-full"
                        style={{ width: `${trait.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Personality Characteristics */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Personality Characteristics</h3>
            </div>
            
            <div className="space-y-3">
              {dimensions.slice(0, 3).map((trait: any, idx: number) => (
                <div key={idx} className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-orange-600 mr-2" />
                      <span className="text-sm font-medium text-gray-800 capitalize">{trait.trait}</span>
                    </div>
                    <span className="text-xs font-bold text-orange-600">{trait.percentage}%</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 gujarati-text">{trait.description}</p>
                  <div className="space-y-1">
                    {trait.highTraits?.slice(0, 3).map((highTrait: string, i: number) => (
                      <div key={i} className="flex items-center text-xs text-gray-700">
                        <div className="w-1 h-1 bg-orange-500 rounded-full mr-2"></div>
                        <span>{highTrait}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Personality Insights & Career Guidance */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Personality Insights & Career Guidance</h3>
            </div>
            
            <div className="space-y-4">
              {/* Top 3 Personality Traits with Detailed Information */}
              {dimensions.slice(0, 3).map((trait: any, idx: number) => (
                <div key={idx} className={`${idx === 0 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200' : 'bg-orange-50 border-orange-100'} rounded-xl p-4 border`}>
                  <div className="flex items-center mb-3">
                    {getTraitIcon(trait.level)}
                    <h4 className="font-bold text-gray-800 text-base ml-2 capitalize">
                      {idx === 0 ? `${trait.trait} (${trait.percentage}%)` : 
                       idx === 1 ? `${trait.trait} (${trait.percentage}%)` :
                       `${trait.trait} (${trait.percentage}%)`}
                    </h4>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Key Traits
                      </p>
                      <div className="space-y-1">
                        {trait.highTraits?.slice(0, 4).map((traitItem: string, i: number) => (
                          <div key={i} className="text-xs text-gray-700 pl-4 border-l-2 border-green-200">
                            {traitItem}
                          </div>
                        )) || <div className="text-xs text-gray-500">No traits available</div>}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Career Areas
                      </p>
                      <div className="space-y-1">
                        {trait.careerSuggestions?.high?.slice(0, 4).map((career: string, i: number) => (
                          <div key={i} className="text-xs text-gray-700 pl-4 border-l-2 border-blue-200">
                            {career}
                          </div>
                        )) || <div className="text-xs text-gray-500">No career suggestions available</div>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Top Personality Strengths Summary */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Your Top Personality Strengths
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {dimensions.slice(0, 3).filter((d: any) => d.percentage >= 60).map((trait: any, i: number) => (
                    <div key={i} className="bg-white rounded-lg p-2 border border-orange-200 text-center">
                      <div className="text-xs font-medium text-gray-700 capitalize">{trait.trait}</div>
                      <div className="text-xs text-orange-600 font-bold">{trait.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Development Areas */}
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  Development Opportunities
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Areas to Strengthen:</p>
                    <div className="text-xs text-gray-600">
                      {dimensions.filter((d: any) => d.percentage < 50).slice(0, 2).map((d: any) => d.trait).join(', ') || 'Continue developing all areas'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Growth Potential:</p>
                    <div className="text-xs text-gray-600">
                      Focus on balancing your natural strengths with developing complementary skills.
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                <h4 className="font-semibold text-gray-800 text-sm mb-1">Assessment Summary</h4>
                <p className="text-xs text-gray-600 gujarati-text">
                  {summary || 'Big Five પરીક્ષણ તમારા વ્યક્તિત્વના પાંચ મુખ્ય પરિમાણોને માપે છે અને તમારી વ્યક્તિગત અને વ્યાવસાયિક વિકાસ માટે માર્ગદર્શન આપે છે.'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default BigFiveResults;
