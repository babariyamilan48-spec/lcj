'use client';

import React, { useEffect, useRef } from 'react';
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
  const historyStackRef = useRef<string[]>([]);

  useEffect(() => {
    // Initialize history stack with current screen
    if (pathname === '/home') {
      historyStackRef.current = [currentScreen];
    }
  }, [pathname, currentScreen]);

  useEffect(() => {
    // Update history stack when screen changes (on /home page)
    if (pathname === '/home' && currentScreen) {
      const stack = historyStackRef.current;
      
      // Only add if it's different from the last entry
      if (stack[stack.length - 1] !== currentScreen) {
        stack.push(currentScreen);
        // Push state to browser history so popstate fires
        window.history.pushState({ screen: currentScreen }, '', window.location.href);
      }
    }
  }, [pathname, currentScreen]);

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

    // Push initial state to history stack
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router, pathname]);

  /**
   * Handle back navigation for internal app state (test selection, quiz, etc.)
   */
  const handleInternalBackNavigation = () => {
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
  };

  return null;
}
