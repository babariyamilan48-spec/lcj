'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { getApiBaseUrl } from '@/config/api';

interface Test {
  id: number;
  test_id: string;
  english_name: string;
}

interface QuestionFormData {
  question_text: string;
  question_order: number;
  test_id: number;
  section_id?: number;
  is_active: boolean;
  options: OptionFormData[];
}

interface OptionFormData {
  option_text: string;
  option_order: number;
  score?: number;
  is_active: boolean;
}

export default function CreateQuestionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [formData, setFormData] = useState<QuestionFormData>({
    question_text: '',
    question_order: 1,
    test_id: 0,
    section_id: undefined,
    is_active: true,
    options: [
      { option_text: '', option_order: 1, score: 1, is_active: true },
      { option_text: '', option_order: 2, score: 2, is_active: true },
    ],
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/question_service/tests/?skip=0&limit=100`);
      const data = await response.json();
      
      if (data.success) {
        setTests(data.data.tests);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleOptionChange = (index: number, field: keyof OptionFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [
        ...prev.options,
        {
          option_text: '',
          option_order: prev.options.length + 1,
          score: prev.options.length + 1,
          is_active: true,
        }
      ]
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index).map((option, i) => ({
          ...option,
          option_order: i + 1,
        }))
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/question_service/questions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin/questions');
      } else {
        console.error('Failed to create question:', data.error);
        alert('Failed to create question. Please try again.');
      }
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Error creating question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/questions"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Questions
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Question</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create a new question with multiple choice options
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Question Information</h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="test_id" className="block text-sm font-medium text-gray-700">
                    Test *
                  </label>
                  <select
                    name="test_id"
                    id="test_id"
                    required
                    value={formData.test_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={0}>Select a test</option>
                    {tests.map((test) => (
                      <option key={test.id} value={test.id}>
                        {test.english_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="question_text" className="block text-sm font-medium text-gray-700">
                    Question Text *
                  </label>
                  <textarea
                    name="question_text"
                    id="question_text"
                    required
                    rows={4}
                    value={formData.question_text}
                    onChange={handleInputChange}
                    placeholder="Enter the question text..."
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="question_order" className="block text-sm font-medium text-gray-700">
                      Question Order
                    </label>
                    <input
                      type="number"
                      name="question_order"
                      id="question_order"
                      min="1"
                      value={formData.question_order}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="section_id" className="block text-sm font-medium text-gray-700">
                      Section ID (Optional)
                    </label>
                    <input
                      type="number"
                      name="section_id"
                      id="section_id"
                      value={formData.section_id || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Answer Options</h3>
                <button
                  type="button"
                  onClick={addOption}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.options.map((option, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Option {index + 1}</span>
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Option Text *
                        </label>
                        <input
                          type="text"
                          value={option.option_text}
                          onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)}
                          placeholder="Enter option text..."
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Score
                        </label>
                        <input
                          type="number"
                          value={option.score || ''}
                          onChange={(e) => handleOptionChange(index, 'score', parseInt(e.target.value) || 0)}
                          placeholder="Score"
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Active questions are visible to users
              </p>
            </div>

            {/* Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Creating...' : 'Create Question'}
                </button>
                
                <Link
                  href="/admin/questions"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

