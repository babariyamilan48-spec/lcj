import api from './api';
import { AIInsightRequest, ComprehensiveAIRequest, AIInsights, ComprehensiveAIInsights } from './aiInsightsService';

export interface AsyncTaskResponse {
  task_id: string;
  status: string;
  message: string;
  estimated_completion?: string;
  // Redirect properties for one-time restriction
  redirect_to_history?: boolean;
  existing_result_id?: string;
}

export interface TaskStatusResponse {
  task_id: string;
  status: string;
  ready: boolean;
  successful?: boolean;
  failed?: boolean;
  progress?: {
    status: string;
    progress: number;
    test_type?: string;
    user_id?: string;
  };
  result?: any;
  error?: string;
}

class AIInsightsAsyncService {
  private baseUrl = '/api/v1/results_service/async';

  /**
   * Start async comprehensive AI insights generation
   * Returns immediately with task ID
   */
  async startComprehensiveInsights(request: ComprehensiveAIRequest): Promise<AsyncTaskResponse> {
    try {
      const response = await api.post<AsyncTaskResponse>(
        `${this.baseUrl}/ai-insights/comprehensive-async`,
        request,
        {
          timeout: 30000, // 30 second timeout for starting the task (increased for redirect check)
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      // Check if this is a timeout error and provide better message
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('AI રિપોર્ટ બનાવવામાં સમય લાગી રહ્યો છે. કૃપા કરીને ફરીથી પ્રયાસ કરો.');
      }
      
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to start comprehensive AI insights generation'
      );
    }
  }

