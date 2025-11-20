'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTestResults } from '@/hooks/useResultsService';
import { resultsService } from '@/services/resultsService';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  BookOpen,
  Trophy,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react';
import ModernNavbar from '@/components/layout/ModernNavbar';
import ModernFooter from '@/components/layout/ModernFooter';
import BackButton from '@/components/BackButton';

interface TestResult {
  id: string;
  test_id: string;
  test_name?: string;
  completed_at?: string;
  percentage_score?: number;
  primary_result?: any;
  completion_percentage?: number;
  created_at?: string;
}

export default function AllTestResultsPage() {
  console.log('🔍 Test Results Page: Component rendering...');
  const { user } = useAuth();
  const userId = user?.id;
  console.log('🔍 Test Results Page: userId from auth:', userId);
  console.log('🔍 Test Results Page: About to call useTestResults...');
  const { results, loading, pagination, fetchResults, error } = useTestResults(userId);
  console.log('🔍 Test Results Page: useTestResults returned:', { results, loading, error });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [manualResults, setManualResults] = useState<any[]>([]);
  const [manualLoading, setManualLoading] = useState(false);

  // Manual fetch function as fallback
  const manualFetchResults = async () => {
    if (!userId) return;
    
    console.log('🔄 Manual fetch: Starting direct API call');
    setManualLoading(true);
    
    try {
      const response = await resultsService.getUserResults(userId, 1, 100);
      console.log('🔄 Manual fetch: Response received', response);
      setManualResults(response.results || []);
    } catch (error) {
      console.error('🔄 Manual fetch: Error', error);
      setManualResults([]);
    } finally {
      setManualLoading(false);
    }
  };

  useEffect(() => {
    if (userId && fetchResults) {
      console.log('🔍 Test Results Page: Fetching results for user:', userId);
      fetchResults();
    }
  }, [userId, fetchResults]);

  // Force refresh on mount
  useEffect(() => {
    if (userId) {
      console.log('🔄 Test Results Page: Force refresh on mount');
      // Force a fresh fetch with a small delay
      const timer = setTimeout(() => {
        if (fetchResults) {
          console.log('🔄 Executing delayed fetch...');
          fetchResults();
        }
        // Also try manual fetch as fallback
        manualFetchResults();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [userId]);

  // Use either hook results or manual results
  const effectiveResults = results && results.length > 0 ? results : manualResults;
  const effectiveLoading = loading || manualLoading;
  
  console.log('🔍 Test Results Page: Effective data check:', {
    hookResults: results,
    hookResultsLength: results?.length,
    manualResults: manualResults,
    manualResultsLength: manualResults.length,
    effectiveResults: effectiveResults,
    effectiveResultsLength: effectiveResults?.length,
    hookLoading: loading,
    manualLoading: manualLoading,
    effectiveLoading: effectiveLoading
  });

  // Helper function to get test display name
  const getTestDisplayName = (testId: string, testName?: string) => {
    if (testName) return testName;
    
    const testNames: { [key: string]: string } = {
      'mbti': 'MBTI Personality Test',
      'intelligence': 'Multiple Intelligence Test',
      'bigfive': 'Big Five Personality Test',
      'riasec': 'RIASEC Career Interest Test',
      'vark': 'VARK Learning Style Test',
      'decision': 'Decision Making Style Test',
      'life-situation': 'Life Situation Assessment'
    };
    
    return testNames[testId] || `${testId.toUpperCase()} Test`;
  };

  // Filter and search results
  const filteredResults = effectiveResults?.filter(result => {
    const matchesSearch = searchTerm === '' || 
      getTestDisplayName(result.test_id, result.test_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.test_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const completion = (result as any).completion_percentage || result.percentage_score || 0;
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'completed' && completion >= 80) ||
      (filterStatus === 'incomplete' && completion < 80);
    
    return matchesSearch && matchesFilter;
  }) || [];

  // Calculate statistics
  const totalTests = effectiveResults?.length || 0;
  const completedTests = effectiveResults?.filter(r => {
    const completion = (r as any).completion_percentage || r.percentage_score || 0;
    return completion >= 80;
  }).length || 0;
  const averageScore = completedTests > 0 
    ? Math.round(effectiveResults.filter(r => {
        const completion = (r as any).completion_percentage || r.percentage_score || 0;
        return completion >= 80;
      }).reduce((sum, r) => {
        const completion = (r as any).completion_percentage || r.percentage_score || 0;
        return sum + completion;
      }, 0) / completedTests)
    : 0;

  // Debug logging
  console.log('🔍 Test Results Page Debug:');
  console.log('   userId:', userId);
  console.log('   hookResults:', results);
  console.log('   hookError:', error);
  console.log('   manualResults:', manualResults);
  console.log('   effectiveResults:', effectiveResults);
  console.log('   loading:', loading);
  console.log('   manualLoading:', manualLoading);
  console.log('   effectiveLoading:', effectiveLoading);
  console.log('   filteredResults:', filteredResults);
  console.log('   totalTests:', totalTests);
  console.log('   completedTests:', completedTests);

  if (effectiveLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
        <ModernFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <BackButton />
      </div>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold">Test Results</h1>
                <p className="text-blue-100 mt-2">Your detailed personality analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={manualFetchResults}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                disabled={manualLoading}
              >
                {manualLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tests</p>
                <p className="text-3xl font-bold text-gray-900">{totalTests}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completedTests}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-purple-600">{averageScore}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Tests</option>
                <option value="completed">Completed</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Test Results ({filteredResults.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredResults.length > 0 ? (
              filteredResults.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {getTestDisplayName(result.test_id, result.test_name)}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {result.completed_at 
                                ? new Date(result.completed_at).toLocaleDateString()
                                : (result as any).created_at 
                                ? new Date((result as any).created_at).toLocaleDateString()
                                : 'Invalid Date'
                              }
                            </span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Trophy className="w-4 h-4" />
                            <span>{result.percentage_score || (result as any).completion_percentage || 0}% Complete</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        ((result as any).completion_percentage >= 100 || (result.percentage_score || 0) >= 80)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {((result as any).completion_percentage >= 100 || (result.percentage_score || 0) >= 80) ? 'Completed' : 'In Progress'}
                      </div>
                      
                      <button
                        onClick={() => window.location.href = `/test-result/${result.test_id}`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {error 
                    ? 'Error Loading Results' 
                    : searchTerm || filterStatus !== 'all' 
                    ? 'No matching results' 
                    : 'No test results yet'
                  }
                </h3>
                <p className="text-gray-500 mb-6">
                  {error 
                    ? `Error: ${error}. Try clicking "Refresh Data" above.`
                    : searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Start your learning journey by taking your first assessment'
                  }
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <button
                    onClick={() => window.location.href = '/test'}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                  >
                    Take Your First Test
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ModernFooter />
    </div>
  );
}
