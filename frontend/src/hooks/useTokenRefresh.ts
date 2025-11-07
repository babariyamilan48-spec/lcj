/**
 * Hook for monitoring token status and automatic refresh
 */

import { useState, useEffect, useCallback } from 'react';
import { tokenStore } from '../services/token';
import { isCurrentTokenExpired, getTimeUntilExpiry, setupTokenRefreshTimer } from '../utils/tokenUtils';

interface TokenStatus {
  isValid: boolean;
  isExpired: boolean;
  timeUntilExpiry: number;
  lastRefresh: Date | null;
}

export const useTokenRefresh = () => {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>({
    isValid: false,
    isExpired: true,
    timeUntilExpiry: 0,
    lastRefresh: null
  });

  const updateTokenStatus = useCallback(() => {
    const token = tokenStore.getAccessToken();
    if (!token) {
      setTokenStatus({
        isValid: false,
        isExpired: true,
        timeUntilExpiry: 0,
        lastRefresh: null
      });
      return;
    }

    const isExpired = isCurrentTokenExpired();
    const timeUntilExpiry = getTimeUntilExpiry(token);

    setTokenStatus(prev => ({
      isValid: !isExpired,
      isExpired,
      timeUntilExpiry,
      lastRefresh: prev.lastRefresh
    }));
  }, []);

  const handleRefreshNeeded = useCallback(() => {
    
    setTokenStatus(prev => ({
      ...prev,
      lastRefresh: new Date()
    }));
  }, []);

  useEffect(() => {
    // Initial status check
    updateTokenStatus();

    // Setup periodic status updates
    const statusInterval = setInterval(updateTokenStatus, 30000); // Check every 30 seconds

    // Setup automatic refresh timer
    const cleanupRefreshTimer = setupTokenRefreshTimer(handleRefreshNeeded);

    // Listen for token changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'at' || e.key === 'rt') {
        updateTokenStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(statusInterval);
      cleanupRefreshTimer();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [updateTokenStatus, handleRefreshNeeded]);

  return {
    tokenStatus,
    updateTokenStatus,
    // Helper functions
    isTokenValid: tokenStatus.isValid,
    isTokenExpired: tokenStatus.isExpired,
    timeUntilExpiry: tokenStatus.timeUntilExpiry,
    lastRefresh: tokenStatus.lastRefresh
  };
};
