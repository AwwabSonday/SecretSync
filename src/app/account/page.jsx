'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { User, Mail, Shield, KeyRound, ShieldCheck } from 'lucide-react';

function AccountContent() {
  const { user } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-ink text-paper py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-paper">
            Account Settings
          </h1>
          <p className="text-sm text-paper/60 mt-1">
            Manage your personal profile and account credentials.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-panel/70 border border-paper/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand font-bold text-2xl uppercase shadow-inner">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-paper flex items-center gap-2">
                {user?.name}
              </h2>
              <p className="text-sm text-paper/60">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-paper/10 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-ink/50 border border-paper/5">
              <User className="w-4 h-4 text-paper/40" />
              <div>
                <span className="block text-xs text-paper/50">Full Name</span>
                <span className="font-medium text-paper">{user?.name || '—'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-ink/50 border border-paper/5">
              <Mail className="w-4 h-4 text-paper/40" />
              <div className="min-w-0">
                <span className="block text-xs text-paper/50">Email Address</span>
                <span className="font-medium text-paper truncate block">{user?.email || '—'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-ink/50 border border-paper/5">
              <Shield className="w-4 h-4 text-brand" />
              <div>
                <span className="block text-xs text-paper/50">Account Role</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-brand/10 text-brand border border-brand/20 mt-0.5">
                  {user?.role || 'user'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-ink/50 border border-paper/5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="block text-xs text-paper/50">Account Status</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-panel/70 border border-paper/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold text-paper flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-brand" />
                Password & Security
              </h3>
              <p className="text-sm text-paper/60 mt-1 max-w-md">
                Ensure your account is protected with a secure password of at least 6 characters.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-sm font-semibold text-ink transition-all shadow-md hover:shadow-brand/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              <KeyRound className="w-4 h-4" />
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <AccountContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
