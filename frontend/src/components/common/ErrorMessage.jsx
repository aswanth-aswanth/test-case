import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

function ErrorMessage({ message, onRetry, className = '' }) {
  if (!message) return null;
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg ${className}`}
      style={{
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.2)',
      }}
      role="alert"
    >
      <AlertCircle size={16} color="var(--color-danger)" className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: '#f87171' }}>
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-medium flex items-center gap-1"
            style={{ color: 'var(--color-accent-light)' }}
          >
            <RefreshCw size={11} />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;
