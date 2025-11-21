/**
 * Utility to clear all user-related data from localStorage
 * Use this for debugging authentication issues
 */

export function clearAllUserData() {
  const keysToRemove = [
    'userId',
    'user_data',
    'auth_token',
    'access_token',
    'refresh_token',
    'at', // access token from tokenStore
    'rt', // refresh token from tokenStore
    'token',
    'user_profile',
    'user_settings',
    'test_results',
    'completion_status',
    'lcj-app-storage' // Clear app store state (currentScreen, userAnswers, etc.)
  ];

  // Clear from localStorage
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });

  // Also clear from sessionStorage
  keysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
  });

  // Clear any keys that start with 'user_' or 'auth_' or 'test_' or 'result_' or 'profile_'
  if (typeof window !== 'undefined') {
    // Clear localStorage - be aggressive with cleanup
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('user_') || 
          key.startsWith('auth_') || 
          key.startsWith('token_') || 
          key.startsWith('lcj-') ||
          key.startsWith('test_') ||
          key.startsWith('result_') ||
          key.startsWith('profile_') ||
          key.startsWith('cache_') ||
          key.includes('user') ||
          key.includes('auth') ||
          key.includes('profile') ||
          key.includes('test')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage - be aggressive with cleanup
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('user_') || 
          key.startsWith('auth_') || 
          key.startsWith('token_') || 
          key.startsWith('lcj-') ||
          key.startsWith('test_') ||
          key.startsWith('result_') ||
          key.startsWith('profile_') ||
          key.startsWith('cache_') ||
          key.includes('user') ||
          key.includes('auth') ||
          key.includes('profile') ||
          key.includes('test')) {
        sessionStorage.removeItem(key);
      }
    });
  }

  // CRITICAL FIX: Reset Zustand app store to initial state
  try {
    const { useAppStore } = require('@/store/app-store');
    useAppStore.getState().resetApp();
    console.log('✅ App store reset successfully');
  } catch (error) {
    // Store might not be loaded yet, that's okay
    console.warn('⚠️ Could not reset app store:', error);
  }
}

export function preventAutoLogin() {
  // Set a flag to prevent auto-login on next page load
  sessionStorage.setItem('prevent_auto_login', 'true');
}

export function shouldPreventAutoLogin(): boolean {
  const prevent = sessionStorage.getItem('prevent_auto_login');
  if (prevent) {
    sessionStorage.removeItem('prevent_auto_login');
    return true;
  }
  return false;
}

// CRITICAL FIX: Add session validation to detect user switches
export function validateUserSession(): boolean {
  if (typeof window === 'undefined') return true;
  
  const storedUserId = localStorage.getItem('userId');
  const storedUserData = localStorage.getItem('user_data');
  const accessToken = localStorage.getItem('at');
  
  // If we have tokens but no user data, this is invalid
  if (accessToken && !storedUserId) {
    return false;
  }
  
  // If we have user data but it's corrupted
  if (storedUserData) {
    try {
      const userData = JSON.parse(storedUserData);
      if (!userData.id || userData.id !== storedUserId) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
  
  return true;
}

// CRITICAL FIX: Force clear all user session data
export function forceSessionClear() {
  
  clearAllUserData();
  
  // Also clear any session flags
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('prevent_auto_login');
    sessionStorage.removeItem('logging_in');
    
    // Clear any other potential session storage items
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('user_') || key.startsWith('auth_') || key.startsWith('token_')) {
        sessionStorage.removeItem(key);
      }
    });
    
    // Clear IndexedDB if it exists
    try {
      if (window.indexedDB) {
        const dbs = ['lcj-db', 'app-db', 'cache-db'];
        dbs.forEach(dbName => {
          try {
            const request = window.indexedDB.deleteDatabase(dbName);
            request.onsuccess = () => {
              console.log(`✅ IndexedDB '${dbName}' cleared`);
            };
            request.onerror = () => {
              console.warn(`⚠️ Failed to clear IndexedDB '${dbName}'`);
            };
          } catch (error) {
            console.warn(`⚠️ Error clearing IndexedDB '${dbName}':`, error);
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ IndexedDB not available:', error);
    }
  }
}

