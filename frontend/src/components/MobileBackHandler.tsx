'use client';

import React, { useEffect, useCallback, useRef } from 'react';
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
  const isProcessingRef = useRef(false);

  /**
   * Handle back navigation for internal app state (test selection, quiz, etc.)
   */
  const handleInternalBackNavigation = useCallback(() => {
    // Prevent multiple simultaneous back navigations
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
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
          // Already at home, go to previous page in navigation history
          if (navigationHistory.canGoBack()) {
            const backPath = navigationHistory.getBackPath('/home');
            navigationHistory.pop();
            router.push(backPath);
          } else {
            // If no history, stay on home
            console.log('No navigation history available, staying on home');
          }
          break;
      }
    } finally {
      // Reset the processing flag after a short delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 300);
    }
  }, [currentScreen, setCurrentScreen, router]);

  useEffect(() => {
    // Handle browser back button / device back button
    const handlePopState = (event: PopStateEvent) => {
      // Prevent default browser behavior
      event.preventDefault();

      console.log('📱 Back button pressed. Current pathname:', pathname, 'Current screen:', currentScreen);

      // For /home page, handle internal state navigation
      if (pathname === '/home') {
        handleInternalBackNavigation();
      } else {
        // For other pages, use navigation history
        if (navigationHistory.canGoBack()) {
          const backPath = navigationHistory.getBackPath('/home');
          navigationHistory.pop();
          console.log('🔙 Navigating back to:', backPath);
          router.push(backPath);
        } else {
          // Default fallback to home
          console.log('🔙 No history available, going to home');
          router.push('/home');
        }
      }
    };

    // Add the popstate listener
    window.addEventListener('popstate', handlePopState);

    // Push state to browser history so popstate fires on back button press
    // This ensures the back button is intercepted
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router, pathname, handleInternalBackNavigation, currentScreen]);

  return null;
}
