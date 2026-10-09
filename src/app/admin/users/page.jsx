'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import Modal from '@/components/Modal';
import LoadError from '@/components/LoadError';
import { UserPlus, Trash2, Shield, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

const inputClass =
  'w-full pl-9 pr-3 py-2 rounded-lg bg-ink border border-paper/20 text-sm text-paper placeholder-paper/50 focus:outline-none focus:ring-2 focus:ring-brand';
const labelClass = 'block text-sm font-medium text-paper/80 mb-1.5';

function AdminUsersContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showTempPassword, setShowTempPassword] = useState(false);

  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });

  const { user: currentAdmin } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const closeModal = () => {
    setIsAddModalOpen(false);
    setShowTempPassword(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/api/admin/users', formData);
      setUsers((prev) => [res.data.user, ...prev]);
      toast.success(res.data.message || 'User created');
      closeModal();
      setFormData({ name: '', email: '', password: '', role: 'user' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create the user. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveUser = async (user) => {
    const ok = await confirm({
      title: `Remove ${user.email}?`,
      message: 'They lose access to every shared project, and the projects they own are deleted. This cannot be undone.',
      confirmLabel: 'Remove user'
    });
    if (!ok) return;

    setDeletingId(user._id);
    try {
      const res = await api.delete(`/api/admin/users/${user._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      toast.success(res.data.message || 'User removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove the user. Try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-dvh bg-ink text-paper pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-paper/10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-paper">Users</h1>
            <p className="text-sm text-paper/60 mt-1">
              Create accounts with a temporary password. People can change it under Account.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-ink text-sm font-semibold transition-colors self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            Add user
          </button>
        </div>

        {error ? (
          <LoadError message="Could not load users." onRetry={fetchUsers} />
        ) : loading ? (
          <div className="mt-6 space-y-2" aria-busy="true" aria-label="Loading users">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-panel/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-paper/10 bg-panel/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-paper/80">
                <thead className="bg-ink text-xs font-semibold text-paper/60 uppercase tracking-wider border-b border-paper/10">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">User</th>
                    <th scope="col" className="px-6 py-3.5">Email</th>
                    <th scope="col" className="px-6 py-3.5">Role</th>
                    <th scope="col" className="px-6 py-3.5">Status</th>
                    <th scope="col" className="px-6 py-3.5">Joined</th>
                    <th scope="col" className="px-6 py-3.5 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper/10">
                  {users.map((u) => {
                    const isSelf = u._id === currentAdmin?.id;

                    return (
                      <tr key={u._id} className="hover:bg-panel/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-paper/10 flex items-center justify-center text-paper/80 font-semibold text-xs shrink-0">
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-paper truncate max-w-[12rem]">{u.name}</p>
                              {isSelf && <span className="text-xs text-brand">You</span>}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-mono text-xs text-paper/80">{u.email}</td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                              u.role === 'admin'
                                ? 'bg-brand/10 text-brand border border-brand/20'
                                : 'bg-brand/10 text-brand border border-brand/20'
                            }`}
                          >
                            {u.role === 'admin' && <Shield className="w-3 h-3" />}
                            {u.role}
                          </span>
                        </td>

                        <td className={`px-6 py-4 text-xs font-medium ${u.isActive ? 'text-brand' : 'text-paper/60'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </td>

                        <td className="px-6 py-4 text-xs text-paper/60 tabular-nums">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveUser(u)}
                            disabled={isSelf || deletingId === u._id}
                            aria-label={isSelf ? 'You cannot remove your own account' : `Remove ${u.email}`}
                            title={isSelf ? 'You cannot remove your own account' : 'Remove user'}
                            className="p-1.5 text-paper/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <Modal title="Add user" onClose={closeModal}>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label htmlFor="new-name" className={labelClass}>Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-paper/60" />
                <input
                  id="new-name"
                  type="text"
                  required
                  autoComplete="off"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="new-email" className={labelClass}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-paper/60" />
                <input
                  id="new-email"
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="new-password" className={labelClass}>Temporary password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-paper/60 pointer-events-none" />
                <input
                  id="new-password"
                  type={showTempPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  aria-describedby="new-password-hint"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowTempPassword(!showTempPassword)}
                  className="absolute right-3 p-1 text-paper/60 hover:text-paper transition-colors"
                  aria-label={showTempPassword ? 'Hide password' : 'Show password'}
                  title={showTempPassword ? 'Hide password' : 'Show password'}
                >
                  {showTempPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p id="new-password-hint" className="text-xs text-paper/60 mt-1.5">At least 6 characters.</p>
            </div>

            <div>
              <label htmlFor="new-role" className={labelClass}>Role</label>
              <select
                id="new-role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-ink border border-paper/20 text-sm text-paper focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="user">User: own and shared projects</option>
                <option value="admin">Admin: all projects, users and audit logs</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-paper/10">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg bg-paper/10 hover:bg-paper/20 text-sm font-medium text-paper transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark text-sm font-semibold text-ink transition-colors disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create user'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <AppLayout>
        <AdminUsersContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
