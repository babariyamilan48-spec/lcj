import { useState, useEffect } from 'react';
import { testResultService } from '../services/testResultService';
import { UserOverview, TestOverviewItem } from '../services/overviewService';
import { aiInsightsHistoryService } from '../services/aiInsightsHistoryService';

// Global cache to prevent duplicate API calls
const dataCache = new Map<string, {
  data: UserOverview | null;
  loading: boolean;
  error: string | null;
  promise?: Promise<any>;
}>();

// Function to clear cache for a specific user (call after saving new results)
export const clearUserDataCache = (userId: string) => {
  dataCache.delete(userId);
  // Also invalidate AI insights cache
  aiInsightsHistoryService.invalidateCache(userId);
  console.log(`✅ useTestResults: Cache cleared for user ${userId}`);
};

// Function to force refresh data for a user
export const forceRefreshUserData = async (userId: string): Promise<UserOverview | null> => {
  clearUserDataCache(userId);
  
  try {
    const latestSummary = await testResultService.getUserLatestSummary(userId);
    
    // Update cache with fresh data
    dataCache.set(userId, {
      data: latestSummary,
      loading: false,
      error: null
    });
    
    console.log(`✅ useTestResults: Data refreshed for user ${userId}`);
    return latestSummary;
  } catch (error) {
    console.error(`❌ useTestResults: Error refreshing data for user ${userId}:`, error);
    return null;
  }
};

// Single optimized hook that uses only the latest-summary API with caching
export const useOptimizedUserData = (userId: string) => {
  const [data, setData] = useState<UserOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Check if data is already cached
    const cached = dataCache.get(userId);
    if (cached) {
      // If there's an ongoing request, wait for it
      if (cached.promise) {
        cached.promise.then(() => {
          const updated = dataCache.get(userId);
          if (updated) {
            setData(updated.data);
            setLoading(updated.loading);
            setError(updated.error);
          }
        });
        return;
      }
      
      // Use cached data
      setData(cached.data);
      setLoading(cached.loading);
      setError(cached.error);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Update cache with loading state
        dataCache.set(userId, { data: null, loading: true, error: null });
        
        const latestSummary = await testResultService.getUserLatestSummary(userId);
        
        // Update cache with data
        dataCache.set(userId, { data: latestSummary, loading: false, error: null });
        
        setData(latestSummary);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data';
        
        // Update cache with error
        dataCache.set(userId, { data: null, loading: false, error: errorMessage });
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    // Store the promise in cache to prevent duplicate calls
    const promise = fetchData();
    dataCache.set(userId, { data: null, loading: true, error: null, promise });
    
  }, [userId]);

  const refetch = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const latestSummary = await testResultService.getUserLatestSummary(userId);
      setData(latestSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
};

// Legacy hooks for backward compatibility - all use the optimized API
export const useUserOverview = (userId: string) => {
  const { data, loading, error, refetch } = useOptimizedUserData(userId);
  return { overview: data, loading, error, refetch };
};

