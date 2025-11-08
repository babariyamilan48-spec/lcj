'use client';

import React from 'react';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            કુકીઝ નીતિ
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                કુકીઝ શું છે?
              </h2>
              <p className="text-gray-600 mb-4">
                કુકીઝ નાની ટેક્સ્ટ ફાઇલો છે જે તમારા બ્રાઉઝરમાં સ્ટોર થાય છે જ્યારે તમે અમારી વેબસાઇટની મુલાકાત લો છો. તેઓ વેબસાઇટને તમારી પસંદગીઓ યાદ રાખવામાં મદદ કરે છે.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                અમે કયા કુકીઝનો ઉપયોગ કરીએ છીએ?
              </h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    આવશ્યક કુકીઝ
                  </h3>
                  <p className="text-gray-600">
                    આ કુકીઝ વેબસાઇટની મૂળભૂત કાર્યક્ષમતા માટે જરૂરી છે અને તેને બંધ કરી શકાતી નથી.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    પ્રદર્શન કુકીઝ
                  </h3>
                  <p className="text-gray-600">
                    આ કુકીઝ અમને વેબસાઇટનું પ્રદર્શન સુધારવામાં મદદ કરે છે અને વપરાશકર્તા અનુભવ વધારે છે.
                  </p>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    વિશ્લેષણ કુકીઝ
                  </h3>
                  <p className="text-gray-600">
                    આ કુકીઝ અમને સમજવામાં મદદ કરે છે કે વપરાશકર્તાઓ વેબસાઇટ સાથે કેવી રીતે ક્રિયાપ્રતિક્રિયા કરે છે.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                કુકીઝ નિયંત્રણ
              </h2>
              <p className="text-gray-600 mb-4">
                તમે તમારા બ્રાઉઝર સેટિંગ્સ દ્વારા કુકીઝને નિયંત્રિત કરી શકો છો. જો કે, કેટલીક કુકીઝને બંધ કરવાથી વેબસાઇટની કાર્યક્ષમતા પ્રભાવિત થઈ શકે છે.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                સંપર્ક
              </h2>
              <p className="text-gray-600">
                કુકીઝ નીતિ સંબંધિત કોઈ પ્રશ્નો હોય તો કૃપા કરીને અમારો સંપર્ક કરો.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
