'use client';

import React from 'react';
import { Calendar, User, ArrowRight } from 'lucide-react';

export default function BlogPage() {
  const posts = [
    {
      title: 'કારકિર્દીની સાચી દિશા કેવી રીતે શોધવી',
      excerpt: 'તમારી રુચિઓ અને કુશળતાઓ આધારે યોગ્ય કારકિર્દીની પસંદગી કરવાના ટિપ્સ',
      author: 'Dr. Amit Patel',
      date: '8 નવેમ્બર, 2024',
      image: '/api/placeholder/400/250'
    },
    {
      title: 'વ્યક્તિત્વ પરીક્ષણોનું મહત્વ',
      excerpt: 'MBTI અને Big Five પરીક્ષણો તમારા વ્યક્તિત્વ વિશે શું જણાવે છે',
      author: 'Dr. Priya Shah',
      date: '5 નવેમ્બર, 2024',
      image: '/api/placeholder/400/250'
    },
    {
      title: 'AI અને કારકિર્દી માર્ગદર્શન',
      excerpt: 'કૃત્રિમ બુદ્ધિમત્તા કેવી રીતે કારકિર્દીના નિર્ણયોમાં મદદ કરે છે',
      author: 'Dr. Raj Kumar',
      date: '2 નવેમ્બર, 2024',
      image: '/api/placeholder/400/250'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            બ્લોગ
          </h1>
          <p className="text-xl text-gray-600">
            કારકિર્દી અને વ્યક્તિત્વ વિકાસ પર લેખો
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <article key={index} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600"></div>
              
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {post.title}
                </h2>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {post.author}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {post.date}
                  </div>
                </div>
                
                <button className="flex items-center text-blue-600 hover:text-blue-700 font-semibold">
                  વધુ વાંચો
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            વધુ લેખો લોડ કરો
          </button>
        </div>
      </div>
    </div>
  );
}
