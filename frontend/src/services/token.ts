let accessToken: string | null = null;
let refreshToken: string | null = null;
let currentUserId: string | null = null;

function readFromStorage() {
  try {
    const at = typeof window !== 'undefined' ? localStorage.getItem('at') : null;
    const rt = typeof window !== 'undefined' ? localStorage.getItem('rt') : null;
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    
    // CRITICAL FIX: Only load tokens if they belong to the current user session
    // This prevents cross-user token contamination
    if (at && userId) {
      accessToken = at;
      refreshToken = rt;
      currentUserId = userId;
    } else if (at && !userId) {
      // Token exists but no user ID - this is a problematic state
      if (typeof window !== 'undefined') {
        localStorage.removeItem('at');
        localStorage.removeItem('rt');
      }
      accessToken = null;
      refreshToken = null;
      currentUserId = null;
    } else {
      // Clear invalid state
      accessToken = null;
      refreshToken = null;
      currentUserId = null;
    }
  } catch {
    accessToken = null;
    refreshToken = null;
    currentUserId = null;
  }
}

// hydrate on module load in browser
if (typeof window !== 'undefined') {
  readFromStorage();
}

export const tokenStore = {
  getAccessToken: () => {
    // CRITICAL FIX: Validate token belongs to current user session
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      if (currentUserId && storedUserId && currentUserId !== storedUserId) {
        tokenStore.clear();
        return null;
      }
    }
    return accessToken;
  },
  getRefreshToken: () => {
    // CRITICAL FIX: Validate token belongs to current user session
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      if (currentUserId && storedUserId && currentUserId !== storedUserId) {
        tokenStore.clear();
        return null;
      }
    }
    return refreshToken;
  },
  setTokens: (at: string | null, rt: string | null, userId?: string | null) => {
    accessToken = at;
    refreshToken = rt;
    
    // CRITICAL FIX: Track user ID with tokens to prevent cross-user contamination
    if (userId) {
      currentUserId = userId;
    } else if (typeof window !== 'undefined') {
      currentUserId = localStorage.getItem('userId');
    }
    
    try {
      if (at) {
        document.cookie = `at=1; Max-Age=2592000; Path=/; SameSite=Lax`;
        if (typeof window !== 'undefined') localStorage.setItem('at', at);
      } else {
        document.cookie = `at=; Max-Age=0; Path=/; SameSite=Lax`;
        if (typeof window !== 'undefined') localStorage.removeItem('at');
      }
      if (typeof window !== 'undefined') {
        if (rt) localStorage.setItem('rt', rt);
        else localStorage.removeItem('rt');
      }
    } catch {}
  },
  clear: () => {
    accessToken = null;
    refreshToken = null;
    currentUserId = null;
    try { document.cookie = `at=; Max-Age=0; Path=/; SameSite=Lax`; } catch {}
    try { 
      if (typeof window !== 'undefined') { 
        localStorage.removeItem('at'); 
        localStorage.removeItem('rt');
        // Also clear user session tracking
        localStorage.removeItem('userId');
        localStorage.removeItem('user_data');
      } 
    } catch {}
  },
  // CRITICAL FIX: Add method to validate current session
  validateSession: () => {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      if (currentUserId && storedUserId && currentUserId !== storedUserId) {
        tokenStore.clear();
        return false;
      }
    }
    return !!(accessToken && currentUserId);
  },
  // Get current user ID for session tracking
  getUserId: () => {
    return currentUserId;
  },
};

