/**
 * Optimized API Interceptor with Session Management
 * Handles automatic token refresh and performance monitoring
 */

import { optimizedAuthService } from '@/services/optimizedAuthService';
import { tokenStore } from '@/services/token';

interface RequestConfig {
  url: string;
  options?: RequestInit;
}

interface InterceptorResponse {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
  headers?: Headers;
}

class OptimizedApiInterceptor {
  private refreshPromise: Promise<boolean> | null = null;
  private performanceMetrics: { [key: string]: number[] } = {};

  async intercept(config: RequestConfig): Promise<InterceptorResponse> {
    const { url, options = {} } = config;
    const startTime = performance.now();
    
    try {
      // Add auth headers if available
      const token = tokenStore.getAccessToken();
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      // Make the request
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const duration = performance.now() - startTime;
      this.recordPerformanceMetric(url, duration);

      // Handle 401 Unauthorized - attempt token refresh
      if (response.status === 401 && token) {
        console.log('🔄 Received 401, attempting token refresh...');
        
        const refreshed = await this.handleTokenRefresh();
        if (refreshed) {
          // Retry the original request with new token
          const newToken = tokenStore.getAccessToken();
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            },
          });

          const retryDuration = performance.now() - startTime;
          this.recordPerformanceMetric(`${url}_retry`, retryDuration);

          return await this.processResponse(retryResponse, url);
        } else {
          // Refresh failed, redirect to login
          this.handleAuthFailure();
          return {
            success: false,
            error: 'Authentication failed. Please log in again.',
            status: 401,
          };
        }
      }

      return await this.processResponse(response, url);
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordPerformanceMetric(`${url}_error`, duration);

      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
      };
    }
  }

  private async processResponse(response: Response, url: string): Promise<InterceptorResponse> {
    try {
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data,
          status: response.status,
          headers: response.headers,
        };
      } else {
        const errorMessage = data?.detail || data?.message || data?.error || `HTTP ${response.status}`;
        return {
          success: false,
          error: errorMessage,
          status: response.status,
          headers: response.headers,
        };
      }
    } catch (parseError) {
      // Handle non-JSON responses
      const text = await response.text();
      return {
        success: response.ok,
        data: text,
        status: response.status,
        headers: response.headers,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  }

  private async handleTokenRefresh(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;

    return result;
  }

  private async performTokenRefresh(): Promise<boolean> {
    try {
      console.log('🔄 Performing token refresh...');
      await optimizedAuthService.refreshToken();
      console.log('✅ Token refresh successful');
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return false;
    }
  }

  private handleAuthFailure(): void {
    console.log('🔒 Authentication failure, clearing session...');
    tokenStore.clear();
    optimizedAuthService.clearCache();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  private recordPerformanceMetric(endpoint: string, duration: number): void {
    const key = this.getEndpointKey(endpoint);
    
    if (!this.performanceMetrics[key]) {
      this.performanceMetrics[key] = [];
    }
    
    this.performanceMetrics[key].push(duration);
    
    // Keep only last 10 measurements per endpoint
    if (this.performanceMetrics[key].length > 10) {
      this.performanceMetrics[key] = this.performanceMetrics[key].slice(-10);
    }

    // Log slow requests
    if (duration > 2000) {
      console.warn(`🐌 Slow API request: ${key} took ${duration.toFixed(2)}ms`);
    } else if (duration > 1000) {
      console.log(`⚠️ Moderate API request: ${key} took ${duration.toFixed(2)}ms`);
    } else {
      console.debug(`⚡ Fast API request: ${key} took ${duration.toFixed(2)}ms`);
    }
  }

  private getEndpointKey(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.replace(/\/[a-f0-9-]{36}/g, '/{id}'); // Replace UUIDs with {id}
    } catch {
      return url;
    }
  }

  // Get performance metrics for monitoring
  getPerformanceMetrics(): { [key: string]: { avg: number; min: number; max: number; count: number } } {
    const metrics: { [key: string]: { avg: number; min: number; max: number; count: number } } = {};
    
    for (const [endpoint, durations] of Object.entries(this.performanceMetrics)) {
      if (durations.length > 0) {
        const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const min = Math.min(...durations);
        const max = Math.max(...durations);
        
        metrics[endpoint] = {
          avg: Math.round(avg),
          min: Math.round(min),
          max: Math.round(max),
          count: durations.length,
        };
      }
    }
    
    return metrics;
  }

  // Clear performance metrics
  clearMetrics(): void {
    this.performanceMetrics = {};
    console.log('📊 Performance metrics cleared');
  }

  // Health check for the interceptor
  async healthCheck(): Promise<{ status: string; metrics: any }> {
    try {
      const authHealth = await optimizedAuthService.healthCheck();
      const metrics = this.getPerformanceMetrics();
      
      return {
        status: authHealth.status,
        metrics: {
          auth_response_time: authHealth.response_time,
          api_performance: metrics,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        metrics: {
          error: error instanceof Error ? error.message : 'Health check failed',
        },
      };
    }
  }
}

// Create singleton instance
export const optimizedApiInterceptor = new OptimizedApiInterceptor();

// Convenience function for making API requests
export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string; success: boolean }> {
  const response = await optimizedApiInterceptor.intercept({ url, options });
  
  return {
    data: response.data,
    error: response.error,
    success: response.success,
  };
}

// Enhanced fetch wrapper with automatic retries
export async function enhancedFetch<T = any>(
  url: string,
  options?: RequestInit & { retries?: number; retryDelay?: number }
): Promise<{ data?: T; error?: string; success: boolean }> {
  const { retries = 1, retryDelay = 1000, ...fetchOptions } = options || {};
  
  let lastError: string | undefined;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await optimizedApiInterceptor.intercept({ url, options: fetchOptions });
    
    if (response.success) {
      return {
        data: response.data,
        success: true,
      };
    }
    
    lastError = response.error;
    
    // Don't retry on auth errors or client errors (4xx)
    if (response.status && response.status >= 400 && response.status < 500) {
      break;
    }
    
    // Wait before retrying (except on last attempt)
    if (attempt < retries) {
      console.log(`⏳ Retrying request to ${url} in ${retryDelay}ms (attempt ${attempt + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  return {
    error: lastError || 'Request failed after retries',
    success: false,
  };
}

export default optimizedApiInterceptor;
