'use client';

import React from 'react';
import { BarChart3, Users, BookOpen, Award } from 'lucide-react';

export default function ResearchPage() {
  const researchAreas = [
    {
      icon: BarChart3,
      title: 'વ્યક્તિત્વ વિશ્લેષણ સંશોધન',
      description: 'MBTI, Big Five અને અન્ય વ્યક્તિત્વ મોડેલ્સ પર આધારિત સંશોધન',
      publications: 15
    },
    {
      icon: Users,
      title: 'કારકિર્દી વિકાસ અભ્યાસ',
      description: 'કારકિર્દીની પસંદગી અને વ્યાવસાયિક સફળતા પર સંશોધન',
      publications: 12
    },
    {
      icon: BookOpen,
      title: 'શિક્ષણ મનોવિજ્ઞાન',
      description: 'શીખવાની શૈલીઓ અને શૈક્ષણિક પ્રદર્શન પર અભ્યાસ',
      publications: 8
    },
    {
      icon: Award,
      title: 'AI અને મશીન લર્નિંગ',
      description: 'વ્યક્તિત્વ પૂર્વાનુમાન માટે AI અલ્ગોરિધમ્સનો વિકાસ',
      publications: 6
    }
  ];

  const publications = [
    {
      title: 'Personality Assessment in Digital Age: A Comprehensive Study',
      authors: 'Dr. Amit Patel, Dr. Priya Shah',
      journal: 'Journal of Career Development',
      year: 2024
    },
    {
      title: 'Machine Learning Approaches to Career Guidance',
      authors: 'Dr. Raj Kumar, Dr. Meera Joshi',
      journal: 'AI in Education Review',
      year: 2024
    },
    {
      title: 'Cultural Adaptation of Personality Tests in Indian Context',
      authors: 'Dr. Suresh Mehta, Dr. Kavita Sharma',
      journal: 'Indian Psychology Journal',
      year: 2023
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            સંશોધન અને વિકાસ
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            વ્યક્તિત્વ વિશ્લેષણ અને કારકિર્દી માર્ગદર્શનમાં અત્યાધુનિક સંશોધન
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {researchAreas.map((area, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <area.icon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {area.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {area.publications} પ્રકાશનો
                  </p>
                </div>
              </div>
              
              <p className="text-gray-600">
                {area.description}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            તાજેતરના પ્રકાશનો
          </h2>
          
          <div className="space-y-6">
            {publications.map((pub, index) => (
              <div key={index} className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {pub.title}
                </h3>
                <p className="text-gray-600 mb-1">
                  {pub.authors}
                </p>
                <p className="text-sm text-gray-500">
                  {pub.journal} • {pub.year}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            સંશોધન સહયોગ
          </h2>
          <p className="text-gray-600 mb-6">
            અમારી સાથે સંશોધન પ્રોજેક્ટ્સમાં ભાગ લેવા માટે સંપર્ક કરો
          </p>
          <button className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
            સંપર્ક કરો
          </button>
        </div>
      </div>
    </div>
  );
}
