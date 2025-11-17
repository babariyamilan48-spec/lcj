'use client';

import React, { useState, useEffect } from 'react';
import { useOptimizedAuth } from '@/contexts/OptimizedAuthContext';
import { optimizedApiInterceptor } from '@/utils/optimizedApiInterceptor';
import { tokenStore } from '@/services/token';

export function AuthDebugPanel() {
  const { user, isAuthenticated, isLoading, healthCheck } = useOptimizedAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'development') {
      updateDebugInfo();
    }
  }, [user, isAuthenticated]);

  const updateDebugInfo = async () => {
    try {
      const authHealth = await healthCheck();
      const apiMetrics = optimizedApiInterceptor.getPerformanceMetrics();
      const tokenInfo = {
        hasAccessToken: !!tokenStore.getAccessToken(),
        hasRefreshToken: !!tokenStore.getRefreshToken(),
        userId: tokenStore.getUserId(),
        isValidSession: tokenStore.validateSession(),
      };

      setDebugInfo({
        authHealth,
        apiMetrics,
        tokenInfo,
        userInfo: {
          isAuthenticated,
          isLoading,
          userId: user?.id,
          email: user?.email,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update debug info:', error);
    }
  };

  const clearAllData = () => {
    tokenStore.clear();
    optimizedApiInterceptor.clearMetrics();
    localStorage.clear();
    sessionStorage.clear();
    console.log('🧹 All auth data cleared');
    updateDebugInfo();
  };

  const testAuthEndpoints = async () => {
    console.log('🧪 Testing auth endpoints...');
    
    try {
      const health = await healthCheck();
      console.log('Auth Health:', health);
      
      const metrics = optimizedApiInterceptor.getPerformanceMetrics();
      console.log('API Metrics:', metrics);
      
      updateDebugInfo();
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-2 rounded-md shadow-lg hover:bg-blue-700 transition-colors"
      >
        🔧 Auth Debug
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="absolute bottom-12 right-0 w-96 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Auth Debug Panel</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 text-sm">
            {/* User Info */}
            <div>
              <h4 className="font-medium text-gray-700 mb-1">User Status</h4>
              <div className="bg-gray-50 p-2 rounded">
                <div className="grid grid-cols-2 gap-1">
                  <span>Authenticated:</span>
                  <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                    {isAuthenticated ? '✅ Yes' : '❌ No'}
                  </span>
                  <span>Loading:</span>
                  <span className={isLoading ? 'text-yellow-600' : 'text-green-600'}>
                    {isLoading ? '⏳ Yes' : '✅ No'}
                  </span>
                  <span>User ID:</span>
                  <span className="font-mono text-xs">{user?.id || 'None'}</span>
                  <span>Email:</span>
                  <span>{user?.email || 'None'}</span>
                </div>
              </div>
            </div>

            {/* Token Info */}
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Token Status</h4>
              <div className="bg-gray-50 p-2 rounded">
                <div className="grid grid-cols-2 gap-1">
                  <span>Access Token:</span>
                  <span className={debugInfo.tokenInfo?.hasAccessToken ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.tokenInfo?.hasAccessToken ? '✅ Present' : '❌ Missing'}
                  </span>
                  <span>Refresh Token:</span>
                  <span className={debugInfo.tokenInfo?.hasRefreshToken ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.tokenInfo?.hasRefreshToken ? '✅ Present' : '❌ Missing'}
                  </span>
                  <span>Valid Session:</span>
                  <span className={debugInfo.tokenInfo?.isValidSession ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.tokenInfo?.isValidSession ? '✅ Valid' : '❌ Invalid'}
                  </span>
                </div>
              </div>
            </div>

            {/* Auth Health */}
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Auth Health</h4>
              <div className="bg-gray-50 p-2 rounded">
                <div className="grid grid-cols-2 gap-1">
                  <span>Status:</span>
                  <span className={debugInfo.authHealth?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.authHealth?.status || 'Unknown'}
                  </span>
                  <span>Response Time:</span>
                  <span className={debugInfo.authHealth?.response_time < 1000 ? 'text-green-600' : 'text-yellow-600'}>
                    {debugInfo.authHealth?.response_time?.toFixed(2) || 'N/A'}ms
                  </span>
                </div>
              </div>
            </div>

            {/* API Performance */}
            {debugInfo.apiMetrics && Object.keys(debugInfo.apiMetrics).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-1">API Performance</h4>
                <div className="bg-gray-50 p-2 rounded max-h-24 overflow-y-auto">
                  {Object.entries(debugInfo.apiMetrics).map(([endpoint, metrics]: [string, any]) => (
                    <div key={endpoint} className="text-xs mb-1">
                      <div className="font-mono">{endpoint}</div>
                      <div className="text-gray-600 ml-2">
                        Avg: {metrics.avg}ms, Min: {metrics.min}ms, Max: {metrics.max}ms
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={updateDebugInfo}
                className="w-full bg-blue-500 text-white py-1 px-2 rounded text-sm hover:bg-blue-600"
              >
                🔄 Refresh Debug Info
              </button>
              
              <button
                onClick={testAuthEndpoints}
                className="w-full bg-green-500 text-white py-1 px-2 rounded text-sm hover:bg-green-600"
              >
                🧪 Test Auth Endpoints
              </button>
              
              <button
                onClick={clearAllData}
                className="w-full bg-red-500 text-white py-1 px-2 rounded text-sm hover:bg-red-600"
              >
                🧹 Clear All Data
              </button>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-gray-500 border-t pt-2">
              Last updated: {debugInfo.timestamp ? new Date(debugInfo.timestamp).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuthDebugPanel;
