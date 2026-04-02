'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTests, useTestSelection } from '@/hooks/useQuestionService';
import { Test as StoreTest } from '@/store/app-store';
import { Test as ApiTest } from '@/services/questionService';
import { aiInsightsService } from '@/services/aiInsightsService';
import { completionStatusService } from '@/services/completionStatusService';
import { getCurrentUserId, getUserIdSource } from '@/utils/userUtils';
import { CheckCircle } from 'lucide-react';

interface TestSelectionProps {
  onTestSelect: (test: StoreTest) => void;
  onBack: () => void;
}

const TestSelectionAPI: React.FC<TestSelectionProps> = ({ onTestSelect, onBack }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedTest, setSelectedTest] = useState<StoreTest | null>(null);
  const [completedTests, setCompletedTests] = useState<string[]>([]);
  const [loadingCompletion, setLoadingCompletion] = useState(true);
  const [hasCheckedCompletion, setHasCheckedCompletion] = useState(false);

  // Counseling status state
  const [counselingStatus, setCounselingStatus] = useState<{ counseling_completed: boolean; counseling_completed_at?: string } | null>(null);

  const { tests, loading, error, refetch } = useTests();
  const { selectTest, clearSelection } = useTestSelection();

  // Fetch counseling status when all tests completed
  useEffect(() => {
    const allTestsCompleted = tests && tests.length > 0 && completedTests.length === tests.length;
    if (!allTestsCompleted) return;

    const userId = getCurrentUserId();
    if (!userId) return;

    const fetchCounselingStatus = async () => {
      try {
        const token = localStorage.getItem('at');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth_service/users/${userId}/counseling`,
          {
            headers: {
              'Authorization': `Bearer ${token || ''}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setCounselingStatus(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch counseling status:', error);
      }
    };

    fetchCounselingStatus();
  }, [tests, completedTests]);

  // Fetch completion status - prevent multiple calls
  useEffect(() => {
    const fetchCompletionStatus = async () => {
      if (hasCheckedCompletion) return; // Prevent multiple calls

      try {
        const userId = getCurrentUserId();

        const statusResponse = await completionStatusService.getCompletionStatus(userId, true); // Use cache-busting for fresh data

        const status = statusResponse.data;

        // Handle both old format (array of test IDs) and new format (count)
        let completedTestIds: string[] = [];
        if (Array.isArray(status.completed_tests)) {
          completedTestIds = status.completed_tests;
        } else if (typeof status.completed_tests === 'number') {
          // If it's a number, we need to fetch the actual test IDs
          // For now, we'll use an empty array and rely on the backend to provide the list
          completedTestIds = [];
        }

        setCompletedTests(completedTestIds);
        setHasCheckedCompletion(true);

      } catch (error) {
        console.error('❌ Error fetching completion status:', error);
        setCompletedTests([]);
        setHasCheckedCompletion(true);
      } finally {
        setLoadingCompletion(false);
      }
    };

    fetchCompletionStatus();
  }, [hasCheckedCompletion]);

  // Function to get appropriate icon based on test type
  const getTestIcon = (testId: string, testName: string) => {
    // Check test_id first, then fallback to name matching
    const id = testId?.toLowerCase() || '';
    const name = testName?.toLowerCase() || '';

    // MBTI Personality Test
    if (id.includes('mbti') || name.includes('personality') || name.includes('સ્વભાવ')) {
      return '👤';
    }

    // Multiple Intelligence Test
    if (id.includes('intelligence') || name.includes('intelligence') || name.includes('બુદ્ધિ')) {
      return '🧠';
    }

    // Big Five Personality Test
    if (id.includes('bigfive') || id.includes('big5') || name.includes('વ્યક્તિત્વ')) {
      return '⭐';
    }

    // Career Interest (RIASEC)
    if (id.includes('riasec') || id.includes('career') || name.includes('રસ-રુચિ') || name.includes('career')) {
      return '💼';
    }

    // Decision Making Style
    if (id.includes('decision') || name.includes('decision') || name.includes('નિર્ણય')) {
      return '🎯';
    }

    // Learning Style (VARK)
    if (id.includes('vark') || id.includes('learning') || name.includes('શીખવાની') || name.includes('learning')) {
      return '📚';
    }

    // Values (SVS Schwartz)
    if (id.includes('svs') || id.includes('values') || name.includes('મૂલ્યો')) {
      return '💎';
    }

    // Life Situation Assessment
    if (id.includes('life') || name.includes('જીવન') || name.includes('life')) {
      return '🌟';
    }

    // Default fallback
    return '🧠';
  };

  const handleTestSelect = (test: ApiTest) => {
    // Check if test is already completed
    const isCompleted = completedTests.includes(test.test_id);

    if (isCompleted) {
      // Redirect to profile page with tests tab instead of allowing retake
      window.location.href = `/profile`;
      return;
    }

    // Convert the API test data to match the StoreTest type
    const testData: StoreTest = {
      id: test.test_id,
      name: test.name,
      description: test.description || '',
      duration: test.duration || '30 મિનિટ', // Keep as string for display
      questions: test.questions_count,
      category: test.test_id,
      instructions: 'કૃપા કરીને બધા પ્રશ્નોના પ્રામાણિકપણે અને તમારી શ્રેષ્ઠ ક્ષમતા મુજબ જવાબ આપો.',
      english: test.english_name,
      icon: getTestIcon(test.test_id, test.name),
      color: test.color,
      sections: test.sections?.map(section => ({
        id: section.section_id,
        name: section.name,
        gujarati: section.gujarati_name || section.name
      }))
    };

    setSelectedTest(testData);
    setShowInstructions(true);
  };

  const handleStartTest = () => {
    if (selectedTest) {
      onTestSelect(selectedTest);
    }
  };

  // Function to sort tests in the desired order
  const getSortedTests = (testsToSort: ApiTest[]): ApiTest[] => {
    const testOrder = ['mbti', 'intelligence', 'riasec', 'bigfive', 'decision', 'vark', 'life'];

    return testsToSort.sort((a, b) => {
      const aId = a.test_id?.toLowerCase() || '';
      const bId = b.test_id?.toLowerCase() || '';

      const aIndex = testOrder.findIndex(order => aId.includes(order));
      const bIndex = testOrder.findIndex(order => bId.includes(order));

      // If both found in order, sort by order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // If only one found, it comes first
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // If neither found, maintain original order
      return 0;
    });
  };

  const handleCloseInstructions = () => {
    setShowInstructions(false);
    setSelectedTest(null);
    clearSelection();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">પરીક્ષણો લોડ કરી રહ્યાં...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">પરીક્ષણો લોડ કરવામાં સમસ્યા: {error}</p>
          <button
            onClick={refetch}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
ફરી પ્રયાસ કરો
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 relative">
      {/* Clean Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-primary-100/30 to-orange-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-orange-100/20 to-primary-100/20 rounded-full blur-2xl" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-6 py-12">
        {/* Clean Header */}
        <div className="text-center mb-16">
          <motion.button
            onClick={onBack}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center text-slate-500 hover:text-primary-600 mb-8 transition-colors duration-200 group"
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="mr-2 text-sm group-hover:text-primary-600">←</span>
            <span className="text-sm font-medium">પાછળ જાઓ</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              તમારું મૂલ્યાંકન પસંદ કરો
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
              તમારી શક્તિઓ અને સંભાવનાઓ શોધવા માટે કારકિર્દી મૂલ્યાંકન પરીક્ષણ પસંદ કરો.
            </p>

            {/* Completion Progress */}
            {!loadingCompletion && tests && tests.length > 0 && (
              <div className="max-w-md mx-auto bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">પ્રગતિ</span>
                  <span className="text-sm text-gray-600">
                    {tests?.length || 0} માંથી {completedTests?.length || 0} પૂર્ણ
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${tests?.length > 0 ? ((completedTests?.length || 0) / tests.length) * 100 : 0}%` }}
                  ></div>
                </div>
                {(completedTests?.length || 0) === (tests?.length || 0) && tests && tests.length > 0 && (
                  <div className="mt-3 text-center space-y-3">
                    <span className="text-xs text-green-600 font-medium">
                      🎉 બધા પરીક્ષણો પૂર્ણ! તમારા પરિણામો જુઓ.
                    </span>

                    {/* Counseling Call Banner - HIGHLIGHTED */}
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className={`p-4 rounded-xl border-3 shadow-lg ${
                        counselingStatus?.counseling_completed
                          ? 'bg-gradient-to-r from-green-100 via-emerald-100 to-green-100 border-green-500 shadow-green-200'
                          : 'bg-gradient-to-r from-orange-100 via-amber-100 to-orange-100 border-orange-500 shadow-orange-200'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <motion.div
                          animate={{ rotate: counselingStatus?.counseling_completed ? [0] : [0, 10, -10, 0] }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                            counselingStatus?.counseling_completed ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </motion.div>
                        <div className="text-center">
                          <p className={`font-extrabold text-base leading-tight ${
                            counselingStatus?.counseling_completed ? 'text-green-900' : 'text-orange-900'
                          }`}>
                            {counselingStatus?.counseling_completed
                              ? '🎉 કાઉન્સેલિંગ પૂર્ણ થઈ ગયું છે'
                              : '📞 24 કલાકમાં કારકિર્દી કાઉન્સેલિંગ માટે કોલ આવશે'
                            }
                          </p>
                          <p className={`text-xs font-medium mt-1 ${
                            counselingStatus?.counseling_completed ? 'text-green-700' : 'text-orange-700'
                          }`}>
                            {counselingStatus?.counseling_completed
                              ? '✅ Counseling Completed'
                              : '⏳ કાઉન્સેલિંગ બાકી છે (Counseling Pending)'
                            }
                          </p>
                        </div>
                        <motion.div
                          animate={{ x: counselingStatus?.counseling_completed ? [0] : [0, 5, 0] }}
                          transition={{ duration: 1, repeat: counselingStatus?.counseling_completed ? 0 : Infinity, repeatDelay: 2 }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            counselingStatus?.counseling_completed ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                        >
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </motion.div>
                      </div>
                    </motion.div>

                    <div>
                      <motion.button
                        onClick={() => window.location.href = '/profile?tab=history'}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {/* <span className="mr-2">⬇️</span> */}
                        Download All Reports
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Clean Test Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {tests && tests.length > 0 ? getSortedTests(tests).map((test, index) => {
            const isCompleted = Array.isArray(completedTests) && completedTests.includes(test.test_id);
            return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                className={`group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border ${
                  isCompleted
                    ? 'border-green-200 bg-green-50/30'
                    : 'border-gray-100 hover:border-primary-200'
                }`}
                onClick={() => handleTestSelect(test)}
              >
                {/* Completion Checkmark */}
                {isCompleted && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-green-500 rounded-full p-1 shadow-lg">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              <div className="p-6">
                {/* Clean top accent */}
                <div
                  className="absolute top-0 left-0 w-full h-1 rounded-t-2xl"
                  style={{ background: `linear-gradient(to right, ${test.color || '#FF7D2D'}, #fb923c)` }}
                />

                {/* Clean Icon Container */}
                <div className="flex justify-center mb-6">
                  <div
                    className="w-32 h-32 rounded-xl flex items-center justify-center text-6xl transition-transform duration-300 group-hover:scale-110"
                    style={{ color: test.color || '#FF7D2D' }}
                  >
                    {getTestIcon(test.test_id, test.name)}
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <h3 className="text-xl font-semibold text-slate-800 group-hover:text-primary-600 transition-colors duration-300">
                    {test.name}
                  </h3>

                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                    {test.description}
                  </p>

                  {/* Clean AI Badge */}
                  <div className="flex justify-center">
                    <div className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full border border-primary-100">
                      <span className="mr-1">🧠</span>
                      AI વિશ્લેષણ
                    </div>
                  </div>
                </div>

                {/* Clean stats section */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center text-sm text-slate-500">
                    <div className="flex items-center">
                      <span className="mr-1">⏱️</span>
                      <span>{test.duration && test.duration !== 'null' ? test.duration : '30 મિનિટ'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">❓</span>
                      <span>{test.questions_count && test.questions_count > 0 ? test.questions_count : '?'} પ્રશ્નો</span>
                    </div>
                  </div>
                </div>

                {/* Clean hover indicator - only show if not completed */}
                {!isCompleted && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-white text-xs">→</span>
                  </div>
                )}

                {/* Completed Badge */}
                {isCompleted && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-blue-100 text-blue-700 text-xs font-medium py-2 px-3 rounded-lg text-center border border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer">
                      ✅ પૂર્ણ - પરિણામ જુઓ (Completed - View Results)
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
            );
          }) : (
            <div className="col-span-full text-center py-12">
              {loading ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="text-gray-500">Loading tests...</p>
                </div>
              ) : error ? (
                <div className="text-red-500">
                  <p>Error loading tests: {error}</p>
                  <button
                    onClick={refetch}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-gray-500">No tests available</p>
                  <button
                    onClick={refetch}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Retry Loading Tests
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clean Instructions Modal */}
        {showInstructions && selectedTest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100"
            >
              {/* Completion Status */}
              {completedTests.includes(selectedTest.id) && (
                <div className="absolute top-4 right-4">
                  <div className="bg-green-100 text-green-700 text-xs font-medium py-1 px-3 rounded-full border border-green-200">
                    ✅ પૂર્ણ
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto rounded-xl flex items-center justify-center text-4xl mb-3" style={{ color: selectedTest.color || '#FF7D2D' }}>
                  {getTestIcon(selectedTest.id, selectedTest.name)}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {selectedTest.name}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {selectedTest.instructions}
                </p>
              </div>

              {/* Special Instructions - Compact */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3 mb-4">
                <div className="flex items-center mb-2">
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <h4 className="text-xs font-bold text-orange-800">ખાસ સૂચના</h4>
                </div>
                <div className="space-y-1 text-xs text-orange-700 leading-tight">
                  <div>• દરેક પ્રશ્નનો જવાબ ઊંડાણપૂર્વક વિચારીને પૂરવો</div>
                  <div>• તમારા માટે જે સાચું હોય તે મુજબ જ જવાબ પૂરવો</div>
                  <div>• ખોટો વિકલ્પ આખું પરિણામ બદલી શકે છે</div>
                  <div>• ટેસ્ટ પૂર્ણ થયા પછી બે વાર ચેક કરો</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-xl mb-1">⏱️</div>
                  <div className="text-xs text-slate-500 mb-1">અવધિ</div>
                  <div className="text-xs font-semibold text-slate-700">{selectedTest.duration && selectedTest.duration !== 'null' ? selectedTest.duration : '30 મિનિટ'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-xl mb-1">❓</div>
                  <div className="text-xs text-slate-500 mb-1">પ્રશ્નો</div>
                  <div className="text-xs font-semibold text-slate-700">{selectedTest.questions && selectedTest.questions > 0 ? selectedTest.questions : '?'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-xl mb-1">✅</div>
                  <div className="text-xs text-slate-500 mb-1">લવચીક</div>
                  <div className="text-xs font-semibold text-slate-700">કોઈપણ સમયે વિરામ</div>
                </div>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  onClick={handleCloseInstructions}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-3 py-2.5 text-sm text-slate-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 font-medium"
                >
                  રદ કરો
                </motion.button>
                <motion.button
                  onClick={handleStartTest}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-3 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  મૂલ્યાંકન શરૂ કરો
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestSelectionAPI;
