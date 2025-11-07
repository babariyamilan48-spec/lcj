import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Target, Star, TrendingUp, Award, Shield, Users } from 'lucide-react';

interface SVSResultsProps {
  calculatedResult: any;
  testResults: any;
}

const SVSResults: React.FC<SVSResultsProps> = ({ calculatedResult, testResults }) => {
  if (!calculatedResult || calculatedResult.type !== 'Schwartz Value Survey') return null;

  // Enhanced calculation validation
  const coreValues = calculatedResult.coreValues || [];
  const allValues = calculatedResult.allValues || [];
  const valueProfile = calculatedResult.valueProfile || '';
  
  // Calculate completion percentage
  const totalQuestions = Object.keys(testResults?.answers || {}).length;
  const completionRate = totalQuestions > 0 ? 100 : 0;

  const getValueIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'achievement': return <Award className="w-6 h-6" />;
      case 'power': return <TrendingUp className="w-6 h-6" />;
      case 'security': return <Shield className="w-6 h-6" />;
      case 'benevolence': return <Heart className="w-6 h-6" />;
      case 'universalism': return <Users className="w-6 h-6" />;
      default: return <Star className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Modern SVS Hero Section */}

      {/* Core Values Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coreValues.slice(0, 6).map((value: any, idx: number) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className={`rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 ${
              idx === 0 
                ? 'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300' 
                : 'bg-white border-orange-200'
            }`}
          >
            <div className="text-center">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                idx === 0 ? 'bg-gradient-to-r from-orange-500 to-primary text-white' : 'bg-orange-100 text-orange-600'
              }`}>
                {getValueIcon(value.type)}
              </div>
              
              <h3 className={`text-xl font-bold mb-2 capitalize ${
                idx === 0 ? 'text-orange-900' : 'text-orange-800'
              }`}>
                {value.type}
              </h3>
              
              <div className={`text-3xl font-bold mb-2 ${
                idx === 0 ? 'text-orange-700' : 'text-orange-600'
              }`}>
                {value.percentage}%
              </div>
              
              <p className="text-sm text-orange-700 mb-4 gujarati-text">{value.description}</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-orange-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    idx === 0 ? 'bg-gradient-to-r from-orange-500 to-primary' : 'bg-orange-500'
                  }`}
                  style={{ width: `${value.percentage}%` }}
                ></div>
              </div>
              
              {idx === 0 && (
                <div className="mt-3 inline-flex items-center px-3 py-1 bg-gradient-to-r from-orange-500 to-primary text-white text-xs rounded-full">
                  <Star className="w-3 h-3 mr-1" />
                  Primary Value
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* All Values Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-2xl p-8 border border-orange-200 shadow-lg"
      >
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-primary rounded-xl flex items-center justify-center mr-4">
            <Target className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Complete Value Profile</h3>
        </div>
        
        <div className="space-y-4">
          {allValues.map((value: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex items-center flex-1">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-primary rounded-lg flex items-center justify-center mr-4 text-white">
                  {getValueIcon(value.type)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 capitalize">{value.type}</h4>
                  <p className="text-sm text-gray-600 gujarati-text">{value.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-lg font-bold text-orange-700">{value.percentage}%</div>
                  <div className="text-xs text-orange-600">Score: {value.score}</div>
                </div>
                
                <div className="w-24 bg-orange-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-primary h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${value.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Value Profile Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white rounded-2xl p-8 border border-orange-200 shadow-lg"
      >
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-primary rounded-xl flex items-center justify-center mr-4">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Your Value Profile</h3>
        </div>
        
        <div className="bg-orange-50 rounded-xl p-6">
          <p className="text-gray-800 leading-relaxed gujarati-text">
            {valueProfile || `તમારા મુખ્ય મૂલ્યો ${coreValues.slice(0, 3).map((v: any) => v.type).join(', ')} છે, જે તમારા જીવનની પ્રાથમિકતાઓ દર્શાવે છે.`}
          </p>
        </div>
      </motion.div>

      {/* Test Completion Footer */}
    </div>
  );
};

export default SVSResults;
