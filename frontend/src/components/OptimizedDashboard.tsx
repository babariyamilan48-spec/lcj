/**
 * Optimized Dashboard Component
 * Complete integration of all optimized features with performance monitoring
 */

import React, { useState, useEffect } from 'react';
import { useUserResultsFast, useLatestResultFast, useSystemHealthFast } from '../hooks/useOptimizedApi';
import OptimizedTestLoader from './OptimizedTestLoader';
import OptimizedResultSubmission from './OptimizedResultSubmission';
import PerformanceMonitor from './PerformanceMonitor';

interface OptimizedDashboardProps {
  userId: string;
  className?: string;
}

interface DashboardTab {
  id: string;
  label: string;
  icon: string;
}

const tabs: DashboardTab[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'test-loader', label: 'Test Loader', icon: '📝' },
  { id: 'submit-results', label: 'Submit Results', icon: '📤' },
  { id: 'performance', label: 'Performance', icon: '⚡' }
];

export const OptimizedDashboard: React.FC<OptimizedDashboardProps> = ({
  userId,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTestId, setSelectedTestId] = useState(1);
  const [loadedQuestions, setLoadedQuestions] = useState<any[]>([]);

  // Fetch user data with optimized hooks
  const {
    data: userResults,
    loading: resultsLoading,
    error: resultsError,
    performance: resultsPerformance
  } = useUserResultsFast(userId, 1, 10);

  const {
    data: latestResult,
    loading: latestLoading,
    error: latestError,
    performance: latestPerformance
  } = useLatestResultFast(userId);

  const {
    data: systemHealth,
    loading: healthLoading,
    refetch: checkHealth
  } = useSystemHealthFast({ immediate: true });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'test-loader':
        return renderTestLoader();
      case 'submit-results':
        return renderResultSubmission();
      case 'performance':
        return renderPerformanceDetails();
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Health Status */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          <button
            onClick={checkHealth}
            disabled={healthLoading}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            {healthLoading ? 'Checking...' : 'Refresh'}
          </button>
        </div>
        
        {systemHealth ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                (systemHealth as any)?.overall === 'healthy' ? 'bg-green-500' : 
                (systemHealth as any)?.overall === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <div className="text-sm font-medium text-gray-900">Overall</div>
              <div className="text-xs text-gray-600 capitalize">{(systemHealth as any)?.overall || 'unknown'}</div>
            </div>
            
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                (systemHealth as any)?.results?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <div className="text-sm font-medium text-gray-900">Results API</div>
              <div className="text-xs text-gray-600">
                {(systemHealth as any)?.results?.response_time_ms?.toFixed(0) || 0}ms
              </div>
            </div>
            
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                (systemHealth as any)?.questions?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <div className="text-sm font-medium text-gray-900">Questions API</div>
              <div className="text-xs text-gray-600">
                {(systemHealth as any)?.questions?.response_time_ms?.toFixed(0) || 0}ms
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            {healthLoading ? 'Checking system health...' : 'Unable to check system health'}
          </div>
        )}
      </div>

      {/* User Results Summary */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Results</h3>
        
        {resultsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">Loading your results...</div>
          </div>
        ) : resultsError ? (
          <div className="text-center py-8 text-red-600">
            Error loading results: {resultsError}
          </div>
        ) : userResults ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{(userResults as any)?.total || 0}</div>
                <div className="text-sm text-gray-600">Total Results</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {resultsPerformance?.responseTime?.toFixed(0) || 0}ms
                </div>
                <div className="text-sm text-gray-600">Load Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {resultsPerformance?.cached ? 'Cached' : 'Fresh'}
                </div>
                <div className="text-sm text-gray-600">Data Source</div>
              </div>
            </div>

            {(userResults as any)?.results && (userResults as any)?.results.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Recent Results</h4>
                <div className="space-y-2">
                  {(userResults as any)?.results.slice(0, 3).map((result: any, index: number) => (
                    <div key={result.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">Test {result.test_id}</div>
                        <div className="text-sm text-gray-600">
                          {result.completion_percentage}% complete
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(result.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No results found
          </div>
        )}
      </div>

      {/* Latest Result */}
      {latestResult && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Result</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Test ID</div>
              <div className="font-medium">{(latestResult as any)?.test_id}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Completion</div>
              <div className="font-medium">{(latestResult as any)?.completion_percentage}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Time Taken</div>
              <div className="font-medium">{(latestResult as any)?.time_taken_seconds}s</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Load Time</div>
              <div className="font-medium text-green-600">
                {latestPerformance?.responseTime?.toFixed(0) || 0}ms
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTestLoader = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Test Loader Configuration</h3>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Test ID:</label>
            <select
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={1}>Test 1 - Personality Assessment</option>
              <option value={2}>Test 2 - Career Aptitude</option>
              <option value={3}>Test 3 - Skills Evaluation</option>
            </select>
          </div>
        </div>
      </div>

      <OptimizedTestLoader
        testId={selectedTestId}
        onQuestionsLoaded={setLoadedQuestions}
        loadStructure={true}
        showPerformance={true}
      />

      {loadedQuestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">
            Loaded Questions Summary ({loadedQuestions.length} questions)
          </h4>
          <div className="text-sm text-gray-600">
            Questions have been successfully loaded and are ready for use. 
            You can now proceed to take the test or submit results.
          </div>
        </div>
      )}
    </div>
  );

  const renderResultSubmission = () => (
    <div className="space-y-6">
      <OptimizedResultSubmission
        testId={selectedTestId}
        userId={userId}
        onSubmissionComplete={(result) => {
          console.log('Submission completed:', result);
          // Refresh user results after submission
          window.location.reload();
        }}
        onSubmissionError={(error) => {
          console.error('Submission error:', error);
        }}
      />
    </div>
  );

  const renderPerformanceDetails = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">API Response Times</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">User Results:</span>
                <span className="text-sm font-medium text-green-600">
                  {resultsPerformance?.responseTime?.toFixed(0) || 0}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Latest Result:</span>
                <span className="text-sm font-medium text-green-600">
                  {latestPerformance?.responseTime?.toFixed(0) || 0}ms
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Cache Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">User Results:</span>
                <span className={`text-sm font-medium ${resultsPerformance?.cached ? 'text-green-600' : 'text-blue-600'}`}>
                  {resultsPerformance?.cached ? 'Cached' : 'Fresh'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Latest Result:</span>
                <span className={`text-sm font-medium ${latestPerformance?.cached ? 'text-green-600' : 'text-blue-600'}`}>
                  {latestPerformance?.cached ? 'Cached' : 'Fresh'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Performance Monitor */}
      <div className="relative">
        <PerformanceMonitor showDetails={true} />
      </div>
    </div>
  );

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Optimized LCJ Dashboard
        </h1>
        <p className="text-gray-600">
          Ultra-fast career assessment system with real-time performance monitoring
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {renderTabContent()}
      </div>

      {/* Floating Performance Monitor */}
      <PerformanceMonitor />
    </div>
  );
};

export default OptimizedDashboard;
