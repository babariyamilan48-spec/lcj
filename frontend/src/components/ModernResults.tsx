// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { mbtiTypes, mbtiDimensionDescriptions } from '../data/testConfig';
import { calculateTestResult } from '../utils/testResultCalculators';
import { MBTIResults, IntelligenceResults, BigFiveResults, RIASECResults, VARKResults, SVSResults, DecisionResults } from './results';
import LifeSituationResults from './results/LifeSituationResults';
import { testResultService, UserOverview } from '@/services/testResultService';
import { useAuth } from '@/contexts/AuthContext';
import { useUserOverview, clearUserDataCache, forceRefreshUserData } from '@/hooks/useTestResults';
import { aiInsightsService, AIInsights } from '@/services/aiInsightsService';
import { completionStatusService } from '@/services/completionStatusService';
// Removed useReportDownload - using simple window.print() instead
import {
  MBTIResultDisplay,
  MultipleIntelligenceResultDisplay,
  RIASECResultDisplay,
  SVSResultDisplay,
  DecisionMakingResultDisplay,
  VARKResultDisplay
} from '@/components/TestResultDisplays';
import ModernAIInsights from '@/components/ModernAIInsights';
import {
  Trophy,
  Target,
  TrendingUp,
  Award,
  BarChart3,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  ArrowLeft,
  Star,
  Lightbulb,
  Download,
  Share2,
  Eye,
  Brain,
  Users,
  User,
  Briefcase,
  BookOpen,
  Zap,
  Heart,
  Shield,
  Compass,
  Clock,
  Calendar,
  Activity,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Radar,
  Globe,
  MessageCircle,
  Camera,
  AlertCircle,
  FileText,
  Mail,
  Link,
  Bookmark,
  Filter,
  Search,
  Settings,
  Info,
  HelpCircle,
  BarChart,
  Code,
  AlertTriangle,
  Map,
  MapPin,
  Rocket,
  Layers,
  Zap as Lightning,
  Flame,
  Crown,
  Medal,
  Gift,
  PieChart,
  ArrowDown
} from 'lucide-react';

interface ModernResultsProps {
  onBack: () => void;
  onRetake: () => void;
}

