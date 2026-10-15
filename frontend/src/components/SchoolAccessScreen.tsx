'use client';

/**
 * SchoolAccessScreen — opened FROM the payment page's partner-school banner.
 * Select school from dropdown + enter access code → free test access.
 * Bilingual: Gujarati headings + English labels (styled to match PaymentGate).
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, KeyRound, ChevronDown, Loader2, AlertCircle, CreditCard, ArrowLeft, School } from 'lucide-react';
import { schoolService, SchoolActive } from '@/services/schoolService';

interface SchoolAccessScreenProps {
  /** Called after successful redemption — parent re-checks payment status and unlocks */
  onRedeemSuccess: (schoolName: string) => void;
  /** Back to the regular ₹499 payment page */
  onSwitchToPayment: () => void;
}

const SchoolAccessScreen: React.FC<SchoolAccessScreenProps> = ({ onRedeemSuccess, onSwitchToPayment }) => {
  const [schools, setSchools] = useState<SchoolActive[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [schoolsError, setSchoolsError] = useState<string | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchools = async () => {
      try {
        const list = await schoolService.getActiveSchools();
        setSchools(list);
        setSchoolsError(null);
      } catch (e: any) {
        setSchoolsError('Schools could not be loaded. Please try again.');
      } finally {
        setLoadingSchools(false);
      }
    };
    loadSchools();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId || !code.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await schoolService.redeemSchoolCode(selectedSchoolId, code.trim());
      onRedeemSuccess(result.school_name);
    } catch (err: any) {
      setError(err.message || 'Failed to redeem code. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-xl mx-auto"
    >
      {/* Back to payment page */}
      <button
        onClick={onSwitchToPayment}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-orange-600 transition-colors mb-4 ml-1"
      >
        <ArrowLeft className="w-4 h-4" />
        પેમેન્ટ પેજ પર પાછા / Back to payment
      </button>

      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-100 text-orange-600 mb-4 shadow-sm">
            <GraduationCap size={32} />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text text-transparent mb-2">
            શાળા દ્વારા મફત ઍક્સેસ
          </h2>
          <p className="text-sm sm:text-base text-gray-500 font-medium">
            Partner school students — unlock tests for free, no payment needed
          </p>
        </div>

        {/* Empty state: feature on but no active schools */}
        {!loadingSchools && !schoolsError && schools.length === 0 && (
          <div className="text-center py-6 px-4 bg-gray-50 border border-gray-100 rounded-2xl mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-gray-200 text-gray-400 mb-3">
              <School size={24} />
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">
              હાલ કોઈ પાર્ટનર શાળા ઉપલબ્ધ નથી
            </p>
            <p className="text-xs text-gray-400 mb-4">No partner schools are available right now.</p>
            <button
              onClick={onSwitchToPayment}
              className="text-sm font-bold text-orange-600 hover:text-orange-700 underline underline-offset-4"
            >
              Continue to payment →
            </button>
          </div>
        )}

        {schoolsError && (
          <div className="flex items-start gap-3 bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{schoolsError}</p>
          </div>
        )}

        {(loadingSchools || schools.length > 0) && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* School dropdown */}
            <div>
              <label htmlFor="school-select" className="block text-sm font-bold text-gray-700 mb-2">
                તમારી શાળા પસંદ કરો <span className="font-medium text-gray-400">/ Select your school</span>
              </label>
              <div className="relative">
                <select
                  id="school-select"
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  disabled={loadingSchools}
                  className="w-full appearance-none rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3.5 pr-11 text-gray-900 font-medium focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all disabled:opacity-60"
                >
                  <option value="">
                    {loadingSchools ? 'Loading schools...' : '-- Select school / શાળા પસંદ કરો --'}
                  </option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Access code */}
            <div>
              <label htmlFor="school-code" className="block text-sm font-bold text-gray-700 mb-2">
                શાળાનો ઍક્સેસ કોડ <span className="font-medium text-gray-400">/ School access code</span>
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
                <input
                  id="school-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. GREENFIELD-7K2B"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={40}
                  className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 pl-11 pr-4 py-3.5 font-mono text-gray-900 tracking-wider uppercase placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-400 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5 ml-1">
                Your school must share this code with you / શાળા દ્વારા આપેલો કોડ દાખલ કરો
              </p>
            </div>

            {/* Inline error */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!selectedSchoolId || !code.trim() || submitting || loadingSchools}
              className="w-full py-4 rounded-2xl font-bold text-white text-base bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-orange-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'ક્સેસ મેળવો / Get free access'
              )}
            </button>
          </form>
        )}

        {/* Secondary: regular payment path */}
        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <button
            onClick={onSwitchToPayment}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-600 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            Partner school નથી? ચુકવણી કરો — Not from a partner school? Pay ₹499
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SchoolAccessScreen;
