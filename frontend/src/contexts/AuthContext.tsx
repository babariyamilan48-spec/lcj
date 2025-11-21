'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { tokenStore } from '@/services/token';
import { questionService } from '@/services/questionService';
import { API_ENDPOINTS } from '@/config/api';
import { clearAllUserData, shouldPreventAutoLogin, validateUserSession, forceSessionClear } from '@/utils/clearUserData';

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
  forceLogout: () => void;
  refreshToken: () => Promise<boolean>;
  setAuthToken: (token: string | null) => void;
  refreshAuthState: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to clear all cookies
const clearAllCookies = () => {
  if (typeof document !== 'undefined') {
    // Clear all cookies by setting them to expire
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      if (name) {
        // Clear cookie for current domain with multiple path variations
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
        
        // Also try with SameSite attribute
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
      }
    }
  }
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!tokenStore.getAccessToken();
  

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        
        // Check if we should prevent auto-login
        if (shouldPreventAutoLogin()) {
          forceSessionClear();
          clearAllCookies();
          setIsLoading(false);
          return;
        }
        
        // CRITICAL FIX: Validate session integrity before proceeding
        if (!validateUserSession()) {
          forceSessionClear();
          clearAllCookies();
          setIsLoading(false);
          return;
        }
        
        // Skip auto-auth initialization if user is already set (from login)
        if (user) {
          setIsLoading(false);
          return;
        }
        
        const token = tokenStore.getAccessToken();
        
        if (token) {
          // CRITICAL FIX: Try to restore from cached user data first
          const cachedUserData = localStorage.getItem('user_data');
          const cachedUserId = localStorage.getItem('userId');
          
          if (cachedUserData && cachedUserId) {
            try {
              const userData = JSON.parse(cachedUserData);
              if (userData.id === cachedUserId) {
                setUser(userData);
                questionService.setAuthToken(token);
                
                // Validate token in background (non-blocking)
                validateTokenInBackground(token, userData);
                return;
              }
            } catch (error) {
            }
          }
          
          // If no cached data or validation failed, validate with server
          try {
            // Fetch real user data from /me endpoint to validate token
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

                // CRITICAL FIX: Check if this is a different user than cached
                if (cachedUserId && cachedUserId !== userData.id) {
                  clearAllUserData();
                  clearAllCookies();
                  tokenStore.clear();
                  setIsLoading(false);
                  return;
                }

                setUser(userData);
                localStorage.setItem('user_data', JSON.stringify(userData));
                localStorage.setItem('userId', userData.id);
                
                // Set the token in services after successful validation
                questionService.setAuthToken(token);
              } else {
                throw new Error('Invalid user data received');
              }
            } else if (response.status === 401) {
              // Token is invalid, try to refresh
              const refreshed = await refreshToken();
              if (!refreshed) {
                forceLogout();
                return;
              }
            } else {
              throw new Error('Failed to fetch user data');
            }
          } catch (error) {
            
            // CRITICAL FIX: Don't immediately logout on network errors
            // If we have cached user data, use it temporarily
            if (cachedUserData && cachedUserId) {
              try {
                const userData = JSON.parse(cachedUserData);
                if (userData.id === cachedUserId) {
                  setUser(userData);
                  questionService.setAuthToken(token);
                  return;
                }
              } catch (cacheError) {
              }
            }
            
            // Only logout if we have no valid cached data
            forceLogout();
            return;
          }
        } else {
          // No token found, ensure clean state
          clearAllUserData();
          clearAllCookies();
        }
      } catch (error) {
        forceLogout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: User }> => {
    console.log('🔐 [AUTH] Login started for:', email);
    try {
      // Don't set loading on login attempt to prevent page refresh
      // setIsLoading(true);

      // CRITICAL FIX: Clear ALL previous user data before login
      console.log('🔐 [AUTH] Clearing previous user data...');
      clearAllUserData();
      clearAllCookies();
      tokenStore.clear();
      questionService.setAuthToken(null);
      setUser(null);

      // Call your auth service login endpoint
      console.log('🔐 [AUTH] Making login request to:', `${API_ENDPOINTS.AUTH.BASE}${API_ENDPOINTS.AUTH.LOGIN}`);
      const response = await fetch(`${API_ENDPOINTS.AUTH.BASE}${API_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('🔐 [AUTH] Response status:', response.status);
      const data = await response.json();
      console.log('🔐 [AUTH] Response data:', data);

      if (response.ok && data.success && data.data) {
        console.log('✅ [AUTH] Login successful!');
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

        // Store tokens AFTER user data validation with user ID tracking
        console.log('🔐 [AUTH] Storing tokens and user data...');
        tokenStore.setTokens(access_token, refresh_token, userData.id);
        
        // Set token in question service
        questionService.setAuthToken(access_token);
        
        // Set user data and store in localStorage
        setUser(userData);
        localStorage.setItem('user_data', JSON.stringify(userData));
        localStorage.setItem('userId', userData.id);
        
        // Only set loading to false on success
        setIsLoading(false);

        console.log('✅ [AUTH] Login completed successfully');
        return { success: true, user: userData };
      } else {
        // Handle error case - throw error with the message from backend
        console.error('❌ [AUTH] Login failed - response not ok or no data');
        throw new Error(data.detail || data.message || data.error || 'Login failed');
      }
    } catch (error) {
      console.error('❌ [AUTH] Login error:', error);
      // Ensure clean state on login failure
      clearAllUserData();
      clearAllCookies();
      tokenStore.clear();
      questionService.setAuthToken(null);
      setUser(null);
      // Don't set loading on error to prevent page refresh
      // setIsLoading(false);
      // Re-throw the error so the login page can display the specific message
      throw error;
    }
  };

  const logout = () => {
    forceLogout();
  };
  
  // CRITICAL FIX: Add background token validation
  const validateTokenInBackground = async (token: string, userData: User) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.AUTH.BASE}${API_ENDPOINTS.AUTH.ME}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        // Could try to refresh token here if needed
      } else {
      }
    } catch (error) {
    }
  };

  const forceLogout = () => {
    
    // Clear auth state
    tokenStore.clear();
    questionService.setAuthToken(null);
    setUser(null);
    
    // CRITICAL FIX: Clear ALL user-related data including cookies
    clearAllUserData();
    clearAllCookies();
    
    // Clear any login flags
    sessionStorage.removeItem('logging_in');

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

        // Update tokens with current user ID
        const currentUserId = localStorage.getItem('userId');
        tokenStore.setTokens(access_token, newRefreshToken, currentUserId);
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

  const refreshAuthState = async () => {
    try {
      console.log('🔐 [AUTH] refreshAuthState called');
      const token = tokenStore.getAccessToken();
      console.log('🔐 [AUTH] Token from store:', token ? 'exists' : 'missing');
      
      if (!token) {
        console.log('🔐 [AUTH] No token found, setting user to null');
        setUser(null);
        return;
      }

      // Fetch user data from /me endpoint
      console.log('🔐 [AUTH] Fetching user data from /me endpoint');
      const response = await fetch(`${API_ENDPOINTS.AUTH.BASE}${API_ENDPOINTS.AUTH.ME}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔐 [AUTH] /me response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔐 [AUTH] /me response data:', data);
        
        // Handle both wrapped (data.success && data.data) and direct response formats
        const userDataSource = (data.success && data.data) ? data.data : data;
        
        if (userDataSource && userDataSource.id) {
          const userData: User = {
            id: userDataSource.id || '',
            email: userDataSource.email || '',
            name: userDataSource.username || userDataSource.email?.split('@')[0] || 'User',
            username: userDataSource.username || '',
            firstName: userDataSource.firstName || '',
            lastName: userDataSource.lastName || '',
            isVerified: userDataSource.is_verified || false,
            role: userDataSource.role || 'user',
            avatar: userDataSource.avatar || ''
          };

          console.log('🔐 [AUTH] Setting user to:', userData);
          setUser(userData);
          localStorage.setItem('user_data', JSON.stringify(userData));
          localStorage.setItem('userId', userData.id);
          questionService.setAuthToken(token);
          console.log('✅ [AUTH] Auth state refreshed successfully');
        } else {
          console.error('🔐 [AUTH] Invalid response data - no id found:', data);
        }
      } else if (response.status === 401) {
        console.log('🔐 [AUTH] Token invalid (401), attempting refresh');
        // Token invalid, try to refresh
        const refreshed = await refreshToken();
        if (!refreshed) {
          forceLogout();
        }
      } else {
        console.error('🔐 [AUTH] /me endpoint returned:', response.status);
      }
    } catch (error) {
      console.error('❌ [AUTH] Error refreshing auth state:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    forceLogout,
    refreshToken,
    setAuthToken,
    refreshAuthState,
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
