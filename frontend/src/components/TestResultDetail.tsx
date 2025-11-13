import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Download,
  X,
  RefreshCw
} from 'lucide-react';
import { useReportDownload } from '../hooks/useResultsService';
import { calculateTestResult } from '../utils/testResultCalculators';
import { MBTIResults, IntelligenceResults, BigFiveResults, RIASECResults, VARKResults, SVSResults, DecisionResults } from './results';
import LifeSituationResults from './results/LifeSituationResults';
import { useAuth } from '@/contexts/AuthContext';
import TestCalculationLoader from './TestCalculationLoader';

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

interface TestResultDetailProps {
  testResult: TestResult;
  onClose: () => void;
}

const TestResultDetail: React.FC<TestResultDetailProps> = ({ testResult, onClose }) => {
  const { downloading, downloadReport } = useReportDownload();
  const { user } = useAuth();
  const [calculatedResult, setCalculatedResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(true);

  const handleDownload = () => {
    // Directly trigger print dialog
    handlePrint();
  };

  const handlePrint = () => {
    // Create a temporary print window with the test content
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get the test content
    const testContent = document.querySelector('.test-result-content');
    
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${testResult.test_name} - Test Report</title>
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              color: #1f2937;
              line-height: 1.6;
            }
            .print-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 20px;
            }
            .print-header h1 {
              color: #1f2937;
              margin: 0 0 10px 0;
              font-size: 28px;
              font-weight: bold;
            }
            .print-header p {
              color: #6b7280;
              margin: 5px 0;
            }
            .print-content {
              max-width: 800px;
              margin: 0 auto;
            }
            .print-footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 12px;
            }
            
            /* Copy all the styles from the original design */
            .bg-white { background-color: white; }
            .rounded-2xl { border-radius: 1rem; }
            .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
            .p-6 { padding: 1.5rem; }
            .p-8 { padding: 2rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mb-8 { margin-bottom: 2rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-8 { margin-top: 2rem; }
            .space-y-3 > * + * { margin-top: 0.75rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            .grid { display: grid; }
            .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .gap-4 { gap: 1rem; }
            .gap-6 { gap: 1.5rem; }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .space-x-3 > * + * { margin-left: 0.75rem; }
            .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .text-2xl { font-size: 1.5rem; line-height: 2rem; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .text-xs { font-size: 0.75rem; line-height: 1rem; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .text-gray-900 { color: #111827; }
            .text-gray-800 { color: #1f2937; }
            .text-gray-700 { color: #374151; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-500 { color: #6b7280; }
            .text-orange-600 { color: #ea580c; }
            .text-orange-500 { color: #f97316; }
            .bg-orange-50 { background-color: #fff7ed; }
            .bg-orange-100 { background-color: #ffedd5; }
            .bg-orange-500 { background-color: #f97316; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .border { border-width: 1px; }
            .border-orange-100 { border-color: #ffedd5; }
            .border-orange-200 { border-color: #fed7aa; }
            .border-gray-200 { border-color: #e5e7eb; }
            .rounded-lg { border-radius: 0.5rem; }
            .rounded-xl { border-radius: 0.75rem; }
            .w-8 { width: 2rem; }
            .h-8 { width: 2rem; }
            .w-4 { width: 1rem; }
            .h-4 { height: 1rem; }
            .text-white { color: white; }
            .text-center { text-align: center; }
            .leading-relaxed { line-height: 1.625; }
            .leading-tight { line-height: 1.25; }
            .block { display: block; }
            .inline-flex { display: inline-flex; }
            .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
            .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
            .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .mr-3 { margin-right: 0.75rem; }
            .ml-2 { margin-left: 0.5rem; }
            
            @media print {
              body { margin: 0; padding: 15px; }
              .print-header { page-break-inside: avoid; }
              .print-content { page-break-inside: avoid; }
              .print-footer { page-break-before: avoid; }
              .shadow-lg { box-shadow: none; }
              .bg-white { background: white !important; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${testResult.test_name}</h1>
            <p>Personality Assessment Report</p>
            <p>Completed on ${new Date(testResult.completed_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
          <div class="print-content">
            ${testContent ? testContent.innerHTML : 'Loading test results...'}
          </div>
          <div class="print-footer">
            <p>Generated by Life Changing Journey • ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  useEffect(() => {
    const calculateResult = async () => {
      if (!testResult) {
        setIsCalculating(false);
        return;
      }

      try {
        setIsCalculating(true);
        
        if (testResult.answers && Object.keys(testResult.answers).length > 0) {
          const result = await calculateTestResult(
            testResult.test_id,
            testResult.answers,
            user?.id || '1',
            testResult.id
          );
          
          if (result) {
            // Ensure all array fields contain strings, not objects
            const sanitizedResult = {
              ...result,
              testType: testResult.test_id,
              completedAt: testResult.completed_at,
              totalQuestions: Object.keys(testResult.answers).length,
              // Ensure these are arrays of strings
              traits: Array.isArray(result.traits) ? result.traits.map((t: any) => typeof t === 'string' ? t : String(t)) : [],
              strengths: Array.isArray(result.strengths) ? result.strengths.map((s: any) => typeof s === 'string' ? s : String(s)) : [],
              careers: Array.isArray(result.careers) ? result.careers.map((c: any) => typeof c === 'string' ? c : String(c)) : [],
              characteristics: Array.isArray(result.characteristics) ? result.characteristics.map((c: any) => typeof c === 'string' ? c : String(c)) : []
            };
            setCalculatedResult(sanitizedResult);
          } else {
            setCalculatedResult(testResult.analysis);
          }
        } else {
          setCalculatedResult(testResult.analysis);
        }
      } catch (error) {
        console.error('Error calculating result:', error);
        setCalculatedResult(testResult.analysis);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateResult();
  }, [testResult]);

  if (!testResult) {
    return null;
  }

  const renderTestContent = () => {
    if (isCalculating) {
      return (
        <TestCalculationLoader 
          title="Calculating Your Results"
          message="Processing your test answers and generating detailed insights..."
          variant="default"
        />
      );
    }

    // Ensure answers are properly formatted - convert objects to simple key-value pairs if needed
    const processedAnswers = testResult.answers ? 
      (typeof testResult.answers === 'object' ? testResult.answers : {}) : {};

    const testResults = {
      testId: testResult.test_id,
      answers: processedAnswers,
      timestamp: testResult.completed_at,
      sessionId: testResult.id
    };

    try {
      switch (testResult.test_id) {
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
            userAnswers={processedAnswers}
            questions={[]}
          />;
        default:
          return (
            <div className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{testResult.test_name}</h3>
              <p className="text-gray-600">Test results are being processed...</p>
            </div>
          );
      }
    } catch (error) {
      console.error('Error rendering test result:', error);
      return (
        <div className="p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">{testResult.test_name}</h3>
          <p className="text-red-600">Error displaying test results. Please try again.</p>
          <pre className="text-xs text-gray-500 mt-4 max-w-md mx-auto overflow-auto">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold">{testResult.test_name}</h2>
                <p className="text-orange-100">Test Results</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-2" />
                {downloading ? 'Downloading...' : 'Download Report'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-0 test-result-content">
          {renderTestContent()}
        </div>
      </div>

    </div>
  );
};

export default TestResultDetail;
