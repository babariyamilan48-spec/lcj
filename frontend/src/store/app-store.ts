import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Test {
  id: string;
  name: string;
  description: string;
  duration: string; // Changed from number to string to match API
  questions: number;
  category: string;
  instructions: string;
  english?: string;
  icon?: string;
  color?: string;
  sections?: Array<{
    id: string;
    name: string;
    gujarati: string;
  }>;
}

export interface TestResult {
  testId: string;
  testName: string;
  score: number;
  answers: Record<string, any>;
  timestamp: string;
  recommendations: string[];
  detailedResults: Record<string, any>;
  sessionId?: string;
  timeTaken?: number;
}

interface AppState {
  currentScreen: 'home' | 'selection' | 'quiz' | 'results' | 'about' | 'contact';
  selectedTest: Test | null;
  testResults: TestResult | null;
  userAnswers: Record<string, any>;
  currentQuestionIndex: number;
  testProgress: number;
  
  // Actions
  setCurrentScreen: (screen: AppState['currentScreen']) => void;
  setSelectedTest: (test: Test | null) => void;
  setTestResults: (results: TestResult | null) => void;
  setUserAnswers: (answers: Record<string, any>) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setTestProgress: (progress: number) => void;
  resetApp: () => void;
  startTest: (test: Test) => void;
  completeTest: (results: TestResult) => void;
  navigateTo: (screen: AppState['currentScreen']) => void;
}

const initialState = {
  currentScreen: 'home' as const,
  selectedTest: null,
  testResults: null,
  userAnswers: {},
  currentQuestionIndex: 0,
  testProgress: 0,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentScreen: (screen) => set({ currentScreen: screen }),
      
      setSelectedTest: (test) => set({ selectedTest: test }),
      
      setTestResults: (results) => set({ testResults: results }),
      
      setUserAnswers: (answers) => set({ userAnswers: answers }),
      
      setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
      
      setTestProgress: (progress) => set({ testProgress: progress }),
      
      resetApp: () => set(initialState),
      
      startTest: (test) => set({
        selectedTest: test,
        currentScreen: 'quiz',
        currentQuestionIndex: 0,
        testProgress: 0,
        userAnswers: {},
      }),
      
      completeTest: (results) => set({
        testResults: results,
        currentScreen: 'results',
      }),
      
      navigateTo: (screen) => set({ currentScreen: screen }),
    }),
    {
      name: 'lcj-app-storage',
      partialize: (state) => ({
        currentScreen: state.currentScreen,
        selectedTest: state.selectedTest,
        testResults: state.testResults,
        userAnswers: state.userAnswers,
        currentQuestionIndex: state.currentQuestionIndex,
        testProgress: state.testProgress,
      }),
    }
  )
);
