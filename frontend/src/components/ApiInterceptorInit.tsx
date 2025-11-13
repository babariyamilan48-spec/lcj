'use client';

import { useEffect } from 'react';

export default function ApiInterceptorInit() {
  useEffect(() => {
    // Dynamically import the interceptor only on the client side
    import('@/utils/apiInterceptor').then(() => {
      console.log('✅ API Interceptor dynamically loaded and initialized');
    }).catch((error) => {
      console.error('❌ Failed to load API Interceptor:', error);
    });
  }, []);

  return null; // This component doesn't render anything
}
