import { createContext, useCallback, useContext, useMemo, useState } from 'react';
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
      {/* Toast viewport - Enhanced styling */}
      <div className="fixed top-4 right-4 z-50 space-y-3 w-[calc(100%-2rem)] sm:w-96 pointer-events-none">
        {toasts.map((t) => {
          const variantStyles =
            t.variant === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700 shadow-emerald-100 dark:shadow-emerald-900/20'
              : t.variant === 'error'
                ? 'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700 shadow-red-100 dark:shadow-red-900/20'
                : t.variant === 'warning'
                  ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700 shadow-amber-100 dark:shadow-amber-900/20'
                  : 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700 shadow-blue-100 dark:shadow-blue-900/20';

          return (
            <div
              key={t.id}
              role="status"
              aria-live={t.variant === 'error' ? 'assertive' : 'polite'}
              className={`
                px-4 py-3 rounded-xl shadow-soft border backdrop-blur-sm
                animate-in slide-in-from-top-2 fade-in duration-300
                pointer-events-auto cursor-default
                ${variantStyles}
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {t.variant === 'success'
                      ? '✅'
                      : t.variant === 'error'
                        ? '❌'
                        : t.variant === 'warning'
                          ? '⚠️'
                          : 'ℹ️'}
                  </span>
                  <div className="flex-1 break-words text-sm font-medium">{t.message}</div>
                </div>
                <button
                  aria-label="닫기"
                  className="text-lg opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={() => removeToast(t.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
