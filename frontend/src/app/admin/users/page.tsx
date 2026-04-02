'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Loader2, Filter, Mail, Shield, UserCheck, Users, Eye, Download, Phone, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getApiBaseUrl } from '@/config/api';
import { tokenStore } from '@/services/token';

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
  phone_number?: string | null;
  payment_completed?: boolean;
  counseling_completed?: boolean;
  counseling_completed_at?: string | null;
}

interface LatestTestResult {
  test_id: string;
  test_name?: string;
  test_name_gujarati?: string;
  primary_result?: string;
  completed_at?: string;
  completion_date?: string;
  traits?: string[];
  strengths?: string[];
}

interface LatestSummaryResponse {
  user_id: string;
  total_unique_tests: number;
  total_tests_completed: number;
  latest_test_results: LatestTestResult[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [latestSummary, setLatestSummary] = useState<LatestSummaryResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [downloadingReport, setDownloadingReport] = useState(false);

  const getAuthHeaders = () => {
    const raw =
      tokenStore.getAccessToken() ||
      localStorage.getItem('at') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    const token = !raw || raw === 'null' || raw === 'undefined' ? '' : raw;
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const openUserDetailsModal = async (user: User) => {
    setSelectedUser(user);
    setLatestSummary(null);
    setDetailsError(null);
    setShowDetailsModal(true);

    try {
      setDetailsLoading(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/question_service/test-results/latest-summary/${user.id}`,
        {
          cache: 'no-store',
          headers: {
            ...getAuthHeaders(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      );

      if (response.ok) {
        const data = (await response.json()) as LatestSummaryResponse;
        setLatestSummary(data);
      } else {
        const errData = await response.json().catch(() => ({} as any));
        setDetailsError(errData.detail || 'Failed to load user test summary');
      }
    } catch (e) {
      setDetailsError('Failed to load user test summary');
    } finally {
      setDetailsLoading(false);
    }
  };

  const [updatingCounseling, setUpdatingCounseling] = useState(false);

  const downloadComprehensiveReportPdf = async () => {
    if (!selectedUser) return;

    // Open comprehensive report in new tab (same as user profile)
    const reportUrl = `/comprehensive-report/${selectedUser.id}`;
    window.open(reportUrl, '_blank');
  };

  const toggleCounselingStatus = async () => {
    if (!selectedUser) return;

    try {
      setUpdatingCounseling(true);
      const newStatus = !selectedUser.counseling_completed;

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/auth_service/users/${selectedUser.id}/counseling`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ counseling_completed: newStatus }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Counseling marked as ${newStatus ? 'completed' : 'pending'} successfully!`);

        // Update the selected user
        setSelectedUser({
          ...selectedUser,
          counseling_completed: newStatus,
          counseling_completed_at: data.data?.counseling_completed_at || null
        });

        // Refresh users list
        fetchUsers();
      } else if (response.status === 401) {
        setError('Unauthorized - Please login as admin');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to update counseling status');
      }
    } catch (error) {
      console.error('Failed to update counseling status:', error);
      setError('Failed to update counseling status');
    } finally {
      setUpdatingCounseling(false);
    }
  };

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

  const [filters, setFilters] = useState({
    search: '',
    role: '',
    is_active: '',
    is_verified: '',
    payment_completed: '',
    has_completed_test: '',
    counseling_completed: '',
    start_date: '',
    end_date: ''
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0
  });

  // Separate state for overall stats (fetched once from analytics)
  const [overallStats, setOverallStats] = useState({
    total: 0,
    active: 0,
    verified: 0,
    admins: 0
  });

  // Single useEffect to handle all fetching
  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.per_page, filters]);

  // Separate useEffect to fetch overall stats once on mount
  useEffect(() => {
    fetchOverallStats();
  }, []);

  const fetchOverallStats = async () => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/auth_service/analytics/users`,
        {
          cache: 'no-store',
          headers: {
            ...getAuthHeaders(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setOverallStats({
            total: data.data.total_users || 0,
            active: data.data.active_users || 0,
            verified: data.data.verified_users || 0,
            admins: data.data.admin_users || 0
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch overall stats:', error);
    }
  };

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
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/auth_service/users?page=${pagination.page}&per_page=${pagination.per_page}${
          filters.search ? `&search=${encodeURIComponent(filters.search)}` : ''
        }${filters.role ? `&role=${filters.role}` : ''}${
          filters.is_active ? `&is_active=${filters.is_active === 'true'}` : ''
        }${filters.is_verified ? `&is_verified=${filters.is_verified === 'true'}` : ''}${
          filters.payment_completed ? `&payment_completed=${filters.payment_completed === 'true'}` : ''
        }${filters.has_completed_test ? `&has_completed_test=${filters.has_completed_test === 'true'}` : ''}${
          filters.counseling_completed ? `&counseling_completed=${filters.counseling_completed === 'true'}` : ''
        }`,
        {
          cache: 'no-store',
          headers: {
            ...getAuthHeaders(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        // Handle both array response and paginated response
        if (Array.isArray(data)) {
          setUsers(data);
          setPagination(prev => ({ ...prev, total: data.length, total_pages: 1 }));
        } else if (data.data && Array.isArray(data.data)) {
          setUsers(data.data);
          setPagination(prev => ({
            ...prev,
            total: data.total || data.data.length,
            total_pages: data.total_pages || Math.ceil((data.total || data.data.length) / prev.per_page)
          }));
        } else {
          setUsers([]);
        }
      } else if (response.status === 401) {
        setError('Unauthorized - Please login as admin');
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
      if (!userForm.email || !userForm.password) {
        setError('Email and password are required');
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth_service/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: userForm.email,
          password: userForm.password,
          username: userForm.username || undefined,
          role: userForm.role,
          is_active: userForm.is_active,
          is_verified: userForm.is_verified
        }),
      });

      if (response.ok) {
        setSuccess('User created successfully!');
        setShowUserModal(false);
        resetUserForm();
        fetchUsers();
      } else if (response.status === 401) {
        setError('Unauthorized - Please login as admin');
      } else if (response.status === 400) {
        const errorData = await response.json();
        setError(errorData.detail || 'Invalid input');
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
      const rawToken =
        tokenStore.getAccessToken() ||
        localStorage.getItem('at') ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('token') ||
        '';
      const token = !rawToken || rawToken === 'null' || rawToken === 'undefined' ? '' : rawToken;
      if (!token) {
        setError('Unauthorized - missing token. Please log in again.');
        return;
      }

      const updateData: any = {
        role: userForm.role,
        is_active: userForm.is_active
      };

      if (userForm.password && userForm.password.trim()) {
        updateData.password = userForm.password;
      }

      const headers = {
        ...getAuthHeaders(),
      } as Record<string, string>;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth_service/users/${editingUser.id}`, {
        method: 'PUT', // use PUT to avoid PATCH preflight/CORS issues
        headers,
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setSuccess('User updated successfully!');
        setShowUserModal(false);
        setEditingUser(null);
        resetUserForm();
        fetchUsers();
      } else if (response.status === 401) {
        setError('Unauthorized - Please login as admin');
      } else if (response.status === 404) {
        setError('User not found');
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
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth_service/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setSuccess('User deleted successfully');
        fetchUsers();
      } else if (response.status === 401) {
        setError('Unauthorized - Please login as admin');
      } else if (response.status === 404) {
        setError('User not found');
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
      password: '',
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset to page 1 when any filter changes
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      is_active: '',
      is_verified: '',
      payment_completed: '',
      has_completed_test: '',
      counseling_completed: '',
      start_date: '',
      end_date: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Export filtered users to CSV
  const exportToCSV = () => {
    if (filteredUsers.length === 0) {
      setError('No data to export');
      return;
    }

    // CSV Headers
    const headers = [
      'ID',
      'Full Name',
      'Email',
      'Username',
      'Phone Number',
      'Role',
      'Status',
      'Verified',
      'Payment Completed',
      'Counseling Completed',
      'Counseling Date',
      'Providers',
      'Created At',
      'Updated At'
    ];

    // Build CSV rows
    const rows = filteredUsers.map(user => [
      user.id,
      user.full_name,
      user.email,
      user.username || '',
      user.phone_number || '',
      user.role,
      user.is_active ? 'Active' : 'Inactive',
      user.is_verified ? 'Yes' : 'No',
      user.payment_completed ? 'Yes' : 'No',
      user.counseling_completed ? 'Yes' : 'No',
      user.counseling_completed_at ? new Date(user.counseling_completed_at).toLocaleString() : '',
      user.providers?.join(', ') || '',
      user.created_at ? new Date(user.created_at).toLocaleString() : '',
      user.updated_at ? new Date(user.updated_at).toLocaleString() : ''
    ]);

    // Create applied filters info
    const appliedFilters = [];
    if (filters.search) appliedFilters.push(`Search: "${filters.search}"`);
    if (filters.role) appliedFilters.push(`Role: ${filters.role}`);
    if (filters.is_active) appliedFilters.push(`Status: ${filters.is_active === 'true' ? 'Active' : 'Inactive'}`);
    if (filters.is_verified) appliedFilters.push(`Verified: ${filters.is_verified === 'true' ? 'Yes' : 'No'}`);
    if (filters.payment_completed) appliedFilters.push(`Payment: ${filters.payment_completed === 'true' ? 'Paid' : 'Unpaid'}`);
    if (filters.has_completed_test) appliedFilters.push(`Tests: ${filters.has_completed_test === 'true' ? 'Completed' : 'No Tests'}`);
    if (filters.counseling_completed) appliedFilters.push(`Counseling: ${filters.counseling_completed === 'true' ? 'Completed' : 'Pending'}`);
    if (filters.start_date) appliedFilters.push(`Start Date: ${filters.start_date}`);
    if (filters.end_date) appliedFilters.push(`End Date: ${filters.end_date}`);

    // Combine all rows
    const csvContent = [
      ['User Export Report'],
      [`Generated: ${new Date().toLocaleString()}`],
      [`Total Records: ${filteredUsers.length}`],
      appliedFilters.length > 0 ? [`Applied Filters: ${appliedFilters.join(' | ')}`] : ['No Filters Applied'],
      [], // Empty row
      headers,
      ...rows
    ]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccess(`Exported ${filteredUsers.length} users to CSV`);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !filters.search ||
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (user.username && user.username.toLowerCase().includes(filters.search.toLowerCase()));

    const matchesRole = !filters.role || user.role === filters.role;
    const matchesActive = !filters.is_active || user.is_active.toString() === filters.is_active;
    const matchesVerified = !filters.is_verified || user.is_verified.toString() === filters.is_verified;
    const matchesCounseling = !filters.counseling_completed || user.counseling_completed?.toString() === filters.counseling_completed;

    // Date filtering
    let matchesDate = true;
    if (filters.start_date || filters.end_date) {
      const userDate = user.created_at ? new Date(user.created_at) : null;
      if (userDate) {
        if (filters.start_date) {
          const startDate = new Date(filters.start_date);
          startDate.setHours(0, 0, 0, 0);
          if (userDate < startDate) matchesDate = false;
        }
        if (filters.end_date) {
          const endDate = new Date(filters.end_date);
          endDate.setHours(23, 59, 59, 999);
          if (userDate > endDate) matchesDate = false;
        }
      }
    }

    return matchesSearch && matchesRole && matchesActive && matchesVerified && matchesCounseling && matchesDate;
  });

  const stats = overallStats;

  return (
    <div className="space-y-6">
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
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>

            <select
              value={filters.is_active}
              onChange={(e) => handleFilterChange('is_active', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <select
              value={filters.is_verified}
              onChange={(e) => handleFilterChange('is_verified', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>

            <select
              value={filters.payment_completed}
              onChange={(e) => handleFilterChange('payment_completed', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Payments</option>
              <option value="true">Paid</option>
              <option value="false">Unpaid</option>
            </select>

            <select
              value={filters.has_completed_test}
              onChange={(e) => handleFilterChange('has_completed_test', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Test Status</option>
              <option value="true">Completed Tests</option>
              <option value="false">No Tests</option>
            </select>

            <select
              value={filters.counseling_completed}
              onChange={(e) => handleFilterChange('counseling_completed', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Counseling Status</option>
              <option value="true">✅ Counseling Completed</option>
              <option value="false">⏳ Counseling Pending</option>
            </select>

            {/* Date Range Filters */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Start Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">End Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>

            <Button onClick={clearFilters} variant="outline" className="md:col-span-full xl:col-span-1">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
              disabled={filteredUsers.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>
          </div>
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
                        {user.payment_completed ? (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-600 bg-emerald-50">
                            Paid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 border-gray-300">
                            Unpaid
                          </Badge>
                        )}
                        {user.counseling_completed ? (
                          <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                            ✅ Counseling Completed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50">
                            ⏳ Counseling Pending
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Mobile:</strong> {user.phone_number || '—'}</p>
                        {user.username && <p><strong>Username:</strong> {user.username}</p>}
                        <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                        <p><strong>Providers:</strong> {user.providers.join(', ')}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openUserDetailsModal(user)}
                        className="hover:bg-gray-50 text-gray-700 border-gray-200"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditUserModal(user)}
                        className="hover:bg-blue-50 text-blue-600 border-blue-200"
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

              {/* Pagination Controls */}
              {filteredUsers.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {filteredUsers.length} of {users.length} users
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 px-2">
                      Page {pagination.page}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                    </Button>
                    <select
                      value={pagination.per_page}
                      onChange={(e) => setPagination(prev => ({ ...prev, per_page: parseInt(e.target.value), page: 1 }))}
                      className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editingUser ? 'Edit User' : 'Create New User'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  placeholder="user@example.com"
                  disabled={!!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <Input
                  value={userForm.username}
                  onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                  placeholder="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser && '(leave blank to keep current)'}
                </label>
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value as 'admin' | 'user'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={userForm.is_active}
                  onChange={(e) => setUserForm({...userForm, is_active: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_verified"
                  checked={userForm.is_verified}
                  onChange={(e) => setUserForm({...userForm, is_verified: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="is_verified" className="text-sm font-medium text-gray-700">
                  Verified
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setShowUserModal(false);
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
                >
                  {editingUser ? 'Update' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>User Details</span>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedUser(null);
                    setLatestSummary(null);
                    setDetailsError(null);
                  }}
                >
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {detailsError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {detailsError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>Name:</strong> {selectedUser.full_name}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Mobile:</strong> {selectedUser.phone_number || '—'}</p>
                  <p><strong>Role:</strong> {selectedUser.role}</p>
                  <p><strong>Providers:</strong> {selectedUser.providers.join(', ')}</p>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>Status:</strong> {selectedUser.is_active ? 'Active' : 'Inactive'}</p>
                  <p><strong>Verified:</strong> {selectedUser.is_verified ? 'Yes' : 'No'}</p>
                  <p><strong>Payment:</strong> {selectedUser.payment_completed ? 'Paid' : 'Unpaid'}</p>
                  <p><strong>Counseling:</strong> {selectedUser.counseling_completed ? '✅ Completed' : '⏳ Pending'}</p>
                  {selectedUser.counseling_completed_at && (
                    <p><strong>Counseling Date:</strong> {new Date(selectedUser.counseling_completed_at).toLocaleString()}</p>
                  )}
                  <p><strong>Created:</strong> {new Date(selectedUser.created_at).toLocaleString()}</p>
                  <p><strong>Updated:</strong> {new Date(selectedUser.updated_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={downloadComprehensiveReportPdf}
                  disabled={downloadingReport}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {downloadingReport ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Comprehensive Report (PDF)
                    </>
                  )}
                </Button>

                {/* Counseling Status Toggle Button */}
                <Button
                  onClick={toggleCounselingStatus}
                  disabled={updatingCounseling}
                  className={selectedUser.counseling_completed
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                  }
                >
                  {updatingCounseling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : selectedUser.counseling_completed ? (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Mark Counseling Pending
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Mark Counseling Done
                    </>
                  )}
                </Button>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Completed Tests</h3>
                  {detailsLoading ? (
                    <span className="text-sm text-gray-500">Loading...</span>
                  ) : (
                    <span className="text-sm text-gray-700">
                      Total: <strong>{latestSummary?.total_unique_tests ?? 0}</strong>
                    </span>
                  )}
                </div>

                {detailsLoading ? (
                  <div className="flex justify-center items-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (latestSummary?.latest_test_results?.length || 0) === 0 ? (
                  <div className="text-sm text-gray-500">No completed tests found.</div>
                ) : (
                  <div className="space-y-2">
                    {latestSummary!.latest_test_results.map((tr, idx) => (
                      <div key={`${tr.test_id}-${idx}`} className="flex items-start justify-between gap-4 border-b last:border-b-0 pb-2 last:pb-0">
                        <div>
                          <div className="font-medium text-gray-900">
                            {tr.test_name || tr.test_id}
                          </div>
                          <div className="text-xs text-gray-600">
                            {tr.test_name_gujarati || ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-900">
                            {tr.primary_result || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {tr.completed_at || tr.completion_date
                              ? new Date((tr.completed_at || tr.completion_date) as string).toLocaleString()
                              : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
