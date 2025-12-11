'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { navigationHistory } from '@/utils/navigationHistory';

interface BackButtonProps {
  onClick?: () => void;
  className?: string;
  showLabel?: boolean;
  fallbackPath?: string;
}

export default function BackButton({ 
  onClick, 
  className = '', 
  showLabel = true,
  fallbackPath = '/home'
}: BackButtonProps) {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Check if we can go back in navigation history
    setCanGoBack(navigationHistory.canGoBack());

    // Subscribe to history changes
    const unsubscribe = navigationHistory.subscribe(() => {
      setCanGoBack(navigationHistory.canGoBack());
    });

    return unsubscribe;
  }, []);

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    // Always use fallbackPath if explicitly set to /home (for profile page)
    if (fallbackPath === '/home') {
      router.push(fallbackPath);
      return;
    }

    // Try to use navigation history first
    if (navigationHistory.canGoBack()) {
      const backPath = navigationHistory.getBackPath(fallbackPath);
      navigationHistory.pop();
      router.push(backPath);
    } else {
      // Fallback to browser history or default path
      try {
        router.back();
      } catch {
        router.push(fallbackPath);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 font-medium ${className}`}
      aria-label="Go back"
    >
      <ChevronLeft size={20} />
      {showLabel && <span>પાછળ</span>}
    </button>
  );
}
