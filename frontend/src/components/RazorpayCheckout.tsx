'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader, Lock, CreditCard } from 'lucide-react';
import { getCurrentUserId } from '@/utils/userUtils';
import { paymentService } from '@/services/paymentService';
import { tokenStore } from '@/services/token';

interface RazorpayCheckoutProps {
  onPaymentSuccess: () => void;
  onPaymentCancel?: () => void;
  amount?: number;
  planType: string;
}

interface OrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  razorpay_key_id: string;
  environment: string;
}

interface VerifyResponse {
  success: boolean;
  message: string;
  payment_completed: boolean;
  payment_id?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({
  onPaymentSuccess,
  onPaymentCancel,
  amount,
  planType
}) => {
  const router = useRouter();
  const baseAmountPaise = amount ?? 49900; // expect paise
  const couponCodePublic = process.env.NEXT_PUBLIC_RAZORPAY_COUPON_CODE?.toLowerCase();
  const couponAmountPublic = process.env.NEXT_PUBLIC_RAZORPAY_COUPON_AMOUNT
    ? Number(process.env.NEXT_PUBLIC_RAZORPAY_COUPON_AMOUNT)
    : undefined;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [environment, setEnvironment] = useState<'test' | 'live'>('test');
  const [couponCode, setCouponCode] = useState('');
  const [effectiveAmount, setEffectiveAmount] = useState<number | undefined>(baseAmountPaise);
  const [couponApplied, setCouponApplied] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [statusChecked, setStatusChecked] = useState(false);
  const [postCheckInProgress, setPostCheckInProgress] = useState(false);
  const [forceNewNext, setForceNewNext] = useState(false);

  // Update displayed amount when user types coupon (using public env for preview)
  useEffect(() => {
    if (
      couponCodePublic &&
      couponAmountPublic &&
      couponCode.trim().toLowerCase() === couponCodePublic
    ) {
      setEffectiveAmount(couponAmountPublic);
      setCouponApplied(true);
    } else {
      setEffectiveAmount(baseAmountPaise);
      setCouponApplied(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponCode]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Razorpay script loaded');
      setScriptReady(true);
    };
    script.onerror = () => {
      setError('Failed to load Razorpay. Please refresh the page.');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // PaymentGate already calls /payment/status before showing this component; skip duplicate request.
  useEffect(() => {
    setStatusChecked(true);
  }, []);

  const normalizeError = (err: any, defaultMsg: string) => {
    const msg = err instanceof Error ? err.message : (err?.response?.data?.detail || defaultMsg);
    if (typeof msg === 'string') {
      if (msg.toLowerCase().includes('connection aborted') || msg.toLowerCase().includes('remote end closed')) {
        return 'Payment gateway is temporarily unreachable. Please try again.';
      }
      if (msg.toLowerCase().includes('network error')) {
        return 'Network issue. Please check connectivity and retry.';
      }
      if (msg.toLowerCase().includes('401') || msg.toLowerCase().includes('unauthorized')) {
        return 'Your session has expired. Please log in again.';
      }
      return msg;
    }
    return defaultMsg;
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      // prevent duplicate clicks
      if (loading || verifying) return;

      const userId = getCurrentUserId();
      if (!userId) {
        setError('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      if (!scriptReady || !window.Razorpay) {
        setError('Payment is still loading. Please wait a moment and try again.');
        setLoading(false);
        return;
      }

      // Step 1: Create order using paymentService
      console.log('📝 Creating Razorpay order...');
      const orderData = await paymentService.createOrder({
        user_id: userId,
        amount: amount || undefined,
        plan_type: planType,
        coupon_code: couponCode?.trim() || undefined,
        force_new: forceNewNext || undefined,
      });

      // Store order id to avoid re-creating on rerender
      setOrderId(orderData.order_id);
      setForceNewNext(false);

      // If backend indicates already paid, short-circuit without opening Razorpay
      if (orderData.paid) {
        setSuccess(true);
        setLoading(false);
        onPaymentSuccess();
        router.push('/home');
        return;
      }

      console.log('✅ Order created:', orderData.order_id);
      setEnvironment(orderData.environment as 'test' | 'live');
      setEffectiveAmount(orderData.amount);
      setCouponApplied(Boolean(orderData.coupon_applied));

      // Step 2: Open Razorpay checkout
      if (!window.Razorpay) {
        throw new Error('Razorpay is not loaded');
      }

      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Life Career Journey',
        description: 'Career Assessment Payment',
        order_id: orderData.order_id,
        handler: async (response: any) => {
          await handlePaymentSuccess(response, userId);
        },
        prefill: {
          email: localStorage.getItem('userEmail') || '',
        },
        theme: {
          color: '#FF8C00', // Orange color matching your brand
        },
        // Restrict payment methods to Card, UPI, and Net Banking only
        method: {
          netbanking: true,
          card: true,
          upi: true,
          wallet: false,
          emi: false,
          emandate: false,
          paylater: false,
        },
        modal: {
          ondismiss: async () => {
            console.log('❌ Payment cancelled/closed by user');
            setLoading(false);
            // If user closes and later retries, force a fresh order instead of reusing an older one
            setOrderId(null);
            setForceNewNext(true);
            if (onPaymentCancel) {
              onPaymentCancel();
            }
            // Fallback: check status in case Razorpay marked paid but handler didn’t fire
            await checkStatusAndRedirect();
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      const errorMessage = normalizeError(err, 'Payment failed');
      console.error('❌ Payment error:', errorMessage);

      if (errorMessage.toLowerCase().includes('session has expired')) {
        setError(errorMessage);
        setLoading(false);
        router.push('/auth/login');
        return;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response: any, userId: string) => {
    try {
      setVerifying(true);
      console.log('🔐 Verifying payment signature...');

      // Step 3: Verify payment signature using paymentService
      const verifyData = await paymentService.verifyPayment({
        user_id: userId,
        order_id: response.razorpay_order_id || orderId || '',
        payment_id: response.razorpay_payment_id,
        signature: response.razorpay_signature,
      });

      console.log('✅ Payment verified:', verifyData.payment_id);

      // Only proceed if backend says paid
      if (verifyData.payment_completed || verifyData.paid) {
        setSuccess(true);
        setVerifying(false);
        setTimeout(() => {
          onPaymentSuccess();
          router.push('/home');
        }, 500);
      } else {
        setError('Payment verification incomplete. Please contact support.');
        setVerifying(false);
      }
    } catch (err) {
      const errorMessage = normalizeError(err, 'Verification failed');
      console.error('❌ Verification error:', errorMessage);

      if (errorMessage.toLowerCase().includes('session has expired')) {
        setError(errorMessage);
        setVerifying(false);
        router.push('/auth/login');
        return;
      }

      setError(errorMessage);
      setVerifying(false);
      // Last-resort check: if verify failed but payment might have been captured, poll status once
      await checkStatusAndRedirect();
    }
  };

  const checkStatusAndRedirect = async () => {
    if (postCheckInProgress) return;
    try {
      setPostCheckInProgress(true);
      const userId = getCurrentUserId();
      if (!userId) return;
      const status = await paymentService.checkPaymentStatus(userId);
      if (status.payment_completed) {
        setSuccess(true);
        setLoading(false);
        setVerifying(false);
        onPaymentSuccess();
        router.push('/home');
      }
    } catch (e) {
      console.warn('Fallback status check failed', e);
    } finally {
      setPostCheckInProgress(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!statusChecked && (
        <div className="text-sm text-gray-500 mb-3">Checking payment status...</div>
      )}
      <AnimatePresence mode="wait">
        {/* Success State */}
        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 text-center border border-green-200"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">પેમેન્ટ સફળ!</h3>
            <p className="text-gray-600 mb-4">
              તમારી પેમેન્ટ ચકાસી દેવામાં આવી છે. તમે હવે તમામ પરીક્ષાઓ ઍક્સેસ કરી શકો છો.
            </p>
            <p className="text-sm text-gray-500">પુનર્નિર્દેશન...</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && !success && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800">પેમેન્ટ ભૂલ</h4>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <button
                  onClick={() => {
                    // After an error, retry should create a fresh order
                    setOrderId(null);
                    setForceNewNext(true);
                    handlePayment();
                  }}
                  className="mt-3 text-sm font-semibold text-orange-700 hover:text-orange-800 underline"
                >
                  ફરી પ્રયાસ કરો
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {(loading || verifying) && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-blue-50 rounded-xl p-8 text-center border border-blue-200"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="mb-4"
            >
              <Loader className="w-12 h-12 text-blue-500 mx-auto" />
            </motion.div>
            <p className="text-gray-700 font-medium">
              {verifying ? 'તમારી પેમેન્ટ ચકાસી રહ્યો છો...' : 'પ્રમાણિત છો...'}
            </p>
            <p className="text-gray-500 text-sm mt-2">કૃપાયુ પ્રતીક્ષા કરો</p>
          </motion.div>
        )}

        {/* Main Button State */}
        {!loading && !verifying && !success && (
          <motion.div
            key="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-3"
          >
            {/* Coupon input - HIDDEN */}
            {/*
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <label className="text-sm font-semibold text-gray-700">કૂપન કોડ</label>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {couponApplied && (
                  <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    કૂપન લાગુ થયું
                  </span>
                )}
              </div>
            </div>
            */}

            <motion.button
              onClick={handlePayment}
              disabled={loading || verifying}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-green-500 via-green-550 to-green-600 hover:from-green-600 hover:via-green-650 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-2xl hover:shadow-3xl border-2 border-green-400 text-lg md:text-xl relative overflow-hidden group"
            >
              {/* Animated background shine effect */}
              <motion.div
                animate={{ x: ['0%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 group-hover:opacity-30"
              />
              <div className="relative z-10 flex items-center justify-center gap-3 w-full">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CreditCard className="w-6 md:w-7 h-6 md:h-7" />
                </motion.div>
                <span className="font-extrabold">₹{(((effectiveAmount ?? baseAmountPaise)) / 100).toFixed(0)} પેમેન્ટ કરો</span>
              </div>
            </motion.button>

            {/* Environment Badge */}
            <div className="flex justify-center mt-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${environment === 'live'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
                }`}>
                {environment === 'live' ? '🔴 લૈવ મોડ' : '🟡 પરીક્ષણ મોડ'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RazorpayCheckout;
