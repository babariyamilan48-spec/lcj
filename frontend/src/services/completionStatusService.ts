/**
 * Test Completion Status Service
 * 
 * New robust service for managing test completion status with proper error handling,
 * caching, and type safety.
 */

import api from './api';
import { getApiBaseUrl } from '../config/api';

export interface CompletedTest {
  test_id: string;
  display_name: string;
}

export interface MissingTest {
  test_id: string;
  display_name: string;
}

export interface CompletionStatusData {
  user_id: string;
  user_uuid: string;
  all_completed: boolean;
  completed_tests: string[];
  missing_tests: string[];
  total_tests: number;
  completion_percentage: number;
  required_tests: string[];
  test_details: {
    completed: CompletedTest[];
    missing: MissingTest[];
  };
  last_updated: string;
}

export interface CompletionStatusResponse {
  success: boolean;
  data: CompletionStatusData;
  message: string;
}

export interface ProgressSummaryData {
  user_id: string;
  progress_percentage: number;
  completed_count: number;
  total_count: number;
  is_eligible_for_comprehensive_report: boolean;
  next_recommended_tests: string[];
  status_message: string;
}

export interface ProgressSummaryResponse {
  success: boolean;
  data: ProgressSummaryData;
  message: string;
}

export interface CompletedTestsResponse {
  success: boolean;
  data: {
    user_id: string;
    completed_tests: string[];
    count: number;
  };
  message: string;
}

export interface MarkCompletedResponse {
  success: boolean;
  data: {
    user_id: string;
    test_id: string;
    marked_at: string;
  };
  message: string;
}

export interface CacheClearResponse {
  success: boolean;
  data: {
    user_id: string;
    cache_cleared: boolean;
  };
  message: string;
}

export interface ServiceHealthResponse {
  success: boolean;
  data: {
    service: string;
    status: string;
    required_tests_count: number;
    required_tests: string[];
  };
  message: string;
}

class CompletionStatusService {
  private getBaseUrl(): string {
    return `${getApiBaseUrl()}/api/v1/results_service/completion-status`;
  }

  /**
   * Get comprehensive completion status for a user
   */
  async getCompletionStatus(userId: string, bustCache: boolean = false): Promise<CompletionStatusResponse> {
    try {
      // Add cache-busting parameter if requested
      const cacheBuster = bustCache ? `?_t=${Date.now()}&_r=${Math.random()}` : '';
      
      const response = await api.get(`${this.getBaseUrl()}/${userId}${cacheBuster}`, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': bustCache ? 'no-cache, no-store, must-revalidate' : 'public, max-age=60'
        }
      });

      return response.data;
    } catch (error: any) {
      
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to get completion status';
      
      throw new Error(errorMessage);
    }
  }


  /**
   * Get test progress summary for dashboard display
   */
  async getProgressSummary(userId: string, bustCache: boolean = false): Promise<ProgressSummaryResponse> {
    try {
      // Add cache-busting parameter if requested
      const cacheBuster = bustCache ? `?_t=${Date.now()}&_r=${Math.random()}` : '';
      
      const response = await api.get(`${this.getBaseUrl()}/${userId}/progress${cacheBuster}`, {
        timeout: 8000, // 8 second timeout
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': bustCache ? 'no-cache, no-store, must-revalidate' : 'public, max-age=60'
        }
      });

      return response.data;
    } catch (error: any) {
      
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to get progress summary';
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Get list of completed tests for a user
   */
  async getCompletedTests(userId: string): Promise<CompletedTestsResponse> {
    try {
      // console.log(`🔍 Getting completed tests for user: ${userId}`);
      
      const response = await api.get(`${this.getBaseUrl()}/${userId}/completed-tests`, {
        timeout: 8000, // 8 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // console.log(`✅ Completed tests retrieved:`, response.data);
      return response.data;
    } catch (error: any) {
      // console.error(`❌ Error getting completed tests for user ${userId}:`, error);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to get completed tests';
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Mark a test as completed and invalidate cache
   */
  async markTestCompleted(userId: string, testId: string): Promise<MarkCompletedResponse> {
    try {
      // console.log(`🔍 Marking test ${testId} as completed for user: ${userId}`);
      
      const response = await api.post(`${this.getBaseUrl()}/${userId}/mark-completed/${testId}`, {}, {
        timeout: 8000, // 8 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // console.log(`✅ Test marked as completed:`, response.data);
      return response.data;
    } catch (error: any) {
      // console.error(`❌ Error marking test completed for user ${userId}, test ${testId}:`, error);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to mark test as completed';
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Clear completion status cache for a user (for testing/debugging)
   */
  async clearCompletionCache(userId: string): Promise<CacheClearResponse> {
    try {
      // console.log(`🔍 Clearing completion cache for user: ${userId}`);
      
      const response = await api.delete(`${this.getBaseUrl()}/${userId}/cache`, {
        timeout: 8000, // 8 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // console.log(`✅ Cache cleared:`, response.data);
      return response.data;
    } catch (error: any) {
      // console.error(`❌ Error clearing cache for user ${userId}:`, error);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to clear cache';
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Debug method to check database directly
   */
  async debugUserDatabase(userId: string): Promise<any> {
    try {
      // console.log(`🔍 Debugging database for user: ${userId}`);
      
      const response = await api.get(`${this.getBaseUrl()}/debug/${userId}`, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // console.log(`✅ Database debug info retrieved:`, response.data);
      return response.data;
    } catch (error: any) {
      // console.error(`❌ Database debug failed:`, error);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Database debug failed';
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<ServiceHealthResponse> {
    try {
      // console.log(`🔍 Checking completion status service health`);
      
      const response = await api.get(`${this.getBaseUrl()}/health`, {
        timeout: 5000, // 5 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // console.log(`✅ Service health check passed:`, response.data);
      return response.data;
    } catch (error: any) {
      // console.error(`❌ Service health check failed:`, error);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Service health check failed';
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Helper method to check if user is eligible for comprehensive report
   */
  async isEligibleForComprehensiveReport(userId: string): Promise<boolean> {
    try {
      const status = await this.getCompletionStatus(userId);
      return status.data.all_completed;
    } catch (error) {
      // console.error(`Error checking eligibility for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Helper method to get completion percentage
   */
  async getCompletionPercentage(userId: string): Promise<number> {
    try {
      const status = await this.getCompletionStatus(userId);
      return status.data.completion_percentage;
    } catch (error) {
      // console.error(`Error getting completion percentage for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Helper method to get next recommended tests
   */
  async getNextRecommendedTests(userId: string, limit: number = 3): Promise<string[]> {
    try {
      const status = await this.getCompletionStatus(userId);
      return status.data.missing_tests.slice(0, limit);
    } catch (error) {
      // console.error(`Error getting next recommended tests for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Helper method to format test display name
   */
  formatTestDisplayName(testId: string): string {
    const displayNames: Record<string, string> = {
      'mbti': 'MBTI Personality Test',
      'intelligence': 'Multiple Intelligence Test',
      'bigfive': 'Big Five Personality Test',
      'riasec': 'RIASEC Career Interest Test',
      'decision': 'Decision Making Style Test',
      'vark': 'VARK Learning Style Test',
      'life-situation': 'Life Situation Assessment'
    };

    return displayNames[testId] || testId.charAt(0).toUpperCase() + testId.slice(1);
  }
}

// Export singleton instance
export const completionStatusService = new CompletionStatusService();
export default completionStatusService;

