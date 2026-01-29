import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

export default function Card({ title, subtitle, footer, className, children, ...props }: CardProps) {
  return (
    <div className={clsx('bg-white rounded-xl shadow-sm border border-gray-100', className)} {...props}>
      {(title || subtitle) && (
        <div className="p-6 pb-0">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className={clsx('p-6', (title || subtitle) && 'pt-4')}>{children}</div>
      {footer && <div className="px-6 pb-6 pt-0">{footer}</div>}
    </div>
  );
}
