'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { optimizedAuthService, User } from '@/services/optimizedAuthService';
import { tokenStore } from '@/services/token';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  forceLogout: () => void;
  refreshToken: () => Promise<boolean>;
  getCurrentUser: () => Promise<User | null>;
  healthCheck: () => Promise<{ status: string; response_time: number }>;
}

const OptimizedAuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function OptimizedAuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    console.log('🔄 Initializing optimized authentication...');
    setIsLoading(true);

    try {
      // Check if we have valid tokens
      const hasValidSession = tokenStore.validateSession();
      
      if (!hasValidSession) {
        console.log('❌ No valid session found');
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      // Try to get current user (uses cache-first approach)
      const currentUser = await optimizedAuthService.getCurrentUser();
      
      if (currentUser) {
        console.log('✅ User authenticated:', currentUser.email);
        setUser(currentUser);
        setIsAuthenticated(true);
        
        // Store user ID for session tracking
        if (typeof window !== 'undefined') {
          localStorage.setItem('userId', currentUser.id);
        }
      } else {
        console.log('❌ Failed to get current user');
        handleAuthFailure();
      }
    } catch (error) {
      console.warn('⚠️ Auth initialization failed, checking cache:', error);
      
      // Fallback to cached user data
      const cachedUser = getCachedUser();
      if (cachedUser && tokenStore.getAccessToken()) {
        console.log('📱 Using cached user data as fallback');
        setUser(cachedUser);
        setIsAuthenticated(true);
        
        // Validate token in background (non-blocking)
        validateTokenInBackground();
      } else {
        console.log('❌ No valid cache, user not authenticated');
        handleAuthFailure();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateTokenInBackground = async () => {
    try {
      console.log('🔍 Validating token in background...');
      const currentUser = await optimizedAuthService.getCurrentUser();
      
      if (currentUser) {
        console.log('✅ Background token validation successful');
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        console.log('❌ Background token validation failed');
        handleAuthFailure();
      }
    } catch (error) {
      console.warn('⚠️ Background token validation failed:', error);
      // Don't logout on background validation failure
      // The user can continue with cached data
    }
  };

  const getCachedUser = (): User | null => {
    try {
      if (typeof window !== 'undefined') {
        const cachedUserData = localStorage.getItem('user_data');
        return cachedUserData ? JSON.parse(cachedUserData) : null;
      }
    } catch (error) {
      console.warn('Failed to get cached user:', error);
    }
    return null;
  };

  const handleAuthFailure = () => {
    setUser(null);
    setIsAuthenticated(false);
    tokenStore.clear();
    optimizedAuthService.clearCache();
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    console.log('🔐 Starting optimized login for:', email);
    setIsLoading(true);

    try {
      // Clear any existing session data first
      tokenStore.clear();
      optimizedAuthService.clearCache();

      const authResponse = await optimizedAuthService.login({ email, password });
      
      console.log('✅ Login successful:', authResponse.email);
      setUser(authResponse);
      setIsAuthenticated(true);
      
      // Store user ID for session tracking
      if (typeof window !== 'undefined') {
        localStorage.setItem('userId', authResponse.id);
      }

      return { success: true, user: authResponse };
    } catch (error) {
      console.error('❌ Login failed:', error);
      handleAuthFailure();
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    console.log('🚪 Starting optimized logout...');
    setIsLoading(true);

    try {
      const refreshToken = tokenStore.getRefreshToken();
      await optimizedAuthService.logout(refreshToken || undefined);
      console.log('✅ Logout successful');
    } catch (error) {
      console.warn('⚠️ Logout request failed:', error);
    } finally {
      handleAuthFailure();
      setIsLoading(false);
    }
  };

  const forceLogout = () => {
    console.log('🔒 Force logout initiated');
    handleAuthFailure();
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      console.log('🔄 Refreshing token...');
      await optimizedAuthService.refreshToken();
      console.log('✅ Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      handleAuthFailure();
      return false;
    }
  };

  const getCurrentUser = async (): Promise<User | null> => {
    try {
      const currentUser = await optimizedAuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      }
      return currentUser;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  };

  const healthCheck = async (): Promise<{ status: string; response_time: number }> => {
    return await optimizedAuthService.healthCheck();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    forceLogout,
    refreshToken,
    getCurrentUser,
    healthCheck,
  };

  return (
    <OptimizedAuthContext.Provider value={value}>
      {children}
    </OptimizedAuthContext.Provider>
  );
}

export function useOptimizedAuth() {
  const context = useContext(OptimizedAuthContext);
  if (context === undefined) {
    throw new Error('useOptimizedAuth must be used within an OptimizedAuthProvider');
  }
  return context;
}

// Export both for gradual migration
export { AuthContext } from './AuthContext'; // Legacy context
export default OptimizedAuthContext;
