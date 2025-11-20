'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { navigationHistory } from '@/utils/navigationHistory';
import { useAppStore } from '@/store/app-store';

/**
 * Mobile Back Handler Component
 * Intercepts the device's back button (popstate event) and uses navigation history
 * instead of redirecting to login
 * 
 * Also handles internal app state navigation (for test selection, quiz, etc.)
 */
export function MobileBackHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentScreen, setCurrentScreen } = useAppStore();

  /**
   * Handle back navigation for internal app state (test selection, quiz, etc.)
   */
  const handleInternalBackNavigation = useCallback(() => {
    switch (currentScreen) {
      case 'selection':
        // From test selection -> go to home
        setCurrentScreen('home');
        break;
      case 'quiz':
        // From quiz -> go to test selection
        setCurrentScreen('selection');
        break;
      case 'results':
        // From results -> go to test selection
        setCurrentScreen('selection');
        break;
      case 'about':
      case 'contact':
        // From about/contact -> go to home
        setCurrentScreen('home');
        break;
      case 'home':
      default:
        // Already at home, go to previous page
        if (navigationHistory.canGoBack()) {
          const backPath = navigationHistory.getBackPath('/home');
          navigationHistory.pop();
          router.push(backPath);
        }
        break;
    }
  }, [currentScreen, setCurrentScreen, router]);

  useEffect(() => {
    // Handle browser back button / device back button
    const handlePopState = (event: PopStateEvent) => {
      // For /home page, handle internal state navigation
      if (pathname === '/home') {
        handleInternalBackNavigation();
      } else {
        // For other pages, use navigation history
        if (navigationHistory.canGoBack()) {
          const backPath = navigationHistory.getBackPath('/home');
          navigationHistory.pop();
          router.push(backPath);
        } else {
          router.push('/home');
        }
      }
    };

    // Add the popstate listener
    window.addEventListener('popstate', handlePopState);

    // Push state to browser history so popstate fires on back button press
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router, pathname, handleInternalBackNavigation]);

  return null;
}
