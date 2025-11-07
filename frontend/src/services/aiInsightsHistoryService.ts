import api from './api';

export interface AIInsightsHistoryItem {
  id: string;
  test_id: string;
  test_name: string;
  result_name_gujarati: string;
  result_name_english: string;
  primary_result: string;
  completion_date: string;
  timestamp: string;
  percentage: number;
  score: number;
  status: string;
  model_used: string;
  insights_data: string;
}

export interface AIInsightsHistoryResponse {
  success: boolean;
  ai_insights: AIInsightsHistoryItem[];
  count: number;
  message: string;
}

class AIInsightsHistoryService {
  /**
   * Get AI insights formatted for test history display
   */
  async getAIInsightsHistory(userId: string): Promise<AIInsightsHistoryItem[]> {
    try {
      
      const response = await api.get<AIInsightsHistoryResponse>(
        `/api/v1/results_service/ai-insights/${userId}/history`
      );

      if (response.data.success) {
        
        return response.data.ai_insights;
      } else {
        
        return [];
      }
    } catch (error: any) {
      console.error('🔍 AIInsightsHistoryService: Error occurred:', error);
      console.error('🔍 AIInsightsHistoryService: Error response:', error.response);
      console.error('🔍 AIInsightsHistoryService: Error status:', error.response?.status);
      
      // If no AI insights found (404), return empty array
      if (error.response?.status === 404) {
        
        return [];
      }
      
      console.error('Error fetching AI insights history:', error);
      throw new Error('Failed to fetch AI insights history');
    }
  }

  /**
   * Get raw AI insights data for a user
   */
  async getAIInsights(userId: string): Promise<any> {
    try {
      const response = await api.get(`/api/v1/results_service/ai-insights/${userId}`);
      
      if (response.data.success) {
        return response.data.ai_insights;
      } else {
        return null;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      
      console.error('Error fetching AI insights:', error);
      throw new Error('Failed to fetch AI insights');
    }
  }

  /**
   * Check if user has AI insights
   */
  async hasAIInsights(userId: string): Promise<boolean> {
    try {
      const insights = await this.getAIInsights(userId);
      return insights !== null;
    } catch (error) {
      return false;
    }
  }
}

export const aiInsightsHistoryService = new AIInsightsHistoryService();
