'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ message, type = 'info', duration = type === 'error' ? 8000 : 3500 }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg) => addToast({ message: msg, type: 'success' }),
    error: (msg) => addToast({ message: msg, type: 'error' }),
    info: (msg) => addToast({ message: msg, type: 'info' })
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div aria-live="polite" role="status" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2.5rem)] pointer-events-none">
        {toasts.map((t) => {
          const bgColors = {
            success: 'bg-panel/90 border-brand/50 text-brand',
            error: 'bg-rose-950/90 border-rose-500/50 text-rose-200',
            info: 'bg-panel/90 border-paper/20 text-paper'
          };
          const Icons = {
            success: <CheckCircle2 className="w-5 h-5 text-brand shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
            info: <Info className="w-5 h-5 text-paper/80 shrink-0" />
          };

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-lg border shadow-xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${bgColors[t.type] || bgColors.info}`}
            >
              <div className="flex items-center gap-3">
                {Icons[t.type]}
                <p className="text-sm font-medium">{t.message}</p>
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => removeToast(t.id)}
                className="opacity-70 hover:opacity-100 p-1 text-paper/60 hover:text-paper transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
