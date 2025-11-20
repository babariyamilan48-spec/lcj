'use client';

import React from 'react';

export default function CancellationRefundPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ખાતો અને ડેટા નીતિ
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            છેલ્લે અપડેટ: {new Date().toLocaleDateString('gu-IN')}
          </p>
          
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                1. પરીક્ષણ પુનરાવર્તન
              </h2>
              <p className="text-gray-600 mb-4">
                તમે કોઈપણ પરીક્ષણ પુનરાવર્તન કરી શકો છો. તમે તમારી પ્રગતિ ટ્રેક કરવા માટે બહુવિધ પરીક્ષણો લઈ શકો છો.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>કોઈ મર્યાદા નથી - જેટલી વાર ચાહો તેટલી વાર લો</li>
                <li>તમામ પરિણામો સંગ્રહ કરવામાં આવે છે</li>
                <li>પ્રગતિ ટ્રેક કરો સમય સાથે</li>
                <li>તમારા સુધારણા જુઓ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                2. ડેટા સંગ્રહ
              </h2>
              <p className="text-gray-600 mb-4">
                તમારા તમામ પરીક્ષણ પરિણામો સુરક્ષિત રીતે સંગ્રહ કરવામાં આવે છે:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>તમામ પરીક્ષણ ઇતિહાસ સংરક્ષિત</li>
                <li>પરિણામો કોઈપણ સમયે ઍક્સેસ કરી શકાય છે</li>
                <li>ડેટા એનક્રિપ્ટેડ અને સુરક્ષિત</li>
                <li>તમે તમારા ડેટા નિયંત્રણ કરો છો</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                3. ખાતો રદ્દીકરણ
              </h2>
              <p className="text-gray-600 mb-4">
                તમે તમારો ખાતો કોઈપણ સમયે રદ્દ કરી શકો છો:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>સેટિંગ્સ પેજમાંથી રદ્દ કરો</li>
                <li>સપોર્ટ ટીમ સાથે સંપર્ક કરો</li>
                <li>ઈમેલ દ્વારા આવેદન કરો</li>
                <li>તમારી વ્યક્તિગત માહિતી સુરક્ષિત રહે છે</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                4. ડેટા હટાવવું
              </h2>
              <p className="text-gray-600 mb-4">
                ખાતો રદ્દ કર્યા પછી:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>તમે તમારા ડેટા હટાવવા માટે વિનંતી કરી શકો છો</li>
                <li>આપણે તમારા ડેટા 30 દિવસમાં હટાવીશું</li>
                <li>તમે ડેટા ડાઉનલોડ કરી શકો છો પહેલાં</li>
                <li>કાયદા અનુસાર ડેટા જાળવવામાં આવે છે</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                5. ડેટા પોર્ટેબિલિટી
              </h2>
              <p className="text-gray-600 mb-4">
                તમે તમારો ડેટા ડાઉનલોડ કરી શકો છો:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>તમામ પરીક્ષણ પરિણામો ડાઉનલોડ કરો</li>
                <li>PDF ફોર્મેટમાં અહેવાલ</li>
                <li>CSV ફોર્મેટમાં ડેટા</li>
                <li>કોઈપણ સમયે ઍક્સેસ કરી શકાય છે</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                6. ગોપનીયતા અધિકાર
              </h2>
              <p className="text-gray-600 mb-4">
                તમારી ગોપનીયતા અધિકાર:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>તમે જાણી શકો છો કે આપણે શું ડેટા રાખીએ છીએ</li>
                <li>તમે તમારો ડેટા સુધારી શકો છો</li>
                <li>તમે તમારો ડેટા હટાવવા માટે વિનંતી કરી શકો છો</li>
                <li>તમે ડેટા શેર કરવાનો વિરોધ કરી શકો છો</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                7. ડેટા સુરક્ષા
              </h2>
              <p className="text-gray-600 mb-4">
                તમારો ડેટા સુરક્ષિત છે:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>SSL એનક્રિપશન</li>
                <li>ડેટાબેસ એનક્રિપશન</li>
                <li>નિયમિત બેકআપ</li>
                <li>ઍક્સેસ નિયંત્રણ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                8. ખાતો સ્થગન
              </h2>
              <p className="text-gray-600 mb-4">
                આપણે ખાતો સ્થગન કરી શકીએ છીએ જો:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>તમે શરતોનું ઉલ્લંઘન કરો</li>
                <li>તમે અપમાનજનક ભાષા વાપરો</li>
                <li>તમે બીજાને હેરાન કરો</li>
                <li>તમે ગેરકાયદેસર પ્રવૃત્તિ કરો</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                9. અપીલ પ્રક્રિયા
              </h2>
              <p className="text-gray-600 mb-4">
                જો તમારો ખાતો સ્થગન કરવામાં આવ્યો હોય:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>તમે અપીલ કરી શકો છો</li>
                <li>સપોર્ટ ટીમને સંપર્ક કરો</li>
                <li>તમારો કેસ સમીક્ષા કરવામાં આવશે</li>
                <li>આપણે 7 દિવસમાં જવાબ આપીશું</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                10. પરીક્ષણ ઇતિહાસ
              </h2>
              <p className="text-gray-600 mb-4">
                તમારો પરીક્ષણ ઇતિહાસ:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>તમામ પરીક્ષણો સંગ્રહ કરવામાં આવે છે</li>
                <li>તમે તમારી પ્રગતિ જોઈ શકો છો</li>
                <li>તમે પરિણામો તુલના કરી શકો છો</li>
                <li>તમે ઇતિહાસ ડાઉનલોડ કરી શકો છો</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                11. ડેટા ધરણ
              </h2>
              <p className="text-gray-600 mb-4">
                આપણે ડેટા કેટલો સમય રાખીએ છીએ:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>સક્રિય ખાતો: અનિશ્ચિત સમય</li>
                <li>નિષ્ક્રિય ખાતો: 2 વર્ષ</li>
                <li>રદ્દ ખાતો: 30 દિવસ</li>
                <li>કાયદા અનુસાર: જરૂરી તરીકે</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                12. સંપર્ક કરો
              </h2>
              <p className="text-gray-600">
                ખાતો અથવા ડેટા સંબંધિત કોઈ પ્રશ્નો હોય તો કૃપા કરીને અમારો સપોર્ટ ટીમ સાથે સંપર્ક કરો.
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
