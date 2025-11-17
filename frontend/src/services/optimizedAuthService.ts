/**
 * Optimized Auth Service with Session Management Integration
 * Uses the new session-managed auth endpoints for better performance
 */

import { getApiEndpoints, getAuthHeaders, ApiResponse } from '../config/api';
import { tokenStore } from './token';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  username?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  is_active: boolean;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface AuthResponse extends User {
  token: TokenPair;
}

class OptimizedAuthService {
  private getBaseUrl(): string {
    return getApiEndpoints().AUTH.BASE;
  }

  private async request<T>(
    endpoint: string, 
    options?: RequestInit,
    useOptimized: boolean = true
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const token = tokenStore.getAccessToken();
    
    const startTime = performance.now();
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(token || undefined),
          ...options?.headers,
        },
      });

      const data = await response.json();
      const duration = performance.now() - startTime;
      
      // Log performance for monitoring
      if (duration > 1000) {
        console.warn(`Slow auth request: ${endpoint} took ${duration.toFixed(2)}ms`);
      } else {
        console.debug(`Auth request: ${endpoint} completed in ${duration.toFixed(2)}ms`);
      }
      
      if (!response.ok) {
        const errorMessage = data?.detail || data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
        
        // Handle specific auth errors
        if (response.status === 401) {
          // Clear tokens on unauthorized
          tokenStore.clear();
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 404) {
          throw new Error('Account not found. Please check your email or sign up.');
        } else if (response.status === 403) {
          throw new Error('Account is inactive. Please contact support.');
        }
        
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`Auth request failed: ${endpoint} after ${duration.toFixed(2)}ms`, error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to authentication service');
      }
      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        throw new Error('Invalid response from authentication service');
      }
      // Re-throw other errors
      throw error;
    }
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    console.log('🔐 Starting optimized login...');
    const startTime = performance.now();
    
    try {
      const response = await this.request<LoginResponse>('/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      const duration = performance.now() - startTime;
      console.log(`✅ Login completed in ${duration.toFixed(2)}ms`);
      
      // Store tokens with user ID tracking
      if (response.access_token && response.refresh_token) {
        tokenStore.setTokens(
          response.access_token, 
          response.refresh_token,
          response.user.id // Track user ID for session isolation
        );
        
        // Store user data for cache-first authentication
        localStorage.setItem('user_data', JSON.stringify(response.user));
        localStorage.setItem('last_login', new Date().toISOString());
      }
      
      // Convert to expected format
      return {
        ...response.user,
        token: {
          access_token: response.access_token,
          refresh_token: response.refresh_token
        }
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`❌ Login failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    console.log('👤 Getting current user...');
    const startTime = performance.now();
    
    try {
      // Try cache first for better performance
      const cachedUser = localStorage.getItem('user_data');
      const lastLogin = localStorage.getItem('last_login');
      
      // Use cached data if recent (within 5 minutes)
      if (cachedUser && lastLogin) {
        const cacheAge = Date.now() - new Date(lastLogin).getTime();
        if (cacheAge < 5 * 60 * 1000) { // 5 minutes
          console.log('📱 Using cached user data');
          return JSON.parse(cachedUser);
        }
      }
      
      // Fetch from server with optimized endpoint
      const response = await this.request<User>('/me');
      const duration = performance.now() - startTime;
      
      console.log(`✅ User data fetched in ${duration.toFixed(2)}ms`);
      
      // Update cache
      localStorage.setItem('user_data', JSON.stringify(response));
      localStorage.setItem('last_user_fetch', new Date().toISOString());
      
      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`❌ Get user failed after ${duration.toFixed(2)}ms:`, error);
      
      // Fallback to cached data on network error
      const cachedUser = localStorage.getItem('user_data');
      if (cachedUser) {
        console.log('📱 Falling back to cached user data due to error');
        return JSON.parse(cachedUser);
      }
      
      throw error;
    }
  }

  async logout(refreshToken?: string): Promise<void> {
    console.log('🚪 Starting optimized logout...');
    const startTime = performance.now();
    
    try {
      await this.request('/logout', {
        method: 'POST',
        body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
      });
      
      const duration = performance.now() - startTime;
      console.log(`✅ Logout completed in ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.warn('Logout request failed, clearing tokens anyway:', error);
    } finally {
      // Always clear local data
      tokenStore.clear();
      localStorage.removeItem('user_data');
      localStorage.removeItem('last_login');
      localStorage.removeItem('last_user_fetch');
    }
  }

  async refreshToken(): Promise<TokenPair> {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('🔄 Refreshing token...');
    const startTime = performance.now();

    try {
      const response = await this.request<{ access_token: string; refresh_token: string }>('/token/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const duration = performance.now() - startTime;
      console.log(`✅ Token refreshed in ${duration.toFixed(2)}ms`);

      if (response.access_token && response.refresh_token) {
        const userId = tokenStore.getUserId(); // Get current user ID
        tokenStore.setTokens(response.access_token, response.refresh_token, userId);
      }

      return {
        access_token: response.access_token,
        refresh_token: response.refresh_token
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`❌ Token refresh failed after ${duration.toFixed(2)}ms:`, error);
      
      // Clear tokens on refresh failure
      tokenStore.clear();
      throw error;
    }
  }

  async signup(payload: SignupPayload): Promise<User> {
    console.log('📝 Starting optimized signup...');
    const startTime = performance.now();
    
    try {
      const response = await this.request<User>('/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      const duration = performance.now() - startTime;
      console.log(`✅ Signup completed in ${duration.toFixed(2)}ms`);
      
      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`❌ Signup failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    await this.request('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email: string, otp: string, new_password: string): Promise<void> {
    await this.request('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, new_password }),
    });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.request('/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  }

  async updateProfile(username?: string, avatar?: string): Promise<User> {
    const response = await this.request<User>('/profile', {
      method: 'POST',
      body: JSON.stringify({ username, avatar }),
    });
    
    // Update cached user data
    localStorage.setItem('user_data', JSON.stringify(response));
    
    return response;
  }

  async deleteAccount(): Promise<void> {
    try {
      await this.request('/delete-account', {
        method: 'DELETE',
      });
    } finally {
      tokenStore.clear();
      localStorage.removeItem('user_data');
      localStorage.removeItem('last_login');
      localStorage.removeItem('last_user_fetch');
    }
  }

  isAuthenticated(): boolean {
    const token = tokenStore.getAccessToken();
    const cachedUser = localStorage.getItem('user_data');
    
    // Consider authenticated if we have both token and cached user data
    return !!(token && cachedUser);
  }

  getToken(): string | null {
    return tokenStore.getAccessToken();
  }

  // Health check for monitoring
  async healthCheck(): Promise<{ status: string; response_time: number }> {
    const startTime = performance.now();
    
    try {
      await this.request('/health');
      const duration = performance.now() - startTime;
      
      return {
        status: 'healthy',
        response_time: duration
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      return {
        status: 'unhealthy',
        response_time: duration
      };
    }
  }

  // Clear cached data (useful for debugging)
  clearCache(): void {
    localStorage.removeItem('user_data');
    localStorage.removeItem('last_login');
    localStorage.removeItem('last_user_fetch');
    console.log('🧹 Auth cache cleared');
  }

  // Get performance metrics
  getPerformanceMetrics(): { [key: string]: number } {
    const metrics = localStorage.getItem('auth_performance_metrics');
    return metrics ? JSON.parse(metrics) : {};
  }
}

export const optimizedAuthService = new OptimizedAuthService();

// Export both services for gradual migration
export { authService } from './authService'; // Legacy service
export default optimizedAuthService;
