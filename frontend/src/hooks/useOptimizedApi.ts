/**
 * React Hooks for Optimized API Calls
 * Provides easy-to-use hooks with caching, loading states, and performance monitoring
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { optimizedApiService } from '../services/optimizedApiService';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  performance: {
    responseTime?: number;
    cached?: boolean;
    serverTime?: number;
  } | null;
}

interface UseApiOptions {
  immediate?: boolean;
  cacheKey?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

// Generic hook for API calls
function useOptimizedApi<T>(
  apiCall: () => Promise<any>,
  dependencies: any[] = [],
  options: UseApiOptions = {}
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    performance: null
  });

  const { immediate = true, onSuccess, onError } = options;
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    if (!mountedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    const startTime = performance.now();

    try {
      const response = await apiCall();
      const clientTime = performance.now() - startTime;

      if (!mountedRef.current) return;

      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null,
          performance: {
            responseTime: clientTime,
            cached: response.performance?.cached,
            serverTime: response.performance?.processing_time_ms
          }
        });
        onSuccess?.(response.data);
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error || 'Unknown error'
        }));
        onError?.(response.error || 'Unknown error');
      }
    } catch (error) {
      if (!mountedRef.current) return;

      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      onError?.(errorMessage);
    }
  }, [apiCall, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [...dependencies, execute, immediate]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    refetch: execute,
    isLoading: state.loading
  };
}

// ==================== RESULTS HOOKS ====================

export function useUserResultsFast(
  userId: string,
  page: number = 1,
  size: number = 10,
  options: UseApiOptions = {}
) {
  return useOptimizedApi(
    () => optimizedApiService.getUserResultsFast(userId, page, size),
    [userId, page, size],
    options
  );
}

export function useAllResultsFast(userId: string, options: UseApiOptions = {}) {
  return useOptimizedApi(
    () => optimizedApiService.getAllResultsFast(userId),
    [userId],
    options
  );
}

export function useLatestResultFast(userId: string, options: UseApiOptions = {}) {
  return useOptimizedApi(
    () => optimizedApiService.getLatestResultFast(userId),
    [userId],
    options
  );
}

export function useBatchUserDataFast(userId: string, options: UseApiOptions = {}) {
  return useOptimizedApi(
    () => optimizedApiService.getBatchUserDataFast(userId),
    [userId],
    options
  );
}

// ==================== QUESTION HOOKS ====================

export function useQuestionsFast(
  params: {
    skip?: number;
    limit?: number;
    testId?: number;
    sectionId?: number;
    isActive?: boolean;
  } = {},
  options: UseApiOptions = {}
) {
  return useOptimizedApi(
    () => optimizedApiService.getQuestionsFast(params),
    [JSON.stringify(params)],
    options
  );
}

export function useQuestionWithOptionsFast(
  questionId: number,
  options: UseApiOptions = {}
) {
  return useOptimizedApi(
    () => optimizedApiService.getQuestionWithOptionsFast(questionId),
    [questionId],
    options
  );
}

export function useTestQuestionsFast(testId: number, options: UseApiOptions = {}) {
  return useOptimizedApi(
    () => optimizedApiService.getTestQuestionsFast(testId),
    [testId],
    options
  );
}

export function useTestStructureFast(testId: number, options: UseApiOptions = {}) {
  return useOptimizedApi(
    () => optimizedApiService.getTestStructureFast(testId),
    [testId],
    options
  );
}

// ==================== SUBMISSION HOOKS ====================

export function useSubmitResultFast() {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
  }>({
    loading: false,
    error: null,
    success: false
  });

  const submitResult = useCallback(async (resultData: any) => {
    setState({ loading: true, error: null, success: false });

    try {
      const response = await optimizedApiService.submitResultFast(resultData);
      
      if (response.success) {
        setState({ loading: false, error: null, success: true });
        
        // Invalidate user cache after successful submission
        if (resultData.user_id) {
          optimizedApiService.invalidateUserCache(resultData.user_id);
        }
        
        return response.data;
      } else {
        setState({ loading: false, error: response.error || 'Submission failed', success: false });
        throw new Error(response.error || 'Submission failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setState({ loading: false, error: errorMessage, success: false });
      throw error;
    }
  }, []);

  return {
    ...state,
    submitResult,
    isSubmitting: state.loading
  };
}

// ==================== HEALTH CHECK HOOKS ====================

export function useSystemHealthFast(options: UseApiOptions = {}) {
  return useOptimizedApi(
    () => optimizedApiService.checkSystemHealth(),
    [],
    { ...options, immediate: options.immediate ?? false }
  );
}

// ==================== PERFORMANCE MONITORING HOOKS ====================

export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState({
    cacheStats: { size: 0, hitRate: 0, avgResponseTime: 0 },
    performanceReport: {
      totalRequests: 0,
      successRate: 0,
      avgResponseTime: 0,
      cacheHitRate: 0,
      slowestEndpoints: []
    }
  });

  const updateMetrics = useCallback(() => {
    setMetrics({
      cacheStats: optimizedApiService.getCacheStats(),
      performanceReport: optimizedApiService.getPerformanceReport()
    });
  }, []);

  useEffect(() => {
    updateMetrics();
    const interval = setInterval(updateMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [updateMetrics]);

  return {
    ...metrics,
    clearCache: optimizedApiService.clearCache.bind(optimizedApiService),
    invalidateUserCache: optimizedApiService.invalidateUserCache.bind(optimizedApiService),
    refreshMetrics: updateMetrics
  };
}

// ==================== BATCH OPERATIONS HOOKS ====================

export function useBatchQuestionsFast(questionIds: number[], options: UseApiOptions = {}) {
  return useOptimizedApi(
    () => optimizedApiService.getQuestionsBatchFast(questionIds),
    [JSON.stringify(questionIds)],
    { ...options, immediate: questionIds.length > 0 }
  );
}

// ==================== UTILITY HOOKS ====================

export function useOptimizedApiWithFallback<T>(
  optimizedCall: () => Promise<any>,
  fallbackCall: () => Promise<any>,
  dependencies: any[] = [],
  options: UseApiOptions = {}
) {
  return useOptimizedApi(
    () => optimizedApiService.withFallback(optimizedCall, fallbackCall),
    dependencies,
    options
  );
}

// Hook for managing loading states across multiple API calls
export function useMultipleApiCalls() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const setError = useCallback((key: string, error: string | null) => {
    setErrors(prev => ({ ...prev, [key]: error }));
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);
  const hasAnyError = Object.values(errors).some(Boolean);

  return {
    loadingStates,
    errors,
    setLoading,
    setError,
    isAnyLoading,
    hasAnyError,
    clearErrors: () => setErrors({}),
    clearLoading: () => setLoadingStates({})
  };
}

export default useOptimizedApi;
