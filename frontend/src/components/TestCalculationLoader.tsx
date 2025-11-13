import React from 'react';
import { RefreshCw, Brain, Target, Award } from 'lucide-react';

interface TestCalculationLoaderProps {
  title?: string;
  message?: string;
  showProgressSteps?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

const TestCalculationLoader: React.FC<TestCalculationLoaderProps> = ({
  title = "Calculating Your Results",
  message = "Processing your answers and generating personalized insights...",
  showProgressSteps = false,
  variant = 'default'
}) => {
  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-slate-600 font-medium">{title}</p>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="space-y-6">
        {/* Main Loading Header */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-white animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-600 mb-4">{message}</p>
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>

        {/* Progress Steps */}
        {showProgressSteps && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: 'Analyzing Responses', color: 'blue' },
              { icon: Target, title: 'Generating Insights', color: 'purple' },
              { icon: Award, title: 'Preparing Results', color: 'indigo' }
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="text-center">
                    <div className={`w-12 h-12 bg-${step.color}-100 rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <Icon className={`w-6 h-6 text-${step.color}-600 animate-pulse`} />
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-2">{step.title}</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-${step.color}-500 h-2 rounded-full animate-pulse`}
                        style={{ width: `${(i + 1) * 33}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center max-w-md">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-8 h-8 text-white animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 mb-4">{message}</p>
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  );
};

export default TestCalculationLoader;
