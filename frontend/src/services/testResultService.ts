import { calculateTestResult } from '@/utils/testResultCalculators';
import { getApiBaseUrl } from '../config/api';

export interface SaveTestResultRequest {
  userId: string; // Changed to string to support UUID
  testId: string;
  answers: Record<string, any>;
  sessionId?: string;
  timeTakenSeconds?: number;
}

export interface TestResultResponse {
  id: number;
  userId: string; // Changed to string to support UUID
  testId: string;
  sessionId?: string;
  answers: Record<string, any>;
  completionPercentage: number;
  timeTakenSeconds?: number;
  calculatedResult: any;
  primaryResult: string;
  resultSummary: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  details: TestResultDetail[];
}

export interface TestResultDetail {
  id: number;
  testResultId: number;
  dimensionType: string;
  dimensionName: string;
  rawScore: number;
  percentageScore: number;
  level?: string;
  description?: string;
  createdAt: string;
}

export interface UserAnalytics {
  totalTestsCompleted: number;
  testsByType: Record<string, number>;
  completionTimeline: Array<{
    testId: string;
    completedAt: string;
    primaryResult: string;
  }>;
  averageCompletionTime: number;
  latestResults: Record<string, {
    primaryResult: string;
    completedAt: string;
    resultSummary: string;
  }>;
}

export interface UserOverview {
  user_id: number;
  total_tests_completed: number;
  last_activity: string | null;
  test_results: Array<{
    test_id: string;
    test_name_gujarati: string;
    test_name_english: string;
    primary_result: string;
    result_name_gujarati: string;
    result_name_english: string;
    completion_date: string;
    score_percentage: number;
    traits: string[];
    careers: string[];
    strengths: string[];
    recommendations: string[];
    description_gujarati: string;
    description_english: string;
  }>;
  personality_summary: Record<string, string>;
  career_recommendations: string[];
  top_strengths: string[];
  development_areas: string[];
  completion_stats: {
    tests_by_type: Record<string, number>;
    total_time_spent: number;
    average_completion_time: number;
    completion_rate: number;
    last_30_days: number;
  };
}

class TestResultService {
  private getBaseUrl(): string {
    return getApiBaseUrl();
  }

  /**
   * Save test result to database
   */
  async saveTestResult(request: SaveTestResultRequest): Promise<TestResultResponse> {
    try {
      // Calculate the result using our frontend calculator
      const calculatedResult = await calculateTestResult(request.testId, request.answers, request.userId);
      
      const payload = {
        user_id: request.userId,
        test_id: request.testId,
        session_id: request.sessionId,
        answers: request.answers,
        completion_percentage: 100.0,
        time_taken_seconds: request.timeTakenSeconds,
        calculated_result: calculatedResult,
        primary_result: this.extractPrimaryResult(request.testId, calculatedResult),
        result_summary: this.generateResultSummary(request.testId, calculatedResult),
        is_completed: true
      };

      const response = await fetch(`${this.getBaseUrl()}/api/v1/question_service/test-results/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving test result:', error);
      throw error;
    }
  }

  /**
   * Get all test results for a user
   */
  async getUserTestResults(
    userId: string, 
    testId?: string, 
    limit: number = 10
  ): Promise<TestResultResponse[]> {
    try {
      const params = new URLSearchParams();
      if (testId) params.append('test_id', testId);
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(
        `${this.getBaseUrl()}/api/v1/question_service/test-results/user/${userId}?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user test results:', error);
      throw error;
    }
  }

  /**
   * Get latest test result for a user and test type
   */
  async getLatestTestResult(userId: string, testId: string): Promise<TestResultResponse | null> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/api/v1/question_service/test-results/user/${userId}/latest/${testId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 404) {
        return null; // No result found
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching latest test result:', error);
      throw error;
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/api/v1/question_service/test-results/analytics/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw error;
    }
  }

