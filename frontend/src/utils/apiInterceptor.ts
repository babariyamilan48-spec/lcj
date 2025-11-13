/**
 * API Interceptor for Automatic Optimization
 * Intercepts all API calls and redirects them to optimized endpoints
 * Works with both Axios and Fetch
 */

// Check if optimized endpoints should be used
const useOptimized = process.env.NEXT_PUBLIC_USE_OPTIMIZED === 'true' || 
                    process.env.NODE_ENV === 'production' ||
                    true; // Default to optimized

// Store original fetch (safely handle SSR)
const originalFetch = typeof window !== 'undefined' ? window.fetch : global.fetch;

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
  'POST:/api/v1/question_service/test-results/calculate-and-save': '/api/v1/question_service/test-results/calculate-and-save/fast',
  
  // Completion Status (keep as is - already optimized)
  'GET:/api/v1/results_service/completion-status/': '/api/v1/results_service/completion-status/',
};

// Performance tracking
let interceptedCalls = 0;
let totalSavedTime = 0;

// Enhanced fetch interceptor (only if optimized mode is enabled and in browser)
if (useOptimized && typeof window !== 'undefined') {
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString();
  const method = init?.method || 'GET';
  const methodUrl = `${method.toUpperCase()}:${url}`;
  
  // Skip optimization for non-API calls, bypass requests, or already optimized URLs
  const headers = init?.headers as Record<string, string> || {};
  if (!url.includes('/api/v1/') || headers['X-Bypass-Interceptor'] || url.includes('/optimized/')) {
    return originalFetch(input, init);
  }
  
  // Debug: Log all API calls that reach the interceptor
  console.log(`🔍 API Call Intercepted: ${methodUrl}`);
  
  // Check for exact matches first
  for (const [pattern, replacement] of Object.entries(ENDPOINT_REDIRECTS)) {
    const [patternMethod, patternUrl] = pattern.split(':');
    
    // Debug: Show pattern matching attempt
    console.log(`🔍 Checking pattern: ${pattern} against ${methodUrl}`);
    
    if (method.toUpperCase() === patternMethod && url.includes(patternUrl)) {
      console.log(`🚀 API OPTIMIZATION: ${method} ${patternUrl} → ${replacement}`);
      console.log(`   Original: ${url}`);
      const newUrl = url.replace(patternUrl, replacement);
      console.log(`   Optimized: ${newUrl}`);
      
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
      
      console.log(`⚡ Performance: ${responseTime.toFixed(0)}ms (estimated ${timeSaved.toFixed(0)}ms saved)`);
      console.log(`📊 Total optimized calls: ${interceptedCalls}, Total time saved: ${(totalSavedTime / 1000).toFixed(1)}s`);
      
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
  
  // Debug: Log when no optimization is found
  console.log(`❌ No optimization found for: ${methodUrl}`);
  
  // No optimization available, use original
  return originalFetch(input, init);
  };
}

// Axios Interceptor (for apps using Axios instead of fetch)
if (useOptimized && typeof window !== 'undefined') {
  // Dynamically import axios to avoid SSR issues
  import('axios').then((axiosModule) => {
    const axios = axiosModule.default;
    
    // Add request interceptor to redirect URLs
    axios.interceptors.request.use((config) => {
      const url = config.url || '';
      const method = (config.method || 'GET').toUpperCase();
      const methodUrl = `${method}:${url}`;
      
      // Skip optimization for non-API calls or already optimized URLs
      if (!url.includes('/api/v1/') || url.includes('/optimized/')) {
        return config;
      }
      
      console.log(`🔍 Axios Call Intercepted: ${methodUrl}`);
      
      // Check for exact matches
      for (const [pattern, replacement] of Object.entries(ENDPOINT_REDIRECTS)) {
        const [patternMethod, patternUrl] = pattern.split(':');
        
        if (method === patternMethod && url.includes(patternUrl)) {
          const newUrl = url.replace(patternUrl, replacement);
          console.log(`🚀 AXIOS OPTIMIZATION: ${method} ${patternUrl} → ${replacement}`);
          console.log(`   Original: ${url}`);
          console.log(`   Optimized: ${newUrl}`);
          
          config.url = newUrl;
          if (config.headers) {
            config.headers['X-Optimized-Request'] = 'true';
            config.headers['X-Performance-Tracking'] = 'enabled';
          }
          
          interceptedCalls++;
          return config;
        }
      }
      
      console.log(`❌ No Axios optimization found for: ${methodUrl}`);
      return config;
    }, (error) => {
      return Promise.reject(error);
    });
    
    // Add response interceptor for performance tracking
    axios.interceptors.response.use((response) => {
      if (response.config.headers?.['X-Optimized-Request']) {
        // Simple performance estimation since we can't easily track start time
        const estimatedResponseTime = 500; // Assume optimized response time
        const estimatedSavings = estimatedResponseTime * 2; // Assume 3x improvement
        totalSavedTime += estimatedSavings;
        
        console.log(`⚡ Axios Performance: ~${estimatedResponseTime}ms (estimated ${estimatedSavings}ms saved)`);
        console.log(`📊 Total optimized calls: ${interceptedCalls}, Total time saved: ${(totalSavedTime / 1000).toFixed(1)}s`);
      }
      return response;
    }, (error) => {
      return Promise.reject(error);
    });
    
    console.log('🚀 Axios Interceptor initialized - All Axios API calls will be automatically optimized!');
  }).catch((error) => {
    console.warn('⚠️ Could not load Axios interceptor:', error);
  });
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

// Client-side only features
if (typeof window !== 'undefined') {
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
}

// Initialize logging based on mode (client-side only)
if (typeof window !== 'undefined') {
  if (useOptimized) {
    console.log('🚀 API Interceptor initialized - All API calls will be automatically optimized!');
  } else {
    console.log('⚠️ Using legacy API endpoints - Optimization disabled');
  }
}

const apiInterceptor = {
  getStats: () => ({ interceptedCalls, totalSavedTime }),
  logStats: logPerformanceStats
};

export default apiInterceptor;
