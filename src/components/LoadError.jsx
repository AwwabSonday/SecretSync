import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

const LoadError = ({ message, onRetry }) => (
  <div role="alert" className="mt-8 rounded-xl border border-rose-500/20 bg-rose-500/5 p-10 text-center">
    <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto mb-3" />
    <p className="text-sm text-paper">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-paper/10 hover:bg-paper/20 text-xs font-semibold text-paper border border-paper/20 transition-colors"
    >
      <RotateCw className="w-3.5 h-3.5" />
      Try again
    </button>
  </div>
);

export default LoadError;
