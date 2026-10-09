'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-dvh bg-ink flex flex-col items-center justify-center text-paper/60">
      <Loader2 className="w-8 h-8 animate-spin text-brand mb-3" />
      <p className="text-sm font-medium">Redirecting to Env Master...</p>
    </div>
  );
}
