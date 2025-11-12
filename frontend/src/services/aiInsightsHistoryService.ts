import api from './api';
import { getApiBaseUrl } from '../config/api';

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
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number; promise?: Promise<any> }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  private getCacheKey(userId: string): string {
    return `ai_insights_${userId}`;
  }

  private isValidCache(cacheEntry: { data: any; timestamp: number }): boolean {
    return Date.now() - cacheEntry.timestamp < this.CACHE_TTL;
  }

  /**
   * Get AI insights formatted for test history display
   */
  async getAIInsightsHistory(userId: string): Promise<AIInsightsHistoryItem[]> {
    try {
      const cacheKey = this.getCacheKey(userId);
      const cacheEntry = this.cache.get(cacheKey);

      // Return cached data if valid
      if (cacheEntry && this.isValidCache(cacheEntry)) {
        console.log(`🔍 AIInsightsHistoryService: Using cached data for user ${userId}`);
        return cacheEntry.data;
      }

      // Return existing promise if one is in progress
      if (cacheEntry && cacheEntry.promise) {
        console.log(`🔍 AIInsightsHistoryService: Waiting for existing request for user ${userId}`);
        return await cacheEntry.promise;
      }

      console.log(`🔍 AIInsightsHistoryService: Making fresh API call for user ${userId}`);
      
      const promise = api.get<AIInsightsHistoryResponse>(
        `/api/v1/results_service/ai-insights/${userId}/history`
      ).then(response => {
        if (response.data.success) {
          this.cache.set(cacheKey, { data: response.data.ai_insights, timestamp: Date.now() });
          return response.data.ai_insights;
        } else {
          this.cache.set(cacheKey, { data: [], timestamp: Date.now() });
          return [];
        }
      }).catch(error => {
        this.cache.delete(cacheKey);
        throw error;
      });

      // Store the promise to prevent duplicate calls
      this.cache.set(cacheKey, { data: [], timestamp: Date.now(), promise });
      
      return await promise;
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
