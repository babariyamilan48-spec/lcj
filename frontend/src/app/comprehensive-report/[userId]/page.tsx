'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Printer, Download, FileText, Calendar, User, Award, TrendingUp, Brain } from 'lucide-react';
import { MBTIResults, IntelligenceResults, BigFiveResults, RIASECResults, VARKResults, SVSResults, DecisionResults } from '@/components/results';
import LifeSituationResults from '@/components/results/LifeSituationResults';
import ComprehensiveAIInsights from '@/components/ComprehensiveAIInsights';
import { calculateTestResult } from '@/utils/testResultCalculators';
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
  const [isCalculating, setIsCalculating] = useState(true);

  // Prepare test results data
  const testResults = {
    testId: testId,
    answers: testData?.answers || {},
    timestamp: testData?.completed_at,
    sessionId: testData?.id || `${testId}_${index}`
  };

  // Calculate result from answers (same as individual test pages)
  useEffect(() => {
    const calculateResult = async () => {
      if (testData?.answers && Object.keys(testData.answers).length > 0) {
        try {
          console.log(`🔄 Calculating result for ${testId} from answers...`);
          const result = await calculateTestResult(
            testId,
            testData.answers,
            userId,
            testData?.id || `${testId}_${index}`
          );
          
          if (result) {
            setCalculatedResult({
              ...result,
              testType: testId,
              completedAt: testData?.completed_at,
              totalQuestions: Object.keys(testData.answers).length
            });
          } else {
            // Fallback to stored analysis
            setCalculatedResult({
              type: getTestDisplayName(testId, testData?.test_name),
              testType: testId,
              completedAt: testData?.completed_at,
              totalQuestions: testData?.total_questions || 0,
              score: testData?.score || testData?.percentage_score || 0,
              ...testData?.analysis
            });
          }
        } catch (error) {
          console.error(`❌ Error calculating ${testId}:`, error);
          // Fallback to stored analysis
          setCalculatedResult({
            type: getTestDisplayName(testId, testData?.test_name),
            testType: testId,
            completedAt: testData?.completed_at,
            totalQuestions: testData?.total_questions || 0,
            score: testData?.score || testData?.percentage_score || 0,
            ...testData?.analysis
          });
        }
      } else {
        // No answers available, use stored analysis
        setCalculatedResult({
          type: getTestDisplayName(testId, testData?.test_name),
          testType: testId,
          completedAt: testData?.completed_at,
          totalQuestions: testData?.total_questions || 0,
          score: testData?.score || testData?.percentage_score || 0,
          ...testData?.analysis
        });
      }
      setIsCalculating(false);
    };
    
    calculateResult();
  }, [testId, testData, userId, index, getTestDisplayName]);

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
    <section className="mb-16 print:mb-12 print:break-inside-avoid">
      {/* Test Header */}
      <div className="mb-8 pb-4 border-b-2 border-gray-200">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
          </div>
          <h2 className="text-2xl print:text-xl font-bold text-gray-900">
            {getTestDisplayName(testId, testData?.test_name)}
          </h2>
        </div>
        <p className="text-gray-600 text-sm">
          Completed: {testData?.completed_at ? new Date(testData.completed_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'N/A'}
        </p>
      </div>

      {/* Render the exact same component as individual test pages */}
      <div className="test-result-content">
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
  const [reportData, setReportData] = useState<ComprehensiveReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handlePrint = () => {
    window.print();
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
        }
        
        /* Test result content styling */
        .test-result-content {
          /* Ensure proper spacing and layout for individual test components */
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        {/* Header - Hidden in print */}
        <div className="no-print bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Comprehensive Test Report</h1>
              <p className="text-orange-100">Complete analysis of all your assessments</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-6 print-content">
          {/* Print Header - Only visible in print */}
          <div className="print-header hidden print:block text-center mb-8 pb-4 border-b-2 border-gray-200">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Comprehensive Assessment Report</h1>
            <p className="text-gray-600">Complete Personality and Career Analysis</p>
            <p className="text-sm text-gray-500 mt-2">
              Generated on {reportData.summary.report_generation_date}
            </p>
          </div>

          {/* Executive Summary */}
          <section className="mb-12 print:mb-8">
            <h2 className="text-2xl print:text-xl font-bold text-gray-900 mb-6 border-b-2 border-orange-600 pb-2">
              Executive Summary
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 print:gap-4">
              <div className="bg-blue-50 print:bg-white print:border print:border-gray-300 rounded-lg p-6 print:p-4 text-center">
                <div className="flex items-center justify-center mb-3">
                  <User className="w-6 h-6 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 ml-2">Tests Completed</h3>
                </div>
                <p className="text-3xl print:text-2xl font-bold text-blue-600">
                  {reportData.summary.total_tests_completed}
                </p>
              </div>
              
              <div className="bg-green-50 print:bg-white print:border print:border-gray-300 rounded-lg p-6 print:p-4 text-center">
                <div className="flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <h3 className="font-semibold text-gray-900 ml-2">Average Score</h3>
                </div>
                <p className="text-3xl print:text-2xl font-bold text-green-600">
                  {formatScore(reportData.summary.average_score)}
                </p>
              </div>
              
              <div className="bg-purple-50 print:bg-white print:border print:border-gray-300 rounded-lg p-6 print:p-4 text-center">
                <div className="flex items-center justify-center mb-3">
                  <Brain className="w-6 h-6 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 ml-2">AI Analysis</h3>
                </div>
                <p className="text-lg print:text-base font-semibold text-purple-600">
                  {reportData.metadata.includes_ai_insights ? 'Available' : 'Not Available'}
                </p>
              </div>
            </div>
          </section>

          {/* Individual Test Results - Same as Individual Pages */}
          {Object.entries(reportData.test_results)
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
            <section className="mb-16 print:mb-12 print:break-inside-avoid">
              {/* AI Header */}
              <div className="mb-8 pb-4 border-b-2 border-gray-200">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-2xl print:text-xl font-bold text-gray-900">
                    સંપૂર્ણ AI વિશ્લેષણ રિપોર્ટ (Comprehensive AI Analysis)
                  </h2>
                </div>
                <p className="text-gray-600 text-sm">
                  Generated: {reportData.ai_insights.generated_at ? new Date(reportData.ai_insights.generated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
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

          {/* Report Footer */}
          <footer className="mt-16 print:mt-8 pt-8 print:pt-4 border-t border-gray-300 text-center text-sm text-gray-500">
            <p>This comprehensive report was generated on {reportData.summary.report_generation_date}</p>
            <p className="mt-1">LCJ Career Assessment System • Comprehensive Analysis Report</p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default ComprehensiveReportPage;
