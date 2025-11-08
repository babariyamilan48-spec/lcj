'use client';

import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            ગોપનીયતા નીતિ
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                માહિતી સંગ્રહ
              </h2>
              <p className="text-gray-600 mb-4">
                અમે તમારી વ્યક્તિગત માહિતીને સુરક્ષિત રાખવા માટે પ્રતિબદ્ધ છીએ. અમે ફક્ત તે માહિતી એકત્રિત કરીએ છીએ જે અમારી સેવાઓ પ્રદાન કરવા માટે જરૂરી છે.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                ડેટા ઉપયોગ
              </h2>
              <p className="text-gray-600 mb-4">
                તમારી માહિતીનો ઉપયોગ ફક્ત કારકિર્દી માર્ગદર્શન અને વ્યક્તિત્વ વિશ્લેષણ સેવાઓ પ્રદાન કરવા માટે થાય છે.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                ડેટા સુરક્ષા
              </h2>
              <p className="text-gray-600 mb-4">
                અમે તમારી માહિતીને સુરક્ષિત રાખવા માટે ઉદ્યોગ-માનક સુરક્ષા પગલાં અપનાવીએ છીએ.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                સંપર્ક
              </h2>
              <p className="text-gray-600">
                ગોપનીયતા સંબંધિત કોઈ પ્રશ્નો હોય તો કૃપા કરીને અમારો સંપર્ક કરો.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
