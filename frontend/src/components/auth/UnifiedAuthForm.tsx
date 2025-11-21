'use client';

import React, { useState, Suspense } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { modernToast } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { firebaseAuthService } from '@/services/firebaseAuthService';
import { tokenStore } from '@/services/token';
import clsx from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

const LoginSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

const SignupSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().min(6, 'Min 6 characters').required('Password is required'),
  username: Yup.string().optional(),
});

interface UnifiedAuthFormProps {
  initialTab?: 'login' | 'signup';
}

export default function UnifiedAuthForm({ initialTab = 'signup' }: UnifiedAuthFormProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  const [googleOnlyError, setGoogleOnlyError] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, user, refreshAuthState } = useAuth();

  // Initialize tab only once on mount
  React.useEffect(() => {
    if (activeTab === null) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Check for unverified email in localStorage and redirect to verify page
  React.useEffect(() => {
    if (activeTab === 'signup') {
      const unverifiedEmail = localStorage.getItem('unverified_email');
      if (unverifiedEmail) {
        console.log('🔄 [REDIRECT] Found unverified email:', unverifiedEmail);
        router.push(`/auth/verify?email=${encodeURIComponent(unverifiedEmail)}`);
      }
    }
  }, [activeTab, router]);

  // Redirect if already authenticated
  React.useEffect(() => {
    console.log('🔄 [REDIRECT] Checking if authenticated:', isAuthenticated, 'user:', user);
    if (isAuthenticated && user) {
      const redirectParam = searchParams?.get('redirect');
      const destination = redirectParam || (user?.role === 'admin' ? '/admin' : '/home');
      console.log('🔄 [REDIRECT] User authenticated, redirecting to:', destination);
      setTimeout(() => {
        console.log('🔄 [REDIRECT] Executing router.replace to:', destination);
        router.replace(destination);
      }, 100);
    }
  }, [isAuthenticated, user, router, searchParams]);

  const handleLoginSubmit = async (values: any, { setSubmitting, setFieldValue }: any) => {
    console.log('🔐 [LOGIN] Form submitted with email:', values.email);
    setSubmitting(true);
    setUserNotFound(false);
    setGoogleOnlyError(false);
    try {
      console.log('🔐 [LOGIN] Calling login function...');
      const result = await login(values.email, values.password);
      console.log('🔐 [LOGIN] Login result:', result);
      
      if (result.success) {
        console.log('✅ [LOGIN] Login successful, redirecting...');
        modernToast.auth.loginSuccess();
        const redirectParam = searchParams?.get('redirect');
        const destination = redirectParam || (result.user?.role === 'admin' ? '/admin' : '/home');
        console.log('🔐 [LOGIN] Destination:', destination);
        // Use router.push instead of router.replace to avoid issues
        router.push(destination);
      } else {
        console.log('❌ [LOGIN] Login failed - result.success is false');
        // Clear password on error - don't refresh page
        setFieldValue('password', '');
        modernToast.auth.loginError();
        setSubmitting(false);
      }
    } catch (err: any) {
      console.error('❌ [LOGIN] Error caught:', err.message);
      const errorMessage = (err.message || 'Login failed. Please try again.').toLowerCase();
      console.log('🔐 [LOGIN] Error message (lowercase):', errorMessage);
      // Clear password on error - don't refresh page
      setFieldValue('password', '');
      if (errorMessage.includes('no account found') || errorMessage.includes('please sign up first')) {
        console.log('❌ [LOGIN] Account not found error');
        setUserNotFound(true);
        setGoogleOnlyError(false);
      } else if (errorMessage.includes('google') || errorMessage.includes('sign in with google')) {
        console.log('❌ [LOGIN] Google-only account error');
        setGoogleOnlyError(true);
        setUserNotFound(false);
      } else {
        console.log('❌ [LOGIN] Generic login error');
        setUserNotFound(false);
        setGoogleOnlyError(false);
        modernToast.auth.loginError();
      }
      console.log('❌ [LOGIN] Setting submitting to false');
      setSubmitting(false);
    }
  };

  const handleSignupSubmit = async (values: any, { setSubmitting, setFieldError }: any) => {
    setSubmitting(true);
    try {
      await authService.signup({ email: values.email, password: values.password, username: values.username });
      // Store unverified email in localStorage for recovery if user closes app
      localStorage.setItem('unverified_email', values.email);
      modernToast.auth.signupSuccess();
      // Don't set submitting to false on success - let the redirect happen
      router.push(`/auth/verify?email=${encodeURIComponent(values.email)}`);
    } catch (err: any) {
      modernToast.auth.signupError(err.message);
      if (err.message && err.message.includes('already registered')) {
        setFieldError('email', 'This email is already registered');
      }
      if (err.message && err.message.includes('already taken')) {
        setFieldError('username', 'This username is already taken');
      }
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log('🔐 [GOOGLE] Starting Google sign-in...');
      const result = await firebaseAuthService.completeGoogleLogin();
      console.log('✅ [GOOGLE] Google login successful, result:', result);
      
      // Refresh auth state to update context with new user data
      console.log('🔐 [GOOGLE] Refreshing auth state...');
      await refreshAuthState();
      
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      modernToast.auth.loginSuccess();
      const redirectParam = searchParams?.get('redirect');
      
      // Extract user data from response
      const userRole = result?.role || 'user';
      const destination = redirectParam || (userRole === 'admin' ? '/admin' : '/home');
      
      console.log('🔐 [GOOGLE] User role:', userRole, 'Redirecting to:', destination);
      
      // Redirect - auth state is now updated
      router.push(destination);
    } catch (err: any) {
      console.error('❌ [GOOGLE] Google sign-in error:', err.message);
      modernToast.auth.loginError();
    }
  };

  // Don't render until tab is initialized
  if (activeTab === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-xl backdrop-blur overflow-hidden"
      >
        {/* Header with Logo */}
        <div className="px-6 pt-6 pb-4 text-center">
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-3xl font-bold text-orange-600 mb-2"
          >
            જીવન પરિવર્તન સફર
          </motion.h1>
          <h2 className="text-xl font-bold text-gray-900">
            {activeTab === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="mt-1 text-xs text-gray-600">
            {activeTab === 'login' ? 'Sign in to continue' : 'Join us to get started'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pb-4">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            {(['signup', 'login'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setUserNotFound(false);
                }}
                className={clsx(
                  'flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all duration-200',
                  activeTab === tab
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {tab === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Formik
                  initialValues={{ email: '', password: '' }}
                  validationSchema={LoginSchema}
                  onSubmit={handleLoginSubmit}
                >
                  {({ isSubmitting, errors, touched }) => (
                    <Form className="space-y-5">
                      {/* Google-Only Account Message - TOP */}
                      {googleOnlyError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-lg border border-orange-200 bg-orange-50 p-3"
                        >
                          <div className="flex items-start space-x-2">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-orange-800">
                                This account uses Google. Please sign in with Google.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            className="mt-2 w-full inline-flex items-center justify-center rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700 gap-2"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign in with Google
                          </button>
                        </motion.div>
                      )}

                      {/* User Not Found Message - TOP */}
                      {userNotFound && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-lg border border-orange-200 bg-orange-50 p-3"
                        >
                          <div className="flex items-start space-x-2">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-orange-800">
                                No account with this email. Create one to get started!
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('signup')}
                            className="mt-2 w-full inline-flex items-center justify-center rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 gap-2"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create Account
                          </button>
                        </motion.div>
                      )}

                      {/* Email Field */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                        <Field
                          name="email"
                          type="email"
                          className={clsx(
                            'w-full rounded-lg border bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition',
                            errors.email && touched.email
                              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                              : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                          )}
                          placeholder="you@example.com"
                        />
                        <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-500" />
                      </div>

                      {/* Password Field */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                          <Field
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            className={clsx(
                              'w-full rounded-lg border bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition pr-10',
                              errors.password && touched.password
                                ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                                : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            )}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-500" />
                      </div>

                      {/* Sign In Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing in...
                          </span>
                        ) : (
                          'Sign In'
                        )}
                      </button>

                      {/* Forgot Password Link */}
                      <div className="text-center">
                        <a href="/auth/forgot-password" className="text-sm font-medium text-gray-700 hover:text-gray-900 underline underline-offset-2">
                          Forgot password?
                        </a>
                      </div>

                      {/* Divider */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                      </div>

                      {/* Google Sign-In Button */}
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isSubmitting}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Sign in with Google
                      </button>

                    </Form>
                  )}
                </Formik>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Formik
                  initialValues={{ email: '', password: '', username: '' }}
                  validationSchema={SignupSchema}
                  onSubmit={handleSignupSubmit}
                >
                  {({ isSubmitting, errors, touched }) => (
                    <Form className="space-y-5">
                      {/* Email Field */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                        <Field
                          name="email"
                          type="email"
                          className={clsx(
                            'w-full rounded-lg border bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition',
                            errors.email && touched.email
                              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                              : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                          )}
                          placeholder="you@example.com"
                        />
                        <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-500" />
                      </div>

                      {/* Username Field */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Username</label>
                        <Field
                          name="username"
                          type="text"
                          className={clsx(
                            'w-full rounded-lg border bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition',
                            errors.username && touched.username
                              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                              : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                          )}
                          placeholder="yourname"
                        />
                        <ErrorMessage name="username" component="div" className="mt-1 text-sm text-red-500" />
                      </div>

                      {/* Password Field */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                          <Field
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            className={clsx(
                              'w-full rounded-lg border bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition pr-10',
                              errors.password && touched.password
                                ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                                : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            )}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-500" />
                      </div>

                      {/* Create Account Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating account...
                          </span>
                        ) : (
                          'Create account'
                        )}
                      </button>

                      {/* Divider */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                        </div>
                      </div>

                      {/* Google Sign-In Button */}
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isSubmitting}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Sign up with Google
                      </button>
                    </Form>
                  )}
                </Formik>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 text-center text-xs text-gray-600">
          {activeTab === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => setActiveTab('signup')}
                className="font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setActiveTab('login')}
                className="font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </motion.div>

      <Toaster position="top-right" />
    </div>
  );
}
