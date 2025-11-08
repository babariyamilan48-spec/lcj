'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      category: 'સામાન્ય પ્રશ્નો',
      questions: [
        {
          question: 'જીવન પરિવર્તન યાત્રા શું છે?',
          answer: 'જીવન પરિવર્તન યાત્રા એક વ્યાપક કારકિર્દી માર્ગદર્શન પ્લેટફોર્મ છે જે વૈજ્ઞાનિક પરીક્ષણો અને AI આધારિત વિશ્લેષણ દ્વારા તમને તમારી સાચી કારકિર્દીની દિશા શોધવામાં મદદ કરે છે.'
        },
        {
          question: 'આ સેવા કોણ ઉપયોગ કરી શકે છે?',
          answer: 'આ સેવા વિદ્યાર્થીઓ, કામદારો, કારકિર્દી બદલવા ઇચ્છતા લોકો અને વ્યક્તિત્વ વિકાસમાં રસ ધરાવતા કોઈપણ વ્યક્તિ ઉપયોગ કરી શકે છે.'
        }
      ]
    },
    {
      category: 'પરીક્ષણો',
      questions: [
        {
          question: 'કયા પ્રકારના પરીક્ષણો ઉપલબ્ધ છે?',
          answer: 'અમે MBTI, Big Five, RIASEC, VARK, બહુવિધ બુદ્ધિમત્તા, નિર્ણય લેવાની શૈલી અને જીવન પરિસ્થિતિ મૂલ્યાંકન જેવા પરીક્ષણો પ્રદાન કરીએ છીએ.'
        },
        {
          question: 'પરીક્ષણો કેટલા સમયમાં પૂર્ણ થાય છે?',
          answer: 'દરેક પરીક્ષણ સરેરાશ 15-20 મિનિટમાં પૂર્ણ થાય છે. તમે તમારી સુવિધા અનુસાર વિરામ લઈ શકો છો.'
        },
        {
          question: 'શું પરીક્ષણો ચોક્કસ છે?',
          answer: 'અમારા પરીક્ષણો વૈજ્ઞાનિક રીતે માન્ય છે અને આંતરરાષ્ટ્રીય ધોરણો અનુસાર બનાવવામાં આવ્યા છે. તેઓ 85-90% ચોકસાઈ ધરાવે છે.'
        }
      ]
    },
    {
      category: 'AI રિપોર્ટ',
      questions: [
        {
          question: 'AI રિપોર્ટ કેવી રીતે બને છે?',
          answer: 'અમારી AI તમારા બધા પરીક્ષણ પરિણામોનું વિશ્લેષણ કરીને વ્યક્તિગત સલાહ, કારકિર્દી વિકલ્પો અને વિકાસ યોજના તૈયાર કરે છે.'
        },
        {
          question: 'AI રિપોર્ટ મેળવવા માટે કેટલા પરીક્ષણો જરૂરી છે?',
          answer: 'સંપૂર્ણ AI રિપોર્ટ મેળવવા માટે તમારે બધા 7 પરીક્ષણો પૂર્ણ કરવા જરૂરી છે.'
        }
      ]
    },
    {
      category: 'ખાતું અને સુરક્ષા',
      questions: [
        {
          question: 'મારી માહિતી સુરક્ષિત છે?',
          answer: 'હા, અમે તમારી બધી માહિતીને એન્ક્રિપ્ટેડ રાખીએ છીએ અને કોઈ ત્રીજા પક્ષ સાથે શેર કરતા નથી. અમે GDPR અને ડેટા સુરક્ષા નિયમોનું પાલન કરીએ છીએ.'
        },
        {
          question: 'શું હું મારું ખાતું ડિલીટ કરી શકું?',
          answer: 'હા, તમે કોઈપણ સમયે તમારું ખાતું અને બધી માહિતી ડિલીટ કરી શકો છો.'
        }
      ]
    }
  ];

  const toggleFAQ = (categoryIndex: number, questionIndex: number) => {
    const index = categoryIndex * 100 + questionIndex;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            વારંવાર પૂછાતા પ્રશ્નો
          </h1>
          <p className="text-xl text-gray-600">
            તમારા પ્રશ્નોના જવાબ અહીં મેળવો
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                <h2 className="text-xl font-bold text-blue-900">
                  {category.category}
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {category.questions.map((faq, questionIndex) => {
                  const index = categoryIndex * 100 + questionIndex;
                  const isOpen = openIndex === index;
                  
                  return (
                    <div key={questionIndex}>
                      <button
                        onClick={() => toggleFAQ(categoryIndex, questionIndex)}
                        className="w-full px-6 py-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {faq.question}
                          </h3>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 pb-4">
                          <p className="text-gray-600 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            તમારો પ્રશ્ન અહીં નથી?
          </h2>
          <p className="text-gray-600 mb-6">
            અમારી સપોર્ટ ટીમ તમારી મદદ કરવા તૈયાર છે
          </p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            સંપર્ક કરો
          </button>
        </div>
      </div>
    </div>
  );
}
