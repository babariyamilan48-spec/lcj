'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Target,
  Calendar,
  Activity,
  PieChart
} from 'lucide-react';
import ModernNavbar from '@/components/layout/ModernNavbar';
import ModernFooter from '@/components/layout/ModernFooter';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useResultsService';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { analyticsData, loading, error } = useAnalytics(user?.id ? parseInt(user.id) : undefined);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <BarChart3 className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-red-600 mb-4">Error loading analytics: {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use dynamic data or fallback to default values
  const stats = analyticsData ? [
    { label: 'Total Tests', value: analyticsData.stats.total_tests.toString(), change: '+12%', icon: BarChart3, color: 'text-blue-600' },
    { label: 'Average Score', value: `${Math.round(analyticsData.stats.average_score)}%`, change: '+5%', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Streak Days', value: analyticsData.stats.streak_days.toString(), change: '+3', icon: Activity, color: 'text-purple-600' },
    { label: 'Achievements', value: analyticsData.stats.achievements.toString(), change: '+2', icon: Award, color: 'text-orange-600' }
  ] : [
    { label: 'Total Tests', value: '0', change: '+0%', icon: BarChart3, color: 'text-blue-600' },
    { label: 'Average Score', value: '0%', change: '+0%', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Streak Days', value: '0', change: '+0', icon: Activity, color: 'text-purple-600' },
    { label: 'Achievements', value: '0', change: '+0', icon: Award, color: 'text-orange-600' }
  ];

  const testHistory = analyticsData?.testHistory || [];
  const categoryScores = analyticsData ? Object.entries(analyticsData.categoryScores).map(([category, score], index) => ({
    category,
    score: typeof score === 'number' ? score : 0,
    color: ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'][index % 5]
  })) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your progress and performance over time</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-green-600">{stat.change}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Test History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white p-6 rounded-2xl shadow-lg"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Test History</h3>
            <div className="space-y-4">
              {testHistory.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{test.test_name}</h4>
                      <p className="text-sm text-gray-600">{new Date(test.completed_at).toLocaleDateString()} • {test.duration_minutes} min</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{test.percentage_score}%</div>
                    <div className="text-sm text-gray-600">Score</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Category Scores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white p-6 rounded-2xl shadow-lg"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Category Performance</h3>
            <div className="space-y-4">
              {categoryScores.map((category, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{category.category}</span>
                    <span className="text-sm font-semibold text-gray-900">{category.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full ${category.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${category.score}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Progress Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white p-6 rounded-2xl shadow-lg"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Progress Over Time</h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {[65, 72, 78, 85, 88, 92, 87, 90].map((value, index) => (
                <div key={index} className="flex flex-col items-center">
                  <motion.div
                    className="w-8 bg-gradient-to-t from-blue-500 to-purple-600 rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: `${(value / 100) * 200}px` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                  <span className="text-xs text-gray-600 mt-2">Week {index + 1}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white p-6 rounded-2xl shadow-lg"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Current Goals</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Complete 5 tests this month</p>
                    <p className="text-sm text-gray-600">4 of 5 completed</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">4/5</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Improve average score to 90%</p>
                    <p className="text-sm text-gray-600">Current: 87%</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">87%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Maintain 30-day streak</p>
                    <p className="text-sm text-gray-600">15 days completed</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">15</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <ModernFooter />
    </div>
  );
}
