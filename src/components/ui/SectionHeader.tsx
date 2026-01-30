import React from 'react';
import BrandLogo from '@/components/BrandLogo';

interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function SectionHeader({ title, subtitle, actions }: Props) {
  return (
    <header className="bg-gradient-to-b from-brand-50 to-white">
      <div className="container py-10">
        <div className="flex items-center gap-4">
          <BrandLogo size={40} className="rounded-md" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-gray-600 mt-1 max-w-2xl">{subtitle}</p>}
          </div>
          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
