import { API_BASE_URL } from '../config/api';

export interface TestOverviewItem {
  test_id: string;
  test_name_gujarati: string;
  test_name_english: string;
  primary_result: string;
  result_name_gujarati: string;
  result_name_english: string;
  completion_date: string;
  score_percentage?: number;
  traits: string[];
  careers: string[];
  strengths: string[];
  recommendations: string[];
  description_gujarati: string;
  description_english: string;
}

export interface UserOverview {
  user_id: number;
  total_unique_tests: number;
  total_tests_completed: number;
  latest_test_results: TestOverviewItem[];
  top_careers: string[];
  top_strengths: string[];
  development_areas: string[];
  last_activity?: string;
}

class OverviewService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/v1/question_service/test-results`;
  }

  async getUserOverview(userId: number): Promise<UserOverview> {
    try {
      const response = await fetch(`${this.baseUrl}/latest-summary/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user overview:', error);
      throw error;
    }
  }

  async getTestResultsByType(userId: number, testType: string): Promise<TestOverviewItem[]> {
    try {
      const overview = await this.getUserOverview(userId);
      return overview.latest_test_results.filter((result: TestOverviewItem) => result.test_id === testType);
    } catch (error) {
      console.error('Error fetching test results by type:', error);
      throw error;
    }
  }

  async getCareerInsights(userId: number): Promise<{
    recommendations: string[];
    strengths: string[];
    personality_types: Record<string, string>;
  }> {
    try {
      const overview = await this.getUserOverview(userId);
      // Create personality types from latest test results
      const personalityTypes: Record<string, string> = {};
      overview.latest_test_results.forEach((result: TestOverviewItem) => {
        personalityTypes[result.test_id] = result.primary_result;
      });
      
      return {
        recommendations: overview.top_careers,
        strengths: overview.top_strengths,
        personality_types: personalityTypes,
      };
    } catch (error) {
      console.error('Error fetching career insights:', error);
      throw error;
    }
  }

  async getPersonalityInsights(userId: number): Promise<{
    summary: Record<string, string>;
    strengths: string[];
    development_areas: string[];
    test_results: TestOverviewItem[];
  }> {
    try {
      const overview = await this.getUserOverview(userId);
      // Create summary from latest test results
      const summary: Record<string, string> = {};
      overview.latest_test_results.forEach((result: TestOverviewItem) => {
        summary[result.test_id] = result.primary_result;
      });
      
      return {
        summary: summary,
        strengths: overview.top_strengths,
        development_areas: overview.development_areas,
        test_results: overview.latest_test_results,
      };
    } catch (error) {
      console.error('Error fetching personality insights:', error);
      throw error;
    }
  }

  async getCompletionStats(userId: number): Promise<{
    total_completed: number;
    tests_by_type: Record<string, number>;
    time_stats: {
      total_time: number;
      average_time: number;
    };
    recent_activity: number;
  }> {
    try {
      const overview = await this.getUserOverview(userId);
      // Create tests_by_type from latest test results
      const testsByType: Record<string, number> = {};
      overview.latest_test_results.forEach((result: TestOverviewItem) => {
        testsByType[result.test_id] = 1; // Each test type appears once in latest results
      });
      
      return {
        total_completed: overview.total_tests_completed,
        tests_by_type: testsByType,
        time_stats: {
          total_time: 0, // Not available in new API
          average_time: 0, // Not available in new API
        },
        recent_activity: overview.total_unique_tests, // Use unique tests as proxy
      };
    } catch (error) {
      console.error('Error fetching completion stats:', error);
      throw error;
    }
  }

  formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)} સેકન્ડ`;
    } else if (seconds < 3600) {
      const minutes = Math.round(seconds / 60);
      return `${minutes} મિનિટ`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      return `${hours} કલાક ${minutes} મિનિટ`;
    }
  }

  getTestDisplayName(testId: string, language: 'gujarati' | 'english' = 'gujarati'): string {
    const testNames: Record<string, { gujarati: string; english: string }> = {
      mbti: { gujarati: 'MBTI વ્યક્તિત્વ પરીક્ષા', english: 'MBTI Personality Test' },
      intelligence: { gujarati: 'બહુવિધ બુદ્ધિ પરીક્ષા', english: 'Multiple Intelligence Test' },
      bigfive: { gujarati: 'Big Five વ્યક્તિત્વ પરીક્ષા', english: 'Big Five Personality Test' },
      riasec: { gujarati: 'કારકિર્દી રુચિ પરીક્ષા', english: 'Career Interest Test' },
      svs: { gujarati: 'મૂલ્યો પરીક્ષા', english: 'Values Survey' },
      decision: { gujarati: 'નિર્ણય શૈલી પરીક્ષા', english: 'Decision Making Style Test' },
      vark: { gujarati: 'શીખવાની શૈલી પરીક્ષા', english: 'Learning Style Test' },
    };

    return testNames[testId]?.[language] || testId;
  }
}

export const overviewService = new OverviewService();
export default overviewService;
