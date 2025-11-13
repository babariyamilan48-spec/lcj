import axios from 'axios';
import { tokenStore } from './token';
import { getApiBaseUrl } from '../config/api';

// Use dynamic API base URL
const getApiUrl = () => getApiBaseUrl();

// Create axios instance with dynamic config
const createApiInstance = () => {
  return axios.create({
    baseURL: getApiUrl(),
    timeout: 120000, // 2 minute timeout for AI processing and other long operations
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Create initial instance
let api = createApiInstance();

// Function to recreate API instance with new base URL
export const updateApiBaseUrl = (newUrl: string) => {
  api = axios.create({
    baseURL: newUrl,
    timeout: 120000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  // Re-apply interceptors
  setupInterceptors();
};

// Setup interceptors function
const setupInterceptors = () => {

  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      // Add auth token if available
      const token = tokenStore.getAccessToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      
      // API Optimization - Redirect to optimized endpoints
      const url = config.url || '';
      const method = (config.method || 'GET').toUpperCase();
      
      // Debug: Log the URL being processed
      console.log(`🔍 Axios Request Intercepted: ${method}:${url}`);
      
      // Check if optimized endpoints should be used
      const useOptimized = process.env.NEXT_PUBLIC_USE_OPTIMIZED === 'true' || 
                          process.env.NODE_ENV === 'production' ||
                          true; // Default to optimized
      
      if (useOptimized && url.includes('/api/v1/') && !url.includes('/optimized/')) {
        // Endpoint redirects mapping
        const ENDPOINT_REDIRECTS: Record<string, string> = {
          'POST:/api/v1/auth_service/auth/login': '/api/v1/auth_service/optimized/auth/login/fast',
          'GET:/api/v1/auth_service/auth/me': '/api/v1/auth_service/optimized/auth/me/fast',
          'POST:/api/v1/results_service/results': '/api/v1/results_service/optimized/results/fast',
          'GET:/api/v1/question_service/questions/': '/api/v1/question_service/optimized/questions/',
          'GET:/api/v1/question_service/tests/': '/api/v1/question_service/optimized/tests/',
          'POST:/api/v1/question_service/questions': '/api/v1/question_service/optimized/questions/fast',
          'POST:/api/v1/question_service/test-results/calculate-and-save': '/api/v1/question_service/test-results/calculate-and-save/fast',
          'GET:/api/v1/results_service/completion-status/': '/api/v1/results_service/completion-status/',
        };
        
        const methodUrl = `${method}:${url}`;
        
        // Check for exact matches
        for (const [pattern, replacement] of Object.entries(ENDPOINT_REDIRECTS)) {
          const [patternMethod, patternUrl] = pattern.split(':');
          
          if (method === patternMethod && url.includes(patternUrl)) {
            const newUrl = url.replace(patternUrl, replacement);
            console.log(`🚀 API OPTIMIZATION: ${method} ${patternUrl} → ${replacement}`);
            console.log(`   Original: ${url}`);
            console.log(`   Optimized: ${newUrl}`);
            
            config.url = newUrl;
            if (config.headers) {
              config.headers['X-Optimized-Request'] = 'true';
              config.headers['X-Performance-Tracking'] = 'enabled';
            }
            break;
          }
        }
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

// Track ongoing refresh requests to prevent multiple simultaneous refreshes
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

  // Response interceptor with enhanced token refresh
  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const original = error.config || {};
      const url: string = original?.url || '';
      
      // Skip auth redirects for auth endpoints themselves
      const isAuthEndpoint = /\/api\/v1\/auth_service\/auth\/(login|signup|verify-email|forgot-password|reset-password|google|token\/refresh)/.test(url);
      
      // Handle 401 errors (token expired)
      if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          }).catch((err) => {
            return Promise.reject(err);
          });
        }

        original._retry = true;
        isRefreshing = true;

        try {
          const rt = tokenStore.getRefreshToken();
          if (!rt) {
            throw new Error('No refresh token available');
          }

          // Use the correct auth service endpoint
          const res = await api.post('/api/v1/auth_service/auth/token/refresh', { 
            refresh_token: rt 
          });

          const responseData = res.data;
          let access_token, refresh_token;

          // Handle different response formats
          if (responseData?.data?.token) {
            // Format: { success: true, data: { token: { access_token, refresh_token } } }
            access_token = responseData.data.token.access_token;
            refresh_token = responseData.data.token.refresh_token;
          } else if (responseData?.data) {
            // Format: { success: true, data: { access_token, refresh_token } }
            access_token = responseData.data.access_token;
            refresh_token = responseData.data.refresh_token;
          } else if (responseData?.access_token) {
            // Format: { access_token, refresh_token }
            access_token = responseData.access_token;
            refresh_token = responseData.refresh_token;
          }

          if (access_token) {
            // Update tokens
            tokenStore.setTokens(access_token, refresh_token || rt);
            
            // Update the original request with new token
            original.headers.Authorization = `Bearer ${access_token}`;
            
            // Process queued requests
            processQueue(null, access_token);

            // Retry the original request
            return api(original);
          } else {
            throw new Error('Invalid refresh response format');
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          
          // Process queued requests with error
          processQueue(refreshError, null);
          
          // Clear tokens and redirect to login
          tokenStore.clear();
          
          // Avoid redirect loops for auth endpoints
          if (!isAuthEndpoint && typeof window !== 'undefined') {
            
            window.location.href = '/auth/login';
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      
      return Promise.reject(error);
    }
  );
};

// Initialize interceptors
setupInterceptors();

// API endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/api/v1/auth/login', credentials),
  
  signup: (userData: { email: string; password: string; username?: string }) =>
    api.post('/api/v1/auth/signup', userData),

  requestEmailOTP: (data: { email: string }) =>
    api.post('/api/v1/auth/verify-email/request', data),

  confirmEmailOTP: (data: { email: string; otp: string }) =>
    api.post('/api/v1/auth/verify-email/confirm', data),

  forgotPassword: (data: { email: string }) =>
    api.post('/api/v1/auth/forgot-password', data),

  resetPassword: (data: { email: string; otp: string; new_password: string }) =>
    api.post('/api/v1/auth/reset-password', data),

  me: () => api.get('/api/v1/auth/me'),

  updateProfile: (data: { username?: string; avatar?: string }) =>
    api.post('/api/v1/auth/profile', null, { params: data }),

  changePassword: (data: { old_password: string; new_password: string }) =>
    api.post('/api/v1/auth/change-password', data),

  logout: (payload?: { refresh_token?: string }) =>
    api.post('/api/v1/auth/logout', payload || {}),

  googleLogin: (id_token: string) =>
    api.post('/api/v1/auth/google', { id_token }),

  deleteAccount: () => api.delete('/api/v1/auth/delete-account'),
  
  refreshToken: (refreshToken: string) =>
    api.post('/api/v1/auth/token/refresh', { refresh_token: refreshToken }),
};

export const userAPI = {
  getProfile: () => api.get('/api/v1/users/profile'),
  
  updateProfile: (data: any) => api.put('/api/v1/users/profile', data),
  
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/api/v1/users/change-password', data),
};

export const testAPI = {
  getTests: () => api.get('/api/v1/tests'),
  
  getTest: (id: string) => api.get(`/api/v1/tests/${id}`),
  
  submitTest: (testId: string, answers: any) =>
    api.post(`/api/v1/tests/${testId}/submit`, { answers }),
  
  getTestResults: (testId: string) => api.get(`/api/v1/tests/${testId}/results`),
};

export const reportAPI = {
  generateReport: (testId: string) => api.post(`/api/v1/reports/${testId}`),
  
  getReport: (reportId: string) => api.get(`/api/v1/reports/${reportId}`),
  
  downloadReport: (reportId: string) => api.get(`/api/v1/reports/${reportId}/download`),
};

export default api;
