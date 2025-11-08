'use client';

import React from 'react';
import { MapPin, Clock, Users, ArrowRight } from 'lucide-react';

export default function CareersPage() {
  const openings = [
    {
      title: 'સીનિયર ફ્રન્ટએન્ડ ડેવલપર',
      department: 'ટેકનોલોજી',
      location: 'અમદાવાદ / રિમોટ',
      type: 'ફુલ-ટાઇમ',
      experience: '3-5 વર્ષ',
      description: 'React, Next.js અને TypeScript માં અનુભવ ધરાવતા ડેવલપરની જરૂર છે'
    },
    {
      title: 'ડેટા સાયન્ટિસ્ટ',
      department: 'AI/ML',
      location: 'મુંબઈ / હાઇબ્રિડ',
      type: 'ફુલ-ટાઇમ',
      experience: '2-4 વર્ષ',
      description: 'મશીન લર્નિંગ અને સ્ટેટિસ્ટિકલ એનાલિસિસમાં નિષ્ણાત'
    },
    {
      title: 'કારકિર્દી કાઉન્સેલર',
      department: 'કાઉન્સેલિંગ',
      location: 'દિલ્હી / ઓન-સાઇટ',
      type: 'ફુલ-ટાઇમ',
      experience: '5+ વર્ષ',
      description: 'મનોવિજ્ઞાન અથવા કાઉન્સેલિંગમાં માસ્ટર ડિગ્રી જરૂરી'
    },
    {
      title: 'UI/UX ડિઝાઇનર',
      department: 'ડિઝાઇન',
      location: 'બેંગલોર / રિમોટ',
      type: 'ફુલ-ટાઇમ',
      experience: '2-3 વર્ષ',
      description: 'Figma, Adobe XD અને પ્રોટોટાઇપિંગ ટૂલ્સમાં અનુભવ'
    }
  ];

  const benefits = [
    'સ્વાસ્થ્ય વીમો અને મેડિકલ બેનિફિટ્સ',
    'લર્નિંગ અને ડેવલપમેન્ટ બજેટ',
    'ફ્લેક્સિબલ વર્કિંગ અવર્સ',
    'રિમોટ વર્ક ઓપ્શન',
    'પરફોર્મન્સ બોનસ',
    'ટીમ આઉટિંગ અને ઇવેન્ટ્સ'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            કારકિર્દીની તકો
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            અમારી સાથે જોડાઓ અને લાખો લોકોના જીવનમાં સકારાત્મક પરિવર્તન લાવો
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              ખુલ્લી જગ્યાઓ
            </h2>
            
            <div className="space-y-6">
              {openings.map((job, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {job.department}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {job.location}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {job.type}
                        </div>
                      </div>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {job.experience}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    {job.description}
                  </p>
                  
                  <button className="flex items-center text-blue-600 hover:text-blue-700 font-semibold">
                    વિગતો જુઓ
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                કેમ અમારી સાથે કામ કરો?
              </h3>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-600 text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                તમારી જગ્યા નથી દેખાતી?
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                અમે હંમેશા પ્રતિભાશાળી લોકોને શોધીએ છીએ. તમારું રેઝ્યુમે મોકલો.
              </p>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                રેઝ્યુમે મોકલો
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            અમારી કંપની કલ્ચર
          </h2>
          <p className="text-gray-600 mb-6 max-w-3xl mx-auto">
            અમે એક સહયોગી, સમાવેશી અને નવીનતાથી ભરપૂર વાતાવરણમાં કામ કરીએ છીએ જ્યાં દરેક વ્યક્તિનો વિકાસ અને સફળતા માટે સપોર્ટ મળે છે.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-600">ટીમ મેમ્બર્સ</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-gray-600">એમ્પ્લોયી સેટિસ્ફેક્શન</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">4.8</div>
              <div className="text-gray-600">ગ્લાસડોર રેટિંગ</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
