'use client';

import React from 'react';
import { useToastStore } from '@/hooks/useToastStore';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useToastStore();

  if (!toast) return null;

  const colorMap = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      icon: (
        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: (
        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: (
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const styles = colorMap[toast.type];

  return (
    <div
      className={`fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-xl border px-5 py-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${styles.bg} ${styles.border} max-w-sm w-full animate-[slideIn_0.3s_ease-out]`}
      style={{ animation: 'slideIn 0.3s ease-out forwards' }}
      role="alert"
      aria-live="assertive"
    >
      {styles.icon}
      <p className={`text-sm font-medium leading-snug ${styles.text} flex-1`}>
        {toast.message}
      </p>
      <button
        onClick={hideToast}
        aria-label="Close notification"
        className={`ml-2 rounded-md p-1 transition hover:bg-black/5 ${styles.text}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
