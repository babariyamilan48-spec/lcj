'use client';

import { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  AlertCircle,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getApiBaseUrl } from '@/config/api';

interface Question {
  id: number;
  test_id: number;
  section_id: number;
  question_text: string;
  question_type: string;
  options?: any[];
  correct_answer?: string;
  explanation?: string;
  difficulty_level?: string;
  is_active: boolean;
  created_at: string;
}

interface Test {
  id: number;
  name: string;
  description: string;
  total_questions: number;
  duration_minutes: number;
  is_active: boolean;
}

interface AdminQuestionsProps {
  onOpenModal?: (type: string, data?: any) => void;
}

export default function AdminQuestions({ onOpenModal }: AdminQuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [testFilter, setTestFilter] = useState<number | 'all'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 10;
  const [viewMode, setViewMode] = useState<'questions' | 'tests'>('questions');

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        skip: ((page - 1) * perPage).toString(),
        limit: perPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(testFilter !== 'all' && { test_id: testFilter.toString() }),
        ...(activeFilter !== 'all' && { is_active: activeFilter === 'active' ? 'true' : 'false' }),
      });

      const response = await fetch(`${getApiBaseUrl()}/api/v1/question_service/questions?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch questions');
      const data = await response.json();
      setQuestions(data.data?.questions || data.questions || []);
      setTotalCount(data.data?.total || data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const fetchTests = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/question_service/tests`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const testsArray = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
        setTests(testsArray);
      }
    } catch (err) {
      console.error('Failed to fetch tests:', err);
    }
  };

  useEffect(() => {
    if (viewMode === 'questions') {
      fetchQuestions();
    } else {
      fetchTests();
    }
  }, [page, searchTerm, testFilter, activeFilter, viewMode]);

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/question_service/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete question');
      setQuestions(questions.filter(q => q.id !== questionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    }
  };

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Questions & Tests</h2>
          <p className="text-gray-600 mt-1">Manage all assessment questions and tests</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'questions' ? 'default' : 'outline'}
            onClick={() => {
              setViewMode('questions');
              setPage(1);
            }}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Questions
          </Button>
          <Button
            variant={viewMode === 'tests' ? 'default' : 'outline'}
            onClick={() => {
              setViewMode('tests');
              setPage(1);
            }}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Tests
          </Button>
          <Button onClick={() => onOpenModal?.('addQuestion')} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add {viewMode === 'questions' ? 'Question' : 'Test'}
          </Button>
        </div>
      </div>

      {/* Filters - Questions View */}
      {viewMode === 'questions' && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Search</label>
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Test</label>
                <select
                  value={testFilter}
                  onChange={(e) => {
                    setTestFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value));
                    setPage(1);
                  }}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Tests</option>
                  {tests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  value={activeFilter}
                  onChange={(e) => {
                    setActiveFilter(e.target.value as any);
                    setPage(1);
                  }}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setTestFilter('all');
                    setActiveFilter('all');
                    setPage(1);
                  }}
                  className="w-full"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions Table */}
      {viewMode === 'questions' && (
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-md">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No questions found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Question</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Test</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Difficulty</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((question) => (
                        <tr key={question.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <p className="text-sm text-gray-900 line-clamp-2">
                              {question.question_text}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            <Badge variant="outline">Test {question.test_id}</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            <Badge variant="secondary">{question.question_type}</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {question.difficulty_level || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={question.is_active ? 'default' : 'secondary'}
                              className={
                                question.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {question.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onOpenModal?.('viewQuestion', question)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onOpenModal?.('editQuestion', question)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteQuestion(question.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, totalCount)} of{' '}
                    {totalCount} questions
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tests Grid */}
      {viewMode === 'tests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="col-span-full flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-md">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          ) : tests.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tests found</p>
            </div>
          ) : (
            tests.map((test) => (
              <Card key={test.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{test.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                    </div>
                    <Badge variant={test.is_active ? 'default' : 'secondary'}>
                      {test.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <HelpCircle className="w-4 h-4" />
                      <span>{test.total_questions} questions</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Layers className="w-4 h-4" />
                      <span>{test.duration_minutes} minutes</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => onOpenModal?.('editTest', test)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
