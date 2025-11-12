import React from 'react';
import { motion } from 'framer-motion';
import { User, BarChart3, Briefcase, Star, Brain, TrendingUp, Award, Target } from 'lucide-react';

interface MBTIResultsProps {
  calculatedResult: any;
  testResults: any;
}

const MBTIResults: React.FC<MBTIResultsProps> = ({ calculatedResult, testResults }) => {
  console.log('🔍 MBTIResults: Received props:', { calculatedResult, testResults });
  
  // More flexible type checking
  if (!calculatedResult) {
    console.log('❌ MBTIResults: No calculatedResult provided');
    return null;
  }
  
  // Check if it's an MBTI test (more flexible)
  const isMBTITest = calculatedResult.type?.includes('MBTI') || 
                     calculatedResult.testType === 'mbti' ||
                     testResults?.testId === 'mbti';
                     
  if (!isMBTITest) {
    console.log('❌ MBTIResults: Not an MBTI test:', calculatedResult.type);
    return null;
  }
  
  console.log('✅ MBTIResults: Rendering MBTI results');

  // Enhanced calculation validation
  const mbtiCode = calculatedResult.code || 'XXXX';
  const dimensions = calculatedResult.dimensions || [];
  
  // MBTI-specific fields (prioritize new fields over legacy ones)
  const characteristics = calculatedResult.characteristics || [];
  const challenges = calculatedResult.challenges || [];
  const career_suggestions = calculatedResult.career_suggestions || [];
  const strengths = calculatedResult.strengths || [];
  
  // Legacy fields for backward compatibility
  const traits = calculatedResult.traits || [];
  const careers = calculatedResult.careers || [];
  
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
          {/* Personality Characteristics */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <Star className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Characteristics</h3>
              <p className="text-sm text-gray-600 ml-2 gujarati-text">લક્ષણો</p>
            </div>
            
            <div className="space-y-2">
              {(characteristics.length > 0 ? characteristics : traits).slice(0, 8).map((characteristic: string, idx: number) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="bg-orange-50 rounded-lg p-3 border border-orange-100 hover:bg-orange-100 transition-all duration-200"
                >
                  <span className="text-gray-800 font-medium text-sm gujarati-text block leading-relaxed">{characteristic}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Core Strengths */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Core Strengths</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {strengths.slice(0, 12).map((strength: string, idx: number) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="bg-orange-50 rounded-lg p-2 border border-orange-100 hover:bg-orange-100 transition-all duration-200 text-center"
                >
                  <span className="text-gray-800 font-medium text-xs gujarati-text block leading-tight">{strength}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Career Suggestions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-3">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Career Suggestions</h3>
              <p className="text-sm text-gray-600 ml-2 gujarati-text">કારકિર્દી સૂચનો</p>
            </div>
            
            <div className="space-y-2">
              {(career_suggestions.length > 0 ? career_suggestions : careers).slice(0, 8).map((career: string, idx: number) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="bg-orange-50 rounded-lg p-3 border border-orange-100 hover:bg-orange-100 transition-all duration-200"
                >
                  <span className="text-gray-800 font-semibold text-sm gujarati-text block leading-relaxed">{career}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Challenges Section - Only show if challenges data is available */}
        {challenges.length > 0 && (
          <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Areas for Growth</h3>
              <p className="text-sm text-gray-600 ml-2 gujarati-text">સુધારાના ક્ષેત્રો</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-3">
              {challenges.slice(0, 6).map((challenge: string, idx: number) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="bg-red-50 rounded-lg p-3 border border-red-100 hover:bg-red-100 transition-all duration-200"
                >
                  <span className="text-gray-800 font-medium text-sm gujarati-text block leading-relaxed">{challenge}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MBTIResults;
