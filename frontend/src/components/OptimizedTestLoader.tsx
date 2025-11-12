/**
 * Optimized Test Loader Component
 * Ultra-fast test loading with performance monitoring and caching
 */

import React, { useEffect, useState } from 'react';
import { useTestQuestionsFast, useTestStructureFast } from '../hooks/useOptimizedApi';

interface OptimizedTestLoaderProps {
  testId: number;
  onQuestionsLoaded: (questions: any[]) => void;
  onStructureLoaded?: (structure: any) => void;
  loadStructure?: boolean;
  showPerformance?: boolean;
  className?: string;
}

interface LoadingState {
  phase: 'initializing' | 'loading' | 'processing' | 'complete' | 'error';
  message: string;
  progress: number;
}

export const OptimizedTestLoader: React.FC<OptimizedTestLoaderProps> = ({
  testId,
  onQuestionsLoaded,
  onStructureLoaded,
  loadStructure = false,
  showPerformance = true,
  className = ''
}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    phase: 'initializing',
    message: 'Initializing test loader...',
    progress: 0
  });

  // Load test questions with optimized hook
  const {
    data: questionsData,
    loading: questionsLoading,
    error: questionsError,
    performance: questionsPerformance
  } = useTestQuestionsFast(testId, {
    onSuccess: (data) => {
      setLoadingState({
        phase: 'processing',
        message: 'Processing questions...',
        progress: 75
      });
      
      setTimeout(() => {
        onQuestionsLoaded(data.questions || []);
        setLoadingState({
          phase: 'complete',
          message: 'Test loaded successfully!',
          progress: 100
        });
      }, 100);
    },
    onError: (error) => {
      setLoadingState({
        phase: 'error',
        message: `Failed to load questions: ${error}`,
        progress: 0
      });
    }
  });

  // Load test structure if requested
  const {
    data: structureData,
    loading: structureLoading,
    error: structureError,
    performance: structurePerformance
  } = useTestStructureFast(testId, {
    immediate: loadStructure,
    onSuccess: (data) => {
      onStructureLoaded?.(data);
    }
  });

  useEffect(() => {
    if (questionsLoading || structureLoading) {
      setLoadingState({
        phase: 'loading',
        message: 'Loading test data...',
        progress: 25
      });
    }
  }, [questionsLoading, structureLoading]);

  const renderPerformanceInfo = () => {
    if (!showPerformance || loadingState.phase !== 'complete') return null;

    const questionsPerfTime = questionsPerformance?.responseTime || 0;
    const structurePerfTime = structurePerformance?.responseTime || 0;
    const totalTime = questionsPerfTime + structurePerfTime;

    return (
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-green-800">Performance Metrics</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-green-700">Questions Load Time:</span>
            <div className="font-medium text-green-900">
              {questionsPerfTime.toFixed(0)}ms
              {questionsPerformance?.cached && (
                <span className="ml-1 text-green-600">(cached)</span>
              )}
            </div>
          </div>
          
          {loadStructure && structurePerformance && (
            <div>
              <span className="text-green-700">Structure Load Time:</span>
              <div className="font-medium text-green-900">
                {structurePerfTime.toFixed(0)}ms
                {structurePerformance?.cached && (
                  <span className="ml-1 text-green-600">(cached)</span>
                )}
              </div>
            </div>
          )}
          
          <div>
            <span className="text-green-700">Total Questions:</span>
            <div className="font-medium text-green-900">
              {(questionsData as any)?.questions?.length || 0}
            </div>
          </div>
          
          <div>
            <span className="text-green-700">Server Response:</span>
            <div className="font-medium text-green-900">
              {questionsPerformance?.serverTime?.toFixed(0) || 0}ms
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLoadingProgress = () => {
    const getPhaseColor = () => {
      switch (loadingState.phase) {
        case 'complete': return 'bg-green-500';
        case 'error': return 'bg-red-500';
        case 'loading': return 'bg-blue-500';
        default: return 'bg-gray-400';
      }
    };

    const getPhaseIcon = () => {
      switch (loadingState.phase) {
        case 'complete': return '✓';
        case 'error': return '✗';
        case 'loading': return '⟳';
        default: return '○';
      }
    };

    return (
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getPhaseColor()}`}
            style={{ width: `${loadingState.progress}%` }}
          />
        </div>

        {/* Status */}
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${getPhaseColor()}`}>
            {getPhaseIcon()}
          </div>
          <div>
            <div className="font-medium text-gray-900">{loadingState.message}</div>
            <div className="text-sm text-gray-600">
              Phase: {loadingState.phase} • Progress: {loadingState.progress}%
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderError = () => {
    if (loadingState.phase !== 'error') return null;

    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-sm font-medium text-red-800">Error Details</span>
        </div>
        
        <div className="text-sm text-red-700 mb-3">
          {questionsError || structureError || 'Unknown error occurred'}
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 transition-colors"
        >
          Retry Loading
        </button>
      </div>
    );
  };

  const renderQuestionsList = () => {
    if (loadingState.phase !== 'complete' || !(questionsData as any)?.questions) return null;

    return (
      <div className="mt-4 space-y-3">
        <h4 className="font-medium text-gray-900">
          Loaded Questions ({(questionsData as any)?.questions?.length || 0})
        </h4>
        
        <div className="max-h-40 overflow-y-auto space-y-2">
          {(questionsData as any)?.questions?.slice(0, 5).map((question: any, index: number) => (
            <div key={question.id} className="p-2 bg-gray-50 rounded border">
              <div className="text-sm font-medium text-gray-900">
                {index + 1}. {question.question_text?.substring(0, 60)}...
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {question.options?.length || 0} options • Order: {question.question_order}
              </div>
            </div>
          ))}
          
          {(questionsData as any)?.questions?.length > 5 && (
            <div className="text-xs text-gray-500 text-center py-2">
              ... and {(questionsData as any)?.questions?.length - 5} more questions
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`p-6 bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Optimized Test Loader
        </h3>
        <div className="text-sm text-gray-500">
          Test ID: {testId}
        </div>
      </div>

      {renderLoadingProgress()}
      {renderPerformanceInfo()}
      {renderError()}
      {renderQuestionsList()}
    </div>
  );
};

export default OptimizedTestLoader;
