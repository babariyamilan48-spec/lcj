'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  onClick?: () => void;
  className?: string;
  showLabel?: boolean;
}

export default function BackButton({ 
  onClick, 
  className = '', 
  showLabel = true 
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
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