  /**
   * Start async AI insights generation for single test
   * Returns immediately with task ID
   */
  async startInsights(request: AIInsightRequest): Promise<AsyncTaskResponse> {
    try {
      const response = await api.post<AsyncTaskResponse>(
        `${this.baseUrl}/ai-insights/generate-async`,
        request,
        {
          timeout: 10000, // 10 second timeout for starting the task
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to start AI insights generation'
      );
    }
  }

  /**
   * Check the status of a running task
   */
  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    try {
      const response = await api.get<TaskStatusResponse>(
        `${this.baseUrl}/task-status/${taskId}`,
        {
          timeout: 5000 // 5 second timeout for status check
        }
      );
      
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to get task status'
      );
    }
  }

  /**
   * Get the result of a completed task
   */
  async getTaskResult(taskId: string): Promise<any> {
    try {
      const response = await api.get(
        `${this.baseUrl}/task-result/${taskId}`,
        {
          timeout: 10000 // 10 second timeout for getting result
        }
      );
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 202) {
        throw new Error('Task is still processing');
      }
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to get task result'
      );
    }
  }

  /**
   * Cancel a running task
   */
  async cancelTask(taskId: string): Promise<{ message: string; task_id: string; cancelled_at: string }> {
    try {
      const response = await api.delete(
        `${this.baseUrl}/task/${taskId}`,
        {
          timeout: 5000
        }
      );
      
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to cancel task'
      );
    }
  }

  /**
   * Poll task status until completion
   * Returns the final result when ready
   */
  async pollTaskUntilComplete(
    taskId: string, 
    onProgress?: (progress: TaskStatusResponse) => void,
    maxWaitTime: number = 300000 // 5 minutes max wait
  ): Promise<any> {
    const startTime = Date.now();
    const pollInterval = 3000; // Poll every 3 seconds (increased for cloud Redis)

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          // Check if we've exceeded max wait time
          if (Date.now() - startTime > maxWaitTime) {
            reject(new Error('Task timeout: Maximum wait time exceeded'));
            return;
          }

          const status = await this.getTaskStatus(taskId);
          
          // Call progress callback if provided
          if (onProgress) {
            onProgress(status);
          }

          if (status.ready) {
            if (status.successful) {
              // Task completed successfully
              try {
                const result = await this.getTaskResult(taskId);
                resolve(result);
              } catch (error) {
                reject(error);
              }
            } else {
              // Task failed
              reject(new Error(status.error || 'Task failed'));
            }
          } else {
            // Task still running, continue polling
            setTimeout(poll, pollInterval);
          }
        } catch (error) {
          reject(error);
        }
      };

      // Start polling
      poll();
    });
  }

  /**
   * Complete async comprehensive insights generation
   * Starts the task and polls until completion
   */
  async generateComprehensiveInsightsAsync(
    request: ComprehensiveAIRequest,
    onProgress?: (progress: TaskStatusResponse) => void
  ): Promise<{
    success: boolean;
    insights?: ComprehensiveAIInsights;
    error?: string;
  }> {
    try {
      // Start the async task
      const taskResponse = await this.startComprehensiveInsights(request);
      
      // Check if this is a redirect response (AI insights already exist)
      if (taskResponse.redirect_to_history) {
        return {
          success: true,
          insights: {
            redirect_to_history: true,
            message: taskResponse.message,
            existing_result_id: taskResponse.existing_result_id
          } as ComprehensiveAIInsights
        };
      }
      
      // Poll until completion
      const result = await this.pollTaskUntilComplete(
        taskResponse.task_id,
        onProgress,
        480000 // 8 minutes max wait for comprehensive insights
      );

      if (result.success) {
        return {
          success: true,
          insights: result.insights
        };
      } else {
        return {
          success: false,
          error: result.error || 'AI insights generation failed'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate comprehensive insights'
      };
    }
  }

  /**
   * Complete async insights generation for single test
   * Starts the task and polls until completion
   */
  async generateInsightsAsync(
    request: AIInsightRequest,
    onProgress?: (progress: TaskStatusResponse) => void
  ): Promise<{
    success: boolean;
    insights?: AIInsights;
    error?: string;
  }> {
    try {
      // Start the async task
      const taskResponse = await this.startInsights(request);
      
      // Poll until completion
      const result = await this.pollTaskUntilComplete(
        taskResponse.task_id,
        onProgress,
        300000 // 5 minutes max wait for single test insights
      );

      if (result.success) {
        return {
          success: true,
          insights: result.insights
        };
      } else {
        return {
          success: false,
          error: result.error || 'AI insights generation failed'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate insights'
      };
    }
  }

  /**
   * Health check for async services
   */
  async healthCheck(): Promise<{ status: string; service: string; celery_status?: string }> {
    try {
      const response = await api.get(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
      console.error('Async AI service health check failed:', error);
      return { status: 'unhealthy', service: 'async-ai-insights' };
    }
  }

  /**
   * Get progress message in Gujarati
   */
  getProgressMessage(status: TaskStatusResponse): string {
    if (status.progress) {
      const progress = status.progress.progress || 0;
      const statusText = status.progress.status || 'Processing...';
      
      // Convert to Gujarati
      const gujaratiMessages: { [key: string]: string } = {
        'Starting': 'શરૂ કરી રહ્યું છે...',
        'Processing': 'પ્રક્રિયા કરી રહ્યું છે...',
        'Generating AI insights': 'AI આંતરદૃષ્ટિ બનાવી રહ્યું છે...',
        'Analyzing test results': 'ટેસ્ટ પરિણામોનું વિશ્લેષણ કરી રહ્યું છે...',
        'Creating comprehensive report': 'વ્યાપક રિપોર્ટ બનાવી રહ્યું છે...',
        'Finalizing insights': 'આંતરદૃષ્ટિને અંતિમ સ્વરૂપ આપી રહ્યું છે...'
      };

      const gujaratiStatus = gujaratiMessages[statusText] || 'રિપોર્ટ તૈયાર કરી રહ્યું છે...';
      return `${gujaratiStatus} (${progress}%)`;
    }

    return 'રિપોર્ટ તૈયાર કરી રહ્યું છે...';
  }
}

export const aiInsightsAsyncService = new AIInsightsAsyncService();
