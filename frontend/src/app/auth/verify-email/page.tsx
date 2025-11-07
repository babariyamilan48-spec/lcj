'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { modernToast } from '@/utils/toast';
import { authAPI } from '@/services/api';
import clsx from 'clsx';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';

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
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <motion.h1 className="mb-2 text-center text-3xl font-semibold text-gray-900" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            Verify your email
          </motion.h1>
          <p className="mb-6 text-center text-gray-600">We sent a 6-digit code to <span className="font-semibold text-gray-900">{email}</span></p>

          <div className="mb-6 flex items-center justify-center gap-3">
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
                  'h-12 w-12 rounded-xl border border-gray-300 bg-white text-center text-xl text-gray-900 outline-none transition focus:border-gray-600'
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              />
            ))}
          </div>

          <button
            onClick={submitOTP}
            disabled={submitting || otpValue.length !== OTP_LENGTH}
            className={clsx('mb-3 w-full rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-black disabled:opacity-60')}
          >
            Confirm
          </button>

          <div className="mt-2 flex items-center justify-between text-gray-700">
            <span className="text-sm">Didn’t receive the code?</span>
            <button
              onClick={resendOTP}
              disabled={resending || secondsLeft > 0}
              className={clsx('text-sm font-semibold text-gray-900 hover:text-black disabled:opacity-50')}
            >
              {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

