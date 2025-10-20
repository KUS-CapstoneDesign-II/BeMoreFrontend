import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  durationMs?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (message: string, variant?: ToastVariant, durationMs?: number) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, variant: ToastVariant = 'info', durationMs = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const toast: ToastItem = { id, message, variant, durationMs };
    setToasts((prev) => [toast, ...prev]);
    if (durationMs && durationMs > 0) {
      window.setTimeout(() => removeToast(id), durationMs);
    }
    return id;
  }, [removeToast]);

  const value = useMemo(() => ({ toasts, addToast, removeToast }), [toasts, addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast viewport */}
      <div className="fixed top-3 right-3 z-50 space-y-2 w-[92%] sm:w-96">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={
            `px-4 py-3 rounded-lg shadow-soft text-sm border ` +
            (t.variant === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800' :
             t.variant === 'error' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800' :
             t.variant === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800' :
             'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700')
          }>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 break-words">{t.message}</div>
              <button aria-label="닫기" className="text-xs opacity-70 hover:opacity-100" onClick={() => removeToast(t.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
