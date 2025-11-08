'use client';

import React, { useState } from 'react';
import { Search, HelpCircle, MessageCircle, Mail, Phone } from 'lucide-react';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      question: 'પરીક્ષણો કેટલા સમયમાં પૂર્ણ થાય છે?',
      answer: 'દરેક પરીક્ષણ સરેરાશ 15-20 મિનિટમાં પૂર્ણ થાય છે. તમે તમારી સુવિધા અનુસાર વિરામ લઈ શકો છો.'
    },
    {
      question: 'પરિણામો કેટલા ચોક્કસ છે?',
      answer: 'અમારા પરીક્ષણો વૈજ્ઞાનિક રીતે માન્ય છે અને 85-90% ચોકસાઈ ધરાવે છે.'
    },
    {
      question: 'શું હું પરીક્ષણ ફરીથી લઈ શકું?',
      answer: 'હા, તમે 30 દિવસ પછી પરીક્ષણ ફરીથી લઈ શકો છો.'
    },
    {
      question: 'મારી માહિતી સુરક્ષિત છે?',
      answer: 'હા, અમે તમારી બધી માહિતીને એન્ક્રિપ્ટેડ રાખીએ છીએ અને કોઈ ત્રીજા પક્ષ સાથે શેર કરતા નથી.'
    },
    {
      question: 'AI રિપોર્ટ કેવી રીતે કામ કરે છે?',
      answer: 'અમારી AI તમારા બધા પરીક્ષણ પરિણામોનું વિશ્લેષણ કરીને વ્યક્તિગત સલાહ અને કારકિર્દી માર્ગદર્શન પ્રદાન કરે છે.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            સહાય કેન્દ્ર
          </h1>
          <p className="text-xl text-gray-600">
            તમારા પ્રશ્નોના જવાબ અહીં મેળવો
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="પ્રશ્ન શોધો..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <HelpCircle className="w-6 h-6 mr-2 text-blue-600" />
              વારંવાર પૂછાતા પ્રશ્નો
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredFaqs.map((faq, index) => (
              <div key={index} className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Options */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              લાઈવ ચેટ
            </h3>
            <p className="text-gray-600 mb-4">
              તુરંત સહાય માટે અમારી ટીમ સાથે ચેટ કરો
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              ચેટ શરૂ કરો
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ઈમેઈલ સપોર્ટ
            </h3>
            <p className="text-gray-600 mb-4">
              વિગતવાર સહાય માટે ઈમેઈલ મોકલો
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              ઈમેઈલ મોકલો
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ફોન સપોર્ટ
            </h3>
            <p className="text-gray-600 mb-4">
              સોમવારથી શુક્રવાર, 9 AM - 6 PM
            </p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              કૉલ કરો
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
