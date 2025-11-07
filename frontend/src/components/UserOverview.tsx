import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { overviewService, type UserOverview, type TestOverviewItem } from '../services/overviewService';
import { useReportDownload } from '../hooks/useResultsService';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  User, 
  TrendingUp, 
  Clock, 
  Target, 
  Star, 
  Briefcase, 
  BookOpen,
  Calendar,
  Award,
  Activity,
  Download,
  FileText,
  Table,
  Code
} from 'lucide-react';

interface UserOverviewProps {
  userId: number;
}

const UserOverview: React.FC<UserOverviewProps> = ({ userId }) => {
  const [overview, setOverview] = useState<UserOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { downloading, error: downloadError, downloadReport } = useReportDownload();

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const data = await overviewService.getUserOverview(userId);
        setOverview(data);
      } catch (err) {
        setError('ઓવરવ્યૂ લોડ કરવામાં ભૂલ આવી');
        console.error('Error loading overview:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchOverview();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error || 'ડેટા લોડ કરવામાં ભૂલ'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('gu-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownload = async (format: 'pdf' | 'json' | 'csv') => {
    try {
      await downloadReport(userId.toString(), format, true);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Download Report Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Download className="w-5 h-5 mr-2" />
            રિપોર્ટ ડાઉનલોડ કરો
          </h3>
        </div>
        
        <button
          onClick={() => handleDownload('pdf')}
          disabled={downloading}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <FileText className="w-5 h-5 mr-2" />
          {downloading ? 'ડાઉનલોડ થઈ રહ્યું છે...' : 'રિપોર્ટ ડાઉનલોડ કરો'}
        </button>
        
        {downloadError && (
          <div className="mt-3 text-red-600 text-sm">
            ભૂલ: {downloadError}
          </div>
        )}
        
        <div className="mt-3 text-sm text-gray-600">
          <p>સંપૂર્ણ ફોર્મેટેડ PDF રિપોર્ટ AI સલાહ અને વિશ્લેષણ સાથે ડાઉનલોડ કરો</p>
        </div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Award className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{overview.total_tests_completed}</p>
                  <p className="text-sm text-gray-600">પૂર્ણ કરેલ પરીક્ષાઓ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {overviewService.formatTime(0)}
                  </p>
                  <p className="text-sm text-gray-600">સરેરાશ સમય</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{overview.total_unique_tests}</p>
                  <p className="text-sm text-gray-600">છેલ્લા ૩૦ દિવસમાં</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">છેલ્લી પ્રવૃત્તિ</p>
                  <p className="text-sm text-gray-600">
                    {overview.last_activity ? formatDate(overview.last_activity) : 'કોઈ પ્રવૃત્તિ નથી'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">સારાંશ</TabsTrigger>
          <TabsTrigger value="tests">પરીક્ષા પરિણામો</TabsTrigger>
          <TabsTrigger value="career">કારકિર્દી માર્ગદર્શન</TabsTrigger>
          <TabsTrigger value="development">વિકાસ</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personality Summary */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>વ્યક્તિત્વ સારાંશ</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(overview?.latest_test_results || []).map((result) => (
                      <div key={result.test_id} className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {overviewService.getTestDisplayName(result.test_id)}
                        </span>
                        <Badge variant="secondary">{result.primary_result}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Strengths */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5" />
                    <span>મુખ્ય શક્તિઓ</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(overview?.top_strengths || []).slice(0, 6).map((strength, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">{strength}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Test Completion Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>પરીક્ષા પ્રકાર અનુસાર પ્રગતિ</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(overview?.latest_test_results || []).map((result) => (
                    <div key={result.test_id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{overviewService.getTestDisplayName(result.test_id)}</span>
                        <span>પૂર્ણ</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Test Results Tab */}
        <TabsContent value="tests" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(overview?.latest_test_results || []).map((result, index) => (
              <motion.div
                key={`${result.test_id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {result.test_name_gujarati}
                    </CardTitle>
                    <Badge variant="outline">{result.result_name_gujarati}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        {result.description_gujarati}
                      </p>
                      <div className="text-xs text-gray-500">
                        પૂર્ણ તારીખ: {formatDate(result.completion_date)}
                      </div>
                      {result.score_percentage && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>સ્કોર</span>
                            <span>{Math.round(result.score_percentage)}%</span>
                          </div>
                          <Progress value={result.score_percentage} className="h-2" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Career Tab */}
        <TabsContent value="career" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5" />
                  <span>કારકિર્દી સુઝાવો</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(overview?.top_careers || []).map((career, index) => (
                    <Badge key={index} variant="secondary" className="justify-center p-2">
                      {career}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Development Tab */}
        <TabsContent value="development" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>વિકાસ ક્ષેત્રો</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(overview?.development_areas || []).map((area, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                      <span className="text-sm">{area}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserOverview;
