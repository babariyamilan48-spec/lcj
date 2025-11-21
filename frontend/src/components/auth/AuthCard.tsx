'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="mx-auto flex min-h-screen items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl backdrop-blur"
        >
          <div className="mb-8 text-center">
            <motion.h1
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-4xl font-bold text-orange-600 mb-4"
            >
              જીવન પરિવર્તન સફર
            </motion.h1>
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
          </div>
          <div>{children}</div>
          {footer && <div className="mt-6">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
}

