'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiBaseUrl } from '@/config/api';

interface AdminModalsProps {
  type: string;
  data?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminModals({ type, data, onClose, onSuccess }: AdminModalsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(data || {});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.target as any;
    setFormData({
      ...formData,
      [name]: inputType === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleAddUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth_service/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create user');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth_service/users/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update user');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleViewContact = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Name</label>
          <p className="mt-1 text-gray-900">{data.name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <p className="mt-1 text-gray-900">{data.email}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Subject</label>
          <p className="mt-1 text-gray-900">{data.subject}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Message</label>
          <p className="mt-1 text-gray-900 whitespace-pre-wrap">{data.message}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Status</label>
          <p className="mt-1 text-gray-900">{data.status}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Received</label>
          <p className="mt-1 text-gray-900">{new Date(data.created_at).toLocaleString()}</p>
        </div>
      </div>
    );
  };

  const handleViewQuestion = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Question</label>
          <p className="mt-1 text-gray-900">{data.question_text}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Type</label>
          <p className="mt-1 text-gray-900">{data.question_type}</p>
        </div>
        {data.options && (
          <div>
            <label className="text-sm font-medium text-gray-700">Options</label>
            <ul className="mt-2 space-y-1">
              {data.options.map((option: any, idx: number) => (
                <li key={idx} className="text-gray-900">
                  {idx + 1}. {option}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.correct_answer && (
          <div>
            <label className="text-sm font-medium text-gray-700">Correct Answer</label>
            <p className="mt-1 text-gray-900">{data.correct_answer}</p>
          </div>
        )}
        {data.explanation && (
          <div>
            <label className="text-sm font-medium text-gray-700">Explanation</label>
            <p className="mt-1 text-gray-900">{data.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'addUser':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                placeholder="user@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Username</label>
              <Input
                name="username"
                value={formData.username || ''}
                onChange={handleInputChange}
                placeholder="username"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <Input
                name="password"
                type="password"
                value={formData.password || ''}
                onChange={handleInputChange}
                placeholder="Enter password"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <select
                name="role"
                value={formData.role || 'user'}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active !== false}
                onChange={handleInputChange}
                className="rounded"
              />
              <label className="text-sm font-medium text-gray-700">Active</label>
            </div>
          </div>
        );

      case 'editUser':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-900">{data.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <select
                name="role"
                value={formData.role || 'user'}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active !== false}
                onChange={handleInputChange}
                className="rounded"
              />
              <label className="text-sm font-medium text-gray-700">Active</label>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">New Password (optional)</label>
              <Input
                name="password"
                type="password"
                value={formData.password || ''}
                onChange={handleInputChange}
                placeholder="Leave empty to keep current password"
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'viewContact':
        return handleViewContact();

      case 'viewQuestion':
        return handleViewQuestion();

      default:
        return <div>Unknown modal type</div>;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'addUser':
        return 'Add New User';
      case 'editUser':
        return 'Edit User';
      case 'viewContact':
        return 'View Contact Message';
      case 'viewQuestion':
        return 'View Question';
      default:
        return 'Modal';
    }
  };

  const getActionLabel = () => {
    switch (type) {
      case 'addUser':
        return 'Create User';
      case 'editUser':
        return 'Update User';
      case 'viewContact':
      case 'viewQuestion':
        return 'Close';
      default:
        return 'Save';
    }
  };

  const handleAction = async () => {
    switch (type) {
      case 'addUser':
        await handleAddUser();
        break;
      case 'editUser':
        await handleEditUser();
        break;
      case 'viewContact':
      case 'viewQuestion':
        onClose();
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{getTitle()}</CardTitle>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {renderContent()}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                getActionLabel()
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
