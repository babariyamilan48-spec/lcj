'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Printer, Download, FileText, Calendar, User, Award, TrendingUp, Brain, ArrowLeft } from 'lucide-react';
import { MBTIResults, IntelligenceResults, BigFiveResults, RIASECResults, VARKResults, SVSResults, DecisionResults } from '@/components/results';
import LifeSituationResults from '@/components/results/LifeSituationResults';
import ComprehensiveAIInsights from '@/components/ComprehensiveAIInsights';
import api from '@/services/api';

interface ComprehensiveReportData {
  user_id: string;
  generated_at: string;
  summary: {
    total_tests_completed: number;
    average_score: number;
    achievements: number;
    report_generation_date: string;
  };
  test_results: Record<string, any>;
  ai_insights?: {
    model_used: string;
    insights_data: any;
    generated_at: string;
  };
  metadata: {
    includes_ai_insights: boolean;
    total_sections: number;
  };
}

// Component for individual test result section
const TestResultSection = ({ testId, testData, index, userId, getTestDisplayName, formatScore }: {
  testId: string;
  testData: any;
  index: number;
  userId: string;
  getTestDisplayName: (testId: string, testName?: string) => string;
  formatScore: (score: any) => string;
}) => {
  const [calculatedResult, setCalculatedResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Prepare test results data
  const testResults = {
    testId: testId,
    answers: testData?.answers || {},
    timestamp: testData?.created_at || testData?.completed_at,
    sessionId: testData?.id || `${testId}_${index}`
  };

  // Use pre-calculated data directly (no recalculation)
  useEffect(() => {
    if (testData) {
      console.log(`✅ Using pre-calculated data for ${testId}`);
      
      // Use the pre-calculated analysis directly
      const result = {
        type: getTestDisplayName(testId, testData?.test_name),
        testType: testId,
        completedAt: testData?.created_at || testData?.completed_at,
        totalQuestions: testData?.total_questions || 0,
        score: testData?.score || testData?.percentage_score || 0,
        // Use pre-calculated data
        ...(testData?.analysis || testData?.calculated_result || {}),
        traits: testData?.traits,
        careers: testData?.careers,
        strengths: testData?.strengths,
        recommendations: testData?.recommendations,
        dimensions_scores: testData?.dimensions_scores,
        primary_result: testData?.primary_result
      };
      
      setCalculatedResult(result);
    }
    setIsCalculating(false);
  }, [testId, testData, getTestDisplayName]);

  if (isCalculating) {
    return (
      <section className="mb-16 print:mb-12 print:break-inside-avoid">
        <div className="mb-8 pb-4 border-b-2 border-gray-200">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
            </div>
            <h2 className="text-2xl print:text-xl font-bold text-gray-900">
              {getTestDisplayName(testId, testData?.test_name)}
            </h2>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Calculating results...</span>
        </div>
      </section>
    );
  }

  if (!calculatedResult) {
    return (
      <section className="mb-16 print:mb-12 print:break-inside-avoid">
        <div className="mb-8 pb-4 border-b-2 border-gray-200">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 font-bold text-sm">{index + 1}</span>
            </div>
            <h2 className="text-2xl print:text-xl font-bold text-gray-900">
              {getTestDisplayName(testId, testData?.test_name)}
            </h2>
          </div>
        </div>
        <div className="p-8 text-center bg-red-50 rounded-lg">
          <p className="text-red-600">Unable to load test results</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12 sm:mb-16 print:mb-12 print:break-inside-avoid">
      {/* Test Header */}
      <div className="mb-4 sm:mb-8 pb-3 sm:pb-4 print:pb-6 border-b-2 border-gray-200">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-bold text-xs sm:text-sm">{index + 1}</span>
          </div>
          <h2 className="text-base sm:text-2xl print:text-xl font-bold text-gray-900 truncate">
            {getTestDisplayName(testId, testData?.test_name)}
          </h2>
        </div>
      </div>

      {/* Render the exact same component as individual test pages */}
      <div className="test-result-content print:mt-6">
        {(() => {
          try {
            switch (testId) {
              case 'mbti':
                return <MBTIResults calculatedResult={calculatedResult} testResults={testResults} />;
              case 'intelligence':
                return <IntelligenceResults calculatedResult={calculatedResult} testResults={testResults} />;
              case 'bigfive':
                return <BigFiveResults calculatedResult={calculatedResult} testResults={testResults} />;
              case 'riasec':
                return <RIASECResults calculatedResult={calculatedResult} testResults={testResults} />;
              case 'vark':
                return <VARKResults calculatedResult={calculatedResult} testResults={testResults} />;
              case 'svs':
                return <SVSResults calculatedResult={calculatedResult} testResults={testResults} />;
              case 'decision':
                return <DecisionResults calculatedResult={calculatedResult} testResults={testResults} />;
              case 'life-situation':
                return <LifeSituationResults 
                  calculatedResult={calculatedResult} 
                  testResults={testResults}
                  userAnswers={testData?.answers || {}}
                  questions={[]}
                />;
              default:
                return (
                  <div className="p-8 text-center bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">{testData?.test_name}</h3>
                    <p className="text-gray-600 mb-4">Score: {formatScore(testData?.score || testData?.percentage_score)}</p>
                    {testData?.analysis && (
                      <div className="text-left">
                        <h4 className="font-semibold mb-2">Analysis:</h4>
                        <p className="text-gray-700 text-sm">
                          {typeof testData.analysis === 'string' ? testData.analysis : JSON.stringify(testData.analysis)}
                        </p>
                      </div>
                    )}
                  </div>
                );
            }
          } catch (error) {
            console.error(`❌ Error rendering ${testId}:`, error);
            return (
              <div className="p-8 text-center bg-red-50 rounded-lg border border-red-200">
                <h3 className="text-xl font-bold text-red-800 mb-4">Error Loading {testData?.test_name}</h3>
                <p className="text-red-600 mb-4">Component failed to render</p>
              </div>
            );
          }
        })()}
      </div>
    </section>
  );
};

const ComprehensiveReportPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewMode = searchParams.get('view'); // Get the view query parameter
  const [reportData, setReportData] = useState<ComprehensiveReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        console.log('🔄 Fetching comprehensive report for user:', params.userId);
        const response = await api.get(`/api/v1/results_service/comprehensive-report/${params.userId}`);
        console.log('✅ Report data received:', response.data);
        setReportData(response.data);
      } catch (err: any) {
        console.error('❌ Error fetching report:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch report data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (params.userId) {
      fetchReportData();
    }
  }, [params.userId]);

  // Fetch user profile to get username
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const response = await api.get('/api/v1/auth_service/user/profile');
        if (response.data?.data?.username) {
          setUsername(response.data.data.username);
        }
      } catch (err) {
        console.error('Error fetching username:', err);
      }
    };

    fetchUsername();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.push('/profile');
  };

  const getTestDisplayName = (testId: string, testName?: string): string => {
    if (testName) return testName;
    
    const displayNames: Record<string, string> = {
      'mbti': 'MBTI Personality Type',
      'bigfive': 'Big Five Personality Traits',
      'riasec': 'Career Interest (RIASEC)',
      'intelligence': 'Intelligence Assessment',
      'vark': 'Learning Style (VARK)',
      'decision': 'Decision Making Style',
      'life-situation': 'Life Situation Analysis',
      'svs': 'Values Assessment'
    };
    
    return displayNames[testId] || `${testId.toUpperCase()} Test`;
  };

  const formatScore = (score: any): string => {
    if (score === null || score === undefined) return '0%';
    if (typeof score === 'number') return `${Math.round(score)}%`;
    if (typeof score === 'string') return score.includes('%') ? score : `${score}%`;
    return '0%';
  };

  // Define the standard test order
  const testOrder = ['mbti', 'intelligence', 'riasec', 'bigfive', 'decision', 'vark', 'life-situation'];

  // Sort tests according to the standard order
  const getSortedTestResults = () => {
    const entries = Object.entries(reportData?.test_results || {});
    return entries.sort(([testIdA], [testIdB]) => {
      const indexA = testOrder.indexOf(testIdA);
      const indexB = testOrder.indexOf(testIdB);
      
      // If both are in the standard order, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only A is in the standard order, it comes first
      if (indexA !== -1) return -1;
      // If only B is in the standard order, it comes first
      if (indexB !== -1) return 1;
      // If neither is in the standard order, keep original order
      return 0;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Report</h1>
          <p className="text-gray-600">{error || 'Report data not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            margin: 0;
            padding: 0;
            font-size: 12pt;
            line-height: 1.4;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          .print\\:break-before-page {
            break-before: page;
          }
          .print-title-page {
            margin: 0 !important;
            padding: 0 !important;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            page-break-after: always;
            break-after: page;
          }
        }
        
        /* Test result content styling */
        .test-result-content {
          /* Ensure proper spacing and layout for individual test components */
        }
        
        @media print {
          .print-content > section:first-of-type {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
          
          /* Print header and footer */
          @page {
            margin: 1.5cm 1cm;
            @top-center {
              content: "જીવન પરિવર્તન સફર - Life Changing Journey";
              font-size: 10pt;
              font-weight: normal;
              color: #4b5563;
              text-align: center;
              padding-bottom: 0.3cm;
            }
            @bottom-left {
              content: "Milan Babariya";
              font-size: 11pt;
              color: #4b5563;
              font-weight: 500;
            }
            @bottom-center {
              content: "Page " counter(page) " of " counter(pages);
              font-size: 11pt;
              color: #4b5563;
              font-weight: 500;
            }
            @bottom-right {
              content: "+91 6354571342";
              font-size: 11pt;
              color: #4b5563;
              font-weight: 500;
            }
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        {/* Back Button - Top Navigation */}
        <div className="no-print bg-white border-b border-gray-200 p-4">
          <div className="max-w-7xl mx-auto">
            <motion.button
              onClick={handleBack}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2 px-4 py-2.5 text-sm bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg transition-colors duration-200 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>પાછળ</span>
            </motion.button>
          </div>
        </div>

        {/* Header - Hidden in print */}
        <div className="no-print bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                <button
                  onClick={handleBack}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                  title="Back to Profile"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-3xl font-bold truncate">
                    {viewMode === 'ai-insights-only' ? 'AI Analysis' : 'Test Report'}
                  </h1>
                  <p className="text-orange-100 text-xs sm:text-sm truncate">
                    {viewMode === 'ai-insights-only' ? 'AI insights & recommendations' : 'All assessments'}
                  </p>
                </div>
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium flex-shrink-0 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Download Full Report</span>
                <span className="sm:hidden">Download Full Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div 
          className="max-w-7xl mx-auto p-6 print-content print:p-0 print:m-0"
          style={{ '--print-username': `"User: ${username || 'User'}"` } as React.CSSProperties}
        >
          {/* Title Page - Only visible in print */}
          <div className="print-title-page hidden print:flex print:flex-col print:items-center print:justify-center print:h-screen print:break-after-page print:relative">
            {/* Main Content - Center */}
            <div className="print:text-center">
              <h1 className="print:text-8xl font-bold text-gray-800 text-center mb-8" style={{ fontSize: '120px', lineHeight: '1.2' }}>
                જીવન પરિવર્તન સફર
              </h1>
              <p className="text-2xl text-gray-600 text-center mb-4">Life Changing Journey</p>
              <p className="text-lg text-gray-500 text-center">
                Your Comprehensive Assessment Report
              </p>
            </div>
            
            {/* Course Maker Info - Right Side */}
            <div className="print:absolute print:right-8 print:bottom-16 print:text-right">
              <p className="print:text-2xl print:font-bold print:text-gray-900 print:mb-2">Milan Babariya</p>
              <p className="print:text-lg print:text-gray-600">+91 6354571342</p>
            </div>
          </div>

          {/* Show only AI Insights if view mode is set */}
          {viewMode === 'ai-insights-only' ? (
            <>
              {/* AI Insights Only View */}
              {reportData.ai_insights ? (
                <section className="mb-12 sm:mb-16 print:mb-12 print:break-inside-avoid">
                  {/* AI Header */}
                  <div className="mb-4 sm:mb-8 pb-3 sm:pb-4 border-b-2 border-gray-200">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                      </div>
                      <h2 className="text-base sm:text-2xl print:text-xl font-bold text-gray-900 truncate">
                        AI વિશ્લેષણ (Comprehensive AI Analysis)
                      </h2>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      Generated: {reportData.ai_insights.generated_at ? new Date(reportData.ai_insights.generated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'} • Model: {reportData.ai_insights.model_used}
                    </p>
                  </div>

                  {/* Render the exact same AI component as individual pages */}
                  <div className="test-result-content">
                    <ComprehensiveAIInsights 
                      insights={typeof reportData.ai_insights.insights_data === 'string' 
                        ? JSON.parse(reportData.ai_insights.insights_data) 
                        : reportData.ai_insights.insights_data
                      } 
                    />
                  </div>
                </section>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">AI insights not available yet</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Full Comprehensive Report View */}
              {/* Individual Test Results - Sorted in standard order */}
              {getSortedTestResults()
                .filter(([testId]) => testId !== 'comprehensive-ai-insights') // Handle AI insights separately
                .map(([testId, testData]: [string, any], index) => (
                  <TestResultSection 
                    key={testId}
                    testId={testId}
                    testData={testData}
                    index={index}
                    userId={params.userId as string}
                    getTestDisplayName={getTestDisplayName}
                    formatScore={formatScore}
                  />
                ))}

              {/* AI Insights Section - Same as Individual Page */}
              {reportData.ai_insights && (
                <section className="mb-12 sm:mb-16 print:mb-12 print:break-inside-avoid">
                  {/* AI Header */}
                  <div className="mb-4 sm:mb-8 pb-3 sm:pb-4 border-b-2 border-gray-200">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                      </div>
                      <h2 className="text-base sm:text-2xl print:text-xl font-bold text-gray-900 truncate">
                        AI વિશ્લેષણ (Comprehensive AI Analysis)
                      </h2>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      Generated: {reportData.ai_insights.generated_at ? new Date(reportData.ai_insights.generated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'} • Model: {reportData.ai_insights.model_used}
                    </p>
                  </div>

                  {/* Render the exact same AI component as individual pages */}
                  <div className="test-result-content">
                    <ComprehensiveAIInsights 
                      insights={typeof reportData.ai_insights.insights_data === 'string' 
                        ? JSON.parse(reportData.ai_insights.insights_data) 
                        : reportData.ai_insights.insights_data
                      } 
                    />
                  </div>
                </section>
              )}
            </>
          )}

          {/* Report Footer */}
          <footer className="mt-16 print:mt-8 pt-8 print:pt-4 border-t border-gray-300 text-center text-sm text-gray-500">
            <div className="print:hidden">
              <p>This comprehensive report was generated on {reportData.summary.report_generation_date}</p>
              <p className="mt-1">LCJ Career Assessment System • Comprehensive Analysis Report</p>
            </div>
            {/* Username for print footer */}
            <div id="print-footer-username" className="hidden print:block print:text-xs print:text-gray-600 print:border-t print:pt-2 print:mt-4">
              User: {username || 'User'}
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default ComprehensiveReportPage;
