import { useState, useEffect, useCallback } from 'react';
import { resultsService, TestResult, UserStats, UserProfile } from '../services/resultsService';
import { aiInsightsHistoryService, AIInsightsHistoryItem } from '../services/aiInsightsHistoryService';

// Interface for quiz answer
interface QuizAnswer {
  question: string;
  answer: string;
  dimension?: string;
  weight?: number;
  score?: number;
}

// Interface for test analysis
interface TestAnalysis {
  primary_result?: string;
  result_name_gujarati?: string;
  result_name_english?: string;
  [key: string]: any;
}

// Hook for managing test results
export const useTestResults = (userId?: string) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsightsHistoryItem[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    total_pages: 0
  });

  const submitResult = useCallback(async (result: Omit<TestResult, 'id' | 'completed_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const submittedResult = await resultsService.submitTestResult(result);
      setResults(prev => [submittedResult, ...prev]);
      setError(null); // Clear error on success
      return submittedResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit result';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResults = useCallback(async (page: number = 1, size: number = 10) => {
    if (!userId) {
      return;
    }
    setLoading(true);
    setAiLoading(true);
    setError(null);

    try {
      // Fetch regular test results
      const response = await resultsService.getUserResults(userId, page, size);

      // Fetch AI insights
      const aiInsightsHistory = await aiInsightsHistoryService.getAIInsightsHistory(userId);

      // Convert AI insights to TestResult format
      const aiInsightsResults = aiInsightsHistory.map((insight: AIInsightsHistoryItem) => ({
        id: parseInt(insight.id) || Math.floor(Math.random() * 1000000),
        user_id: userId,
        test_id: insight.test_id,
        test_name: insight.test_name,
        answers: [], // AI insights don't have answers
        total_score: insight.score || 100,
        percentage_score: insight.percentage || 100,
        dimensions_scores: {},
        analysis: {
          primary_result: insight.primary_result,
          result_name_gujarati: insight.result_name_gujarati,
          result_name_english: insight.result_name_english
        },
        completed_at: insight.completion_date,
        duration_minutes: 0 // AI insights don't have duration
      }));
      
      // Combine regular results with AI insights, prioritizing AI insights at the top
      const combinedResults = [...aiInsightsResults, ...response.results];
      
      // Sort to ensure AI insights are always at the top
      const sortedResults = combinedResults.sort((a, b) => {
        const aIsAI = a.test_id === 'comprehensive-ai-insights';
        const bIsAI = b.test_id === 'comprehensive-ai-insights';
        
        // AI insights first
        if (aIsAI && !bIsAI) return -1;
        if (!aIsAI && bIsAI) return 1;
        
        // For non-AI tests, sort by completion date (newest first)
        const dateA = new Date(a.completed_at || 0).getTime();
        const dateB = new Date(b.completed_at || 0).getTime();
        return dateB - dateA;
      });
      
      setResults(sortedResults);
      setAiInsights(aiInsightsHistory);
      setPagination({
        page: response.page,
        total: response.total + aiInsightsResults.length,
        total_pages: response.total_pages
      });
      setError(null); // Clear error on success
      return { ...response, results: sortedResults };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch results';
      setError(errorMessage);
      
      // No fallback data - show empty results
      const emptyResponse = { 
        results: [], 
        total: 0, 
        page: 1, 
        total_pages: 0 
      };
      
      setResults([]);
      setPagination({ page: 1, total: 0, total_pages: 0 });
      return emptyResponse;
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchResults();
    }
  }, [userId, fetchResults]);

  return {
    results,
    loading: loading || aiLoading,
    error,
    pagination,
    submitResult,
    fetchResults,
    refetch: () => fetchResults(),
  };
};

// Hook for managing user statistics
export const useUserStats = (userId?: string) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const userStats = await resultsService.getUserStatsCached(userId);
      setStats(userStats);
      setError(null); // Clear error on success
      return userStats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stats';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId, fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats,
    refetch: fetchStats,
  };
};

// Hook for managing user profile
export const useUserProfile = (userId?: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const userProfile = await resultsService.getUserProfileCached(userId);
      setProfile(userProfile);
      setError(null); // Clear error on success
      return userProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      
      // No fallback data - let error propagate to force proper API usage
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const updatedProfile = await resultsService.updateUserProfile(userId, profileData);
      setProfile(updatedProfile);
      // Clear cache to ensure fresh data
      resultsService.clearUserCache(userId);
      setError(null); // Clear error on success
      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId, fetchProfile]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    refetch: fetchProfile,
  };
};

