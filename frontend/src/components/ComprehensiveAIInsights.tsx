import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Calendar,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  Briefcase,
  Users,
  Zap
} from 'lucide-react';
import { ComprehensiveAIInsights } from '../services/aiInsightsService';

interface ComprehensiveAIInsightsProps {
  insights: ComprehensiveAIInsights;
  isLoading?: boolean;
}

const ComprehensiveAIInsightsComponent: React.FC<ComprehensiveAIInsightsProps> = ({ 
  insights, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <span className="ml-4 text-lg text-gray-600">AI વિશ્લેષણ તૈયાર કરી રહ્યું છે...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modern Header */}
      <div className="text-center bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 rounded-3xl p-12 border border-orange-100 shadow-xl">
        <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Zap className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4">
          સંપૂર્ણ AI વિશ્લેષણ રિપોર્ટ
        </h2>
        <p className="text-gray-600 text-lg">તમામ ટેસ્ટના પરિણામો આધારિત વ્યાપક કારકિર્દી માર્ગદર્શન</p>
      </div>

      {/* Top Career Fields */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-orange-100"
      >
        <div className="flex items-center mb-6">
          <Target className="w-8 h-8 text-orange-500 mr-3" />
          <h3 className="text-2xl font-bold text-gray-800">ટોપ 3 કારકિર્દી ક્ષેત્રો</h3>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {insights.top_career_fields?.map((field, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-orange-100 overflow-hidden"
            >
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
              
              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                      ભલામણ કરેલ
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      #{index + 1}
                    </div>
                    <div className="text-xs text-gray-500">પ્રાથમિકતા</div>
                  </div>
                </div>
                
                {/* Career Field Name */}
                <h4 className="text-xl font-bold text-gray-800 mb-4 leading-tight">
                  {field.field}
                </h4>
                
                {/* Reasoning with bullet points */}
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                    <h5 className="text-sm font-semibold text-orange-700">શા માટે યોગ્ય છે</h5>
                  </div>
                  <div className="text-sm text-orange-600 leading-relaxed whitespace-pre-line">
                    {field.reasoning}
                  </div>
                </div>
                
                {/* Key Info Cards */}
                <div className="space-y-4">
                  {field.gujarat_opportunities && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 hover:bg-green-100 transition-colors duration-200">
                      <div className="flex items-center mb-2">
                        <Briefcase className="w-4 h-4 text-green-500 mr-2" />
                        <h5 className="text-sm font-semibold text-green-700">ગુજરાતમાં તકો</h5>
                      </div>
                      <p className="text-sm text-green-600 leading-relaxed line-clamp-3">{field.gujarat_opportunities}</p>
                    </div>
                  )}
                  
                  {field.salary_range && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 hover:bg-blue-100 transition-colors duration-200">
                      <div className="flex items-center mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-500 mr-2" />
                        <h5 className="text-sm font-semibold text-blue-700">પગાર શ્રેણી</h5>
                      </div>
                      <p className="text-sm text-blue-600 font-medium">{field.salary_range}</p>
                    </div>
                  )}
                  
                  {field.growth_potential && (
                    <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 hover:bg-purple-100 transition-colors duration-200">
                      <div className="flex items-center mb-2">
                        <TrendingUp className="w-4 h-4 text-purple-500 mr-2" />
                        <h5 className="text-sm font-semibold text-purple-700">વૃદ્ધિની સંભાવના</h5>
                      </div>
                      <p className="text-sm text-purple-600">{field.growth_potential}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Hover Effect Border */}
              <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-orange-200 transition-all duration-300"></div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Career Roadmaps */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-orange-100"
      >
        <div className="flex items-center mb-6">
          <Calendar className="w-8 h-8 text-blue-500 mr-3" />
          <h3 className="text-2xl font-bold text-gray-800">વિગતવાર કારકિર્દી રોડમેપ</h3>
        </div>

        {Object.entries(insights.career_roadmaps || {}).map(([fieldName, roadmap]) => (
          <div key={fieldName} className="mb-8">
            <h4 className="text-xl font-semibold text-gray-800 mb-4">{fieldName}</h4>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Beginner Phase */}
              <div className="bg-green-50 rounded-xl p-6 border-l-4 border-green-500">
                <h5 className="font-bold text-green-800 mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  શરૂઆતી તબક્કો ({roadmap.beginner_phase?.duration})
                </h5>
                
                <div className="space-y-3">
                  <div>
                    <h6 className="text-sm font-semibold text-gray-700 mb-1">શીખવાની સ્કિલ્સ:</h6>
                    <div className="flex flex-wrap gap-1">
                      {roadmap.beginner_phase?.skills_to_learn?.map((skill, idx) => (
                        <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h6 className="text-sm font-semibold text-gray-700 mb-1">સર્ટિફિકેશન:</h6>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {roadmap.beginner_phase?.certifications?.map((cert, idx) => (
                        <li key={idx} className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                          {cert}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Intermediate Phase */}
              <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500">
                <h5 className="font-bold text-blue-800 mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  મધ્યમ તબક્કો ({roadmap.intermediate_phase?.duration})
                </h5>
                
                <div className="space-y-3">
                  <div>
                    <h6 className="text-sm font-semibold text-gray-700 mb-1">એડવાન્સ સ્કિલ્સ:</h6>
                    <div className="flex flex-wrap gap-1">
                      {roadmap.intermediate_phase?.skills_to_learn?.map((skill, idx) => (
                        <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h6 className="text-sm font-semibold text-gray-700 mb-1">પ્રોજેક્ટ્સ:</h6>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {roadmap.intermediate_phase?.projects?.map((project, idx) => (
                        <li key={idx} className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                          {project}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Expert Phase */}
              <div className="bg-purple-50 rounded-xl p-6 border-l-4 border-purple-500">
                <h5 className="font-bold text-purple-800 mb-3 flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  એક્સપર્ટ તબક્કો ({roadmap.expert_phase?.duration})
                </h5>
                
                <div className="space-y-3">
                  <div>
                    <h6 className="text-sm font-semibold text-gray-700 mb-1">એક્સપર્ટ સ્કિલ્સ:</h6>
                    <div className="flex flex-wrap gap-1">
                      {roadmap.expert_phase?.skills_to_learn?.map((skill, idx) => (
                        <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h6 className="text-sm font-semibold text-gray-700 mb-1">લીડરશિપ રોલ્સ:</h6>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {roadmap.expert_phase?.leadership_roles?.map((role, idx) => (
                        <li key={idx} className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                          {role}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Book Recommendations */}
      {insights.recommended_books && insights.recommended_books.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-orange-100"
        >
          <div className="flex items-center mb-6">
            <BookOpen className="w-8 h-8 text-green-500 mr-3" />
            <h3 className="text-2xl font-bold text-gray-800">પુસ્તક ભલામણો</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {insights.recommended_books.map((book, idx) => (
              <div key={idx} className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 text-lg mb-1">{book.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">લેખક: {book.author}</p>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm ml-4">
                    {idx + 1}
                  </div>
                </div>
                
                <div className="bg-white/70 rounded-lg p-4 mb-4">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">શા માટે ભલામણ કરેલ:</h5>
                  <p className="text-sm text-gray-700 leading-relaxed">{book.why_recommended}</p>
                </div>

                {book.key_takeaways && book.key_takeaways.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">મુખ્ય મુદ્દાઓ:</h5>
                    <div className="flex flex-wrap gap-2">
                      {book.key_takeaways.map((takeaway, takeawayIdx) => (
                        <span key={takeawayIdx} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                          {takeaway}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {book.relevance_to_career && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <h5 className="text-sm font-semibold text-orange-700 mb-1">કારકિર્દી માટે ઉપયોગ:</h5>
                    <p className="text-sm text-orange-600">{book.relevance_to_career}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Strengths & Weaknesses */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {/* Strengths */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-orange-100">
          <div className="flex items-center mb-6">
            <Star className="w-8 h-8 text-green-500 mr-3" />
            <h3 className="text-xl font-bold text-gray-800">તમારી શક્તિઓ</h3>
          </div>
          
          <div className="space-y-3">
            {insights.strengths?.map((strength, idx) => (
              <div key={idx} className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-sm text-green-700 leading-relaxed">{strength.replace('• ', '')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-orange-100">
          <div className="flex items-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
            <h3 className="text-xl font-bold text-gray-800">સુધારણાના ક્ષેત્રો</h3>
          </div>
          
          <div className="space-y-3">
            {insights.weaknesses?.map((weakness, idx) => (
              <div key={idx} className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-sm text-red-700 leading-relaxed">{weakness.replace('• ', '')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Daily Habits */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white/80 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-orange-100"
      >
        <div className="flex items-center mb-6">
          <Clock className="w-8 h-8 text-purple-500 mr-3" />
          <h3 className="text-2xl font-bold text-gray-800">દૈનિક આદતો</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* All Daily Habits in a single organized layout */}
          <div className="md:col-span-2">
            <div className="grid md:grid-cols-3 gap-4">
              {insights.daily_habits?.map((habit, idx) => {
                // Determine color based on index for variety
                const colors = [
                  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
                  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
                  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
                  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
                  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', dot: 'bg-teal-500' },
                  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-500' }
                ];
                const color = colors[idx % colors.length];
                
                return (
                  <div key={idx} className={`${color.bg} rounded-lg p-4 border ${color.border}`}>
                    <div className="flex items-start">
                      <div className={`w-2 h-2 ${color.dot} rounded-full mt-2 mr-3 flex-shrink-0`}></div>
                      <p className={`text-sm ${color.text} leading-relaxed`}>{habit.replace('• ', '')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Personality Insights */}
      {insights.personality_insights && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/80 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-orange-100"
        >
          <div className="flex items-center mb-6">
            <Users className="w-8 h-8 text-indigo-500 mr-3" />
            <h3 className="text-2xl font-bold text-gray-800">વ્યક્તિત્વ વિશ્લેષણ</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
                <h4 className="font-semibold text-indigo-800 mb-3 flex items-center">
                  <div className="w-4 h-4 bg-indigo-500 rounded-full mr-2"></div>
                  MBTI વિશ્લેષણ
                </h4>
                <p className="text-sm text-indigo-700 leading-relaxed">{insights.personality_insights.mbti_analysis}</p>
              </div>

              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                  <div className="w-4 h-4 bg-purple-500 rounded-full mr-2"></div>
                  Big Five સારાંશ
                </h4>
                <p className="text-sm text-purple-700 leading-relaxed">{insights.personality_insights.big_five_summary}</p>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                  શીખવાની શૈલી
                </h4>
                <p className="text-sm text-blue-700 leading-relaxed">{insights.personality_insights.learning_style}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-teal-50 rounded-xl p-6 border border-teal-200">
                <h4 className="font-semibold text-teal-800 mb-3 flex items-center">
                  <div className="w-4 h-4 bg-teal-500 rounded-full mr-2"></div>
                  કામનું વાતાવરણ
                </h4>
                <p className="text-sm text-teal-700 leading-relaxed">{insights.personality_insights.work_environment}</p>
              </div>

              <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                  <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                  નેતૃત્વ ક્ષમતા
                </h4>
                <p className="text-sm text-orange-700 leading-relaxed">{insights.personality_insights.leadership_potential}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Networking Suggestions */}
      {insights.networking_suggestions && insights.networking_suggestions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white/80 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-orange-100"
        >
          <div className="flex items-center mb-6">
            <Users className="w-8 h-8 text-blue-500 mr-3" />
            <h3 className="text-2xl font-bold text-gray-800">નેટવર્કિંગ સૂચનો</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {insights.networking_suggestions.map((suggestion, idx) => (
              <div key={idx} className="bg-blue-50 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3 mt-1">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-blue-700 leading-relaxed">{suggestion.replace('• ', '')}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Skill Development Plan */}
      {insights.skill_development_plan && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white/80 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-orange-100"
        >
          <div className="flex items-center mb-6">
            <TrendingUp className="w-8 h-8 text-green-500 mr-3" />
            <h3 className="text-2xl font-bold text-gray-800">સ્કિલ ડેવલપમેન્ટ પ્લાન</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Immediate Focus */}
            <div className="bg-red-50 rounded-xl p-6 border-l-4 border-red-500">
              <h4 className="font-bold text-red-800 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                તાત્કાલિક ધ્યાન
              </h4>
              <div className="space-y-2">
                {insights.skill_development_plan.immediate_focus?.map((skill, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-sm text-red-700">{skill}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Six Month Goals */}
            <div className="bg-yellow-50 rounded-xl p-6 border-l-4 border-yellow-500">
              <h4 className="font-bold text-yellow-800 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                6 મહિનાના લક્ષ્યો
              </h4>
              <div className="space-y-2">
                {insights.skill_development_plan.six_month_goals?.map((goal, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-sm text-yellow-700">{goal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* One Year Vision */}
            <div className="bg-green-50 rounded-xl p-6 border-l-4 border-green-500">
              <h4 className="font-bold text-green-800 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                1 વર્ષનું વિઝન
              </h4>
              <p className="text-sm text-green-700 leading-relaxed">{insights.skill_development_plan.one_year_vision}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommended Certifications */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="bg-white/80 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-orange-100"
      >
        <div className="flex items-center mb-6">
          <Award className="w-8 h-8 text-yellow-500 mr-3" />
          <h3 className="text-2xl font-bold text-gray-800">ભલામણ કરેલ સર્ટિફિકેશન</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {insights.recommended_certifications?.map((cert, idx) => (
            <div key={idx} className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-yellow-800">{cert.certification?.name}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  cert.priority === 'ઉચ્ચ' ? 'bg-red-100 text-red-700' :
                  cert.priority === 'મધ્યમ' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {cert.priority} પ્રાથમિકતા
                </span>
              </div>
              
              <p className="text-sm text-gray-700 mb-3">{cert.certification?.why_recommended}</p>
              
              <div className="space-y-2 mb-4">
                <div>
                  <h5 className="text-xs font-semibold text-gray-700 mb-1">મળશે સ્કિલ્સ:</h5>
                  <div className="flex flex-wrap gap-1">
                    {cert.skills_gained?.map((skill, skillIdx) => (
                      <span key={skillIdx} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <p className="text-xs text-gray-600">
                  <strong>સમયમર્યાદા:</strong> {cert.certification?.estimated_duration}
                </p>
                <p className="text-xs text-gray-600">
                  <strong>કારકિર્દી પર અસર:</strong> {cert.career_impact}
                </p>
              </div>

              {cert.certification?.direct_enrollment_link && (
                <a 
                  href={cert.certification.direct_enrollment_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors inline-block"
                >
                  હવે એનરોલ કરો
                </a>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ComprehensiveAIInsightsComponent;
