/**
 * Test Progress Card Component
 * 
 * A reusable component for displaying test completion progress with modern UI
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  TrendingUp,
  Target,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { completionStatusService, CompletionStatusData, ProgressSummaryData } from '@/services/completionStatusService';

interface TestProgressCardProps {
  userId: string;
  showDetailedView?: boolean;
  onTestClick?: (testId: string) => void;
  className?: string;
}

interface TestProgressCardState {
  loading: boolean;
  error: string | null;
  completionData: CompletionStatusData | null;
  progressData: ProgressSummaryData | null;
}

const TestProgressCard: React.FC<TestProgressCardProps> = ({
  userId,
  showDetailedView = false,
  onTestClick,
  className = ''
}) => {
  const [state, setState] = useState<TestProgressCardState>({
    loading: true,
    error: null,
    completionData: null,
    progressData: null
  });

  const fetchData = async (bustCache: boolean = false) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      console.log(`🔄 Fetching test progress data${bustCache ? ' (cache-busting)' : ''}`);
      
      const [completionResponse, progressResponse] = await Promise.all([
        completionStatusService.getCompletionStatus(userId, bustCache),
        completionStatusService.getProgressSummary(userId, bustCache)
      ]);

      setState({
        loading: false,
        error: null,
        completionData: completionResponse.data,
        progressData: progressResponse.data
      });
    } catch (error: any) {
      console.error('Error fetching test progress:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load test progress'
      }));
    }
  };

  useEffect(() => {
    if (userId) {
      // CRITICAL FIX: Always use cache-busting to ensure fresh completion data
      // This is important because completion status changes frequently when tests are completed
      console.log(`📊 [TestProgressCard] Fetching fresh completion data for user ${userId}`);
      fetchData(true);
    }
  }, [userId]);
  
  // Also refresh when component becomes visible (e.g., when navigating back from profile)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userId) {
        console.log('📊 [TestProgressCard] Page became visible, refreshing data...');
        fetchData(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId]);
  
  // Add refresh function for external use
  const refreshData = () => {
    console.log('🔄 Manually refreshing test progress data...');
    fetchData(true);
  };
  
  // Expose refresh function via ref or global method
  React.useEffect(() => {
    // Store refresh function globally for debugging
    (window as any).refreshTestProgress = refreshData;
  }, []);

  const handleRetry = () => {
    fetchData();
  };

  const handleTestClick = (testId: string) => {
    if (onTestClick) {
      onTestClick(testId);
    } else {
      // Default behavior - navigate to test selection
      window.location.href = `/test-selection?highlight=${testId}`;
    }
  };

  if (state.loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-200 ${className}`}
      >
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (state.error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-2xl p-6 shadow-lg border border-red-200 ${className}`}
      >
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            પ્રગતિ લોડ કરવામાં સમસ્યા
          </h3>
          <p className="text-gray-600 mb-4">{state.error}</p>
          <motion.button
            onClick={handleRetry}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            ફરી પ્રયાસ કરો
          </motion.button>
        </div>
      </motion.div>
    );
  }

  const { completionData, progressData } = state;
  if (!completionData || !progressData) {
    return null;
  }

  const progressColor = completionData.all_completed 
    ? 'from-green-500 to-emerald-500'
    : completionData.completion_percentage > 50
    ? 'from-blue-500 to-indigo-500'
    : 'from-orange-500 to-amber-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${progressColor} flex items-center justify-center`}>
            {completionData.all_completed ? (
              <CheckCircle2 className="w-6 h-6 text-white" />
            ) : (
              <Target className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              ટેસ્ટ પ્રગતિ
            </h3>
            <p className="text-sm text-gray-600">
              {progressData.status_message}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {completionData.completed_tests.length}/{completionData.total_tests}
          </div>
          <div className="text-sm text-gray-500">પૂર્ણ</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>પ્રગતિ</span>
          <span>{Math.round(completionData.completion_percentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${progressColor} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${completionData.completion_percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Detailed View */}
      {showDetailedView && (
        <div className="space-y-4">
          {/* Completed Tests */}
          {completionData.test_details.completed.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                પૂર્ણ થયેલા ટેસ્ટ ({completionData.test_details.completed.length})
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {completionData.test_details.completed.map((test) => (
                  <div
                    key={test.test_id}
                    className="flex items-center p-2 bg-green-50 rounded-lg border border-green-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-3" />
                    <span className="text-sm text-green-700">{test.display_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Tests */}
          {completionData.test_details.missing.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <Circle className="w-4 h-4 text-gray-400 mr-2" />
                બાકી ટેસ્ટ ({completionData.test_details.missing.length})
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {completionData.test_details.missing.map((test) => (
                  <motion.div
                    key={test.test_id}
                    onClick={() => handleTestClick(test.test_id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-200 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center">
                      <Circle className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-700">{test.display_name}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      {!completionData.all_completed && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <motion.button
            onClick={() => handleTestClick(progressData.next_recommended_tests[0] || 'mbti')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r ${progressColor} text-white rounded-xl font-medium hover:shadow-lg transition-all`}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            આગળનો ટેસ્ટ શરૂ કરો
          </motion.button>
        </div>
      )}

      {/* Comprehensive Report Button */}
      {completionData.all_completed && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <motion.button
            onClick={() => window.location.href = '/comprehensive-report'}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Target className="w-4 h-4 mr-2" />
            સંપૂર્ણ રિપોર્ટ જુઓ
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default TestProgressCard;
