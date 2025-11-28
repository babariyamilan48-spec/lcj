'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { testResultService, TestResultResponse, UserAnalytics } from '@/services/testResultService';
import { useOptimizedUserData } from '@/hooks/useTestResults';
import { useReportDownload, useProfileDashboard } from '@/hooks/useResultsService';  // ✅ Added useProfileDashboard
import { aiInsightsHistoryService, AIInsightsHistoryItem } from '@/services/aiInsightsHistoryService';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Eye, 
  Trash2, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Brain,
  Target,
  Award,
  Download,
  FileText,
  Sparkles
} from 'lucide-react';

interface TestResultHistoryProps {
  userId: number;
  testId?: string;
}

const TestResultHistory: React.FC<TestResultHistoryProps> = ({ userId, testId }) => {

  // ✅ FIXED: Use useProfileDashboard hook which includes AI insights in response
  const { dashboardData, loading, error: hookError } = useProfileDashboard(userId.toString());
  const { downloading, error: downloadError, downloadReport } = useReportDownload();
  const [results, setResults] = useState<TestResultResponse[]>([]);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [selectedResult, setSelectedResult] = useState<TestResultResponse | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsightsHistoryItem[]>([]);

  useEffect(() => {
    if (dashboardData) {
      console.log('📊 [TestResultHistory] Dashboard data received:', dashboardData);
      console.log('📊 [TestResultHistory] AI insights:', dashboardData.ai_insights);
      // ✅ FIXED: Process data with AI insights from combined response
      processDataWithAIInsights(dashboardData, dashboardData.ai_insights || []);
    }
    if (hookError) {
      setError(hookError);
    }
  }, [dashboardData, testId, hookError]);

  const handleRefresh = async () => {
    console.log('🔄 Refreshing test history...');
    // Invalidate cache
    aiInsightsHistoryService.invalidateCache(userId.toString());
    
    // Re-fetch data using the hook's refetch method
    // Note: useProfileDashboard will automatically refetch when needed
  };

  // ✅ REMOVED: fetchAIInsightsAndProcessData - now handled directly in useEffect above

  const processDataWithAIInsights = (dashboardData: any, aiInsightsHistory: AIInsightsHistoryItem[]) => {
    try {
      console.log('🔄 [processDataWithAIInsights] Processing data...');
      console.log('📊 Dashboard data:', dashboardData);
      console.log('🤖 AI insights:', aiInsightsHistory);
      
      // ✅ FIXED: Handle both old format (latest_test_results) and new format (results)
      const testResults = dashboardData?.results || dashboardData?.latest_test_results || [];
      console.log('📋 Test results extracted:', testResults);
      
      // Convert test results to TestResultResponse format for compatibility
      const convertedResults: TestResultResponse[] = testResults.map((result: any) => ({
        id: parseInt(result.id) || Math.floor(Math.random() * 1000000),
        userId: userId.toString(),
        testId: result.test_id,
        primaryResult: result.primary_result,
        resultSummary: result.result_name_english || result.result_name_gujarati || result.test_name,
        calculatedResult: {},
        completionPercentage: 100, // Results are always complete
        isCompleted: true,
        createdAt: result.completed_at || result.completion_date || new Date().toISOString(),
        updatedAt: result.completed_at || result.completion_date || new Date().toISOString(),
        timeTakenSeconds: null,
        details: []
      }));
      
        // ✅ FIXED: Convert AI insights to TestResultResponse format with correct field mapping
      const aiInsightsResults: TestResultResponse[] = (aiInsightsHistory || []).map((insight: any) => ({
        id: parseInt(insight.id?.replace('ai_insights_', '') || Math.random().toString()),
        userId: userId.toString(),
        testId: insight.test_id || 'comprehensive-ai-insights',
        primaryResult: insight.primary_result || 'AI_INSIGHTS',
        resultSummary: insight.result_name_gujarati || insight.test_name || 'AI વિશ્લેષણ',
        calculatedResult: insight.insights_data || {},  // ✅ Include insights data
        completionPercentage: insight.percentage || insight.score || 100,
        isCompleted: true,
        createdAt: insight.completion_date || insight.timestamp || new Date().toISOString(),
        updatedAt: insight.completion_date || insight.timestamp || new Date().toISOString(),
        timeTakenSeconds: undefined,
        details: [],
        answers: [] // AI insights don't have answers
      }));

      // Combine regular results with AI insights, prioritizing AI insights at the top
      const allResults = [...aiInsightsResults, ...convertedResults];

      // Filter by testId if specified, then sort to keep AI insights at top
      let filteredResults = testId 
        ? allResults.filter(r => r.testId === testId)
        : allResults;
      
      // ✅ FIXED: Filter to only include the 7 standard tests (plus AI insights)
      const STANDARD_TESTS = [
        'mbti',  // ✅ Fixed from 'mbit'
        'intelligence',
        'riasec',
        'bigfive',
        'decision',
        'vark',
        'life-situation'
      ];
      
      filteredResults = filteredResults.filter(r => 
        r.testId === 'comprehensive-ai-insights' || 
        STANDARD_TESTS.includes(r.testId)
      );
      
      // Sort to ensure AI insights are always at the top, then by test order
      filteredResults = filteredResults.sort((a, b) => {
        const aIsAI = a.testId === 'comprehensive-ai-insights';
        const bIsAI = b.testId === 'comprehensive-ai-insights';
        
        // AI insights first
        if (aIsAI && !bIsAI) return -1;
        if (!aIsAI && bIsAI) return 1;
        
        // For standard tests, sort by test order (as defined in STANDARD_TESTS)
        const aOrder = STANDARD_TESTS.indexOf(a.testId);
        const bOrder = STANDARD_TESTS.indexOf(b.testId);
        if (aOrder !== bOrder) return aOrder - bOrder;
        
        // If same test type, sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      // ✅ FIXED: Create analytics from dashboard data (both old and new formats)
      const mockAnalytics: UserAnalytics = {
        totalTestsCompleted: dashboardData?.analytics?.completed_tests || testResults.length,
        averageCompletionTime: 300, // 5 minutes default
        testsByType: testResults.reduce((acc: any, result: any) => {
          acc[result.test_id] = 1;
          return acc;
        }, {}),
        completionTimeline: testResults.map((result: any) => ({
          testId: result.test_id,
          completedAt: result.completed_at || result.completion_date || new Date().toISOString(),
          primaryResult: result.primary_result
        })),
        latestResults: testResults.reduce((acc: any, result: any) => {
          acc[result.test_id] = {
            primaryResult: result.primary_result,
            completedAt: result.completed_at || result.completion_date || new Date().toISOString(),
            resultSummary: result.result_name_english || result.result_name_gujarati || result.test_name
          };
          return acc;
        }, {})
      };
      
      console.log('✅ [processDataWithAIInsights] Filtered results:', filteredResults);
      console.log('📊 [processDataWithAIInsights] Analytics:', mockAnalytics);
      
      setResults(filteredResults);
      setAnalytics(mockAnalytics);
      setError(null); // Clear any previous errors on successful load
      
      console.log('✅ [processDataWithAIInsights] State updated successfully');
    } catch (err) {
      console.error('❌ [processDataWithAIInsights] Error:', err);
      setError('પરિણામો લોડ કરવામાં ભૂલ થઈ');
    }
  };

  const handleDeleteResult = async (resultId: number) => {
    setIsDeleting(resultId);
    try {
      await testResultService.deleteTestResult(resultId);
      setResults(results.filter(r => r.id !== resultId));
      setError(null); // Clear any previous errors
    } catch (err) {
      setError('પરિણામ કાઢવામાં ભૂલ થઈ');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewResult = (result: TestResultResponse) => {
    if (result.testId === 'comprehensive-ai-insights') {
      // For AI insights, redirect to comprehensive report page
      window.location.href = '/comprehensive-report';
    } else {
      // For regular tests, show the test result detail modal
      setSelectedResult(result);
    }
  };

  const handleDownload = async (format: 'pdf' | 'json' | 'csv' = 'pdf') => {
    try {
      await downloadReport(userId.toString(), format, true);
      setError(null); // Clear any previous errors on successful download
    } catch (err) {
      setError('ડાઉનલોડ નિષ્ફળ');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('gu-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ FIXED: Define the 7 standard tests in order (corrected 'mbit' to 'mbti')
  const STANDARD_TESTS = [
    'mbti',  // ✅ Fixed from 'mbit'
    'intelligence',
    'riasec',
    'bigfive',
    'decision',
    'vark',
    'life-situation'
  ];

  const getTestName = (testId: string): string => {
    const testNames: { [key: string]: string } = {
      'mbti': 'MBTI Test',  // ✅ Fixed from 'mbit'
      'intelligence': 'Intelligence Test',
      'riasec': 'RAISEC Test',
      'bigfive': 'Big Five Test',
      'decision': 'Decision Test',
      'vark': 'VARK Test',
      'life-situation': 'Life Situation Test',
      'comprehensive-ai-insights': 'સંપૂર્ણ AI વિશ્લેષણ રિપોર્ટ'
    };
    return testNames[testId] || testId;
  };

  // Get test order for sorting
  const getTestOrder = (testId: string): number => {
    const index = STANDARD_TESTS.indexOf(testId);
    return index === -1 ? 999 : index;
  };

  const getTestIcon = (testId: string) => {
    if (testId === 'comprehensive-ai-insights') {
      return <Sparkles className="w-5 h-5 text-white" />;
    }
    return <Brain className="w-5 h-5 text-white" />;
  };

  const getTestIconStyle = (testId: string): string => {
    if (testId === 'comprehensive-ai-insights') {
      return "w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center";
    }
    return "w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">લોડ કરી રહ્યા છીએ...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
        <button
          onClick={() => setError(null)}
          className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
        >
          ભૂલ છુપાવો (Hide Error)
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-6 h-6" />
              <span className="text-xs opacity-80">કુલ પરીક્ષણો</span>
            </div>
            <div className="text-2xl font-bold">{analytics.totalTestsCompleted}</div>
            <div className="text-xs opacity-80">પૂર્ણ થયેલા</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-6 h-6" />
              <span className="text-xs opacity-80">સરેરાશ સમય</span>
            </div>
            <div className="text-2xl font-bold">
              {Math.round(analytics.averageCompletionTime / 60)}મિ
            </div>
            <div className="text-xs opacity-80">પ્રતિ પરીક્ષણ</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-6 h-6" />
              <span className="text-xs opacity-80">પરીક્ષણ પ્રકારો</span>
            </div>
            <div className="text-2xl font-bold">
              {Object.keys(analytics.testsByType).length}
            </div>
            <div className="text-xs opacity-80">વિવિધ પ્રકારો</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6" />
              <span className="text-xs opacity-80">પ્રગતિ</span>
            </div>
            <div className="text-2xl font-bold">
              {analytics.completionTimeline.length > 1 ? '+' : ''}
              {analytics.completionTimeline.length}
            </div>
            <div className="text-xs opacity-80">પરિણામો</div>
          </div>
        </motion.div>
      )}

      {/* Download Report Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Download className="w-5 h-5 mr-2" />
            રિપોર્ટ ડાઉનલોડ કરો
          </h3>
        </div>
        
        <button
          onClick={() => handleDownload('pdf')}
          disabled={downloading}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <FileText className="w-5 h-5 mr-2" />
          {downloading ? 'ડાઉનલોડ થઈ રહ્યું છે...' : 'રિપોર્ટ ડાઉનલોડ કરો'}
        </button>
        
        {downloadError && (
          <div className="mt-3 text-red-600 text-sm">
            ભૂલ: {downloadError}
          </div>
        )}
        
        <div className="mt-3 text-sm text-gray-600">
          <p>સંપૂર્ણ ફોર્મેટેડ PDF રિપોર્ટ AI સલાહ અને વિશ્લેષણ સાથે ડાઉનલોડ કરો</p>
        </div>
      </motion.div>

      {/* Results List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <BarChart3 className="w-6 h-6 mr-2" />
          પરીક્ષણ પરિણામોનો ઇતિહાસ
        </h3>

        {results.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>કોઈ પરિણામો મળ્યા નથી</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={getTestIconStyle(result.testId)}>
                        {getTestIcon(result.testId)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {getTestName(result.testId)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {result.resultSummary}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(result.createdAt)}
                      </div>
                      {result.timeTakenSeconds && (
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {Math.round(result.timeTakenSeconds / 60)} મિનિટ
                        </div>
                      )}
                      <div className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {result.completionPercentage}% પૂર્ણ
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewResult(result)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="પરિણામ જુઓ"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload('pdf')}
                      disabled={downloading}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="PDF ડાઉનલોડ કરો"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteResult(result.id)}
                      disabled={isDeleting === result.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={isDeleting === result.id ? "કાઢી રહ્યા છીએ..." : "કાઢી નાખો"}
                    >
                      {isDeleting === result.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {result.primaryResult && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center">
                      <Award className="w-4 h-4 text-yellow-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        મુખ્ય પરિણામ: {result.primaryResult}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Result Detail Modal */}
      <AnimatePresence>
        {selectedResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedResult(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {getTestName(selectedResult.testId)}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload('pdf')}
                    disabled={downloading}
                    className="flex items-center px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                    title="PDF ડાઉનલોડ કરો"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </button>
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">પૂર્ણ થયું:</span>
                    <p className="font-medium">{formatDate(selectedResult.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">પૂર્ણતા:</span>
                    <p className="font-medium">{selectedResult.completionPercentage}%</p>
                  </div>
                </div>

                <div>
                  <span className="text-gray-600 text-sm">પરિણામ સારાંશ:</span>
                  <p className="font-medium mt-1">{selectedResult.resultSummary}</p>
                </div>

                <div>
                  <span className="text-gray-600 text-sm">મુખ્ય પરિણામ:</span>
                  <p className="font-medium mt-1">{selectedResult.primaryResult}</p>
                </div>

                {selectedResult.details && selectedResult.details.length > 0 && (
                  <div>
                    <span className="text-gray-600 text-sm">વિગતવાર પરિણામો:</span>
                    <div className="mt-2 space-y-2">
                      {selectedResult.details.map((detail, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-sm">{detail.dimensionName}</span>
                            <span className="text-sm text-gray-600">{detail.percentageScore}%</span>
                          </div>
                          {detail.level && (
                            <span className="text-xs text-gray-500">{detail.level}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestResultHistory;
