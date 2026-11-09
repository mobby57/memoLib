'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  icon?: LucideIcon;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  icon: Icon,
  error,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {Icon && <Icon className="inline mr-2 text-gray-400" size={16} />}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
}

export function FormInput({ icon: Icon, className = '', ...props }: FormInputProps) {
  if (Icon) {
    return (
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          className={`w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${className}`}
          {...props}
        />
      </div>
    );
  }
  return (
    <input
      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${className}`}
      {...props}
    />
  );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function FormSelect({
  options,
  placeholder = 'Sélectionnez...',
  className = '',
  ...props
}: FormSelectProps) {
  return (
    <select
      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${className}`}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function FormTextarea({ className = '', ...props }: FormTextareaProps) {
  return (
    <textarea
      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${className}`}
      {...props}
    />
  );
}
