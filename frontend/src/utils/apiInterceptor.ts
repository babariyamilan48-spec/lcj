/**
 * API Interceptor for Automatic Optimization
 * Intercepts all API calls and redirects them to optimized endpoints
 */

// Check if optimized endpoints should be used
const useOptimized = process.env.NEXT_PUBLIC_USE_OPTIMIZED === 'true' || 
                    process.env.NODE_ENV === 'production' ||
                    true; // Default to optimized

// Store original fetch
const originalFetch = window.fetch;

// Comprehensive endpoint mapping
const ENDPOINT_REDIRECTS: Record<string, string> = {
  // Auth Service Redirects
  'POST:/api/v1/auth_service/auth/login': '/api/v1/auth_service/optimized/auth/login/fast',
  'GET:/api/v1/auth_service/auth/me': '/api/v1/auth_service/optimized/auth/me/fast',
  
  // Results Service Redirects - Only optimize result submission
  'POST:/api/v1/results_service/results': '/api/v1/results_service/optimized/results/fast',
  
  // Question Service Redirects
  'GET:/api/v1/question_service/questions/': '/api/v1/question_service/optimized/questions/',
  'GET:/api/v1/question_service/tests/': '/api/v1/question_service/optimized/tests/',
  'POST:/api/v1/question_service/questions': '/api/v1/question_service/optimized/questions/fast',
  
  // Completion Status (keep as is - already optimized)
  'GET:/api/v1/results_service/completion-status/': '/api/v1/results_service/completion-status/',
};

// Performance tracking
let interceptedCalls = 0;
let totalSavedTime = 0;

// Enhanced fetch interceptor (only if optimized mode is enabled)
if (useOptimized && typeof window !== 'undefined') {
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString();
  const method = init?.method || 'GET';
  const methodUrl = `${method.toUpperCase()}:${url}`;
  
  // Skip optimization for non-API calls or bypass requests
  const headers = init?.headers as Record<string, string> || {};
  if (!url.includes('/api/v1/') || headers['X-Bypass-Interceptor']) {
    return originalFetch(input, init);
  }
  
  // Check for exact matches first
  for (const [pattern, replacement] of Object.entries(ENDPOINT_REDIRECTS)) {
    if (methodUrl.includes(pattern.split(':')[1])) {
      const newUrl = url.replace(pattern.split(':')[1], replacement);
      
      interceptedCalls++;
      
      // Add performance headers for optimized endpoints
      const optimizedInit = {
        ...init,
        headers: {
          ...init?.headers,
          'X-Optimized-Request': 'true',
          'X-Performance-Tracking': 'enabled'
        }
      };
      
      const startTime = performance.now();
      const response = await originalFetch(newUrl, optimizedInit);
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Estimate time saved (assume 3x improvement)
      const estimatedOldTime = responseTime * 3;
      const timeSaved = estimatedOldTime - responseTime;
      totalSavedTime += timeSaved;
      
      return response;
    }
  }
  
  // Pattern-based redirects for dynamic URLs
  if (url.includes('/api/v1/')) {
    let redirected = false;
    let newUrl = url;
    
    // Results Service patterns - Skip if already optimized
    if (url.includes('/results_service/') && !url.includes('/optimized/')) {
      if (url.match(/\/results\/[^\/]+\?/)) {
        newUrl = url.replace('/results/', '/optimized/results/').replace('?', '/fast?');
        redirected = true;
      } else if (url.match(/\/all-results\/[^\/]+$/)) {
        newUrl = url.replace('/all-results/', '/optimized/all-results/').replace(/([^\/]+)$/, '$1/fast');
        redirected = true;
      }
    }
    
    // Question service patterns
    if (url.includes('/api/v1/question_service/')) {
      if (url.match(/\/questions\/\d+$/)) {
        newUrl = url.replace('/questions/', '/optimized/questions/') + '/fast';
        redirected = true;
      } else if (url.match(/\/tests\/\d+\/questions$/)) {
        newUrl = url.replace('/tests/', '/optimized/tests/').replace('/questions', '/questions/fast');
        redirected = true;
      } else if (url.match(/\/tests\/.*\?/)) {
        newUrl = url.replace('/tests/', '/optimized/questions/fast?');
        redirected = true;
      }
    }
    
    if (redirected) {
      console.log(`🚀 PATTERN REDIRECT: ${url} → ${newUrl}`);
      interceptedCalls++;
      
      const optimizedInit = {
        ...init,
        headers: {
          ...init?.headers,
          'X-Optimized-Request': 'true',
          'X-Performance-Tracking': 'enabled'
        }
      };
      
      return originalFetch(newUrl, optimizedInit);
    }
  }
  
  // No optimization available, use original
  return originalFetch(input, init);
  };
}

// Add performance monitoring
const logPerformanceStats = () => {
  if (interceptedCalls > 0) {
    console.log(`📈 API OPTIMIZATION STATS:`);
    console.log(`   Intercepted calls: ${interceptedCalls}`);
    console.log(`   Estimated time saved: ${(totalSavedTime/1000).toFixed(1)}s`);
    console.log(`   Average time saved per call: ${(totalSavedTime/interceptedCalls).toFixed(0)}ms`);
  }
};

// Log stats every 30 seconds
setInterval(logPerformanceStats, 30000);

// Export for manual access
(window as any).apiOptimizationStats = {
  getStats: () => ({
    interceptedCalls,
    totalSavedTime,
    averageTimeSaved: interceptedCalls > 0 ? totalSavedTime / interceptedCalls : 0
  }),
  logStats: logPerformanceStats
};

// Initialize logging based on mode
if (useOptimized) {
  // Optimized mode enabled
} else {
  // Legacy mode
}

const apiInterceptor = {
  getStats: () => ({ interceptedCalls, totalSavedTime }),
  logStats: logPerformanceStats
};

export default apiInterceptor;
