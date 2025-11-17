'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOptimizedAuth } from '@/contexts/OptimizedAuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function OptimizedLoginForm({ onSuccess, onError }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    loginTime?: number;
    healthStatus?: string;
  }>({});

  const { login, healthCheck } = useOptimizedAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const startTime = performance.now();

    try {
      console.log('🔐 Starting optimized login...');
      
      const result = await login(email, password);
      const loginTime = performance.now() - startTime;
      
      setPerformanceMetrics(prev => ({ ...prev, loginTime }));

      if (result.success && result.user) {
        console.log(`✅ Login successful in ${loginTime.toFixed(2)}ms:`, result.user.email);
        
        onSuccess?.();
        router.push('/dashboard');
      } else {
        const errorMessage = result.error || 'Login failed';
        console.error('❌ Login failed:', errorMessage);
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (error) {
      const loginTime = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      console.error(`❌ Login error after ${loginTime.toFixed(2)}ms:`, error);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthHealth = async () => {
    try {
      const health = await healthCheck();
      setPerformanceMetrics(prev => ({ 
        ...prev, 
        healthStatus: `${health.status} (${health.response_time.toFixed(2)}ms)` 
      }));
      console.log('Auth Health:', health);
    } catch (error) {
      console.error('Health check failed:', error);
      setPerformanceMetrics(prev => ({ 
        ...prev, 
        healthStatus: 'unhealthy' 
      }));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your password"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Performance Metrics (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Performance Metrics</h4>
          
          <div className="space-y-2 text-xs text-gray-600">
            {performanceMetrics.loginTime && (
              <div className="flex justify-between">
                <span>Login Time:</span>
                <span className={performanceMetrics.loginTime < 1000 ? 'text-green-600' : 'text-red-600'}>
                  {performanceMetrics.loginTime.toFixed(2)}ms
                </span>
              </div>
            )}
            
            {performanceMetrics.healthStatus && (
              <div className="flex justify-between">
                <span>Auth Health:</span>
                <span className={performanceMetrics.healthStatus.includes('healthy') ? 'text-green-600' : 'text-red-600'}>
                  {performanceMetrics.healthStatus}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={checkAuthHealth}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Check Auth Health
          </button>
        </div>
      )}

      {/* Success Indicator */}
      {performanceMetrics.loginTime && performanceMetrics.loginTime < 1000 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                ⚡ Fast login! Completed in {performanceMetrics.loginTime.toFixed(2)}ms
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OptimizedLoginForm;
