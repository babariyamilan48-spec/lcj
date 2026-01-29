'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Users,
  Award,
  Heart,
  CheckCircle,
  ArrowRight,
  Brain,
  TrendingUp,
  Shield
} from 'lucide-react';
import ModernNavbar from '@/components/layout/ModernNavbar';
import ModernFooter from '@/components/layout/ModernFooter';

export default function AboutPage() {
  const features = [
    {
      icon: Brain,
      title: 'વૈજ્ઞાનિક અભિગમ',
      description: 'અમારા મૂલ્યાંકનો સાબિત મનોવૈજ્ઞાનિક સિદ્ધાંતો અને માન્ય સંશોધન પદ્ધતિઓ પર આધારિત છે.'
    },
    {
      icon: TrendingUp,
      title: 'કારકિર્દી વિકાસ',
      description: 'તમારા કારકિર્દી વિકાસને ઝડપી બનાવવા અને માહિતીપૂર્ણ નિર્ણયો લેવા માટે વ્યક્તિગત સૂચનો મેળવો.'
    },
    {
      icon: Shield,
      title: 'ગોપનીયતા પ્રથમ',
      description: 'તમારો ડેટા એન્ટરપ્રાઇઝ-ગ્રેડ એન્ક્રિપ્શન અને કડક ગોપનીયતા નીતિઓ સાથે સુરક્ષિત છે.'
    },
    {
      icon: Users,
      title: 'નિષ્ણાત સહાય',
      description: 'વ્યક્તિગત માર્ગદર્શન અને સહાય માટે કારકિર્દી સલાહકારો અને મનોવૈજ્ઞાનિકોની પ્રવેશ.'
    }
  ];

  const stats = [
    { number: '50K+', label: 'મૂલ્યાંકનો પૂર્ણ' },
    { number: '95%', label: 'વપરાશકર્તા સંતુષ્ટતા' },
    { number: '15+', label: 'મૂલ્યાંકન પ્રકારો' },
    { number: '24/7', label: 'સહાય ઉપલબ્ધ' }
  ];

  const team = [
    {
      name: 'ડૉ. સારા જોહનસન',
      role: 'મુખ્ય મનોવૈજ્ઞાનિક',
      description: 'કારકિર્દી મૂલ્યાંકનમાં 15+ વર્ષના અનુભવ સાથે સંસ્થાગત મનોવિજ્ઞાનમાં પીએચડી.'
    },
    {
      name: 'માઇકલ ચેન',
      role: 'ટેકનિકલ ડિરેક્ટર',
      description: '10+ વર્ષના અનુભવ સાથે સાયકોમેટ્રિક પરીક્ષણ પ્લેટફોર્મ અને ડેટા સુરક્ષામાં નિષ્ણાત.'
    },
    {
      name: 'એમિલી રોડ્રિગેઝ',
      role: 'કારકિર્દી સલાહકાર',
      description: 'વ્યક્તિઓને તેમની ક્ષમતા શોધવામાં મદદ કરવામાં વિશેષતા ધરાવતા પ્રમાણિત કારકિર્દી કોચ.'
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <ModernNavbar currentScreen="about" />

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-orange-50 via-white to-orange-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 font-gujarati text-center break-words">
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent font-extrabold">જીવન</span>
              <span className="text-gray-700"> પરિવર્તન સફર વિશે</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-2">
              અમે વૈજ્ઞાનિક રીતે સાબિત મનોવૈજ્ઞાનિક મૂલ્યાંકનો અને વ્યક્તિગત કારકિર્દી માર્ગદર્શન
              દ્વારા વ્યક્તિઓને તેમની સાચી ક્ષમતા શોધવામાં મદદ કરવા માટે સમર્પિત છીએ.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">અમારું મિશન</h2>
              <p className="text-lg text-gray-600 mb-6">
                જીવન પરિવર્તન સફર પર , અમે માનીએ છીએ કે દરેકને તેમનો આદર્શ કારકિર્દી માર્ગ શોધવાનો અધિકાર છે. અમારું મિશન
                સુલભ, ચોક્કસ અને ક્રિયાત્મક મનોવૈજ્ઞાનિક મૂલ્યાંકનો પ્રદાન કરવાનું છે જે
                વ્યક્તિઓને તેમના વ્યાવસાયિક ભવિષ્ય વિશે માહિતીપૂર્ણ નિર્ણયો લેવા માટે સશક્ત બનાવે છે.
              </p>
              <div className="space-y-4">
                {[
                  'પુરાવા-આધારિત મનોવૈજ્ઞાનિક મૂલ્યાંકનો',
                  'વ્યક્તિગત કારકિર્દી ભલામણો',
                  'નિષ્ણાત માર્ગદર્શન અને સહાય',
                  'સતત શીખવું અને વિકાસ'
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white">
                <Target className="w-12 h-12 mb-4" />
                <h3 className="text-2xl font-bold mb-4">અમારી દ્રષ્ટિ</h3>
                <p className="text-orange-100">
                  કારકિર્દી શોધ માટે વિશ્વનો સૌથી વિશ્વસનીય પ્લેટફોર્મ બનવા માટે,
                  લાખો લોકોને તેમની અનન્ય તાકાતો અને ઉત્સાહો સાથે સંરેખિત
                  સંતુષ્ટ કારકિર્દી શોધવામાં મદદ કરવા માટે.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">LCJને કેમ પસંદ કરો?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              અમારું પ્લેટફોર્મ અદ્યતન ટેકનોલોજીને સાબિત મનોવૈજ્ઞાનિક સિદ્ધાંતો સાથે જોડે છે
              ચોક્કસ અને અર્થપૂર્ણ કારકિર્દી સૂચનો પ્રદાન કરવા માટે.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">અમારી અસર</h2>
            <p className="text-xl text-gray-600">
              વિશ્વભરના હજારો વ્યાવસાયિકો દ્વારા વિશ્વસનીય
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-orange-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section removed per request */}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600 overflow-hidden">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 break-words">
              તમારી ક્ષમતા શોધવા માટે તૈયાર છો?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-orange-100 mb-8 max-w-2xl mx-auto px-2">
              અમારા મૂલ્યાંકનો સાથે તેમની કારકિર્દીને પરિવર્તિત કરનારા હજારો વ્યાવસાયિકો સાથે જોડાઓ.
            </p>
            <motion.button
              className="bg-white text-orange-600 font-semibold px-8 py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center space-x-2"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/home'}
            >
              <span>તમારું મૂલ્યાંકન શરૂ કરો</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
}
