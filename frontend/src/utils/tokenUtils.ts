/**
 * Token utility functions for handling JWT tokens
 */

import { tokenStore } from '../services/token';

/**
 * Decode JWT token payload without verification
 */
export const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = decodeJWT(token);
    if (!payload || !payload.exp) {
      return true;
    }
    
    // Check if token expires within the next 5 minutes (300 seconds)
    const currentTime = Math.floor(Date.now() / 1000);
    const bufferTime = 300; // 5 minutes buffer
    
    return payload.exp < (currentTime + bufferTime);
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Check if current access token is expired
 */
export const isCurrentTokenExpired = (): boolean => {
  const token = tokenStore.getAccessToken();
  if (!token) {
    return true;
  }
  return isTokenExpired(token);
};

/**
 * Get token expiration time
 */
export const getTokenExpirationTime = (token: string): Date | null => {
  try {
    const payload = decodeJWT(token);
    if (!payload || !payload.exp) {
      return null;
    }
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};

/**
 * Get time until token expires (in seconds)
 */
export const getTimeUntilExpiry = (token: string): number => {
  try {
    const payload = decodeJWT(token);
    if (!payload || !payload.exp) {
      return 0;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - currentTime);
  } catch (error) {
    console.error('Error calculating time until expiry:', error);
    return 0;
  }
};

/**
 * Setup automatic token refresh before expiration
 */
export const setupTokenRefreshTimer = (onRefreshNeeded: () => void): (() => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  const scheduleRefresh = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const token = tokenStore.getAccessToken();
    if (!token) {
      return;
    }
    
    const timeUntilExpiry = getTimeUntilExpiry(token);
    // Refresh 5 minutes before expiry
    const refreshTime = Math.max(0, (timeUntilExpiry - 300) * 1000);
    
    if (refreshTime > 0) {
      timeoutId = setTimeout(() => {
        onRefreshNeeded();
        scheduleRefresh(); // Schedule next refresh
      }, refreshTime);
    }
  };
  
  // Initial schedule
  scheduleRefresh();
  
  // Return cleanup function
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
};
