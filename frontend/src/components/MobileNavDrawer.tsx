'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  User,
  BarChart3,
  LogOut,
  Sun,
  Moon,
  X,
  Menu,
  LogIn,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface MobileNavDrawerProps {
  currentPage?: string;
  onTabChange?: (tab: string) => void;
  showProfileTabs?: boolean;
  onNavigate?: (screen: 'home' | 'selection' | 'quiz' | 'results' | 'about' | 'contact' | 'profile') => void;
}

export default function MobileNavDrawer({ 
  currentPage = 'home',
  onTabChange,
  showProfileTabs = false,
  onNavigate
}: MobileNavDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { user, logout } = useAuth();
  const router = useRouter();

  const mainNavItems = [
    { id: 'home', label: 'ઘર', icon: Home, screen: 'home' as const },
    { id: 'profile', label: 'પ્રોફાઇલ', icon: User, screen: 'profile' as const },
  ];

  const profileTabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'tests', label: 'Test History', icon: BarChart3 },
  ];

  const handleNavClick = (screen: 'home' | 'selection' | 'quiz' | 'results' | 'about' | 'contact' | 'profile') => {
    if (onNavigate) {
      onNavigate(screen);
    } else {
      // Fallback to router if no callback provided
      if (screen === 'profile') {
        router.push('/profile');
      } else if (screen === 'home') {
        router.push('/home');
      }
    }
    setIsOpen(false);
  };

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push('/auth/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <div className="md:hidden fixed top-4 right-4 z-40">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-shadow"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </motion.button>
      </div>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-screen w-80 bg-white shadow-2xl z-40 md:hidden overflow-y-auto"
          >
            {/* Header */}
            <div className="bg-white p-6 border-b border-gray-200">
              {/* User Profile Card */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-4 mb-4">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="w-14 h-14 rounded-full object-cover border-2 border-orange-500 shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-lg font-bold border-2 border-orange-600 shadow-md">
                      {(user?.firstName?.[0] || user?.name?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900">
                      {user?.firstName || user?.name || 'User'}
                    </h3>
                    <p className="text-xs text-gray-600 truncate">
                      {user?.email || 'user@example.com'}
                    </p>
                    {user?.role && (
                      <span className="inline-block mt-2 px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded">
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Verified Badge */}
                {user?.email && (
                  <div className="flex items-center space-x-2 text-xs">
                    <CheckCircle size={14} className="text-green-600" />
                    <span className="text-green-700 font-medium">Verified</span>
                  </div>
                )}
              </div>

            </div>

            {/* Main Navigation Items */}
            <nav className="p-4 space-y-2">
              {mainNavItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNavClick(item.screen)}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition-all ${
                    currentPage === item.id
                      ? 'bg-orange-100 text-orange-600 font-semibold shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </nav>

            {/* Profile Tabs - Only show on profile page */}
            {showProfileTabs && (
              <>
                <div className="mx-4 my-3 border-t border-gray-200" />
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-3">
                    Profile Sections
                  </p>
                  <div className="space-y-2">
                    {profileTabs.map((tab, index) => (
                      <motion.button
                        key={tab.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (mainNavItems.length + index) * 0.05 }}
                        onClick={() => handleTabClick(tab.id)}
                        className={`w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition-all ${
                          currentPage === tab.id
                            ? 'bg-orange-100 text-orange-600 font-semibold shadow-sm border-l-4 border-orange-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <tab.icon size={20} />
                        <span>{tab.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Divider */}
            <div className="mx-4 my-4 border-t border-gray-200" />

            {/* Logout Button */}
            <div className="p-4">
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                onClick={handleLogout}
                className="w-full flex items-center space-x-4 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all font-medium"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
