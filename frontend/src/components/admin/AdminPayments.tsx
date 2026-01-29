'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  TrendingUp,
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getApiBaseUrl } from '@/config/api';

interface PaymentRecord {
  id: string;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  contact?: string | null;
  order_id: string;
  payment_id?: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed';
  created_at: string;
  updated_at: string;
}

interface PaymentAnalytics {
  total_revenue: number;
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  daily_revenue: Array<{ date: string; amount: number; count: number }>;
  monthly_revenue: Array<{ month: string; amount: number; count: number }>;
  yearly_revenue: Array<{ year: string; amount: number; count: number }>;
}

interface AdminPaymentsProps {
  onOpenModal?: (type: string, data?: any) => void;
}

export default function AdminPayments({ onOpenModal }: AdminPaymentsProps) {
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'failed' | 'pending'>('all');
  const [page, setPage] = useState(1);
  const perPage = 5; // show 5 recent payments

  const fetchPaymentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('at') || localStorage.getItem('access_token');
      if (!token) {
        setError('No authentication token found. Please log in.');
        setLoading(false);
        return;
      }

      // Fetch analytics
      const analyticsResponse = await fetch(`${getApiBaseUrl()}/api/v1/auth_service/payment/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!analyticsResponse.ok) {
        const errorData = await analyticsResponse.json().catch(() => ({}));
        console.error('Analytics error:', analyticsResponse.status, errorData);
        if (analyticsResponse.status === 401) {
          setError('Unauthorized - Please ensure you are logged in as an admin');
        } else if (analyticsResponse.status === 403) {
          setError('Forbidden - Admin access required');
        } else {
          setError(errorData.detail || 'Failed to fetch analytics');
        }
      } else {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.data || analyticsData);
      }

      // Fetch payment history
      const historyResponse = await fetch(
        `${getApiBaseUrl()}/api/v1/auth_service/payment/history-admin?page=${page}&per_page=${perPage}${
          statusFilter !== 'all' ? `&status_filter=${statusFilter}` : ''
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!historyResponse.ok) {
        const errorData = await historyResponse.json().catch(() => ({}));
        console.error('History error:', historyResponse.status, errorData);
        if (historyResponse.status === 401) {
          setError('Unauthorized - Please ensure you are logged in as an admin');
        } else if (historyResponse.status === 403) {
          setError('Forbidden - Admin access required');
        } else {
          setError(errorData.detail || 'Failed to fetch payment history');
        }
      } else {
        const historyData = await historyResponse.json();
        const dataNode = historyData?.data || historyData;
        const historyArray =
          (Array.isArray(dataNode?.data) && dataNode.data) ||
          (Array.isArray(dataNode?.payments) && dataNode.payments) ||
          (Array.isArray(dataNode) && dataNode) ||
          [];
        setPayments(historyArray);
        if (dataNode?.total_pages) setTotalPages(dataNode.total_pages);
        if (dataNode?.total) setTotalCount(dataNode.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, [page, statusFilter]);

  const chartData = analytics
    ? (analytics[`${timeRange}_revenue` as keyof PaymentAnalytics] as Array<any>)
    : [];

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Payment Analytics</h2>
        <p className="text-gray-600 mt-1">Monitor all payment transactions and revenue</p>
      </div>

      {/* Stats Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Revenue"
            value={`₹${(analytics.total_revenue / 100).toFixed(2)}`}
            icon={DollarSign}
            color="bg-green-600"
          />
          <StatCard
            label="Total Payments"
            value={analytics.total_payments}
            icon={CreditCard}
            color="bg-blue-600"
          />
          <StatCard
            label="Successful"
            value={analytics.successful_payments}
            icon={CheckCircle}
            color="bg-emerald-600"
          />
          <StatCard
            label="Failed"
            value={analytics.failed_payments}
            icon={AlertCircle}
            color="bg-red-600"
          />
          <StatCard
            label="Pending"
            value={analytics.pending_payments}
            icon={Clock}
            color="bg-yellow-600"
          />
        </div>
      )}

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Revenue Trend</CardTitle>
            <div className="flex gap-2">
              {(['daily', 'monthly', 'yearly'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData && chartData.length > 0 ? (
            <div className="space-y-4">
              {chartData.slice(0, 10).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium text-gray-600">
                    {item.date || item.month || item.year}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (item.amount / Math.max(...chartData.map((d: any) => d.amount))) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="w-32 text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ₹{(item.amount / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600">{item.count} transactions</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">No data available</div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('all');
                  setPage(1);
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-md">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Contact</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Order ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Payment ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(payments) ? payments : []).map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className="font-semibold">{payment.user_name || '—'}</span>
                          <span className="text-xs text-gray-600">{payment.user_email || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {payment.contact || '—'}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-gray-900">
                        {payment.order_id.substring(0, 12)}...
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-gray-600">
                        {payment.payment_id ? payment.payment_id.substring(0, 12) + '...' : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                        ₹{(payment.amount / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            payment.status === 'paid'
                              ? 'default'
                              : payment.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={
                            payment.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 text-sm text-gray-700">
                <div>
                  Page {page} of {totalPages} ({totalCount} records)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
