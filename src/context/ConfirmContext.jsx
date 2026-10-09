'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import Modal from '@/components/Modal';

const ConfirmContext = createContext(null);

// confirm({ title, message, confirmLabel }) -> Promise<boolean>. Replaces window.confirm.
export const ConfirmProvider = ({ children }) => {
  const [opts, setOpts] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setOpts(options);
      }),
    []
  );

  const settle = (result) => {
    resolver.current?.(result);
    setOpts(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && (
        <Modal title={opts.title} onClose={() => settle(false)}>
          <p className="text-sm text-paper/80">{opts.message}</p>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => settle(false)}
              className="px-4 py-2 rounded-lg bg-paper/10 hover:bg-paper/20 text-sm font-medium text-paper transition-colors"
            >
              {opts.cancelLabel || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => settle(true)}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-sm font-semibold text-paper transition-colors"
            >
              {opts.confirmLabel || 'Confirm'}
            </button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
};
