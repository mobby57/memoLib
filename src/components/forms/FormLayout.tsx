'use client';

import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface FormPageLayoutProps {
  children: React.ReactNode;
}

export function FormPageLayout({ children }: FormPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      {children}
    </div>
  );
}

interface FormCardProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

export function FormCard({ children, className = '', maxWidth = 'max-w-4xl' }: FormCardProps) {
  return (
    <div
      className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl ${maxWidth} w-full overflow-hidden border border-white/20 ${className}`}
    >
      {children}
    </div>
  );
}

interface FormHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function FormHeader({ icon, title, subtitle, children }: FormHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      {subtitle && <p className="text-blue-100">{subtitle}</p>}
      {children}
    </div>
  );
}

interface FormErrorProps {
  message: string;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return (
    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r flex items-center gap-3 text-red-700">
      <AlertCircle size={20} className="flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

interface FormSuccessPageProps {
  title: string;
  message: string;
  redirectMessage?: string;
}

export function FormSuccessPage({ title, message, redirectMessage }: FormSuccessPageProps) {
  return (
    <FormPageLayout>
      <FormCard maxWidth="max-w-md">
        <div className="p-8 text-center">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 mb-4">{message}</p>
          {redirectMessage && <div className="animate-pulse text-blue-600">{redirectMessage}</div>}
        </div>
      </FormCard>
    </FormPageLayout>
  );
}

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  return (
    <div className="mt-4 flex gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
        <div
          key={s}
          className={`h-2 flex-1 rounded-full transition-all ${
            s <= currentStep ? 'bg-white' : 'bg-blue-400/50'
          }`}
        />
      ))}
    </div>
  );
}

interface FormSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ icon, title, children, className = '' }: FormSectionProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}
