'use client';

import React from 'react';
import * as Yup from 'yup';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Toaster } from 'react-hot-toast';
import { modernToast } from '@/utils/toast';
import { authService } from '@/services/authService';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const ForgotSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
});

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-4xl font-bold text-orange-600 mb-4"
          >
            જીવન પરિવર્તન સફર
          </motion.h1>
          <h2 className="text-2xl font-bold text-gray-900">Forgot password?</h2>
          <p className="mt-2 text-sm text-gray-600">Enter your email and we'll send you a reset code</p>
        </div>

        {/* Form */}
        <div className="px-8 pb-8">
          <Formik
            initialValues={{ email: '' }}
            validationSchema={ForgotSchema}
            onSubmit={async (values, { setSubmitting }) => {
              setSubmitting(true);
              try {
                await authService.forgotPassword(values.email);
                modernToast.auth.passwordResetSent();
                window.location.href = `/auth/reset-password?email=${encodeURIComponent(values.email)}`;
              } catch (err: any) {
                modernToast.auth.passwordResetError();
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Email Address</label>
                  <Field
                    name="email"
                    type="email"
                    className={clsx(
                      'w-full rounded-lg border bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition',
                      errors.email && touched.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
                    )}
                    placeholder="you@example.com"
                  />
                  <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-500" />
                </div>
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
                      Sending...
                    </span>
                  ) : (
                    'Send reset code'
                  )}
                </button>
              </Form>
            )}
          </Formik>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-8 py-6 text-center text-sm text-gray-600">
          Remember your password?{' '}
          <a href="/auth/login" className="font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2">
            Back to login
          </a>
        </div>
      </motion.div>
      <Toaster position="top-right" />
    </div>
  );
}