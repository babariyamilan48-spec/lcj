import { useState, useEffect, useCallback, useRef } from 'react';
import { questionService, Test, Question, TestListResponse, QuestionListResponse } from '../services/questionService';

// Hook for managing tests
export const useTests = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchTests = useCallback(async (page: number = 1, size: number = 100, isActive?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await questionService.getTestsCached(page, size, isActive);
      setTests(response.tests);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tests';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTest = useCallback(async (testId: string) => {
    setLoading(true);
    setError(null);
    try {
      const test = await questionService.getTestCached(testId);
      return test;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch test';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchTests();
    }
  }, []);

  return {
    tests,
    loading,
    error,
    fetchTests,
    fetchTest,
    refetch: () => fetchTests(),
  };
};

// Hook for managing questions
export const useQuestions = (testId?: string) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedTestIds = useRef<Set<string>>(new Set());

  const fetchQuestions = useCallback(async (page: number = 1, size: number = 100, sectionId?: number, isActive?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await questionService.getQuestions(page, size, undefined, sectionId, isActive);
      setQuestions(response.questions);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch questions';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTestQuestions = useCallback(async (testId: string, forceRefresh: boolean = true) => {
    // Always force refresh for now to ensure fresh data
    if (forceRefresh || !fetchedTestIds.current.has(testId)) {
      fetchedTestIds.current.delete(testId);
      console.log(`🔄 Fetching fresh questions for test: ${testId}`);
    } else {
      console.log(`📋 Using cached questions for test: ${testId}`);
      return questions;
    }
    
    setLoading(true);
    setError(null);
    try {
      const questions = await questionService.getTestQuestionsCached(testId);
      setQuestions(questions);
      fetchedTestIds.current.add(testId);
      return questions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch test questions';
      setError(errorMessage);
      fetchedTestIds.current.delete(testId); // Remove from cache on error
      throw err;
    } finally {
      setLoading(false);
    }
  }, [questions]);

  const fetchQuestion = useCallback(async (questionId: number) => {
    setLoading(true);
    setError(null);
    try {
      const question = await questionService.getQuestion(questionId);
      return question;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch question';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (testId && !fetchedTestIds.current.has(testId)) {
      fetchedTestIds.current.add(testId);
      fetchTestQuestions(testId);
    }
  }, [testId]);

  return {
    questions,
    loading,
    error,
    fetchQuestions,
    fetchTestQuestions,
    fetchQuestion,
    refetch: testId ? () => fetchTestQuestions(testId) : () => fetchQuestions(),
  };
};

// Hook for authentication
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
  }, []);

  const setAuthToken = useCallback((token: string | null) => {
    questionService.setAuthToken(token);
    setIsAuthenticated(!!token);
  }, []);

  const clearAuth = useCallback(() => {
    questionService.setAuthToken(null);
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    setAuthToken,
    clearAuth,
  };
};

// Hook for managing test selection
export const useTestSelection = () => {
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  const selectTest = useCallback((test: Test) => {
    setSelectedTest(test);
    setSelectedTestId(test.test_id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTest(null);
    setSelectedTestId(null);
  }, []);

  return {
    selectedTest,
    selectedTestId,
    selectTest,
    clearSelection,
  };
};

