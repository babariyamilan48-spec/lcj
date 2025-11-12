/**
 * API Test Page
 * Test page to verify API interceptor is working
 */

import React, { useState } from 'react';

const ApiTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testApiCall = async (url: string, description: string) => {
    addResult(`Testing ${description}...`);
    const startTime = performance.now();
    
    try {
      const response = await fetch(url);
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        addResult(`✅ ${description} - ${responseTime.toFixed(0)}ms - Status: ${response.status}`);
      } else {
        addResult(`❌ ${description} - ${responseTime.toFixed(0)}ms - Status: ${response.status}`);
      }
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      addResult(`❌ ${description} - ${responseTime.toFixed(0)}ms - Error: ${error}`);
    }
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    addResult('🚀 Starting API Interceptor Tests...');
    
    // Test old endpoints that should be redirected
    const tests = [
      {
        url: '/api/v1/results_service/results/ab382a72-6059-45af-b9b4-28768cd5ba8a?page=1&size=5',
        description: 'Old Results Endpoint (should redirect to optimized)'
      },
      {
        url: '/api/v1/question_service/tests/?skip=0&limit=10',
        description: 'Old Questions Endpoint (should redirect to optimized)'
      },
      {
        url: '/api/v1/results_service/completion-status/ab382a72-6059-45af-b9b4-28768cd5ba8a',
        description: 'Completion Status (already optimized)'
      }
    ];

    for (const test of tests) {
      await testApiCall(test.url, test.description);
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    addResult('✅ All tests completed!');
    addResult('Check browser console for detailed redirect logs.');
    
    // Show optimization stats
    const stats = (window as any).apiOptimizationStats?.getStats();
    if (stats) {
      addResult(`📊 Optimization Stats: ${stats.interceptedCalls} calls intercepted, ${(stats.totalSavedTime/1000).toFixed(1)}s saved`);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🚀 API Interceptor Test Page
          </h1>
          
          <p className="text-gray-600 mb-6">
            This page tests whether the API interceptor is working correctly by making calls to old endpoints
            and verifying they are redirected to optimized versions.
          </p>

          <div className="mb-6">
            <button
              onClick={runTests}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Running Tests...' : 'Run API Tests'}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <h3 className="text-white font-bold mb-2">Test Results:</h3>
              {testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">What to Look For:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Check browser console for "🚀 API OPTIMIZATION" messages</li>
              <li>• Old endpoints should show redirect messages</li>
              <li>• Response times should be faster for redirected calls</li>
              <li>• Optimization stats should show intercepted calls</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTestPage;
