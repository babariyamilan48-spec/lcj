import axios from 'axios';
import { getApiBaseUrl } from '../config/api';

// Use dynamic API base URL
const getApiUrl = () => getApiBaseUrl();

// Create axios instance with dynamic config
const createApiInstance = () => {
  return axios.create({
    baseURL: getApiUrl(),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Create initial instance
const api = createApiInstance();

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface Test {
  id: number;
  test_id: string;
  name: string;
  english_name: string;
  description?: string;
  icon?: string;
  color?: string;
  questions_count: number;
  duration?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TestCreate {
  test_id: string;
  name: string;
  english_name: string;
  description?: string;
  icon?: string;
  color?: string;
  questions_count?: number;
  duration?: string;
  is_active?: boolean;
}

export interface TestUpdate {
  name?: string;
  english_name?: string;
  description?: string;
  icon?: string;
  color?: string;
  questions_count?: number;
  duration?: string;
  is_active?: boolean;
}

export interface Question {
  id: number;
  question_text: string;
  question_order: number;
  test_id: number;
  section_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  options?: Option[];
}

export interface Option {
  id: number;
  option_text: string;
  option_order: number;
  question_id: number;
  score?: number;
  is_active: boolean;
}

export interface QuestionCreate {
  question_text: string;
  question_order: number;
  test_id: number;
  section_id?: number;
  is_active?: boolean;
}

export interface QuestionUpdate {
  question_text?: string;
  question_order?: number;
  section_id?: number;
  is_active?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// Test Management API
export const testApi = {
  // Get all tests with pagination and filtering
  getTests: async (params: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
    search?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<Test>>> => {
    const response = await api.get('/api/v1/question_service/tests/', { params });
    return response.data;
  },

  // Get single test by test_id
  getTest: async (testId: string): Promise<ApiResponse<Test>> => {
    const response = await api.get(`/api/v1/question_service/tests/${testId}`);
    return response.data;
  },

  // Create new test
  createTest: async (testData: TestCreate): Promise<ApiResponse<Test>> => {
    const response = await api.post('/api/v1/question_service/tests/', testData);
    return response.data;
  },

  // Update test
  updateTest: async (testId: string, testData: TestUpdate): Promise<ApiResponse<Test>> => {
    const response = await api.put(`/api/v1/question_service/tests/${testId}`, testData);
    return response.data;
  },

  // Delete test
  deleteTest: async (testId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/api/v1/question_service/tests/${testId}`);
    return response.data;
  },

  // Get test questions
  getTestQuestions: async (testId: string): Promise<ApiResponse<Question[]>> => {
    const response = await api.get(`/api/v1/question_service/tests/${testId}/questions`);
    return response.data;
  },
};

// Question Management API
export const questionApi = {
  // Get all questions with pagination and filtering
  getQuestions: async (params: {
    skip?: number;
    limit?: number;
    test_id?: number;
    section_id?: number;
    is_active?: boolean;
  } = {}): Promise<ApiResponse<PaginatedResponse<Question>>> => {
    const response = await api.get('/api/v1/question_service/questions/', { params });
    return response.data;
  },

  // Get single question
  getQuestion: async (questionId: number): Promise<ApiResponse<Question>> => {
    const response = await api.get(`/api/v1/question_service/questions/${questionId}`);
    return response.data;
  },

  // Create new question
  createQuestion: async (questionData: QuestionCreate): Promise<ApiResponse<Question>> => {
    const response = await api.post('/api/v1/question_service/questions/', questionData);
    return response.data;
  },

  // Update question
  updateQuestion: async (questionId: number, questionData: QuestionUpdate): Promise<ApiResponse<Question>> => {
    const response = await api.put(`/api/v1/question_service/questions/${questionId}`, questionData);
    return response.data;
  },

  // Delete question
  deleteQuestion: async (questionId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/api/v1/question_service/questions/${questionId}`);
    return response.data;
  },
};

// Admin Panel API - Full Implementation
export const adminApi = {
  // User Management - Optimized Endpoints
  users: {
    // Get all users with pagination and filtering
    getAll: async (params: {
      page?: number;
      per_page?: number;
      search?: string;
      role?: string;
      is_active?: boolean;
      is_verified?: boolean;
    } = {}) => {
      try {
        // Convert pagination params for optimized endpoint
        const queryParams = {
          page: params.page || 1,
          per_page: params.per_page || 50,
          ...(params.search && { search: params.search }),
          ...(params.role && { role: params.role }),
          ...(params.is_active !== undefined && { is_active: params.is_active }),
          ...(params.is_verified !== undefined && { is_verified: params.is_verified }),
        };
        const response = await api.get('/api/v1/auth_service/users', { params: queryParams });
        return response.data;
      } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
    },

    // Get single user by ID
    getById: async (userId: string) => {
      try {
        const response = await api.get(`/api/v1/auth_service/users/${userId}`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        throw error;
      }
    },

    // Create new user
    create: async (userData: {
      email: string;
      password: string;
      username?: string;
      role?: string;
      is_active?: boolean;
      is_verified?: boolean;
    }) => {
      try {
        const response = await api.post('/api/v1/auth_service/users', userData);
        return response.data;
      } catch (error) {
        console.error('Error creating user:', error);
        throw error;
      }
    },

    // Update user (role, status, password)
    update: async (userId: string, userData: {
      role?: string;
      is_active?: boolean;
      password?: string;
    }) => {
      try {
        const response = await api.patch(`/api/v1/auth_service/users/${userId}`, userData);
        return response.data;
      } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        throw error;
      }
    },

    // Delete user
    delete: async (userId: string) => {
      try {
        const response = await api.delete(`/api/v1/auth_service/users/${userId}`);
        return response.data;
      } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        throw error;
      }
    },

    // Get user analytics
    getAnalytics: async () => {
      try {
        const response = await api.get('/api/v1/auth_service/analytics/users');
        return response.data;
      } catch (error) {
        console.error('Error fetching user analytics:', error);
        throw error;
      }
    },

    // Health check
    healthCheck: async () => {
      try {
        const response = await api.get('/api/v1/auth_service/health');
        return response.data;
      } catch (error) {
        console.error('Error checking admin health:', error);
        throw error;
      }
    },
  },

  // Question Management
  questions: {
    getAll: async (params: {
      skip?: number;
      limit?: number;
      test_id?: number;
      question_type?: string;
      is_active?: boolean;
    } = {}) => {
      const response = await api.get('/api/v1/admin_service/questions/', { params });
      return response.data;
    },

    getById: async (questionId: number) => {
      const response = await api.get(`/api/v1/admin_service/questions/${questionId}`);
      return response.data;
    },

    create: async (questionData: {
      test_id: number;
      question_text: string;
      question_type: string;
      options?: string[];
      correct_answer?: string;
      question_order: number;
      is_active?: boolean;
    }) => {
      const response = await api.post('/api/v1/admin_service/questions/', questionData);
      return response.data;
    },

    update: async (questionId: number, questionData: {
      question_text?: string;
      question_type?: string;
      options?: string[];
      correct_answer?: string;
      question_order?: number;
      is_active?: boolean;
    }) => {
      const response = await api.put(`/api/v1/admin_service/questions/${questionId}`, questionData);
      return response.data;
    },

    delete: async (questionId: number) => {
      const response = await api.delete(`/api/v1/admin_service/questions/${questionId}`);
      return response.data;
    },

    bulkCreate: async (questionsData: Array<{
      test_id: number;
      question_text: string;
      question_type: string;
      options?: string[];
      correct_answer?: string;
      question_order: number;
      is_active?: boolean;
    }>) => {
      const response = await api.post('/api/v1/admin_service/questions/bulk-create', questionsData);
      return response.data;
    },

    getByTest: async (testId: number) => {
      const response = await api.get(`/api/v1/admin_service/questions/by-test/${testId}`);
      return response.data;
    },
  },

  // Test Management
  tests: {
    getAll: async (params: {
      skip?: number;
      limit?: number;
      category?: string;
      is_active?: boolean;
    } = {}) => {
      const response = await api.get('/api/v1/admin_service/tests/', { params });
      return response.data;
    },

    getById: async (testId: number) => {
      const response = await api.get(`/api/v1/admin_service/tests/${testId}`);
      return response.data;
    },

    create: async (testData: {
      name: string;
      description: string;
      category: string;
      duration_minutes: number;
      total_questions: number;
      passing_score?: number;
      is_active?: boolean;
    }) => {
      const response = await api.post('/api/v1/admin_service/tests/', testData);
      return response.data;
    },

    update: async (testId: number, testData: {
      name?: string;
      description?: string;
      category?: string;
      duration_minutes?: number;
      total_questions?: number;
      passing_score?: number;
      is_active?: boolean;
    }) => {
      const response = await api.put(`/api/v1/admin_service/tests/${testId}`, testData);
      return response.data;
    },

    delete: async (testId: number) => {
      const response = await api.delete(`/api/v1/admin_service/tests/${testId}`);
      return response.data;
    },

    getStatistics: async (testId: number) => {
      const response = await api.get(`/api/v1/admin_service/tests/${testId}/statistics`);
      return response.data;
    },
  },

  // Analytics
  analytics: {
    getSystem: async () => {
      const response = await api.get('/api/v1/admin_service/analytics/system');
      return response.data;
    },

    getUsers: async () => {
      const response = await api.get('/api/v1/admin_service/analytics/users');
      return response.data;
    },

    getTests: async () => {
      const response = await api.get('/api/v1/admin_service/analytics/tests');
      return response.data;
    },

    getDashboard: async () => {
      const response = await api.get('/api/v1/admin_service/analytics/dashboard');
      return response.data;
    },
  },
};

export default api;

