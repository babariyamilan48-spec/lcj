let accessToken: string | null = null;
let refreshToken: string | null = null;

function readFromStorage() {
  try {
    const at = typeof window !== 'undefined' ? localStorage.getItem('at') : null;
    const rt = typeof window !== 'undefined' ? localStorage.getItem('rt') : null;
    accessToken = at;
    refreshToken = rt;
  } catch {}
}

// hydrate on module load in browser
if (typeof window !== 'undefined') {
  readFromStorage();
}

export const tokenStore = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  setTokens: (at: string | null, rt: string | null) => {
    accessToken = at;
    refreshToken = rt;
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
    try { document.cookie = `at=; Max-Age=0; Path=/; SameSite=Lax`; } catch {}
    try { if (typeof window !== 'undefined') { localStorage.removeItem('at'); localStorage.removeItem('rt'); } } catch {}
  },
};

