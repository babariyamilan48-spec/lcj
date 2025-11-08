'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getApiBaseUrl } from '@/config/api';
import {
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  totalTests: number;
  totalQuestions: number;
  totalUsers: number;
  totalCompletions: number;
  recentCompletions: Array<{
    id: number;
    test_name: string;
    user_email: string;
    completed_at: string;
    score?: number;
  }>;
  testStats: Array<{
    test_id: string;
    test_name: string;
    completions: number;
    avg_score?: number;
  }>;
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch real analytics data from backend
      const response = await fetch(`${getApiBaseUrl()}/api/v1/results_service/analytics/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Analytics data received:', data);
      
      // Check if the response has the expected structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      // Transform the backend response to match our interface
      const analyticsData: AnalyticsData = {
        totalTests: data.totalTests || 0,
        totalQuestions: data.totalQuestions || 0,
        totalUsers: data.totalUsers || 0,
        totalCompletions: data.totalCompletions || 0,
        recentCompletions: data.recentCompletions || [],
        testStats: data.testStats || []
      };

      setAnalyticsData(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      
      // Fallback to empty data on error
      setAnalyticsData({
        totalTests: 0,
        totalQuestions: 0,
        totalUsers: 0,
        totalCompletions: 0,
        recentCompletions: [],
        testStats: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load analytics data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of test performance and user engagement
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
          <dt>
            <div className="absolute rounded-md bg-blue-500 p-3">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Total Tests</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{analyticsData.totalTests}</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
          <dt>
            <div className="absolute rounded-md bg-green-500 p-3">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Total Completions</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{analyticsData.totalCompletions.toLocaleString()}</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
          <dt>
            <div className="absolute rounded-md bg-purple-500 p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Total Users</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{analyticsData.totalUsers.toLocaleString()}</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
          <dt>
            <div className="absolute rounded-md bg-orange-500 p-3">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Avg Score</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {analyticsData.testStats.length > 0 
                ? `${(analyticsData.testStats.reduce((sum, test) => sum + (test.avg_score || 0), 0) / analyticsData.testStats.length).toFixed(1)}%`
                : '0%'
              }
            </p>
          </dd>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Performance */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Test Performance</h3>
            <div className="space-y-4">
              {analyticsData.testStats.map((test) => (
                <div key={test.test_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{test.test_name}</h4>
                    <span className="text-sm text-gray-500">{test.completions.toLocaleString()} completions</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(test.completions / Math.max(...analyticsData.testStats.map(t => t.completions))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {test.avg_score ? `${test.avg_score}% avg` : 'No scores'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Completions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Completions</h3>
            <div className="flow-root">
              <ul className="-mb-8">
                {analyticsData.recentCompletions.map((completion, completionIdx) => (
                  <li key={completion.id}>
                    <div className="relative pb-8">
                      {completionIdx !== analyticsData.recentCompletions.length - 1 ? (
                        <span
                          className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              <span className="font-medium text-gray-900">{completion.user_email}</span> completed{' '}
                              <span className="font-medium text-gray-900">{completion.test_name}</span>
                            </p>
                            {completion.score && (
                              <p className="text-xs text-gray-400">Score: {completion.score}%</p>
                            )}
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(completion.completed_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analytics Placeholder */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Analytics</h3>
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Advanced Analytics</h3>
            <p className="mt-1 text-sm text-gray-500">
              Detailed charts and insights will be available here.
            </p>
            <div className="mt-6">
              <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <Activity className="h-4 w-4 mr-2" />
                View Detailed Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
