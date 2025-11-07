'use client';

import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { modernToast } from '@/utils/toast';
import AuthCard from '@/components/auth/AuthCard';
import { authService } from '@/services/authService';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, RefreshCw, CheckCircle, Clock, Shield } from 'lucide-react';

const VerifySchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  otp: Yup.string().min(4).max(8).required('Verification code is required'),
});

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  
  const email = searchParams.get('email') || '';

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    try {
      const emailInput = (document.querySelector('input[name="email"]') as HTMLInputElement)?.value;
      const emailToUse = emailInput || email;
      
      if (!emailToUse) {
        modernToast.warning('Enter email first');
        return;
      }
      
      await authService.requestVerifyEmail(emailToUse);
      modernToast.auth.verificationSent();
      setResendCooldown(60); // 60 second cooldown
    } catch (e: any) {
      modernToast.error('Failed to send code');
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <AuthCard
        title="Email Verified!"
        subtitle="Your account has been successfully verified"
        footer={
          <div className="text-center">
            <motion.button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Continue to Login
            </motion.button>
          </div>
        }
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center py-8"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Verification Complete!</h3>
          <p className="text-gray-600 text-lg">
            Welcome to LCJ! You can now access all features of your account.
          </p>
        </motion.div>
        <Toaster position="top-right" />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verify your email"
      subtitle="Enter the verification code sent to your email address"
      footer={
        <div className="text-center text-sm text-gray-700 space-y-4">
          <div>
            <motion.button
              onClick={handleResendCode}
              disabled={resendCooldown > 0 || isResending}
              className="font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto transition-colors duration-200"
              whileHover={{ scale: resendCooldown > 0 || isResending ? 1 : 1.05 }}
              whileTap={{ scale: resendCooldown > 0 || isResending ? 1 : 0.95 }}
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Resend in {resendCooldown}s</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Resend code</span>
                </>
              )}
            </motion.button>
          </div>
          <div>
            <motion.button
              onClick={() => router.push('/auth/login')}
              className="font-medium text-gray-600 hover:text-gray-800 flex items-center justify-center space-x-2 mx-auto transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to login</span>
            </motion.button>
          </div>
        </div>
      }
    >
      <Formik
        initialValues={{ email: email, otp: '' }}
        validationSchema={VerifySchema}
        onSubmit={async (values, { setSubmitting }) => {
          setSubmitting(true);
          try {
            await authService.confirmVerifyEmail(values.email, values.otp);
            modernToast.auth.verificationSuccess();
            setIsVerified(true);
          } catch (err: any) {
            modernToast.auth.verificationError();
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
              className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">Security Verification</p>
                  <p className="text-xs text-blue-700">
                    We sent a verification code to <strong className="text-blue-800">{values.email || 'your email'}</strong>
                  </p>
                </div>
              </div>
            </motion.div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email Address</label>
              <Field 
                name="email" 
                type="email" 
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                placeholder="you@example.com" 
              />
              <ErrorMessage name="email" component="div" className="mt-1 text-sm text-rose-500" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Verification Code</label>
              <Field 
                name="otp" 
                type="text" 
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-4 text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-center text-2xl tracking-widest font-mono" 
                placeholder="000000"
                maxLength="8"
              />
              <ErrorMessage name="otp" component="div" className="mt-1 text-sm text-rose-500" />
              <p className="mt-2 text-xs text-gray-500 text-center">
                Enter the {values.otp.length > 0 ? values.otp.length : '6'}-digit code from your email
              </p>
            </div>

            <motion.button 
              type="submit" 
              disabled={isSubmitting} 
              className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-4 font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60"
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Verify Email</span>
                </div>
              )}
            </motion.button>
          </Form>
        )}
      </Formik>

      <Toaster position="top-right" />
    </AuthCard>
  );
}