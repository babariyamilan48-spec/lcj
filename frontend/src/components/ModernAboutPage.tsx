'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Target,
  Users,
  Award,
  Brain,
  Shield,
  CheckCircle,
  TrendingUp,
  BookOpen,
  BarChart3
} from 'lucide-react';
import ModernNavbar from './layout/ModernNavbar';
import ModernFooter from './layout/ModernFooter';

interface ModernAboutPageProps {
  onBack?: () => void;
}

const ModernAboutPage: React.FC<ModernAboutPageProps> = ({ onBack }) => {
  const values = [
    {
      icon: Target,
      title: 'મિશન',
      description: 'વ્યાપક મનોવૈજ્ઞાનિક મૂલ્યાંકનો સાથે વ્યક્તિઓને સશક્ત બનાવવા માટે જે તેમની સાચી ક્ષમતા અનલૉક કરે છે અને અર્થપૂર્ણ કારકિર્દી નિર્ણયોને માર્ગદર્શન આપે છે.',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: Award,
      title: 'દ્રષ્ટિ',
      description: 'મનોવૈજ્ઞાનિક મૂલ્યાંકન અને કારકિર્દી માર્ગદર્શન માટે અગ્રણી પ્લેટફોર્મ બનવા માટે, લાખોને તેમના આદર્શ કારકિર્દી માર્ગો શોધવામાં મદદ કરવા માટે.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Shield,
      title: 'મૂલ્યો',
      description: 'ઈમાનદારી, વૈજ્ઞાનિક કડકતા, વપરાશકર્તા ગોપનીયતા, અને વ્યક્તિગત સહાય એ બધું જે આપણે કરીએ છીએ તેના આધારસ્તંભો છે.',
      color: 'from-green-500 to-green-600'
    }
  ];

  const team = [
    {
      name: 'ડૉ. સારા જોહનસન',
      role: 'મુખ્ય મનોવૈજ્ઞાનિક',
      expertise: 'ક્લિનિકલ મનોવિજ્ઞાન, કારકિર્દી મૂલ્યાંકન',
      avatar: 'SJ',
      description: 'મનોવૈજ્ઞાનિક મૂલ્યાંકન અને કારકિર્દી સલાહમાં 15+ વર્ષનો અનુભવ.'
    },
    {
      name: 'માઇકલ ચેન',
      role: 'લીડ ડેટા સાયન્ટિસ્ટ',
      expertise: 'મશીન લર્નિંગ, સાયકોમેટ્રિક્સ',
      avatar: 'MC',
      description: 'મનોવૈજ્ઞાનિક મૂલ્યાંકન વિશ્લેષણ માટે અદ્યતન એલ્ગોરિધમ્સ વિકસાવવામાં નિષ્ણાત.'
    },
    {
      name: 'એમિલી રોડ્રિગેઝ',
      role: 'UX રિસર્ચ ડિરેક્ટર',
      expertise: 'વપરાશકર્તા અનુભવ, સંશોધન',
      avatar: 'ER',
      description: 'સાહજિક અને સુલભ મૂલ્યાંકન અનુભવો બનાવવા માટે ઉત્સાહી.'
    },
    {
      name: 'ડેવિડ કિમ',
      role: 'ટેકનોલોજી ડિરેક્ટર',
      expertise: 'સોફ્ટવેર એન્જિનિયરિંગ, સુરક્ષા',
      avatar: 'DK',
      description: 'અમારા પ્લેટફોર્મને સુરક્ષિત, સ્કેલેબલ અને ટેકનોલોજીકલી અદ્યતન બનાવવાની ખાતરી.'
    }
  ];

  const achievements = [
    { number: '50K+', label: 'વપરાશકર્તાઓ સેવા' },
    { number: '95%', label: 'ચોક્કસતા દર' },
    { number: '25+', label: 'મૂલ્યાંકન પ્રકારો' },
    { number: '10+', label: 'વર્ષોનો અનુભવ' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <ModernNavbar currentScreen="about" />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              LCJ કારકિર્દી મૂલ્યાંકન વિશે
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              અમે એક અગ્રણી પ્લેટફોર્મ છીએ જે વ્યાપક મનોવૈજ્ઞાનિક મૂલ્યાંકનો અને વ્યક્તિગત કારકિર્દી માર્ગદર્શન
              દ્વારા વ્યક્તિઓને તેમની સાચી ક્ષમતા શોધવામાં મદદ કરવા માટે સમર્પિત છે.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100"
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${value.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                અમારી વાર્તા
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  2014માં સ્થાપિત, LCJ કારકિર્દી મૂલ્યાંકન એક સરળ મિશન સાથે શરૂ થયું: મનોવૈજ્ઞાનિક
                  મૂલ્યાંકનને દરેક માટે સુલભ બનાવવું. અમારા સ્થાપકો, મનોવૈજ્ઞાનિકો અને ટેકનોલોજીસ્ટોની ટીમ,
                  પરંપરાગત મૂલ્યાંકન પદ્ધતિઓ અને આધુનિક વપરાશકર્તા જરૂરિયાતો વચ્ચેના અંતરને ઓળખ્યું.
                </p>
                <p>
                  વર્ષો દરમિયાન, અમે એક વ્યાપક પ્લેટફોર્મ વિકસાવ્યું છે જે વૈજ્ઞાનિક કડકતાને
                  વપરાશકર્તા-મિત્ર ડિઝાઇન સાથે જોડે છે. અમારા મૂલ્યાંકનો સ્થાપિત મનોવૈજ્ઞાનિક સિદ્ધાંતો
                  અને માન્ય પદ્ધતિઓ પર આધારિત છે, ચોક્કસતા અને વિશ્વસનીયતાની ખાતરી કરે છે.
                </p>
                <p>
                  આજે, અમે વિશ્વભરમાં હજારો વપરાશકર્તાઓની સેવા કરીએ છીએ, તેમને તેમની તાકાતો શોધવામાં મદદ કરીએ છીએ,
                  કારકિર્દી તકો ઓળખીએ છીએ, અને તેમના વ્યાવસાયિક ભવિષ્ય વિશે માહિતીપૂર્ણ નિર્ણયો લઈએ છીએ.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">અમારી અસર</h3>
                <div className="grid grid-cols-2 gap-6">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="text-center">
                      <div className="text-3xl font-bold mb-2">{achievement.number}</div>
                      <div className="text-orange-100">{achievement.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              અમારી ટીમને મળો
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              મનોવૈજ્ઞાનિકો, ડેટા વૈજ્ઞાનિકો અને ટેકનોલોજીસ્ટોની અમારી વિવિધ ટીમ એકસાથે કામ કરે છે
              શક્ય શ્રેષ્ઠ મૂલ્યાંકન અનુભવ બનાવવા માટે.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                  {member.avatar}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-orange-600 font-medium mb-2">{member.role}</p>
                <p className="text-sm text-gray-500 mb-3">{member.expertise}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              LCJને કેમ પસંદ કરો?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              અમે તમારા કારકિર્દી વિકાસ માટે અર્થપૂર્ણ સૂચનો પ્રદાન કરવા માટે
              વૈજ્ઞાનિક નિષ્ણાતતા અને અદ્યતન ટેકનોલોજીને જોડીએ છીએ.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'વૈજ્ઞાનિક રીતે માન્ય',
                description: 'અમારા મૂલ્યાંકનો સ્થાપિત મનોવૈજ્ઞાનિક સિદ્ધાંતો અને માન્ય પદ્ધતિઓ પર આધારિત છે.'
              },
              {
                icon: Shield,
                title: 'ગોપનીયતા અને સુરક્ષા',
                description: 'તમારા ડેટાને એન્ટરપ્રાઇઝ-ગ્રેડ સુરક્ષા ઉપાયો અને કડક ગોપનીયતા નીતિઓ દ્વારા સુરક્ષિત કરવામાં આવે છે.'
              },
              {
                icon: BarChart3,
                title: 'વ્યાપક અહેવાલો',
                description: 'તમારા મૂલ્યાંકન પરિણામોના આધારે વિગતવાર સૂચનો અને ક્રિયાત્મક ભલામણો મેળવો.'
              },
              {
                icon: Users,
                title: 'નિષ્ણાત સહાય',
                description: 'તમારા મૂલ્યાંકન સફર દરમિયાન વ્યાવસાયિક માર્ગદર્શન અને સહાયની પ્રવેશ.'
              },
              {
                icon: TrendingUp,
                title: 'સતત સુધારો',
                description: 'અમે વપરાશકર્તા પ્રતિસાદ અને સંશોધનના આધારે અમારા પ્લેટફોર્મને સતત અપડેટ અને સુધારીએ છીએ.'
              },
              {
                icon: BookOpen,
                title: 'શૈક્ષણિક સંસાધનો',
                description: 'તમારા પરિણામોને વધુ સારી રીતે સમજવામાં મદદ કરવા માટે શીખવાની સામગ્રી અને સંસાધનોની પ્રવેશ.'
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              તમારી ક્ષમતા શોધવા માટે તૈયાર છો?
            </h2>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto">
              અમારા વ્યાપક મૂલ્યાંકન પ્લેટફોર્મ સાથે તેમની કારકિર્દીને પરિવર્તિત કરનારા હજારો વપરાશકર્તાઓ સાથે જોડાઓ.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                className="px-8 py-4 bg-white text-orange-600 font-semibold rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                તમારું મૂલ્યાંકન શરૂ કરો
              </motion.button>
              <motion.button
                onClick={onBack}
                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl text-lg hover:bg-white hover:text-orange-600 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5 inline mr-2" />
                ઘરે પાછા જાઓ
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
};

export default ModernAboutPage;
