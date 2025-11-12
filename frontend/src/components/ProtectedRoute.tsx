'use client';

import React, { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // CRITICAL FIX: Give more time for authentication state to restore on refresh
    if (!isLoading && !isAuthenticated) {
      
      // Clear any existing timer
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
      
      // Wait a bit longer before redirecting to allow auth state to restore
      const timer = setTimeout(() => {
        router.replace('/auth/login');
      }, 1500); // Increased from immediate to 1.5 seconds
      
      setRedirectTimer(timer);
    } else if (isAuthenticated && redirectTimer) {
      // Cancel redirect if user becomes authenticated
      clearTimeout(redirectTimer);
      setRedirectTimer(null);
    }
    
    // Cleanup timer on unmount
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [isAuthenticated, isLoading, router, redirectTimer]);

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