export const useTestResults = (userId: string | number) => {
  const stringUserId = typeof userId === 'number' ? userId.toString() : userId;
  const { data, loading, error, refetch } = useOptimizedUserData(stringUserId);
  const numericUserId = typeof userId === 'string' ? parseInt(userId) : userId;
  const [aiInsights, setAiInsights] = useState<Array<any>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Fetch AI insights
  useEffect(() => {
    const fetchAIInsights = async () => {
      if (!stringUserId) {
        return;
      }

      setAiLoading(true);
      try {
        const aiInsightsHistory = await aiInsightsHistoryService.getAIInsightsHistory(stringUserId);

        setAiInsights(aiInsightsHistory);
      } catch (error) {
        setAiInsights([]);
      } finally {
        setAiLoading(false);
      }
    };

    fetchAIInsights();
  }, [stringUserId]);
  
  // Convert regular test results to legacy format
  const regularResults = data?.latest_test_results?.map((result: any) => ({
    id: Math.floor(Math.random() * 1000000),
    userId: numericUserId,
    test_id: result.test_id,
    testId: result.test_id, // Keep both for compatibility
    primaryResult: result.primary_result,
    resultSummary: result.result_name_english || result.result_name_gujarati,
    calculatedResult: {},
    completionPercentage: 100,
    percentage: 100, // Add percentage field
    isCompleted: true,
    createdAt: result.completion_date || new Date().toISOString(),
    updatedAt: result.completion_date || new Date().toISOString(),
    timeTakenSeconds: null,
    details: []
  })) || [];
  
  // Convert AI insights to legacy format
  const aiInsightsResults = aiInsights.map((insight: any) => ({
    id: parseInt(insight.id) || Math.floor(Math.random() * 1000000),
    userId: numericUserId,
    test_id: insight.test_id,
    testId: insight.test_id, // Keep both for compatibility
    primaryResult: insight.primary_result,
    resultSummary: insight.result_name_gujarati,
    calculatedResult: {},
    completionPercentage: insight.percentage,
    percentage: insight.percentage, // Add percentage field
    isCompleted: true,
    createdAt: insight.completion_date,
    updatedAt: insight.completion_date,
    timeTakenSeconds: null,
    details: []
  }));
  
  // Combine regular results with AI insights, prioritizing AI insights at the top
  const combinedResults = [...aiInsightsResults, ...regularResults];
  
  // Sort to ensure AI insights are always at the top
  const results = combinedResults.sort((a, b) => {
    const aIsAI = a.testId === 'comprehensive-ai-insights' || a.test_id === 'comprehensive-ai-insights';
    const bIsAI = b.testId === 'comprehensive-ai-insights' || b.test_id === 'comprehensive-ai-insights';
    
    // AI insights first
    if (aIsAI && !bIsAI) return -1;
    if (!aIsAI && bIsAI) return 1;
    
    // For non-AI tests, sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return { 
    results, 
    loading: loading || aiLoading, 
    error, 
    refetch,
    pagination: { total: results.length, page: 1, limit: 10 }
  };
};

export const useAnalytics = (userId: string | number) => {
  const stringUserId = typeof userId === 'number' ? userId.toString() : userId;
  const { data, loading, error } = useOptimizedUserData(stringUserId);
  
  // Convert to legacy analytics format
  const analytics = data ? {
    totalTestsCompleted: data.total_tests_completed,
    averageCompletionTime: 300, // Default 5 minutes
    testsByType: data.latest_test_results?.reduce((acc: any, result: any) => {
      acc[result.test_id] = 1;
      return acc;
    }, {}) || {},
    completionTimeline: data.latest_test_results?.map((result: any) => ({
      testId: result.test_id,
      completedAt: result.completion_date || new Date().toISOString(),
      primaryResult: result.primary_result
    })) || [],
    latestResults: data.latest_test_results?.reduce((acc: any, result: any) => {
      acc[result.test_id] = {
        primaryResult: result.primary_result,
        completedAt: result.completion_date || new Date().toISOString(),
        resultSummary: result.result_name_english || result.result_name_gujarati
      };
      return acc;
    }, {}) || {}
  } : null;

  return { analytics, loading, error };
};

export const useCareerInsights = (userId: number) => {
  const { data, loading, error } = useOptimizedUserData(userId.toString());
  
  const insights = data ? {
    recommendations: data.top_careers || [],
    strengths: data.top_strengths || [],
    personality_types: data.latest_test_results?.reduce((acc: any, result: any) => {
      acc[result.test_id] = result.primary_result;
      return acc;
    }, {}) || {}
  } : null;

  return { insights, loading, error };
};

export const usePersonalityInsights = (userId: number) => {
  const { data, loading, error } = useOptimizedUserData(userId.toString());
  
  const insights = data ? {
    summary: data.latest_test_results?.reduce((acc: any, result: any) => {
      acc[result.test_id] = result.primary_result;
      return acc;
    }, {}) || {},
    strengths: data.top_strengths || [],
    development_areas: data.development_areas || [],
    test_results: data.latest_test_results || []
  } : null;

  return { insights, loading, error };
};
