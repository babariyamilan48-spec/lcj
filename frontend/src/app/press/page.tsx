'use client';

import React from 'react';
import { Calendar, Download, ExternalLink, Award } from 'lucide-react';

export default function PressPage() {
  const pressReleases = [
    {
      title: 'જીવન પરિવર્તન યાત્રા પ્લેટફોર્મે 1 લાખ વપરાશકર્તાઓનો આંક પાર કર્યો',
      date: '8 નવેમ્બર, 2024',
      summary: 'કારકિર્દી માર્ગદર્શન પ્લેટફોર્મ માત્ર 6 મહિનામાં 1 લાખ વપરાશકર્તાઓ સુધી પહોંચ્યું',
      link: '#'
    },
    {
      title: 'AI આધારિત કારકિર્દી કાઉન્સેલિંગમાં નવી સફળતા',
      date: '25 ઓક્ટોબર, 2024',
      summary: 'અમારી AI ટેકનોલોજીએ કારકિર્દી પૂર્વાનુમાનમાં 92% ચોકસાઈ હાંસલ કરી',
      link: '#'
    },
    {
      title: 'ગુજરાત સરકાર સાથે MOU પર હસ્તાક્ષર',
      date: '15 ઓક્ટોબર, 2024',
      summary: 'રાજ્યના તમામ સરકારી કોલેજોમાં કારકિર્દી માર્ગદર્શન સેવા પ્રદાન કરવા માટે સમજૂતી',
      link: '#'
    }
  ];

  const mediaKit = [
    { name: 'કંપની લોગો (PNG)', size: '2.5 MB' },
    { name: 'કંપની લોગો (SVG)', size: '1.2 MB' },
    { name: 'પ્રોડક્ટ સ્ક્રીનશોટ્સ', size: '15.3 MB' },
    { name: 'ટીમ ફોટોઝ', size: '8.7 MB' },
    { name: 'કંપની બ્રોશર', size: '4.1 MB' }
  ];

  const awards = [
    {
      title: 'બેસ્ટ EdTech સ્ટાર્ટઅપ 2024',
      organization: 'ઇન્ડિયા EdTech એવોર્ડ્સ',
      year: '2024'
    },
    {
      title: 'ઇનોવેશન ઇન AI એવોર્ડ',
      organization: 'ટેક ઇન્ડિયા સમિટ',
      year: '2024'
    },
    {
      title: 'સોશિયલ ઇમ્પેક્ટ એવોર્ડ',
      organization: 'ગુજરાત ચેમ્બર ઓફ કોમર્સ',
      year: '2023'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            પ્રેસ અને મીડિયા
          </h1>
          <p className="text-xl text-gray-600">
            અમારી સાથે જોડાયેલી તાજી ખબરો અને અપડેટ્સ
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              પ્રેસ રિલીઝ
            </h2>
            
            <div className="space-y-6">
              {pressReleases.map((release, index) => (
                <article key={index} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4 mr-2" />
                    {release.date}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {release.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    {release.summary}
                  </p>
                  
                  <a 
                    href={release.link}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    સંપૂર્ણ વાર્તા વાંચો
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                મીડિયા કિટ
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                લોગો, ફોટોઝ અને અન્ય બ્રાન્ડ એસેટ્સ ડાઉનલોડ કરો
              </p>
              
              <div className="space-y-3">
                {mediaKit.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.size}</div>
                    </div>
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-500" />
                પુરસ્કારો
              </h3>
              
              <div className="space-y-4">
                {awards.map((award, index) => (
                  <div key={index} className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-semibold text-gray-900 text-sm">{award.title}</h4>
                    <p className="text-xs text-gray-600">{award.organization}</p>
                    <p className="text-xs text-gray-500">{award.year}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            મીડિયા સંપર્ક
          </h2>
          <p className="text-gray-600 mb-6">
            પ્રેસ અને મીડિયા પૂછપરછ માટે અમારો સંપર્ક કરો
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-2">પ્રિયા શાહ</h3>
              <p className="text-sm text-gray-600 mb-1">PR & Communications Head</p>
              <p className="text-sm text-blue-600">press@jivanparivartan.com</p>
              <p className="text-sm text-gray-600">+91 98765 43210</p>
            </div>
            
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-2">રાજ કુમાર</h3>
              <p className="text-sm text-gray-600 mb-1">Marketing Director</p>
              <p className="text-sm text-blue-600">media@jivanparivartan.com</p>
              <p className="text-sm text-gray-600">+91 87654 32109</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
