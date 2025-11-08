'use client';

import React from 'react';
import { CheckCircle, Users, Brain, Target } from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      icon: Users,
      title: 'નોંધણી કરો',
      description: 'સરળ નોંધણી પ્રક્રિયા દ્વારા તમારું એકાઉન્ટ બનાવો'
    },
    {
      icon: Brain,
      title: 'પરીક્ષણો લો',
      description: 'વિવિધ વ્યક્તિત્વ અને કારકિર્દી પરીક્ષણો પૂર્ણ કરો'
    },
    {
      icon: Target,
      title: 'પરિણામો મેળવો',
      description: 'AI આધારિત વિશ્લેષણ અને વ્યક્તિગત સલાહ પ્રાપ્ત કરો'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            તે કેવી રીતે કામ કરે છે
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            અમારું પ્લેટફોર્મ તમને તમારી કારકિર્દીના સાચા રસ્તે લઈ જવા માટે વૈજ્ઞાનિક પદ્ધતિઓનો ઉપયોગ કરે છે
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            અમારી સેવાઓ
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">વ્યક્તિત્વ વિશ્લેષણ</h3>
                <p className="text-gray-600">MBTI, Big Five અને અન્ય વૈજ્ઞાનિક પરીક્ષણો</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">કારકિર્દી માર્ગદર્શન</h3>
                <p className="text-gray-600">તમારી રુચિઓ અને કુશળતા આધારિત સલાહ</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">AI આંતરદૃષ્ટિ</h3>
                <p className="text-gray-600">કૃત્રિમ બુદ્ધિમત્તા દ્વારા વ્યક્તિગત સલાહ</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">પ્રગતિ ટ્રેકિંગ</h3>
                <p className="text-gray-600">તમારી કારકિર્દીની પ્રગતિનું નિરીક્ષણ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
