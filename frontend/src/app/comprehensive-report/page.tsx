'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  Brain,
  Target,
  AlertCircle,
  Briefcase,
  Users,
  Lightbulb,
  Heart,
  Rocket,
  Eye
} from 'lucide-react';
import { aiInsightsService } from '@/services/aiInsightsService';
import { aiInsightsHistoryService } from '@/services/aiInsightsHistoryService';
import { completionStatusService } from '@/services/completionStatusService';
import { aiInsightsAsyncService, TaskStatusResponse } from '@/services/aiInsightsAsyncService';
import { getCurrentUserId } from '@/utils/userUtils';
import { clearUserDataCache } from '@/hooks/useTestResults';
import ComprehensiveAIInsightsComponent from '@/components/ComprehensiveAIInsights';

interface TestResult {
  test_id: string;
  test_name: string;
  analysis: any;
  score: number;
  percentage: number;
  dimensions_scores: any;
  recommendations: string[];
  timestamp: string;
  completed_at: string;
}

interface CompletionStatus {
  allCompleted: boolean;
  completedTests: string[];
  missingTests: string[];
  totalTests: number;
  completionPercentage: number;
}

const ComprehensiveReportPage = () => {
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus | null>(null);
  const [allTestResults, setAllTestResults] = useState<Record<string, TestResult>>({});
  const [comprehensiveInsights, setComprehensiveInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'completion' | 'ai_generation' | 'data_fetch'>('completion');
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [showCounselingPopup, setShowCounselingPopup] = useState(false);

  // Test type icons mapping
  const testIcons = {
    'mbti': Brain,
    'bigfive': Users,
    'vark': Eye,
    'decision': Target,
    'multiple-intelligence': Lightbulb,
    'riasec': Briefcase,
    'svs': Heart,
    'life-situation': Rocket
  };

  // Test type colors mapping
  const testColors = {
    'mbti': 'from-purple-500 to-indigo-600',
    'bigfive': 'from-blue-500 to-cyan-600',
    'vark': 'from-green-500 to-emerald-600',
    'decision': 'from-orange-500 to-red-600',
    'multiple-intelligence': 'from-yellow-500 to-orange-600',
    'riasec': 'from-pink-500 to-rose-600',
    'svs': 'from-teal-500 to-blue-600',
    'life-situation': 'from-violet-500 to-purple-600'
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get user ID from multiple sources with priority
      let userId = localStorage.getItem('userId');

      // If no userId in localStorage, try to get from user_data
      if (!userId) {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          try {
            const parsedUserData = JSON.parse(userData);
            userId = parsedUserData.id;
            // Store it for future use
            if (userId) {
              localStorage.setItem('userId', userId);
            }
          } catch (e) {
            console.warn('Failed to parse user_data from localStorage');
          }
        }
      }

      // Final fallback to demo user
      if (!userId) {
        userId = '11dc4aec-2216-45f9-b045-60edac007262';
        console.warn('🚨 Using fallback demo user ID. User may not be authenticated.');
      }

      console.log('🔍 Comprehensive report for user:', userId);
      console.log('🔍 User ID length:', userId?.length);
      console.log('🔍 User ID type:', typeof userId);

      // Fetch completion status using new service (with cache-busting for fresh data)
      const statusResponse = await completionStatusService.getCompletionStatus(userId, true);
      console.log('🔍 Raw completion status response:', JSON.stringify(statusResponse, null, 2));

      // ✅ FIXED: Handle both old and new API response formats
      const completedTests = statusResponse.data.completed_tests || [];
      const totalTests = statusResponse.data.total_tests || 7;
      const completionPercentage = statusResponse.data.completion_percentage || 0;

      // Calculate missing tests
      const allStandardTests = ['mbti', 'intelligence', 'riasec', 'bigfive', 'decision', 'vark', 'life-situation'];
      const missingTests = allStandardTests.filter(test => !completedTests.includes(test));

      // Check if all tests are completed
      const allCompleted = completedTests.length === totalTests && completionPercentage === 100;

      const status = {
        allCompleted: allCompleted,
        completedTests: completedTests,
        missingTests: missingTests,
        totalTests: totalTests,
        completionPercentage: completionPercentage
      };
      setCompletionStatus(status);

      console.log('✅ Completion status:', status);

      if (!status.allCompleted) {
        setError(`કૃપા કરીને સંપૂર્ણ રિપોર્ટ જોવા માટે બધા ટેસ્ટ પૂર્ણ કરો.
        પૂર્ણ: ${status.completedTests?.length || 0}/${status.totalTests || 7} ટેસ્ટ`);
        setErrorType('completion');
        setLoading(false);
        return;
      }

      // Fetch all test results
      const results = await aiInsightsService.getAllTestResults(userId);
      const testResults = results.all_test_results || results || {};
      setAllTestResults(testResults as Record<string, TestResult>);

      // ✅ Show counseling call popup when all tests completed (AI disabled - show immediately)
      setShowCounselingPopup(true);

      // Generate comprehensive insights using async service
      setGeneratingInsights(true);
      setProgressMessage('રિપોર્ટ તૈયાર કરી રહ્યું છે...');
      setProgressPercentage(0);

      // 🚀 Start Celery worker (with timeout to prevent hanging)
      console.log('🚀 Starting Celery worker for comprehensive report...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const workerResponse = await fetch('https://lcj-celery-worker.onrender.com/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log('✅ Celery worker started:', workerResponse.status);
      } catch (workerError) {
        console.warn('⚠️ Could not reach Celery worker, but continuing with comprehensive insights generation:', workerError);
      }

      try {
        const insightsResponse = await aiInsightsAsyncService.generateComprehensiveInsightsAsync(
          results,
          (progress: TaskStatusResponse) => {
            // Update progress in real-time
            const message = aiInsightsAsyncService.getProgressMessage(progress);
            const percentage = progress.progress?.progress || 0;

            setProgressMessage(message);
            setProgressPercentage(percentage);
          }
        );

        if (insightsResponse && insightsResponse.success && insightsResponse.insights) {
          // Check if this is a redirect response (AI insights already exist)
          if (insightsResponse.insights.redirect_to_history) {
            console.log('🔄 Redirecting to test history - AI insights already exist');
            // Show a brief message before redirecting
            setProgressMessage('AI રિપોર્ટ પહેલેથી જ તૈયાર છે. ટેસ્ટ હિસ્ટરીમાં રીડાયરેક્ટ કરી રહ્યું છે...');
            setProgressPercentage(100);

            // Redirect after a short delay to show the message
            setTimeout(() => {
              window.location.href = '/profile?tab=history&highlight=ai-insights';
            }, 1500);
            return;
          }

          setComprehensiveInsights(insightsResponse.insights);
          setProgressMessage('રિપોર્ટ તૈયાર થઈ ગઈ!');
          setProgressPercentage(100);

          // ✅ Invalidate cache after successful comprehensive insights generation
          const userId = getCurrentUserId();
          if (userId) {
            console.log(`✅ ComprehensiveReportPage: Comprehensive insights generated, invalidating cache for user ${userId}`);
            aiInsightsHistoryService.invalidateCache(userId);
            clearUserDataCache(userId);
          }
        } else if (insightsResponse && insightsResponse.error) {
          // Show the error message from the backend
          setError(insightsResponse.error);
          setErrorType('ai_generation');
        } else {
          setError('AI insights are currently unavailable. Please try again later.');
          setErrorType('ai_generation');
        }
      } catch (insightError: any) {
        console.error('Failed to generate insights:', insightError);

        // Check if this is a timeout error
        if (insightError.message?.includes('timeout') || insightError.message?.includes('સમય લાગી રહ્યો છે')) {
          setError('AI રિપોર્ટ બનાવવામાં સમય લાગી રહ્યો છે. કૃપા કરીને ફરીથી પ્રયાસ કરો અથવા પ્રોફાઈલ પેજ પર જઈને ટેસ્ટ હિસ્ટરી તપાસો.');
        } else {
          setError(insightError.message || 'AI insights service is temporarily unavailable. Please try again in a few minutes.');
        }
        setErrorType('ai_generation');
      }
      setGeneratingInsights(false);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('ડેટા લોડ કરવામાં ભૂલ આવી છે.');
      setErrorType('data_fetch');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setError(null);
    setErrorType('completion');
    setComprehensiveInsights(null);

    // Clear cache before retrying
    try {
      const userId = getCurrentUserId();
      if (userId) {
        await completionStatusService.clearCompletionCache(userId);
        console.log('✅ Cache cleared before retry');
      }
    } catch (error) {
      console.warn('⚠️ Failed to clear cache:', error);
    }

    fetchData();
  };


  if (loading || generatingInsights) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white/90 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-orange-200 max-w-lg mx-auto"
        >
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-orange-200 border-t-orange-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-orange-500 animate-pulse" />
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4">
            {loading ? 'રિપોર્ટ તૈયાર કરી રહ્યું છે' : 'AI વિશ્લેષણ કરી રહ્યું છે'}
          </h2>
          <p className="text-gray-600 text-lg mb-4">
            {loading ? 'તમારા પરીક્ષણ પરિણામોનું વિશ્લેષણ કરી રહ્યું છે...' : progressMessage}
          </p>

          {generatingInsights && (
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{progressPercentage}% પૂર્ણ</p>
            </div>
          )}

          <div className="flex justify-center space-x-2 mt-6">
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ✅ FIXED: Only show error if we have insights AND error (not just error alone)
  // If insights were generated successfully, show them even if error was set earlier
  if ((error || !completionStatus?.allCompleted) && !comprehensiveInsights) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto text-center bg-white/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-orange-200"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4">
            {errorType === 'completion' ? 'પ્રવેશ પ્રતિબંધિત' :
             errorType === 'ai_generation' ? 'AI રિપોર્ટ બનાવવામાં સમસ્યા' :
             'ડેટા લોડ કરવામાં સમસ્યા'}
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {error || 'સંપૂર્ણ રિપોર્ટ જોવા માટે કૃપા કરીને બધા ટેસ્ટ પૂર્ણ કરો.'}
          </p>

          {errorType === 'completion' ? (
            <motion.button
              onClick={() => window.location.href = '/test-selection'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              ટેસ્ટ પૂર્ણ કરો
            </motion.button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={handleRetry}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ફરી પ્રયાસ કરો
              </motion.button>

              {/* Show "Go to Test History" button for timeout errors */}
              {error?.includes('સમય લાગી રહ્યો છે') || error?.includes('timeout') ? (
                <motion.button
                  onClick={() => window.location.href = '/profile?tab=history&highlight=ai-insights'}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  ટેસ્ટ હિસ્ટરી જુઓ
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => window.location.href = '/profile'}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 bg-gradient-to-r from-gray-500 to-slate-500 text-white rounded-xl font-semibold hover:from-gray-600 hover:to-slate-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  પ્રોફાઈલ પર પાછા જાઓ
                </motion.button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Modern Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-orange-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Top - Back button and Title */}
          <div className="flex items-center space-x-4 py-4">
            <motion.button
              onClick={() => window.history.back()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 hover:bg-orange-100 rounded-xl transition-all duration-300 group flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-orange-600 group-hover:text-orange-700" />
            </motion.button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent truncate">
                સંપૂર્ણ કારકિર્દી રિપોર્ટ
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">AI-આધારિત વ્યક્તિગત કારકિર્દી માર્ગદર્શન</p>
            </div>
          </div>

          {/* Header Bottom - Download Button (Full width on mobile) */}
          <div className="pb-4 sm:pb-0">
            <motion.button
              onClick={() => window.location.href = '/profile?tab=history'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl text-center sm:text-left"
            >
              બધા રિપોર્ટ ડાઉનલોડ કરવા અહીં ક્લિક કરો
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* AI Insights Section */}
        <AnimatePresence>
          {generatingInsights ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-orange-200 text-center"
            >
              <div className="relative mb-8">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-orange-500 animate-pulse" />
                </div>
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4">
                AI વિશ્લેષણ તૈયાર કરી રહ્યું છે
              </h3>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed mb-6">
                {progressMessage || 'અમારું અદ્યતન AI તમારા તમામ પરીક્ષણ પરિણામોનું વિશ્લેષણ કરીને વ્યક્તિગત કારકિર્દી માર્ગદર્શન તૈયાર કરી રહ્યું છે...'}
              </p>

              {/* Progress Bar */}
              <div className="w-full max-w-md mx-auto mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>પ્રગતિ</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="flex justify-center space-x-2 mt-4">
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </motion.div>
          ) : comprehensiveInsights ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ComprehensiveAIInsightsComponent insights={comprehensiveInsights} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-orange-200 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4">
                AI વિશ્લેષણ અનુપલબ્ધ
              </h3>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
                અમને અત્યારે તમારા AI વિશ્લેષણ બનાવવામાં મુશ્કેલી આવી રહી છે. કૃપા કરીને ફરીથી પ્રયાસ કરો.
              </p>
              <motion.button
                onClick={fetchData}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ફરીથી પ્રયાસ કરો
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Counseling Call Popup Modal */}
        <AnimatePresence>
          {showCounselingPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCounselingPopup(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-orange-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">
                  🎉 અભિનંદન!
                </h3>

                {/* Message */}
                <div className="text-center space-y-4">
                  <p className="text-lg text-gray-700 font-medium">
                    તમે બધા ટેસ્ટ સફળતાપૂર્વક પૂર્ણ કરી લીધા છે!
                  </p>

                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                    <p className="text-orange-800 font-semibold text-lg mb-2">
                      📞 24 કલાકમાં કોલ આવશે
                    </p>
                    <p className="text-orange-700 text-sm leading-relaxed">
                      તમારા કારકિર્દી કાઉન્સેલિંગ માટે અમારી ટીમ તરફથી 24 કલાકની અંદર તમને ફોન કરવામાં આવશે.
                    </p>
                  </div>

                  <p className="text-sm text-gray-500">
                    તમારા ડેટા પર આધારિત વ્યક્તિગત માર્ગદર્શન માટે તૈયાર રહો!
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowCounselingPopup(false)}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  સમજાઈ ગયું
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16 py-8 border-t border-orange-200"
        >
          <p className="text-gray-500 text-sm">
            આ રિપોર્ટ {new Date().toLocaleDateString('gu-IN')} ના રોજ જનરેટ કરવામાં આવ્યો છે
          </p>
          <p className="text-orange-600 font-medium text-sm mt-2">
            Life Changing Journey - તમારી કારકિર્દીનો સાથી
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ComprehensiveReportPage;
