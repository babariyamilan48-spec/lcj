'use client';

import React from 'react';
import * as Yup from 'yup';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { modernToast } from '@/utils/toast';
import AuthCard from '@/components/auth/AuthCard';
import { authService } from '@/services/authService';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, CheckCircle, Lock } from 'lucide-react';

const ResetSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  otp: Yup.string().required('Reset code is required'),
  new_password: Yup.string().min(6, 'Min 6 characters').required('New password is required'),
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <AuthCard
      title="Reset password"
      subtitle="Enter the reset code you received and your new password"
      footer={
        <div className="text-center text-sm text-gray-700">
          <div className="mb-2">
            <button
              onClick={() => router.push('/auth/forgot-password')}
              className="font-semibold text-gray-900 underline underline-offset-4 hover:no-underline flex items-center justify-center space-x-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Resend code</span>
            </button>
          </div>
          <div>
            <button
              onClick={() => router.push('/auth/login')}
              className="font-semibold text-gray-900 underline underline-offset-4 hover:no-underline flex items-center justify-center space-x-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to login</span>
            </button>
          </div>
        </div>
      }
    >
      <Formik
        initialValues={{ email: email, otp: '', new_password: '' }}
        validationSchema={ResetSchema}
        onSubmit={async (values, { setSubmitting }) => {
          setSubmitting(true);
          try {
            await authService.resetPassword(values.email, values.otp, values.new_password);
            modernToast.auth.passwordResetSuccess();
            setTimeout(() => router.push('/auth/login'), 2000);
          } catch (err: any) {
            modernToast.auth.passwordResetError();
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, values }) => (
          <Form className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4"
            >
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Reset code sent</p>
                  <p className="text-xs text-blue-700">
                    Check your email <strong>{values.email || 'address'}</strong> for the reset code
                  </p>
                </div>
              </div>
            </motion.div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email Address</label>
              <Field 
                name="email" 
                type="email" 
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-600" 
                placeholder="you@example.com" 
              />
              <ErrorMessage name="email" component="div" className="mt-1 text-sm text-rose-500" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Reset Code</label>
              <Field 
                name="otp" 
                type="text" 
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-600 text-center text-2xl tracking-widest" 
                placeholder="123456"
                maxLength="8"
              />
              <ErrorMessage name="otp" component="div" className="mt-1 text-sm text-rose-500" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">New Password</label>
              <Field 
                name="new_password" 
                type="password" 
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-600" 
                placeholder="••••••••" 
              />
              <ErrorMessage name="new_password" component="div" className="mt-1 text-sm text-rose-500" />
              <p className="mt-2 text-xs text-gray-500">
                Use at least 6 characters with a mix of letters and numbers
              </p>
            </div>

            <motion.button 
              type="submit" 
              disabled={isSubmitting} 
              className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-purple-700 disabled:opacity-60"
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Resetting...</span>
                </div>
              ) : (
                <span>Reset Password</span>
              )}
            </motion.button>
          </Form>
        )}
      </Formik>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-6 p-4 bg-gray-50 rounded-xl"
      >
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Password Requirements</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• At least 6 characters long</li>
          <li>• Mix of letters and numbers recommended</li>
          <li>• Avoid common passwords</li>
          <li>• Don't reuse old passwords</li>
        </ul>
      </motion.div>

      <Toaster position="top-right" />
    </AuthCard>
  );
}