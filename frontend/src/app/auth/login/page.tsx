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
  const [userNotFound, setUserNotFound] = React.useState(false);
  
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
              setUserNotFound(false); // Reset user not found state
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
                // Check if this is a user not found error
                const errorMessage = err.message || 'Login failed. Please try again.';
                if (errorMessage.includes('No account found') || errorMessage.includes('Please sign up first')) {
                  setUserNotFound(true);
                } else {
                  setUserNotFound(false);
                  modernToast.auth.loginError();
                }
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
          
          {/* User Not Found Message */}
          {userNotFound && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-800">
                    Account not found
                  </h3>
                  <p className="mt-1 text-sm text-blue-700">
                    No account exists with this email address. Please create an account first.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <motion.a
                  href="/auth/signup"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Account
                </motion.a>
              </div>
            </motion.div>
          )}
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
