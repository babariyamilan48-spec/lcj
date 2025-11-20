'use client';

import React from 'react';

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            સેવા વિતરણ નીતિ
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            છેલ્લે અપડેટ: {new Date().toLocaleDateString('gu-IN')}
          </p>
          
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                1. પરીક્ષણ સેવા વિશે
              </h2>
              <p className="text-gray-600 mb-4">
                આ પ્લેટફોર્મ મુક્ત અને પ્રીમિયમ પરીક્ષણ સેવાઓ પ્રદાન કરે છે જેમાં વ્યક્તિત્વ પરીક્ષણ, બુદ્ધિ પરીક્ષણ, કારકિર્દી મૂલ્યાંકન અને વ્યાપક વિશ્લેષણ શામેલ છે. આ સેવાઓ તાત્ક્ષણિક ઓનલાઈન ઍક્સેસ દ્વારા પ્રદાન કરવામાં આવે છે.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                2. તાત્ક્ષણિક ઍક્સેસ
              </h2>
              <p className="text-gray-600 mb-4">
                પરીક્ષણ પૂર્ણ કર્યા પછી, તમે તમારા પરિણામો તરત જ ઍક્સેસ કરી શકો છો. કોઈ વિલંબ નથી, કોઈ પ્રતીક્ષા નથી.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>તાત્ક્ષણિક પરિણામ - પરીક્ષણ પૂર્ણ પછી તરત જ</li>
                <li>24/7 ઍક્સેસ - કોઈપણ સમયે ફરી ઍક્સેસ કરો</li>
                <li>કોઈ ડાઉનલોડ આવશ્યક નથી</li>
                <li>તમામ ઉપકરણોથી ઍક્સેસ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                3. પરીક્ષણ પરિણામો
              </h2>
              <p className="text-gray-600 mb-4">
                તમે પરીક્ષણ પૂર્ણ કર્યા પછી વિગતવાર પરિણામો મેળવો છો:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>વ્યક્તિગત પરિણામ વિશ્લેષણ</li>
                <li>કારકિર્દી સુझાવો</li>
                <li>વ્યાપક અહેવાલ</li>
                <li>PDF ડાઉનલોડ વિકલ્પ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                4. ટેકનિકલ આવશ્યકતાઓ
              </h2>
              <p className="text-gray-600 mb-4">
                પરીક્ષણો લેવા માટે તમને આવશ્યક છે:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>ઇન્ટરનેટ કનેક્શન</li>
                <li>વેબ બ્રાઉઝર (Chrome, Firefox, Safari, Edge)</li>
                <li>વર્તમાન ઓપરેટિંગ સિસ્ટમ</li>
                <li>JavaScript સક્ષમ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                5. પરીક્ષણ સમય
              </h2>
              <p className="text-gray-600 mb-4">
                વિવિધ પરીક્ષણોનો સમય:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>MBIT પરીક્ષણ: 15-20 મિનિટ</li>
                <li>બુદ્ધિ પરીક્ષણ: 20-30 મિનિટ</li>
                <li>RIASEC પરીક્ષણ: 10-15 મિનિટ</li>
                <li>Big Five પરીક્ષણ: 15-20 મિનિટ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                6. પરીક્ષણ ઇતિહાસ
              </h2>
              <p className="text-gray-600 mb-4">
                તમે તમારા તમામ પરીક્ષણ ઇતિહાસ ઍક્સેસ કરી શકો છો. તમે કોઈપણ સમયે તમારા પૂર્વ પરિણામો જોઈ શકો છો.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                7. ડેટા સુરક્ષા
              </h2>
              <p className="text-gray-600 mb-4">
                તમારી તમામ પરીક્ષણ માહિતી સુરક્ષિત અને એનક્રિપ્ટેડ છે. આપણે તમારી ગોપનીયતા સુરક્ષિત રાખીએ છીએ.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                8. ટેકનિકલ સમસ્યાઓ
              </h2>
              <p className="text-gray-600 mb-4">
                જો તમને પરીક્ષણ લેવામાં સમસ્યા આવે છે, તો કૃપા કરીને આપણો સપોર્ટ ટીમ સાથે સંપર્ક કરો.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                9. પરીક્ષણ ફોર્મેટ
              </h2>
              <p className="text-gray-600 mb-4">
                પરીક્ષણ પરિણામો વિવિધ ફોર્મેટમાં ઉપલબ્ધ છે:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>ઓનલાઈન ડેશબોર્ડ</li>
                <li>PDF અહેવાલ</li>
                <li>ઇમેલ સારાંશ</li>
                <li>વ્યક્તિગત પ્રોફાઇલ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                10. સંપર્ક કરો
              </h2>
              <p className="text-gray-600">
                સેવા વિતરણ સંબંધિત કોઈ પ્રશ્નો હોય તો કૃપા કરીને અમારો સપોર્ટ ટીમ સાથે સંપર્ક કરો.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              આ નીતિ કોઈપણ સમયે પરિવર્તન કરી શકાય છે. છેલ્લું અપડેટ: {new Date().toLocaleDateString('gu-IN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
