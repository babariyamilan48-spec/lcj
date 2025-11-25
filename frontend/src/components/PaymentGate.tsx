'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Lock, CheckCircle, Zap, Award, TrendingUp, Shield, Brain, BarChart3 } from 'lucide-react';
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements - Orange theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-10 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-10 left-10 w-72 h-72 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-15"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-5xl relative z-10"
      >
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-16 px-2 sm:px-0">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100, damping: 15 }}
            className="mb-4 md:mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 md:w-28 h-20 md:h-28 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl md:rounded-3xl shadow-2xl relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br from-orange-400 to-orange-500 opacity-0"
              />
              <Zap className="w-10 md:w-14 h-10 md:h-14 text-white relative z-10" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl sm:text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-2 md:mb-4 leading-tight"
          >
            તમારા કેરિયર સફર શરૂ કરો
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-2 md:mb-3 font-semibold"
          >
            સમગ્ર કેરિયર મૂલ્યાંકન સ્યુટ અનલોક કરો
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-base sm:text-lg text-gray-600"
          >
            વ્યક્તિગતકૃત અંતર્દૃષ્ટિ અને વ્યાવસાયિક માર્ગદર્શન મેળવો
          </motion.p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12 px-2 sm:px-0">
          {/* Left Column - Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1 space-y-3 md:space-y-4"
          >
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-8">તમે શું મેળવો છો</h3>
            
            {[
              { icon: Award, title: '7 પરીક્ષણો', desc: 'વ્યાપક મૂલ્યાંકન', color: 'from-orange-500 to-orange-600' },
              { icon: TrendingUp, title: 'વિગતવાર અહેવાલો', desc: 'વ્યક્તિગત વિશ્લેષણ', color: 'from-orange-400 to-orange-500' },
              { icon: Shield, title: 'આજીવન ઍક્સેસ', desc: 'કોઈ પુનરાવર્તિત ચાર્જ નથી', color: 'from-orange-600 to-orange-700' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ x: 8, transition: { duration: 0.2 } }}
                className="bg-white rounded-xl md:rounded-2xl p-3 md:p-5 border border-gray-100 hover:border-orange-300 hover:shadow-xl transition-all group cursor-pointer"
              >
                <div className="flex items-start gap-3 md:gap-4">
                  <div className={`flex-shrink-0 w-10 md:w-12 h-10 md:h-12 bg-gradient-to-br ${item.color} rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all`}>
                    <item.icon className="w-5 md:w-6 h-5 md:h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm md:text-base">{item.title}</h4>
                    <p className="text-xs md:text-sm text-gray-600 mt-1">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right Column - Payment */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-10 border border-gray-100 relative overflow-hidden">
              {/* Decorative gradient background */}
              <div className="absolute top-0 right-0 w-32 md:w-40 h-32 md:h-40 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full -mr-16 md:-mr-20 -mt-16 md:-mt-20 opacity-40" />
              
              <div className="relative z-10">
                {/* Price Display */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-center mb-6 md:mb-10 bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100 rounded-2xl md:rounded-3xl p-6 md:p-10 border-2 border-orange-200 relative overflow-hidden"
                >
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                  />
                  <div className="relative z-10">
                    <p className="text-xs md:text-sm font-semibold text-orange-700 mb-2 md:mb-3 uppercase tracking-wider">કુલ કિંમત</p>
                    <div className="flex items-center justify-center gap-2 mb-2 md:mb-3">
                      <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">₹449</h2>
                    </div>
                    <p className="text-xs md:text-base text-gray-700 font-medium">
                      <span className="text-green-600 font-bold">✓ એક વાર પેમેન્ટ</span> • આજીવન ઍક્સેસ
                    </p>
                  </div>
                </motion.div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-800">ભૂલ</h4>
                      <p className="text-red-700 text-sm mt-1">{error}</p>
                    </div>
                  </motion.div>
                )}

                {/* Payment Component */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mb-6"
                >
                  <RazorpayCheckout onPaymentSuccess={handlePaymentSuccess} />
                </motion.div>

                {/* Security Info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl md:rounded-3xl p-3 md:p-5 border border-orange-200"
                >
                  <p className="text-xs md:text-sm text-gray-700 flex items-center justify-center gap-2">
                    <Shield className="w-4 md:w-5 h-4 md:h-5 text-orange-600 flex-shrink-0" />
                    <span className="font-medium">Razorpay દ્વારા સુરક્ષિત • તમારી માહિતી સુરક્ષિત છે</span>
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-4 md:mt-6 flex flex-wrap items-center justify-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600 px-2"
            >
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 md:w-4 h-3 md:h-4 text-green-600 flex-shrink-0" />
                <span className="whitespace-nowrap">100% સુરક્ષિત</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 md:w-4 h-3 md:h-4 text-green-600 flex-shrink-0" />
                <span className="whitespace-nowrap">તાત્ક્ષણિક ઍક્સેસ</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full hidden sm:block"></div>
              <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-start">
                <CheckCircle className="w-3 md:w-4 h-3 md:h-4 text-green-600 flex-shrink-0" />
                <span className="whitespace-nowrap">કોઈ પ્રશ્ન પૂછ્યા વિના રીફંડ</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Features List - Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-gradient-to-r from-orange-50 via-orange-50 to-orange-100 rounded-2xl md:rounded-3xl p-6 md:p-12 border border-orange-200 relative overflow-hidden mx-2 sm:mx-0"
        >
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-48 md:w-96 h-48 md:h-96 bg-orange-300 rounded-full -ml-24 md:-ml-48 -mt-24 md:-mt-48" />
            <div className="absolute bottom-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-orange-300 rounded-full -mr-24 md:-mr-48 -mb-24 md:-mb-48" />
          </div>

          <div className="relative z-10">
            <h3 className="font-bold text-gray-900 mb-6 md:mb-12 text-center text-xl md:text-2xl">
              તમારા મૂલ્યાંકન પછી શું?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              {[
                {
                  num: '1',
                  title: 'પરીક્ષણો લો',
                  desc: 'તમારા પોતાના ગતિમાં 7 વ્યાપક પરીક્ષણો પૂર્ણ કરો',
                  icon: Brain
                },
                {
                  num: '2',
                  title: 'વિશ્લેષણ મેળવો',
                  desc: 'વ્યક્તિગતકૃત અહેવાલો અને ક્રિયાત્મક સૂચનો',
                  icon: BarChart3
                },
                {
                  num: '3',
                  title: 'કેરિયર આગળ વધો',
                  desc: 'તમારા કેરિયર લક્ષ્યો તરફ આત્મવિશ્વાસ સાથે આગળ વધો',
                  icon: TrendingUp
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="text-center bg-white rounded-xl md:rounded-2xl p-4 md:p-8 border border-gray-100 hover:border-orange-300 hover:shadow-xl transition-all group"
                >
                  <div className="inline-flex items-center justify-center w-12 md:w-16 h-12 md:h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl md:rounded-2xl text-white font-bold mb-3 md:mb-4 shadow-lg group-hover:shadow-xl transition-all">
                    <step.icon className="w-6 md:w-8 h-6 md:h-8" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2 md:mb-3 text-base md:text-lg">{step.title}</h4>
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PaymentGate;
