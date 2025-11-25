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
  avatar?: string;
  is_verified: boolean;
  providers: string[];
  role: string;
}

export interface AuthResponse extends User {
  token: TokenPair;
}

async function jsonFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || data?.error || 'Request failed');
  }
  return data.data as T;
}

class AuthService {
  private getBaseUrl(): string {
    return getApiEndpoints().AUTH.BASE;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const token = tokenStore.getAccessToken();
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(token || undefined),
          ...options?.headers,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data?.detail || data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      // Handle API responses with success field
      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        const errorMessage = data.error || data.message || data.detail || 'Authentication request failed';
        console.warn('Auth API returned success=false:', errorMessage);
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
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
    const endpoints = getApiEndpoints();
    const response = await this.request<AuthResponse>(endpoints.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    if (response.data?.token) {
      tokenStore.setTokens(response.data.token.access_token, response.data.token.refresh_token);
    }
    
    return response.data!;
  }

  async signup(payload: SignupPayload): Promise<User> {
    const endpoints = getApiEndpoints();
    const response = await this.request<User>(endpoints.AUTH.SIGNUP, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    return response.data!;
  }

  async logout(refreshToken?: string): Promise<void> {
    const endpoints = getApiEndpoints();
    try {
      await this.request(endpoints.AUTH.LOGOUT, {
        method: 'POST',
        body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
      });
    } finally {
      // CRITICAL FIX: Use comprehensive clearAllUserData instead of just tokenStore.clear()
      try {
        const { clearAllUserData } = require('@/utils/clearUserData');
        clearAllUserData();
      } catch (error) {
        // Fallback if import fails
        console.warn('⚠️ Could not import clearAllUserData, using fallback cleanup:', error);
        tokenStore.clear();
      }
    }
  }

  async refreshToken(): Promise<TokenPair> {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const endpoints = getApiEndpoints();
    const response = await this.request<{ token: TokenPair }>(endpoints.AUTH.REFRESH_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (response.data?.token) {
      tokenStore.setTokens(response.data.token.access_token, response.data.token.refresh_token);
    }

    return response.data!.token;
  }

  async forgotPassword(email: string): Promise<void> {
    const endpoints = getApiEndpoints();
    await this.request(endpoints.AUTH.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email: string, otp: string, new_password: string): Promise<void> {
    const endpoints = getApiEndpoints();
    await this.request(endpoints.AUTH.RESET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email, otp, new_password }),
    });
  }

  async requestVerifyEmail(email: string): Promise<void> {
    const endpoints = getApiEndpoints();
    await this.request(endpoints.AUTH.VERIFY_EMAIL_REQUEST, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async confirmVerifyEmail(email: string, otp: string): Promise<void> {
    const endpoints = getApiEndpoints();
    await this.request(endpoints.AUTH.VERIFY_EMAIL_CONFIRM, {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const endpoints = getApiEndpoints();
    await this.request(endpoints.AUTH.CHANGE_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  }

  async getCurrentUser(): Promise<User> {
    const endpoints = getApiEndpoints();
    const response = await this.request<User>(endpoints.AUTH.ME);
    return response.data!;
  }

  async updateProfile(username?: string, avatar?: string): Promise<User> {
    const endpoints = getApiEndpoints();
    const response = await this.request<User>(endpoints.AUTH.PROFILE, {
      method: 'POST',
      body: JSON.stringify({ username, avatar }),
    });
    return response.data!;
  }

  async googleLogin(idToken: string): Promise<AuthResponse> {
    const endpoints = getApiEndpoints();
    const response = await this.request<AuthResponse>(endpoints.AUTH.GOOGLE_LOGIN, {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken }),
    });
    
    if (response.data?.token) {
      tokenStore.setTokens(response.data.token.access_token, response.data.token.refresh_token);
    }
    
    return response.data!;
  }

  async deleteAccount(): Promise<void> {
    const endpoints = getApiEndpoints();
    try {
      await this.request(endpoints.AUTH.DELETE_ACCOUNT, {
        method: 'DELETE',
      });
    } finally {
      tokenStore.clear();
    }
  }

  isAuthenticated(): boolean {
    return !!tokenStore.getAccessToken();
  }

  getToken(): string | null {
    return tokenStore.getAccessToken();
  }
}

export const authService = new AuthService();

