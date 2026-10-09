'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

// Native <dialog>: focus trap, inert background, Escape and focus return come from the browser.
// Mount it only while open (`{open && <Modal ...>}`).
const Modal = ({ title, onClose, children, maxWidth = 'max-w-md' }) => {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`w-full ${maxWidth} m-auto p-4 bg-transparent text-paper backdrop:bg-ink/80 backdrop:backdrop-blur-sm`}
    >
      <div className="rounded-xl border border-paper/10 bg-panel shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-paper/10">
          <h2 id={titleId} className="text-base font-semibold text-paper">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-md text-paper/60 hover:text-paper hover:bg-paper/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
};

export default Modal;
