/**
 * API Redirector Service
 * Automatically redirects old API calls to optimized endpoints
 */

import { optimizedApiService } from './optimizedApiService';

// Create a proxy for the old API calls to redirect to optimized endpoints
export const createOptimizedProxy = (originalService: any) => {
  return new Proxy(originalService, {
    get(target, prop, receiver) {
      const originalMethod = Reflect.get(target, prop, receiver);
      
      if (typeof originalMethod === 'function') {
        return function(...args: any[]) {
          // Check if there's an optimized version available
          const methodName = String(prop);
          
          // Map old methods to optimized ones
          const optimizedMethods: Record<string, string> = {
            'getUserResults': 'getUserResultsFast',
            'getAllResults': 'getAllResultsFast',
            'getLatestResult': 'getLatestResultFast',
            'submitResult': 'submitResultFast',
            'getQuestions': 'getQuestionsFast',
            'getTestQuestions': 'getTestQuestionsFast',
            'getQuestionWithOptions': 'getQuestionWithOptionsFast',
            'getTestStructure': 'getTestStructureFast'
          };
          
          const optimizedMethodName = optimizedMethods[methodName];
          
          if (optimizedMethodName && typeof (optimizedApiService as any)[optimizedMethodName] === 'function') {
            console.log(`🚀 Redirecting ${methodName} to optimized endpoint: ${optimizedMethodName}`);
            return (optimizedApiService as any)[optimizedMethodName](...args);
          }
          
          // Fallback to original method
          return originalMethod.apply(this, args);
        };
      }
      
      return originalMethod;
    }
  });
};

// Environment-based API selection
export const getApiService = () => {
  const useOptimized = process.env.REACT_APP_USE_OPTIMIZED === 'true' || 
                      process.env.NODE_ENV === 'production' ||
                      true; // Default to optimized
  
  if (useOptimized) {
    console.log('🚀 Using optimized API endpoints');
    return optimizedApiService;
  } else {
    console.log('⚠️ Using legacy API endpoints');
    // Return legacy service if needed
    return null;
  }
};

// Auto-redirect interceptor for fetch calls
const originalFetch = window.fetch;

window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString();
  
  // Check if this is an API call that should be optimized
  if (url.includes('/api/v1/')) {
    // Redirect specific endpoints to optimized versions
    const optimizedRedirects: Record<string, string> = {
      '/api/v1/results_service/results/': '/api/v1/results_service/optimized/results/',
      '/api/v1/question_service/questions/': '/api/v1/question_service/optimized/questions/',
      '/api/v1/question_service/tests/': '/api/v1/question_service/optimized/tests/',
    };
    
    for (const [oldPath, newPath] of Object.entries(optimizedRedirects)) {
      if (url.includes(oldPath)) {
        const optimizedUrl = url.replace(oldPath, newPath);
        return originalFetch(optimizedUrl, init);
      }
    }
  }
  
  return originalFetch(input, init);
};

const apiRedirector = {
  createOptimizedProxy,
  getApiService
};

export default apiRedirector;
