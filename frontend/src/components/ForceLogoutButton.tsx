/**
 * Force Logout Button Component
 * 
 * A button that completely clears all user data and forces logout
 * Use this when switching between users to prevent auto-login issues
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { clearAllUserData, preventAutoLogin } from '@/utils/clearUserData';

interface ForceLogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const ForceLogoutButton: React.FC<ForceLogoutButtonProps> = ({
  variant = 'danger',
  size = 'md',
  showIcon = true,
  children,
  className = ''
}) => {
  const { forceLogout } = useAuth();

  const handleForceLogout = () => {
    console.log('🚨 Force logout initiated by user');
    
    // Prevent auto-login on next page load
    preventAutoLogin();
    
    // Clear all data immediately
    clearAllUserData();
    
    // Call the auth context force logout
    forceLogout();
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white';
      case 'secondary':
        return 'bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white';
      case 'danger':
      default:
        return 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-8 py-4 text-lg';
      case 'md':
      default:
        return 'px-6 py-3 text-base';
    }
  };

  return (
    <motion.button
      onClick={handleForceLogout}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        flex items-center justify-center
        ${getVariantClasses()}
        ${getSizeClasses()}
        rounded-xl font-medium
        transition-all duration-300
        shadow-lg hover:shadow-xl
        ${className}
      `}
    >
      {showIcon && <LogOut className="w-4 h-4 mr-2" />}
      {children || 'Complete Logout'}
    </motion.button>
  );
};

export default ForceLogoutButton;
