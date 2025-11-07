import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getApiBaseUrl } from '../config/api';
import { 
  Users, 
  ClipboardList, 
  BarChart3, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Mail,
  Eye,
  Filter
} from 'lucide-react';

// Core Interfaces
interface Test {
  id: number;
  name: string;
  description: string;
  category: string;
  duration_minutes: number;
  total_questions: number;
  passing_score: number;
  is_active: boolean;
  created_at: string;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
  updated_at: string;
}

interface TestAnalytics {
  total_tests: number;
  active_tests: number;
  total_questions: number;
  avg_questions_per_test: number;
  category_distribution: Array<{
    category: string;
    count: number;
  }>;
}

interface UserAnalytics {
  total_users: number;
  active_users: number;
  verified_users: number;
  admin_users: number;
  recent_registrations: number;
}

interface Contact {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  inquiry_type: 'general' | 'technical' | 'billing' | 'partnership' | 'feedback';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

interface ContactStats {
  total: number;
  new: number;
  in_progress: number;
  resolved: number;
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tests');
  const [tests, setTests] = useState<Test[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [testAnalytics, setTestAnalytics] = useState<TestAnalytics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [contactStats, setContactStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Test CRUD state
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [testForm, setTestForm] = useState({
    name: '',
    description: '',
    category: 'personal_development',
    duration_minutes: 30,
    total_questions: 10,
    passing_score: 70,
    is_active: true
  });
  
  // Filtering state
  const [testFilters, setTestFilters] = useState({
    search: '',
    category: '',
    is_active: ''
  });
  

  // Contact filtering and modal state
  const [contactFilters, setContactFilters] = useState({
    search: '',
    status: '',
    inquiry_type: ''
  });
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTests();
    fetchContacts();
    fetchTestAnalytics();
    fetchUserAnalytics();
    fetchContactStats();
  }, []);
  
  useEffect(() => {
    fetchTests();
  }, [testFilters]);
  
