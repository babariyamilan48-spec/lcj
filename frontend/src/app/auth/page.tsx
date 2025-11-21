'use client';

import React, { Suspense } from 'react';
import UnifiedAuthForm from '@/components/auth/UnifiedAuthForm';

function AuthPageContent() {
  return <UnifiedAuthForm initialTab="signup" />;
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
