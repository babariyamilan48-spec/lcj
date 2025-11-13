import { tokenStore } from './token';
import { getApiBaseUrl } from '../config/api';

export interface ComprehensiveReportData {
  user_id: string;
  generated_at: string;
  report_type: string;
  summary: {
    total_tests_completed: number;
    average_score: number;
    achievements: number;
    report_generation_date: string;
  };
  test_results: Record<string, any>;
  ai_insights?: any;
  test_categories: Record<string, string[]>;
  metadata: {
    report_version: string;
    includes_ai_insights: boolean;
    total_sections: number;
    generation_timestamp: string;
  };
}

export interface ComprehensiveReportPreview {
  user_id: string;
  total_tests: number;
  test_types: string[];
  has_ai_insights: boolean;
  estimated_pages: number;
  generation_time_estimate: string;
  available_formats: string[];
}

class ComprehensiveReportService {
  
  private getBaseUrl(): string {
    return `${getApiBaseUrl()}/api/v1`;
  }

  private getHeaders(): HeadersInit {
    const token = tokenStore.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return response.json();
  }
  
  /**
   * Get comprehensive report data for a user
   */
  async getComprehensiveReport(userId: string): Promise<ComprehensiveReportData> {
    const response = await fetch(`${this.getBaseUrl()}/results_service/comprehensive-report/${userId}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<ComprehensiveReportData>(response);
  }

  /**
   * Get preview of comprehensive report (what will be included)
   */
  async getComprehensiveReportPreview(userId: string): Promise<ComprehensiveReportPreview> {
    const response = await fetch(`${this.getBaseUrl()}/results_service/comprehensive-report/${userId}/preview`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<ComprehensiveReportPreview>(response);
  }

  /**
   * Generate and download comprehensive report as PDF (via print dialog)
   */
  async downloadComprehensiveReport(userId: string): Promise<void> {
    try {
      // Open comprehensive report in new window
      const reportUrl = `/comprehensive-report/${userId}`;
      const reportWindow = window.open(reportUrl, '_blank', 'width=1200,height=800');
      
      if (!reportWindow) {
        throw new Error('Unable to open report window. Please check your popup blocker settings.');
      }

      // Wait for the window to load and then trigger print
      reportWindow.addEventListener('load', () => {
        setTimeout(() => {
          reportWindow.print();
        }, 1000); // Give time for content to render
      });

    } catch (error) {
      console.error('Error downloading comprehensive report:', error);
      throw error;
    }
  }

  /**
   * Check if user has enough data for comprehensive report
   */
  async canGenerateReport(userId: string): Promise<boolean> {
    try {
      const preview = await this.getComprehensiveReportPreview(userId);
      return preview.total_tests > 0;
    } catch (error) {
      console.error('Error checking report generation capability:', error);
      return false;
    }
  }

  /**
   * Get estimated report size and generation time
   */
  async getReportEstimates(userId: string): Promise<{
    estimatedPages: number;
    estimatedTime: string;
    includesAI: boolean;
    testCount: number;
  }> {
    const preview = await this.getComprehensiveReportPreview(userId);
    
    return {
      estimatedPages: preview.estimated_pages,
      estimatedTime: preview.generation_time_estimate,
      includesAI: preview.has_ai_insights,
      testCount: preview.total_tests
    };
  }
}

// Export singleton instance
export const comprehensiveReportService = new ComprehensiveReportService();
