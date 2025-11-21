'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader, Lock } from 'lucide-react';
import { getCurrentUserId } from '@/utils/userUtils';
import { paymentService } from '@/services/paymentService';

interface RazorpayCheckoutProps {
  onPaymentSuccess: () => void;
  onPaymentCancel?: () => void;
  amount?: number;
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
  amount
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [environment, setEnvironment] = useState<'test' | 'live'>('test');

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Razorpay script loaded');
    };
    script.onerror = () => {
      setError('Failed to load Razorpay. Please refresh the page.');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = getCurrentUserId();
      if (!userId) {
        setError('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      // Step 1: Create order using paymentService
      console.log('📝 Creating Razorpay order...');
      const orderData = await paymentService.createOrder({
        user_id: userId,
        amount: amount || undefined,
      });

      console.log('✅ Order created:', orderData.order_id);
      setEnvironment(orderData.environment as 'test' | 'live');

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
          ondismiss: () => {
            console.log('❌ Payment cancelled by user');
            setLoading(false);
            if (onPaymentCancel) {
              onPaymentCancel();
            }
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      console.error('❌ Payment error:', errorMessage);
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
        order_id: response.razorpay_order_id,
        payment_id: response.razorpay_payment_id,
        signature: response.razorpay_signature,
      });

      console.log('✅ Payment verified:', verifyData.payment_id);

      setSuccess(true);
      setVerifying(false);

      // Call success callback after showing success message
      setTimeout(() => {
        onPaymentSuccess();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      console.error('❌ Verification error:', errorMessage);
      setError(errorMessage);
      setVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
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
            className="space-y-4"
          >
            <motion.button
              onClick={handlePayment}
              disabled={loading || verifying}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-gradient-to-r from-orange-500 via-orange-550 to-red-500 hover:from-orange-600 hover:via-orange-650 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-2xl hover:shadow-3xl border-2 border-orange-300 text-lg"
            >
              <Lock className="w-6 h-6" />
              <span>₹449 માટે પેમેન્ટ કરો</span>
            </motion.button>

            {/* Payment Info */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                🔒 Razorpay દ્વારા સુરક્ષિત • તમારી માહિતી સુરક્ષિત છે
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-blue-900">🔒 સુરક્ષિત પેમેન્ટ</span>
                <br />
                તમારી પેમેન્ટ Razorpay દ્વારા સુરક્ષિત પ્રમાણિત છે
              </p>
            </div>

            {/* Environment Badge */}
            <div className="flex justify-center">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                environment === 'live'
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
