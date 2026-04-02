'use client';

import { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  icon?: ReactNode;
  className?: string;
}

const variantConfig = {
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
    titleColor: 'text-blue-900 dark:text-blue-300',
    textColor: 'text-blue-800 dark:text-blue-200',
  },
  success: {
    container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-600 dark:text-green-400',
    titleColor: 'text-green-900 dark:text-green-300',
    textColor: 'text-green-800 dark:text-green-200',
  },
  warning: {
    container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    icon: AlertCircle,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    titleColor: 'text-yellow-900 dark:text-yellow-300',
    textColor: 'text-yellow-800 dark:text-yellow-200',
  },
  error: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    icon: XCircle,
    iconColor: 'text-red-600 dark:text-red-400',
    titleColor: 'text-red-900 dark:text-red-300',
    textColor: 'text-red-800 dark:text-red-200',
  },
};

export function Alert({ variant = 'info', title, children, onClose, icon, className = '' }: AlertProps) {
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  return (
    <div className={`border rounded-lg p-4 ${config.container} ${className}`} role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          {icon || <IconComponent className={`h-5 w-5 ${config.iconColor}`} />}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${config.titleColor} mb-1`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${config.textColor}`}>
            {children}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 ${config.iconColor} hover:bg-white/50 dark:hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
