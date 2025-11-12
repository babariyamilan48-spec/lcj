// Results Service for API integration
import { tokenStore } from './token';
import { getApiBaseUrl } from '../config/api';

// Use dynamic API base URL
const getApiUrl = () => `${getApiBaseUrl()}/api/v1`;

// API Response format
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  message: string | null;
}

export interface UserAnswer {
  question_id: number;
  option_id: number;
  question_text: string;
  answer_text: string;
  dimension?: string;
  weight: number;
  score: number;
}

export interface TestResult {
  id?: number;
  user_id: string; // Changed to string to support UUID
  test_id: string;
  test_name: string;
  answers: UserAnswer[];
  total_score: number;
  percentage_score: number;
  dimensions_scores: { [key: string]: number };
  analysis: any;
  completed_at: string;
  duration_minutes: number;
}

export interface UserStats {
  total_tests: number;
  average_score: number;
  streak_days: number;
  achievements: number;
  recent_tests: TestResult[];
  category_scores: { [key: string]: number };
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  phone?: string;
  date_of_birth?: string;
  education?: string;
  experience?: string;
  interests?: string[];
  avatar?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  skills?: string[];
  goals?: string[];
  stats?: UserStats;
  created_at: string;
  updated_at: string;
}

class ResultsService {
  private authToken: string | null = null;

  constructor() {
    // Get token from tokenStore (same as AuthContext)
    this.authToken = tokenStore.getAccessToken();
  }

  private getBaseUrl(): string {
    return getApiUrl();
  }

  // Set authentication token
  setAuthToken(token: string | null) {
    this.authToken = token;
    // Update tokenStore as well to keep in sync
    if (token) {
      tokenStore.setTokens(token, tokenStore.getRefreshToken());
    }
  }

