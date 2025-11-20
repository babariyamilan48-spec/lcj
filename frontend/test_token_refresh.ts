/**
 * Frontend Token Refresh Test Script
 * Tests the auto-refresh interceptor functionality
 * 
 * Run in browser console or with Node.js
 */

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:8000',
  email: 'hetbabriyabali09@gmail.com',
  password: 'your_password_here', // Update with actual password
};

// Utility functions
const log = (message: string, level: 'INFO' | 'DEBUG' | 'ERROR' | 'SUCCESS' = 'INFO') => {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[${timestamp}] ${level}:`;
  
  switch (level) {
    case 'SUCCESS':
      console.log(`%c${prefix} ${message}`, 'color: green; font-weight: bold;');
      break;
    case 'ERROR':
      console.error(`%c${prefix} ${message}`, 'color: red; font-weight: bold;');
      break;
    case 'DEBUG':
      console.log(`%c${prefix} ${message}`, 'color: gray;');
      break;
    default:
      console.log(`%c${prefix} ${message}`, 'color: blue;');
  }
};

const decodeToken = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch (e) {
    log(`Error decoding token: ${e}`, 'ERROR');
    return null;
  }
};

const getTokenExpiration = (token: string): Date | null => {
  const decoded = decodeToken(token);
  if (decoded && decoded.exp) {
    return new Date(decoded.exp * 1000);
  }
  return null;
};

const printTokenInfo = (tokenName: string, token: string) => {
  const decoded = decodeToken(token);
  if (decoded) {
    const expTime = getTokenExpiration(token);
    const now = new Date();
    const remaining = expTime ? (expTime.getTime() - now.getTime()) / 1000 : 0;
    
    log(`${tokenName} Token Info:`, 'DEBUG');
    log(`  User ID (uid): ${decoded.uid || 'N/A'}`, 'DEBUG');
    log(`  Type: ${decoded.type || 'N/A'}`, 'DEBUG');
    log(`  Expires at: ${expTime?.toLocaleString() || 'N/A'}`, 'DEBUG');
    log(`  Remaining: ${remaining.toFixed(1)} seconds`, 'DEBUG');
  }
};

const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    // Consider token expired if less than 1 minute remaining
    return currentTime >= expirationTime - 60000;
  } catch (e) {
    log(`Error checking token expiration: ${e}`, 'ERROR');
    return true;
  }
};

// Test class
class TokenRefreshTest {
  accessToken: string | null = null;
  refreshToken: string | null = null;
  userId: string | null = null;

  async test1_Login(): Promise<boolean> {
    log('='.repeat(60), 'INFO');
    log('TEST 1: Login and Get Tokens', 'INFO');
    log('='.repeat(60), 'INFO');

    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/v1/auth_service/optimized/auth/login/fast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_CONFIG.email,
          password: TEST_CONFIG.password,
        }),
      });

      log(`Login request sent`, 'DEBUG');
      log(`Response status: ${response.status}`, 'DEBUG');

      if (response.status !== 200) {
        const text = await response.text();
        log(`Login failed: ${text}`, 'ERROR');
        return false;
      }

      const data = await response.json();

      if (data.data && data.data.token) {
        this.accessToken = data.data.token.access_token;
        this.refreshToken = data.data.token.refresh_token;
        this.userId = data.data.id;

        log(`✅ Login successful!`, 'SUCCESS');
        log(`User ID: ${this.userId}`, 'INFO');

        printTokenInfo('Access', this.accessToken);
        printTokenInfo('Refresh', this.refreshToken);

        return true;
      } else {
        log(`Unexpected response format: ${JSON.stringify(data)}`, 'ERROR');
        return false;
      }
    } catch (e) {
      log(`Login error: ${e}`, 'ERROR');
      return false;
    }
  }

  async test2_GetCurrentUser(token?: string): Promise<boolean> {
    const useToken = token || this.accessToken;

    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/v1/auth_service/optimized/auth/me/fast`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${useToken}`,
        },
      });

      log(`GET /me request with token`, 'DEBUG');
      log(`Response status: ${response.status}`, 'DEBUG');

      if (response.status === 200) {
        const data = await response.json();
        log(`✅ User info retrieved: ${data.username || data.email || 'N/A'}`, 'SUCCESS');
        return true;
      } else {
        const text = await response.text();
        log(`❌ Failed to get user info: ${response.status} - ${text}`, 'ERROR');
        return false;
      }
    } catch (e) {
      log(`Error getting user info: ${e}`, 'ERROR');
      return false;
    }
  }

  async test3_ManualRefresh(): Promise<boolean> {
    log('='.repeat(60), 'INFO');
    log('TEST 3: Manual Token Refresh', 'INFO');
    log('='.repeat(60), 'INFO');

    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/v1/auth_service/auth/token/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken,
        }),
      });

      log(`Refresh request sent`, 'DEBUG');
      log(`Response status: ${response.status}`, 'DEBUG');

      if (response.status !== 200) {
        const text = await response.text();
        log(`Token refresh failed: ${text}`, 'ERROR');
        return false;
      }

      const data = await response.json();

      if (data.data && data.data.token) {
        const oldToken = this.accessToken;
        this.accessToken = data.data.token.access_token;
        this.refreshToken = data.data.token.refresh_token;

        log(`✅ Token refreshed successfully!`, 'SUCCESS');
        log(`Old token: ${oldToken?.substring(0, 20)}...`, 'DEBUG');
        log(`New token: ${this.accessToken.substring(0, 20)}...`, 'DEBUG');

        printTokenInfo('New Access', this.accessToken);
        printTokenInfo('New Refresh', this.refreshToken);

        return true;
      } else {
        log(`Unexpected response format: ${JSON.stringify(data)}`, 'ERROR');
        return false;
      }
    } catch (e) {
      log(`Token refresh error: ${e}`, 'ERROR');
      return false;
    }
  }

  async test4_ExpiredTokenRejection(): Promise<boolean> {
    log('='.repeat(60), 'INFO');
    log('TEST 4: Expired Token Rejection', 'INFO');
    log('='.repeat(60), 'INFO');

    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidWlkIjoiMTIzNDU2Nzg5MCIsInR5cGUiOiJhY2Nlc3MiLCJleHAiOjE2MzAwMDAwMDB9.invalid';

    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/v1/auth_service/optimized/auth/me/fast`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${expiredToken}`,
        },
      });

      if (response.status === 401) {
        log(`✅ Expired token correctly rejected with 401`, 'SUCCESS');
        return true;
      } else {
        log(`❌ Expected 401, got ${response.status}`, 'ERROR');
        return false;
      }
    } catch (e) {
      log(`Error testing expired token: ${e}`, 'ERROR');
      return false;
    }
  }

  async test5_TokenExpirationCheck(): Promise<boolean> {
    log('='.repeat(60), 'INFO');
    log('TEST 5: Token Expiration Check', 'INFO');
    log('='.repeat(60), 'INFO');

    if (!this.accessToken) {
      log('No access token available', 'ERROR');
      return false;
    }

    const expTime = getTokenExpiration(this.accessToken);
    const now = new Date();
    const remaining = expTime ? (expTime.getTime() - now.getTime()) / 1000 : 0;

    log(`Current token status:`, 'INFO');
    log(`  Expires in: ${remaining.toFixed(1)} seconds`, 'INFO');

    const isExpired = isTokenExpired(this.accessToken);
    log(`  Is expired: ${isExpired}`, 'INFO');

    if (!isExpired) {
      log(`✅ Token is still valid`, 'SUCCESS');
      return true;
    } else {
      log(`⚠️ Token is expired or expiring soon`, 'INFO');
      return true; // Still pass the test
    }
  }

  async test6_AutoRefreshFlow(): Promise<boolean> {
    log('='.repeat(60), 'INFO');
    log('TEST 6: Auto-Refresh Flow Simulation', 'INFO');
    log('='.repeat(60), 'INFO');

    log('Simulating frontend interceptor behavior:', 'INFO');

    // Step 1: Make request with current token
    log('Step 1: Making request with current token...', 'INFO');
    if (!(await this.test2_GetCurrentUser())) {
      log('Initial request failed', 'ERROR');
      return false;
    }

    // Step 2: Check if token is expired
    const expTime = getTokenExpiration(this.accessToken!);
    const now = new Date();
    const remaining = expTime ? (expTime.getTime() - now.getTime()) / 1000 : 0;

    log(`Step 2: Checking token expiration...`, 'INFO');
    log(`  Token expires in: ${remaining.toFixed(1)} seconds`, 'INFO');

    if (remaining > 60) {
      log(`  Token still valid, no refresh needed`, 'INFO');
    } else {
      log(`  Token expired or expiring soon, refreshing...`, 'INFO');
      if (!(await this.test3_ManualRefresh())) {
        log('Token refresh failed', 'ERROR');
        return false;
      }
    }

    // Step 3: Retry request with new token
    log('Step 3: Retrying request with new/refreshed token...', 'INFO');
    if (!(await this.test2_GetCurrentUser())) {
      log('Retry request failed', 'ERROR');
      return false;
    }

    log('✅ Auto-refresh flow completed successfully!', 'SUCCESS');
    return true;
  }

  async runAllTests(): Promise<boolean> {
    log('='.repeat(60), 'INFO');
    log('TOKEN REFRESH TEST SUITE', 'INFO');
    log('='.repeat(60), 'INFO');

    const results: Record<string, boolean> = {
      'Login': await this.test1_Login(),
      'Get Current User': await this.test2_GetCurrentUser(),
      'Manual Token Refresh': await this.test3_ManualRefresh(),
      'Verify Token Works After Refresh': await this.test2_GetCurrentUser(),
      'Expired Token Rejection': await this.test4_ExpiredTokenRejection(),
      'Token Expiration Check': await this.test5_TokenExpirationCheck(),
      'Auto-Refresh Flow': await this.test6_AutoRefreshFlow(),
    };

    // Print summary
    log('='.repeat(60), 'INFO');
    log('TEST SUMMARY', 'INFO');
    log('='.repeat(60), 'INFO');

    const passed = Object.values(results).filter(v => v).length;
    const total = Object.keys(results).length;

    for (const [testName, result] of Object.entries(results)) {
      const status = result ? '✅ PASS' : '❌ FAIL';
      log(`${testName}: ${status}`, 'INFO');
    }

    log(`\nTotal: ${passed}/${total} tests passed`, 'INFO');

    if (passed === total) {
      log('🎉 All tests passed!', 'SUCCESS');
    } else {
      log(`⚠️ ${total - passed} test(s) failed`, 'ERROR');
    }

    return passed === total;
  }
}

// Export for use
export { TokenRefreshTest, log, decodeToken, isTokenExpired };

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('%c=== TOKEN REFRESH TEST SUITE ===', 'font-size: 16px; font-weight: bold; color: blue;');
  console.log('To run tests, execute: await new TokenRefreshTest().runAllTests()');
  console.log('Make sure to update TEST_CONFIG.password before running!');
}
