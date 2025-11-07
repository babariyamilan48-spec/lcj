'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  Award, 
  Shield, 
  ArrowRight,
  CheckCircle,
  Star,
  BarChart3,
  BookOpen,
  Zap
} from 'lucide-react';
import ModernNavbar from './layout/ModernNavbar';
import ModernFooter from './layout/ModernFooter';
import Logo from './ui/Logo';

interface ModernHomePageProps {
  onStart?: () => void;
}

const ModernHomePage: React.FC<ModernHomePageProps> = ({ onStart }) => {
  const features = [
    {
      icon: Brain,
      title: 'વ્યાપક મૂલ્યાંકન',
      description: 'વ્યક્તિત્વ, બુદ્ધિ અને કારકિર્દી યોગ્યતા પરીક્ષણો સહિત ઘણા પ્રકારના મૂલ્યાંકન.',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: BarChart3,
      title: 'વિગતવાર વિશ્લેષણ',
      description: 'તમારા વ્યક્તિગત અને વ્યાવસાયિક વિકાસ માટે ક્રિયાત્મક સૂચનો સાથે વ્યાપક અહેવાલો મેળવો.',
      color: 'from-orange-400 to-orange-500'
    },
    {
      icon: Target,
      title: 'કારકિર્દી માર્ગદર્શન',
      description: 'તમારા મૂલ્યાંકન પરિણામોના આધારે વ્યક્તિગત કારકિર્દી ભલામણો મેળવો.',
      color: 'from-orange-600 to-orange-700'
    },
    {
      icon: Shield,
      title: 'સુરક્ષિત અને ખાનગી',
      description: 'તમારા ડેટાને એન્ટરપ્રાઇઝ-ગ્રેડ સુરક્ષા અને ગોપનીયતા ઉપાયો દ્વારા સુરક્ષિત કરવામાં આવે છે.',
      color: 'from-orange-300 to-orange-400'
    },
    {
      icon: Award,
      title: 'વૈજ્ઞાનિક રીતે માન્ય',
      description: 'સ્થાપિત મનોવૈજ્ઞાનિક સિદ્ધાંતો અને માન્ય મૂલ્યાંકન પદ્ધતિઓ પર આધારિત.',
      color: 'from-orange-700 to-orange-800'
    },
    {
      icon: Users,
      title: 'નિષ્ણાત સહાય',
      description: 'તમારા મૂલ્યાંકન સફર દરમિયાન વ્યાવસાયિક માર્ગદર્શન અને સહાયની પ્રવેશ.',
      color: 'from-orange-200 to-orange-300'
    }
  ];

  const testimonials = [
    {
      name: 'સારા જોહનસન',
      role: 'સોફ્ટવેર એન્જિનિયર',
      content: 'કારકિર્દી મૂલ્યાંકને મને મારી સાચી ક્ષમતા શોધવામાં મદદ કરી અને મને સાચા કારકિર્દી માર્ગ તરફ માર્ગદર્શન આપ્યું.',
      rating: 5,
      avatar: 'SJ'
    },
    {
      name: 'માઇકલ ચેન',
      role: 'માર્કેટિંગ મેનેજર',
      content: 'ક્રિયાત્મક સૂચનો સાથે વ્યાપક અહેવાલો. કારકિર્દી આયોજન માટે ખૂબ ભલામણ.',
      rating: 5,
      avatar: 'MC'
    },
    {
      name: 'એમિલી રોડ્રિગેઝ',
      role: 'ડેટા સાયન્ટિસ્ટ',
      content: 'મનોવૈજ્ઞાનિક મૂલ્યાંકન વૈજ્ઞાનિક રીતે માન્ય છે અને અત્યંત ચોક્કસ છે.',
      rating: 5,
      avatar: 'ER'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <ModernNavbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight font-gujarati text-center">
                  <span className="block mb-2">
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent font-extrabold">જીવન</span>
                    <span className="text-gray-700"> પરિવર્તન સફર</span>
                  </span>
                  <span className="block text-gray-600 font-medium">
                    Life Changing Journey
                  </span>
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-gujarati px-4">
                  તમારી કારકિર્દી ક્ષમતા અનલૉક કરવા અને તમારા વ્યક્તિગત વિકાસ સફરને માર્ગદર્શન આપવા માટે 
                  ડિઝાઇન કરાયેલા વ્યાપક મનોવૈજ્ઞાનિક મૂલ્યાંકન.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
                <motion.button
                  onClick={onStart}
                  className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden min-w-[200px]"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2 font-gujarati">
                    <span className="whitespace-nowrap">તમારું મૂલ્યાંકન શરૂ કરો</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.button>
                
                <motion.button
                  className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl text-base sm:text-lg hover:border-orange-500 hover:text-orange-500 transition-all duration-300 min-w-[150px] font-gujarati"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="whitespace-nowrap">વધુ જાણો</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-gujarati break-words">
              અમારા પ્લેટફોર્મને કેમ પસંદ કરો?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto font-gujarati leading-relaxed px-4">
              અમારું વ્યાપક મૂલ્યાંકન પ્લેટફોર્મ વૈજ્ઞાનિક કડકતા અને વપરાશકર્તા-મિત્ર ડિઝાઇનને જોડે છે 
              તમારા કારકિર્દી વિકાસ માટે અર્થપૂર્ણ સૂચનો પ્રદાન કરવા માટે.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group relative p-6 sm:p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 h-full"
                >
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 font-gujarati break-words">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-gujarati break-words">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-gujarati break-words">
              કેવી રીતે કામ કરે છે
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto font-gujarati leading-relaxed px-4">
              માત્ર થોડા સરળ પગલાઓમાં અમારા મૂલ્યાંકન પ્લેટફોર્મ સાથે શરૂ કરો
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'તમારું મૂલ્યાંકન પસંદ કરો',
                description: 'અમારા વ્યાપક મનોવૈજ્ઞાનિક અને કારકિર્દી મૂલ્યાંકનોમાંથી પસંદ કરો.',
                icon: BookOpen
              },
              {
                step: '02',
                title: 'પરીક્ષણ પૂર્ણ કરો',
                description: 'શ્રેષ્ઠ પરિણામો માટે પ્રશ્નોના જવાબો વિચારપૂર્વક અને પ્રામાણિકપણે આપવા માટે તમારો સમય લો.',
                icon: Zap
              },
              {
                step: '03',
                title: 'તમારા પરિણામો મેળવો',
                description: 'વ્યક્તિગત સૂચનો અને કારકિર્દી ભલામણો સાથે વિગતવાર અહેવાલો મેળવો.',
                icon: BarChart3
              }
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="text-center p-4"
                >
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-white font-bold text-lg sm:text-xl">
                      {step.step}
                    </div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                      <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 font-gujarati break-words">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-gujarati break-words">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-gujarati break-words">
              અમારા વપરાશકર્તાઓ શું કહે છે
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto font-gujarati leading-relaxed px-4">
              હજારો સંતુષ્ટ વપરાશકર્તાઓ સાથે જોડાઓ જેમણે તેમની સાચી ક્ષમતા શોધી છે
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100 h-full flex flex-col"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed font-gujarati break-words flex-grow">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center mt-auto">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold mr-3 sm:mr-4 text-sm sm:text-base">
                    {testimonial.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 text-sm sm:text-base font-gujarati break-words">{testimonial.name}</div>
                    <div className="text-gray-600 text-xs sm:text-sm font-gujarati break-words">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 font-gujarati break-words">
              તમારી ક્ષમતા શોધવા માટે તૈયાર છો?
            </h2>
            <p className="text-lg sm:text-xl text-orange-100 max-w-3xl mx-auto font-gujarati leading-relaxed px-4">
              અમારા વ્યાપક મૂલ્યાંકન પ્લેટફોર્મ સાથે તેમની કારકિર્દીને પરિવર્તિત કરનારા હજારો વપરાશકર્તાઓ સાથે જોડાઓ.
            </p>
            <motion.button
              onClick={onStart}
              className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-white text-orange-600 font-semibold rounded-xl text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center justify-center space-x-2 font-gujarati">
                <span className="whitespace-nowrap">આજે જ તમારી સફર શરૂ કરો</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
};

export default ModernHomePage;
