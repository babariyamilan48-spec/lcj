'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone } from 'lucide-react';

interface MobileNumberModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (digits: string) => Promise<void>;
}

const MobileNumberModal: React.FC<MobileNumberModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const validateIndianMobile = (number: string): boolean => {
    // Indian mobile numbers must be 10 digits and start with 6, 7, 8, or 9
    const indianMobileRegex = /^[6-9]\d{9}$/;
    return indianMobileRegex.test(number);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value.replace(/\D/g, '').slice(0, 10);
    setValue(next);
    if (next.length === 10 && !validateIndianMobile(next)) {
      setError('માન્ય ભારતીય મોબાઇલ નંબર દાખલ કરો.');
    } else {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value.length !== 10) {
      setError('કૃપા કરીને 10 અંકનો મોબાઇલ નંબર દાખલ કરો.');
      return;
    }
    if (!validateIndianMobile(value)) {
      setError('માન્ય ભારતીય મોબાઇલ નંબર દાખલ કરો. નંબર 6, 7, 8 અથવા 9 થી શરૂ થવો જોઈએ.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      // Send number with +91 prefix
      await onSubmit(`+91${value}`);
      setValue('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'સેવ કરવામાં ભૂલ. ફરી પ્રયાસ કરો.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && onClose()}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100"
          >
            <button
              type="button"
              onClick={() => !saving && onClose()}
              className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 font-gujarati pr-8 flex items-center gap-2">
              <Phone className="w-5 h-5 text-orange-500" />
              મોબાઇલ નંબર
            </h2>
            <p className="mt-2 text-sm text-gray-600 font-gujarati leading-relaxed">
              અમે તમને મહત્વની માહિતી માટે સંપર્ક કરી શકીએ તે માટે 10 અંકનો નંબર દાખલ કરો.
            </p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="followup-mobile" className="block text-sm font-medium text-gray-700 mb-1">
                  મોબાઇલ નંબર
                </label>
                <div className="flex rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-transparent overflow-hidden bg-white">
                  {/* Country Code Prefix */}
                  <div className="flex items-center gap-1 px-3 py-3 bg-gray-50 border-r border-gray-200 select-none">
                    <span className="text-lg">🇮🇳</span>
                    <span className="text-gray-600 font-medium">+91</span>
                  </div>
                  <input
                    id="followup-mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    value={value}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="flex-1 px-4 py-3 text-lg tracking-widest focus:outline-none border-0"
                    disabled={saving}
                  />
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => !saving && onClose()}
                  className="flex-1 rounded-xl border-2 border-gray-200 py-3 font-semibold text-gray-700 hover:bg-gray-50 font-gujarati"
                  disabled={saving}
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  disabled={saving || value.length !== 10}
                  className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3 font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-50 font-gujarati"
                >
                  {saving ? 'સેવ થઈ રહ્યું છે...' : 'ચાલુ રાખો'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MobileNumberModal;
