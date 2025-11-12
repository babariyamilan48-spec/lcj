/**
 * Optimized API Service for LCJ Career Assessment System
 * Provides ultra-fast API calls with caching, error handling, and performance monitoring
 */

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  performance?: {
    processing_time_ms: number;
    optimized: boolean;
    cached?: boolean;
  };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PerformanceMetrics {
  endpoint: string;
  responseTime: number;
  cached: boolean;
  timestamp: number;
  success: boolean;
}

class OptimizedApiService {
  private baseUrl: string;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private performanceMetrics: PerformanceMetrics[] = [];
  private maxCacheSize = 100;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  constructor(baseUrl: string = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.setupPerformanceMonitoring();
  }

  private setupPerformanceMonitoring() {
    // Clean up old metrics every 10 minutes
    setInterval(() => {
      const cutoff = Date.now() - 10 * 60 * 1000;
      this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoff);
    }, 10 * 60 * 1000);
  }

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}${params ? JSON.stringify(params) : ''}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Implement LRU cache
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheTTL?: number
  ): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    const cacheKey = this.getCacheKey(endpoint, options.body);
    
    // Check cache for GET requests
    if (!options.method || options.method === 'GET') {
      const cached = this.getFromCache<ApiResponse<T>>(cacheKey);
      if (cached) {
        const responseTime = performance.now() - startTime;
        this.recordMetrics(endpoint, responseTime, true, true);
        return {
          ...cached,
          performance: {
            ...cached.performance,
            cached: true
          }
        };
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const responseTime = performance.now() - startTime;
      const data: ApiResponse<T> = await response.json();

      // Record performance metrics
      this.recordMetrics(endpoint, responseTime, false, data.success);

      // Cache successful GET responses
      if (data.success && (!options.method || options.method === 'GET')) {
        this.setCache(cacheKey, data, cacheTTL);
      }

      return data;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.recordMetrics(endpoint, responseTime, false, false);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        performance: {
          processing_time_ms: responseTime,
          optimized: true,
          cached: false
        }
      };
    }
  }

  private recordMetrics(endpoint: string, responseTime: number, cached: boolean, success: boolean) {
    this.performanceMetrics.push({
      endpoint,
      responseTime,
      cached,
      timestamp: Date.now(),
      success
    });

    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Performance: ${endpoint} - ${responseTime.toFixed(2)}ms (cached: ${cached})`);
    }
  }

  // ==================== RESULTS SERVICE METHODS ====================

  async submitResultFast(resultData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/v1/results_service/optimized/results/fast', {
      method: 'POST',
      body: JSON.stringify(resultData)
    });
  }

  async getUserResultsFast(userId: string, page: number = 1, size: number = 10): Promise<ApiResponse> {
    return this.makeRequest(
      `/api/v1/results_service/optimized/results/${userId}/fast?page=${page}&size=${size}`,
      {},
      2 * 60 * 1000 // 2 minutes cache
    );
  }

  async getAllResultsFast(userId: string): Promise<ApiResponse> {
    return this.makeRequest(
      `/api/v1/results_service/optimized/all-results/${userId}/fast`,
      {},
      5 * 60 * 1000 // 5 minutes cache
    );
  }

  async getLatestResultFast(userId: string): Promise<ApiResponse> {
    return this.makeRequest(
      `/api/v1/results_service/optimized/results/${userId}/latest/fast`,
      {},
      1 * 60 * 1000 // 1 minute cache
    );
  }

  async getBatchUserDataFast(userId: string): Promise<ApiResponse> {
    return this.makeRequest(
      `/api/v1/results_service/optimized/batch-user-data/${userId}`,
      {},
      3 * 60 * 1000 // 3 minutes cache
    );
  }

  // ==================== QUESTION SERVICE METHODS ====================

  async getQuestionsFast(params: {
    skip?: number;
    limit?: number;
    testId?: number;
    sectionId?: number;
    isActive?: boolean;
  } = {}): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.makeRequest(
      `/api/v1/question_service/optimized/questions/fast?${queryParams}`,
      {},
      10 * 60 * 1000 // 10 minutes cache
    );
  }

  async getQuestionWithOptionsFast(questionId: number): Promise<ApiResponse> {
    return this.makeRequest(
      `/api/v1/question_service/optimized/questions/${questionId}/fast`,
      {},
      30 * 60 * 1000 // 30 minutes cache
    );
  }

  async getTestQuestionsFast(testId: number): Promise<ApiResponse> {
    return this.makeRequest(
      `/api/v1/question_service/optimized/tests/${testId}/questions/fast`,
      {},
      60 * 60 * 1000 // 1 hour cache
    );
  }

  async getTestStructureFast(testId: number): Promise<ApiResponse> {
    return this.makeRequest(
      `/api/v1/question_service/optimized/tests/${testId}/structure/fast`,
      {},
      2 * 60 * 60 * 1000 // 2 hours cache
    );
  }

  async getQuestionsBatchFast(questionIds: number[]): Promise<ApiResponse> {
    return this.makeRequest('/api/v1/question_service/optimized/questions/batch/fast', {
      method: 'POST',
      body: JSON.stringify(questionIds)
    });
  }

  // ==================== AUTH SERVICE METHODS ====================

  async loginFast(email: string, password: string): Promise<ApiResponse> {
    return this.makeRequest('/api/v1/auth_service/optimized/auth/login/fast', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async getCurrentUserFast(): Promise<ApiResponse> {
    return this.makeRequest(
      '/api/v1/auth_service/optimized/auth/me/fast',
      {},
      1 * 60 * 1000 // 1 minute cache
    );
  }

  async checkAuthHealthFast(): Promise<ApiResponse> {
    return this.makeRequest('/api/v1/auth_service/optimized/auth/health/fast');
  }

  // ==================== HEALTH CHECK METHODS ====================

  async checkResultsHealthFast(): Promise<ApiResponse> {
    return this.makeRequest('/api/v1/results_service/optimized/health/fast');
  }

  async checkQuestionsHealthFast(): Promise<ApiResponse> {
    return this.makeRequest('/api/v1/question_service/optimized/health/fast');
  }

  async checkSystemHealth(): Promise<ApiResponse> {
    try {
      const [resultsHealth, questionsHealth, authHealth] = await Promise.all([
        this.checkResultsHealthFast(),
        this.checkQuestionsHealthFast(),
        this.checkAuthHealthFast()
      ]);

      return {
        success: true,
        data: {
          results: resultsHealth.data,
          questions: questionsHealth.data,
          auth: authHealth.data,
          overall: resultsHealth.success && questionsHealth.success && authHealth.success ? 'healthy' : 'degraded'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'System health check failed'
      };
    }
  }

  // ==================== CACHE MANAGEMENT ====================

  clearCache(): void {
    this.cache.clear();
    console.log('API cache cleared');
  }

  invalidateUserCache(userId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(`user_${userId}`) || key.includes(`/${userId}/`)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`Cache invalidated for user ${userId}`);
  }

  getCacheStats(): { size: number; hitRate: number; avgResponseTime: number } {
    const recentMetrics = this.performanceMetrics.filter(
      m => m.timestamp > Date.now() - 5 * 60 * 1000 // Last 5 minutes
    );

    const cachedRequests = recentMetrics.filter(m => m.cached).length;
    const totalRequests = recentMetrics.length;
    const hitRate = totalRequests > 0 ? (cachedRequests / totalRequests) * 100 : 0;

    const avgResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
      : 0;

    return {
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100
    };
  }

  // ==================== PERFORMANCE MONITORING ====================

  getPerformanceReport(): {
    totalRequests: number;
    successRate: number;
    avgResponseTime: number;
    cacheHitRate: number;
    slowestEndpoints: Array<{ endpoint: string; avgTime: number }>;
  } {
    const recentMetrics = this.performanceMetrics.filter(
      m => m.timestamp > Date.now() - 10 * 60 * 1000 // Last 10 minutes
    );

    const successfulRequests = recentMetrics.filter(m => m.success).length;
    const successRate = recentMetrics.length > 0 
      ? (successfulRequests / recentMetrics.length) * 100 
      : 0;

    const cachedRequests = recentMetrics.filter(m => m.cached).length;
    const cacheHitRate = recentMetrics.length > 0 
      ? (cachedRequests / recentMetrics.length) * 100 
      : 0;

    const avgResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
      : 0;

    // Calculate slowest endpoints
    const endpointStats = new Map<string, { total: number; count: number }>();
    recentMetrics.forEach(m => {
      const current = endpointStats.get(m.endpoint) || { total: 0, count: 0 };
      endpointStats.set(m.endpoint, {
        total: current.total + m.responseTime,
        count: current.count + 1
      });
    });

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgTime: Math.round((stats.total / stats.count) * 100) / 100
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);

    return {
      totalRequests: recentMetrics.length,
      successRate: Math.round(successRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      slowestEndpoints
    };
  }

  // ==================== FALLBACK METHODS ====================

  async withFallback<T>(
    optimizedCall: () => Promise<ApiResponse<T>>,
    fallbackCall: () => Promise<ApiResponse<T>>,
    fallbackThreshold: number = 5000 // 5 seconds
  ): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    
    try {
      const result = await optimizedCall();
      const responseTime = performance.now() - startTime;
      
      // If optimized call is too slow, note it for future fallbacks
      if (responseTime > fallbackThreshold) {
        console.warn(`Optimized endpoint slow (${responseTime}ms), consider using fallback`);
      }
      
      return result;
    } catch (error) {
      console.warn('Optimized endpoint failed, falling back to standard endpoint');
      return fallbackCall();
    }
  }
}

// Create and export singleton instance
export const optimizedApiService = new OptimizedApiService();
export default optimizedApiService;