  /**
   * Get user latest summary - optimized for overview tab
   */
  async getUserLatestSummary(userId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/api/v1/question_service/test-results/latest-summary/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user latest summary:', error);
      throw error;
    }
  }

  /**
   * Get specific test result by ID
   */
  async getTestResult(resultId: number): Promise<TestResultResponse> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/v1/question_service/test-results/${resultId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching test result:', error);
      throw error;
    }
  }

  /**
   * Delete test result
   */
  async deleteTestResult(resultId: number): Promise<void> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/v1/question_service/test-results/${resultId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting test result:', error);
      throw error;
    }
  }

  /**
   * Extract primary result from calculated result
   */
  private extractPrimaryResult(testId: string, calculatedResult: any): string {
    if (!calculatedResult) return '';

    switch (testId) {
      case 'mbti':
        return calculatedResult.code || '';
      case 'intelligence':
        return calculatedResult.dominantType || '';
      case 'bigfive':
        const dimensions = calculatedResult.dimensions || [];
        if (dimensions.length > 0) {
          const highest = dimensions.reduce((prev: any, current: any) => 
            (prev.score > current.score) ? prev : current
          );
          return `${highest.trait}_high`;
        }
        return '';
      case 'riasec':
        return calculatedResult.hollandCode || '';
      case 'svs':
        const coreValues = calculatedResult.coreValues || [];
        return coreValues.length > 0 ? coreValues[0].type : '';
      case 'decision':
        return calculatedResult.primaryStyle?.type || '';
      case 'vark':
        return calculatedResult.primaryStyle?.type || '';
      default:
        return '';
    }
  }

  /**
   * Generate result summary
   */
  private generateResultSummary(testId: string, calculatedResult: any): string {
    if (!calculatedResult) return 'પરીક્ષણ પૂર્ણ';

    switch (testId) {
      case 'mbti':
        const code = calculatedResult.code || '';
        const description = calculatedResult.description || '';
        return `MBTI પ્રકાર: ${code} - ${description}`;
      case 'intelligence':
        const dominant = calculatedResult.dominantType || '';
        return `પ્રબળ બુદ્ધિ પ્રકાર: ${dominant}`;
      case 'bigfive':
        return 'Big Five વ્યક્તિત્વ પરિમાણોનું વિશ્લેષણ પૂર્ણ';
      case 'riasec':
        const hollandCode = calculatedResult.hollandCode || '';
        return `કારકિર્દી રુચિ કોડ: ${hollandCode}`;
      case 'svs':
        const coreValues = calculatedResult.coreValues || [];
        if (coreValues.length > 0) {
          return `મુખ્ય મૂલ્ય: ${coreValues[0].type}`;
        }
        return 'મૂલ્ય વિશ્લેષણ પૂર્ણ';
      case 'decision':
        const primaryStyle = calculatedResult.primaryStyle?.type || '';
        return `નિર્ણય શૈલી: ${primaryStyle}`;
      case 'vark':
        const learningStyle = calculatedResult.primaryStyle?.type || '';
        return `શીખવાની શૈલી: ${learningStyle}`;
      default:
        return 'પરીક્ષણ પૂર્ણ';
    }
  }

  /**
   * Save result automatically after test completion
   */
  async autoSaveResult(
    userId: string,
    testId: string,
    answers: Record<string, any>,
    sessionId?: string,
    timeTakenSeconds?: number
  ): Promise<TestResultResponse | null> {
    try {
      // Only save if we have valid answers
      if (!answers || Object.keys(answers).length === 0) {
        return null;
      }

      return await this.saveTestResult({
        userId,
        testId,
        answers,
        sessionId,
        timeTakenSeconds
      });
    } catch (error) {
      console.error('Error auto-saving test result:', error);
      // Don't throw error for auto-save failures
      return null;
    }
  }
}

// Export singleton instance
export const testResultService = new TestResultService();
export default testResultService;