  // Get headers with auth token
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Always get fresh token from tokenStore
    const currentToken = tokenStore.getAccessToken();
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }
    
    return headers;
  }

  // Handle API response
  private async handleResponse<T>(response: Response): Promise<T> {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        // If unauthorized, clear token
        if (response.status === 401) {
          this.setAuthToken(null);
        }
        
        // Try to get error message from response body
        const errorMessage = data?.error || data?.message || data?.detail || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      // Handle API responses with success field
      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        const errorMessage = data.error || data.message || 'API request failed';
        console.warn('API returned success=false:', errorMessage);
        throw new Error(errorMessage);
      }
      
      return data as T;
    } catch (error) {
      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON response: ${error.message}`);
      }
      // Re-throw other errors
      throw error;
    }
  }

  // Submit test results
  async submitTestResult(result: Omit<TestResult, 'id' | 'completed_at'>): Promise<TestResult> {
    // Convert user_id to string for backend compatibility
    const backendResult = {
      ...result,
      user_id: String(result.user_id),
      completed_at: new Date().toISOString()
    };

    // Use optimized fast endpoint for result submission
    const response = await fetch(`${this.getBaseUrl()}/results_service/optimized/results/fast`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'X-Bypass-Interceptor': 'true', // Signal to bypass interceptor
      },
      body: JSON.stringify(backendResult),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 400 || errorData.is_duplicate) {
        throw new Error(errorData.message || 'Test already completed. Each test can only be taken once.');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check if this is a duplicate response
    if (data.is_duplicate) {
      throw new Error(data.message || 'Test already completed. Each test can only be taken once.');
    }
    
    return data as TestResult;
  }

  // Get user's test results
  async getUserResults(userId: string, page: number = 1, size: number = 10): Promise<{results: TestResult[], total: number, page: number, total_pages: number}> {
    // Use optimized FAST endpoint directly with bypass header and cache busting
    const cacheBuster = `_t=${Date.now()}&_r=${Math.random()}`;
    const response = await fetch(`${this.getBaseUrl()}/results_service/optimized/results/${userId}/fast?page=${page}&size=${size}&${cacheBuster}`, {
      headers: {
        ...this.getHeaders(),
        'X-Bypass-Interceptor': 'true', // Signal to bypass interceptor
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
    
    const rawData = await this.handleResponse<any>(response);
    
    // Handle different response formats
    let actualData;
    if (rawData.data && rawData.data.results) {
      // New optimized format: {success: true, data: {results: [...], total: 4}}
      actualData = rawData.data;
    } else if (rawData.results) {
      // Direct format from fast endpoint: {results: [...], total: 4}
      actualData = rawData;
    } else {
      // Fallback
      actualData = { results: [], total: 0, page: 1, total_pages: 0 };
    }
    
    const results = actualData.results || [];
    const total = actualData.total || 0;
    
    return {
      results: results,
      total: total,
      page: actualData.page || 1,
      total_pages: actualData.total_pages || Math.ceil(total / 10)
    };
  }

  // Get specific test result
  async getTestResult(resultId: number): Promise<TestResult> {
    const response = await fetch(`${this.getBaseUrl()}/results_service/results/${resultId}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<TestResult>(response);
  }

  // Get user statistics
  async getUserStats(userId: string): Promise<UserStats> {
    const response = await fetch(`${this.getBaseUrl()}/results_service/analytics/${userId}`, {
      headers: this.getHeaders(),
    });
    
    const data = await this.handleResponse<any>(response);
    return data.stats || data;
  }

  // Get user profile with stats
  async getUserProfile(userId: string): Promise<UserProfile> {
    const response = await fetch(`${this.getBaseUrl()}/results_service/profile/${userId}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<UserProfile>(response);
  }

  // Update user profile
  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    const response = await fetch(`${this.getBaseUrl()}/results_service/profile/${userId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profileData),
    });
    
    return this.handleResponse<UserProfile>(response);
  }

  // Change user password
  async changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<{success: boolean, message: string}> {
    const response = await fetch(`${this.getBaseUrl()}/auth_service/auth/change-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        old_password: currentPassword,
        new_password: newPassword
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle specific 400 errors for password change
      if (response.status === 400) {
        // Check if it's a "same password" error
        if (errorData.error === "New password must differ from old password" || errorData.message === "New password must differ from old password") {
          throw new Error("New password must be different from current password");
        }
        // Other 400 errors
        throw new Error(errorData.error || errorData.message || "Invalid request");
      }
      
      // Handle specific 401 errors for password change
      if (response.status === 401) {
        // Check if it's an "Incorrect old password" error
        const errorMessage = errorData.error || errorData.message || errorData.detail || '';
        if (errorMessage.includes("Incorrect old password") || errorMessage.includes("old password")) {
          throw new Error("Please enter correct current password");
        }
        // If it's a different 401 error (token expired, etc.), clear token
        this.setAuthToken(null);
        throw new Error("Session expired. Please log in again.");
      }
      
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: data.success || false,
      message: data.message || 'Password changed successfully'
    };
  }

  // Get analytics data
  async getAnalyticsData(userId: string): Promise<{
    stats: UserStats;
    testHistory: TestResult[];
    categoryScores: { [key: string]: number };
    progressOverTime: { week: number; score: number }[];
    goals: any[];
  }> {
    const response = await fetch(`${this.getBaseUrl()}/results_service/analytics/${userId}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<{
      stats: UserStats;
      testHistory: TestResult[];
      categoryScores: { [key: string]: number };
      progressOverTime: { week: number; score: number }[];
      goals: any[];
    }>(response);
  }

  // Cache management
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Cached methods
  async getUserStatsCached(userId: string): Promise<UserStats> {
    const cacheKey = `user_stats_${userId}`;
    const cached = this.getCachedData<UserStats>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.getUserStats(userId);
    this.setCachedData(cacheKey, data);
    return data;
  }

  async getUserProfileCached(userId: string): Promise<UserProfile> {
    const cacheKey = `user_profile_${userId}`;
    const cached = this.getCachedData<UserProfile>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.getUserProfile(userId);
    this.setCachedData(cacheKey, data);
    return data;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Clear specific user cache
  clearUserCache(userId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(`user_${userId}`) || key.includes(`${userId}`)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Download user report
  async downloadUserReport(
    userId: string,
    format: 'pdf' | 'json' | 'csv' = 'pdf',
    includeAiInsights: boolean = true,
    testId?: string
  ): Promise<ArrayBuffer> {
    const params = new URLSearchParams({
      format,
      include_ai_insights: includeAiInsights.toString()
    });
    
    if (testId) {
      params.append('test_id', testId);
    }

    const response = await fetch(
      `${this.getBaseUrl()}/results_service/download-report/${userId}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          ...this.getHeaders(),
          'Accept': format === 'pdf' ? 'application/pdf' : 
                   format === 'json' ? 'application/json' : 'text/csv'
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download report: ${response.statusText}`);
    }

    return response.arrayBuffer();
  }
}

// Export singleton instance
export const resultsService = new ResultsService();

// Export class for custom instances
export default ResultsService;
