/**
 * API Interceptor for automatic token refresh on 401 errors
 * This module provides a wrapper around fetch that automatically handles token expiration
 */

import { tokenStore } from './token';
import { API_ENDPOINTS } from '@/config/api';

interface FetchOptions extends RequestInit {
  skipInterceptor?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * Subscribe to token refresh events
 */
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

/**
 * Notify all subscribers when token is refreshed
 */
const notifyTokenRefresh = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

/**
 * Attempt to refresh the access token using the refresh token
 */
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = tokenStore.getRefreshToken();
    
    if (!refreshToken) {
      console.warn('No refresh token available');
      return null;
    }

    const response = await fetch(`${API_ENDPOINTS.AUTH.BASE}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      skipInterceptor: true, // Prevent infinite loop
    } as FetchOptions);

    if (!response.ok) {
      console.error('Token refresh failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.success && data.data) {
      const { access_token, refresh_token: newRefreshToken } = data.data;
      
      // Update tokens
      const currentUserId = localStorage.getItem('userId');
      tokenStore.setTokens(access_token, newRefreshToken, currentUserId);
      
      return access_token;
    }

    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

/**
 * Intercepted fetch function that handles 401 errors with automatic token refresh
 */
export const interceptedFetch = async (
  url: string,
  options?: FetchOptions
): Promise<Response> => {
  // Skip interceptor if explicitly requested
  if (options?.skipInterceptor) {
    return fetch(url, options);
  }

  try {
    // Add auth token to request if available
    const token = tokenStore.getAccessToken();
    const headers = new Headers(options?.headers || {});
    
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      // Prevent multiple simultaneous refresh attempts
      if (!isRefreshing) {
        isRefreshing = true;
        
        const newToken = await refreshAccessToken();
        
        isRefreshing = false;
        
        if (newToken) {
          // Notify subscribers of new token
          notifyTokenRefresh(newToken);
          
          // Retry the original request with new token
          const retryHeaders = new Headers(options?.headers || {});
          retryHeaders.set('Authorization', `Bearer ${newToken}`);
          
          if (!retryHeaders.has('Content-Type')) {
            retryHeaders.set('Content-Type', 'application/json');
          }

          response = await fetch(url, {
            ...options,
            headers: retryHeaders,
          });
        } else {
          // Token refresh failed - force logout
          handleTokenRefreshFailure();
        }
      } else {
        // Wait for ongoing refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            const retryHeaders = new Headers(options?.headers || {});
            retryHeaders.set('Authorization', `Bearer ${newToken}`);
            
            if (!retryHeaders.has('Content-Type')) {
              retryHeaders.set('Content-Type', 'application/json');
            }

            resolve(
              fetch(url, {
                ...options,
                headers: retryHeaders,
              })
            );
          });
        });
      }
    }

    return response;
  } catch (error) {
    console.error('Fetch interceptor error:', error);
    throw error;
  }
};

/**
 * Handle token refresh failure - force logout
 */
const handleTokenRefreshFailure = () => {
  // Clear tokens
  tokenStore.clear();
  
  // Redirect to login
  if (typeof window !== 'undefined') {
    // Clear all user data
    try {
      localStorage.removeItem('user_data');
      localStorage.removeItem('userId');
      localStorage.removeItem('at');
      localStorage.removeItem('rt');
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    
    // Redirect to login page
    window.location.href = '/auth/login?session_expired=true';
  }
};

/**
 * Initialize the fetch interceptor globally
 * Call this in your app initialization
 */
export const initializeFetchInterceptor = () => {
  if (typeof window !== 'undefined') {
    // Store original fetch
    const originalFetch = window.fetch;
    
    // Override global fetch
    window.fetch = ((url: string, options?: FetchOptions) => {
      return interceptedFetch(url, options);
    }) as typeof fetch;
    
    console.log('✓ Fetch interceptor initialized for automatic token refresh');
  }
};

export default {
  interceptedFetch,
  initializeFetchInterceptor,
};