const ModernResults: React.FC<ModernResultsProps> = ({ onBack, onRetake }) => {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const { testResults } = useAppStore();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [calculatedResult, setCalculatedResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [allTestsCompleted, setAllTestsCompleted] = useState(false);
  const [testCompletionStatus, setTestCompletionStatus] = useState<any>(null);
  const [selectedInsight, setSelectedInsight] = useState<string>('');
  const [hasProcessed, setHasProcessed] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Use centralized hook instead of direct API calls - consistent user ID logic
  const authUserId = user?.id || '';
  const storageUserId = localStorage.getItem('userId') || '';
  const userId = authUserId || storageUserId;
  
  // Always call hooks - conditional rendering comes after
  const { overview: userOverview, loading: isLoadingOverview, error: overviewError } = useUserOverview(userId || 'default');

  // Auto-save function - defined before useEffect that uses it
  const autoSaveResult = useCallback(async (result: any) => {
    if (!testResults || !result || isSaving || saveStatus === 'saved') {
      return;
    }

    // Check if this test result was already submitted recently (prevent duplicate saves)
    const lastSubmissionKey = `lastSubmission_${testResults.testId}`;
    const lastSubmissionTime = localStorage.getItem(lastSubmissionKey);
    const now = Date.now();

    if (lastSubmissionTime && (now - parseInt(lastSubmissionTime)) < 30000) { // 30 seconds - increased from 10
      setSaveStatus('saved'); // Mark as saved to prevent further attempts
      return;
    }

    // Additional check: Skip auto-save if we're coming from Quiz component
    // Quiz component already saves the results, so ModernResults doesn't need to save again
    if (testResults.answers && Object.keys(testResults.answers).length > 0) {
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('saving');
    setIsSaving(true);

    try {
      // Use consistent user ID from auth context, fallback to localStorage
      const authUserId = user?.id || '';
      const storageUserId = localStorage.getItem('userId') || '';
      const userId = authUserId || storageUserId;
      
      if (!userId) {
        console.error('🚨 No user ID available for saving test result');
        setSaveStatus('error');
        return;
      }

      const saveResponse = await testResultService.autoSaveResult(
        userId,
        testResults.testId,
        testResults.answers,
        result
      );

      // Mark session as saved and track submission time
      const sessionKey = `session_${testResults.testId}_${userId}`;
      localStorage.setItem('lastSavedSession', sessionKey);
      localStorage.setItem(lastSubmissionKey, now.toString());

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000); // Reset after 3 seconds
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000); // Reset after 5 seconds
    } finally {
      setIsSaving(false);
    }
  }, [testResults, isSaving, saveStatus]);

  // Generate AI insights callback
  const generateAIInsights = useCallback(async (result: any) => {
    if (!result || !testResults || isLoadingInsights || aiInsights) {
      return;
    }

    setIsLoadingInsights(true);
    setInsightsError(null);

    try {
      const authUserId = user?.id || '';
      const storageUserId = localStorage.getItem('userId') || '';
      const userId = authUserId || storageUserId;
      
      if (!userId) {
        throw new Error('No user ID available for AI insights');
      }

      const insights = await aiInsightsService.generateInsights(
        userId,
        testResults.testId,
        result
      );

      setAiInsights(insights);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      setInsightsError(error instanceof Error ? error.message : 'Failed to generate insights');
    } finally {
      setIsLoadingInsights(false);
    }
  }, [testResults, isLoadingInsights, aiInsights, user?.id]);

  // Check test completion status callback
  const checkTestCompletion = useCallback(async () => {
    if (!userId) return null;
    
    try {
      const statusResponse = await completionStatusService.getCompletionStatus(userId, true);
      const status = {
        allCompleted: statusResponse.data.all_completed,
        completedTests: statusResponse.data.completed_tests,
        missingTests: statusResponse.data.missing_tests,
        totalTests: statusResponse.data.total_tests,
        completionPercentage: statusResponse.data.completion_percentage
      };
      setTestCompletionStatus(status);
      setAllTestsCompleted(status.allCompleted);
      return status;
    } catch (error) {
      console.error('Error checking test completion:', error);
      return null;
    }
  }, [userId]);

  // Handle tab change callback
  const handleTabChange = useCallback((tabName: string) => {
    if (tabName === activeTab) {
      return;
    }

    setActiveTab(tabName);

    // Only generate AI insights when user clicks on AI insights tab
    if (tabName === 'insights' && !aiInsights && !isLoadingInsights && calculatedResult) {
      generateAIInsights(calculatedResult);
    }
  }, [activeTab, aiInsights, isLoadingInsights, calculatedResult, generateAIInsights]);

  // Reset state on component mount or testResults change
  useEffect(() => {
    if (testResults && testResults.testId) {
      // Reset processing state when new test results arrive
      setHasProcessed(false);
      setCalculatedResult(null);
      setIsInitialLoad(false);
    }
  }, [testResults]);

  // Check test completion on component mount
  useEffect(() => {
    checkTestCompletion();
  }, [checkTestCompletion]);

  // Calculate dynamic result when component mounts or testResults change
  useEffect(() => {
    let isMounted = true;

    const processResults = async () => {
      if (!testResults || hasProcessed) return;

      try {

        // Calculate result based on specific test type and answers using backend
        const result = await calculateTestResult(
          testResults.testId,
          testResults.answers,
          user?.id || '1', // Use authenticated user ID, fallback to '1' if not available
          testResults.sessionId
        );

        if (isMounted && result) {

          // Add test-specific metadata
          const enhancedResult = {
            ...result,
            testType: testResults.testId,
            completedAt: testResults.timestamp,
            totalQuestions: Object.keys(testResults.answers).length
          };

          setCalculatedResult(enhancedResult);
          setHasProcessed(true);

          // Auto-save the result
          await autoSaveResult(enhancedResult);
          
          // CRITICAL FIX: Refresh completion status after test is saved
          console.log('🔄 Refreshing completion status after test completion...');
          await checkTestCompletion();
        } else {
          
        }
      } catch (error) {
        console.error('Error processing results:', error);
      } finally {
        if (isMounted) {
          setIsInitialLoad(false);
        }
      }
    };

    processResults();

    return () => {
      isMounted = false;
    };
  }, [testResults, hasProcessed, autoSaveResult]);

  // CONDITIONAL RENDERING LOGIC - AFTER ALL HOOKS
  // CRITICAL FIX: Don't render if no valid user ID
  if (!userId) {
    console.error('🚨 No user ID available in ModernResults');
    return <div>Please log in to view results</div>;
  }

  // Handle download report function
  const handleDownloadReport = () => {
    // Set unique filename based on test type
    const originalTitle = document.title;
    const testName = testResults?.testName || 'Test Result';
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = `${testName}_Report_${timestamp}`;
    
    document.title = filename;
    window.print();
    document.title = originalTitle;
  };

  if (!testResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BarChart3 className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">No Results Available</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">Complete a test to see your comprehensive analysis and personalized insights.</p>
          <button
            onClick={onBack}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 flex items-center space-x-3 mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1 no-print"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Take Assessment</span>
          </button>
        </motion.div>
      </div>
    );
  }

  const completedAt = new Date(testResults.timestamp);

  const getMbtiCode = (): string | null => {
    if (testResults.testId !== 'mbti' || !testResults.answers) return null;
    const counts: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    Object.values(testResults.answers).forEach((answerData: any) => {
      const letter: string | undefined = answerData?.dimension;
      if (letter && counts[letter] !== undefined) {
        const weight = typeof answerData.weight === 'number' ? answerData.weight : 1;
        counts[letter] += weight;
      }
    });
    const code = [
      counts.E >= counts.I ? 'E' : 'I',
      counts.S >= counts.N ? 'S' : 'N',
      counts.T >= counts.F ? 'T' : 'F',
      counts.J >= counts.P ? 'J' : 'P',
    ].join('');
    return code;
  };

  // Use calculated result immediately for instant display
  const getPersonalityTypeForDisplay = () => {
    // First priority: Use calculated result for instant display
    if (calculatedResult && calculatedResult.code) {
      return mbtiTypes[calculatedResult.code as keyof typeof mbtiTypes] || null;
    }

    // Second priority: Calculate from current test session
    const mbtiCode = getMbtiCode();
    if (mbtiCode) {
      return mbtiTypes[mbtiCode as keyof typeof mbtiTypes] || null;
    }

    // Last fallback: API data
    if (userOverview && userOverview.latest_test_results && userOverview.latest_test_results.length > 0) {
      const latestResult = userOverview.latest_test_results.find(result => result.test_id === 'mbti');
      if (latestResult) {
        return mbtiTypes[latestResult.primary_result as keyof typeof mbtiTypes] || null;
      }
    }

    return null;
  };

  const personalityType = getPersonalityTypeForDisplay();

  // Function to render test-specific statistics cards
  const renderTestSpecificStats = () => {
    if (!calculatedResult) return null;

    const testType = calculatedResult.testType || testResults?.testId;

    switch (testType) {
      case 'mbti':
        return (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">MBTI Type</h4>
              <div className="text-2xl font-bold text-blue-600 mb-1">{calculatedResult.code}</div>
              <p className="text-sm text-slate-600">Personality Code</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Dimensions</h4>
              <div className="text-2xl font-bold text-indigo-600 mb-1">{calculatedResult.dimensions?.length || 4}</div>
              <p className="text-sm text-slate-600">Measured</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Careers</h4>
              <div className="text-2xl font-bold text-green-600 mb-1">{calculatedResult.careers?.length || 0}</div>
              <p className="text-sm text-slate-600">Suggested</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Strengths</h4>
              <div className="text-2xl font-bold text-purple-600 mb-1">{calculatedResult.strengths?.length || 0}</div>
              <p className="text-sm text-slate-600">Key Traits</p>
            </motion.div>
          </div>
        );

      case 'intelligence':
        return (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Dominant Intelligence</h4>
              <div className="text-xl font-bold text-green-600 mb-1 capitalize">{calculatedResult.dominantType}</div>
              <p className="text-sm text-slate-600">Primary Strength</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Intelligence Types</h4>
              <div className="text-2xl font-bold text-emerald-600 mb-1">{calculatedResult.allIntelligences?.length || 8}</div>
              <p className="text-sm text-slate-600">Assessed</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-teal-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Top Score</h4>
              <div className="text-2xl font-bold text-teal-600 mb-1">{calculatedResult.topIntelligences?.[0]?.percentage || 0}%</div>
              <p className="text-sm text-slate-600">Peak Intelligence</p>
            </motion.div>
          </div>
        );

      case 'bigfive':
        return (
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {calculatedResult.dimensions?.map((trait: any, idx: number) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: idx * 0.1 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 mb-2 capitalize">{trait.trait}</h4>
                <div className="text-xl font-bold text-purple-600 mb-1">{trait.level}</div>
                <p className="text-xs text-slate-600">{trait.percentage}%</p>
              </motion.div>
            ))}
          </div>
        );

      case 'riasec':
        return (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Holland Code</h4>
              <div className="text-2xl font-bold text-orange-600 mb-1">{calculatedResult.hollandCode}</div>
              <p className="text-sm text-slate-600">Career Code</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-red-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Top Interest</h4>
              <div className="text-lg font-bold text-red-600 mb-1 capitalize">{calculatedResult.topInterests?.[0]?.type}</div>
              <p className="text-sm text-slate-600">{calculatedResult.topInterests?.[0]?.percentage}%</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Interest Areas</h4>
              <div className="text-2xl font-bold text-yellow-600 mb-1">{calculatedResult.allInterests?.length || 6}</div>
              <p className="text-sm text-slate-600">Evaluated</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Career Match</h4>
              <div className="text-2xl font-bold text-pink-600 mb-1">{calculatedResult.careers?.length || 0}</div>
              <p className="text-sm text-slate-600">Careers</p>
            </motion.div>
          </div>
        );

      case 'vark':
        return (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {calculatedResult.allStyles?.map((style: any, idx: number) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: idx * 0.1 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                <div className={`w-12 h-12 ${idx === 0 ? 'bg-teal-100' : 'bg-gray-100'} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <Eye className={`w-6 h-6 ${idx === 0 ? 'text-teal-600' : 'text-gray-600'}`} />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 mb-2 capitalize">{style.type}</h4>
                <div className={`text-xl font-bold ${idx === 0 ? 'text-teal-600' : 'text-gray-600'} mb-1`}>{style.percentage}%</div>
                <p className="text-xs text-slate-600">{idx === 0 ? 'Primary' : 'Secondary'}</p>
              </motion.div>
            ))}
          </div>
        );

      default:
        return (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-gray-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Test Type</h4>
              <div className="text-xl font-bold text-gray-600 mb-1 uppercase">{testType}</div>
              <p className="text-sm text-slate-600">Assessment</p>
            </motion.div>
          </div>
        );
    }
  };

  // Function to render test-specific results using separate components
  const renderTestSpecificResults = () => {
    if (!calculatedResult || !testResults) return null;

    const testType = calculatedResult.testType || testResults?.testId;

    switch (testType) {
      case 'mbti':
        return <MBTIResults calculatedResult={calculatedResult} testResults={testResults} />;

      case 'intelligence':
        return <IntelligenceResults calculatedResult={calculatedResult} testResults={testResults} />;

      case 'bigfive':
        return <BigFiveResults calculatedResult={calculatedResult} testResults={testResults} />;

      case 'riasec':
        return <RIASECResults calculatedResult={calculatedResult} testResults={testResults} />;

      case 'vark':
        return <VARKResults calculatedResult={calculatedResult} testResults={testResults} />;

      case 'svs':
        return <SVSResults calculatedResult={calculatedResult} testResults={testResults} />;

      case 'decision':
        return <DecisionResults calculatedResult={calculatedResult} testResults={testResults} />;

      case 'life-situation':
        return <LifeSituationResults 
          calculatedResult={calculatedResult} 
          testResults={testResults}
          userAnswers={(testResults as any)?.userAnswers}
          questions={(testResults as any)?.questions}
        />;

      default:
        return (
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 border border-orange-200 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Test Results Processing</h3>
            <p className="text-gray-600">Results for {testType} test are being calculated...</p>
            <div className="mt-4 w-full bg-orange-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full w-3/4 animate-pulse"></div>
            </div>
          </div>
        );
    }
  };

  const getMbtiPairStats = () => {
    const counts: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    Object.values(testResults.answers).forEach((a: any) => {
      const letter = a?.dimension;
      const weight = typeof a?.weight === 'number' ? a.weight : 1;
      if (letter && counts[letter] !== undefined) counts[letter] += weight;
    });
    const makePair = (a: 'E'|'S'|'T'|'J', b: 'I'|'N'|'F'|'P', label1: string, label2: string) => {
      const total = counts[a] + counts[b];
      const aPct = total > 0 ? Math.round((counts[a] / total) * 100) : 0;
      return {
        a, b, aPct, bPct: 100 - aPct,
        aCount: counts[a], bCount: counts[b],
        label1, label2
      };
    };
    return [
      makePair('E', 'I', 'બહિર્મુખી', 'આંતર્મુખી'),
      makePair('S', 'N', 'અનુભવ', 'કલ્પના'),
      makePair('T', 'F', 'વિચાર', 'લાગણી'),
      makePair('J', 'P', 'આયોજન', 'ઓપન'),
    ];
  };

  const mbtiPairs = testResults.testId === 'mbti' ? getMbtiPairStats() : [];

  const getEnhancedRecommendations = () => {

    // Generate basic recommendations based on test type and traits
    const generateBasicRecommendations = (testId: string, traits: string[]): string[] => {
      const recommendations: string[] = [];

      if (testId === 'mbti') {
        if (traits.includes('બહિર્મુખી') || traits.includes('E')) {
          recommendations.push('સામાજિક પ્રવૃત્તિઓમાં ભાગ લો', 'ટીમ વર્કમાં નેતૃત્વ લો');
        }
        if (traits.includes('આંતર્મુખી') || traits.includes('I')) {
          recommendations.push('એકાંતમાં વિચાર કરવાનો સમય કાઢો', 'ઊંડા સંબંધો બનાવો');
        }
        if (traits.includes('વિચાર') || traits.includes('T')) {
          recommendations.push('તાર્કિક વિશ્લેષણ કુશળતા વધારો', 'નિર્ણય લેવામાં ઉદ્દેશ્યતા રાખો');
        }
        if (traits.includes('લાગણી') || traits.includes('F')) {
          recommendations.push('લોકોની લાગણીઓ સમજો', 'સહાનુભૂતિ વધારો');
        }
      } else if (testId === 'bigfive') {
        if (traits.includes('openness')) {
          recommendations.push('નવા અનુભવો માટે ખુલ્લા રહો', 'સર્જનાત્મકતા વિકસાવો');
        }
        if (traits.includes('conscientiousness')) {
          recommendations.push('લક્ષ્ય નિર્ધારણ કરો', 'સમય વ્યવસ્થાપન સુધારો');
        }
      }

      // Default recommendations if none specific
      if (recommendations.length === 0) {
        recommendations.push(
          'વ્યક્તિત્વ વિકાસ પર કામ કરો',
          'સતત શીખતા રહો',
          'સ્વ-જાગૃતિ વધારો'
        );
      }

      return recommendations;
    };

    // Extract data from test results if configurations are not available
    const extractDataFromTestResults = () => {
      if (!userOverview?.latest_test_results || userOverview.latest_test_results.length === 0) {
        return { strengths: [], careers: [], recommendations: [] };
      }

      const allStrengths: string[] = [];
      const allCareers: string[] = [];
      const allRecommendations: string[] = [];

      userOverview.latest_test_results.forEach((result, index) => {

        // Use MBTI-specific fields for MBTI tests, otherwise use traits as strengths if strengths array is empty
        if (result.strengths && Array.isArray(result.strengths) && result.strengths.length > 0) {
          allStrengths.push(...result.strengths);
        } else if (result.test_id === 'mbti' && (result as any).characteristics && Array.isArray((result as any).characteristics) && (result as any).characteristics.length > 0) {
          allStrengths.push(...(result as any).characteristics);
        } else if (result.traits && Array.isArray(result.traits) && result.traits.length > 0) {
          allStrengths.push(...result.traits);
        }

        // Use MBTI-specific career_suggestions for MBTI tests, otherwise use careers
        if (result.test_id === 'mbti' && (result as any).career_suggestions && Array.isArray((result as any).career_suggestions) && (result as any).career_suggestions.length > 0) {
          allCareers.push(...(result as any).career_suggestions);
        } else if (result.careers && Array.isArray(result.careers)) {
          allCareers.push(...result.careers);
        }

        if (result.recommendations && Array.isArray(result.recommendations) && result.recommendations.length > 0) {
          allRecommendations.push(...result.recommendations);
        } else {
          // Generate basic recommendations based on test type and traits
          const basicRecs = generateBasicRecommendations(result.test_id, result.traits || []);
          allRecommendations.push(...basicRecs);
        }
      });

      return {
        strengths: Array.from(new Set(allStrengths)), // Remove duplicates
        careers: Array.from(new Set(allCareers)),
        recommendations: Array.from(new Set(allRecommendations))
      };
    };

    // Try to use user overview data first, then extract from test results
    let dynamicData = null;

    if (userOverview) {
      // Always extract from test results to get more comprehensive data
      const extracted = extractDataFromTestResults();

      // Combine API data with extracted data for better coverage
      const combinedStrengths = [
        ...(userOverview?.top_strengths || []),
        ...extracted.strengths
      ];

      const combinedCareers = userOverview?.top_careers || extracted.careers;

      const combinedRecommendations = [
        ...(userOverview?.development_areas || []),
        ...extracted.recommendations
      ];

      if (combinedStrengths.length > 0 || combinedCareers.length > 0) {

        const personalData = Array.from(new Set(combinedStrengths)).slice(0, 4);
        const careerData = Array.from(new Set(combinedCareers)).slice(0, 4);
        const relationshipsData = Array.from(new Set(combinedRecommendations)).slice(0, 4);
        const growthData = Array.from(new Set(combinedRecommendations)).slice(4, 8).length > 0
          ? Array.from(new Set(combinedRecommendations)).slice(4, 8)
          : [
              "Challenge yourself in areas outside your comfort zone",
              "Seek feedback from trusted mentors and colleagues",
              "Continuously learn and adapt to new situations",
              "Celebrate your progress and acknowledge your achievements"
            ];

        dynamicData = {
          personal: personalData,
          career: careerData,
          relationships: relationshipsData,
          growth: growthData
        };
      }
    }

    // If we have dynamic data, use it
    if (dynamicData && (dynamicData.personal.length > 0 || dynamicData.career.length > 0)) {
      return dynamicData;
    }

    // No static fallback - return empty data to force API usage
    return {
      personal: [],
      career: [],
      relationships: [],
      growth: []
    };
  };

  const enhancedRecommendations = getEnhancedRecommendations();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-emerald-500 to-green-600';
    if (score >= 80) return 'from-blue-500 to-indigo-600';
    if (score >= 70) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Outstanding';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-container {
            background: white !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 20px !important;
          }
          body {
            background: white !important;
          }
          /* Hide common navigation elements */
          nav, header, .navbar, .header, .navigation {
            display: none !important;
          }
          /* Hide any element with these common navigation classes */
          .nav-bar, .top-bar, .menu-bar, .app-header {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 print-container">

      {/* Clean Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >

              {/* Loading State for Overview - Only when fetching API data */}
              {isLoadingOverview && (
                <div className="space-y-6">
                  {/* Loading Header */}
                  <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Loading Your Overview</h3>
                    <p className="text-slate-600 mb-4">Fetching your latest test results and insights...</p>
                    <div className="flex justify-center space-x-2">
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-secondary-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>

                  {/* Loading Skeleton Cards */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gray-200 rounded-xl mx-auto mb-4 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                          <div className="h-6 bg-gray-200 rounded mb-1 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Loading Detail Cards */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center mb-6">
                          <div className="w-10 h-10 bg-gray-200 rounded-xl mr-4 animate-pulse"></div>
                          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                        </div>
                        <div className="space-y-3">
                          {[1, 2, 3].map((j) => (
                            <div key={j} className="bg-gray-50 rounded-xl p-3">
                              <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Data Available Message - Only show if no calculated result and no API data */}
              {!isLoadingOverview && !calculatedResult && (!userOverview || !userOverview?.latest_test_results || userOverview.latest_test_results.length === 0) && (
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No Test Results Found</h3>
                  <p className="text-slate-600 mb-4">Complete some personality assessments to see your overview here.</p>
                  <button
                    onClick={onRetake}
                    className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    Take a Test
                  </button>
                </div>
              )}

              {/* Modern Overview Dashboard - Shows calculated results instantly */}
              {(calculatedResult || (personalityType && testResults)) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-6"
                >
                  {/* Clean Hero Section */}
                  <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Brain className="w-10 h-10 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-2">
                        {calculatedResult?.testType === 'mbti' && 'Your Personality Analysis'}
                        {calculatedResult?.testType === 'intelligence' && 'Your Intelligence Profile'}
                        {calculatedResult?.testType === 'bigfive' && 'Your Personality Traits'}
                        {calculatedResult?.testType === 'riasec' && 'Your Career Interests'}
                        {calculatedResult?.testType === 'vark' && 'Your Learning Style'}
                        {calculatedResult?.testType === 'svs' && 'Your Value System'}
                        {calculatedResult?.testType === 'decision' && 'Your Decision Style'}
                        {calculatedResult?.testType === 'life-situation' && 'Your Life Situation Assessment'}
                        {!calculatedResult?.testType && 'Your Test Results'}
                      </h2>
                      <p className="text-lg text-slate-600 mb-4">
                        {calculatedResult?.testType === 'mbti' && 'તમારું વ્યક્તિત્વ વિશ્લેષણ'}
                        {calculatedResult?.testType === 'intelligence' && 'તમારી બુદ્ધિ પ્રોફાઇલ'}
                        {calculatedResult?.testType === 'bigfive' && 'તમારા વ્યક્તિત્વ લક્ષણો'}
                        {calculatedResult?.testType === 'riasec' && 'તમારી કારકિર્દી રુચિઓ'}
                        {calculatedResult?.testType === 'vark' && 'તમારી શીખવાની શૈલી'}
                        {calculatedResult?.testType === 'svs' && 'તમારી મૂલ્ય પ્રણાલી'}
                        {calculatedResult?.testType === 'decision' && 'તમારી નિર્ણય શૈલી'}
                        {calculatedResult?.testType === 'life-situation' && 'તમારી જીવન પરિસ્થિતિ મૂલ્યાંકન'}
                        {!calculatedResult?.testType && 'તમારા પરીક્ષણ પરિણામો'}
                      </p>
                      <div className="space-y-2">
                        <div className="inline-flex items-center px-4 py-2 bg-primary-50 text-primary-700 rounded-full border border-primary-200">
                          <span className="font-semibold">
                            {calculatedResult?.testType ? `${calculatedResult.testType.toUpperCase()} Test` : 'Test Completed'}
                          </span>
                        </div>
                        {calculatedResult && (
                          <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-200">
                            <span className="font-semibold">
                              {calculatedResult.code || calculatedResult.dominantType || calculatedResult.primaryStyle?.type || 'Result Calculated'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Test-Specific Results Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    {renderTestSpecificResults()}
                  </motion.div>

                </motion.div>
              )}

            </motion.div>
          )}

          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Cognitive Functions Analysis */}
              {personalityType && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                          <Brain className="w-6 h-6 mr-3 text-purple-600" />
                          Cognitive Functions Stack
                        </h3>
                        <p className="text-gray-600 mt-1">Deep dive into your mental processing preferences</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Function Strength</div>
                        <div className="text-lg font-bold text-purple-600">Dominant</div>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        {[
                          { name: 'Dominant Function', strength: 95, color: 'from-purple-500 to-purple-600', description: 'Your primary way of processing information and making decisions' },
                          { name: 'Auxiliary Function', strength: 78, color: 'from-blue-500 to-blue-600', description: 'Your supporting function that balances your dominant' },
                          { name: 'Tertiary Function', strength: 45, color: 'from-green-500 to-green-600', description: 'Develops in midlife, adds complexity to personality' },
                          { name: 'Inferior Function', strength: 23, color: 'from-orange-500 to-red-600', description: 'Your weakest area, source of stress but growth potential' }
                        ].map((func, index) => (
                          <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 bg-gradient-to-r ${func.color} rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900">{func.name}</h4>
                                  <div className="text-sm text-gray-600">{func.strength}% developed</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${func.color} text-white`}>
                                  {func.strength > 80 ? 'Strong' : func.strength > 60 ? 'Moderate' : func.strength > 40 ? 'Developing' : 'Emerging'}
                                </div>
                              </div>
                            </div>

                            <div className="mb-3">
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <motion.div
                                  className={`bg-gradient-to-r ${func.color} h-3 rounded-full relative`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${func.strength}%` }}
                                  transition={{ duration: 1.5, delay: 0.3 + index * 0.2 }}
                                >
                                  <div className="absolute right-0 top-0 w-3 h-3 bg-white rounded-full shadow-lg transform translate-x-1/2"></div>
                                </motion.div>
                              </div>
                            </div>

                            <p className="text-sm text-gray-600 leading-relaxed">{func.description}</p>
                          </div>
                        ))}
                      </div>

                      {/* Function Interaction Map */}
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative w-80 h-80 mb-6">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 rounded-full"></div>

                          {/* Center */}
                          <div className="absolute inset-16 bg-white rounded-full shadow-inner flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-gray-900 mb-1">{calculatedResult?.code || 'XXXX'}</div>
                              <div className="text-sm text-gray-600">Function Stack</div>
                            </div>
                          </div>

                          {/* Function positions */}
                          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            Dominant
                          </div>
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            Auxiliary
                          </div>
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            Tertiary
                          </div>
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            Inferior
                          </div>
                        </div>

                        <div className="text-center">
                          <h4 className="font-bold text-gray-800 mb-2">Function Hierarchy</h4>
                          <p className="text-sm text-gray-600 max-w-64">
                            Your cognitive functions work together in a specific order of preference and development
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Response Pattern Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Activity className="w-6 h-6 mr-3 text-green-600" />
                    Response Pattern Analysis
                  </h3>

                  <div className="grid lg:grid-cols-3 gap-8">
                    {/* Response Speed */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <Clock className="w-8 h-8 text-blue-600" />
                        <span className="text-2xl font-bold text-blue-600">2.3s</span>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Average Response Time</h4>
                      <p className="text-sm text-gray-600 mb-3">You answered questions thoughtfully, taking time to consider each option carefully.</p>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: '75%' }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">75th percentile</div>
                    </div>

                    {/* Consistency Score */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <span className="text-2xl font-bold text-green-600">94%</span>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Response Consistency</h4>
                      <p className="text-sm text-gray-600 mb-3">Your answers show high internal consistency, indicating authentic responses.</p>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: '94%' }}
                          transition={{ duration: 1, delay: 0.7 }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Excellent reliability</div>
                    </div>

                    {/* Decision Confidence */}
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <Shield className="w-8 h-8 text-purple-600" />
                        <span className="text-2xl font-bold text-purple-600">87%</span>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Decision Confidence</h4>
                      <p className="text-sm text-gray-600 mb-3">You showed strong conviction in your choices with minimal hesitation patterns.</p>
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: '87%' }}
                          transition={{ duration: 1, delay: 0.9 }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">High confidence</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Detailed Dimension Breakdown */}
              {testResults.testId === 'mbti' && mbtiPairs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <Layers className="w-6 h-6 mr-3 text-indigo-600" />
                      Detailed Dimension Analysis
                    </h3>

                    <div className="space-y-8">
                      {mbtiPairs.map((pair, idx) => {
                        const dimensionInfo = {
                          0: {
                            title: 'Energy Direction',
                            description: 'How you direct your energy and attention',
                            traits: {
                              E: ['Outgoing', 'Expressive', 'Social energy', 'External focus'],
                              I: ['Reflective', 'Reserved', 'Internal energy', 'Depth over breadth']
                            }
                          },
                          1: {
                            title: 'Information Processing',
                            description: 'How you take in and process information',
                            traits: {
                              S: ['Practical', 'Detail-oriented', 'Present-focused', 'Concrete'],
                              N: ['Imaginative', 'Big-picture', 'Future-focused', 'Abstract']
                            }
                          },
                          2: {
                            title: 'Decision Making',
                            description: 'How you make decisions and judgments',
                            traits: {
                              T: ['Logical', 'Objective', 'Analytical', 'Impartial'],
                              F: ['Values-based', 'Subjective', 'Empathetic', 'Personal']
                            }
                          },
                          3: {
                            title: 'Lifestyle Approach',
                            description: 'How you approach the outside world',
                            traits: {
                              J: ['Structured', 'Planned', 'Decisive', 'Organized'],
                              P: ['Flexible', 'Spontaneous', 'Adaptable', 'Open-ended']
                            }
                          }
                        };

                        const info = dimensionInfo[idx as keyof typeof dimensionInfo];
                        const dominantSide = pair.aPct > 50 ? 'a' : 'b';
                        const dominantTraits: string[] = dominantSide === 'a' ? (info.traits[pair.a as keyof typeof info.traits] || []) : (info.traits[pair.b as keyof typeof info.traits] || []);

                        return (
                          <div key={idx} className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-6 border border-gray-200">
                            <div className="grid lg:grid-cols-3 gap-6">
                              <div className="lg:col-span-2">
                                <div className="flex items-center space-x-3 mb-4">
                                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <h4 className="text-xl font-bold text-gray-900">{info.title}</h4>
                                    <p className="text-sm text-gray-600">{info.description}</p>
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-gray-800">{pair.label1}</span>
                                    <span className="font-semibold text-gray-800">{pair.label2}</span>
                                  </div>
                                  <div className="relative">
                                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                      <div className="h-4 flex">
                                        <motion.div
                                          className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-4 relative"
                                          initial={{ width: 0 }}
                                          animate={{ width: `${pair.aPct}%` }}
                                          transition={{ duration: 1.5, delay: 0.5 + idx * 0.2 }}
                                        >
                                          <div className="absolute right-0 top-0 w-4 h-4 bg-white rounded-full shadow-lg transform translate-x-1/2"></div>
                                        </motion.div>
                                        <motion.div
                                          className="bg-gradient-to-r from-gray-400 to-gray-500 h-4"
                                          initial={{ width: 0 }}
                                          animate={{ width: `${pair.bPct}%` }}
                                          transition={{ duration: 1.5, delay: 0.5 + idx * 0.2 }}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex justify-between text-sm font-semibold text-gray-600 mt-2">
                                      <span>{pair.aPct}%</span>
                                      <span>{pair.bPct}%</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-sm text-gray-600">
                                  <strong>Your preference:</strong> You lean toward {dominantSide === 'a' ? pair.label1 : pair.label2}
                                  ({dominantSide === 'a' ? pair.aPct : pair.bPct}%), showing a {dominantSide === 'a' ? pair.aPct : pair.bPct > 70 ? 'strong' : 'moderate'} preference.
                                </div>
                              </div>

                              <div>
                                <h5 className="font-semibold text-gray-800 mb-3">Key Traits</h5>
                                <div className="space-y-2">
                                  {dominantTraits.map((trait: string, traitIdx: number) => (
                                    <div key={traitIdx} className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                      <span className="text-sm text-gray-700">{trait}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Comparative Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <BarChart className="w-6 h-6 mr-3 text-orange-600" />
                    Comparative Benchmarking
                  </h3>

                  <div className="grid lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-bold text-gray-800 mb-4">Population Percentiles</h4>
                      <div className="space-y-4">
                        {[
                          { trait: 'Analytical Thinking', percentile: 92, color: 'blue' },
                          { trait: 'Emotional Intelligence', percentile: 67, color: 'green' },
                          { trait: 'Leadership Potential', percentile: 78, color: 'purple' },
                          { trait: 'Creativity Index', percentile: 84, color: 'pink' },
                          { trait: 'Team Collaboration', percentile: 71, color: 'indigo' }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-800">{item.trait}</span>
                            <div className="flex items-center space-x-3">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <motion.div
                                  className={`bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 h-2 rounded-full`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.percentile}%` }}
                                  transition={{ duration: 1, delay: 0.7 + index * 0.1 }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-gray-600 w-8">{item.percentile}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-800 mb-4">Type Distribution</h4>
                      <div className="bg-gradient-to-br from-gray-100 to-blue-100 rounded-xl p-6">
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold text-gray-900">{personalityType ? '12.8%' : '8.5%'}</div>
                          <div className="text-sm text-gray-600">of population shares your type</div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Rarity Rank</span>
                            <span className="font-semibold text-gray-800">6th of 16 types</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Similar Types</span>
                            <span className="font-semibold text-gray-800">3 related types</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Complementary</span>
                            <span className="font-semibold text-gray-800">4 compatible types</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {false && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Loading State - Backend API Call */}
              {isLoadingInsights && (
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Generating AI Insights</h3>
                  <p className="text-slate-600 mb-4">Calling backend API to generate your personalized insights...</p>
                  <div className="flex justify-center space-x-2 mb-4">
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-secondary-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <p className="text-xs text-slate-500">Please wait while we process your data...</p>
                </div>
              )}

              {/* Error State */}
              {insightsError && !isLoadingInsights && (
                <div className="bg-red-50 rounded-2xl p-8 border border-red-200 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-red-800 mb-2">Analysis Unavailable</h3>
                  <p className="text-red-600 mb-4">
                    {typeof insightsError === 'string' ? insightsError : 'Failed to generate AI insights. Please try again.'}
                  </p>
                  <button
                    onClick={() => generateAIInsights(calculatedResult)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl transition-colors duration-200"
                  >
                    Retry Analysis
                  </button>
                </div>
              )}

              {/* AI Insights Content */}
              {aiInsights && !isLoadingInsights && (
                <>
                  {/* Header Section */}
                  <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">AI-Powered Insights</h2>
                    <p className="text-slate-600">Comprehensive analysis based on your assessment results</p>
                  </div>

                  {/* Best Field Recommendation */}
                  {aiInsights?.best_field && (
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mr-4">
                          <Target className="w-6 h-6 text-primary-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Best Match Field</h3>
                      </div>
                      <div className="bg-primary-50 rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-primary-800 mb-3">{aiInsights?.best_field?.field || 'Best Career Field'}</h4>
                        <p className="text-slate-700 leading-relaxed mb-4">{aiInsights?.best_field?.reasoning || 'Analysis of your best career field match'}</p>
                        <div className="flex items-center">
                          <div className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {aiInsights?.best_field?.match_percentage || 90}% Match
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Career Recommendations */}
                  {aiInsights?.career_recommendations && aiInsights.career_recommendations.length > 0 && (
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm no-print">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                          <Briefcase className="w-6 h-6 text-orange-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Career Recommendations</h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {(aiInsights?.career_recommendations || []).slice(0, 6).map((career, index) => (
                          <div key={index} className="bg-orange-50 rounded-xl p-4">
                            <h4 className="font-semibold text-orange-800 mb-2">{career?.job_role || 'Career Role'}</h4>
                            <p className="text-slate-700 text-sm mb-3">{(career as any)?.description || 'Career description and details'}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                                {(career as any)?.match_score || 85}% Match
                              </span>
                              {(career as any)?.salary_range && (
                                <span className="text-xs text-slate-600">
                                  {(career as any)?.salary_range}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Behavioral Insights */}
                  {(aiInsights as any)?.behavioral_insights && (aiInsights as any).behavioral_insights.length > 0 && (
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Behavioral Insights</h3>
                      </div>
                      <div className="space-y-4">
                        {((aiInsights as any)?.behavioral_insights || []).slice(0, 4).map((insight: any, index: number) => (
                          <div key={index} className="bg-blue-50 rounded-xl p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-blue-800">{(insight as any)?.category || 'Behavioral Insight'}</h4>
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                {(insight as any)?.confidence || 85}% Confidence
                              </span>
                            </div>
                            <p className="text-slate-700 text-sm">{(insight as any)?.insight || 'Behavioral analysis and insights'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Learning Recommendations */}
                  {(aiInsights as any)?.learning_recommendations && (aiInsights as any).learning_recommendations.length > 0 && (
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm no-print">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                          <BookOpen className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Learning Path</h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {((aiInsights as any)?.learning_recommendations || []).slice(0, 4).map((recommendation: any, index: number) => (
                          <div key={index} className="bg-green-50 rounded-xl p-4">
                            <h4 className="font-semibold text-green-800 mb-2">{recommendation?.skill || 'Learning Skill'}</h4>
                            <p className="text-slate-700 text-sm mb-3">{recommendation?.description || 'Skill development recommendation'}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                {recommendation?.priority || 'Medium'} Priority
                              </span>
                              <span className="text-xs text-slate-600">
                                {recommendation?.timeframe || '3-6 months'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Roadmap Section */}
                  {aiInsights?.roadmap && (
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                          <MapPin className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Career Roadmap</h3>
                      </div>
                      <div className="grid md:grid-cols-3 gap-6">
                        {/* Short Term */}
                        <div className="bg-blue-50 rounded-xl p-6">
                          <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Short Term ({aiInsights?.roadmap?.short_term?.duration || '0-6 months'})
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <h5 className="text-sm font-medium text-slate-700 mb-1">Goals</h5>
                              <ul className="text-sm text-slate-600 space-y-1">
                                {(aiInsights?.roadmap?.short_term?.goals || ['Define short-term career goals']).map((goal, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                                    {goal}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-slate-700 mb-1">Skills to Develop</h5>
                              <div className="flex flex-wrap gap-1">
                                {(aiInsights?.roadmap?.short_term?.skills_to_develop || ['Identify key skills']).map((skill, idx) => (
                                  <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mid Term */}
                        <div className="bg-orange-50 rounded-xl p-6">
                          <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Mid Term ({aiInsights?.roadmap?.mid_term?.duration || '6-18 months'})
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <h5 className="text-sm font-medium text-slate-700 mb-1">Goals</h5>
                              <ul className="text-sm text-slate-600 space-y-1">
                                {(aiInsights?.roadmap?.mid_term?.goals || ['Set mid-term career objectives']).map((goal, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                                    {goal}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-slate-700 mb-1">Milestones</h5>
                              <div className="flex flex-wrap gap-1">
                                {(aiInsights?.roadmap?.mid_term?.milestones || ['Achieve key milestones']).map((milestone, idx) => (
                                  <span key={idx} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                    {milestone}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Long Term */}
                        <div className="bg-green-50 rounded-xl p-6">
                          <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                            <Target className="w-4 h-4 mr-2" />
                            Long Term ({aiInsights?.roadmap?.long_term?.duration || '18+ months'})
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <h5 className="text-sm font-medium text-slate-700 mb-1">Goals</h5>
                              <ul className="text-sm text-slate-600 space-y-1">
                                {(aiInsights?.roadmap?.long_term?.goals || ['Establish long-term career vision']).map((goal, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                                    {goal}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-slate-700 mb-1">Expertise Areas</h5>
                              <div className="flex flex-wrap gap-1">
                                {(aiInsights?.roadmap?.long_term?.expertise_areas || ['Develop core expertise']).map((area, idx) => (
                                  <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    {area}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Strengths & Weaknesses Analysis */}
                  {aiInsights.result_analysis && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Strengths */}
                      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                        <div className="flex items-center mb-6">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                            <Award className="w-6 h-6 text-green-600" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-800">Your Strengths</h3>
                        </div>
                        <div className="space-y-4">
                          {(aiInsights?.result_analysis?.strengths || []).map((strength, index) => (
                            <div key={index} className="bg-green-50 rounded-xl p-4">
                              <h4 className="font-semibold text-green-800 mb-2">{strength?.strength || 'Strength'}</h4>
                              <p className="text-slate-700 text-sm mb-2">{strength?.reasoning || 'Analysis of your strength'}</p>
                              <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full inline-block">
                                Career Application: {strength?.career_application || 'Apply in career'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Areas for Improvement */}
                      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                        <div className="flex items-center mb-6">
                          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mr-4">
                            <TrendingUp className="w-6 h-6 text-yellow-600" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-800">Growth Areas</h3>
                        </div>
                        <div className="space-y-4">
                          {(aiInsights?.result_analysis?.weaknesses || []).map((weakness, index) => (
                            <div key={index} className="bg-yellow-50 rounded-xl p-4">
                              <h4 className="font-semibold text-yellow-800 mb-2">{weakness?.weakness || 'Growth Area'}</h4>
                              <p className="text-slate-700 text-sm mb-2">{weakness?.reasoning || 'Analysis of growth opportunity'}</p>
                              <div className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full inline-block">
                                Strategy: {weakness?.improvement_strategy || 'Improvement strategy'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skill Recommendations */}
                  {aiInsights?.skill_recommendations && (
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm no-print">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                          <Zap className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Skill Development</h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Technical Skills */}
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-4 flex items-center">
                            <Code className="w-4 h-4 mr-2" />
                            Technical Skills
                          </h4>
                          <div className="space-y-3">
                            {(aiInsights?.skill_recommendations?.technical_skills || []).map((skill, index) => (
                              <div key={index} className="bg-purple-50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold text-purple-800">{skill?.skill || 'Technical Skill'}</h5>
                                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                                    {skill?.importance || 'Medium'} Priority
                                  </span>
                                </div>
                                <div className="text-sm text-slate-700 mb-2">Resources:</div>
                                <div className="flex flex-wrap gap-1">
                                  {(skill?.learning_resources || []).map((resource, idx) => (
                                    <span key={idx} className="text-xs bg-white text-purple-700 px-2 py-1 rounded border">
                                      {resource}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Soft Skills */}
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-4 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Soft Skills
                          </h4>
                          <div className="space-y-3">
                            {(aiInsights?.skill_recommendations?.soft_skills || []).map((skill, index) => (
                              <div key={index} className="bg-blue-50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold text-blue-800">{skill?.skill || 'Soft Skill'}</h5>
                                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                    {skill?.importance || 'Medium'} Priority
                                  </span>
                                </div>
                                <p className="text-sm text-slate-700">{skill?.development_approach || 'Development approach for this skill'}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skill Gaps */}
                  {aiInsights?.skill_gaps && aiInsights.skill_gaps.length > 0 && (
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm no-print">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Skill Gaps to Address</h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {(aiInsights?.skill_gaps || []).map((gap, index) => (
                          <div key={index} className="bg-red-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-red-800">{gap?.gap || 'Skill Gap'}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                gap?.priority === 'High' ? 'bg-red-100 text-red-700' :
                                gap?.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {gap?.priority || 'Medium'} Priority
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 mb-2">{gap?.impact || 'Impact of addressing this gap'}</p>
                            <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                              Path: {gap?.learning_path || 'Learning path'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Future Plans */}
                  {aiInsights?.future_plans && (
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                          <Rocket className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Future Career Vision</h3>
                      </div>
                      <div className="grid md:grid-cols-3 gap-6">
                        {/* 3 Year Plan */}
                        <div className="bg-indigo-50 rounded-xl p-6">
                          <h4 className="font-semibold text-indigo-800 mb-3">3-Year Vision</h4>
                          <div className="space-y-3">
                            <div>
                              <h5 className="text-sm font-medium text-slate-700">Target Position</h5>
                              <p className="text-sm text-slate-600">{aiInsights?.future_plans?.["3_year_plan"]?.career_position || 'Target career position'}</p>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-slate-700">Key Achievements</h5>
                              <ul className="text-sm text-slate-600 space-y-1">
                                {(aiInsights?.future_plans?.["3_year_plan"]?.key_achievements || []).map((achievement, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                                    {achievement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* 5 Year Plan */}
                        <div className="bg-purple-50 rounded-xl p-6">
                          <h4 className="font-semibold text-purple-800 mb-3">5-Year Vision</h4>
                          <div className="space-y-3">
                            <div>
                              <h5 className="text-sm font-medium text-slate-700">Target Position</h5>
                              <p className="text-sm text-slate-600">{aiInsights?.future_plans?.["5_year_plan"]?.career_position || 'Target career position'}</p>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-slate-700">Expertise Areas</h5>
                              <div className="flex flex-wrap gap-1">
                                {(aiInsights?.future_plans?.["5_year_plan"]?.expertise_areas || []).map((area, idx) => (
                                  <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                    {area}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 10 Year Plan */}
                        <div className="bg-emerald-50 rounded-xl p-6">
                          <h4 className="font-semibold text-emerald-800 mb-3">10-Year Vision</h4>
                          <div className="space-y-3">
                            <div>
                              <h5 className="text-sm font-medium text-slate-700">Career Vision</h5>
                              <p className="text-sm text-slate-600">{aiInsights?.future_plans?.["10_year_plan"]?.career_vision || 'Long-term career vision'}</p>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-slate-700">Legacy Goals</h5>
                              <ul className="text-sm text-slate-600 space-y-1">
                                {(aiInsights?.future_plans?.["10_year_plan"]?.legacy_goals || []).map((goal, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                                    {goal}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Daily Habits */}
                  {aiInsights?.daily_habits && aiInsights.daily_habits.length > 0 && (
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mr-4">
                          <Activity className="w-6 h-6 text-teal-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Recommended Daily Habits</h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {(aiInsights?.daily_habits || []).map((habit, index) => (
                          <div key={index} className="bg-teal-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-teal-800">{habit?.habit || 'Daily Habit'}</h4>
                              <span className="text-xs text-teal-600 bg-teal-100 px-2 py-1 rounded-full">
                                {habit?.time_required || '10 mins'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 mb-2">{habit?.purpose || 'Purpose of this habit'}</p>
                            <div className="text-xs text-teal-600 bg-teal-100 px-2 py-1 rounded">
                              How: {habit?.implementation || 'Implementation approach'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {aiInsights?.certifications && aiInsights.certifications.length > 0 && (
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mr-4">
                          <Award className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Recommended Certifications</h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {(aiInsights?.certifications || []).map((cert, index) => (
                          <div key={index} className="bg-amber-50 rounded-xl p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-amber-800">{cert?.name || 'Certification'}</h4>
                              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                {cert?.difficulty_level || 'Intermediate'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 mb-2">{cert?.provider || 'Certification Provider'}</p>
                            <p className="text-sm text-slate-600 mb-3">{cert?.why_recommended || 'Recommended for career growth'}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-amber-600">{cert?.estimated_duration || '3-6 months'}</span>
                              <a
                                href={cert?.direct_enrollment_link || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-amber-600 text-white px-3 py-1 rounded-full hover:bg-amber-700 transition-colors"
                              >
                                Enroll Now
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Insights */}
                  {aiInsights?.additional_insights && (
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mr-4">
                          <Lightbulb className="w-6 h-6 text-cyan-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Additional Insights</h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {aiInsights?.additional_insights?.work_environment && (
                          <div className="bg-cyan-50 rounded-xl p-4">
                            <h4 className="font-semibold text-cyan-800 mb-2">Work Environment</h4>
                            <p className="text-sm text-slate-700">{aiInsights?.additional_insights?.work_environment}</p>
                          </div>
                        )}
                        {aiInsights?.additional_insights?.team_dynamics && (
                          <div className="bg-cyan-50 rounded-xl p-4">
                            <h4 className="font-semibold text-cyan-800 mb-2">Team Dynamics</h4>
                            <p className="text-sm text-slate-700">{aiInsights?.additional_insights?.team_dynamics}</p>
                          </div>
                        )}
                        {aiInsights?.additional_insights?.stress_management && (
                          <div className="bg-cyan-50 rounded-xl p-4">
                            <h4 className="font-semibold text-cyan-800 mb-2">Stress Management</h4>
                            <p className="text-sm text-slate-700">{aiInsights?.additional_insights?.stress_management}</p>
                          </div>
                        )}
                        {aiInsights?.additional_insights?.work_life_balance && (
                          <div className="bg-cyan-50 rounded-xl p-4">
                            <h4 className="font-semibold text-cyan-800 mb-2">Work-Life Balance</h4>
                            <p className="text-sm text-slate-700">{aiInsights?.additional_insights?.work_life_balance}</p>
                          </div>
                        )}
                        {aiInsights?.additional_insights?.gujarat_specific_advice && (
                          <div className="bg-cyan-50 rounded-xl p-4">
                            <h4 className="font-semibold text-cyan-800 mb-2">Gujarat-Specific Advice</h4>
                            <p className="text-sm text-slate-700">{aiInsights?.additional_insights?.gujarat_specific_advice}</p>
                          </div>
                        )}
                        {aiInsights?.additional_insights?.networking_tips && (
                          <div className="bg-cyan-50 rounded-xl p-4">
                            <h4 className="font-semibold text-cyan-800 mb-2">Networking Tips</h4>
                            <p className="text-sm text-slate-700">{aiInsights?.additional_insights?.networking_tips}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Summary Card */}
                  <div className="bg-gradient-to-br from-primary-50 to-orange-50 rounded-2xl p-8 border border-primary-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Your Complete AI Analysis</h3>
                      <p className="text-slate-600 mb-4">
                        Comprehensive career guidance powered by advanced AI analysis of your assessment results.
                      </p>
                      <div className="grid md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary-600">
                            {aiInsights.career_recommendations?.length || 0}
                          </div>
                          <div className="text-sm text-slate-600">Career Options</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-600">
                            {(aiInsights.skill_recommendations?.technical_skills?.length || 0) +
                             (aiInsights.skill_recommendations?.soft_skills?.length || 0)}
                          </div>
                          <div className="text-sm text-slate-600">Skills to Develop</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-secondary-600">
                            {aiInsights.certifications?.length || 0}
                          </div>
                          <div className="text-sm text-slate-600">Certifications</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {aiInsights.daily_habits?.length || 0}
                          </div>
                          <div className="text-sm text-slate-600">Daily Habits</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* No Insights Available */}
              {!aiInsights && !isLoadingInsights && !insightsError && (
                <div className="bg-yellow-50 rounded-2xl p-8 border border-yellow-200 text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">AI Insights Coming Soon</h3>
                  <p className="text-slate-600 mb-4">Complete your assessment to unlock personalized AI-powered insights.</p>
                  <button
                    onClick={() => calculatedResult && generateAIInsights(calculatedResult)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-xl transition-colors duration-200"
                    disabled={!calculatedResult}
                  >
                    Generate Insights
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'old_insights' && (
            <motion.div
              key="old_insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Dynamic AI Analysis Header */}
              <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-bold mb-3 flex items-center"
                      >
                        <Brain className="w-10 h-10 mr-4 animate-pulse" />
                        Personalized AI Insights
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-purple-100 text-lg"
                      >
                        {calculatedResult ?
                          `Advanced analysis of your ${testResults?.testId.toUpperCase()} profile` :
                          'Dynamic insights based on your test results'
                        }
                      </motion.p>
                      {isLoadingInsights && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center mt-3 text-purple-200"
                        >
                          <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                          <span className="text-sm font-medium">Generating personalized insights...</span>
                        </motion.div>
                      )}
                    </div>
                    <div className="text-right">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/10 backdrop-blur-sm rounded-2xl p-4"
                      >
                        <div className="text-sm text-purple-200 mb-1">AI Model</div>
                        <div className="text-xl font-bold">Gemini-2.0</div>
                        <div className="text-xs text-purple-300 mt-1">Flash Edition</div>
                        {insightsError && (
                          <div className="flex items-center mt-2 text-red-300">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            <span className="text-xs">Fallback Active</span>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </div>

                  {/* Dynamic Stats Cards */}
                  {(aiInsights || calculatedResult) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="grid md:grid-cols-4 gap-4"
                    >
                      <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                        <div className="flex items-center space-x-3 mb-3">
                          <Brain className="w-6 h-6 text-yellow-300" />
                          <span className="font-semibold text-lg">Insights</span>
                        </div>
                        <div className="text-3xl font-bold">
                          {(aiInsights as any)?.behavioral_insights?.length || (calculatedResult ? '8+' : '0')}
                        </div>
                        <div className="text-xs text-purple-200 mt-1">Behavioral patterns</div>
                      </div>
                      <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                        <div className="flex items-center space-x-3 mb-3">
                          <Target className="w-6 h-6 text-green-300" />
                          <span className="font-semibold text-lg">Predictions</span>
                        </div>
                        <div className="text-3xl font-bold">
                          {(aiInsights as any)?.predictions?.length || (calculatedResult ? '6+' : '0')}
                        </div>
                        <div className="text-xs text-purple-200 mt-1">Future outcomes</div>
                      </div>
                      <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                        <div className="flex items-center space-x-3 mb-3">
                          <Star className="w-6 h-6 text-blue-300" />
                          <span className="font-semibold text-lg">Strengths</span>
                        </div>
                        <div className="text-3xl font-bold">
                          {(aiInsights as any)?.unique_strengths?.length || (calculatedResult ? '5+' : '0')}
                        </div>
                        <div className="text-xs text-purple-200 mt-1">Unique abilities</div>
                      </div>
                      <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                        <div className="flex items-center space-x-3 mb-3">
                          <TrendingUp className="w-6 h-6 text-orange-300" />
                          <span className="font-semibold text-lg">Growth</span>
                        </div>
                        <div className="text-3xl font-bold">
                          {(aiInsights as any)?.growth_opportunities?.length || (calculatedResult ? '4+' : '0')}
                        </div>
                        <div className="text-xs text-purple-200 mt-1">Opportunities</div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Dynamic Content Based on Results */}
              {isLoadingInsights ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-3xl shadow-2xl p-12 text-center"
                >
                  <div className="relative">
                    <div className="w-24 h-24 mx-auto mb-6 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full animate-pulse"></div>
                      <Brain className="w-12 h-12 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Analyzing Your Profile</h3>
                    <p className="text-gray-600 mb-6">Our AI is processing your responses to generate personalized insights...</p>
                    <div className="flex justify-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </motion.div>
              ) : (aiInsights || calculatedResult) ? (
                <div className="space-y-8">
                  {/* 1. Best Field Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-3xl shadow-2xl p-8 border border-emerald-200"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Briefcase className="w-8 h-8 mr-4 text-emerald-600" />
                        Best Career Field
                      </h3>
                      <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-semibold">
                        {aiInsights?.best_field?.match_percentage || 85}% Match
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                      <h4 className="text-2xl font-bold text-emerald-800 mb-3">
                        {aiInsights?.best_field?.field || "Technology & Innovation"}
                      </h4>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {aiInsights?.best_field?.reasoning || "Your analytical thinking combined with creative problem-solving makes you ideal for technology roles where innovation meets practical implementation."}
                      </p>
                      <div className="w-full bg-emerald-200 rounded-full h-3">
                        <motion.div
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${aiInsights?.best_field?.match_percentage || 85}%` }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* 2. Learning Roadmap */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl shadow-2xl p-8 border border-blue-200"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-3xl font-bold text-gray-900 flex items-center">
                        <BookOpen className="w-8 h-8 mr-4 text-blue-600" />
                        Learning Roadmap
                      </h3>
                    </div>
                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* Short Term */}
                      <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-500">
                        <div className="flex items-center mb-4">
                          <Calendar className="w-6 h-6 text-green-600 mr-3" />
                          <h4 className="text-xl font-bold text-gray-800">Short Term</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          {aiInsights?.roadmap?.short_term?.duration || "1-3 months"}
                        </p>
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-semibold text-gray-800 mb-2">Goals:</h5>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {(aiInsights?.roadmap?.short_term?.goals || [
                                "Complete skills assessment",
                                "Research career opportunities"
                              ]).map((goal, idx) => (
                                <li key={idx} className="flex items-start">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {goal}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Mid Term */}
                      <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-yellow-500">
                        <div className="flex items-center mb-4">
                          <Clock className="w-6 h-6 text-yellow-600 mr-3" />
                          <h4 className="text-xl font-bold text-gray-800">Mid Term</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          {aiInsights?.roadmap?.mid_term?.duration || "6-12 months"}
                        </p>
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-semibold text-gray-800 mb-2">Goals:</h5>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {(aiInsights?.roadmap?.mid_term?.goals || [
                                "Build professional portfolio",
                                "Complete relevant certifications"
                              ]).map((goal, idx) => (
                                <li key={idx} className="flex items-start">
                                  <Target className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {goal}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Long Term */}
                      <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-purple-500">
                        <div className="flex items-center mb-4">
                          <TrendingUp className="w-6 h-6 text-purple-600 mr-3" />
                          <h4 className="text-xl font-bold text-gray-800">Long Term</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          {aiInsights?.roadmap?.long_term?.duration || "1-2 years"}
                        </p>
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-semibold text-gray-800 mb-2">Goals:</h5>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {(aiInsights?.roadmap?.long_term?.goals || [
                                "Secure senior role",
                                "Become subject matter expert"
                              ]).map((goal, idx) => (
                                <li key={idx} className="flex items-start">
                                  <Star className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {goal}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  {/* Dynamic Personality Overview */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-2xl p-8 border border-purple-100"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Brain className="w-8 h-8 mr-4 text-purple-600" />
                        Your Personality Profile
                      </h3>
                      <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold">
                        {testResults?.testId.toUpperCase()} Analysis
                      </div>
                    </div>

                    {/* Dynamic Content Based on Test Type */}
                    {calculatedResult && (
                      <div className="grid lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                              <Target className="w-5 h-5 mr-2 text-purple-600" />
                              Primary Traits
                            </h4>
                            <div className="space-y-3">
                              {Object.entries(calculatedResult).slice(0, 3).map(([key, value], index) => (
                                <div key={key} className="flex items-center justify-between">
                                  <span className="text-gray-700 font-medium capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                      <motion.div
                                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${typeof value === 'number' ? value : 75}%` }}
                                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                                      />
                                    </div>
                                    <span className="text-sm font-bold text-gray-600">
                                      {typeof value === 'number' ? `${value}%` : String(value).slice(0, 10)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {aiInsights?.cognitive_analysis && (
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                              <h4 className="font-bold text-purple-800 mb-3">Cognitive Analysis</h4>
                              <p className="text-gray-700 leading-relaxed">
                                {aiInsights.cognitive_analysis.summary ||
                                 'Your cognitive profile shows unique patterns of thinking and decision-making.'}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-6">
                          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                              <Sparkles className="w-5 h-5 mr-2 text-yellow-600" />
                              Key Insights
                            </h4>
                            <div className="space-y-4">
                              {(aiInsights?.behavioral_insights || [
                                { category: 'Communication Style', insight: 'You prefer direct and clear communication', confidence: 85 },
                                { category: 'Decision Making', insight: 'You balance logic with intuition effectively', confidence: 78 },
                                { category: 'Work Preference', insight: 'You thrive in collaborative environments', confidence: 82 }
                              ]).slice(0, 3).map((insight, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.7 + index * 0.1 }}
                                  className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border-l-4 border-blue-400"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-semibold text-blue-800">{insight.category}</h5>
                                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                      {insight.confidence}%
                                    </span>
                                  </div>
                                  <p className="text-gray-700 text-sm">{insight.insight}</p>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Interactive Behavioral Insights */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-3xl shadow-2xl p-8"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Lightbulb className="w-8 h-8 mr-4 text-yellow-500" />
                        Behavioral Insights
                      </h3>
                      <div className="flex space-x-2">
                        <button className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors">
                          View All
                        </button>
                        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                          Export
                        </button>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                      {(aiInsights?.behavioral_insights || [
                        { category: 'Leadership Style', insight: 'You demonstrate collaborative leadership with strong emotional intelligence', confidence: 88 },
                        { category: 'Problem Solving', insight: 'You approach challenges systematically while remaining open to creative solutions', confidence: 85 },
                        { category: 'Communication', insight: 'You excel at adapting your communication style to different audiences', confidence: 82 },
                        { category: 'Team Dynamics', insight: 'You naturally foster inclusive environments and value diverse perspectives', confidence: 79 }
                      ]).map((insight, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.6, delay: 0.1 * index }}
                          className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 cursor-pointer"
                        >
                          <div className="flex items-start space-x-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Brain className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-gray-900 text-lg group-hover:text-purple-700 transition-colors">
                                  {insight.category}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    insight.confidence >= 85 ? 'bg-green-100 text-green-800' :
                                    insight.confidence >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {insight.confidence}%
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                                </div>
                              </div>
                              <p className="text-gray-700 leading-relaxed mb-4">{insight.insight}</p>
                              <div className="relative">
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                  <motion.div
                                    className="bg-gradient-to-r from-purple-500 to-indigo-600 h-3 rounded-full relative overflow-hidden"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${insight.confidence}%` }}
                                    transition={{ duration: 1.2, delay: 0.5 + index * 0.1 }}
                                  >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                  </motion.div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                  <span>Confidence Level</span>
                                  <span>{insight.confidence}% Accuracy</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Best Field Recommendation */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl p-8 border border-blue-100"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Target className="w-8 h-8 mr-4 text-blue-600" />
                        Best Career Field
                      </h3>
                      <div className="flex items-center space-x-2">
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                          {aiInsights.best_field?.match_percentage}% Match
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-blue-200">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Briefcase className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-2xl font-bold text-gray-900 mb-3">
                            {aiInsights.best_field?.field}
                          </h4>
                          <p className="text-gray-700 leading-relaxed mb-4">
                            {aiInsights.best_field?.reasoning}
                          </p>
                          <div className="bg-blue-50 rounded-lg p-4 mb-4">
                            <h5 className="font-semibold text-blue-800 mb-2">Supporting Evidence:</h5>
                            <p className="text-blue-700 text-sm">
                              {aiInsights.best_field?.supporting_evidence}
                            </p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <motion.div
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${aiInsights.best_field?.match_percentage}%` }}
                              transition={{ duration: 1.2, delay: 0.7 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Career Roadmap */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gradient-to-br from-white to-green-50 rounded-3xl shadow-2xl p-8 border border-green-100"
                  >
                    <h3 className="text-3xl font-bold text-gray-900 flex items-center mb-8">
                      <Map className="w-8 h-8 mr-4 text-green-600" />
                      Career Roadmap
                    </h3>

                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* Short Term */}
                      <div className="bg-white rounded-2xl p-6 border border-green-200">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <Clock className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">Short Term</h4>
                            <p className="text-sm text-gray-600">{aiInsights.roadmap?.short_term?.duration}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h5 className="font-semibold text-gray-800 mb-2">Goals:</h5>
                            <ul className="space-y-1">
                              {aiInsights.roadmap?.short_term?.goals?.map((goal, idx) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-start">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {goal}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-800 mb-2">Skills to Develop:</h5>
                            <div className="flex flex-wrap gap-2">
                              {aiInsights.roadmap?.short_term?.skills_to_develop?.map((skill, idx) => (
                                <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mid Term */}
                      <div className="bg-white rounded-2xl p-6 border border-yellow-200">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                            <Calendar className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">Mid Term</h4>
                            <p className="text-sm text-gray-600">{aiInsights.roadmap?.mid_term?.duration}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h5 className="font-semibold text-gray-800 mb-2">Goals:</h5>
                            <ul className="space-y-1">
                              {aiInsights.roadmap?.mid_term?.goals?.map((goal, idx) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-start">
                                  <CheckCircle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {goal}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-800 mb-2">Milestones:</h5>
                            <div className="space-y-1">
                              {aiInsights.roadmap?.mid_term?.milestones?.map((milestone, idx) => (
                                <div key={idx} className="text-sm text-gray-700 flex items-start">
                                  <Star className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {milestone}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Long Term */}
                      <div className="bg-white rounded-2xl p-6 border border-purple-200">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">Long Term</h4>
                            <p className="text-sm text-gray-600">{aiInsights.roadmap?.long_term?.duration}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h5 className="font-semibold text-gray-800 mb-2">Goals:</h5>
                            <ul className="space-y-1">
                              {aiInsights.roadmap?.long_term?.goals?.map((goal, idx) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-start">
                                  <CheckCircle className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {goal}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-800 mb-2">Expertise Areas:</h5>
                            <div className="flex flex-wrap gap-2">
                              {aiInsights.roadmap?.long_term?.expertise_areas?.map((area, idx) => (
                                <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                  {area}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Career Recommendations */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-br from-white to-orange-50 rounded-3xl shadow-2xl p-8 border border-orange-100 no-print"
                  >
                    <h3 className="text-3xl font-bold text-gray-900 flex items-center mb-8">
                      <Briefcase className="w-8 h-8 mr-4 text-orange-600" />
                      Career Recommendations
                    </h3>

                    <div className="grid lg:grid-cols-2 gap-6">
                      {Array.isArray(aiInsights?.career_recommendations) ? aiInsights.career_recommendations.map((rec, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 * index }}
                          className="bg-white rounded-2xl p-6 border border-orange-200 hover:border-orange-400 hover:shadow-xl transition-all duration-300"
                        >
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                              <Star className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-gray-900 mb-3">{rec.job_role}</h4>
                              <p className="text-gray-700 leading-relaxed mb-4">{rec.explanation}</p>

                              <div className="space-y-3">
                                <div>
                                  <h5 className="font-semibold text-gray-800 mb-2">Industry:</h5>
                                  <p className="text-sm text-gray-600">{rec.industry}</p>
                                </div>

                                <div>
                                  <h5 className="font-semibold text-gray-800 mb-2">Growth Potential:</h5>
                                  <p className="text-sm text-gray-600">{rec.growth_potential}</p>
                                </div>

                                <div>
                                  <h5 className="font-semibold text-gray-800 mb-2">Salary Range:</h5>
                                  <p className="text-sm text-gray-600">{rec.salary_range}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )) : (
                        <div className="text-center py-8 text-gray-500">
                          <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No career recommendations available</p>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Skill Recommendations */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-2xl p-8 border border-purple-100 no-print"
                  >
                    <h3 className="text-3xl font-bold text-gray-900 flex items-center mb-8">
                      <BookOpen className="w-8 h-8 mr-4 text-purple-600" />
                      Skill Development Plan
                    </h3>

                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Technical Skills */}
                      <div className="bg-white rounded-2xl p-6 border border-purple-200">
                        <div className="flex items-center mb-6">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <Code className="w-5 h-5 text-purple-600" />
                          </div>
                          <h4 className="text-xl font-bold text-gray-900">Technical Skills</h4>
                        </div>
                        <div className="space-y-4">
                          {aiInsights?.skill_recommendations?.technical_skills?.map((skill, idx) => (
                            <div key={idx} className="border-l-4 border-purple-400 pl-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold text-gray-800">{skill.skill}</h5>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  skill.importance === 'High' ? 'bg-red-100 text-red-800' :
                                  skill.importance === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {skill.importance}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {skill.learning_resources?.map((resource, ridx) => (
                                  <span key={ridx} className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
                                    {resource}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Soft Skills */}
                      <div className="bg-white rounded-2xl p-6 border border-purple-200">
                        <div className="flex items-center mb-6">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <Users className="w-5 h-5 text-purple-600" />
                          </div>
                          <h4 className="text-xl font-bold text-gray-900">Soft Skills</h4>
                        </div>
                        <div className="space-y-4">
                          {aiInsights?.skill_recommendations?.soft_skills?.map((skill, idx) => (
                            <div key={idx} className="border-l-4 border-blue-400 pl-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold text-gray-800">{skill.skill}</h5>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  skill.importance === 'High' ? 'bg-red-100 text-red-800' :
                                  skill.importance === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {skill.importance}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{skill.development_approach}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Skill Gaps Analysis */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="bg-gradient-to-br from-white to-red-50 rounded-3xl shadow-2xl p-8 border border-red-100 no-print"
                  >
                    <h3 className="text-3xl font-bold text-gray-900 flex items-center mb-8">
                      <AlertTriangle className="w-8 h-8 mr-4 text-red-600" />
                      Skill Gaps Analysis
                    </h3>

                    <div className="grid lg:grid-cols-2 gap-6">
                      {Array.isArray(aiInsights?.skill_gaps) ? aiInsights.skill_gaps.map((gap: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="bg-white rounded-2xl p-6 border border-red-200 hover:border-red-400 hover:shadow-xl transition-all duration-300"
                        >
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                              <AlertTriangle className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-gray-900 mb-2">{gap.skill || gap.gap}</h4>
                              <p className="text-gray-700 text-sm mb-3">{gap.description || gap.impact}</p>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-xs font-semibold text-red-600">Impact: </span>
                                  <span className="text-xs text-gray-600">{gap.impact}</span>
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-red-600">Action Plan: </span>
                                  <span className="text-xs text-gray-600">{gap.action_plan || gap.learning_path}</span>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    (gap.severity || gap.priority) === 'High' ? 'bg-red-100 text-red-800' :
                                    (gap.severity || gap.priority) === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {gap.severity || gap.priority} Priority
                                  </span>
                                  <span className="text-xs text-gray-500">{gap.timeline}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )) : (
                        <div className="text-center py-8 text-gray-500">
                          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No skill gaps identified</p>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Future Plans & Daily Habits */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    className="grid lg:grid-cols-2 gap-6"
                  >
                    {/* Future Plans */}
                    <div className="bg-gradient-to-br from-white to-indigo-50 rounded-3xl shadow-2xl p-8 border border-indigo-100">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <Rocket className="w-7 h-7 mr-3 text-indigo-600" />
                        Future Plans
                      </h3>
                      <div className="space-y-4">
                        {aiInsights?.future_plans ? Object.values(aiInsights.future_plans).map((plan: any, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * index }}
                            className="bg-white rounded-lg p-4 border border-indigo-200 hover:border-indigo-400 transition-colors"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{plan.career_position}</h4>
                                <p className="text-sm text-gray-600 mb-2">{plan.key_achievements?.join(', ')}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-indigo-600 font-medium">{plan.skills_mastered?.join(', ')}</span>
                                  <span className="text-xs text-gray-500">{plan.network_goals}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )) : (
                          <div className="text-center py-8 text-gray-500">
                            <Rocket className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No future plans available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Daily Habits */}
                    <div className="bg-gradient-to-br from-white to-green-50 rounded-3xl shadow-2xl p-8 border border-green-100">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <CheckCircle className="w-7 h-7 mr-3 text-green-600" />
                        Daily Habits
                      </h3>
                      <div className="space-y-4">
                        {Array.isArray(aiInsights?.daily_habits) ? aiInsights.daily_habits.map((habit: any, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * index }}
                            className="bg-white rounded-lg p-4 border border-green-200 hover:border-green-400 transition-colors"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{habit.habit}</h4>
                                <p className="text-sm text-gray-600 mb-2">{habit.purpose}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-green-600 font-medium">{habit.implementation}</span>
                                  <span className="text-xs text-gray-500">{habit.time_required}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )) : (
                          <div className="text-center py-8 text-gray-500">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No daily habits available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Certifications */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-2xl p-8 border border-purple-100"
                  >
                    <h3 className="text-3xl font-bold text-gray-900 flex items-center mb-8">
                      <Award className="w-8 h-8 mr-4 text-purple-600" />
                      Recommended Certifications
                    </h3>

                    <div className="grid lg:grid-cols-3 gap-6">
                      {Array.isArray(aiInsights?.certifications) ? aiInsights.certifications.map((cert: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 * index }}
                          className="bg-white rounded-2xl p-6 border border-purple-200 hover:border-purple-400 hover:shadow-xl transition-all duration-300"
                        >
                          <div className="text-center mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                              <Award className="w-8 h-8 text-white" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">{cert.name}</h4>
                            <p className="text-sm text-gray-600 mb-3">{cert.provider}</p>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <span className="text-xs font-semibold text-purple-600">Why it matters: </span>
                              <p className="text-xs text-gray-600">{cert.why_recommended}</p>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-purple-600">Difficulty: </span>
                              <p className="text-xs text-gray-600">{cert.difficulty_level}</p>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <a
                                href={cert.direct_enrollment_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                              >
                                Enroll Now →
                              </a>
                              <span className="text-xs text-gray-500">{cert.estimated_duration}</span>
                            </div>
                          </div>
                        </motion.div>
                      )) : (
                        <div className="text-center py-8 text-gray-500">
                          <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No certifications recommended</p>
                        </div>
                      )}
                    </div>
                  </motion.div>

                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl shadow-2xl p-12 text-center border border-gray-200"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Brain className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Insights Unavailable</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                    We're unable to generate AI insights right now, but your test results are still available in the Overview tab.
                  </p>
                  {insightsError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                      <p className="text-red-700 text-sm">{insightsError}</p>
                    </div>
                  )}
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Retry Analysis</span>
                    </button>
                    <button
                      onClick={() => handleTabChange('overview')}
                      className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                      View Results
                    </button>
                  </div>
                </motion.div>
              )}

              {/* AI Predictions & Recommendations */}

            </motion.div>
          )}

          {false && (
            <motion.div
              key="social"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Share & Compare Header */}
              <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold mb-2 flex items-center">
                        <Share2 className="w-8 h-8 mr-3" />
                        Share & Compare
                      </h2>
                      <p className="text-purple-100">Connect with others and showcase your personality insights</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-purple-200">Social Score</div>
                      <div className="text-2xl font-bold">8.7/10</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-5 h-5 text-yellow-300" />
                        <span className="font-semibold">Compatibility</span>
                      </div>
                      <div className="text-2xl font-bold">94%</div>
                      <div className="text-xs text-purple-200">With similar types</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Globe className="w-5 h-5 text-green-300" />
                        <span className="font-semibold">Reach</span>
                      </div>
                      <div className="text-2xl font-bold">2.3K</div>
                      <div className="text-xs text-purple-200">Potential connections</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-300" />
                        <span className="font-semibold">Engagement</span>
                      </div>
                      <div className="text-2xl font-bold">87%</div>
                      <div className="text-xs text-purple-200">Interest rate</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Sharing Cards */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Share Results */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Share2 className="w-6 h-6 mr-3 text-blue-600" />
                    Share Your Results
                  </h3>

                  {/* Preview Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                        {mbtiCode}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">My Personality Results</h4>
                        <p className="text-sm text-gray-600">{personalityType?.name || 'Personality Assessment'}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="text-sm font-semibold text-blue-600">{testResults.score}% Match</div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <div className="text-xs text-gray-500">Life Changing Journey</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 italic">
                      "Discovered fascinating insights about my personality through advanced AI analysis. Check out your own results!"
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all group"
                    >
                      <Link className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      <div className="text-left">
                        <div className="font-semibold">Copy Link</div>
                        <div className="text-xs opacity-90">Share anywhere</div>
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all group"
                    >
                      <Mail className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      <div className="text-left">
                        <div className="font-semibold">Email Results</div>
                        <div className="text-xs opacity-90">Send to friends</div>
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all group"
                    >
                      <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      <div className="text-left">
                        <div className="font-semibold">Screenshot</div>
                        <div className="text-xs opacity-90">Save image</div>
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center space-x-3 p-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all group"
                    >
                      <MessageCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      <div className="text-left">
                        <div className="font-semibold">Social Media</div>
                        <div className="text-xs opacity-90">Post to feeds</div>
                      </div>
                    </motion.button>
                  </div>
                </div>

                {/* Compare with Others */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <BarChart3 className="w-6 h-6 mr-3 text-purple-600" />
                    Compare with Others
                  </h3>

                  <div className="space-y-6">
                    {/* Compatibility Matches */}
                    <div>
                      <h4 className="font-bold text-gray-800 mb-4">Most Compatible Types</h4>
                      <div className="space-y-3">
                        {[
                          { type: 'ENFJ', name: 'The Protagonist', compatibility: 96, color: 'from-green-500 to-emerald-600' },
                          { type: 'INFP', name: 'The Mediator', compatibility: 89, color: 'from-blue-500 to-indigo-600' },
                          { type: 'ENTP', name: 'The Debater', compatibility: 84, color: 'from-purple-500 to-violet-600' }
                        ].map((match, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 bg-gradient-to-r ${match.color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                                {match.type}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{match.name}</div>
                                <div className="text-sm text-gray-600">{match.compatibility}% compatible</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <motion.div
                                  className={`bg-gradient-to-r ${match.color} h-2 rounded-full`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${match.compatibility}%` }}
                                  transition={{ duration: 1, delay: idx * 0.2 }}
                                />
                              </div>
                              <Heart className="w-4 h-4 text-red-500" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Population Comparison */}
                    <div>
                      <h4 className="font-bold text-gray-800 mb-4">Population Comparison</h4>
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                        <div className="text-center mb-3">
                          <div className="text-2xl font-bold text-gray-900">Top 15%</div>
                          <div className="text-sm text-gray-600">You scored higher than 85% of people</div>
                        </div>
                        <div className="flex items-center justify-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            <span className="text-gray-600">Your Score</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-gray-600">Average</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export & Save Options */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Download className="w-6 h-6 mr-3 text-green-600" />
                  Export & Save Options
                </h3>

                <div className="grid lg:grid-cols-4 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center space-y-3 p-6 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all group"
                  >
                    <FileText className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <div className="text-center">
                      <div className="font-semibold">PDF Report</div>
                      <div className="text-xs opacity-90">Complete analysis</div>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center space-y-3 p-6 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all group"
                  >
                    <Bookmark className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <div className="text-center">
                      <div className="font-semibold">Save Profile</div>
                      <div className="text-xs opacity-90">Track progress</div>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center space-y-3 p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all group"
                  >
                    <Calendar className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <div className="text-center">
                      <div className="font-semibold">Schedule</div>
                      <div className="text-xs opacity-90">Follow-up test</div>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center space-y-3 p-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all group"
                  >
                    <Settings className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <div className="text-center">
                      <div className="font-semibold">Customize</div>
                      <div className="text-xs opacity-90">Personal report</div>
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* Achievements & Badges */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Medal className="w-6 h-6 mr-3 text-yellow-600" />
                  Achievements & Milestones
                </h3>

                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-gray-800 mb-4">Unlocked Achievements</h4>
                    <div className="space-y-4">
                      {[
                        {
                          icon: Crown,
                          title: 'First Assessment',
                          description: 'Completed your first personality test',
                          color: 'from-yellow-500 to-orange-600',
                          progress: 100,
                          date: 'Today'
                        },
                        {
                          icon: Flame,
                          title: 'High Achiever',
                          description: 'Scored above 85% accuracy',
                          color: 'from-red-500 to-pink-600',
                          progress: 100,
                          date: 'Today'
                        },
                        {
                          icon: Brain,
                          title: 'AI Explorer',
                          description: 'Explored AI-powered insights',
                          color: 'from-purple-500 to-indigo-600',
                          progress: 100,
                          date: 'Today'
                        }
                      ].map((achievement, idx) => {
                        const Icon = achievement.icon;
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-md transition-all"
                          >
                            <div className={`w-12 h-12 bg-gradient-to-r ${achievement.color} rounded-xl flex items-center justify-center shadow-lg`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="font-bold text-gray-900">{achievement.title}</h5>
                                <span className="text-xs text-gray-500">{achievement.date}</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <motion.div
                                  className={`bg-gradient-to-r ${achievement.color} h-1.5 rounded-full`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${achievement.progress}%` }}
                                  transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-800 mb-4">Progress Tracking</h4>
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                      <div className="text-center mb-6">
                        <div className="text-3xl font-bold text-gray-900 mb-2">Level 3</div>
                        <div className="text-sm text-gray-600">Personality Explorer</div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Tests Completed</span>
                          <span className="font-semibold text-gray-900">1/3</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Insights Viewed</span>
                          <span className="font-semibold text-gray-900">4/5</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Achievements</span>
                          <span className="font-semibold text-gray-900">3/10</span>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-700">Next Level Progress</span>
                            <span className="text-sm text-gray-600">67%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: '67%' }}
                              transition={{ duration: 1.5, delay: 0.5 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Community & Networking */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <Users className="w-6 h-6 mr-3" />
                  Connect with Your Community
                </h3>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <Globe className="w-8 h-8 mb-4 text-blue-300" />
                    <h4 className="font-bold mb-2">Find Similar Types</h4>
                    <p className="text-sm text-blue-100 mb-4">Connect with people who share your personality traits and interests.</p>
                    <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                      Explore Network
                    </button>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <MessageCircle className="w-8 h-8 mb-4 text-purple-300" />
                    <h4 className="font-bold mb-2">Join Discussions</h4>
                    <p className="text-sm text-purple-100 mb-4">Participate in personality-focused conversations and forums.</p>
                    <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                      Join Community
                    </button>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <Briefcase className="w-8 h-8 mb-4 text-green-300" />
                    <h4 className="font-bold mb-2">Career Networking</h4>
                    <p className="text-sm text-green-100 mb-4">Connect with professionals in careers that match your personality.</p>
                    <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                      Network Now
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'recommendations' && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Growth Plan Header */}
              <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold mb-2 flex items-center">
                        <TrendingUp className="w-8 h-8 mr-3" />
                        Personalized Growth Plan
                      </h2>
                      <p className="text-emerald-100">AI-curated development roadmap based on your personality profile</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-emerald-200">Growth Potential</div>
                      <div className="text-2xl font-bold">9.2/10</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="w-5 h-5 text-yellow-300" />
                        <span className="font-semibold">Focus Areas</span>
                      </div>
                      <div className="text-2xl font-bold">4</div>
                      <div className="text-xs text-emerald-200">Key development zones</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-5 h-5 text-green-300" />
                        <span className="font-semibold">Timeline</span>
                      </div>
                      <div className="text-2xl font-bold">6-12</div>
                      <div className="text-xs text-emerald-200">Months to mastery</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Zap className="w-5 h-5 text-blue-300" />
                        <span className="font-semibold">Impact</span>
                      </div>
                      <div className="text-2xl font-bold">High</div>
                      <div className="text-xs text-emerald-200">Expected transformation</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Development Roadmap */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Compass className="w-6 h-6 mr-3 text-indigo-600" />
                  Development Roadmap
                </h3>

                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 to-purple-600"></div>

                  <div className="space-y-8">
                    {[
                      {
                        phase: 'Foundation Phase',
                        duration: '0-3 months',
                        color: 'from-blue-500 to-indigo-600',
                        icon: BookOpen,
                        progress: 25,
                        goals: ['Self-awareness building', 'Strength identification', 'Habit formation'],
                        status: 'current'
                      },
                      {
                        phase: 'Development Phase',
                        duration: '3-6 months',
                        color: 'from-purple-500 to-violet-600',
                        icon: TrendingUp,
                        progress: 0,
                        goals: ['Skill enhancement', 'Challenge integration', 'Feedback incorporation'],
                        status: 'upcoming'
                      },
                      {
                        phase: 'Mastery Phase',
                        duration: '6-12 months',
                        color: 'from-green-500 to-emerald-600',
                        icon: Crown,
                        progress: 0,
                        goals: ['Advanced application', 'Leadership development', 'Mentoring others'],
                        status: 'future'
                      }
                    ].map((phase, idx) => {
                      const Icon = phase.icon;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: idx * 0.2 }}
                          className="relative flex items-start space-x-6"
                        >
                          <div className={`w-16 h-16 bg-gradient-to-r ${phase.color} rounded-xl flex items-center justify-center shadow-lg z-10 ${
                            phase.status === 'current' ? 'ring-4 ring-blue-200' : ''
                          }`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>

                          <div className="flex-1 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="text-xl font-bold text-gray-900">{phase.phase}</h4>
                                <p className="text-sm text-gray-600">{phase.duration}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-500">Progress</div>
                                <div className="text-lg font-bold text-gray-900">{phase.progress}%</div>
                              </div>
                            </div>

                            <div className="mb-4">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <motion.div
                                  className={`bg-gradient-to-r ${phase.color} h-2 rounded-full`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${phase.progress}%` }}
                                  transition={{ duration: 1.5, delay: 0.5 + idx * 0.2 }}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              {phase.goals.map((goal, goalIdx) => (
                                <div key={goalIdx} className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    phase.status === 'current' ? 'bg-blue-500' :
                                    phase.status === 'upcoming' ? 'bg-purple-500' : 'bg-gray-400'
                                  }`}></div>
                                  <span className="text-sm text-gray-700">{goal}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Detailed Growth Areas */}
              <div className="grid lg:grid-cols-2 gap-8 no-print">
                {Object.entries(enhancedRecommendations).map(([category, recommendations], categoryIndex) => {
                  const categoryData = {
                    personal: {
                      icon: Heart,
                      color: 'from-pink-500 to-rose-600',
                      title: 'Personal Development',
                      description: 'Build self-awareness and emotional intelligence',
                      priority: 'High',
                      timeframe: '3-6 months',
                      difficulty: 'Medium'
                    },
                    career: {
                      icon: Briefcase,
                      color: 'from-blue-500 to-indigo-600',
                      title: 'Career Advancement',
                      description: 'Develop professional skills and leadership',
                      priority: 'High',
                      timeframe: '6-12 months',
                      difficulty: 'High'
                    },
                    relationships: {
                      icon: Users,
                      color: 'from-green-500 to-emerald-600',
                      title: 'Relationship Building',
                      description: 'Enhance interpersonal and communication skills',
                      priority: 'Medium',
                      timeframe: '3-9 months',
                      difficulty: 'Medium'
                    },
                    growth: {
                      icon: TrendingUp,
                      color: 'from-purple-500 to-violet-600',
                      title: 'Continuous Growth',
                      description: 'Maintain momentum and expand capabilities',
                      priority: 'Medium',
                      timeframe: 'Ongoing',
                      difficulty: 'Low'
                    }
                  };

                  const data = categoryData[category as keyof typeof categoryData];
                  const Icon = data.icon;

                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                      className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 bg-gradient-to-r ${data.color} rounded-xl flex items-center justify-center shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{data.title}</h3>
                            <p className="text-sm text-gray-600">{data.description}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          data.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {data.priority}
                        </div>
                      </div>

                      {/* Category Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Timeframe</div>
                          <div className="font-semibold text-gray-900">{data.timeframe}</div>
                        </div>
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Difficulty</div>
                          <div className="font-semibold text-gray-900">{data.difficulty}</div>
                        </div>
                      </div>

                      {/* Action Items */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-gray-800 mb-3">Action Items</h4>
                        {recommendations.slice(0, 3).map((recommendation, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                            className="flex items-start space-x-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100 hover:shadow-md transition-all group cursor-pointer"
                          >
                            <div className={`w-8 h-8 bg-gradient-to-r ${data.color} rounded-full flex items-center justify-center text-sm font-bold text-white mt-1 flex-shrink-0 group-hover:scale-110 transition-transform`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-700 leading-relaxed text-sm">{recommendation}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">2-4 weeks</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">Track progress</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Progress Tracking */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">Category Progress</span>
                          <span className="text-sm text-gray-600">
                            {category === 'personal' ? '15%' : category === 'career' ? '8%' : category === 'relationships' ? '22%' : '12%'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            className={`bg-gradient-to-r ${data.color} h-2 rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: category === 'personal' ? '15%' : category === 'career' ? '8%' : category === 'relationships' ? '22%' : '12%' }}
                            transition={{ duration: 1.5, delay: 0.5 + categoryIndex * 0.2 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Growth Analytics */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <BarChart3 className="w-6 h-6 mr-3 text-orange-600" />
                  Growth Analytics & Insights
                </h3>

                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Strength Analysis */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-4">Strength Utilization</h4>
                    <div className="space-y-4">
                      {[
                        { strength: 'Analytical Thinking', current: 85, potential: 95, color: 'blue' },
                        { strength: 'Problem Solving', current: 78, potential: 90, color: 'green' },
                        { strength: 'Strategic Planning', current: 72, potential: 88, color: 'purple' }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{item.strength}</span>
                            <span className="text-xs text-gray-500">{item.current}% → {item.potential}%</span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <motion.div
                                className={`bg-gradient-to-r from-${item.color}-400 to-${item.color}-500 h-2 rounded-full`}
                                initial={{ width: 0 }}
                                animate={{ width: `${item.current}%` }}
                                transition={{ duration: 1, delay: 0.7 + idx * 0.1 }}
                              />
                            </div>
                            <div className="absolute top-0 w-full h-2 bg-gray-300 rounded-full opacity-30">
                              <motion.div
                                className={`bg-gradient-to-r from-${item.color}-600 to-${item.color}-700 h-2 rounded-full opacity-50`}
                                initial={{ width: 0 }}
                                animate={{ width: `${item.potential}%` }}
                                transition={{ duration: 1, delay: 1 + idx * 0.1 }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Development Priorities */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-4">Priority Matrix</h4>
                    <div className="space-y-3">
                      {[
                        { area: 'Emotional Intelligence', impact: 'High', effort: 'Medium', score: 9.2 },
                        { area: 'Public Speaking', impact: 'High', effort: 'High', score: 8.7 },
                        { area: 'Team Leadership', impact: 'Medium', effort: 'Medium', score: 8.1 },
                        { area: 'Technical Skills', impact: 'Medium', effort: 'Low', score: 7.8 }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-800 text-sm">{item.area}</span>
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs font-bold text-gray-700">{item.score}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-xs">
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${
                                item.impact === 'High' ? 'bg-red-500' : 'bg-yellow-500'
                              }`}></div>
                              <span className="text-gray-600">Impact: {item.impact}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${
                                item.effort === 'High' ? 'bg-red-500' : item.effort === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}></div>
                              <span className="text-gray-600">Effort: {item.effort}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Success Metrics */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-4">Success Metrics</h4>
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                      <div className="text-center mb-4">
                        <div className="text-2xl font-bold text-gray-900">73%</div>
                        <div className="text-sm text-gray-600">Overall Growth Score</div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Skills Developed</span>
                          <span className="font-semibold text-gray-900">12/16</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Goals Achieved</span>
                          <span className="font-semibold text-gray-900">8/12</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Consistency Rate</span>
                          <span className="font-semibold text-gray-900">89%</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Time Investment</span>
                          <span className="font-semibold text-gray-900">4.2h/week</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-emerald-200">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Next Milestone</div>
                          <div className="text-sm font-semibold text-emerald-700">Level 4 Growth Expert</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Center */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <Zap className="w-6 h-6 mr-3" />
                  Take Action Now
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <h4 className="font-bold mb-4 text-indigo-100">Quick Wins (This Week)</h4>
                    <div className="space-y-3">
                      {[
                        'Complete personality strengths assessment',
                        'Set up daily reflection journal',
                        'Schedule feedback session with mentor'
                      ].map((action, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <div className="w-4 h-4 border-2 border-white/50 rounded"></div>
                          <span className="text-sm text-indigo-100">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <h4 className="font-bold mb-4 text-purple-100">Long-term Goals (3 Months)</h4>
                    <div className="space-y-3">
                      {[
                        'Develop advanced communication skills',
                        'Build leadership presence and confidence',
                        'Create personal brand and network'
                      ].map((goal, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <Target className="w-4 h-4 text-purple-300" />
                          <span className="text-sm text-purple-100">{goal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-6">
                  <button className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Schedule Growth Session</span>
                  </button>
                  <button className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Access Resources</span>
                  </button>
                  <button className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Find Accountability Partner</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Download error handling removed - using simple print functionality */}

        {/* Modern Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center no-print"
        >
          <button
            onClick={onRetake}
            className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 border border-primary-500 hover:border-primary-600"
          >
            <span>Retake Assessment</span>
          </button>
          <button
            onClick={onBack}
            className="bg-white hover:bg-gray-50 text-slate-700 font-medium py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 border border-gray-200 hover:border-gray-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tests</span>
          </button>
          <button
            onClick={handleDownloadReport}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 border border-green-600 hover:border-green-700"
          >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </button>
        </motion.div>
      </div>
    </div>
    </>
  );
};

export default ModernResults;
