'use client';

import React from 'react';
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

const LoginSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, user } = useAuth();
  
  // Redirect if already authenticated (respect admin role)
  React.useEffect(() => {
    if (isAuthenticated) {
      const redirectParam = searchParams.get('redirect');
      const destination = redirectParam || (user?.role === 'admin' ? '/admin' : '/home');
      router.replace(destination);
    }
  }, [isAuthenticated, user?.role, router, searchParams]);

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
                  
                  // Check if user is admin and redirect accordingly
                  const redirectTo = searchParams.get('redirect') || 
                    (result.user?.role === 'admin' ? '/admin' : '/home');
                  
                  router.push(redirectTo);
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

