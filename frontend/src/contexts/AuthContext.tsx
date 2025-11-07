'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { tokenStore } from '@/services/token';
import { questionService } from '@/services/questionService';
import { API_ENDPOINTS } from '@/config/api';

interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  setAuthToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!tokenStore.getAccessToken();

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = tokenStore.getAccessToken();
        if (token) {
          // Set the token in the question service
          questionService.setAuthToken(token);

          // Try to fetch user info to validate token
          try {
            // Fetch real user data from /me endpoint
            const response = await fetch(`${API_ENDPOINTS.AUTH.BASE}${API_ENDPOINTS.AUTH.ME}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data) {
                const userData: User = {
                  id: data.data.id || '',
                  email: data.data.email || '',
                  name: data.data.username || data.data.email?.split('@')[0] || 'User',
                  username: data.data.username || '',
                  firstName: data.data.firstName || '',
                  lastName: data.data.lastName || '',
                  isVerified: data.data.is_verified || false,
                  role: data.data.role || 'user',
                  avatar: data.data.avatar || ''
                };

                setUser(userData);
                localStorage.setItem('user_data', JSON.stringify(userData));
                localStorage.setItem('userId', userData.id);
              } else {
                throw new Error('Invalid user data received');
              }
            } else {
              throw new Error('Failed to fetch user data');
            }
          } catch (error) {
            // Token might be invalid, try to refresh
            const refreshed = await refreshToken();
            if (!refreshed) {
              logout();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: User }> => {
    try {
      setIsLoading(true);

      // Call your auth service login endpoint
      const response = await fetch(`${API_ENDPOINTS.AUTH.BASE}${API_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.data) {
        const responseData = data.data;

        // Extract tokens from the token object
        const tokenData = responseData.token;
        if (!tokenData) {
          throw new Error('No token data received');
        }

        const { access_token, refresh_token } = tokenData;

        // Validate that we have the required data
        if (!access_token) {
          throw new Error('No access token received');
        }

        // Store tokens
        tokenStore.setTokens(access_token, refresh_token);

        // Set token in question service
        questionService.setAuthToken(access_token);

        // Create user object with comprehensive data
        const userData: User = {
          id: responseData.id || '',
          email: responseData.email || '',
          name: responseData.name || responseData.username || `${responseData.firstName || ''} ${responseData.lastName || ''}`.trim() || responseData.email || '',
          username: responseData.username || responseData.email?.split('@')[0] || '',
          firstName: responseData.firstName || responseData.first_name || '',
          lastName: responseData.lastName || responseData.last_name || '',
          isVerified: responseData.is_verified || responseData.isVerified || false,
          role: responseData.role || 'user',
          avatar: responseData.avatar || responseData.profilePicture || ''
        };

        // Set user data and store in localStorage
        setUser(userData);
        localStorage.setItem('user_data', JSON.stringify(userData));

        return { success: true, user: userData };
      } else {
        // Handle error case - throw error with the message from backend
        throw new Error(data.message || data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Re-throw the error so the login page can display the specific message
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    tokenStore.clear();
    questionService.setAuthToken(null);
    setUser(null);
    localStorage.removeItem('user_data');

    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = tokenStore.getRefreshToken();
      if (!refreshTokenValue) {
        return false;
      }

      const response = await fetch(`${API_ENDPOINTS.AUTH.BASE}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshTokenValue }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      if (data.success && data.data) {
        const { access_token, refresh_token: newRefreshToken } = data.data;

        // Update tokens
        tokenStore.setTokens(access_token, newRefreshToken);
        questionService.setAuthToken(access_token);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const setAuthToken = (token: string | null) => {
    if (token) {
      tokenStore.setTokens(token, tokenStore.getRefreshToken());
      questionService.setAuthToken(token);
    } else {
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
    setAuthToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
