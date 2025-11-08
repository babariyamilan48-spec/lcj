'use client';

import React from 'react';
import { BookOpen, Compass, Lightbulb, Users } from 'lucide-react';

export default function GuidancePage() {
  const guidanceAreas = [
    {
      icon: Compass,
      title: 'કારકિર્દી માર્ગદર્શન',
      description: 'તમારી રુચિઓ અને કુશળતા આધારિત કારકિર્દીના વિકલ્પો શોધો',
      features: ['વ્યાવસાયિક મૂલ્યાંકન', 'કૌશલ્ય વિકાસ', 'ઉદ્યોગ માર્ગદર્શન']
    },
    {
      icon: BookOpen,
      title: 'શિક્ષણ માર્ગદર્શન',
      description: 'યોગ્ય અભ્યાસક્રમ અને શૈક્ષણિક માર્ગ પસંદ કરવામાં મદદ',
      features: ['કોર્સ પસંદગી', 'કોલેજ માર્ગદર્શન', 'સ્કોલરશિપ માહિતી']
    },
    {
      icon: Lightbulb,
      title: 'વ્યક્તિત્વ વિકાસ',
      description: 'તમારા વ્યક્તિત્વની મજબૂતીઓ અને સુધારાના ક્ષેત્રો ઓળખો',
      features: ['સ્વ-જાગૃતિ', 'લીડરશિપ સ્કિલ્સ', 'કોમ્યુનિકેશન']
    },
    {
      icon: Users,
      title: 'સામાજિક કુશળતા',
      description: 'અસરકારક સંવાદ અને ટીમવર્ક કુશળતા વિકસાવો',
      features: ['ટીમવર્ક', 'નેટવર્કિંગ', 'કોન્ફ્લિક્ટ રિઝોલ્યુશન']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            માર્ગદર્શન સેવાઓ
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            તમારી કારકિર્દી અને વ્યક્તિત્વ વિકાસ માટે વ્યાપક માર્ગદર્શન
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {guidanceAreas.map((area, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <area.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {area.title}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                {area.description}
              </p>
              
              <ul className="space-y-2">
                {area.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            વ્યક્તિગત માર્ગદર્શન મેળવો
          </h2>
          <p className="text-gray-600 mb-6">
            અમારા નિષ્ણાતો સાથે વન-ઓન-વન સેશન બુક કરો
          </p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            સેશન બુક કરો
          </button>
        </div>
      </div>
    </div>
  );
}
