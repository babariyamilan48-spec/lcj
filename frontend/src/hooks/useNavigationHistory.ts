'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { navigationHistory } from '@/utils/navigationHistory';

/**
 * Hook to automatically track navigation history
 * Call this in your root layout or main app component
 */
export function useNavigationHistory() {
  const pathname = usePathname();

  useEffect(() => {
    // Track the current pathname
    navigationHistory.push(pathname);
  }, [pathname]);

  return navigationHistory;
}
