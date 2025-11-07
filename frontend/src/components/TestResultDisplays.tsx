import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Target,
  Users,
  Briefcase,
  BookOpen,
  Heart,
  Compass,
  Star,
  BarChart3,
  Zap,
  Lightbulb,
  Crown,
  CheckCircle,
  Award
} from 'lucide-react';

import { mbtiTypes, mbtiDimensionDescriptions } from '../data/testConfig';

// MBTI Result Display Component
export const MBTIResultDisplay: React.FC<{ result: any }> = ({ result }) => {
  if (!result) return null;

  // Get personality type details from config
  const personalityType = mbtiTypes[result.code as keyof typeof mbtiTypes];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Modern Hero Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl p-10 mb-10 text-white"
        >
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center border border-white/30 shadow-2xl">
                  <Brain className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                    Personality Intelligence
                  </h1>
                  <p className="text-purple-100 text-xl font-medium">Advanced cognitive pattern analysis & behavioral insights</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-purple-200 mb-3 text-lg">Neural Accuracy</div>
                <div className="text-6xl font-bold mb-3 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">98.7%</div>
                <div className="w-32 h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div
                    className="h-3 bg-gradient-to-r from-white to-purple-200 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '98.7%' }}
                    transition={{ duration: 2.5, delay: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main Content - Dimensions */}
          <div className="lg:col-span-2 space-y-8">
            {result.dimensions.map((dim: any, idx: number) => {
              const colors = [
                { bg: 'from-cyan-500 to-blue-600', accent: 'cyan', icon: '🧠' },
                { bg: 'from-purple-500 to-pink-600', accent: 'purple', icon: '💭' },
                { bg: 'from-emerald-500 to-teal-600', accent: 'emerald', icon: '🎯' },
                { bg: 'from-orange-500 to-red-600', accent: 'orange', icon: '⚡' }
              ];

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: idx * 0.2 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-500">

                    {/* Modern Circular Progress */}
                    <div className="relative mb-8">
                      <div className="flex items-center justify-center">
                        <div className="relative w-80 h-80">
                          {/* Background Circle */}
                          <svg className="w-80 h-80 transform -rotate-90" viewBox="0 0 320 320">
                            <circle
                              cx="160"
                              cy="160"
                              r="140"
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="20"
                              fill="none"
                            />
                            {/* Progress Circle */}
                            <motion.circle
                              cx="160"
                              cy="160"
                              r="140"
                              stroke={`url(#gradient-${idx})`}
                              strokeWidth="20"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 140}`}
                              initial={{ strokeDashoffset: 2 * Math.PI * 140 }}
                              animate={{ strokeDashoffset: 2 * Math.PI * 140 * (1 - dim.percentage / 100) }}
                              transition={{ duration: 2, delay: 0.5 + idx * 0.3, ease: "easeOut" }}
                            />
                            {/* Gradient Definition */}
                            <defs>
                              <linearGradient id={`gradient-${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={colors[idx].bg.includes('cyan') ? '#06b6d4' : colors[idx].bg.includes('purple') ? '#a855f7' : colors[idx].bg.includes('emerald') ? '#10b981' : '#f97316'} />
                                <stop offset="100%" stopColor={colors[idx].bg.includes('cyan') ? '#2563eb' : colors[idx].bg.includes('purple') ? '#ec4899' : colors[idx].bg.includes('emerald') ? '#0d9488' : '#dc2626'} />
                              </linearGradient>
                            </defs>
                          </svg>

                          {/* Center Content */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-8xl mb-4">{colors[idx].icon}</div>
                              <div className="text-4xl font-bold text-white mb-2">{dim.percentage}%</div>
                              <div className="text-white/70">dominance</div>
                            </div>
                          </div>

                          {/* Floating Percentage */}
                          <motion.div
                            className="absolute top-0 right-0 bg-white/20 backdrop-blur-lg rounded-2xl px-6 py-3 border border-white/30"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 1 + idx * 0.3 }}
                          >
                            <div className="text-2xl font-bold text-white">{dim.percentage}%</div>
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    {/* Preference Cards */}
                    <div className="grid grid-cols-2 gap-6">
                      <motion.div
                        className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 1.5 + idx * 0.2 }}
                      >
                        <div className="text-2xl font-bold text-white mb-2">{dim.pair.split(' vs ')[0]}</div>
                        <div className="text-white/70 flex items-center">
                          <Users className="w-5 h-5 mr-2" />
                          0 responses
                        </div>
                      </motion.div>
                      <motion.div
                        className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 1.5 + idx * 0.2 }}
                      >
                        <div className="text-2xl font-bold text-white mb-2">{dim.pair.split(' vs ')[1]}</div>
                        <div className="text-white/70 flex items-center">
                          <Users className="w-5 h-5 mr-2" />
                          60 responses
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Sidebar - Personality Profile */}
          <div className="space-y-8">
            {/* Visual Personality Map */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl text-center">

                {/* Personality Constellation */}
                <div className="relative w-80 h-80 mx-auto mb-8">
                  {/* Central Hub */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-cyan-400 rounded-full animate-pulse opacity-20"></div>
                  <div className="absolute inset-8 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-full shadow-2xl"></div>
                  <div className="absolute inset-16 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-3">🌟</div>
                      <div className="text-white/90 font-bold text-lg">Your Mind</div>
                      <div className="text-white/70 text-sm">Unique Pattern</div>
                    </div>
                  </div>

                  {/* Trait Orbits */}
                  {[
                    { emoji: '🎯', label: 'Focus', pos: 'top-8 left-1/2 -translate-x-1/2', color: 'from-blue-400 to-cyan-500' },
                    { emoji: '⚡', label: 'Energy', pos: 'right-8 top-1/2 -translate-y-1/2', color: 'from-yellow-400 to-orange-500' },
                    { emoji: '💭', label: 'Thinking', pos: 'bottom-8 left-1/2 -translate-x-1/2', color: 'from-purple-400 to-pink-500' },
                    { emoji: '🌱', label: 'Growth', pos: 'left-8 top-1/2 -translate-y-1/2', color: 'from-green-400 to-emerald-500' }
                  ].map((trait, i) => (
                    <motion.div
                      key={i}
                      className={`absolute ${trait.pos} w-16 h-16 bg-gradient-to-br ${trait.color} rounded-full flex items-center justify-center border-2 border-white/40 shadow-xl`}
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 360]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 0.8,
                        ease: "easeInOut"
                      }}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{trait.emoji}</div>
                        <div className="text-white text-xs font-bold">{trait.label}</div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Connecting Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                      </linearGradient>
                    </defs>
                    {/* Connecting lines from center to traits */}
                    <motion.line x1="50%" y1="50%" x2="50%" y2="20%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5"
                      animate={{ strokeDashoffset: [0, -10] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.line x1="50%" y1="50%" x2="80%" y2="50%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5"
                      animate={{ strokeDashoffset: [0, -10] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
                    />
                    <motion.line x1="50%" y1="50%" x2="50%" y2="80%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5"
                      animate={{ strokeDashoffset: [0, -10] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
                    />
                    <motion.line x1="50%" y1="50%" x2="20%" y2="50%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5"
                      animate={{ strokeDashoffset: [0, -10] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1.5 }}
                    />
                  </svg>
                </div>

                <h3 className="text-3xl font-bold text-white mb-3">Personality Constellation</h3>
                <p className="text-white/70 text-lg">Your interconnected cognitive traits and behavioral patterns</p>
              </div>
            </motion.div>

            {/* Personality Details */}
            {personalityType && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-3xl blur-xl"></div>
                <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">

                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{personalityType.name}</h3>
                    <p className="text-white/70 italic text-lg">{personalityType.english}</p>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <h4 className="font-bold text-white mb-3 flex items-center text-lg">
                        <Lightbulb className="w-5 h-5 mr-2" />
                        મુખ્ય ગુણધર્મો
                      </h4>
                      <p className="text-white/80 leading-relaxed">{personalityType.qualities}</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <h4 className="font-bold text-white mb-3 flex items-center text-lg">
                        <Zap className="w-5 h-5 mr-2" />
                        મુખ્ય શક્તિઓ
                      </h4>
                      <p className="text-white/80 leading-relaxed">{personalityType.strengths}</p>
                    </div>

                    {personalityType.challenges && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                        <h4 className="font-bold text-white mb-3 flex items-center text-lg">
                          <Target className="w-5 h-5 mr-2" />
                          વિકાસના ક્ષેત્રો
                        </h4>
                        <p className="text-white/80 leading-relaxed">{personalityType.challenges}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Multiple Intelligence Result Display
export const MultipleIntelligenceResultDisplay: React.FC<{ result: any }> = ({ result }) => {
  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-3 mb-3 max-w-lg mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">બહુવિધ બુદ્ધિ પરીક્ષણ</h3>
            <p className="text-gray-600">તમારી પ્રબળ બુદ્ધિ પ્રકારો</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-bold text-gray-800 flex items-center">
            <Award className="w-5 h-5 mr-2 text-gold-500" />
            ટોચની 3 બુદ્ધિ પ્રકારો
          </h4>
          {result.topIntelligences.map((intel: any, idx: number) => (
            <div key={idx} className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    idx === 0 ? 'bg-gold-500' : idx === 1 ? 'bg-silver-500' : 'bg-bronze-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="font-semibold text-gray-800 capitalize">{intel.type}</span>
                </div>
                <span className="text-sm font-bold text-orange-600">{intel.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <motion.div
                  className="bg-gradient-to-r from-orange-500 to-red-600 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${intel.percentage}%` }}
                  transition={{ duration: 1, delay: idx * 0.3 }}
                />
              </div>
              <p className="text-xs text-gray-600">{intel.description}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-gray-800 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
            તમારી બુદ્ધિ પ્રોફાઇલ
          </h4>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-gray-700 leading-relaxed">{result.profile}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h5 className="font-semibold text-gray-800 mb-2">પ્રબળ બુદ્ધિ પ્રકાર</h5>
            <div className="text-2xl font-bold text-blue-600 mb-2 capitalize">{result.dominantType}</div>
            <p className="text-sm text-gray-600">
              આ તમારી સૌથી મજબૂત બુદ્ધિ છે અને તમારે આ ક્ષેત્રમાં કારકિર્દી વિકસાવવાનું વિચારવું જોઈએ.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Big Five Result Display
export const BigFiveResultDisplay: React.FC<{ result: any }> = ({ result }) => {
  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-3 mb-3 max-w-lg mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Big Five વ્યક્તિત્વ પરીક્ષણ</h3>
            <p className="text-gray-600">પાંચ મુખ્ય વ્યક્તિત્વ પરિમાણો</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {result.dimensions.map((dim: any, idx: number) => (
          <div key={idx} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {idx + 1}
                </div>
                <div>
                  <span className="font-semibold text-gray-800 capitalize">{dim.trait}</span>
                  <div className="text-xs text-gray-500">{dim.level} સ્તર</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-red-600">{dim.percentage}%</span>
                <div className="text-xs text-gray-500">સ્કોર: {dim.score}</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <motion.div
                className="bg-gradient-to-r from-red-500 to-pink-600 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${dim.percentage}%` }}
                transition={{ duration: 1, delay: idx * 0.2 }}
              />
            </div>
            <p className="text-sm text-gray-600">{dim.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-bold text-gray-800 mb-2">વ્યક્તિત્વ સારાંશ</h4>
        <p className="text-gray-700">{result.summary}</p>
      </div>
    </motion.div>
  );
};

// RIASEC Result Display
export const RIASECResultDisplay: React.FC<{ result: any }> = ({ result }) => {
  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-3 mb-3 max-w-lg mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">RIASEC કારકિર્દી પરીક્ષણ</h3>
            <p className="text-gray-600">તમારી કારકિર્દી રુચિઓ</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">હોલેન્ડ કોડ</div>
          <div className="text-xl font-bold text-green-600">{result.hollandCode}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-bold text-gray-800 flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-500" />
            ટોચની રુચિ ક્ષેત્રો
          </h4>
          {result.topInterests.map((interest: any, idx: number) => (
            <div key={idx} className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    idx === 0 ? 'bg-green-600' : idx === 1 ? 'bg-green-500' : 'bg-green-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="font-semibold text-gray-800 capitalize">{interest.type}</span>
                </div>
                <span className="text-sm font-bold text-green-600">{interest.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <motion.div
                  className="bg-gradient-to-r from-green-500 to-teal-600 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${interest.percentage}%` }}
                  transition={{ duration: 1, delay: idx * 0.3 }}
                />
              </div>
              <p className="text-xs text-gray-600">{interest.description}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-gray-800 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-blue-500" />
            સૂચિત કારકિર્દીઓ
          </h4>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            {result.careers.map((career: string, idx: number) => (
              <div key={idx} className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">{career}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// SVS Result Display
export const SVSResultDisplay: React.FC<{ result: any }> = ({ result }) => {
  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-3 mb-3 max-w-lg mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">SVS મૂલ્ય પરીક્ષણ</h3>
            <p className="text-gray-600">તમારા જીવન મૂલ્યો અને પ્રાથમિકતાઓ</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-gray-800 flex items-center">
          <Star className="w-5 h-5 mr-2 text-pink-500" />
          મુખ્ય મૂલ્યો (ટોચના 5)
        </h4>
        {result.coreValues.map((value: any, idx: number) => (
          <div key={idx} className="bg-pink-50 rounded-lg p-4 border border-pink-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  idx === 0 ? 'bg-pink-600' : idx === 1 ? 'bg-pink-500' : 'bg-pink-400'
                }`}>
                  {idx + 1}
                </div>
                <span className="font-semibold text-gray-800">{value.type}</span>
              </div>
              <span className="text-sm font-bold text-pink-600">{value.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <motion.div
                className="bg-gradient-to-r from-pink-500 to-purple-600 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${value.percentage}%` }}
                transition={{ duration: 1, delay: idx * 0.2 }}
              />
            </div>
            <p className="text-xs text-gray-600">{value.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-purple-50 rounded-lg p-4 border border-purple-200">
        <h4 className="font-bold text-gray-800 mb-2">મૂલ્ય પ્રોફાઇલ</h4>
        <p className="text-gray-700">{result.valueProfile}</p>
      </div>
    </motion.div>
  );
};

// Decision Style Result Display
export const DecisionMakingResultDisplay: React.FC<{ result: any }> = ({ result }) => {
  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-3 mb-3 max-w-lg mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Target className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">નિર્ણય શૈલી પરીક્ષણ</h3>
            <p className="text-gray-600">તમારી નિર્ણય લેવાની પ્રક્રિયા</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-bold text-gray-800 flex items-center">
            <Crown className="w-5 h-5 mr-2 text-indigo-500" />
            પ્રાથમિક નિર્ણય શૈલી
          </h4>
          <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-indigo-600 mb-2 capitalize">
                {result.primaryStyle.type}
              </div>
              <div className="text-lg font-semibold text-gray-700">
                {result.primaryStyle.percentage}% પ્રાધાન્ય
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
              <motion.div
                className="bg-gradient-to-r from-indigo-500 to-blue-600 h-4 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${result.primaryStyle.percentage}%` }}
                transition={{ duration: 1.5 }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              {result.primaryStyle.description}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-gray-800 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
            બધી નિર્ણય શૈલીઓ
          </h4>
          {result.allStyles.map((style: any, idx: number) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-800 capitalize">{style.type}</span>
                <span className="text-sm font-bold text-blue-600">{style.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${style.percentage}%` }}
                  transition={{ duration: 1, delay: idx * 0.2 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-bold text-gray-800 mb-2">નિર્ણય પ્રોફાઇલ</h4>
        <p className="text-gray-700">{result.profile}</p>
      </div>
    </motion.div>
  );
};

// VARK Result Display
export const VARKResultDisplay: React.FC<{ result: any }> = ({ result }) => {
  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-3 mb-3 max-w-lg mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">VARK શીખવાની શૈલી</h3>
            <p className="text-gray-600">તમારી શીખવાની પસંદગીઓ</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-bold text-gray-800 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-teal-500" />
            પ્રાથમિક શીખવાની શૈલી
          </h4>
          <div className="bg-teal-50 rounded-lg p-6 border border-teal-200">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-teal-600 mb-2 capitalize">
                {result.primaryStyle.type}
              </div>
              <div className="text-lg font-semibold text-gray-700">
                {result.primaryStyle.percentage}% પ્રાધાન્ય
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
              <motion.div
                className="bg-gradient-to-r from-teal-500 to-cyan-600 h-4 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${result.primaryStyle.percentage}%` }}
                transition={{ duration: 1.5 }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              {result.primaryStyle.description}
            </p>
          </div>

          <h4 className="font-bold text-gray-800 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            અભ્યાસ સૂચનો
          </h4>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            {result.studyTips.map((tip: string, idx: number) => (
              <div key={idx} className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-gray-800 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-cyan-500" />
            બધી શીખવાની શૈલીઓ
          </h4>
          {result.allStyles.map((style: any, idx: number) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-800 capitalize">{style.type}</span>
                <span className="text-sm font-bold text-cyan-600">{style.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${style.percentage}%` }}
                  transition={{ duration: 1, delay: idx * 0.2 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-cyan-50 rounded-lg p-4 border border-cyan-200">
        <h4 className="font-bold text-gray-800 mb-2">શીખવાની પ્રોફાઇલ</h4>
        <p className="text-gray-700">{result.learningProfile}</p>
      </div>
    </motion.div>
  );
};
