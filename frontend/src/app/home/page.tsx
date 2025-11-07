'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import ModernHomePage from '@/components/ModernHomePage';
import TestSelection from '@/components/TestSelectionAPI';
import ModernAboutPage from '@/components/ModernAboutPage';
import ModernContactPage from '@/components/ModernContactPage';
import Quiz from '@/components/Quiz';
import ModernResults from '@/components/ModernResults';
import ModernNavbar from '@/components/layout/ModernNavbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function HomeRoot() {
  const { 
    currentScreen, 
    selectedTest, 
    setCurrentScreen, 
    setSelectedTest,
    setTestResults,
    resetApp
  } = useAppStore();
  const router = useRouter();

  // Ensure we start on home screen when component mounts
  React.useEffect(() => {
    if (currentScreen === 'about' || currentScreen === 'contact') {
      setCurrentScreen('home');
    }
  }, [currentScreen, setCurrentScreen]);

  const handleStart = () => {
    setCurrentScreen('selection');
  };

  const handleTestSelect = (test: any) => {
    setSelectedTest(test);
    setCurrentScreen('quiz');
  };

  const handleBack = () => {
    if (currentScreen === 'selection') {
      setCurrentScreen('home');
    } else if (currentScreen === 'quiz') {
      setCurrentScreen('selection');
    } else if (currentScreen === 'results') {
      setCurrentScreen('selection');
    } else if (currentScreen === 'about' || currentScreen === 'contact') {
      setCurrentScreen('home');
    }
  };

  const handleNavigate = (screen: 'home' | 'selection' | 'quiz' | 'results' | 'about' | 'contact') => {
    if (screen === 'about' || screen === 'contact') {
      router.push(`/${screen}`);
    } else {
      setCurrentScreen(screen);
    }
  };

  const handleQuizComplete = (results: any) => {
    setTestResults(results);
    setCurrentScreen('results');
  };

  const handleRetakeTest = () => {
    resetApp();
    setCurrentScreen('selection');
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <ModernHomePage onStart={handleStart} />;
      case 'selection':
        return <TestSelection onTestSelect={handleTestSelect} onBack={handleBack} />;
      case 'about':
        return <ModernAboutPage onBack={handleBack} />;
      case 'contact':
        return <ModernContactPage onBack={handleBack} />;
      case 'quiz':
        return <Quiz onComplete={handleQuizComplete} onBack={handleBack} />;
      case 'results':
        return <ModernResults onBack={handleBack} onRetake={handleRetakeTest} />;
      default:
        return <ModernHomePage onStart={handleStart} />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        <ModernNavbar 
          currentScreen={currentScreen} 
          onNavigate={handleNavigate}
          testName={selectedTest?.name}
          showProgress={currentScreen === 'quiz'}
          progress={25} // You can calculate this based on quiz progress
        />
        <div className={currentScreen === 'home' ? '' : 'pt-16'}>
          {renderCurrentScreen()}
        </div>
      </div>
    </ProtectedRoute>
  );
}

