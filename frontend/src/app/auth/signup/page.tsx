'use client';

import React, { useEffect } from 'react';
import * as Yup from 'yup';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { modernToast } from '@/utils/toast';
import AuthCard from '@/components/auth/AuthCard';
import { authService } from '@/services/authService';
import { tokenStore } from '@/services/token';

const SignupSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().min(6, 'Min 6 characters').required('Password is required'),
  username: Yup.string().optional(),
});

export default function SignupPage() {
  const router = useRouter();

  // Clear any existing authentication state when component mounts
  useEffect(() => {
    tokenStore.clear();
  }, []);

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join LCJ to access comprehensive assessments and insights"
      footer={
        <p className="text-center text-sm text-gray-700">
          Already have an account?{' '}
          <a href="/auth/login" className="font-semibold text-gray-900 underline underline-offset-4 hover:no-underline">Sign in</a>
        </p>
      }
    >
      <Formik
        initialValues={{ email: '', password: '', username: '' }}
        validationSchema={SignupSchema}
        onSubmit={async (values, { setSubmitting, setFieldError }) => {
          setSubmitting(true);
          try {
            await authService.signup({ email: values.email, password: values.password, username: values.username });
            modernToast.auth.signupSuccess();
            
            // Use a small delay to ensure toast is shown
            setTimeout(() => {
              router.replace(`/auth/verify?email=${encodeURIComponent(values.email)}`);
            }, 500);
          } catch (err: any) {
            modernToast.auth.signupError(err.message);
            if (err.message && err.message.includes('already registered')) {
              setFieldError('email', 'This email is already registered');
            }
            if (err.message && err.message.includes('already taken')) {
              setFieldError('username', 'This username is already taken');
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <Field name="email" type="email" className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-600" placeholder="you@example.com" />
              <ErrorMessage name="email" component="div" className="mt-1 text-sm text-rose-500" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Username (optional)</label>
              <Field name="username" type="text" className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-600" placeholder="yourname" />
              <ErrorMessage name="username" component="div" className="mt-1 text-sm text-rose-500" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
              <Field name="password" type="password" className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-600" placeholder="••••••••" />
              <ErrorMessage name="password" component="div" className="mt-1 text-sm text-rose-500" />
            </div>
            <button type="submit" disabled={isSubmitting} className="relative w-full overflow-hidden rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-black disabled:opacity-60">
              <span>Create account</span>
            </button>
          </Form>
        )}
      </Formik>
      <Toaster position="top-right" />
    </AuthCard>
  );
}