// Hook for analytics data
export const useAnalytics = (userId?: string) => {
  const [analyticsData, setAnalyticsData] = useState<{
    stats: UserStats;
    testHistory: TestResult[];
    categoryScores: { [key: string]: number };
    progressOverTime: { week: number; score: number }[];
    goals: Array<{ id: string; title: string; target: number; current: number; }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await resultsService.getAnalyticsData(userId);
      setAnalyticsData(data);
      setError(null); // Clear error on success
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      
      // No fallback data - let error propagate to force proper API usage
      setAnalyticsData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchAnalytics();
    }
  }, [userId, fetchAnalytics]);

  return {
    analyticsData,
    loading,
    error,
    fetchAnalytics,
    refetch: fetchAnalytics,
  };
};

// Hook for result submission with progress tracking
export const useQuizSubmission = () => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedResult, setLastSubmittedResult] = useState<TestResult | null>(null);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number>(0);

  const submitQuizResult = useCallback(async (
    userId: string, // Changed from number to string to support UUID
    testId: string,
    testName: string,
    answers: QuizAnswer[],
    analysis: TestAnalysis,
    durationMinutes: number
  ) => {
    // Prevent duplicate submissions within 5 seconds
    const now = Date.now();
    if (submitting || (now - lastSubmissionTime < 5000)) {
      return lastSubmittedResult;
    }

    setSubmitting(true);
    setError(null);
    setLastSubmissionTime(now);
    
    try {
      // Convert answers to the expected format
      const formattedAnswers = answers.map((answer, index) => ({
        question_id: index + 1, // This should be the actual question ID from DB
        option_id: 1, // This should be the actual option ID from DB
        question_text: answer.question,
        answer_text: answer.answer,
        dimension: answer.dimension,
        weight: answer.weight || 1,
        score: answer.score || answer.weight || 1
      }));

      // Calculate scores
      const totalScore = formattedAnswers.reduce((sum, answer) => sum + answer.score, 0);
      const maxPossibleScore = formattedAnswers.length * 5; // Assuming max score per question is 5
      const percentageScore = Math.round((totalScore / maxPossibleScore) * 100);

      // Calculate dimension scores
      const dimensionScores: { [key: string]: number } = {};
      formattedAnswers.forEach(answer => {
        if (answer.dimension) {
          dimensionScores[answer.dimension] = (dimensionScores[answer.dimension] || 0) + answer.score;
        }
      });

      const result: Omit<TestResult, 'id' | 'completed_at'> = {
        user_id: userId,
        test_id: testId,
        test_name: testName,
        answers: formattedAnswers,
        total_score: totalScore,
        percentage_score: percentageScore,
        dimensions_scores: dimensionScores,
        analysis,
        duration_minutes: durationMinutes
      };

      const submittedResult = await resultsService.submitTestResult(result);
      setLastSubmittedResult(submittedResult);
      
      // Clear relevant caches
      resultsService.clearUserCache(userId);
      setError(null); // Clear error on success
      
      return submittedResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit quiz result';
      setError(errorMessage);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [submitting, lastSubmissionTime, lastSubmittedResult]);

  return {
    submitting,
    error,
    lastSubmittedResult,
    submitQuizResult,
  };
};

// Hook for downloading reports
export const useReportDownload = () => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadReport = useCallback(async (
    userId: string,
    format: 'pdf' | 'json' | 'csv' = 'pdf',
    includeAiInsights: boolean = true,
    testId?: string
  ) => {
    setDownloading(true);
    setError(null);
    
    try {
      const response = await resultsService.downloadUserReport(
        userId,
        format,
        includeAiInsights,
        testId
      );
      
      // Create blob and download
      const blob = new Blob([response], {
        type: format === 'pdf' ? 'application/pdf' : 
              format === 'json' ? 'application/json' : 'text/csv'
      });
      
      // Check if blob is empty
      if (blob.size === 0) {
        throw new Error('Received empty response from server');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `user_report_${userId}_${timestamp}.${format}`;
      
      // Add some styling to make the link invisible
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      setError(null); // Clear error on success
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download report';
      setError(errorMessage);
      throw err;
    } finally {
      setDownloading(false);
    }
  }, []);

  return {
    downloading,
    error,
    downloadReport,
  };
};
