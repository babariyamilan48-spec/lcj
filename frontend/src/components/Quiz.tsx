'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { useQuestions } from '@/hooks/useQuestionService';
import { useQuizSubmission } from '@/hooks/useResultsService';
import { Question as ApiQuestion, Option as ApiOption } from '@/services/questionService';
import { Heart, ChevronLeft, ChevronRight, Clock, CheckCircle, Target, BarChart3, Sparkles, Flower, Brain } from 'lucide-react';
import TestCalculationLoader from './TestCalculationLoader';
import { useAuth } from '@/contexts/AuthContext';

// Add custom scrollbar hiding styles
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

interface QuizProps {
  onComplete: (results: any) => void;
  onBack: () => void;
}

interface QuestionOption {
  text: string;
  score?: number;
  dimension?: string;
  weight?: number;
}

interface Question {
  question: string;
  options: QuestionOption[];
  category?: string;
}

const Quiz: React.FC<QuizProps> = ({ onComplete, onBack }) => {
  const { selectedTest, userAnswers, setUserAnswers, currentQuestionIndex, setCurrentQuestionIndex, testProgress, setTestProgress } = useAppStore();
  const { user } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: QuestionOption }>({});
  const [startTime] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const hasLoadedQuestions = useRef<string | null>(null);
  const autoAdvanceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Use the API hook to fetch questions
  const { questions: apiQuestions, loading, error, fetchTestQuestions } = useQuestions();

  // Use the quiz submission hook
  const { submitting, submitQuizResult } = useQuizSubmission();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeout.current) {
        clearTimeout(autoAdvanceTimeout.current);
      }
    };
  }, []);

  // Load questions from API when selectedTest changes
  useEffect(() => {
    if (selectedTest?.id && hasLoadedQuestions.current !== selectedTest.id) {
      hasLoadedQuestions.current = selectedTest.id;
      fetchTestQuestions(selectedTest.id);
    }
  }, [selectedTest?.id, fetchTestQuestions]);

  // Convert API questions to local format and set up quiz
  useEffect(() => {
    console.log('🔍 Quiz useEffect - apiQuestions:', {
      apiQuestions,
      length: apiQuestions?.length,
      loading,
      error
    });

    if (apiQuestions && apiQuestions.length > 0) {
      console.log('✅ Converting API questions to local format:', apiQuestions.length, 'questions');
      
      // Debug: Log first question's options to see their order
      if (apiQuestions.length > 0) {
        console.log('🔍 First question options (before sort):', apiQuestions[0].options.map((o: ApiOption) => ({
          text: o.option_text?.substring(0, 30),
          option_order: o.option_order
        })));
      }

      const convertedQuestions: Question[] = apiQuestions.map((apiQ: ApiQuestion) => ({
        question: apiQ.question_text,
        options: apiQ.options
          .sort((a: ApiOption, b: ApiOption) => {
            // First try sorting by option_order if available
            if ((a.option_order || 0) !== (b.option_order || 0)) {
              return (a.option_order || 0) - (b.option_order || 0);
            }
            // Fallback: Extract letter from text (A), (B), (C), (D)
            const aMatch = a.option_text?.match(/\(([A-Z])\)/);
            const bMatch = b.option_text?.match(/\(([A-Z])\)/);
            if (aMatch && bMatch) {
              return aMatch[1].charCodeAt(0) - bMatch[1].charCodeAt(0);
            }
            return 0;
          })
          .map((opt: ApiOption) => ({
            text: opt.option_text,
            dimension: opt.dimension,
            weight: opt.weight,
            score: opt.weight // Use weight as score for compatibility
          })),
        category: apiQ.section_id?.toString() || 'general'
      }));
      
      // Debug: Log first question's options after sort
      if (convertedQuestions.length > 0) {
        console.log('✅ First question options (after sort):', convertedQuestions[0].options.map((o: QuestionOption) => o.text?.substring(0, 30)));
      }

      console.log('✅ Converted questions:', convertedQuestions.length);
      setQuestions(convertedQuestions);

      if (convertedQuestions.length > 0) {
        // Only reset if no answers exist (fresh test), otherwise restore progress
        if (Object.keys(userAnswers).length === 0) {
          console.log('✅ Fresh test - initializing from question 0');
          setCurrentQuestion(convertedQuestions[0]);
          setTestProgress(0);
          setCurrentQuestionIndex(0);
          setSelectedAnswers({});
        } else {
          // Validate that currentQuestionIndex is within bounds
          const validIndex = currentQuestionIndex < convertedQuestions.length ? currentQuestionIndex : 0;
          console.log('✅ Resuming test - restoring progress to question', validIndex);
          // Restore to the last answered question
          setCurrentQuestion(convertedQuestions[validIndex]);
          setCurrentQuestionIndex(validIndex);
          // Restore selected answers from userAnswers
          const restoredAnswers: { [key: number]: QuestionOption } = {};
          Object.entries(userAnswers).forEach(([index, answerData]) => {
            const idx = parseInt(index);
            const answer = answerData as any;
            const questionOptions = convertedQuestions[idx]?.options || [];
            const matchedOption = questionOptions.find(opt => opt.text === answer.answer);
            if (matchedOption) {
              restoredAnswers[idx] = matchedOption;
            }
          });
          setSelectedAnswers(restoredAnswers);
        }
        console.log('✅ Quiz setup complete');
      }
    } else {
      console.log('❌ No API questions available:', {
        apiQuestions,
        length: apiQuestions?.length,
        loading,
        error
      });
    }
  }, [apiQuestions, setTestProgress, setCurrentQuestionIndex, loading, error]);

  const getSampleQuestions = (): Question[] => {
    return [
      {
        question: 'How do you prefer to spend your free time?',
        options: [
          { text: 'Reading a book alone', dimension: 'I', weight: 1 },
          { text: 'Meeting friends', dimension: 'E', weight: 1 },
          { text: 'Exercising', dimension: 'A', weight: 1 },
          { text: 'Creative activities', dimension: 'C', weight: 1 }
        ],
        category: 'personality'
      },
      {
        question: 'When making decisions, you usually:',
        options: [
          { text: 'Analyze all options carefully', dimension: 'T', weight: 1 },
          { text: 'Go with your gut feeling', dimension: 'F', weight: 1 },
          { text: 'Ask others for advice', dimension: 'S', weight: 1 },
          { text: 'Consider past experiences', dimension: 'N', weight: 1 }
        ],
        category: 'decision'
      },
      {
        question: 'In a group project, you prefer to:',
        options: [
          { text: 'Take the lead', dimension: 'E', weight: 1 },
          { text: 'Support others', dimension: 'F', weight: 1 },
          { text: 'Work independently', dimension: 'I', weight: 1 },
          { text: 'Collaborate equally', dimension: 'P', weight: 1 }
        ],
        category: 'teamwork'
      }
    ];
  };

  const handleAnswer = (answer: QuestionOption) => {
    if (currentQuestion && !isCompleted) {
      // Clear any existing auto-advance timeout
      if (autoAdvanceTimeout.current) {
        clearTimeout(autoAdvanceTimeout.current);
        autoAdvanceTimeout.current = null;
      }

      // Store the selected answer for this question
      setSelectedAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: answer
      }));

      // Store in the main user answers
      const newAnswers = { ...userAnswers };
      newAnswers[currentQuestionIndex] = {
        question: currentQuestion.question,
        answer: answer.text,
        dimension: answer.dimension,
        weight: answer.weight,
        score: answer.score
      };
      setUserAnswers(newAnswers);

      // Update progress based on number of answered questions
      const answeredCount = Object.keys(newAnswers).length;
      const progress = (answeredCount / questions.length) * 100;
      setTestProgress(progress);

      // Auto-advance to next question with timeout management
      autoAdvanceTimeout.current = setTimeout(() => {
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length && !isCompleted) {
          setCurrentQuestionIndex(nextIndex);
          setCurrentQuestion(questions[nextIndex]);
        } else if (!isCompleted) {
          // Last question -> redirect to results
          handleCompleteAndRedirect();
        }
        autoAdvanceTimeout.current = null;
      }, 300);
    }
  };

  const handleNext = () => {
    // Only proceed if an option is selected for the current question and quiz not completed
    if (!selectedAnswers[currentQuestionIndex] || isCompleted) return;

    // Clear any pending auto-advance timeout
    if (autoAdvanceTimeout.current) {
      clearTimeout(autoAdvanceTimeout.current);
      autoAdvanceTimeout.current = null;
    }

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(questions[nextIndex]);
      // Keep progress based on number of answered questions
      const answeredCount = Object.keys(userAnswers).length;
      const progress = (answeredCount / questions.length) * 100;
      setTestProgress(progress);
    } else {
      // Last question -> redirect to results
      handleCompleteAndRedirect();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setCurrentQuestion(questions[prevIndex]);
      // Keep progress based on number of answered questions
      const answeredCount = Object.keys(userAnswers).length;
      const progress = (answeredCount / questions.length) * 100;
      setTestProgress(progress);
    }
  };

  const handleSubmit = () => {
    // Calculate results based on answers
  };

  const calculateResults = () => {
    // This is a simplified result calculation
    // In a real app, you'd have more sophisticated scoring algorithms
    const results = {
      testId: selectedTest?.id,
      testName: selectedTest?.name,
      score: Math.round((Object.keys(userAnswers).length / questions.length) * 100),
      answers: userAnswers,
      timestamp: new Date().toISOString(),
      recommendations: generateRecommendations(),
      detailedResults: analyzeAnswers()
    };

    return results;
  };

  const generateRecommendations = () => {
    // Generate recommendations based on answers
    const recommendations = [
      "Consider exploring careers that align with your personality type",
      "Focus on developing your strengths",
      "Seek opportunities for continuous learning",
      "Network with professionals in your field of interest"
    ];

    return recommendations;
  };

  const calculateScore = () => {
    // Calculate percentage score based on number of questions answered correctly
    // If all questions are answered, score is 100%
    const answeredCount = Object.keys(userAnswers).length;
    const totalQuestions = questions.length;
    
    if (totalQuestions === 0) return 0;
    
    // Return percentage (0-100)
    return Math.round((answeredCount / totalQuestions) * 100);
  };

  // Remove duplicate handleComplete function - only use handleCompleteAndRedirect

  const handleCompleteAndRedirect = async () => {
    // Prevent multiple submissions with comprehensive checks
    if (isCompleted || isSubmitting || submitting || Object.keys(userAnswers).length !== questions.length || !user) {
      return;
    }

    // Mark as completed immediately to prevent race conditions
    setIsCompleted(true);
    setIsSubmitting(true);

    // Clear any pending timeouts
    if (autoAdvanceTimeout.current) {
      clearTimeout(autoAdvanceTimeout.current);
      autoAdvanceTimeout.current = null;
    }

    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    const results = {
      testId: selectedTest?.id,
      testName: selectedTest?.name,
      answers: userAnswers,
      totalQuestions: questions.length,
      answeredQuestions: Object.keys(userAnswers).length,
      score: calculateScore(),
      analysis: analyzeAnswers(),
      completedAt: endTime.toISOString(),
      durationMinutes
    };

    try {
      // Submit to database
      const answersArray = Object.values(userAnswers);

      await submitQuizResult(
        user.id, // Send UUID as string, not integer
        selectedTest?.id || '',
        selectedTest?.name || '',
        answersArray,
        results.analysis,
        durationMinutes
      );

      // Mark submission time to prevent duplicate saves in ModernResults
      const lastSubmissionKey = `lastSubmission_${selectedTest?.id}`;
      localStorage.setItem(lastSubmissionKey, Date.now().toString());

      // Redirect to results page immediately without AI insights
      onComplete(results);
    } catch (error) {
      // Check if this is a duplicate test error
      if (error instanceof Error && error.message.includes('already completed')) {
        // Redirect to profile page to view test results
        window.location.href = `/profile`;
        return;
      }

      // Still complete the quiz locally even if DB submission fails
      onComplete(results);
    } finally {
      setIsSubmitting(false);
    }
  };

  const analyzeAnswers = () => {
    // Analyze answers to provide detailed insights
    const analysis: any = {};

    // Group answers by dimension if available
    Object.entries(userAnswers).forEach(([questionIndex, answerData]) => {
      const answer = answerData as any;
      if (answer.dimension) {
        if (!analysis[answer.dimension]) {
          analysis[answer.dimension] = [];
        }
        analysis[answer.dimension].push({
          question: answer.question,
          answer: answer.answer,
          weight: answer.weight,
          score: answer.score
        });
      }
    });

    return analysis;
  };

  const isOptionSelected = (option: QuestionOption) => {
    const selectedAnswer = selectedAnswers[currentQuestionIndex];
    return selectedAnswer && selectedAnswer.text === option.text;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center pt-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questions from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center pt-4">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">Error loading questions: {error}</p>
          <button
            onClick={() => selectedTest?.id && fetchTestQuestions(selectedTest.id)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!selectedTest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Test Selected</h1>
          <button
            onClick={onBack}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Questions Available</h1>
          <p className="text-gray-600 mb-4">Unable to load questions for {selectedTest.name}</p>
          <button
            onClick={onBack}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Question Not Found</h1>
          <p className="text-gray-600 mb-4">Current question index: {currentQuestionIndex}</p>
          <button
            onClick={onBack}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarHideStyles }} />
      <div className="h-screen bg-gradient-to-br from-primary-50 via-orange-50 to-secondary-50 relative overflow-hidden">
      {/* Enhanced Modern Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary theme gradient orbs */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-primary-200 to-orange-200 rounded-full opacity-40 blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-secondary-200 to-primary-200 rounded-full opacity-30 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-r from-orange-200 to-primary-200 rounded-full opacity-35 blur-lg animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-gradient-to-r from-primary-300 to-secondary-300 rounded-full opacity-25 blur-xl animate-pulse" style={{ animationDelay: '3s' }} />

        {/* Floating icons with theme colors */}
        <div className="absolute top-20 right-10 text-primary-400 opacity-50 animate-bounce" style={{ animationDelay: '0.5s' }}>
          <Sparkles size={20} />
        </div>
        <div className="absolute bottom-40 left-10 text-secondary-400 opacity-50 animate-bounce" style={{ animationDelay: '1.5s' }}>
          <Heart size={18} />
        </div>
        <div className="absolute top-1/3 right-20 text-orange-400 opacity-50 animate-bounce" style={{ animationDelay: '2.5s' }}>
          <Flower size={22} />
        </div>
        <div className="absolute bottom-1/3 left-1/4 text-primary-300 opacity-40 animate-bounce" style={{ animationDelay: '3.5s' }}>
          <Brain size={16} />
        </div>

        {/* Subtle geometric patterns */}
        <div className="absolute top-10 left-1/2 w-16 h-16 border border-primary-200 rounded-lg opacity-20 rotate-45 animate-pulse" style={{ animationDelay: '4s' }} />
        <div className="absolute bottom-10 right-1/3 w-12 h-12 border border-secondary-200 rounded-full opacity-15 animate-pulse" style={{ animationDelay: '5s' }} />
      </div>

      {/* Dynamic Modal Container */}
      <div className="h-screen flex items-center justify-center p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">
          {/* Dynamic Navbar */}
          <div className="mb-3 sm:mb-4 flex-shrink-0">
            <div className="bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-white/40 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  {/* Home Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBack}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-primary-500 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 hover:from-primary-600 hover:to-orange-600 transition-all duration-200"
                  >
                    <ChevronLeft size={16} className="text-white sm:w-5 sm:h-5" />
                  </motion.button>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-sm sm:text-lg font-bold text-slate-800 truncate">{selectedTest.name}</h1>
                    <p className="text-xs sm:text-sm text-primary-600 font-medium truncate">આત્મ-શોધની યાત્રા</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs sm:text-sm text-slate-500">પ્રશ્ન</div>
                    <div className="text-lg sm:text-xl font-bold text-primary-600">
                      {currentQuestionIndex + 1} / {questions.length}
                    </div>
                  </div>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 relative flex-shrink-0">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-200"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-primary-500"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="none"
                        strokeDasharray={`${(Object.keys(userAnswers).length / questions.length) * 100}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-600">
                        {Math.round((Object.keys(userAnswers).length / questions.length) * 100)}%
                      </span>
                    </div>
                  </div>
                  {/* Mobile question counter */}
                  <div className="sm:hidden text-right">
                    <div className="text-xs text-slate-500">પ્રશ્ન</div>
                    <div className="text-sm font-bold text-primary-600">
                      {currentQuestionIndex + 1}/{questions.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Quiz Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/50 overflow-hidden ring-1 ring-primary-100/50"
            >

              {/* Dynamic Question Content */}
              <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between min-h-0">
                {/* Dynamic Question */}
                <div className="text-center mb-3 sm:mb-4 flex-shrink-0">
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 leading-relaxed px-2"
                  >
                    {currentQuestion.question}
                  </motion.h2>
                </div>

                {/* Dynamic Options */}
<div className="space-y-2 sm:space-y-3 flex-1 overflow-y-auto min-h-0 mb-3 sm:mb-4 scrollbar-hide px-1" style={{
  scrollbarWidth: 'none',
  msOverflowStyle: 'none'
}}>
                  {currentQuestion.options.map((option, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                      whileHover={{ scale: 1.01, x: 2 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleAnswer(option)}
                      className={`w-full text-left p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-300 focus:outline-none group ${
                        isOptionSelected(option)
                          ? 'bg-gradient-to-r from-primary-100 to-orange-100 border-2 border-primary-300 shadow-lg'
                          : 'bg-white/70 border-2 border-gray-200 hover:border-primary-300 hover:bg-gradient-to-r hover:from-primary-50 hover:to-orange-50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 sm:w-5 sm:h-5 border-2 rounded-full mr-2 sm:mr-3 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                          isOptionSelected(option)
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-gray-300 group-hover:border-primary-400'
                        }`}>
                          {isOptionSelected(option) && (
                            <motion.div
                              initial={{ scale: 0, rotate: 0 }}
                              animate={{ scale: 1, rotate: 360 }}
                              transition={{ duration: 0.4, ease: "backOut" }}
                              className="w-2.5 h-2.5 bg-white rounded-full"
                            />
                          )}
                        </div>
                        <span className={`text-sm sm:text-base font-medium transition-colors duration-300 leading-relaxed ${
                          isOptionSelected(option) ? 'text-primary-800' : 'text-gray-700 group-hover:text-primary-700'
                        }`}>
                          {option.text}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="pt-4 border-t border-gray-100 flex-shrink-0">
                  <div className="flex justify-between items-center">
                    {/* Previous Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                      className={`flex items-center px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                        currentQuestionIndex === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <ChevronLeft size={16} className="mr-1" />
                      પાછળ
                    </motion.button>

                    {/* Progress Indicator */}
                    <div className="flex items-center bg-primary-50 px-3 py-1.5 rounded-full border border-primary-100">
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse mr-2" />
                      <span className="text-sm font-semibold text-primary-700">
                        {currentQuestionIndex + 1} / {questions.length}
                      </span>
                    </div>

                    {/* Next Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNext}
                      disabled={!selectedAnswers[currentQuestionIndex] || isCompleted || isSubmitting || submitting}
                      className={`flex items-center px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                        (!selectedAnswers[currentQuestionIndex] || isCompleted || isSubmitting || submitting)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-primary-600 to-orange-600 text-white hover:from-primary-700 hover:to-orange-700 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {currentQuestionIndex === questions.length - 1 ? 'પરિણામ જુઓ' : 'આગળ'}
                      <ChevronRight size={16} className="ml-1" />
                    </motion.button>
                  </div>

                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Enhanced Inspirational Quote */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center mt-3 sm:mt-4 flex-shrink-0 px-2"
          >
            <div className="bg-gradient-to-r from-primary-50 to-orange-50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-primary-100/50 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-center mb-1">
                <Heart size={12} className="text-primary-500 mr-1 sm:mr-2 sm:w-3.5 sm:h-3.5" />
                <div className="w-4 sm:w-6 h-0.5 bg-gradient-to-r from-primary-300 to-orange-300 rounded-full" />
                <Heart size={12} className="text-orange-500 ml-1 sm:ml-2 sm:w-3.5 sm:h-3.5" />
              </div>
              <p className="text-primary-700 text-xs sm:text-sm font-semibold italic leading-relaxed">
                "એક વાર તમે તમારી આત્માનો અવાજ સાંભળી લ્યો તમને તમારો સાચો રસ્તો મળી જશે.."
              </p>
              <p className="text-primary-600 text-xs mt-0.5 font-medium">
                - આંતરિક શાંતિનો સંદેશ
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>

    {/* Submission Loading Overlay */}
    {(isSubmitting || submitting) && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4">
          <TestCalculationLoader
            title="Submitting Your Test"
            message="Saving your answers and calculating results..."
            variant="compact"
          />
        </div>
      </div>
    )}
    </>
  );
};

export default Quiz;
