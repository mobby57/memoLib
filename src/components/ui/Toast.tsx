'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { CheckCircle, XCircle, Info, AlertCircle, X } from 'lucide-react';

export interface Toast {
  id: string;
  variant: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  showToast: (message: string, variant: Toast['variant'], title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
  }, []);

  const showToast = useCallback((message: string, variant: Toast['variant'], title?: string) => {
    addToast({ message, variant, title });
  }, [addToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const contextValue = useMemo(
    () => ({ toasts, addToast, showToast, removeToast }),
    [toasts, addToast, showToast, removeToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }: Readonly<{ toasts: Toast[]; removeToast: (id: string) => void }>) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: Readonly<{ toast: Toast; onClose: () => void }>) {
  const variants = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
      textColor: 'text-green-900 dark:text-green-300',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      icon: XCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      textColor: 'text-red-900 dark:text-red-300',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
      textColor: 'text-blue-900 dark:text-blue-300',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      icon: AlertCircle,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      textColor: 'text-yellow-900 dark:text-yellow-300',
    },
  };

  const config = variants[toast.variant];
  const Icon = config.icon;

  return (
    <div
      className={`${config.bg} border rounded-lg p-4 shadow-lg animate-slide-in-right`}
      role="alert"
    >
      <div className="flex items-start">
        <Icon className={`h-5 w-5 ${config.iconColor} mt-0.5`} />
        <div className="ml-3 flex-1">
          {toast.title && (
            <p className={`text-sm font-medium ${config.textColor}`}>
              {toast.title}
            </p>
          )}
          <p className={`text-sm ${toast.title ? 'mt-1' : ''} ${config.textColor}`}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`ml-4 inline-flex ${config.iconColor} hover:opacity-70 focus:outline-none`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
