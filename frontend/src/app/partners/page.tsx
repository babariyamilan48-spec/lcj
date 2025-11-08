'use client';

import React from 'react';
import { ExternalLink, Building, GraduationCap } from 'lucide-react';

export default function PartnersPage() {
  const partners = [
    {
      category: 'શૈક્ષણિક સંસ્થાઓ',
      icon: GraduationCap,
      organizations: [
        { name: 'IIT અમદાવાદ', type: 'સંશોધન સહયોગ' },
        { name: 'NIT સુરત', type: 'ઇન્ટર્નશિપ પ્રોગ્રામ' },
        { name: 'ગુજરાત યુનિવર્સિટી', type: 'કારકિર્દી માર્ગદર્શન' },
        { name: 'CEPT યુનિવર્સિટી', type: 'સ્ટુડન્ટ પ્લેસમેન્ટ' }
      ]
    },
    {
      category: 'કોર્પોરેટ પાર્ટનર્સ',
      icon: Building,
      organizations: [
        { name: 'TCS', type: 'HR કન્સલ્ટિંગ' },
        { name: 'Infosys', type: 'ટેલેન્ટ એસેસમેન્ટ' },
        { name: 'Wipro', type: 'એમ્પ્લોયી ડેવલપમેન્ટ' },
        { name: 'Reliance', type: 'કારકિર્દી પ્લાનિંગ' }
      ]
    },
    {
      category: 'ટેકનોલોજી પાર્ટનર્સ',
      icon: Building,
      organizations: [
        { name: 'Google Cloud', type: 'AI/ML ઇન્ફ્રાસ્ટ્રક્ચર' },
        { name: 'Microsoft Azure', type: 'ક્લાઉડ સર્વિસીસ' },
        { name: 'AWS', type: 'ડેટા સ્ટોરેજ' },
        { name: 'OpenAI', type: 'AI મોડેલ્સ' }
      ]
    }
  ];

  const benefits = [
    {
      title: 'વિશ્વસનીય પ્લેટફોર્મ',
      description: 'વૈજ્ઞાનિક રીતે માન્ય પરીક્ષણો અને AI આધારિત વિશ્લેષણ'
    },
    {
      title: 'સ્કેલેબલ સોલ્યુશન',
      description: 'હજારો વપરાશકર્તાઓ માટે એકસાથે સેવા પ્રદાન કરવાની ક્ષમતા'
    },
    {
      title: '24/7 સપોર્ટ',
      description: 'ટેકનિકલ અને એકેડેમિક સપોર્ટ ટીમ હંમેશા ઉપલબ્ધ'
    },
    {
      title: 'કસ્ટમાઇઝેશન',
      description: 'તમારી સંસ્થાની જરૂરિયાત અનુસાર સેવાઓનું અનુકૂલન'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            અમારા પાર્ટનર્સ
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            અમે ગર્વથી વિશ્વની અગ્રણી સંસ્થાઓ સાથે સહયોગ કરીએ છીએ
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {partners.map((category, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <category.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {category.category}
                </h3>
              </div>

              <div className="space-y-4">
                {category.organizations.map((org, orgIndex) => (
                  <div key={orgIndex} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900">{org.name}</h4>
                    <p className="text-sm text-gray-600">{org.type}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            પાર્ટનરશિપના ફાયદા
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              શૈક્ષણિક સંસ્થાઓ માટે
            </h3>
            <p className="text-gray-600 mb-6">
              તમારા વિદ્યાર્થીઓને બેહતર કારકિર્દી માર્ગદર્શન આપવા માટે અમારી સાથે જોડાઓ
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                બલ્ક એસેસમેન્ટ ડિસ્કાઉન્ટ
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                કસ્ટમ રિપોર્ટિંગ ડેશબોર્ડ
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                ફેકલ્ટી ટ્રેનિંગ પ્રોગ્રામ
              </li>
            </ul>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              પાર્ટનર બનો
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              કોર્પોરેટ પાર્ટનર્સ માટે
            </h3>
            <p className="text-gray-600 mb-6">
              તમારા કર્મચારીઓના વિકાસ અને રિટેન્શન માટે અમારી સેવાઓનો લાભ લો
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                એમ્પ્લોયી એંગેજમેન્ટ સર્વે
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                લીડરશિપ ડેવલપમેન્ટ
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                ટીમ બિલ્ડિંગ એસેસમેન્ટ
              </li>
            </ul>
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
              સંપર્ક કરો
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
