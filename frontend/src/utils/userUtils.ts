/**
 * Utility functions for user management
 */

/**
 * Get the current user ID from multiple sources with priority:
 * 1. localStorage 'userId'
 * 2. localStorage 'user_data' parsed JSON
 * 3. Fallback to demo user ID
 */
export function getCurrentUserId(): string {
  // First priority: direct userId in localStorage
  let userId = localStorage.getItem('userId');
  
  // Second priority: extract from user_data
  if (!userId) {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        userId = parsedUserData.id;
        // Store it for future use
        if (userId) {
          localStorage.setItem('userId', userId);
        }
      } catch (e) {
        console.warn('Failed to parse user_data from localStorage');
      }
    }
  }
  
  // Final fallback to demo user
  if (!userId) {
    userId = '11dc4aec-2216-45f9-b045-60edac007262';
    console.warn('🚨 Using fallback demo user ID. User may not be authenticated.');
  }
  
  return userId;
}

/**
 * Get user ID source for debugging
 */
export function getUserIdSource(): string {
  if (localStorage.getItem('userId')) {
    return 'localStorage userId';
  } else if (localStorage.getItem('user_data')) {
    return 'user_data';
  } else {
    return 'fallback demo';
  }
}

/**
 * Check if user is using the demo/fallback user ID
 */
export function isUsingDemoUser(): boolean {
  const userId = getCurrentUserId();
  return userId === '11dc4aec-2216-45f9-b045-60edac007262';
}
