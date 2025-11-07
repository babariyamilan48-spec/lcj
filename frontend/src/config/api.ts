// Dynamic API Configuration using Environment Manager
import { environmentManager, getApiUrl } from '../utils/environment';

// Export base URL getter
export const getApiBaseUrl = (): string => getApiUrl();

// Legacy export for backward compatibility
export const API_BASE_URL = getApiBaseUrl();

// Update API base URL function
export const updateApiBaseUrl = (newUrl: string): void => {
  environmentManager.updateApiUrl(newUrl);
};

// Dynamic Service endpoints
export const getApiEndpoints = () => {
  const baseUrl = getApiBaseUrl();
  
  return {
    // Auth Service
    AUTH: {
      BASE: `${baseUrl}/api/v1/auth_service/auth`,
      SIGNUP: '/signup',
      LOGIN: '/login',
      LOGOUT: '/logout',
      REFRESH_TOKEN: '/token/refresh',
      FORGOT_PASSWORD: '/forgot-password',
      RESET_PASSWORD: '/reset-password',
      VERIFY_EMAIL_REQUEST: '/verify-email/request',
      VERIFY_EMAIL_CONFIRM: '/verify-email/confirm',
      CHANGE_PASSWORD: '/change-password',
      GOOGLE_LOGIN: '/google',
      PROFILE: '/profile',
      ME: '/me',
      DELETE_ACCOUNT: '/delete-account'
    },
    
    // Question Service (Test Results)
    QUESTION: {
      BASE: `${baseUrl}/api/v1/question_service`,
      TEST_RESULTS: '/test-results',
      OVERVIEW: '/test-results/overview',
      ANALYTICS: '/test-results/analytics',
      CONFIGURATIONS: '/test-results/configurations'
    },
    
    // Results Service
    RESULTS: {
      BASE: `${baseUrl}/api/v1/results_service`,
      SUBMIT: '/results',
      USER_RESULTS: '/results',
      LATEST_RESULT: '/results/{user_id}/latest',
      PROFILE: '/profile',
      ANALYTICS: '/analytics',
      AI_INSIGHTS: '/ai-insights',
      DOWNLOAD_REPORT: '/download-report'
    },
    
    // Contact Service
    CONTACT: {
      BASE: `${baseUrl}/api/v1/contact_service`,
      SUBMIT: '/contact',
      LIST: '/contacts',
      GET: '/contacts',
      UPDATE_STATUS: '/contacts',
      DELETE: '/contacts',
      STATS: '/contact-stats'
    },
    
    // Admin Service
    ADMIN: {
      BASE: `${baseUrl}/api/v1/admin`,
      ANALYTICS: '/analytics',
      USERS: '/users',
      TESTS: '/tests',
      REPORTS: '/reports'
    }
  };
};

// Export static endpoints for backward compatibility
export const API_ENDPOINTS = getApiEndpoints();

// Request headers
export const getAuthHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` })
});

// Response wrapper type
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
