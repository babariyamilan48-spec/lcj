'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Zap, Award, TrendingUp, Shield, BarChart3, MessageSquare, Star, Lock } from 'lucide-react';
import RazorpayCheckout from './RazorpayCheckout';
import { getCurrentUserId, getCurrentUserEmail } from '@/utils/userUtils';
import { paymentService } from '@/services/paymentService';
import { getApiBaseUrl } from '@/config/api';
import { tokenStore } from '@/services/token';

interface PaymentGateProps {
  onPaymentComplete: () => void;
  children?: React.ReactNode;
}

const PaymentGate: React.FC<PaymentGateProps> = ({ onPaymentComplete, children }) => {
  const [paymentCompleted, setPaymentCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'counseling'>('counseling');
  const paymentSectionRef = useRef<HTMLDivElement>(null);
  const [isBypass, setIsBypass] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

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

        // Bypass if email is in whitelist
        const email = getCurrentUserEmail()?.toLowerCase();
        const bypassList = (process.env.NEXT_PUBLIC_BYPASS_PAYMENT_EMAILS || '')
          .split(',')
          .map(e => e.trim().toLowerCase())
          .filter(Boolean);

        console.log('🔍 [PaymentGate] Checking bypass:', { email, bypassList, envVar: process.env.NEXT_PUBLIC_BYPASS_PAYMENT_EMAILS });

        if (email && bypassList.includes(email)) {
          console.log('✅ [PaymentGate] BYPASS ACTIVATED for:', email);
          setIsBypass(true);
          setPaymentCompleted(true);
          setLoading(false);
          return;
        }

        console.log('🔍 Checking payment status for user:', userId);

        const status = await paymentService.checkPaymentStatus(userId);
        console.log('✅ Payment status response:', status);

        setPaymentCompleted(status.payment_completed);
        setError(null);
        setLoading(false);
      } catch (err: any) {
        console.error('❌ Error checking payment status:', err);

        if (retryCount < 1 && !err.response?.status) {
          setTimeout(() => checkPaymentStatus(retryCount + 1), 1000);
          return;
        }

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

  const handleResetTests = async () => {
    setResetMessage(null);
    const userId = getCurrentUserId();
    if (!userId) {
      setError('User ID not found. Please log in.');
      return;
    }
    if (!confirm('Reset all test attempts for this account? This cannot be undone.')) return;
    try {
      setResetting(true);
      const token = tokenStore.getAccessToken() || localStorage.getItem('at') || localStorage.getItem('access_token');
      const resp = await fetch(`${getApiBaseUrl()}/api/v1/question_service/test-results/reset-user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.detail || 'Failed to reset tests');
      setResetMessage('All tests reset successfully.');
    } catch (e: any) {
      setResetMessage(e.message || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  const handlePlanSelect = (planId: 'counseling') => {
    setSelectedPlan(planId);
    setTimeout(() => {
      paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

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

  if (paymentCompleted) {
    return (
      <>
        {isBypass && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-100 via-orange-50 to-amber-100 border-2 border-amber-400 text-amber-900 px-4 py-4 rounded-xl mb-6 shadow-md"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧪</span>
                <div>
                  <p className="font-bold text-sm">Demo Mode Active</p>
                  <p className="text-xs text-amber-700">This is a demo account with unlimited test resets</p>
                </div>
              </div>
              <button
                onClick={handleResetTests}
                disabled={resetting}
                className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 bg-white border-2 border-amber-400 rounded-lg hover:bg-amber-50 hover:border-amber-500 transition-all disabled:opacity-60 shadow-sm"
              >
                <span>{resetting ? '⏳ Resetting...' : '🔄 Reset All Tests'}</span>
              </button>
            </div>
          </motion.div>
        )}
        {resetMessage && (
          <div className="mb-4 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{resetMessage}</div>
        )}
        {children}
      </>
    );
  }

  const plans = [
    {
      id: 'counseling' as const,
      name: 'પરીક્ષણ + પરામર્શ',
      englishName: 'Test + Counselling',
      price: '499',
      popular: true,
      features: [
        '૭ વ્યાપક કેરિયર પરીક્ષણો',
        'વિગતવાર ઓનલાઇન અહેવાલ',
        'નિષ્ણાત પરામર્શ (Counselling)',
        'વ્યક્તિગત કેરિયર રોડમેપ',
        '૧-ઓન-૧ માર્ગદર્શન',
        'આજીવન ઍક્સેસ'
      ],
      color: 'orange',
      icon: Star
    }
  ];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-10 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-10 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-15"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl relative z-10 py-8 md:py-12"
      >
        {/* Header Section */}
        <div className="text-center mb-10 md:mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text text-transparent mb-4 leading-tight"
          >
            તમારા કેરિયર માટે યોગ્ય પ્લાન પસંદ કરો
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg sm:text-xl text-gray-700 font-medium"
          >
            વ્યક્તિગત અંતર્દૃષ્ટિ અને નિષ્ણાત માર્ગદર્શન સાથે તમારી સફળતાની સફર શરૂ કરો
          </motion.p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -10 }}
              onClick={() => handlePlanSelect(plan.id)}
              className={`relative bg-white rounded-3xl p-8 border-2 transition-all cursor-pointer ${selectedPlan === plan.id
                ? 'border-orange-500 shadow-2xl scale-105 z-20'
                : 'border-gray-100 shadow-md hover:border-gray-300 z-10'
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                  <Star className="w-4 h-4 fill-white" />
                  સૌથી લોકપ્રિય
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500 font-medium">{plan.englishName}</p>
                </div>
                <div className={`p-3 rounded-2xl bg-orange-50 text-orange-600`}>
                  <plan.icon size={28} />
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-black text-gray-900">₹{plan.price}</span>
                  <span className="text-gray-500 font-medium">/ એક વાર પેમેન્ટ</span>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className={`w-5 h-5 text-green-500 mt-0.5 flex-shrink-0`} />
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <div className={`w-full py-4 rounded-2xl font-bold text-center transition-all ${selectedPlan === plan.id
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-orange-50 text-orange-700 border border-orange-200'
                }`}>
                {selectedPlan === plan.id ? 'આ પ્લાન પસંદ કરેલ છે' : 'પસંદ કરો'}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Payment Summary & Checkout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="max-w-2xl mx-auto"
          ref={paymentSectionRef}
        >
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-gray-100 text-center">
            <p className="text-gray-500 font-medium mb-2 uppercase tracking-wider text-sm">કુલ ચુકવણી</p>
            <h2 className={`text-5xl md:text-6xl font-black mb-8 text-orange-500`}>
              ₹499
            </h2>

            <RazorpayCheckout
              onPaymentSuccess={handlePaymentSuccess}
              planType={selectedPlan}
            />

            <div className="mt-8 pt-8 border-t border-gray-100 flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-5 h-5 text-green-600" />
                <span>100% સુરક્ષિત પેમેન્ટ</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Zap className="w-5 h-5 text-orange-500" />
                <span>તાત્ક્ષણિક ઍક્સેસ</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Badges */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm font-medium flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Razorpay દ્વારા સુરક્ષિત ચુકવણી દ્વારા સંચાલિત
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentGate;
