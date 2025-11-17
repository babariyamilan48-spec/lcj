'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Edit3,
  Edit,
  Save,
  X,
  Settings,
  BarChart3,
  Clock,
  Award,
  Target,
  BookOpen,
  Heart,
  TrendingUp,
  Trophy,
  Star,
  Plus,
  ExternalLink,
  CheckCircle,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import ModernNavbar from '@/components/layout/ModernNavbar';
import ModernFooter from '@/components/layout/ModernFooter';
import { modernToast } from '@/utils/toast';
import { useUserProfile, useTestResults, useAnalytics, useReportDownload } from '@/hooks/useResultsService';
import { resultsService } from '@/services/resultsService';
import { tokenStore } from '@/services/token';
import { Toaster } from 'react-hot-toast';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();

  // Use user ID as string (UUID format)
  const userId = user?.id || undefined;

  const { profile, loading: profileLoading, updateProfile } = useUserProfile(userId);
  const { results, loading: resultsLoading, pagination, fetchResults } = useTestResults(userId);

  // Remove this useEffect - fetchResults is already called by useTestResults hook automatically
  const { analyticsData, loading: analyticsLoading } = useAnalytics(userId);
  
  // State for download modal
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  
  // Fallback: If results are empty, try to get them from analyticsData
  const effectiveResults = results && results.length > 0 
    ? results 
    : analyticsData?.testHistory || [];
  const { downloading, downloadReport } = useReportDownload();
  const [refreshing, setRefreshing] = useState(false);

  // Manual refresh function
  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    
    try {
      // Force refresh all data
      if (fetchResults) {
        await fetchResults();
      }
      
      // Add a small delay to show the refresh state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      modernToast.success('Data refreshed successfully!');
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      modernToast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Test name mappings to proper Gujarati names
  const getTestDisplayName = (testId: string, testName?: string) => {
    const testNameMappings: Record<string, string> = {
      'mbti': 'મારા સ્વભાવની ઓળખ',
      'intelligence': 'મારી બુદ્ધિની ઓળખ', 
      'bigfive': 'મારા વ્યક્તિત્વની ઓળખ',
      'riasec': 'મારા રસ-રુચિ ની ઓળખ',
      'decision': 'મારી નિર્ણય શૈલીની ઓળખ',
      'vark': 'મારી શીખવાની શૈલીની ઓળખ',
      'life-situation': 'મારી જીવન પરિસ્થિતિની ઓળખ',
      'comprehensive-ai-insights': 'સંપૂર્ણ AI વિશ્લેષણ રિપોર્ટ (Comprehensive AI Analysis)'
    };

    return testNameMappings[testId] || testName || testId;
  };

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [highlightAI, setHighlightAI] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    phone: '',
    website: '',
    linkedin: '',
    github: '',
    education: '',
    experience: '',
    interests: [] as string[],
    skills: [] as string[],
    goals: [] as string[]
  });

  // Password change state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Flag to prevent multiple profile updates
  const [hasAutoPopulated, setHasAutoPopulated] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditData({
        name: profile.name || '',
        email: profile.email || '',
        username: profile.username || '',
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        bio: profile.bio || '',
        location: profile.location || '',
        phone: profile.phone || '',
        website: profile.website || '',
        linkedin: profile.linkedin || '',
        github: profile.github || '',
        education: profile.education || '',
        experience: profile.experience || '',
        interests: profile.interests || [],
        skills: profile.skills || [],
        goals: profile.goals || []
      });
    }
  }, [profile]);

  // Auto-populate profile with real user data if profile is empty
  useEffect(() => {
    if (profile && user && !hasAutoPopulated && !profile.email && !profile.firstName && !profile.lastName) {
      // Profile exists but is empty, populate it with real user data
      const realUserData = {
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: profile.bio || '',
        location: profile.location || '',
        phone: profile.phone || '',
        website: profile.website || '',
        linkedin: profile.linkedin || '',
        github: profile.github || '',
        education: profile.education || '',
        experience: profile.experience || '',
        interests: profile.interests || [],
        skills: profile.skills || [],
        goals: profile.goals || []
      };

      // Set flag to prevent multiple calls
      setHasAutoPopulated(true);

      // Update the profile with real user data
      updateProfile(realUserData);
    }
  }, [profile, user, hasAutoPopulated, updateProfile]);

  // Handle URL parameters for tab switching and highlighting
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const highlight = urlParams.get('highlight');
    
    if (tab === 'history') {
      setActiveTab('tests');
    }
    
    if (highlight === 'ai-insights') {
      setHighlightAI(true);
      // Remove highlight after 3 seconds
      setTimeout(() => setHighlightAI(false), 3000);
    }
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your profile</h1>
          <a href="/auth/login" className="text-blue-600 hover:text-blue-800">Go to Login</a>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      name: profile?.name || user.name || '',
      email: profile?.email || user.email || '',
      username: profile?.username || user.username || '',
      firstName: profile?.firstName || user.firstName || '',
      lastName: profile?.lastName || user.lastName || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      phone: profile?.phone || '',
      website: profile?.website || '',
      linkedin: profile?.linkedin || '',
      github: profile?.github || '',
      education: profile?.education || '',
      experience: profile?.experience || '',
      interests: profile?.interests || [],
      skills: profile?.skills || [],
      goals: profile?.goals || []
    });
  };

  const handleSaveProfile = async () => {
    // Form validation
    if (!editData.firstName?.trim() || !editData.lastName?.trim()) {
      modernToast.error('First name and last name are required');
      return;
    }

    if (!editData.email?.trim() || !/\S+@\S+\.\S+/.test(editData.email)) {
      modernToast.error('Please enter a valid email address');
      return;
    }

    try {
      await updateProfile(editData);
      setIsEditing(false);
      modernToast.success('Profile updated successfully!');
    } catch (error) {
      modernToast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      name: profile?.name || user.name || '',
      email: profile?.email || user.email || '',
      username: profile?.username || user.username || '',
      firstName: profile?.firstName || user.firstName || '',
      lastName: profile?.lastName || user.lastName || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      phone: profile?.phone || '',
      website: profile?.website || '',
      linkedin: profile?.linkedin || '',
      github: profile?.github || '',
      education: profile?.education || '',
      experience: profile?.experience || '',
      interests: profile?.interests || [],
      skills: profile?.skills || [],
      goals: profile?.goals || []
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordSave = async () => {
    // Validation: Check if all fields are filled
    if (!passwordData.currentPassword?.trim()) {
      modernToast.error('Please enter your current password');
      return;
    }
    if (!passwordData.newPassword?.trim()) {
      modernToast.error('Please enter a new password');
      return;
    }
    if (!passwordData.confirmPassword?.trim()) {
      modernToast.error('Please confirm your new password');
      return;
    }

    // Validation: Check if passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      modernToast.error('New password and confirm password do not match');
      return;
    }

    // Validation: Check password length
    if (passwordData.newPassword.length < 6) {
      modernToast.error('New password must be at least 6 characters long');
      return;
    }

    // Validation: Check if user is authenticated
    if (!userId) {
      modernToast.error('User not authenticated. Please log in again.');
      return;
    }

    try {
      // Ensure we have the latest token before making the API call
      const currentToken = tokenStore.getAccessToken();
      if (!currentToken) {
        modernToast.error('Authentication token expired. Please log in again.');
        return;
      }

      // Update the resultsService with the current token
      resultsService.setAuthToken(currentToken);

      const result = await resultsService.changeUserPassword(userId, passwordData.currentPassword, passwordData.newPassword);
      if (result.success) {
        modernToast.success(result.message || 'Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        modernToast.error(result.message || 'Failed to change password');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password. Please check your current password.';
      modernToast.error(errorMessage);
    }
  };

  const handleDownloadReport = async (format: 'pdf' | 'json' | 'csv' = 'pdf', testId?: string) => {
    if (!userId) {
      modernToast.error('User not authenticated');
      return;
    }

    try {
      await downloadReport(userId, format, true, testId);
      if (testId) {
        modernToast.success(`${format.toUpperCase()} report for specific test downloaded successfully!`);
      } else {
        modernToast.success(`${format.toUpperCase()} report downloaded successfully!`);
      }
    } catch (error) {
      modernToast.error(`Failed to download ${format.toUpperCase()} report`);
    }
  };

  if (profileLoading || resultsLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-white">
        <ModernNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
        <ModernFooter />
      </div>
    );
  }

  // Force stats calculation from actual data
  const stats = (() => {
    // First try profile stats
    if (profile?.stats && profile.stats.total_tests > 0) {
      return profile.stats;
    }
    
    // Then try analytics stats
    if (analyticsData?.stats && analyticsData.stats.total_tests > 0) {
      return analyticsData.stats;
    }
    
    // Finally, calculate from effectiveResults
    if (effectiveResults && effectiveResults.length > 0) {
      const completedTests = effectiveResults.filter(r => {
        const isCompleted = (r as any).completion_percentage >= 100 || r.percentage_score >= 80;
        return isCompleted;
      }).length;
      
      const calculatedStats = {
        total_tests: completedTests,
        achievements: Math.floor(completedTests / 2),
        average_score: 100,
        streak_days: Math.min(completedTests * 2, 30),
        completion_rate: 100,
        time_spent: completedTests * 15
      };
      
      return calculatedStats;
    }
    
    return null;
  })();
  // Prioritize AI insights in recent tests display
  const recentTests = (() => {
    if (!effectiveResults || effectiveResults.length === 0) return [];
    
    // Find AI insights
    const aiInsights = effectiveResults.filter((test: any) => 
      test.test_id === 'comprehensive-ai-insights' || 
      test.id?.toString().includes('ai_insights') ||
      test.test_name?.includes('AI વિશ્લેષણ') ||
      test.test_name?.includes('AI Analysis')
    );
    
    // Get other tests (non-AI insights)
    const otherTests = effectiveResults.filter((test: any) => 
      !(test.test_id === 'comprehensive-ai-insights' || 
        test.id?.toString().includes('ai_insights') ||
        test.test_name?.includes('AI વિશ્લેષણ') ||
        test.test_name?.includes('AI Analysis'))
    );
    
    // Combine: AI insights first, then most recent other tests
    const combined = [...aiInsights, ...otherTests.slice(0, 3 - aiInsights.length)];
    
    return combined.slice(0, 3);
  })();
  

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold mx-auto sm:mx-0">
                    {(profile?.firstName?.[0] || profile?.name?.[0] || user?.name?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full border-2 sm:border-4 border-white flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              </div>

              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {profile?.firstName && profile?.lastName
                    ? `${profile.firstName} ${profile.lastName}`
                    : profile?.name || user?.name || 'User'}
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  {profile?.email || user?.email || 'user@example.com'}
                </p>
                {profile?.bio && (
                  <p className="text-gray-500 mt-1 max-w-md text-sm sm:text-base">{profile.bio}</p>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center mt-2 space-y-2 sm:space-y-0 sm:space-x-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <User className="w-3 h-3 mr-1" />
                    Premium Member
                  </span>
                  {profile?.location && (
                    <span className="text-sm text-gray-500 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {profile.location}
                    </span>
                  )}
                  <span className="text-sm text-gray-500 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Joined {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 w-full sm:w-auto"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              )}
              {isEditing && (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                  <button
                    onClick={handleSaveProfile}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 w-full sm:w-auto"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6 sm:mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
              {[
                { id: 'overview', name: 'Overview', icon: User },
                { id: 'tests', name: 'Test History', icon: BarChart3 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Always trigger API call when switching to tests tab
                    if (tab.id === 'tests' && userId) {
                      fetchResults();
                    }
                  }}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 min-w-0 flex-shrink-0`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 xl:col-span-3 space-y-6 lg:space-y-8">
              {/* Stats Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 lg:p-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6 sm:mb-8">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Performance Overview</h3>
                    <p className="text-gray-600">Your learning journey at a glance</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleManualRefresh}
                      disabled={refreshing}
                      className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {refreshing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl border border-blue-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Total</span>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-blue-900 mb-1">
                        {stats?.total_tests || 0}
                      </p>
                      <p className="text-sm text-blue-700">Tests Completed</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 rounded-xl border border-purple-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Earned</span>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-purple-900 mb-1">
                        {stats?.achievements || 0}
                      </p>
                      <p className="text-sm text-purple-700">Achievements</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 lg:p-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Test History</h3>
                    <p className="text-gray-600">Your completed assessments and results</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('tests')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {(() => {
                    // Check if we have any test data
                    const hasTestData = recentTests.length > 0;
                    const hasStats = stats && stats.total_tests > 0;
                    
                    if (hasTestData) {
                      // Show actual test cards
                      return recentTests.map((test: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 space-y-3 sm:space-y-0"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full space-y-3 sm:space-y-0">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-1">{getTestDisplayName(test.test_id || test.testId, test.test_name)}</h4>
                                <div className="flex items-center space-x-3 text-sm text-gray-500">
                                  <span className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{test.completed_at ? new Date(test.completed_at).toLocaleDateString() : 'Invalid Date'}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => window.location.href = `/test-result/${test.test_id}`}
                              className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors w-full sm:w-auto"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Results
                            </button>
                          </div>
                        </motion.div>
                      ));
                    } else if (hasStats) {
                      // Show stats summary when we have stats but no detailed test data
                      return (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 mb-2">
                            {stats.total_tests} Tests Completed!
                          </h4>
                          <p className="text-gray-500 mb-4">Your test results are being processed</p>
                          <button
                            onClick={() => window.location.href = '/test-result'}
                            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium"
                          >
                            View All Results
                          </button>
                        </div>
                      );
                    } else {
                      // Show no tests message
                      return (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 mb-2">No tests completed yet</h4>
                          <p className="text-gray-500 mb-6">Start your learning journey by taking your first assessment</p>
                          <button
                            onClick={() => window.location.href = '/test'}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                          >
                            Take Your First Test
                          </button>
                        </div>
                      );
                    }
                  })()}
                </div>
              </motion.div>
            </div>

            {/* Profile Info Sidebar */}
            <div className="lg:col-span-1 xl:col-span-1 space-y-6">
              {!isEditing ? (
                <>
                  {/* Profile Information Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                  >
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Profile Info</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <User className="w-4 h-4 text-gray-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</p>
                          <p className="text-sm text-gray-900 truncate">
                            {profile?.firstName && profile?.lastName
                              ? `${profile.firstName} ${profile.lastName}`
                              : profile?.name || user?.name || 'User'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                          <p className="text-sm text-gray-900 truncate">{profile?.email || user?.email}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Security Settings Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                  >
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Security</h3>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handlePasswordSave(); }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Update Password</span>
                      </button>
                    </form>
                  </motion.div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                      <Edit className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={editData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={editData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={editData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                        <textarea
                          name="bio"
                          value={editData.bio}
                          onChange={(e) => setEditData({...editData, bio: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input
                          type="text"
                          name="location"
                          value={editData.location}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                        <input
                          type="url"
                          name="website"
                          value={editData.website}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        )}

        {/* Test History Tab */}
        {activeTab === 'tests' && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Test History</h3>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => {
                    
                    fetchResults();
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 w-full sm:w-auto text-center"
                >
                  Refresh Results
                </button>
                {pagination.total > 0 && (
                  <button
                    onClick={() => {
                      // Show preview modal first, then open report
                      setShowDownloadModal(true);
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center justify-center space-x-1 w-full sm:w-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download All</span>
                  </button>
                )}
                {pagination.total > 0 && (
                  <div className="text-sm text-gray-500">
                    {pagination.total} total test{pagination.total !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>

            {resultsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading test history...</span>
              </div>
            ) : results && results.length > 0 ? (
              <>
                <div className="space-y-4">
                  {results.map((test: any, index: number) => (
                    <motion.div
                      key={test.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border rounded-lg p-4 sm:p-6 hover:shadow-md transition-all duration-300 ${
                        test.test_id === 'comprehensive-ai-insights' && highlightAI
                          ? 'border-orange-400 bg-orange-50 shadow-lg ring-2 ring-orange-200'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            test.test_id === 'comprehensive-ai-insights' 
                              ? 'bg-gradient-to-br from-orange-100 to-amber-100' 
                              : test.percentage >= 80 ? 'bg-green-100' :
                                test.percentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                          }`}>
                            {test.test_id === 'comprehensive-ai-insights' ? (
                              <Sparkles className="w-6 h-6 text-orange-600" />
                            ) : (
                              <BookOpen className={`w-6 h-6 ${
                                test.percentage >= 80 ? 'text-green-600' :
                                test.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`} />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{getTestDisplayName(test.test_id || test.testId, test.test_name)}</h4>
                            <p className="text-sm text-gray-500">
                              Completed on {new Date(test.completed_at || test.timestamp).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            {test.score && test.score > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                Score: {test.score}%
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <button
                            onClick={() => window.location.href = `/test-result/${test.test_id}`}
                            className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Results
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-8 pt-6 border-t border-gray-200 space-y-4 sm:space-y-0">
                    <div className="text-sm text-gray-500">
                      Page {pagination.page} of {pagination.total_pages}
                    </div>
                    <div className="flex space-x-2 justify-center sm:justify-start">
                      <button
                        onClick={() => fetchResults(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => fetchResults(pagination.page + 1)}
                        disabled={pagination.page >= pagination.total_pages}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tests completed yet</h3>
                <p className="text-gray-500 mb-4">Start your journey by taking your first assessment</p>
                <button
                  onClick={() => window.location.href = '/test'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Take Your First Test
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Download All Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">બધા ટેસ્ટ પરિણામો ડાઉનલોડ કરો</h3>
                <p className="text-sm text-gray-600">વ્યાપક રિપોર્ટ બનાવો</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                આ તમારા બધા ટેસ્ટ પરિણામો અને AI વિશ્લેષણને એક જ દસ્તાવેજમાં સમાવતી વ્યાપક રિપોર્ટ બનાવશે.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">શું સમાવેશ થાય છે:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• બધા {pagination.total} પૂર્ણ થયેલા ટેસ્ટ</li>
                  <li>• વિગતવાર વિશ્લેષણ અને સ્કોર</li>
                  <li>• AI વિશ્લેષણ (જો ઉપલબ્ધ હોય)</li>
                  <li>• સારાંશ આંકડાકીય માહિતી</li>
                  <li>• ભલામણો</li>
                </ul>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">પ્રિન્ટ ડાયલોગ</span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  તમારી રિપોર્ટ સાથે નવી વિન્ડો ખુલશે. PDF તરીકે સાચવવા અથવા પ્રિન્ટ કરવા માટે તમારા બ્રાઉઝરના પ્રિન્ટ ફંક્શનનો ઉપયોગ કરો.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                રદ કરો
              </button>
              <button
                onClick={() => {
                  setShowDownloadModal(false);
                  // Open comprehensive report in new window for printing
                  const reportUrl = `/comprehensive-report/${userId}`;
                  window.open(reportUrl, '_blank', 'width=1200,height=800');
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>રિપોર્ટ બનાવો</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <ModernFooter />
      <Toaster />

    </div>
  );
}