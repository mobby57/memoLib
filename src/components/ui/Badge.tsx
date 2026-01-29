import React from 'react';
import clsx from 'clsx';

export default function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={clsx('inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium border border-brand-100', className)}>
            {children}
        </span>
    );
}
