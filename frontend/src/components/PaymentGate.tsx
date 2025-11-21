'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Lock, CheckCircle } from 'lucide-react';
import RazorpayCheckout from './RazorpayCheckout';
import { getCurrentUserId } from '@/utils/userUtils';
import { paymentService } from '@/services/paymentService';

interface PaymentGateProps {
  onPaymentComplete: () => void;
  children?: React.ReactNode;
}

const PaymentGate: React.FC<PaymentGateProps> = ({ onPaymentComplete, children }) => {
  const [paymentCompleted, setPaymentCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check payment status on mount
  useEffect(() => {
    const checkPaymentStatus = async (retryCount = 0) => {
      try {
        const userId = getCurrentUserId();
        if (!userId) {
          console.error('❌ User ID not found');
          setError('User not found. Please log in.');
          setPaymentCompleted(false);
          setLoading(false);
          return;
        }

        console.log('🔍 Checking payment status for user:', userId);
        
        // Use paymentService instead of raw fetch
        const status = await paymentService.checkPaymentStatus(userId);
        console.log('✅ Payment status response:', status);
        console.log('✅ Payment completed:', status.payment_completed);
        
        setPaymentCompleted(status.payment_completed);
        setError(null);
        setLoading(false);
      } catch (err: any) {
        console.error('❌ Error checking payment status:', err);
        console.error('❌ Error details:', err.response?.data || err.message);
        console.error('❌ Error status:', err.response?.status);
        
        // Retry once if there's a network error
        if (retryCount < 1 && !err.response?.status) {
          console.log('🔄 Retrying payment status check...');
          setTimeout(() => checkPaymentStatus(retryCount + 1), 1000);
          return;
        }
        
        // If error is 404 (user not found), assume payment not completed
        if (err.response?.status === 404) {
          setPaymentCompleted(false);
          setError(null);
        } else {
          setError('Failed to check payment status. Please try again.');
          setPaymentCompleted(false);
        }
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, []);

  const handlePaymentSuccess = () => {
    setPaymentCompleted(true);
    onPaymentComplete();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full"
        />
      </div>
    );
  }

  // Payment completed - show children
  if (paymentCompleted) {
    return <>{children}</>;
  }

  // Payment not completed - show payment gate
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-lg">
              <Lock className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            તમારા કેરિયર પાથ અનલોક કરો
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            તમામ કેરિયર મૂલ્યાંકન પરીક્ષાઓ ઍક્સેસ કરવા માટે એક વાર પેમેન્ટ પૂર્ણ કરો
          </p>
          <p className="text-gray-500">
            તમારા કેરિયર સફરને માર્ગદર્શન આપવા માટે વ્યક્તિગતકૃત અંતર્દૃષ્ટિ મેળવો
          </p>
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
        >
          {[
            {
              icon: '🧠',
              title: 'વ્યક્તિત્વ પરીક્ષણો',
              description: 'તમારા વ્યક્તિત્વ પ્રકારને શોધો'
            },
            {
              icon: '💼',
              title: 'કેરિયર માર્ગદર્શન',
              description: 'કેરિયર ભલામણો મેળવો'
            },
            {
              icon: '📊',
              title: 'વિગતવાર અહેવાલો',
              description: 'વ્યાપક વિશ્લેષણ અને અંતર્દૃષ્ટિ'
            }
          ].map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100"
            >
              <div className="text-3xl mb-3">{benefit.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Payment Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-white via-orange-50 to-white rounded-3xl shadow-2xl p-8 mb-8 border-2 border-orange-200"
        >
          {/* Price Display */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <p className="text-sm font-semibold opacity-90 mb-2">કુલ કિંમત</p>
            <h2 className="text-5xl font-bold mb-2">₹449</h2>
            <p className="text-sm opacity-90">એક વાર પેમેન્ટ • આજીવન ઍક્સેસ</p>
          </motion.div>

          {/* Payment Steps */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">
              પેમેન્ટ કેવી રીતે કરવી
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  step: '1',
                  title: 'બટન પર ક્લિક કરો',
                  description: '"પેમેન્ટ કરો" બટન પર ક્લિક કરો'
                },
                {
                  step: '2',
                  title: 'પેમેન્ટ વિધિ પસંદ કરો',
                  description: 'કાર્ડ, UPI અથવા નેટ બેંકિંગ'
                },
                {
                  step: '3',
                  title: 'પૂર્ણ કરો',
                  description: 'તરત જ ઍક્સેસ મેળવો'
                }
              ].map((item, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {item.step}
                    </div>
                    <h4 className="font-bold text-gray-900">{item.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800">ભૂલ</h4>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Payment Component */}
          <RazorpayCheckout onPaymentSuccess={handlePaymentSuccess} />
        </motion.div>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 mb-8"
        >
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            તમે શું મેળવો છો
          </h3>
          <ul className="space-y-3">
            {[
              '7 વ્યાપક કેરિયર મૂલ્યાંકન પરીક્ષાઓ ઍક્સેસ',
              'વ્યક્તિગતકૃત કેરિયર ભલામણો',
              'વિગતવાર વ્યક્તિત્વ અને યોગ્યતા વિશ્લેષણ',
              'તમારા પરિણામોમાં આજીવન ઍક્સેસ',
              'ડાઉનલોડ માટે PDF અહેવાલો',
              'એક વાર પેમેન્ટ - કોઈ પુનરાવર્તિત ચાર્જ નથી'
            ].map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-gray-700">
                <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Security Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Razorpay દ્વારા સુરક્ષિત પેમેન્ટ
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PaymentGate;
