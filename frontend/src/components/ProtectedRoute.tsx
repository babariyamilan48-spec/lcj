'use client';

import React, { ReactNode, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { navigationHistory } from '@/utils/navigationHistory';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // CRITICAL FIX: Give more time for authentication state to restore on refresh
    if (!isLoading && !isAuthenticated) {
      
      // Clear any existing timer
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      
      // Clear navigation history on logout to prevent back navigation to protected pages
      navigationHistory.clear();
      
      // Wait a bit longer before redirecting to allow auth state to restore
      redirectTimerRef.current = setTimeout(() => {
        router.replace('/auth/login');
      }, 1500); // Increased from immediate to 1.5 seconds
    } else if (isAuthenticated && redirectTimerRef.current) {
      // Cancel redirect if user becomes authenticated
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    
    // Cleanup timer on unmount
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while authentication is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Show loading state while authentication is being restored
  // Don't immediately redirect on refresh - give time for auth state to restore
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isLoading ? 'Loading...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

