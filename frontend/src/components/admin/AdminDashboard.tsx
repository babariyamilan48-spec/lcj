'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  CreditCard,
  HelpCircle,
  Mail,
  BarChart3,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import AdminUsers from './AdminUsers';
import AdminPayments from './AdminPayments';
import AdminQuestions from './AdminQuestions';
import AdminContacts from './AdminContacts';
import { getApiBaseUrl } from '@/config/api';
import { tokenStore } from '@/services/token';

// Dynamic import for AdminModals to avoid circular dependency
const AdminModals = dynamic(() => import('./AdminModals'), { ssr: false });

interface ModalState {
  type: string | null;
  data?: any;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    const token = tokenStore.getAccessToken() || localStorage.getItem('at') || localStorage.getItem('access_token') || '';
    if (!token) return;
    try {
      const ts = Date.now();
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth_service/analytics/users?ts=${ts}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data || data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type: string, data?: any) => {
    setModal({ type, data });
  };

  const handleCloseModal = () => {
    setModal({ type: null });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage users, payments, questions, and contacts</p>
            </div>
            {stats && !loading && (
              <div className="hidden lg:flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.total_users || 0}</p>
                  <p className="text-sm text-gray-600">Total Users</p>
                </div>
                <div className="border-l border-gray-200" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.active_users || 0}</p>
                  <p className="text-sm text-gray-600">Active Users</p>
                </div>
                <div className="border-l border-gray-200" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.verified_users || 0}</p>
                  <p className="text-sm text-gray-600">Verified</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Questions</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Contacts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <AdminUsers onOpenModal={handleOpenModal} />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <AdminPayments onOpenModal={handleOpenModal} />
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <AdminQuestions onOpenModal={handleOpenModal} />
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            <AdminContacts onOpenModal={handleOpenModal} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {modal.type && (
        <AdminModals
          type={modal.type}
          data={modal.data}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            // Refresh data based on modal type
            if (modal.type.includes('User')) {
              fetchDashboardStats();
            }
          }}
        />
      )}
    </div>
  );
}
