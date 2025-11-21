'use client';

import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { modernToast } from '@/utils/toast';
import { authAPI } from '@/services/api';
import clsx from 'clsx';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

function VerifyEmailPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params?.get('email') || '';

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const otpValue = useMemo(() => otp.join(''), [otp]);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputsRef.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (text.length) {
      e.preventDefault();
      const next = text.split('').concat(Array(OTP_LENGTH - text.length).fill(''));
      setOtp(next);
      const lastIdx = Math.min(text.length, OTP_LENGTH) - 1;
      if (lastIdx >= 0) inputsRef.current[lastIdx]?.focus();
    }
  };

  const submitOTP = async () => {
    if (otpValue.length !== OTP_LENGTH) {
      modernToast.error('Enter 6-digit code');
      return;
    }
    setSubmitting(true);
    try {
      await authAPI.confirmEmailOTP({ email, otp: otpValue });
      modernToast.auth.verificationSuccess();
      setTimeout(() => router.push('/'), 1000);
    } catch (err: any) {
      const detail = err?.response?.data?.error || err?.response?.data?.message || 'Invalid or expired code';
      modernToast.auth.verificationError();
    } finally {
      setSubmitting(false);
    }
  };

  const resendOTP = async () => {
    if (secondsLeft > 0) return;
    setResending(true);
    try {
      await authAPI.requestEmailOTP({ email });
      modernToast.auth.verificationSent();
      setSecondsLeft(RESEND_SECONDS);
    } catch (err: any) {
      const detail = err?.response?.data?.error || err?.response?.data?.message || 'Could not resend code';
      modernToast.error('Failed to resend');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="mx-auto flex min-h-screen items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl"
        >
          {/* Header with Logo */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center font-bold text-lg"
            >
              જીવન
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
            <p className="mt-2 text-sm text-gray-600">Enter the verification code sent to your email address</p>
          </div>

          {/* Security Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-orange-900">Security Verification</h3>
                <p className="mt-1 text-sm text-orange-800">We sent a verification code to <span className="font-semibold">{email}</span></p>
              </div>
            </div>
          </motion.div>

          {/* Email Display */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">Email Address</label>
            <div className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900">
              {email}
            </div>
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-gray-700">Verification Code</label>
            <div className="mb-2 flex items-center justify-center gap-2">
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <motion.input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[i]}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  ref={(el) => { inputsRef.current[i] = el; }}
                  className={clsx(
                    'h-12 w-12 rounded-lg border-2 bg-white text-center text-xl font-semibold outline-none transition',
                    otp[i] ? 'border-orange-500 text-orange-600' : 'border-gray-300 text-gray-900 focus:border-orange-500'
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                />
              ))}
            </div>
            <p className="text-center text-xs text-gray-500">Enter the 6-digit code from your email</p>
          </div>

          {/* Verify Button */}
          <button
            onClick={submitOTP}
            disabled={submitting || otpValue.length !== OTP_LENGTH}
            className={clsx(
              'mb-4 w-full rounded-lg px-4 py-3 font-semibold text-white shadow-sm transition flex items-center justify-center gap-2',
              submitting || otpValue.length !== OTP_LENGTH
                ? 'bg-orange-300 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600'
            )}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {submitting ? 'Verifying...' : 'Verify Email'}
          </button>

          {/* Resend Code */}
          <div className="mb-4 text-center">
            <button
              onClick={resendOTP}
              disabled={resending || secondsLeft > 0}
              className={clsx(
                'text-sm font-semibold transition flex items-center justify-center gap-2 w-full py-2',
                resending || secondsLeft > 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-orange-600 hover:text-orange-700'
              )}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
            </button>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <button
              onClick={() => router.push('/auth/login')}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition flex items-center justify-center gap-2 w-full py-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to login
            </button>
          </div>
        </motion.div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    }>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
