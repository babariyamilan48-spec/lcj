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

  // Clear any keys that start with 'user_' or 'auth_'
  if (typeof window !== 'undefined') {
    // Clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('user_') || key.startsWith('auth_') || key.startsWith('token_') || key.startsWith('lcj-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('user_') || key.startsWith('auth_') || key.startsWith('token_') || key.startsWith('lcj-')) {
        sessionStorage.removeItem(key);
      }
    });
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
  }
}

