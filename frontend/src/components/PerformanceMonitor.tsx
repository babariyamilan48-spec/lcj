/**
 * Performance Monitor Component
 * Displays real-time performance metrics and system health
 */

import React, { useState } from 'react';
import { usePerformanceMonitoring, useSystemHealthFast } from '../hooks/useOptimizedApi';

interface PerformanceMonitorProps {
  className?: string;
  showDetails?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  className = '',
  showDetails = false
}) => {
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const { cacheStats, performanceReport, clearCache, refreshMetrics } = usePerformanceMonitoring();
  const { data: healthData, loading: healthLoading, refetch: checkHealth } = useSystemHealthFast({
    immediate: false
  });

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthStatus = () => {
    if (healthLoading) return { status: 'checking', color: 'text-blue-600' };
    if (!healthData) return { status: 'unknown', color: 'text-gray-600' };
    
    const overall = (healthData as any)?.overall;
    if (overall === 'healthy') return { status: 'healthy', color: 'text-green-600' };
    if (overall === 'degraded') return { status: 'degraded', color: 'text-yellow-600' };
    return { status: 'unhealthy', color: 'text-red-600' };
  };

  const healthStatus = getHealthStatus();

  if (!isExpanded) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-white shadow-lg rounded-lg p-3 border border-gray-200 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${healthStatus.color.replace('text-', 'bg-')}`} />
            <span className="text-sm font-medium">
              {performanceReport.avgResponseTime.toFixed(0)}ms
            </span>
            <span className="text-xs text-gray-500">
              {cacheStats.hitRate.toFixed(0)}% cached
            </span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-white shadow-xl rounded-lg border border-gray-200 w-80">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* System Health */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">System Health</span>
            <button
              onClick={checkHealth}
              disabled={healthLoading}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {healthLoading ? 'Checking...' : 'Check'}
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${healthStatus.color.replace('text-', 'bg-')}`} />
            <span className={`text-sm ${healthStatus.color}`}>
              {healthStatus.status.charAt(0).toUpperCase() + healthStatus.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Metrics</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Avg Response Time</span>
              <span className={`text-xs font-medium ${getPerformanceColor(performanceReport.avgResponseTime, { good: 500, warning: 1000 })}`}>
                {performanceReport.avgResponseTime.toFixed(0)}ms
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Success Rate</span>
              <span className={`text-xs font-medium ${getPerformanceColor(100 - performanceReport.successRate, { good: 5, warning: 15 })}`}>
                {performanceReport.successRate.toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Cache Hit Rate</span>
              <span className="text-xs font-medium text-green-600">
                {performanceReport.cacheHitRate.toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Total Requests</span>
              <span className="text-xs font-medium text-gray-900">
                {performanceReport.totalRequests}
              </span>
            </div>
          </div>
        </div>

        {/* Cache Stats */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Cache Status</h4>
            <button
              onClick={clearCache}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Clear
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Cache Size</span>
              <span className="text-xs font-medium text-gray-900">
                {cacheStats.size} items
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Hit Rate</span>
              <span className="text-xs font-medium text-green-600">
                {cacheStats.hitRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Slowest Endpoints */}
        {performanceReport.slowestEndpoints.length > 0 && (
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Slowest Endpoints</h4>
            <div className="space-y-1">
              {performanceReport.slowestEndpoints.slice(0, 3).map((endpoint, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-xs text-gray-600 truncate flex-1 mr-2">
                    {endpoint.endpoint.split('/').pop()}
                  </span>
                  <span className={`text-xs font-medium ${getPerformanceColor(endpoint.avgTime, { good: 500, warning: 1000 })}`}>
                    {endpoint.avgTime.toFixed(0)}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={refreshMetrics}
            className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Refresh Metrics
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
