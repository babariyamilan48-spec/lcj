import { API_ENDPOINTS, getAuthHeaders, ApiResponse } from '../config/api';

export interface TestResult {
  id: string;
  user_id: string;
  test_id: string;
  session_id?: string;
  answers: Record<string, any>;
  calculated_result: Record<string, any>;
  primary_result: string;
  result_summary: string;
  completion_percentage: number;
  time_taken_seconds?: number;
  is_completed: boolean;
  completed_at: string;
  created_at: string;
}

export interface TestResultCreate {
  user_id: string;
  test_id: string;
  answers: Record<string, any>;
  calculated_result: Record<string, any>;
  session_id?: string;
  time_taken_seconds?: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  preferences: Record<string, any>;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserProfileUpdate {
  preferences?: Record<string, any>;
  settings?: Record<string, any>;
}

export interface AnalyticsData {
  total_tests_completed: number;
  tests_by_type: Record<string, number>;
  completion_timeline: Array<{
    test_id: string;
    completed_at: string;
    primary_result: string;
  }>;
  average_completion_time: number;
  latest_results: Record<string, {
    primary_result: string;
    completed_at: string;
    result_summary: string;
  }>;
}

class ResultService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_ENDPOINTS.RESULTS.BASE;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(token || undefined),
        ...options?.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data?.detail || data?.message || 'Request failed');
    }
    
    return data;
  }

  async submitResult(result: TestResultCreate): Promise<{ message: string; result_id: string }> {
    const response = await this.request<{ message: string; result_id: string }>('/results', {
      method: 'POST',
      body: JSON.stringify(result),
    });
    return response.data!;
  }

  async getUserResults(userId: string): Promise<TestResult[]> {
    const response = await this.request<TestResult[]>(`/results/${userId}`);
    return response.data || [];
  }

  async getLatestResult(userId: string): Promise<TestResult | null> {
    const response = await this.request<TestResult>(`/results/${userId}/latest`);
    return response.data || null;
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    const response = await this.request<UserProfile>(`/profile/${userId}`);
    return response.data!;
  }

  async updateUserProfile(userId: string, profileData: UserProfileUpdate): Promise<UserProfile> {
    const response = await this.request<UserProfile>(`/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return response.data!;
  }

  async getUserAnalytics(userId: string): Promise<AnalyticsData> {
    const response = await this.request<AnalyticsData>(`/analytics/${userId}`);
    return response.data!;
  }

  async getResultsByTestType(userId: string, testType: string): Promise<TestResult[]> {
    const results = await this.getUserResults(userId);
    return results.filter(result => result.test_id === testType);
  }

  async getCompletionStats(userId: string): Promise<{
    total_completed: number;
    completion_rate: number;
    average_time: number;
    recent_activity: number;
  }> {
    const analytics = await this.getUserAnalytics(userId);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentActivity = analytics.completion_timeline.filter(
      item => new Date(item.completed_at) >= thirtyDaysAgo
    ).length;

    return {
      total_completed: analytics.total_tests_completed,
      completion_rate: 100, // Assuming all started tests are completed for now
      average_time: analytics.average_completion_time,
      recent_activity: recentActivity,
    };
  }
}

export const resultService = new ResultService();
export default resultService;
