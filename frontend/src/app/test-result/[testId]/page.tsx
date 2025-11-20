'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Printer
} from 'lucide-react';
import { calculateTestResult } from '@/utils/testResultCalculators';
import { MBTIResults, IntelligenceResults, BigFiveResults, RIASECResults, VARKResults, SVSResults, DecisionResults } from '@/components/results';
import LifeSituationResults from '@/components/results/LifeSituationResults';
import ComprehensiveAIInsights from '@/components/ComprehensiveAIInsights';
import { resultsService } from '@/services/resultsService';
import { useAuth } from '@/contexts/AuthContext';
import { aiInsightsHistoryService } from '@/services/aiInsightsHistoryService';

interface TestResult {
  id: string;
  test_id: string;
  test_name: string;
  completed_at: string;
  percentage_score: number;
  analysis: any;
  duration_minutes?: number;
  answers?: any;
}

export default function TestResultPage() {
  console.log('🔍 Individual Test Result Page: Component rendering...');
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const testId = params?.testId as string;
  console.log('🔍 Individual Test Result Page: testId:', testId);
  console.log('🔍 Individual Test Result Page: userId:', user?.id);
  
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [calculatedResult, setCalculatedResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestResult = async () => {
      if (!user?.id || !testId) return;

      try {
        setIsLoading(true);
        
        // Special handling for AI insights
        if (testId === 'comprehensive-ai-insights') {
          
          const aiInsights = await aiInsightsHistoryService.getAIInsights(user.id);
          
          if (!aiInsights) {
            setError('AI insights not found');
            return;
          }

          // Convert AI insights to TestResult format
          const aiTestResult: TestResult = {
            id: 'ai-insights',
            test_id: 'comprehensive-ai-insights',
            test_name: 'સંપૂર્ણ AI વિશ્લેષણ રિપોર્ટ (Comprehensive AI Analysis)',
            completed_at: aiInsights.generated_at,
            percentage_score: 100,
            analysis: aiInsights.insights_data,
            duration_minutes: 0
          };

          setTestResult(aiTestResult);
          setCalculatedResult({
            testType: 'comprehensive-ai-insights',
            aiInsights: typeof aiInsights.insights_data === 'string' 
              ? JSON.parse(aiInsights.insights_data) 
              : aiInsights.insights_data,
            completedAt: aiInsights.generated_at
          });
          return;
        }
        
        // Get user's regular test results
        console.log('🔍 Individual Test Result: Fetching user results for testId:', testId);
        const userResults = await resultsService.getUserResults(user.id);
        console.log('🔍 Individual Test Result: User results received:', userResults);
        
        // Find the specific test result
        const foundResult = userResults.results.find((result: any) => 
          result.test_id === testId
        );
        console.log('🔍 Individual Test Result: Found result for testId:', testId, foundResult);

        if (!foundResult) {
          console.error('❌ Individual Test Result: Test result not found for testId:', testId);
          console.log('📋 Available test IDs:', userResults.results.map((r: any) => r.test_id));
          setError('Test result not found');
          return;
        }

        // Convert the result to match our interface
        console.log('🔍 Raw foundResult fields:', Object.keys(foundResult));
        console.log('🔍 Raw foundResult data:', foundResult);
        
        const convertedResult: TestResult = {
          id: String(foundResult.id),
          test_id: foundResult.test_id,
          test_name: foundResult.test_name || (foundResult as any).primary_result || `${foundResult.test_id.toUpperCase()} Test`,
          completed_at: foundResult.completed_at || (foundResult as any).created_at,
          percentage_score: foundResult.percentage_score || (foundResult as any).completion_percentage || 100,
          analysis: foundResult.analysis || (foundResult as any).calculated_result,
          duration_minutes: foundResult.duration_minutes || 0,
          answers: foundResult.answers || (foundResult as any).user_answers
        };
        
        console.log('🔍 Converted result:', convertedResult);

        console.log('✅ Individual Test Result: Setting test result:', convertedResult);
        setTestResult(convertedResult);

        // Calculate result from stored answers if available
        console.log('🔍 Individual Test Result: Checking answers:', foundResult.answers);
        if (foundResult.answers && Object.keys(foundResult.answers).length > 0) {
          console.log('🔄 Individual Test Result: Calculating result from answers...');
          const result = await calculateTestResult(
            foundResult.test_id,
            foundResult.answers,
            user.id,
            String(foundResult.id)
          );
          
          if (result) {
            setCalculatedResult({
              ...result,
              testType: foundResult.test_id,
              completedAt: foundResult.completed_at,
              totalQuestions: Object.keys(foundResult.answers).length
            });
          } else {
            setCalculatedResult(foundResult.analysis);
          }
        } else {
          console.log('🔄 Individual Test Result: Using analysis as calculated result');
          // Use the analysis data directly and format it properly
          const analysisData = (foundResult as any).calculated_result || foundResult.analysis;
          console.log('🔍 Individual Test Result: Analysis data:', analysisData);
          
          if (analysisData) {
            // Set the correct type for each test
            let testType = '';
            switch (foundResult.test_id) {
              case 'mbti':
                testType = 'MBTI Test';
                break;
              case 'vark':
                testType = 'VARK Learning Style';
                break;
              case 'bigfive':
                testType = 'Big Five Personality Test';
                break;
              case 'intelligence':
                testType = 'Multiple Intelligence Test';
                break;
              case 'riasec':
                testType = 'RIASEC Career Interest Test';
                break;
              case 'decision':
                testType = 'Decision Making Style Test';
                break;
              case 'life-situation':
                testType = 'Life Situation Assessment';
                break;
              default:
                testType = `${foundResult.test_id.toUpperCase()} Test`;
            }
            
            setCalculatedResult({
              ...analysisData,
              type: testType,
              testType: foundResult.test_id,
              completedAt: foundResult.completed_at || (foundResult as any).created_at
            });
          } else {
            setCalculatedResult(foundResult.analysis);
          }
        }
      } catch (err) {
        console.error('❌ Individual Test Result: Error fetching test result:', err);
        setError('Failed to load test result');
      } finally {
        console.log('🔄 Individual Test Result: Setting loading to false');
        setIsLoading(false);
      }
    };

    fetchTestResult();
  }, [user?.id, testId]);

  const handlePrint = () => {
    // Set unique filename based on test type
    const originalTitle = document.title;
    const testName = testResult?.test_name || 'Test Result';
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Set document title for PDF filename
    document.title = `${testName}_Report_${timestamp}.pdf`;
    
    // Print the document
    window.print();
    
    // Restore original title after a short delay
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handleBack = () => {
    router.push('/profile');
  };

  const renderTestContent = () => {
    console.log('🔍 renderTestContent: Render state check:', { isLoading, error, hasTestResult: !!testResult, testResult });
    
    if (isLoading) {
      console.log('🔄 renderTestContent: Showing loading spinner');
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
        </div>
      );
    }

    if (error || !testResult) {
      console.log('❌ renderTestContent: Showing error state:', { error, testResult });
      return (
        <div className="text-center py-12">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Error Loading Test Result</h3>
          <p className="text-gray-600 mb-6">{error || 'Test result not found'}</p>
          <button
            onClick={handleBack}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Back to Profile
          </button>
        </div>
      );
    }

    const processedAnswers = testResult.answers ? 
      (typeof testResult.answers === 'object' ? testResult.answers : {}) : {};

    const testResults = {
      testId: testResult.test_id,
      answers: processedAnswers,
      timestamp: testResult.completed_at,
      sessionId: testResult.id
    };

    console.log('🔍 renderTestContent: About to render test content for:', testResult.test_id);
    console.log('🔍 renderTestContent: calculatedResult:', calculatedResult);
    console.log('🔍 renderTestContent: testResults:', testResults);
    
    try {
      switch (testResult.test_id) {
        case 'mbti':
          console.log('✅ renderTestContent: Rendering MBTIResults component');
          return <MBTIResults calculatedResult={calculatedResult} testResults={testResults} />;
        case 'intelligence':
          console.log('✅ renderTestContent: Rendering IntelligenceResults component');
          return <IntelligenceResults calculatedResult={calculatedResult} testResults={testResults} />;
        case 'bigfive':
          console.log('✅ renderTestContent: Rendering BigFiveResults component');
          return <BigFiveResults calculatedResult={calculatedResult} testResults={testResults} />;
        case 'riasec':
          console.log('✅ renderTestContent: Rendering RIASECResults component');
          return <RIASECResults calculatedResult={calculatedResult} testResults={testResults} />;
        case 'vark':
          console.log('✅ renderTestContent: Rendering VARKResults component');
          return <VARKResults calculatedResult={calculatedResult} testResults={testResults} />;
        case 'svs':
          return <SVSResults calculatedResult={calculatedResult} testResults={testResults} />;
        case 'decision':
          return <DecisionResults calculatedResult={calculatedResult} testResults={testResults} />;
        case 'life-situation':
          return <LifeSituationResults 
            calculatedResult={calculatedResult} 
            testResults={testResults}
            userAnswers={processedAnswers}
            questions={[]}
          />;
        case 'comprehensive-ai-insights':
          console.log('✅ renderTestContent: Rendering ComprehensiveAIInsights component');
          return <ComprehensiveAIInsights insights={calculatedResult?.aiInsights} />;
        default:
          console.log('⚠️ renderTestContent: Unknown test type, showing default message for:', testResult.test_id);
          return (
            <div className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{testResult.test_name}</h3>
              <p className="text-gray-600">Test results are being processed...</p>
            </div>
          );
      }
    } catch (error) {
      console.error('❌ renderTestContent: Error rendering test result:', error);
      return (
        <div className="p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">{testResult.test_name}</h3>
          <p className="text-red-600">Error displaying test results. Please try again.</p>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
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
          }
          .print-header {
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          .print-content {
            margin-top: 0;
            padding-top: 0;
          }
          .print-footer {
            page-break-before: avoid;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
          }
          /* Ensure content starts immediately after header */
          .max-w-7xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 20px !important;
          }
          /* Remove any gaps or margins that cause empty space */
          .bg-gray-50 {
            background: white !important;
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
        <div className="no-print bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Back to Profile"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">{testResult?.test_name || 'Test Results'}</h1>
                <p className="text-orange-100">Your detailed personality analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Download Report button removed */}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-6 print-content">
          {/* Print Header - Only visible in print */}
          <div className="print-header hidden print:block text-center mb-8 pb-4 border-b-2 border-gray-200">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{testResult?.test_name}</h1>
            <p className="text-gray-600">Personality Assessment Report</p>
            <p className="text-sm text-gray-500 mt-2">
              Completed on {testResult ? new Date(testResult.completed_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : ''}
            </p>
          </div>
          
          {/* Test Results Content */}
          {renderTestContent()}
        </div>

        {/* Print Footer - Only visible in print */}
        <div className="print-footer hidden print:block text-center py-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Generated by Life Changing Journey • {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </>
  );
}
