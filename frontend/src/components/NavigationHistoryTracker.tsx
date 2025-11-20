'use client';

import { useNavigationHistory } from '@/hooks/useNavigationHistory';

/**
 * Navigation History Tracker Component
 * Automatically tracks all navigation in the app
 * Place this in your root layout to enable automatic history tracking
 */
export default function NavigationHistoryTracker() {
  // This hook automatically tracks navigation
  useNavigationHistory();

  return null;
}
