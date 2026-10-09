'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (adminOnly && user.role !== 'admin') {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, adminOnly, router]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-ink flex flex-col items-center justify-center text-paper/60">
        <Loader2 className="w-8 h-8 animate-spin text-brand mb-3" />
        <p className="text-sm font-medium tracking-wide">Authenticating session...</p>
      </div>
    );
  }

  if (!user || (adminOnly && user.role !== 'admin')) {
    return (
      <div className="min-h-dvh bg-ink flex flex-col items-center justify-center text-paper/60">
        <Loader2 className="w-8 h-8 animate-spin text-brand mb-3" />
        <p className="text-sm font-medium tracking-wide">Redirecting...</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
