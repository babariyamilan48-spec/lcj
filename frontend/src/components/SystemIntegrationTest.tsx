/**
 * System Integration Test Component
 * Comprehensive testing of all optimized endpoints and features
 */

import React, { useState, useCallback } from 'react';
import { optimizedApiService } from '../services/optimizedApiService';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  responseTime?: number;
  error?: string;
  data?: any;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  status: 'pending' | 'running' | 'complete';
}

export const SystemIntegrationTest: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallResults, setOverallResults] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    avgResponseTime: 0
  });

  const testUserId = '54a78417-a72e-4274-a625-a1cb27ea0ed5';
  const testTestId = 1;

  const updateTestResult = useCallback((suiteIndex: number, testIndex: number, result: Partial<TestResult>) => {
    setTestSuites(prev => prev.map((suite, sIndex) => 
      sIndex === suiteIndex 
        ? {
            ...suite,
            tests: suite.tests.map((test, tIndex) => 
              tIndex === testIndex ? { ...test, ...result } : test
            )
          }
        : suite
    ));
  }, []);

  const runSingleTest = async (
    suiteIndex: number, 
    testIndex: number, 
    testFn: () => Promise<any>
  ): Promise<void> => {
    const startTime = performance.now();
    
    updateTestResult(suiteIndex, testIndex, { status: 'running' });
    
    try {
      const result = await testFn();
      const responseTime = performance.now() - startTime;
      
      updateTestResult(suiteIndex, testIndex, {
        status: 'success',
        responseTime,
        data: result
      });
    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      updateTestResult(suiteIndex, testIndex, {
        status: 'error',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    const suites: TestSuite[] = [
      {
        name: 'Results Service Tests',
        status: 'pending',
        tests: [
          { name: 'Submit Result Fast', status: 'pending' },
          { name: 'Get User Results Fast', status: 'pending' },
          { name: 'Get All Results Fast', status: 'pending' },
          { name: 'Get Latest Result Fast', status: 'pending' },
          { name: 'Get Batch User Data Fast', status: 'pending' },
          { name: 'Results Health Check', status: 'pending' }
        ]
      },
      {
        name: 'Question Service Tests',
        status: 'pending',
        tests: [
          { name: 'Get Questions Fast', status: 'pending' },
          { name: 'Get Question With Options Fast', status: 'pending' },
          { name: 'Get Test Questions Fast', status: 'pending' },
          { name: 'Get Test Structure Fast', status: 'pending' },
          { name: 'Get Questions Batch Fast', status: 'pending' },
          { name: 'Questions Health Check', status: 'pending' }
        ]
      },
      {
        name: 'System Integration Tests',
        status: 'pending',
        tests: [
          { name: 'System Health Check', status: 'pending' },
          { name: 'Cache Performance Test', status: 'pending' },
          { name: 'Performance Report Test', status: 'pending' },
          { name: 'Error Handling Test', status: 'pending' }
        ]
      }
    ];

    setTestSuites(suites);

    try {
      // Results Service Tests
      await runSingleTest(0, 0, () => 
        optimizedApiService.submitResultFast({
          user_id: testUserId,
          test_id: testTestId,
          answers: { "1": "A", "2": "B" },
          completion_percentage: 100,
          time_taken_seconds: 120,
          is_completed: true
        })
      );

      await runSingleTest(0, 1, () => 
        optimizedApiService.getUserResultsFast(testUserId, 1, 5)
      );

      await runSingleTest(0, 2, () => 
        optimizedApiService.getAllResultsFast(testUserId)
      );

      await runSingleTest(0, 3, () => 
        optimizedApiService.getLatestResultFast(testUserId)
      );

      await runSingleTest(0, 4, () => 
        optimizedApiService.getBatchUserDataFast(testUserId)
      );

      await runSingleTest(0, 5, () => 
        optimizedApiService.checkResultsHealthFast()
      );

      // Question Service Tests
      await runSingleTest(1, 0, () => 
        optimizedApiService.getQuestionsFast({ limit: 10, testId: testTestId })
      );

      await runSingleTest(1, 1, () => 
        optimizedApiService.getQuestionWithOptionsFast(1)
      );

      await runSingleTest(1, 2, () => 
        optimizedApiService.getTestQuestionsFast(testTestId)
      );

      await runSingleTest(1, 3, () => 
        optimizedApiService.getTestStructureFast(testTestId)
      );

      await runSingleTest(1, 4, () => 
        optimizedApiService.getQuestionsBatchFast([1, 2, 3])
      );

      await runSingleTest(1, 5, () => 
        optimizedApiService.checkQuestionsHealthFast()
      );

      // System Integration Tests
      await runSingleTest(2, 0, () => 
        optimizedApiService.checkSystemHealth()
      );

      await runSingleTest(2, 1, async () => {
        // Test cache performance by making the same request twice
        const start1 = performance.now();
        await optimizedApiService.getQuestionsFast({ limit: 5 });
        const time1 = performance.now() - start1;

        const start2 = performance.now();
        await optimizedApiService.getQuestionsFast({ limit: 5 });
        const time2 = performance.now() - start2;

        return {
          firstCall: time1,
          secondCall: time2,
          cacheImprovement: time1 > time2 ? `${((time1 - time2) / time1 * 100).toFixed(1)}%` : 'No improvement'
        };
      });

      await runSingleTest(2, 2, async () => {
        const report = optimizedApiService.getPerformanceReport();
        const cacheStats = optimizedApiService.getCacheStats();
        return { report, cacheStats };
      });

      await runSingleTest(2, 3, async () => {
        // Test error handling with invalid endpoint
        try {
          await fetch('/api/v1/invalid-endpoint');
          throw new Error('Should have failed');
        } catch (error) {
          return { errorHandled: true, error: error.message };
        }
      });

      // Calculate overall results
      const allTests = suites.flatMap(suite => suite.tests);
      const completedTests = testSuites.flatMap(suite => suite.tests);
      const passed = completedTests.filter(test => test.status === 'success').length;
      const failed = completedTests.filter(test => test.status === 'error').length;
      const responseTimes = completedTests
        .filter(test => test.responseTime)
        .map(test => test.responseTime!);
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;

      setOverallResults({
        total: allTests.length,
        passed,
        failed,
        avgResponseTime
      });

    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const renderTestResult = (test: TestResult) => {
    const getStatusIcon = () => {
      switch (test.status) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'running': return '⏳';
        default: return '⏸️';
      }
    };

    const getStatusColor = () => {
      switch (test.status) {
        case 'success': return 'text-green-600';
        case 'error': return 'text-red-600';
        case 'running': return 'text-blue-600';
        default: return 'text-gray-600';
      }
    };

    return (
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getStatusIcon()}</span>
          <span className="font-medium text-gray-900">{test.name}</span>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          {test.responseTime && (
            <span className={`font-medium ${
              test.responseTime < 500 ? 'text-green-600' : 
              test.responseTime < 1000 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {test.responseTime.toFixed(0)}ms
            </span>
          )}
          
          <span className={`capitalize ${getStatusColor()}`}>
            {test.status}
          </span>
        </div>
      </div>
    );
  };

  const renderTestSuite = (suite: TestSuite, index: number) => (
    <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{suite.name}</h3>
      <div className="space-y-2">
        {suite.tests.map((test, testIndex) => (
          <div key={testIndex}>
            {renderTestResult(test)}
          </div>
        ))}
      </div>
    </div>
  );

  const renderOverallResults = () => {
    if (overallResults.total === 0) return null;

    const successRate = (overallResults.passed / overallResults.total) * 100;

    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Results</h3>
        
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{overallResults.total}</div>
            <div className="text-sm text-gray-600">Total Tests</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-green-600">{overallResults.passed}</div>
            <div className="text-sm text-gray-600">Passed</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-red-600">{overallResults.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {overallResults.avgResponseTime.toFixed(0)}ms
            </div>
            <div className="text-sm text-gray-600">Avg Response</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Success Rate</span>
            <span className="text-sm font-medium text-gray-900">{successRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                successRate >= 90 ? 'bg-green-500' : 
                successRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          System Integration Test
        </h1>
        <p className="text-gray-600">
          Comprehensive testing of all optimized endpoints and system integration
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      {renderOverallResults()}

      <div className="space-y-6">
        {testSuites.map((suite, index) => renderTestSuite(suite, index))}
      </div>
    </div>
  );
};

export default SystemIntegrationTest;
