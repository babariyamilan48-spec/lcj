'use client';

import React from 'react';

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            શરતો અને શરતો
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            છેલ્લે અપડેટ: {new Date().toLocaleDateString('gu-IN')}
          </p>
          
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                1. સેવાની શરતો
              </h2>
              <p className="text-gray-600 mb-4">
                આ પ્લેટફોર્મ વ્યક્તિત્વ પરીક્ષણ, બુદ્ધિ મૂલ્યાંકન અને કારકિર્દી માર્ગદર્શન સેવાઓ પ્રદાન કરે છે. આ સેવાઓનો ઉપયોગ કરીને, તમે આ શરતોને સ્વીકાર કરો છો.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                2. ખાતો અને પંજીકરણ
              </h2>
              <p className="text-gray-600 mb-4">
                તમે સેવાઓ ઍક્સેસ કરવા માટે એક ખાતો બનાવવો આવશ્યક છે. તમે સાચી અને સંપૂર્ણ માહિતી પ્રદાન કરવા માટે જવાબદાર છો.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>તમે 13 વર્ષ અથવા તેથી વધુ હોવા જોઈએ</li>
                <li>તમે સાચી માહિતી પ્રદાન કરવા માટે સંમત છો</li>
                <li>તમે તમારા ખાતાની ગોપનીયતા જાળવી રાખવા માટે જવાબદાર છો</li>
                <li>તમે તમારા પાસવર્ડ સુરક્ષિત રાખવા માટે જવાબદાર છો</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                3. પરીક્ષણ ઉપયોગ
              </h2>
              <p className="text-gray-600 mb-4">
                આ પ્લેટફોર્મ પર પરીક્ષણો માર્ગદર્શન અને આત્ম-મૂલ્યાંકન હેતુ માટે છે.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>તમે માત્ર તમારા પોતાના ઉપયોગ માટે પરીક્ષણો લઈ શકો છો</li>
                <li>તમે બીજાને તમારા ખાતા વાપર કરવા દઈ શકતા નથી</li>
                <li>તમે પરીક્ષણ પ્રશ્નો શેર કરી શકતા નથી</li>
                <li>તમે પરીક્ષણ સામગ્રી વેચી શકતા નથી</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                4. પરીક્ષણ પરિણામો
              </h2>
              <p className="text-gray-600 mb-4">
                પરીક્ષણ પરિણામો માર્ગદર્શન હેતુ માટે છે, વ્યાવસાયિક સલાહ નથી.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>પરિણામો આત્ম-મૂલ્યાંકન માટે છે</li>
                <li>તમે તમારા નિર્ણયો માટે જવાબદાર છો</li>
                <li>આપણે વ્યાવસાયિક સલાહ આપતા નથી</li>
                <li>વ્યાવસાયિક સલાહ માટે વકીલ સાથે સંપર્ક કરો</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                5. બૌદ્ધિક સંપત્તિ
              </h2>
              <p className="text-gray-600 mb-4">
                આ પ્લેટફોર્મ પર તમામ પરીક્ષણ સામગ્રી આપણી બૌદ્ધિક સંપત્તિ છે.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>તમે માત્ર તમારા ઉપયોગ માટે ઍક્સેસ કરી શકો છો</li>
                <li>તમે સામગ્રી કૉપી કરી શકતા નથી</li>
                <li>તમે સામગ્રી વહેંચી શકતા નથી</li>
                <li>તમે સામગ્રી વેચી શકતા નથી</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                6. ખાતા ઍક્સેસ
              </h2>
              <p className="text-gray-600 mb-4">
                તમે તમારા ખાતાથી તમામ પરીક્ષણ અને પરિણામો ઍક્સેસ કરી શકો છો.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>ઍક્સેસ ફક્ત તમારા માટે છે</li>
                <li>તમે બીજાને ખાતો ઍક્સેસ આપી શકતા નથી</li>
                <li>તમે તમારા ખાતા શેર કરી શકતા નથી</li>
                <li>તમે તમારા ખાતા વેચી શકતા નથી</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                7. ગોપનીયતા
              </h2>
              <p className="text-gray-600 mb-4">
                તમારી ગોપનીયતા આપણા માટે મહત્વપૂર્ણ છે. કૃપા કરીને આપણી ગોપનીયતા નીતિ વાંચો.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                8. કોઈ ગ્યારંટી નથી
              </h2>
              <p className="text-gray-600 mb-4">
                આ સેવા "જેમ છે તેમ" પ્રદાન કરવામાં આવે છે. આપણે કોઈ ગ્યારંટી આપતા નથી.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>પરીક્ષણ પરિણામો માર્ગદર્શન માટે છે</li>
                <li>આપણે કોઈ ગ્યારંટી આપતા નથી</li>
                <li>તમે તમારા જોખમે સેવા વાપરો છો</li>
                <li>આપણે કોઈ ક્ષતિપૂર્તિ આપતા નથી</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                9. ખાતો સમાપ્તિ
              </h2>
              <p className="text-gray-600 mb-4">
                આપણે કોઈપણ સમયે તમારા ખાતો બંધ કરી શકીએ છીએ જો તમે આ શરતોનું ઉલ્લંઘન કરો.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                10. કાયદો
              </h2>
              <p className="text-gray-600 mb-4">
                આ શરતો ભારતીય કાયદા દ્વારા સંચાલિત છે.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                11. સંપર્ક કરો
              </h2>
              <p className="text-gray-600">
                શરતો સંબંધિત કોઈ પ્રશ્નો હોય તો કૃપા કરીને અમારો સંપર્ક કરો.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              આ શરતો કોઈપણ સમયે પરિવર્તન કરી શકાય છે. છેલ્લું અપડેટ: {new Date().toLocaleDateString('gu-IN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
