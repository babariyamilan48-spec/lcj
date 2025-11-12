/**
 * Optimized Result Submission Component
 * Ultra-fast result submission with real-time performance monitoring
 */

import React, { useState, useCallback } from 'react';
import { useSubmitResultFast } from '../hooks/useOptimizedApi';

interface OptimizedResultSubmissionProps {
  testId: number;
  userId: string;
  onSubmissionComplete?: (result: any) => void;
  onSubmissionError?: (error: string) => void;
  className?: string;
}

interface SubmissionState {
  phase: 'idle' | 'preparing' | 'submitting' | 'processing' | 'complete' | 'error';
  message: string;
  progress: number;
  startTime?: number;
  endTime?: number;
}

export const OptimizedResultSubmission: React.FC<OptimizedResultSubmissionProps> = ({
  testId,
  userId,
  onSubmissionComplete,
  onSubmissionError,
  className = ''
}) => {
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    phase: 'idle',
    message: 'Ready to submit results',
    progress: 0
  });

  const [testResults, setTestResults] = useState({
    answers: {} as Record<number, any>,
    timeSpent: 0,
    completionPercentage: 0
  });

  const { submitResult, loading, error, success } = useSubmitResultFast();

  const handleSubmitResults = useCallback(async (resultData: any) => {
    const startTime = performance.now();
    
    setSubmissionState({
      phase: 'preparing',
      message: 'Preparing submission data...',
      progress: 10,
      startTime
    });

    try {
      // Simulate data preparation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setSubmissionState(prev => ({
        ...prev,
        phase: 'submitting',
        message: 'Submitting to optimized endpoint...',
        progress: 30
      }));

      const submissionData = {
        user_id: userId,
        test_id: testId,
        answers: resultData.answers || testResults.answers,
        time_taken_seconds: resultData.timeSpent || testResults.timeSpent,
        completion_percentage: resultData.completionPercentage || testResults.completionPercentage,
        is_completed: true,
        submitted_at: new Date().toISOString(),
        ...resultData
      };

      const result = await submitResult(submissionData);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      setSubmissionState({
        phase: 'complete',
        message: 'Results submitted successfully!',
        progress: 100,
        startTime,
        endTime
      });

      onSubmissionComplete?.(result);
      
      // Auto-reset after 3 seconds
      setTimeout(() => {
        setSubmissionState({
          phase: 'idle',
          message: 'Ready to submit results',
          progress: 0
        });
      }, 3000);

    } catch (error) {
      const endTime = performance.now();
      const errorMessage = error instanceof Error ? error.message : 'Submission failed';
      
      setSubmissionState({
        phase: 'error',
        message: errorMessage,
        progress: 0,
        startTime,
        endTime
      });

      onSubmissionError?.(errorMessage);
    }
  }, [userId, testId, testResults, submitResult, onSubmissionComplete, onSubmissionError]);

  const renderSubmissionProgress = () => {
    const getPhaseColor = () => {
      switch (submissionState.phase) {
        case 'complete': return 'bg-green-500';
        case 'error': return 'bg-red-500';
        case 'submitting': case 'preparing': case 'processing': return 'bg-blue-500';
        default: return 'bg-gray-400';
      }
    };

    const getPhaseIcon = () => {
      switch (submissionState.phase) {
        case 'complete': return '✓';
        case 'error': return '✗';
        case 'submitting': case 'preparing': case 'processing': return '⟳';
        default: return '○';
      }
    };

    return (
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getPhaseColor()}`}
            style={{ width: `${submissionState.progress}%` }}
          />
        </div>

        {/* Status */}
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getPhaseColor()}`}>
            {submissionState.phase === 'submitting' ? (
              <div className="animate-spin">⟳</div>
            ) : (
              getPhaseIcon()
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">{submissionState.message}</div>
            <div className="text-sm text-gray-600">
              Phase: {submissionState.phase} • Progress: {submissionState.progress}%
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPerformanceMetrics = () => {
    if (submissionState.phase !== 'complete' || !submissionState.startTime || !submissionState.endTime) {
      return null;
    }

    const totalTime = submissionState.endTime - submissionState.startTime;
    const isOptimal = totalTime < 1000; // Under 1 second is optimal

    return (
      <div className={`mt-4 p-4 rounded-lg border ${isOptimal ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-center space-x-2 mb-3">
          <div className={`w-2 h-2 rounded-full ${isOptimal ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className={`text-sm font-medium ${isOptimal ? 'text-green-800' : 'text-yellow-800'}`}>
            Submission Performance
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className={isOptimal ? 'text-green-700' : 'text-yellow-700'}>Total Time:</span>
            <div className={`font-medium ${isOptimal ? 'text-green-900' : 'text-yellow-900'}`}>
              {totalTime.toFixed(0)}ms
            </div>
          </div>
          
          <div>
            <span className={isOptimal ? 'text-green-700' : 'text-yellow-700'}>Performance:</span>
            <div className={`font-medium ${isOptimal ? 'text-green-900' : 'text-yellow-900'}`}>
              {isOptimal ? 'Optimal' : 'Good'}
            </div>
          </div>
          
          <div>
            <span className={isOptimal ? 'text-green-700' : 'text-yellow-700'}>Endpoint:</span>
            <div className={`font-medium ${isOptimal ? 'text-green-900' : 'text-yellow-900'}`}>
              Optimized
            </div>
          </div>
          
          <div>
            <span className={isOptimal ? 'text-green-700' : 'text-yellow-700'}>Status:</span>
            <div className={`font-medium ${isOptimal ? 'text-green-900' : 'text-yellow-900'}`}>
              Success
            </div>
          </div>
        </div>

        {!isOptimal && (
          <div className="mt-2 text-xs text-yellow-700">
            Submission took longer than expected. This may indicate network issues or high server load.
          </div>
        )}
      </div>
    );
  };

  const renderTestForm = () => {
    if (submissionState.phase !== 'idle') return null;

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Test Submission Form</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Completion Percentage
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={testResults.completionPercentage}
              onChange={(e) => setTestResults(prev => ({
                ...prev,
                completionPercentage: parseInt(e.target.value) || 0
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Spent (seconds)
            </label>
            <input
              type="number"
              min="0"
              value={testResults.timeSpent}
              onChange={(e) => setTestResults(prev => ({
                ...prev,
                timeSpent: parseInt(e.target.value) || 0
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sample Answers (JSON)
          </label>
          <textarea
            value={JSON.stringify(testResults.answers, null, 2)}
            onChange={(e) => {
              try {
                const answers = JSON.parse(e.target.value);
                setTestResults(prev => ({ ...prev, answers }));
              } catch (error) {
                // Invalid JSON, ignore
              }
            }}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder='{"1": "A", "2": "B", "3": "C"}'
          />
        </div>

        <button
          onClick={() => handleSubmitResults(testResults)}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Submit Test Results (Optimized)
        </button>
      </div>
    );
  };

  const renderError = () => {
    if (submissionState.phase !== 'error') return null;

    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-sm font-medium text-red-800">Submission Error</span>
        </div>
        
        <div className="text-sm text-red-700 mb-3">
          {error || submissionState.message}
        </div>
        
        <button
          onClick={() => setSubmissionState({
            phase: 'idle',
            message: 'Ready to submit results',
            progress: 0
          })}
          className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  };

  return (
    <div className={`p-6 bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Optimized Result Submission
        </h3>
        <div className="text-sm text-gray-500">
          Test ID: {testId} • User: {userId}
        </div>
      </div>

      {renderSubmissionProgress()}
      {renderPerformanceMetrics()}
      {renderTestForm()}
      {renderError()}
    </div>
  );
};

export default OptimizedResultSubmission;
