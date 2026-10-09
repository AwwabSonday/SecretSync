'use client';

import React, { useState } from 'react';
import api from '@/api/axios';
import { useToast } from '@/context/ToastContext';
import Modal from './Modal';
import { Lock, Eye, EyeOff, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';

/**
 * ChangePasswordModal
 * Allows authenticated users to change their password inside a focused, accessible modal dialog.
 * Can be controlled via `isOpen` prop or rendered conditionally `{isOpen && <ChangePasswordModal onClose={...} />}`.
 */
export default function ChangePasswordModal({ isOpen = true, onClose, onSuccess }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  if (isOpen === false) {
    return null;
  }

  const handleClose = () => {
    if (submitting) return;
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setError('');
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put('/api/auth/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });

      toast.success(res.data?.message || 'Password changed successfully!');
      onSuccess?.();
      handleClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password. Please check your current password.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const hasMinLength = form.newPassword.length >= 6;
  const passwordsMatch = form.confirmPassword && form.newPassword === form.confirmPassword;

  return (
    <Modal title="Change Password" onClose={handleClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-paper/60">
          Ensure your account stays secure by using a strong password of at least 6 characters.
        </p>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm animate-in fade-in duration-200"
          >
            {error}
          </div>
        )}

        {/* Current Password */}
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-xs font-medium text-paper/80 mb-1.5"
          >
            Current Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-paper/40">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="currentPassword"
              name="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="Enter current password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              className="w-full pl-9 pr-10 py-2 rounded-lg bg-ink border border-paper/20 text-sm text-paper placeholder-paper/40 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-paper/40 hover:text-paper transition-colors"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label
            htmlFor="newPassword"
            className="block text-xs font-medium text-paper/80 mb-1.5"
          >
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-paper/40">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              id="newPassword"
              name="newPassword"
              type={showNew ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              className="w-full pl-9 pr-10 py-2 rounded-lg bg-ink border border-paper/20 text-sm text-paper placeholder-paper/40 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              aria-label={showNew ? 'Hide new password' : 'Show new password'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-paper/40 hover:text-paper transition-colors"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.newPassword && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-400' : 'text-paper/40'}`}
              />
              <span className={hasMinLength ? 'text-emerald-400' : 'text-paper/50'}>
                At least 6 characters
              </span>
            </div>
          )}
        </div>

        {/* Confirm New Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-medium text-paper/80 mb-1.5"
          >
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-paper/40">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Re-enter new password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full pl-9 pr-10 py-2 rounded-lg bg-ink border border-paper/20 text-sm text-paper placeholder-paper/40 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-paper/40 hover:text-paper transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.confirmPassword && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-emerald-400' : 'text-paper/40'}`}
              />
              <span className={passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}>
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-paper/10">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-paper/70 hover:text-paper hover:bg-paper/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !form.currentPassword || !hasMinLength || !passwordsMatch}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark text-sm font-semibold text-ink disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
