'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { UnsavedProvider } from '@/context/UnsavedContext';

export function Providers({ children }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <UnsavedProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </UnsavedProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