  useEffect(() => {
    fetchContacts();
  }, [contactFilters, currentPage]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      let url = `${getApiBaseUrl()}/api/v1/question_service/tests`;
      const params = new URLSearchParams();
      
      if (testFilters.category) params.append('category', testFilters.category);
      if (testFilters.is_active !== '') params.append('is_active', testFilters.is_active);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        // Ensure data is an array
        if (Array.isArray(data)) {
          let filteredData = data;
          
          // Apply search filter on frontend
          if (testFilters.search) {
            filteredData = data.filter((test: Test) => 
              test.name.toLowerCase().includes(testFilters.search.toLowerCase()) ||
              test.description.toLowerCase().includes(testFilters.search.toLowerCase())
            );
          }
          
          setTests(filteredData);
        } else {
          console.error('API returned non-array data:', data);
          setTests([]);
          setError('Invalid data format received from server');
        }
      } else {
        console.error('Failed to fetch tests, status:', response.status);
        setTests([]);
        setError('Failed to load tests');
      }
    } catch (error) {
      console.error('Failed to fetch tests:', error);
      setTests([]);
      setError('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };
  
  const createTest = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/question_service/tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testForm),
      });
      
      if (response.ok) {
        setSuccess('Test created successfully');
        setShowTestModal(false);
        resetTestForm();
        fetchTests();
      } else {
        setError('Failed to create test');
      }
    } catch (error) {
      console.error('Failed to create test:', error);
      setError('Failed to create test');
    }
  };
  
  const updateTest = async () => {
    if (!editingTest) return;
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/question_service/tests/${editingTest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testForm),
      });
      
      if (response.ok) {
        setSuccess('Test updated successfully');
        setShowTestModal(false);
        setEditingTest(null);
        resetTestForm();
        fetchTests();
      } else {
        setError('Failed to update test');
      }
    } catch (error) {
      console.error('Failed to update test:', error);
      setError('Failed to update test');
    }
  };
  
  const deleteTest = async (testId: number) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/question_service/tests/${testId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSuccess('Test deleted successfully');
        fetchTests();
      } else {
        setError('Failed to delete test');
      }
    } catch (error) {
      console.error('Failed to delete test:', error);
      setError('Failed to delete test');
    }
  };
  
  const resetTestForm = () => {
    setTestForm({
      name: '',
      description: '',
      category: 'personal_development',
      duration_minutes: 30,
      total_questions: 10,
      passing_score: 70,
      is_active: true
    });
  };
  
  const openEditModal = (test: Test) => {
    setEditingTest(test);
    setTestForm({
      name: test.name,
      description: test.description,
      category: test.category,
      duration_minutes: test.duration_minutes,
      total_questions: test.total_questions,
      passing_score: test.passing_score,
      is_active: test.is_active
    });
    setShowTestModal(true);
  };
  
  const openCreateModal = () => {
    setEditingTest(null);
    resetTestForm();
    setShowTestModal(true);
  };


  const fetchTestAnalytics = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/results_service/analytics/tests`);
      if (response.ok) {
        const data = await response.json();
        setTestAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch test analytics:', error);
    }
  };

  const fetchUserAnalytics = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/results_service/analytics/users`);
      if (response.ok) {
        const data = await response.json();
        setUserAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch user analytics:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);
      let url = `${getApiBaseUrl()}/api/v1/contact_service/contacts/?page=${currentPage}&per_page=10`;
      
      if (contactFilters.status) {
        url += `&status=${contactFilters.status}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        let filteredContacts = data.contacts;
        
        // Apply search filter on frontend
        if (contactFilters.search) {
          filteredContacts = data.contacts.filter((contact: Contact) => 
            contact.name.toLowerCase().includes(contactFilters.search.toLowerCase()) ||
            contact.email.toLowerCase().includes(contactFilters.search.toLowerCase()) ||
            contact.subject.toLowerCase().includes(contactFilters.search.toLowerCase())
          );
        }
        
        // Apply inquiry type filter on frontend
        if (contactFilters.inquiry_type) {
          filteredContacts = filteredContacts.filter((contact: Contact) => 
            contact.inquiry_type === contactFilters.inquiry_type
          );
        }
        
        setContacts(filteredContacts);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchContactStats = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/contact_service/contacts/stats/overview`);
      if (response.ok) {
        const data = await response.json();
        setContactStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch contact stats:', error);
    }
  };

  const updateContactStatus = async (contactId: number, newStatus: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/contact_service/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        setSuccess('Contact status updated successfully');
        fetchContacts();
        fetchContactStats();
      } else {
        setError('Failed to update contact status');
      }
    } catch (error) {
      console.error('Failed to update contact status:', error);
      setError('Failed to update contact status');
    }
  };

  const deleteContact = async (contactId: number) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/contact_service/contacts/${contactId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSuccess('Contact deleted successfully');
        fetchContacts();
        fetchContactStats();
        if (selectedContact && selectedContact.id === contactId) {
          setShowContactModal(false);
          setSelectedContact(null);
        }
      } else {
        setError('Failed to delete contact');
      }
    } catch (error) {
      console.error('Failed to delete contact:', error);
      setError('Failed to delete contact');
    }
  };

  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  useEffect(() => {
    if (error || success) {
      clearMessages();
    }
  }, [error, success]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage tests, questions, and users</p>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tests" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Tests & Questions
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2"
              onClick={() => window.location.href = '/admin/users'}
            >
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tests Management</CardTitle>
                <Button onClick={openCreateModal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Test
                </Button>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search tests..."
                      value={testFilters.search}
                      onChange={(e) => setTestFilters({...testFilters, search: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={testFilters.category}
                    onChange={(e) => setTestFilters({...testFilters, category: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    <option value="personal_development">Personal Development</option>
                    <option value="career">Career</option>
                    <option value="skills">Skills</option>
                    <option value="personality">Personality</option>
                  </select>
                  <select
                    value={testFilters.is_active}
                    onChange={(e) => setTestFilters({...testFilters, is_active: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                  <Button 
                    variant="outline" 
                    onClick={() => setTestFilters({search: '', category: '', is_active: ''})}
                  >
                    Clear Filters
                  </Button>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!Array.isArray(tests) || tests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No tests found matching your criteria
                      </div>
                    ) : (
                      tests.map((test) => (
                        <div key={test.id} className="border rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">{test.name}</h3>
                            <p className="text-gray-600 text-sm">{test.description}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant={test.is_active ? "default" : "secondary"}>
                                {test.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <Badge variant="outline">{test.category}</Badge>
                              <Badge variant="outline">{test.duration_minutes} min</Badge>
                              <Badge variant="outline">{test.total_questions} questions</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditModal(test)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => deleteTest(test.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="contacts" className="space-y-6">
            {/* Contact Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Mail className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                      <p className="text-2xl font-bold text-gray-900">{contactStats?.total || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">New</p>
                      <p className="text-2xl font-bold text-gray-900">{contactStats?.new || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Loader2 className="w-8 h-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">In Progress</p>
                      <p className="text-2xl font-bold text-gray-900">{contactStats?.in_progress || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Resolved</p>
                      <p className="text-2xl font-bold text-gray-900">{contactStats?.resolved || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Contact Management</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search contacts..."
                      value={contactFilters.search}
                      onChange={(e) => setContactFilters({...contactFilters, search: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                  
                  <select
                    value={contactFilters.status}
                    onChange={(e) => setContactFilters({...contactFilters, status: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  
                  <select
                    value={contactFilters.inquiry_type}
                    onChange={(e) => setContactFilters({...contactFilters, inquiry_type: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="general">General</option>
                    <option value="technical">Technical</option>
                    <option value="billing">Billing</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                  </select>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setContactFilters({search: '', status: '', inquiry_type: ''})}
                  >
                    Clear Filters
                  </Button>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contacts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No contacts found matching your criteria
                      </div>
                    ) : (
                      contacts.map((contact) => (
                        <div key={contact.id} className="border rounded-lg p-4 flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div>
                                <h3 className="font-semibold">{contact.name}</h3>
                                <p className="text-gray-600 text-sm">{contact.email}</p>
                              </div>
                            </div>
                            <p className="text-gray-800 mt-2 font-medium">{contact.subject}</p>
                            <div className="flex gap-2 mt-2">
                              <select
                                value={contact.status}
                                onChange={(e) => updateContactStatus(contact.id, e.target.value)}
                                className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${
                                  contact.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                  contact.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                  contact.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}
                              >
                                <option value="new">New</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                              </select>
                              <Badge variant="outline">{contact.inquiry_type}</Badge>
                              <Badge variant="outline">{new Date(contact.created_at).toLocaleDateString()}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSelectedContact(contact);
                                setShowContactModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => deleteContact(contact.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  {testAnalytics ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Tests</p>
                          <p className="text-2xl font-bold">{testAnalytics.total_tests}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Active Tests</p>
                          <p className="text-2xl font-bold">{testAnalytics.active_tests}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Questions</p>
                          <p className="text-2xl font-bold">{testAnalytics.total_questions}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Avg Questions/Test</p>
                          <p className="text-2xl font-bold">{testAnalytics.avg_questions_per_test}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p>Loading analytics...</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  {userAnalytics ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Users</p>
                          <p className="text-2xl font-bold">{userAnalytics.total_users}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Active Users</p>
                          <p className="text-2xl font-bold">{userAnalytics.active_users}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Verified Users</p>
                          <p className="text-2xl font-bold">{userAnalytics.verified_users}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Admin Users</p>
                          <p className="text-2xl font-bold">{userAnalytics.admin_users}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p>Loading analytics...</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Test Modal */}
        {showTestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">
                {editingTest ? 'Edit Test' : 'Create New Test'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Test Name</label>
                  <Input
                    value={testForm.name}
                    onChange={(e) => setTestForm({...testForm, name: e.target.value})}
                    placeholder="Enter test name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={testForm.description}
                    onChange={(e) => setTestForm({...testForm, description: e.target.value})}
                    placeholder="Enter test description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={testForm.category}
                    onChange={(e) => setTestForm({...testForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="personal_development">Personal Development</option>
                    <option value="career">Career</option>
                    <option value="skills">Skills</option>
                    <option value="personality">Personality</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                    <Input
                      type="number"
                      value={testForm.duration_minutes}
                      onChange={(e) => setTestForm({...testForm, duration_minutes: parseInt(e.target.value) || 0})}
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Total Questions</label>
                    <Input
                      type="number"
                      value={testForm.total_questions}
                      onChange={(e) => setTestForm({...testForm, total_questions: parseInt(e.target.value) || 0})}
                      min="1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Passing Score (%)</label>
                  <Input
                    type="number"
                    value={testForm.passing_score}
                    onChange={(e) => setTestForm({...testForm, passing_score: parseInt(e.target.value) || 0})}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={testForm.is_active}
                    onChange={(e) => setTestForm({...testForm, is_active: e.target.checked})}
                    className="rounded"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">Active</label>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={() => {
                    setShowTestModal(false);
                    setEditingTest(null);
                    resetTestForm();
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingTest ? updateTest : createTest}
                  className="flex-1"
                  disabled={!testForm.name.trim()}
                >
                  {editingTest ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Contact Detail Modal */}
        {showContactModal && selectedContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Contact Details</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowContactModal(false);
                    setSelectedContact(null);
                  }}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContact.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContact.email}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContact.subject}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Inquiry Type</label>
                  <Badge variant="outline" className="mt-1">
                    {selectedContact.inquiry_type}
                  </Badge>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedContact.message}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={selectedContact.status}
                    onChange={(e) => {
                      updateContactStatus(selectedContact.id, e.target.value);
                      setSelectedContact({...selectedContact, status: e.target.value as any});
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedContact.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Updated</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedContact.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowContactModal(false);
                    setSelectedContact(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteContact(selectedContact.id)}
                >
                  Delete Contact
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
