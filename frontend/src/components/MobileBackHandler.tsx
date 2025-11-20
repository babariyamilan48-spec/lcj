'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { navigationHistory } from '@/utils/navigationHistory';

/**
 * Mobile Back Handler Component
 * Intercepts the device's back button (popstate event) and uses navigation history
 * instead of redirecting to login
 */
export function MobileBackHandler() {
  const router = useRouter();

  useEffect(() => {
    // Handle browser back button / device back button
    const handlePopState = (event: PopStateEvent) => {
      // Prevent default browser back behavior
      event.preventDefault();

      // Use our navigation history to go back
      if (navigationHistory.canGoBack()) {
        const backPath = navigationHistory.getBackPath('/home');
        navigationHistory.pop();
        router.push(backPath);
      } else {
        // If no history, go to home
        router.push('/home');
      }
    };

    // Add the popstate listener
    window.addEventListener('popstate', handlePopState);

    // Push a dummy state to the history stack so popstate fires
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  return null;
}
