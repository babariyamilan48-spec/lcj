'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useClickOutside } from '@/hooks/useClickOutside';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  BarChart3, 
  BookOpen, 
  Home, 
  Info, 
  Phone,
  Shield,
  ChevronDown
} from 'lucide-react';
import { modernToast } from '@/utils/toast';
import Logo from '@/components/ui/Logo';
import MobileNavDrawer from '@/components/MobileNavDrawer';

interface ModernNavbarProps {
  currentScreen?: 'home' | 'selection' | 'quiz' | 'results' | 'about' | 'contact';
  onNavigate?: (screen: 'home' | 'selection' | 'quiz' | 'results' | 'about' | 'contact') => void;
  testName?: string;
  showProgress?: boolean;
  progress?: number;
}

const ModernNavbar: React.FC<ModernNavbarProps> = ({ 
  currentScreen, 
  onNavigate, 
  testName, 
  showProgress = false,
  progress = 0 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  // Handle click outside for profile dropdown
  const profileRef = useClickOutside<HTMLDivElement>(() => {
    setIsProfileOpen(false);
  });

  // Handle click outside for mobile menu
  const mobileMenuRef = useClickOutside<HTMLDivElement>(() => {
    setIsMobileMenuOpen(false);
  });

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { id: 'home', label: 'ઘર', icon: Home, screen: 'home' as const },
    { id: 'about', label: 'વિશે', icon: Info, screen: 'about' as const },
    { id: 'contact', label: 'સંપર્ક', icon: Phone, screen: 'contact' as const },
  ];

  const handleNavigation = (screen: 'home' | 'selection' | 'quiz' | 'results' | 'about' | 'contact') => {
    if (onNavigate) {
      onNavigate(screen);
    } else {
      // Handle routing properly for home page
      if (screen === 'home') {
        router.push('/home');
      } else {
        router.push(`/${screen}`);
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    modernToast.auth.logoutSuccess();
    setIsProfileOpen(false);
  };

  const handleAdminAccess = () => {
    if (user?.role === 'admin') {
      router.push('/admin');
    } else {
      modernToast.auth.accessDenied();
    }
    setIsProfileOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
        : 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Logo 
              size="md"
              variant="full"
              onClick={() => handleNavigation('home')}
            />
          </motion.div>

          {/* Test Progress (shown during quiz) */}
          {showProgress && testName && (
            <div className="hidden lg:flex items-center space-x-4 flex-1 max-w-md mx-8">
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">વર્તમાન પરીક્ષણ:</span> {testName}
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavigation(item.screen)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentScreen === item.screen
                      ? 'bg-orange-50 text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'
                  }`}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">

            {/* Profile Dropdown */}
            {isAuthenticated && user && (
              <div className="relative hidden md:block" ref={profileRef}>
                <motion.button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user.firstName?.charAt(0) || user.name?.charAt(0) || user.username?.charAt(0) || user.email?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || user.username || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </motion.button>

                {/* Profile Dropdown Menu */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              user.firstName?.charAt(0) || user.name?.charAt(0) || user.username?.charAt(0) || user.email?.charAt(0) || 'U'
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || user.username || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            {user.username && user.username !== user.email?.split('@')[0] && (
                              <p className="text-xs text-orange-600">@{user.username}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 capitalize">
                            {user.role}
                          </span>
                          {user.isVerified && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="py-1">
                        <button
                          onClick={() => { router.push('/profile'); setIsProfileOpen(false); }}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <User className="w-4 h-4" />
                          <span>પ્રોફાઇલ</span>
                        </button>

                        {user.role === 'admin' && (
                          <button
                            onClick={handleAdminAccess}
                            className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Shield className="w-4 h-4" />
                            <span>એડમિન પેનલ</span>
                          </button>
                        )}
                        
                        <div className="border-t border-gray-100 my-1"></div>
                        
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>લોગઆઉટ</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200 shadow-lg"
          >
            <div className="px-4 py-4 space-y-2">
              {/* Navigation Items */}
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavigation(item.screen)}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      currentScreen === item.screen
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </motion.button>
                );
              })}
              
              {/* Test Progress for Mobile */}
              {showProgress && testName && (
                <div className="px-4 py-3 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">વર્તમાન પરીક્ષણ:</span> {testName}
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer currentPage={currentScreen} />
    </nav>
  );
};

export default ModernNavbar;
