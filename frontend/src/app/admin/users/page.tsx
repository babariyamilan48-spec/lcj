'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getApiBaseUrl } from '../../../config/api';
import {
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Loader2,
  Users,
  Filter,
  UserCheck,
  UserX,
  Shield,
  Mail,
  UserPlus,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  FileText,
  Calendar,
  Award
} from 'lucide-react';

// User Interface
interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  role: 'admin' | 'user';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  avatar?: string;
  providers: string[];
}

const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // User CRUD state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    email: '',
    username: '',
    password: '',
    role: 'user',
    is_active: true,
    is_verified: false
  });

  // Test results state
  const [showTestResultsModal, setShowTestResultsModal] = useState(false);
  const [selectedUserForResults, setSelectedUserForResults] = useState<User | null>(null);
  const [userTestResults, setUserTestResults] = useState<any[]>([]);
  const [loadingTestResults, setLoadingTestResults] = useState(false);

  // Filtering state
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    is_active: '',
    is_verified: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth_service/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load users');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth_service/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm),
      });
      
      if (response.ok) {
        const result = await response.json();
        setSuccess('User created successfully with the provided password!');
        setShowUserModal(false);
        resetUserForm();
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create user');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      setError('Failed to create user');
    }
  };

  const updateUser = async () => {
    if (!editingUser) return;
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth_service/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: userForm.role,
          is_active: userForm.is_active,
          password: userForm.password // Include password (will be ignored if empty)
        }),
      });
      
      if (response.ok) {
        const message = userForm.password.trim() 
          ? 'User updated successfully (including password)' 
          : 'User updated successfully';
        setSuccess(message);
        setShowUserModal(false);
        setEditingUser(null);
        resetUserForm();
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to update user');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      setError('Failed to update user');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth_service/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSuccess('User deleted successfully');
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      setError('Failed to delete user');
    }
  };

  const resetUserForm = () => {
    setUserForm({
      email: '',
      username: '',
      password: '',
      role: 'user',
      is_active: true,
      is_verified: false
    });
  };

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      username: user.username || '',
      password: '', // Don't pre-fill password for editing
      role: user.role,
      is_active: user.is_active,
      is_verified: user.is_verified
    });
    setShowUserModal(true);
  };

  const openCreateUserModal = () => {
    setEditingUser(null);
    resetUserForm();
    setShowUserModal(true);
  };

  const fetchUserTestResults = async (userId: string) => {
    try {
      setLoadingTestResults(true);
      const response = await fetch(`${getApiBaseUrl()}/api/v1/results_service/all-results/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Raw API response:', data);
        
        // Transform the nested object structure to array format
        const resultsArray = [];
        if (data && typeof data === 'object') {
          for (const [testType, testData] of Object.entries(data)) {
            if (testData && typeof testData === 'object') {
              resultsArray.push({
                test_id: testData.test_id || testType,
                test_name: testData.test_name || testType,
                primary_result: testData.analysis?.code || testData.analysis?.type,
                completion_percentage: testData.percentage || testData.percentage_score || 100,
                time_taken_seconds: testData.duration_minutes ? testData.duration_minutes * 60 : null,
                result_summary: testData.analysis?.description || testData.analysis?.gujarati_description,
                created_at: testData.timestamp || testData.completed_at,
                analysis: {
                  traits: testData.analysis?.traits || [],
                  strengths: testData.recommendations || [],
                  code: testData.analysis?.code,
                  type: testData.analysis?.type,
                  description: testData.analysis?.description
                }
              });
            }
          }
        }
        
        console.log('Transformed results:', resultsArray);
        setUserTestResults(resultsArray);
      } else {
        console.error('Failed to fetch user test results');
        setUserTestResults([]);
      }
    } catch (error) {
      console.error('Error fetching user test results:', error);
      setUserTestResults([]);
    } finally {
      setLoadingTestResults(false);
    }
  };

  const openTestResultsModal = (user: User) => {
    setSelectedUserForResults(user);
    setShowTestResultsModal(true);
    fetchUserTestResults(user.id);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      is_active: '',
      is_verified: ''
    });
  };

  // Filter users based on current filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = !filters.search || 
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (user.username && user.username.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchesRole = !filters.role || user.role === filters.role;
    const matchesActive = !filters.is_active || user.is_active.toString() === filters.is_active;
    const matchesVerified = !filters.is_verified || user.is_verified.toString() === filters.is_verified;
    
    return matchesSearch && matchesRole && matchesActive && matchesVerified;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    verified: users.filter(u => u.is_verified).length,
    admins: users.filter(u => u.role === 'admin').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
        </div>
        <Button onClick={openCreateUserModal} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.verified}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Administrators</p>
                <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="pl-10"
              />
            </div>
            
            <select
              value={filters.role}
              onChange={(e) => setFilters({...filters, role: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            
            <select
              value={filters.is_active}
              onChange={(e) => setFilters({...filters, is_active: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            
            <select
              value={filters.is_verified}
              onChange={(e) => setFilters({...filters, is_verified: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
            
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users found matching your criteria
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{user.full_name}</h3>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Administrator' : 'User'}
                        </Badge>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {user.is_verified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Verified
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Email:</strong> {user.email}</p>
                        {user.username && <p><strong>Username:</strong> {user.username}</p>}
                        <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                        <p><strong>Providers:</strong> {user.providers.join(', ')}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openTestResultsModal(user)}
                        className="hover:bg-green-50 text-green-600 border-green-200"
                        title="View Test Results"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openEditUserModal(user)}
                        className="hover:bg-blue-50"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => deleteUser(user.id)}
                        className="hover:bg-red-50 text-red-600 border-red-200"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <Input
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  placeholder="user@example.com"
                  disabled={!!editingUser}
                  type="email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <Input
                  value={userForm.username}
                  onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                  placeholder="Username (optional)"
                  disabled={!!editingUser}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Password {!editingUser && '*'}
                  {editingUser && <span className="text-xs text-gray-500">(leave empty to keep current)</span>}
                </label>
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  placeholder={editingUser ? "Enter new password (optional)" : "Enter password"}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Role *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={userForm.is_active}
                    onChange={(e) => setUserForm({...userForm, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  Active Account
                </label>
                
                {!editingUser && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={userForm.is_verified}
                      onChange={(e) => setUserForm({...userForm, is_verified: e.target.checked})}
                      className="mr-2"
                    />
                    Email Verified
                  </label>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                  resetUserForm();
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={editingUser ? updateUser : createUser}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                disabled={!userForm.email.trim() || (!editingUser && !userForm.password.trim())}
              >
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Test Results Modal */}
      {showTestResultsModal && selectedUserForResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Test Results</h2>
                <p className="text-sm text-gray-600">
                  {selectedUserForResults.full_name || selectedUserForResults.email}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowTestResultsModal(false);
                  setSelectedUserForResults(null);
                  setUserTestResults([]);
                }}
              >
                Close
              </Button>
            </div>

            {loadingTestResults ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-2 text-gray-600">Loading test results...</span>
              </div>
            ) : userTestResults.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No test results</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This user hasn't completed any tests yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {userTestResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Award className="h-5 w-5 text-orange-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">
                          {result.test_name || 'Unknown Test'}
                        </h3>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(result.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Primary Result */}
                      {result.primary_result && (
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <h4 className="font-medium text-orange-900 mb-1">Primary Result</h4>
                          <p className="text-orange-800">{result.primary_result}</p>
                        </div>
                      )}
                      
                      {/* Completion Percentage */}
                      {result.completion_percentage && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-1">Completion</h4>
                          <p className="text-green-800">{Math.round(result.completion_percentage)}%</p>
                        </div>
                      )}
                      
                      {/* Time Taken */}
                      {result.time_taken_seconds && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-1">Time Taken</h4>
                          <p className="text-blue-800">
                            {Math.round(result.time_taken_seconds / 60)} minutes
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Result Summary */}
                    {result.result_summary && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-1">Summary</h4>
                        <p className="text-gray-700 text-sm">{result.result_summary}</p>
                      </div>
                    )}
                    
                    {/* Analysis Data */}
                    {result.analysis && (
                      <div className="mt-3">
                        <h4 className="font-medium text-gray-900 mb-2">Analysis Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Traits */}
                          {result.analysis.traits && result.analysis.traits.length > 0 && (
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <h5 className="font-medium text-purple-900 mb-1">Traits</h5>
                              <div className="flex flex-wrap gap-1">
                                {result.analysis.traits.slice(0, 3).map((trait: string, idx: number) => (
                                  <span key={idx} className="inline-block bg-purple-200 text-purple-800 text-xs px-2 py-1 rounded">
                                    {trait}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Strengths */}
                          {result.analysis.strengths && result.analysis.strengths.length > 0 && (
                            <div className="bg-emerald-50 p-3 rounded-lg">
                              <h5 className="font-medium text-emerald-900 mb-1">Strengths</h5>
                              <div className="flex flex-wrap gap-1">
                                {result.analysis.strengths.slice(0, 3).map((strength: string, idx: number) => (
                                  <span key={idx} className="inline-block bg-emerald-200 text-emerald-800 text-xs px-2 py-1 rounded">
                                    {strength}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagementPage;
