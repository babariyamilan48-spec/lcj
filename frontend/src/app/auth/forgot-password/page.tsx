'use client';

import React from 'react';
import * as Yup from 'yup';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Toaster } from 'react-hot-toast';
import { modernToast } from '@/utils/toast';
import AuthCard from '@/components/auth/AuthCard';
import { authService } from '@/services/authService';

const ForgotSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
});

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your email and we'll send you a reset code"
      footer={
        <p className="text-center text-sm text-gray-700">
          Remember your password?{' '}
          <a href="/auth/login" className="font-semibold text-gray-900 underline underline-offset-4 hover:no-underline">Back to login</a>
        </p>
      }
    >
      <Formik
        initialValues={{ email: '' }}
        validationSchema={ForgotSchema}
        onSubmit={async (values, { setSubmitting }) => {
          setSubmitting(true);
          try {
            await authService.forgotPassword(values.email);
            modernToast.auth.passwordResetSent();
            // Use window.location.href to ensure navigation happens
            window.location.href = `/auth/reset-password?email=${encodeURIComponent(values.email)}`;
          } catch (err: any) {
            modernToast.auth.passwordResetError();
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
            <button type="submit" disabled={isSubmitting} className="relative w-full overflow-hidden rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-black disabled:opacity-60">
              <span>Send reset code</span>
            </button>
          </Form>
        )}
      </Formik>
      <Toaster position="top-right" />
    </AuthCard>
  );
}