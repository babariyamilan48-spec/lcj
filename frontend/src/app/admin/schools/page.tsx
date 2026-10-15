'use client';

/**
 * Admin → Schools: manage partner schools that give free test access.
 * Create (auto-generated code) / edit / activate / deactivate / delete,
 * view + unlink linked students.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Copy, Check, Loader2, Pencil, Trash2, Power, Users as UsersIcon,
  School as SchoolIcon, AlertCircle, X, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getApiBaseUrl } from '@/config/api';
import { tokenStore } from '@/services/token';

interface School {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  contact_email: string | null;
  student_count: number;
  created_at: string | null;
  updated_at: string | null;
}

interface Student {
  id: string;
  email: string;
  username?: string | null;
  full_name?: string;
  created_at?: string | null;
}

const getAuthHeaders = () => {
  const token =
    tokenStore.getAccessToken() ||
    localStorage.getItem('at') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    '';
  return {
    'Content-Type': 'application/json',
    ...(token && token !== 'null' && token !== 'undefined' ? { Authorization: `Bearer ${token}` } : {})
  };
};

export default function SchoolsAdminPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [createdSchool, setCreatedSchool] = useState<School | null>(null); // post-create code reveal
  const [studentsSchool, setStudentsSchool] = useState<School | null>(null); // students drill-in
  const [deletingSchool, setDeletingSchool] = useState<School | null>(null);

  // Form state (create + edit)
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Students drill-in
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  // Delete
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [toggleBusyId, setToggleBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (error || success) {
      const t = setTimeout(() => { setError(null); setSuccess(null); }, 5000);
      return () => clearTimeout(t);
    }
  }, [error, success]);

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth_service/schools`, {
        cache: 'no-store',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const body = await response.json();
        setSchools(Array.isArray(body) ? body : body.data || []);
        setError(null);
      } else if (response.status === 401 || response.status === 403) {
        setError('Unauthorized — please login as admin');
      } else {
        setError('Failed to load schools');
      }
    } catch (e) {
      console.error('Failed to fetch schools:', e);
      setError('Failed to load schools');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);

  const copyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError('Copy failed — select the code manually');
    }
  };

  // ---------- Create ----------
  const openCreate = () => {
    setFormName(''); setFormEmail(''); setFormError(null);
    setCreatedSchool(null);
    setShowCreateModal(true);
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formSaving) return;
    setFormSaving(true); setFormError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth_service/schools`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: formName.trim(), contact_email: formEmail.trim() || null })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.detail || 'Failed to create school');
      setCreatedSchool(body.data || body);
      setSuccess('School created — share the code with its students');
      await fetchSchools();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create school');
    } finally {
      setFormSaving(false);
    }
  };

  // ---------- Edit ----------
  const openEdit = (school: School) => {
    setFormName(school.name);
    setFormEmail(school.contact_email || '');
    setFormCode(school.code);
    setFormActive(school.is_active);
    setFormError(null);
    setEditingSchool(school);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool || formSaving) return;
    const code = formCode.trim().toUpperCase();
    if (code && !/^[A-Z0-9-]{4,40}$/.test(code)) {
      setFormError('Code must be 4-40 characters: letters, digits, hyphens');
      return;
    }
    setFormSaving(true); setFormError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth_service/schools/${editingSchool.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formName.trim(),
          contact_email: formEmail.trim() || null,
          code: code || undefined,
          is_active: formActive
        })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.detail || 'Failed to update school');
      setSuccess('School updated');
      setEditingSchool(null);
      await fetchSchools();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update school');
    } finally {
      setFormSaving(false);
    }
  };

  // ---------- Activate / deactivate ----------
  const toggleActive = async (school: School) => {
    if (!school.is_active) {
      // turning OFF — confirm impact
      const ok = window.confirm(
        `"${school.name}" will be DEACTIVATED.\n\nAll ${school.student_count} linked student(s) will lose free access (paywall) until reactivated. Continue?`
      );
      if (!ok) return;
    }
    try {
      setToggleBusyId(school.id);
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth_service/schools/${school.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: !school.is_active })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.detail || 'Failed to update status');
      }
      setSuccess(school.is_active ? `Deactivated "${school.name}"` : `Activated "${school.name}"`);
      await fetchSchools();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setToggleBusyId(null);
    }
  };

  // ---------- Delete ----------
  const submitDelete = async (force: boolean) => {
    if (!deletingSchool || deleteBusy) return;
    try {
      setDeleteBusy(true); setDeleteError(null);
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/auth_service/schools/${deletingSchool.id}${force ? '?force=true' : ''}`,
        { method: 'DELETE', headers: getAuthHeaders() }
      );
      const body = await response.json().catch(() => ({}));
      if (response.status === 409) {
        setDeleteError(body?.detail || 'School has linked students.');
        setDeleteBusy(false);
        return;
      }
      if (!response.ok) throw new Error(body?.detail || 'Failed to delete school');
      setSuccess(`Deleted "${deletingSchool.name}"`);
      setDeletingSchool(null);
      setDeleteError(null);
      await fetchSchools();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete school');
    } finally {
      setDeleteBusy(false);
    }
  };

  // ---------- Students drill-in ----------
  const openStudents = async (school: School) => {
    setStudentsSchool(school);
    setStudents([]); setStudentsLoading(true);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/auth_service/users?per_page=100&school_id=${school.id}`,
        { headers: getAuthHeaders() }
      );
      const body = await response.json().catch(() => []);
      const list = Array.isArray(body) ? body : body?.data || [];
      setStudents(list);
    } catch {
      setError('Failed to load linked students');
    } finally {
      setStudentsLoading(false);
    }
  };

  const unlinkStudent = async (student: Student) => {
    if (!studentsSchool) return;
    const ok = window.confirm(`Unlink ${student.email} from "${studentsSchool.name}"? They will lose free access.`);
    if (!ok) return;
    try {
      setUnlinkingId(student.id);
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth_service/users/${student.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ school_id: null })
      });
      if (!response.ok) throw new Error('Failed to unlink student');
      setSuccess(`Unlinked ${student.email}`);
      setStudents(prev => prev.filter(s => s.id !== student.id));
      await fetchSchools();
    } catch (err: any) {
      setError(err.message || 'Failed to unlink student');
    } finally {
      setUnlinkingId(null);
    }
  };

  // ---------- Stats ----------
  const totalSchools = schools.length;
  const activeSchools = schools.filter(s => s.is_active).length;
  const totalStudents = schools.reduce((sum, s) => sum + (s.student_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Schools</h1>
          <p className="mt-1 text-sm text-gray-500">
            Schools whose students get free test access via access codes
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add School
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Schools', value: totalSchools, icon: SchoolIcon, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active', value: activeSchools, icon: Power, color: 'text-green-600 bg-green-50' },
          { label: 'Linked Students', value: totalStudents, icon: UsersIcon, color: 'text-orange-600 bg-orange-50' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs font-medium text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Schools</CardTitle>
            <button
              onClick={fetchSchools}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : schools.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 mb-4">
                <SchoolIcon className="w-7 h-7" />
              </div>
              <p className="text-gray-600 font-medium mb-1">No partner schools yet</p>
              <p className="text-sm text-gray-400 mb-5">Create your first school and share its access code with students.</p>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Add School
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">School</th>
                    <th className="px-4 py-3">Access Code</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Students</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schools.map((school) => (
                    <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-gray-900 text-sm">{school.name}</p>
                        {school.contact_email && (
                          <p className="text-xs text-gray-400">{school.contact_email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => copyCode(school.code, school.id)}
                          title="Click to copy"
                          className="inline-flex items-center gap-2 font-mono text-sm bg-gray-100 hover:bg-gray-200 border border-gray-200 px-2.5 py-1.5 rounded-lg text-gray-700 transition-all"
                        >
                          {school.code}
                          {copiedId === school.id ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge className={school.is_active
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'}>
                          {school.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => openStudents(school)}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <UsersIcon className="w-4 h-4" />
                          {school.student_count}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">
                        {school.created_at ? new Date(school.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => toggleActive(school)}
                            disabled={toggleBusyId === school.id}
                            title={school.is_active ? 'Deactivate' : 'Activate'}
                            className={`p-2 rounded-lg border transition-all disabled:opacity-50 ${
                              school.is_active
                                ? 'border-green-200 text-green-600 hover:bg-green-50'
                                : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            {toggleBusyId === school.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Power className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => openEdit(school)}
                            title="Edit"
                            className="p-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setDeletingSchool(school); setDeleteError(null); }}
                            title="Delete"
                            className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create modal (or post-create code reveal) ── */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)} title={createdSchool ? 'School created 🎉' : 'Add Partner School'}>
          {createdSchool ? (
            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 text-green-600 mb-4">
                <Check className="w-7 h-7" />
              </div>
              <p className="font-semibold text-gray-900 mb-1">{createdSchool.name}</p>
              <p className="text-sm text-gray-500 mb-5">Share this access code with its students:</p>
              <button
                onClick={() => copyCode(createdSchool.code, createdSchool.id)}
                className="w-full font-mono text-lg tracking-widest bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 px-4 py-4 rounded-xl text-gray-800 font-bold transition-all flex items-center justify-center gap-3"
              >
                {createdSchool.code}
                {copiedId === createdSchool.id
                  ? <Check className="w-5 h-5 text-green-600" />
                  : <Copy className="w-5 h-5 text-gray-400" />}
              </button>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowCreateModal(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  Done
                </button>
                <button
                  onClick={openCreate}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all"
                >
                  Add another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submitCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">School name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Greenfield High School"
                  required
                  maxLength={120}
                  autoFocus
                  className="w-full rounded-lg border-2 border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact email (optional)</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="coordinator@school.edu"
                  maxLength={120}
                  className="w-full rounded-lg border-2 border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">The access code is generated automatically.</p>
              </div>
              {formError && <FormError message={formError} />}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formName.trim() || formSaving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                >
                  {formSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create School
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* ── Edit modal ── */}
      {editingSchool && (
        <Modal onClose={() => setEditingSchool(null)} title={`Edit — ${editingSchool.name}`}>
          <form onSubmit={submitEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">School name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                maxLength={120}
                className="w-full rounded-lg border-2 border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Access code</label>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                placeholder="GREENFIELD-7K2B"
                maxLength={40}
                className="w-full font-mono tracking-wider rounded-lg border-2 border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Letters, digits, hyphens (4-40 chars). Students use this to redeem.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact email</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="coordinator@school.edu"
                maxLength={120}
                className="w-full rounded-lg border-2 border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <label className="flex items-start gap-3 p-3.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span>
                <span className="block text-sm font-semibold text-gray-800">Active — accepting redemptions</span>
                {!formActive && editingSchool.student_count > 0 && (
                  <span className="block text-xs text-red-500 mt-0.5">
                    All {editingSchool.student_count} linked student(s) will lose free access.
                  </span>
                )}
                {formActive && (
                  <span className="block text-xs text-gray-400 mt-0.5">Students can redeem this school's code.</span>
                )}
              </span>
            </label>
            {formError && <FormError message={formError} />}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingSchool(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
              >
                {formSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Students drill-in ── */}
      {studentsSchool && (
        <Modal onClose={() => setStudentsSchool(null)} title={`Students — ${studentsSchool.name}`}>
          {studentsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">
              No students linked yet. Share the code <span className="font-mono font-bold">{studentsSchool.code}</span> with students.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{student.full_name || student.username || '—'}</p>
                    <p className="text-xs text-gray-500 truncate">{student.email}</p>
                  </div>
                  <button
                    onClick={() => unlinkStudent(student)}
                    disabled={unlinkingId === student.id}
                    className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                  >
                    {unlinkingId === student.id ? '...' : 'Unlink'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* ── Delete confirm ── */}
      {deletingSchool && (
        <Modal onClose={() => { setDeletingSchool(null); setDeleteError(null); }} title={`Delete "${deletingSchool.name}"?`}>
          <div className="space-y-4">
            {deletingSchool.student_count > 0 ? (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <strong>{deletingSchool.student_count} student(s)</strong> are linked to this school.
                  Consider <strong>deactivating</strong> instead — that revokes access and can be reversed.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">This school has no linked students. This cannot be undone.</p>
            )}
            {deleteError && <FormError message={deleteError} />}
            <div className="flex flex-col gap-2.5">
              {deletingSchool.student_count > 0 && (
                <button
                  onClick={() => submitDelete(true)}
                  disabled={deleteBusy}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                >
                  {deleteBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                  Force delete &amp; unlink {deletingSchool.student_count} student(s)
                </button>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setDeletingSchool(null); setDeleteError(null); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => submitDelete(false)}
                  disabled={deleteBusy}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                >
                  {deleteBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Small shared pieces ── */

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}
