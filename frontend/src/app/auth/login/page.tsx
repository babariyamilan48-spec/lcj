'use client';

import React, { Suspense } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import AuthCard from '@/components/auth/AuthCard';
import { Toaster } from 'react-hot-toast';
import { modernToast } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';
import Image from 'next/image';
import ForceLogoutButton from '@/components/ForceLogoutButton';

const LoginSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, user } = useAuth();
  
  // Redirect if already authenticated (respect admin role)
  React.useEffect(() => {
    
    // CRITICAL FIX: Only redirect if user is authenticated and we're not in the middle of a login process
    if (isAuthenticated && user) {
      const redirectParam = searchParams?.get('redirect');
      const destination = redirectParam || (user?.role === 'admin' ? '/admin' : '/home');
      
      // Use setTimeout to ensure state has fully updated
      setTimeout(() => {
        router.replace(destination);
      }, 100);
    }
  }, [isAuthenticated, user, router, searchParams]);

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue to LCJ"
      footer={
        <div className="text-center text-sm text-gray-700">
          <div className="mb-2">
            <a href="/auth/forgot-password" className="font-semibold text-gray-900 underline underline-offset-4 hover:no-underline">Forgot password?</a>
          </div>
          <div>
            Don’t have an account?{' '}
            <a href="/auth/signup" className="font-semibold text-gray-900 underline underline-offset-4 hover:no-underline">Sign up</a>
          </div>
        </div>
      }
    >
      <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={async (values, { setSubmitting }) => {
              setSubmitting(true);
              try {
                const result = await login(values.email, values.password);
                if (result.success) {
                  modernToast.auth.loginSuccess();
                  
                  // CRITICAL FIX: Manual redirect after successful login
                  const redirectParam = searchParams?.get('redirect');
                  const destination = redirectParam || (result.user?.role === 'admin' ? '/admin' : '/home');
                  
                  // Small delay to ensure state updates are complete
                  setTimeout(() => {
                    router.replace(destination);
                  }, 200);
                  
                  // FALLBACK: If router redirect fails, use window.location as backup
                  setTimeout(() => {
                    if (window.location.pathname.includes('/auth/login')) {
                      window.location.href = destination;
                    }
                  }, 1000);
                } else {
                  modernToast.auth.loginError();
                }
              } catch (err: any) {
                // Display the actual error message from the backend
                const errorMessage = err.message || 'Login failed. Please try again.';
                modernToast.auth.loginError();
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                  <Field
                    name="email"
                    type="email"
                    className={clsx(
                      'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-600'
                    )}
                    placeholder="you@example.com"
                  />
                  <ErrorMessage name="email" component="div" className="mt-1 text-sm text-rose-500" />
                </div>

                <div>
                  <div className="mb-2">
                    <label className="text-sm font-medium text-gray-700">Password</label>
                  </div>
                  <Field
                    name="password"
                    type="password"
                    className={clsx(
                      'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-600'
                    )}
                    placeholder="••••••••"
                  />
                  <ErrorMessage name="password" component="div" className="mt-1 text-sm text-rose-500" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={clsx('relative w-full overflow-hidden rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-black disabled:opacity-60')}
                >
                  <span>Sign in</span>
                </button>
              </Form>
            )}
          </Formik>
      <Toaster position="top-right" />
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
