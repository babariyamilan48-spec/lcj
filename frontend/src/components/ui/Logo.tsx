'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'text-only';
  className?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  onClick
}) => {
  const sizeClasses = {
    sm: 'h-10',
    md: 'h-14',
    lg: 'h-16',
    xl: 'h-20'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const Component = onClick ? 'button' : 'div';

  if (variant === 'icon-only') {
    return (
      <Component
        onClick={onClick}
        className={`flex items-center ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
      >
        <div className="relative">
          <Image
            src="/logo-removebg-preview.png"
            alt="Life Changing Journey Logo"
            width={size === 'sm' ? 40 : size === 'md' ? 56 : size === 'lg' ? 64 : 80}
            height={size === 'sm' ? 40 : size === 'md' ? 56 : size === 'lg' ? 64 : 80}
            className={`${sizeClasses[size]} w-auto`}
            priority
            unoptimized

          />
        </div>
      </Component>
    );
  }

  if (variant === 'text-only') {
    return (
      <Component
        onClick={onClick}
        className={`flex flex-col ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
      >
        <h1 className={`${textSizeClasses[size]} font-bold text-gray-900 font-gujarati leading-tight`}>
          <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent font-extrabold">જીવન</span>
          <span className="text-gray-700"> પરિવર્તન સફર</span>
        </h1>
        <p className="text-xs text-gray-500 font-gujarati">કારકિર્દી મૂલ્યાંકન પ્લેટફોર્મ</p>
      </Component>
    );
  }

  // Full variant (default)
  return (
    <Component
      onClick={onClick}
      className={`flex items-center space-x-4 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
    >
      <div className="relative flex items-center">
        <Image
          src="/logo-removebg-preview.png"
          alt="Life Changing Journey Logo"
          width={size === 'sm' ? 40 : size === 'md' ? 56 : size === 'lg' ? 64 : 80}
          height={size === 'sm' ? 40 : size === 'md' ? 56 : size === 'lg' ? 64 : 80}
          className={`${sizeClasses[size]} w-auto`}
          priority
          unoptimized
        />
      </div>
      <div className="hidden sm:block">
        <h1 className={`${textSizeClasses[size]} font-bold text-gray-900 font-gujarati leading-tight`}>
          <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent font-extrabold">જીવન</span>
          <span className="text-gray-700"> પરિવર્તન સફર</span>
        </h1>
        <p className="text-xs text-gray-500 font-gujarati">કારકિર્દી મૂલ્યાંકન પ્લેટફોર્મ</p>
      </div>
    </Component>
  );
};

export default Logo;
