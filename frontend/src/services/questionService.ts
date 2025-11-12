// Question Service for API integration
import { getApiBaseUrl } from '../config/api';

// Use dynamic API base URL
const getApiUrl = () => `${getApiBaseUrl()}/api/v1/question_service`;

// API Response format
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  message: string | null;
}

export interface Test {
  id: number;
  test_id: string;
  name: string;
  english_name: string;
  description?: string;
  icon?: string;
  color?: string;
  questions_count: number;
  duration?: string;
  is_active: boolean;
  sections: TestSection[];
  dimensions: TestDimension[];
}

export interface TestSection {
  id: number;
  section_id: string;
  name: string;
  gujarati_name?: string;
}

export interface TestDimension {
  id: number;
  dimension_id: string;
  name: string;
  english_name: string;
  gujarati_name?: string;
  description?: string;
  careers?: string[];
}

export interface Question {
  id: number;
  test_id: number;
  section_id?: number;
  question_text: string;
  question_order: number;
  is_active: boolean;
  options: Option[];
}

export interface Option {
  id: number;
  option_text: string;
  dimension?: string;
  weight: number;
  option_order: number;
  is_active: boolean;
}

export interface TestListResponse {
  tests: Test[];
  total: number;
  page: number;
  size: number;
}

export interface QuestionListResponse {
  questions: Question[];
  total: number;
  page: number;
  size: number;
}

class QuestionService {
  private authToken: string | null = null;

  constructor() {
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.authToken = localStorage.getItem('auth_token');
    }
  }

  private getBaseUrl(): string {
    return getApiUrl();
  }

  private initializeAuth() {
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.authToken = localStorage.getItem('auth_token');
    }
  }

  // Set authentication token
  setAuthToken(token: string | null) {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  // Get headers with auth token
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    return headers;
  }

  // Handle API response
  private async handleResponse<T>(response: Response): Promise<T> {
    try {
      const rawText = await response.text();
      
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : 'JSON parsing failed';
        throw new Error(`Invalid JSON response: ${errorMessage}`);
      }
      
      // Handle HTTP errors first
      if (!response.ok) {
        throw new Error(data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Check if response has success field
      if ('success' in data) {
        if (!data.success) {
          const errorMessage = data.error || data.message || 'API request failed';
          console.warn('API returned success=false:', {
            success: data.success,
            error: data.error,
            message: data.message,
            data: data.data,
            fullResponse: data
          });
          
          // If we have data but success is false, it might still be valid
          if (data.data) {
            console.warn('API returned success=false but has data, proceeding with data');
            return data.data as T;
          }
          
          throw new Error(errorMessage);
        }
        
        // Return data field if success is true
        return data.data as T;
      } else {
        // If no success field, assume the entire response is the data
        return data as T;
      }
    } catch (error) {
      throw error;
    }
  }

  // Test methods
  async getTests(page: number = 1, size: number = 100, isActive?: boolean): Promise<TestListResponse> {
    const params = new URLSearchParams({
      skip: ((page - 1) * size).toString(),
      limit: size.toString(),
    });
    
    if (isActive !== undefined) {
      params.append('is_active', isActive.toString());
    }

    const url = `${this.getBaseUrl()}/tests/?${params}`;
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });
    
    const rawResult = await this.handleResponse<Test[] | TestListResponse>(response);
    
    // Handle both direct array response and wrapped response
    let result: TestListResponse;
    if (Array.isArray(rawResult)) {
      // Backend returned tests array directly
      result = {
        tests: rawResult,
        total: rawResult.length,
        page: page,
        size: size
      };
    } else {
      // Backend returned wrapped response
      result = rawResult as TestListResponse;
    }
    
    return result;
  }

  async getTest(testId: string): Promise<Test> {
    const response = await fetch(`${this.getBaseUrl()}/tests/${testId}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<Test>(response);
  }

  async getTestQuestions(testId: string): Promise<Question[]> {
    console.log(`🔍 Fetching test questions for testId: ${testId}`);
    
    const response = await fetch(`${this.getBaseUrl()}/tests/${testId}/questions`, {
      headers: this.getHeaders(),
    });
    
    console.log(`📡 API Response status: ${response.status}`);
    
    const result = await this.handleResponse<any>(response);
    
    console.log(`🔍 Raw API result:`, {
      type: typeof result,
      isArray: Array.isArray(result),
      keys: typeof result === 'object' ? Object.keys(result) : 'N/A',
      hasQuestions: result && typeof result === 'object' && 'questions' in result
    });
    
    // Extract questions array from the response
    let questions: Question[] = [];
    
    if (Array.isArray(result)) {
      // If result is already an array, use it directly
      questions = result;
    } else if (result && typeof result === 'object' && 'questions' in result) {
      // If result is an object with questions property, extract it
      questions = result.questions || [];
    } else {
      console.warn('⚠️ Unexpected API response format:', result);
      questions = [];
    }
    
    console.log(`✅ Extracted questions:`, {
      count: questions.length,
      firstQuestion: questions.length > 0 ? questions[0].question_text : 'N/A'
    });
    
    return questions;
  }

  // Question methods
  async getQuestions(
    page: number = 1, 
    size: number = 100, 
    testId?: number, 
    sectionId?: number, 
    isActive?: boolean
  ): Promise<QuestionListResponse> {
    const params = new URLSearchParams({
      skip: ((page - 1) * size).toString(),
      limit: size.toString(),
    });
    
    if (testId !== undefined) {
      params.append('test_id', testId.toString());
    }
    if (sectionId !== undefined) {
      params.append('section_id', sectionId.toString());
    }
    if (isActive !== undefined) {
      params.append('is_active', isActive.toString());
    }

    const response = await fetch(`${this.getBaseUrl()}/questions/?${params}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<QuestionListResponse>(response);
  }

  async getQuestion(questionId: number): Promise<Question> {
    const response = await fetch(`${this.getBaseUrl()}/questions/${questionId}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<Question>(response);
  }

  // Utility methods for backward compatibility
  async getAvailableTests(): Promise<Test[]> {
    const response = await this.getTests(1, 100, true);
    return response.tests;
  }

  async getTestQuestionsByTestId(testId: string): Promise<Question[]> {
    return this.getTestQuestions(testId);
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
  async getTestsCached(page: number = 1, size: number = 100, isActive?: boolean): Promise<TestListResponse> {
    const cacheKey = `tests_${page}_${size}_${isActive}`;
    const cached = this.getCachedData<TestListResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.getTests(page, size, isActive);
    this.setCachedData(cacheKey, data);
    return data;
  }

  async getTestCached(testId: string): Promise<Test> {
    const cacheKey = `test_${testId}`;
    const cached = this.getCachedData<Test>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.getTest(testId);
    this.setCachedData(cacheKey, data);
    return data;
  }

  async getTestQuestionsCached(testId: string): Promise<Question[]> {
    const cacheKey = `test_questions_${testId}`;
    const cached = this.getCachedData<Question[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.getTestQuestions(testId);
    this.setCachedData(cacheKey, data);
    return data;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const questionService = new QuestionService();

// Export class for custom instances
export default QuestionService;
