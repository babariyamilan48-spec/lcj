'use client';

import React from 'react';
import { Linkedin, Mail, Twitter } from 'lucide-react';

export default function TeamPage() {
  const teamMembers = [
    {
      name: 'Dr. અમિત પટેલ',
      role: 'મુખ્ય મનોવિજ્ઞાની',
      bio: 'વ્યક્તિત્વ વિશ્લેષણ અને કારકિર્દી માર્ગદર્શનમાં 15+ વર્ષનો અનુભવ',
      image: '/api/placeholder/300/300',
      social: {
        linkedin: '#',
        email: 'amit@example.com',
        twitter: '#'
      }
    },
    {
      name: 'Dr. પ્રિયા શાહ',
      role: 'AI સંશોધન વિભાગ વડા',
      bio: 'મશીન લર્નિંગ અને મનોવિજ્ઞાનમાં નિષ્ણાત, IIT અને MIT થી શિક્ષણ',
      image: '/api/placeholder/300/300',
      social: {
        linkedin: '#',
        email: 'priya@example.com',
        twitter: '#'
      }
    },
    {
      name: 'રાજ કુમાર',
      role: 'ટેકનિકલ લીડ',
      bio: 'ફુલ-સ્ટેક ડેવલપમેન્ટ અને ક્લાઉડ આર્કિટેક્ચરમાં નિષ્ણાત',
      image: '/api/placeholder/300/300',
      social: {
        linkedin: '#',
        email: 'raj@example.com',
        twitter: '#'
      }
    },
    {
      name: 'મીરા જોશી',
      role: 'UX/UI ડિઝાઇનર',
      bio: 'વપરાશકર્તા અનુભવ અને ઇન્ટરફેસ ડિઝાઇનમાં 8+ વર્ષનો અનુભવ',
      image: '/api/placeholder/300/300',
      social: {
        linkedin: '#',
        email: 'meera@example.com',
        twitter: '#'
      }
    },
    {
      name: 'સુરેશ મહેતા',
      role: 'ડેટા સાયન્ટિસ્ટ',
      bio: 'સ્ટેટિસ્ટિકલ એનાલિસિસ અને પ્રેડિક્ટિવ મોડલિંગમાં નિષ્ણાત',
      image: '/api/placeholder/300/300',
      social: {
        linkedin: '#',
        email: 'suresh@example.com',
        twitter: '#'
      }
    },
    {
      name: 'કવિતા શર્મા',
      role: 'કન્ટેન્ટ સ્ટ્રેટેજિસ્ટ',
      bio: 'શૈક્ષણિક કન્ટેન્ટ અને કારકિર્દી માર્ગદર્શન સામગ્રી વિકાસમાં નિષ્ણાત',
      image: '/api/placeholder/300/300',
      social: {
        linkedin: '#',
        email: 'kavita@example.com',
        twitter: '#'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            અમારી ટીમ
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            અનુભવી નિષ્ણાતોની ટીમ જે તમારી કારકિર્દીની સફળતા માટે સમર્પિત છે
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="h-64 bg-gradient-to-br from-blue-400 to-purple-500"></div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-blue-600 font-semibold mb-3">
                  {member.role}
                </p>
                <p className="text-gray-600 mb-4 text-sm">
                  {member.bio}
                </p>
                
                <div className="flex space-x-3">
                  <a 
                    href={member.social.linkedin}
                    className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    <Linkedin className="w-4 h-4 text-blue-600" />
                  </a>
                  <a 
                    href={`mailto:${member.social.email}`}
                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-gray-600" />
                  </a>
                  <a 
                    href={member.social.twitter}
                    className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    <Twitter className="w-4 h-4 text-blue-400" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            અમારી સાથે જોડાઓ
          </h2>
          <p className="text-gray-600 mb-6">
            તમે પણ લોકોના જીવનમાં સકારાત્મક પરિવર્તન લાવવા માંગો છો?
          </p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            કારકિર્દીની તકો જુઓ
          </button>
        </div>
      </div>
    </div>
  );
}
